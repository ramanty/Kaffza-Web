import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CheckoutDto } from './dto/checkout.dto';
import {
  PaymentMethod,
  calculateShippingCost,
  getEnabledPaymentMethods,
  normalizePaymentSettings,
} from '../stores/store-settings.util';
import { IntegrationsService } from '../integrations/integrations.service';

const THAWANI_GATEWAY_FEE_RATE = 0.02;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly notifications: NotificationsService,
    private readonly integrations: IntegrationsService,
    private readonly auditService: AuditService
  ) {}

  async checkout(user: any, storeId: bigint, dto: CheckoutDto) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role !== 'customer' && user.role !== 'admin')
      throw new ForbiddenException('فقط العميل');

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { plan: true },
    });
    if (!store || !store.isActive) throw new NotFoundException('المتجر غير موجود');

    const cartData = await this.cart.getCart(user, storeId);
    const items = cartData.data.items as any[];
    if (!items.length) throw new BadRequestException('السلة فارغة');

    const subtotal = Number(cartData.data.subtotal);
    const weightKg = Number(cartData.data.weightKg || 0);
    const shippingCost = this.resolveShippingCost(store.shippingSettings, subtotal, weightKg, {
      state: dto.shippingAddress?.state,
      city: dto.shippingAddress?.city,
    });
    const totalAmount = round3(subtotal + shippingCost);

    const paymentMethod = (dto.paymentMethod || 'card') as PaymentMethod;
    this.assertPaymentRules(store.paymentSettings, paymentMethod, {
      totalAmount,
      weightKg,
    });

    // Revenue split: Thawani takes 2% (gateway fee), plan commission is direct
    const commissionRate = Number(store.plan?.commissionRate ?? 0.05);
    const thawaniFee =
      paymentMethod === 'card' ? round3(totalAmount * THAWANI_GATEWAY_FEE_RATE) : 0;
    const commissionAmount = round3(totalAmount * commissionRate);
    const merchantAmount = round3(totalAmount - thawaniFee - commissionAmount);

    const orderNumber = await this.generateOrderNumber();
    const hasExistingCustomerOrder =
      (await this.prisma.order.count({ where: { storeId, customerId: BigInt(user.sub) } })) > 0;

    const paymentGateway = this.paymentGatewayFromMethod(paymentMethod);

    const created = await this.prisma.$transaction(async (tx) => {
      const stockErrors: string[] = [];

      for (const i of items) {
        const productId = BigInt(i.productId);
        const updated = await tx.product.updateMany({
          where: { id: productId, storeId, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });

        if (updated.count === 0) {
          const product = await tx.product.findFirst({
            where: { id: productId, storeId },
            select: { nameAr: true, nameEn: true },
          });
          stockErrors.push(product?.nameAr || product?.nameEn || 'منتج');
        }
      }

      if (stockErrors.length > 0) {
        throw new BadRequestException(`المنتج ${stockErrors[0]} غير متوفر بالكمية المطلوبة`);
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          storeId,
          customerId: BigInt(user.sub),
          status: 'pending',
          subtotal,
          shippingCost,
          totalAmount,
          commissionAmount,
          merchantAmount,
          shippingAddress: dto.shippingAddress as any,
          billingAddress: (dto.billingAddress as any) ?? null,
          customerNotes: dto.customerNotes,
          customerConfirmed: false,
        },
      });

      await tx.orderItem.createMany({
        data: items.map((i) => ({
          orderId: order.id,
          productId: BigInt(i.productId),
          variantId: i.variantId ? BigInt(i.variantId) : null,
          productName: i.product.nameAr || i.product.nameEn,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: round3(i.lineTotal),
        })),
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency: 'OMR',
          status: 'pending',
          gateway: paymentGateway,
          escrowStatus: 'held',
        },
      });

      return order;
    });

    await this.cart.clearCart(user.sub, storeId.toString());

    // notify merchant new order
    await this.integrations
      .emitEvent(storeId, 'order.created', {
        orderId: created.id.toString(),
        orderNumber,
        status: created.status,
        totalAmount,
        paymentMethod,
        customerId: user.sub,
      })
      .catch(() => undefined);

    if (!hasExistingCustomerOrder) {
      await this.integrations
        .emitEvent(storeId, 'customer.created', {
          customerId: user.sub,
          email: user.email || null,
          role: user.role || 'customer',
          firstOrderId: created.id.toString(),
        })
        .catch(() => undefined);
    }

    await this.notifications.notifyUser(store.ownerId, {
      titleAr: 'طلب جديد',
      titleEn: 'New Order',
      bodyAr: `طلب جديد رقم ${orderNumber}`,
      bodyEn: `New order ${orderNumber}`,
      type: 'order',
      data: { orderId: created.id.toString(), storeId: storeId.toString(), paymentMethod },
    });

    const messageByMethod: Record<PaymentMethod, string> = {
      card: 'تم إنشاء الطلب. انتقل للدفع',
      cod: 'تم إنشاء الطلب بنجاح والدفع عند الاستلام',
      wallet: 'تم إنشاء الطلب بنجاح مع اختيار الدفع بالمحفظة',
      bnpl: 'تم إنشاء الطلب بنجاح مع اختيار اشتر الآن وادفع لاحقاً',
    };

    return {
      success: true,
      message: messageByMethod[paymentMethod],
      data: { orderId: created.id.toString(), orderNumber, paymentMethod },
    };
  }

  /**
   * C-03: Valid order status transitions enforced as a state machine.
   * Prevents merchants from skipping states (e.g. pending → delivered).
   */
  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
    refunded: [],
  };

  async updateStatus(user: any, storeId: bigint, orderId: bigint, status: string) {
    await this.assertStoreOwner(user, storeId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    if (order.customerConfirmed)
      throw new BadRequestException('لا يمكن تعديل طلب تم تأكيد استلامه');

    // C-03: Validate state machine transition
    const allowed = OrdersService.VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `لا يمكن تغيير حالة الطلب من "${order.status}" إلى "${status}". الانتقالات المسموحة: ${(allowed || []).join(', ') || 'لا يوجد'}`
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });

    await this.integrations
      .emitEvent(storeId, 'order.updated', {
        orderId: orderId.toString(),
        orderNumber: order.orderNumber,
        previousStatus: order.status,
        status: updated.status,
      })
      .catch(() => undefined);

    // notify customer
    await this.notifications.notifyUser(order.customerId, {
      titleAr: 'تحديث حالة الطلب',
      titleEn: 'Order Status Update',
      bodyAr: `تم تحديث حالة طلبك إلى: ${status}`,
      bodyEn: `Order #${order.orderNumber} status changed to ${status}`,
      type: 'order_update',
      data: { orderId: orderId.toString(), status },
    });

    await this.auditService.log({
      userId: BigInt(user.sub),
      action: 'ORDER_STATUS_CHANGED',
      entity: 'Order',
      entityId: orderId,
      details: { oldStatus: order.status, newStatus: status },
    });

    return {
      success: true,
      message: 'تم تحديث حالة الطلب',
      data: { id: updated.id.toString(), status: updated.status },
    };
  }

  async confirmReceipt(user: any, orderId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { include: { wallet: true } }, payment: true },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    if (user.role !== 'admin' && order.customerId !== BigInt(user.sub))
      throw new ForbiddenException('ليس لديك صلاحية');

    if (order.status !== 'shipped') throw new BadRequestException('يمكن التأكيد فقط بعد الشحن');
    if (!order.payment) throw new BadRequestException('لا يوجد سجل دفع');
    if (order.payment.status !== 'paid') throw new BadRequestException('لا يمكن التأكيد قبل الدفع');
    if (order.payment.escrowStatus !== 'held')
      throw new BadRequestException('حالة الضمان غير صحيحة');

    const wallet = order.store.wallet;
    if (!wallet) throw new BadRequestException('محفظة المتجر غير موجودة');

    const amount = Number(order.merchantAmount);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { customerConfirmed: true, confirmedAt: new Date(), status: 'delivered' },
      });
      await tx.payment.update({
        where: { orderId },
        data: { escrowStatus: 'released', releasedAt: new Date() },
      });

      // C-02: Verify sufficient pending balance before decrementing
      const result = await tx.wallet.updateMany({
        where: { id: wallet.id, pendingBalance: { gte: amount } },
        data: { pendingBalance: { decrement: amount }, availableBalance: { increment: amount } },
      });
      if (result.count === 0) {
        throw new BadRequestException('الرصيد المعلق غير كافٍ');
      }

      const updatedWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });
      if (!updatedWallet) {
        throw new NotFoundException('المحفظة غير موجودة');
      }

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'escrow_release',
          description: `Escrow released by customer confirmation for order ${order.orderNumber}`,
          referenceId: orderId,
          referenceType: 'order',
          balanceAfter: updatedWallet.availableBalance,
        },
      });

      // M-11: Use COUNT query for accurate totalOrders
      const completedCount = await tx.order.count({
        where: { storeId: order.storeId, status: { in: ['delivered'] } },
      });
      const avg = await tx.review.aggregate({
        where: { storeId: order.storeId },
        _avg: { rating: true },
      });
      const avgRating = Number(avg._avg.rating || 0);
      let trustLevel: any = 'standard';
      if (completedCount <= 3) trustLevel = 'new_merchant';
      else if (completedCount >= 50 && avgRating >= 4.5) trustLevel = 'trusted';
      else trustLevel = 'standard';
      await tx.store.update({
        where: { id: order.storeId },
        data: { totalOrders: completedCount, avgRating, trustLevel },
      });
    });

    await this.notifications.notifyUser(order.store.ownerId, {
      titleAr: 'تأكيد استلام الطلب',
      titleEn: 'Order Confirmed Received',
      bodyAr: `الزبون أكد استلام الطلب ${order.orderNumber}`,
      bodyEn: `Customer confirmed receipt for order ${order.orderNumber}`,
      type: 'order',
      data: { orderId: orderId.toString() },
    });

    return { success: true, message: 'تم تأكيد الاستلام وتحرير المبلغ للتاجر' };
  }

  async getOrder(user: any, orderId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { images: true } },
            variant: { select: { nameAr: true, nameEn: true } },
          },
        },
        payment: true,
        store: { select: { id: true, subdomain: true, ownerId: true, nameAr: true, nameEn: true } },
      },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    const isCustomer = order.customerId === BigInt(user.sub);
    const isMerchantOwner = order.store.ownerId === BigInt(user.sub);

    if (user.role !== 'admin' && !isCustomer && !isMerchantOwner)
      throw new ForbiddenException('ليس لديك صلاحية');

    return { success: true, data: order };
  }

  async listMyOrdersPaginated(user: any, page: number = 1, limit: number = 10) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    const take = Math.max(1, Math.min(50, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where: { customerId: BigInt(user.sub) } }),
      this.prisma.order.findMany({
        where: { customerId: BigInt(user.sub) },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          payment: true,
          store: { select: { id: true, subdomain: true, nameAr: true, nameEn: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: orders,
      meta: {
        page: Math.max(1, page),
        limit: take,
        total,
        hasPrev: skip > 0,
        hasNext: skip + orders.length < total,
      },
    };
  }

  /**
   * M-05: Added pagination to prevent unbounded result sets.
   */
  async listStoreOrders(user: any, storeId: bigint, page = 1, limit = 20) {
    await this.assertStoreOwner(user, storeId);
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where: { storeId } }),
      this.prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { payment: true },
      }),
    ]);

    return {
      success: true,
      data: orders,
      meta: { page, limit: take, total, hasPrev: skip > 0, hasNext: skip + orders.length < total },
    };
  }

  /**
   * C-10: COD payment confirmation endpoint.
   * Allows merchant to confirm receipt of cash-on-delivery payment.
   */
  async confirmCodPayment(user: any, storeId: bigint, orderId: bigint) {
    await this.assertStoreOwner(user, storeId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { payment: true, store: { include: { wallet: true } } },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');
    if (!order.payment) throw new BadRequestException('لا يوجد سجل دفع');
    if (order.payment.gateway !== 'cod')
      throw new BadRequestException('الطلب ليس دفع عند الاستلام');
    if (order.payment.status === 'paid') throw new BadRequestException('تم تأكيد الدفع مسبقاً');

    const wallet = order.store.wallet;
    if (!wallet) throw new BadRequestException('محفظة المتجر غير موجودة');

    const merchantAmount = Number(order.merchantAmount);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId },
        data: {
          status: 'paid',
          escrowStatus: 'held',
          releaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { increment: merchantAmount },
          totalEarned: { increment: merchantAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: merchantAmount,
          type: 'escrow_hold',
          description: `COD payment confirmed for order ${order.orderNumber}`,
          referenceId: order.id,
          referenceType: 'order',
          balanceAfter: updatedWallet.pendingBalance,
        },
      });
    });

    await this.notifications.notifyUser(order.customerId, {
      titleAr: 'تأكيد الدفع',
      titleEn: 'Payment Confirmed',
      bodyAr: `تم تأكيد الدفع عند الاستلام للطلب ${order.orderNumber}`,
      bodyEn: `COD payment confirmed for order ${order.orderNumber}`,
      type: 'payment',
      data: { orderId: orderId.toString() },
    });

    return { success: true, message: 'تم تأكيد الدفع عند الاستلام' };
  }

  private assertPaymentRules(
    rawPaymentSettings: unknown,
    method: PaymentMethod,
    context: { totalAmount: number; weightKg: number }
  ) {
    const paymentSettings = normalizePaymentSettings(rawPaymentSettings);
    const enabledMethods = getEnabledPaymentMethods(paymentSettings);

    if (!enabledMethods.length) {
      throw new BadRequestException('لا توجد وسائل دفع مفعلة لهذا المتجر');
    }

    if (!enabledMethods.includes(method)) {
      throw new BadRequestException('طريقة الدفع غير متاحة لهذا المتجر');
    }

    if (
      paymentSettings.minOrderAmount !== null &&
      context.totalAmount < paymentSettings.minOrderAmount
    ) {
      throw new BadRequestException(
        `الحد الأدنى للطلب هو ${paymentSettings.minOrderAmount.toFixed(3)} ر.ع`
      );
    }

    if (
      paymentSettings.maxOrderAmount !== null &&
      context.totalAmount > paymentSettings.maxOrderAmount
    ) {
      throw new BadRequestException(
        `الحد الأعلى للطلب هو ${paymentSettings.maxOrderAmount.toFixed(3)} ر.ع`
      );
    }

    if (method !== 'cod') return;

    if (
      paymentSettings.codMinOrderAmount !== null &&
      context.totalAmount < paymentSettings.codMinOrderAmount
    ) {
      throw new BadRequestException(
        `الدفع عند الاستلام متاح لطلبات تبدأ من ${paymentSettings.codMinOrderAmount.toFixed(3)} ر.ع`
      );
    }

    if (
      paymentSettings.codMaxOrderAmount !== null &&
      context.totalAmount > paymentSettings.codMaxOrderAmount
    ) {
      throw new BadRequestException(
        `الدفع عند الاستلام غير متاح للطلبات الأعلى من ${paymentSettings.codMaxOrderAmount.toFixed(3)} ر.ع`
      );
    }

    if (
      paymentSettings.codMaxWeightKg !== null &&
      context.weightKg > paymentSettings.codMaxWeightKg
    ) {
      throw new BadRequestException(
        `الدفع عند الاستلام متاح حتى وزن ${paymentSettings.codMaxWeightKg.toFixed(3)} كجم`
      );
    }
  }

  private resolveShippingCost(
    rawShippingSettings: unknown,
    subtotal: number,
    weightKg: number,
    address: { state?: string; city?: string }
  ) {
    const legacyBaseCost = Number(process.env.SHIPPING_BASE_COST || 0);
    const legacyPerKgCost = Number(process.env.SHIPPING_PER_KG || 0);

    return calculateShippingCost(rawShippingSettings, {
      subtotal,
      weightKg,
      state: address.state,
      city: address.city,
      legacyBaseCost,
      legacyPerKgCost,
    });
  }

  private paymentGatewayFromMethod(method: PaymentMethod) {
    if (method === 'card') return 'thawani';
    if (method === 'cod') return 'cod';
    if (method === 'wallet') return 'wallet';
    return 'bnpl';
  }

  private async assertStoreOwner(user: any, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role === 'admin') return;
    if (user.role !== 'merchant') throw new ForbiddenException('فقط التاجر');

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');
    if (store.ownerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية');
  }

  private async generateOrderNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `KFZ-${y}${m}${d}`;

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const count = await this.prisma.order.count({ where: { createdAt: { gte: start, lte: end } } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
