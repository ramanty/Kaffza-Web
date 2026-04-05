import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const ESCROW_HOLD_DAYS = 15;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}


// Create Thawani session using only orderId (API alias convenience)
async createThawaniSessionByOrderId(user: any, orderId: bigint, isMobile: boolean = false) {
  const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { storeId: true } });
  if (!order) throw new NotFoundException('الطلب غير موجود');
  return this.createThawaniSession(user, BigInt(order.storeId as any), orderId, isMobile);
}

  /**
   * Create Thawani checkout session.
   * Docs: POST /checkout/session with thawani-api-key header.
   */
  async createThawaniSession(user: any, storeId: bigint, orderId: bigint, isMobile: boolean = false) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role !== 'customer' && user.role !== 'admin') throw new ForbiddenException('فقط العميل');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { items: true, payment: true, store: { select: { subdomain: true } } },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');
    if (user.role !== 'admin' && order.customerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية');

    if (!order.payment) throw new BadRequestException('لا يوجد سجل دفع');
    if (order.payment.status === 'paid') throw new BadRequestException('تم الدفع مسبقاً');

    const apiUrl = this.config.get<string>('thawani.apiUrl') || process.env.THAWANI_API_URL;
    const publishableKey = this.config.get<string>('thawani.apiKey') || process.env.THAWANI_API_KEY;
    const secretKey = this.config.get<string>('thawani.secretKey') || process.env.THAWANI_SECRET_KEY;
    const successUrl = this.config.get<string>('thawani.successUrl') || process.env.THAWANI_SUCCESS_URL;
    const cancelUrl = this.config.get<string>('thawani.cancelUrl') || process.env.THAWANI_CANCEL_URL;
    const successUrlMobile = this.config.get<string>('thawani.successUrlMobile') || process.env.THAWANI_SUCCESS_URL_MOBILE;
    const cancelUrlMobile = this.config.get<string>('thawani.cancelUrlMobile') || process.env.THAWANI_CANCEL_URL_MOBILE;

    if (!apiUrl || !secretKey || !publishableKey) throw new BadRequestException('إعدادات Thawani ناقصة');

    // Build products in baisa (1 OMR = 1000 baisa)
    const products = order.items.map((i) => ({
      name: (i.productName || '').slice(0, 40) || 'Order Item',
      quantity: i.quantity,
      unit_amount: Math.max(1, Math.round(Number(i.unitPrice) * 1000)),
    }));

    const body = {
      client_reference_id: order.id.toString(),
      mode: 'payment',
      products,
      success_url: this.appendRedirectParams((isMobile ? (successUrlMobile || successUrl) : successUrl), storeId, order.id, (order as any).store?.subdomain),
      cancel_url: this.appendRedirectParams((isMobile ? (cancelUrlMobile || cancelUrl) : cancelUrl), storeId, order.id, (order as any).store?.subdomain),
      metadata: {
        orderId: order.id.toString(),
        storeId: storeId.toString(),
        orderNumber: order.orderNumber,
      },
    };

    const resp = await fetch(`${apiUrl}/checkout/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'thawani-api-key': secretKey,
      },
      body: JSON.stringify(body),
    });

    const data = (await resp.json().catch(() => null)) as any;
    if (!resp.ok || !data?.success) {
      throw new BadRequestException(data?.description || 'فشل إنشاء جلسة الدفع');
    }

    const sessionId = data.data.session_id || data.data.sessionId;
    const paymentUrl = `${apiUrl.includes('uat') ? 'https://uatcheckout.thawani.om' : 'https://checkout.thawani.om'}/pay/${sessionId}?key=${publishableKey}`;

    await this.prisma.payment.update({
      where: { orderId: orderId },
      data: { gateway: 'thawani', gatewaySessionId: sessionId },
    });

    return { success: true, data: { sessionId, paymentUrl } };
  }



private appendRedirectParams(baseUrl: string | undefined, storeId: bigint, orderId: bigint, subdomain?: string) {
  const url = baseUrl || '';
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}storeId=${storeId.toString()}&orderId=${orderId.toString()}${subdomain ? `&subdomain=${encodeURIComponent(subdomain)}` : ''}`;
}

private async processPaid(orderId: bigint, gatewayPaymentId: string | null) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, store: { include: { wallet: true, plan: true } } },
  });
  if (!order || !order.payment) return;
  if (order.payment.status === 'paid') return;

  const wallet = order.store.wallet;
  if (!wallet) throw new BadRequestException('محفظة المتجر غير موجودة');

  const merchantAmount = Number(order.merchantAmount);

  const releaseAt = new Date(Date.now() + ESCROW_HOLD_DAYS * 24 * 60 * 60 * 1000);

  await this.prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: 'paid', escrowStatus: 'held', releaseAt, gatewayPaymentId: gatewayPaymentId ?? undefined },
    });
    await tx.order.update({ where: { id: orderId }, data: { status: 'confirmed' } });
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { pendingBalance: { increment: merchantAmount }, totalEarned: { increment: merchantAmount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: merchantAmount,
        type: 'escrow_hold',
        description: `Escrow hold for order ${order.orderNumber}`,
        referenceId: orderId,
        referenceType: 'order',
        balanceAfter: updatedWallet.pendingBalance,
      },
    });
  });

  await this.notifications.notifyUser(order.store.ownerId, {
    titleAr: 'طلب جديد مدفوع',
    titleEn: 'New Paid Order',
    bodyAr: `تم دفع الطلب ${order.orderNumber}`,
    bodyEn: `Order ${order.orderNumber} has been paid`,
    type: 'payment',
    data: { orderId: orderId.toString() },
  });
}

  /**
   * Webhook: mark payment as paid and place funds in escrow held.
   * We rely on metadata.orderId from webhook body.
   */
  async handleThawaniWebhook(payload: any) {
  const orderIdStr = payload?.data?.metadata?.orderId || payload?.metadata?.orderId || payload?.data?.client_reference_id;
  if (!orderIdStr) return { success: true };
  await this.processPaid(BigInt(orderIdStr), payload?.data?.payment_id || payload?.data?.paymentId || null);
  return { success: true };
}


  

