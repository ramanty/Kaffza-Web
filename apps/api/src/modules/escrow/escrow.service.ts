import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Dispute statuses that block automatic escrow release */
const ACTIVE_DISPUTE_STATUSES = ['open', 'under_review'] as const;

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async releaseDuePayments() {
    const now = new Date();

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'paid',
        escrowStatus: 'held',
        releaseAt: { lte: now },
      },
      include: { order: { include: { store: { include: { wallet: true } }, dispute: { select: { status: true } } } } },
    });

    for (const p of payments) {
      // Skip if there is an active dispute on this order
      const disputeStatus = p.order.dispute?.status;
      if (disputeStatus && (ACTIVE_DISPUTE_STATUSES as readonly string[]).includes(disputeStatus)) {
        this.logger.log(`Skipping payment ${p.id.toString()} — active dispute (${disputeStatus})`);
        continue;
      }

      try {
        await this.releasePayment(p.id);
      } catch (e: any) {
        this.logger.error(`Failed to release payment ${p.id.toString()}: ${e?.message || e}`);
      }
    }
  }

  private async releasePayment(paymentId: bigint) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { store: { include: { wallet: true } } } } },
    });
    if (!payment) return;
    if (payment.escrowStatus !== 'held' || payment.status !== 'paid') return;

    const order = payment.order;
    const wallet = order.store.wallet;
    if (!wallet) return;

    const amount = Number(order.merchantAmount);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { escrowStatus: 'released', releasedAt: new Date() },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { decrement: amount },
          availableBalance: { increment: amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'escrow_release',
          description: `Escrow released for order ${order.orderNumber}`,
          referenceId: order.id,
          referenceType: 'order',
          balanceAfter: updatedWallet.availableBalance,
        },
      });

      // Mark order complete
      await tx.order.update({ where: { id: order.id }, data: { status: 'delivered' } });

      // Update store trust metrics
      const newTotal = order.store.totalOrders + 1;
      const avg = await tx.review.aggregate({ where: { storeId: order.storeId }, _avg: { rating: true } });
      const avgRating = Number(avg._avg.rating || 0);

      let trustLevel: any = 'standard';
      if (newTotal <= 3) trustLevel = 'new_merchant';
      else if (newTotal >= 50 && avgRating >= 4.5) trustLevel = 'trusted';
      else trustLevel = 'standard';

      await tx.store.update({
        where: { id: order.storeId },
        data: { totalOrders: newTotal, avgRating, trustLevel },
      });
    });

    await this.notifications.notifyUser(order.store.ownerId, {
      titleAr: 'تم تحرير الأموال',
      titleEn: 'Funds Released',
      bodyAr: `تم تحرير مبلغ ${amount.toFixed(3)} ر.ع للطلب ${order.orderNumber}`,
      bodyEn: `Released ${amount.toFixed(3)} OMR for order ${order.orderNumber}`,
      type: 'payment',
      data: { orderId: order.id.toString() },
    });
  }
}
