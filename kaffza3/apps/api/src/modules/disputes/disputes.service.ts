import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  

async list(user: any, storeId?: bigint) {
  if (!user?.sub) throw new ForbiddenException('غير مصرح');

  const role = String(user.role || '').toLowerCase();

  if (role === 'merchant') {
    if (!storeId) throw new BadRequestException('storeId مطلوب');
    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true } });
    if (!store) throw new NotFoundException('المتجر غير موجود');
    if (store.ownerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية');

    const disputes = await this.prisma.dispute.findMany({
      where: { order: { storeId } },
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true, totalAmount: true, customer: { select: { id: true, name: true, phone: true } } } },
        raisedBy: { select: { id: true, name: true, phone: true } },
      },
    });
    return { success: true, data: disputes };
  }

  if (role === 'admin') {
    const disputes = await this.prisma.dispute.findMany({
      where: storeId ? { order: { storeId } } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true, storeId: true, customer: { select: { id: true, name: true, phone: true } } } },
        raisedBy: { select: { id: true, name: true, phone: true } },
      },
    });
    return { success: true, data: disputes };
  }

  // customers can list their disputes (optional)
  const disputes = await this.prisma.dispute.findMany({
    where: { raisedById: BigInt(user.sub) },
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { id: true, orderNumber: true, storeId: true } } },
  });
  return { success: true, data: disputes };
}
async open(user: any, orderId: bigint, dto: any) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, store: true },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');

    if (user.role !== 'admin' && order.customerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية');

    if (!order.payment) throw new BadRequestException('لا يوجد دفع');
    if (order.payment.status !== 'paid') throw new BadRequestException('لا يمكن فتح نزاع قبل الدفع');
    if (order.payment.escrowStatus !== 'held') throw new BadRequestException('يمكن فتح النزاع فقط خلال فترة الضمان');

    const existing = await this.prisma.dispute.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('النزاع موجود بالفعل');

    const dispute = await this.prisma.$transaction(async (tx) => {
      const d = await tx.dispute.create({
        data: {
          orderId,
          raisedById: BigInt(user.sub),
          type: dto.type,
          reason: dto.reason,
          evidence: dto.evidence ?? [],
          status: 'open',
        },
      });

      await tx.payment.update({ where: { orderId }, data: { escrowStatus: 'disputed' } });
      return d;
    });

    // notify merchant + admins
    await this.notifications.notifyUser(order.store.ownerId, {
      titleAr: 'تم فتح نزاع',
      titleEn: 'Dispute Opened',
      bodyAr: `تم فتح نزاع على الطلب ${order.orderNumber}`,
      bodyEn: `A dispute was opened on order ${order.orderNumber}`,
      type: 'dispute',
      data: { orderId: orderId.toString(), disputeId: dispute.id.toString() },
    });

    await this.notifications.notifyAdmins({
      titleAr: 'نزاع جديد',
      titleEn: 'New Dispute',
      bodyAr: `نزاع جديد على الطلب ${order.orderNumber}`,
      bodyEn: `New dispute on order ${order.orderNumber}`,
      type: 'dispute',
      data: { orderId: orderId.toString(), disputeId: dispute.id.toString() },
    });

    return { success: true, message: 'تم فتح النزاع', data: dispute };
  }

  async addMessage(user: any, disputeId: bigint, dto: any) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: { include: { store: true } } },
    });
    if (!dispute) throw new NotFoundException('النزاع غير موجود');

    const isCustomer = dispute.raisedById === BigInt(user.sub);
    const isMerchant = dispute.order.store.ownerId === BigInt(user.sub);
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isMerchant && !isAdmin) throw new ForbiddenException('ليس لديك صلاحية');

    const msg = await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: BigInt(user.sub),
        message: dto.message,
        attachments: dto.attachments ?? [],
      },
    });

    return { success: true, data: msg };
  }

  async get(user: any, disputeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { messages: { orderBy: { createdAt: 'asc' } }, order: { include: { store: true, payment: true } } },
    });
    if (!dispute) throw new NotFoundException('النزاع غير موجود');

    const isCustomer = dispute.raisedById === BigInt(user.sub);
    const isMerchant = dispute.order.store.ownerId === BigInt(user.sub);
    const isAdmin = user.role === 'admin';

    if (!isCustomer && !isMerchant && !isAdmin) throw new ForbiddenException('ليس لديك صلاحية');

    return { success: true, data: dispute };
  }

  async resolve(actor: any, disputeId: bigint, dto: any) {
    if (!actor?.sub) throw new ForbiddenException('غير مصرح');
    if (String(actor.role || '').toLowerCase() !== 'admin') throw new ForbiddenException('Admin فقط');

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: { include: { store: { include: { wallet: true } }, payment: true } } },
    });
    if (!dispute) throw new NotFoundException('النزاع غير موجود');

    if (!dispute.order.payment) throw new BadRequestException('لا يوجد دفع');

    const order = dispute.order;
    const wallet = order.store.wallet;
    if (!wallet) throw new BadRequestException('محفظة المتجر غير موجودة');

    const merchantAmount = Number(order.merchantAmount);

    if (dto.status === 'resolved_merchant') {
      // release funds to merchant
      await this.prisma.$transaction(async (tx) => {
        await tx.dispute.update({ where: { id: disputeId }, data: { status: 'resolved_merchant', resolution: dto.resolution, resolvedAt: new Date(), assignedToId: BigInt(actor.sub) } });

        await tx.payment.update({ where: { orderId: order.id }, data: { escrowStatus: 'released', releasedAt: new Date() } });

        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { pendingBalance: { decrement: merchantAmount }, availableBalance: { increment: merchantAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: merchantAmount,
            type: 'escrow_release',
            description: `Escrow released by dispute resolution for order ${order.orderNumber}`,
            referenceId: order.id,
            referenceType: 'order',
            balanceAfter: updatedWallet.availableBalance,
          },
        });

        await tx.order.update({ where: { id: order.id }, data: { status: 'delivered' } });
      });

      return { success: true, message: 'تم الحل لصالح التاجر وتم تحرير المبلغ' };
    }

    // resolved_customer -> refund
    const refundAmount = dto.refundAmount !== undefined ? Number(dto.refundAmount) : merchantAmount;
    if (refundAmount < 0 || refundAmount > merchantAmount) throw new BadRequestException('قيمة refund غير صحيحة');

    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({ where: { id: disputeId }, data: { status: 'resolved_customer', resolution: dto.resolution, resolvedAt: new Date(), assignedToId: BigInt(actor.sub) } });

      await tx.payment.update({ where: { orderId: order.id }, data: { escrowStatus: 'refunded', status: 'refunded' } });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { pendingBalance: { decrement: refundAmount }, totalEarned: { decrement: refundAmount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -refundAmount,
          type: 'refund',
          description: `Refund by dispute resolution for order ${order.orderNumber}`,
          referenceId: order.id,
          referenceType: 'order',
          balanceAfter: updatedWallet.pendingBalance,
        },
      });

      await tx.order.update({ where: { id: order.id }, data: { status: 'refunded' } });
    });

    return { success: true, message: 'تم الحل لصالح الزبون وتم استرداد المبلغ' };
  }
}