// Get payment status by thawani session id (gatewaySessionId)
async retrieveThawaniStatusBySession(user: any, sessionId: string) {
  if (!user?.sub) throw new ForbiddenException('غير مصرح');

  const payment = await this.prisma.payment.findFirst({
    where: { gatewaySessionId: sessionId },
    include: { order: true },
  });
  if (!payment) throw new NotFoundException('الجلسة غير موجودة');

  // Reuse existing permission checks + status logic
  return this.retrieveThawaniStatus(user, BigInt(payment.order.storeId as any), BigInt(payment.orderId as any));
}
async retrieveThawaniStatus(user: any, storeId: bigint, orderId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const order = await this.prisma.order.findFirst({ where: { id: orderId, storeId }, include: { payment: true } });
    if (!order) throw new NotFoundException('الطلب غير موجود');
    if (user.role !== 'admin' && order.customerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية');

    const apiUrl = this.config.get<string>('thawani.apiUrl') || process.env.THAWANI_API_URL;
    const secretKey = this.config.get<string>('thawani.secretKey') || process.env.THAWANI_SECRET_KEY;
    if (!apiUrl || !secretKey) throw new BadRequestException('إعدادات Thawani ناقصة');

    const resp = await fetch(`${apiUrl}/checkout/reference/${orderId.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json', 'thawani-api-key': secretKey },
    });

    const data = (await resp.json().catch(() => null)) as any;
    if (!resp.ok || !data?.success) throw new BadRequestException(data?.description || 'فشل جلب حالة الدفع');

    const paymentStatus = data.data.payment_status;
    const invoice = data.data.invoice || null;

    if (paymentStatus === 'paid') {
      await this.processPaid(orderId, invoice);
    }

    return { success: true, data: { orderId: orderId.toString(), paymentStatus, invoice } };
  }
}
