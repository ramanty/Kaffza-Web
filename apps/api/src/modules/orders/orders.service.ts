import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly notifications: NotificationsService,
  ) {}

  async checkout(user: any, storeId: bigint, dto: CheckoutDto) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role !== 'customer' && user.role !== 'admin') throw new ForbiddenException('فقط العميل');

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, include: { plan: true } });
    if (!store || !store.isActive) throw new NotFoundException('المتجر غير موجود');

    const cartData = await this.cart.getCart(user, storeId);
    const items = cartData.data.items as any[];
    if (!items.length) throw new BadRequestException('السلة فارغة');

    const subtotal = Number(cartData.data.subtotal);
    const shippingCost = Number(cartData.data.shippingCost);
    const totalAmount = round3(subtotal + shippingCost);

    const commissionRate = Number(store.plan.commissionRate);
    const commissionAmount = round3(totalAmount * commissionRate);
    const merchantAmount = round3(totalAmount - commissionAmount);

    const orderNumber = await this.generateOrderNumber();

    const created = await this.prisma.$transaction(async (tx) => {
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
          gateway: 'thawani',
          escrowStatus: 'held',
        },
      });

      return order;
    });

    await this.cart.clearCart(user.sub, storeId.toString());

    // notify merchant new order
    await this.notifications.notifyUser(store.ownerId, {
      titleAr: 'طلب جديد',
      titleEn: 'New Order',
      bodyAr: `طلب جديد رقم ${orderNumber}`,
      bodyEn: `New order ${orderNumber}`,
      type: 'order',
      data: { orderId: created.id.toString(), storeId: storeId.toString() },
    });

    return { success: true, message: 'تم إنشاء الطلب. انتقل للدفع', data: { orderId: created.id.toString(), orderNumber } };
  }

  async updateStatus(user: any, storeId: bigint, orderId: bigint, status: string) {
    await this.assertStoreOwner(user, storeId);

    const order = await this.prisma.order.findFirst({ where: { id: orderId, storeId }, include: { payment: true } });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    if (order.customerConfirmed) throw new BadRequestException('لا يمكن تعديل طلب تم تأكيد استلامه');

    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status: status as any } });

    // notify customer
    await this.notifications.notifyUser(order.customerId, {
      titleAr: 'تحديث حالة الطلب',
      titleEn: 'Order Status Update',
      bodyAr: `تم تحديث حالة طلبك إلى: ${status}`,
      bodyEn: `Your order status is now: ${status}`,
      type: 'order',
      data: { orderId: orderId.toString() },
    });

    return { success: true, message: 'تم تحديث حالة الطلب', data: { id: updated.id.toString(), status: updated.status } };
  }

  async confirmReceipt(user: any, orderId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { store: { include: { wallet: true } }, payment: true } });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    if (user.role !== 'admin' && order.customerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية');

    if (!order.payment) throw new BadRequestException('لا يوجد سجل دفع');
    if (order.payment.status !== 'paid') throw new BadRequestException('لا يمكن التأكيد قبل الدفع');
    if (order.payment.escrowStatus !== 'held') throw new BadRequestException('حالة الضمان غير صحيحة');

    const wallet = order.store.wallet;
    if (!wallet) throw new BadRequestException('محفظة المتجر غير موجودة');

    const amount = Number(order.merchantAmount);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { customerConfirmed: true, confirmedAt: new Date(), status: 'delivered' } });
      await tx.payment.update({ where: { orderId }, data: { escrowStatus: 'released', releasedAt: new Date() } });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { pendingBalance: { decrement: amount }, availableBalance: { increment: amount } },
      });

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

      // update store trust counts
      const newTotal = order.store.totalOrders + 1;
      const avg = await tx.review.aggregate({ where: { storeId: order.storeId }, _avg: { rating: true } });
      const avgRating = Number(avg._avg.rating || 0);
      let trustLevel: any = 'standard';
      if (newTotal <= 3) trustLevel = 'new_merchant';
      else if (newTotal >= 50 && avgRating >= 4.5) trustLevel = 'trusted';
      else trustLevel = 'standard';
      await tx.store.update({ where: { id: order.storeId }, data: { totalOrders: newTotal, avgRating, trustLevel } });
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
      include: { items: { include: { product: { select: { images: true } }, variant: { select: { nameAr: true, nameEn: true } } } }, payment: true, store: { select: { id: true, subdomain: true, ownerId: true, nameAr: true, nameEn: true } } },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    const isCustomer = order.customerId === BigInt(user.sub);
    const isMerchantOwner = order.store.ownerId === BigInt(user.sub);

    if (user.role !== 'admin' && !isCustomer && !isMerchantOwner) throw new ForbiddenException('ليس لديك صلاحية');

    return { success: true, data: order };
  }

  async listMyOrders(user: any) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    const orders = await this.prisma.order.findMany({ where: { customerId: BigInt(user.sub) }, orderBy: { createdAt: 'desc' }, include: { payment: true, store: { select: { id: true, subdomain: true } } } });
    return { success: true, data: orders };
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
      include: { payment: true, store: { select: { id: true, subdomain: true, nameAr: true, nameEn: true } } },
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


  async listStoreOrders(user: any, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const orders = await this.prisma.order.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' }, include: { payment: true } });
    return { success: true, data: orders };
  }

  private async assertStoreOwner(user: any, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role === 'admin') return;
    if (user.role !== 'merchant') throw new ForbiddenException('فقط التاجر');

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true } });
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
