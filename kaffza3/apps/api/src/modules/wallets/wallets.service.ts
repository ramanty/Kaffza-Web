import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  async getWallet(user: any, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const wallet = await this.prisma.wallet.findUnique({ where: { storeId }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } });
    if (!wallet) throw new NotFoundException('المحفظة غير موجودة');
    return { success: true, data: wallet };
  }

  async requestWithdrawal(user: any, storeId: bigint, dto: any) {
    await this.assertStoreOwner(user, storeId);

    const wallet = await this.prisma.wallet.findUnique({ where: { storeId } });
    if (!wallet) throw new NotFoundException('المحفظة غير موجودة');

    const amount = Number(dto.amount);
    if (amount < 10) throw new BadRequestException('الحد الأدنى للسحب هو 10 ر.ع');
    if (Number(wallet.availableBalance) < amount) throw new BadRequestException('الرصيد المتاح غير كافي');

    const created = await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        },
      });

      const wd = await tx.withdrawal.create({
        data: {
          walletId: wallet.id,
          amount,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          iban: dto.iban,
          status: 'pending',
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: 'withdrawal',
          description: `Withdrawal request #${wd.id.toString()}`,
          referenceId: wd.id,
          referenceType: 'withdrawal',
          balanceAfter: w.availableBalance,
        },
      });

      return wd;
    });

    await this.notifications.notifyAdmins({
      titleAr: 'طلب سحب جديد',
      titleEn: 'New Withdrawal Request',
      bodyAr: `طلب سحب بقيمة ${amount.toFixed(3)} ر.ع`,
      bodyEn: `Withdrawal request for ${amount.toFixed(3)} OMR`,
      type: 'system',
      data: { withdrawalId: created.id.toString(), storeId: storeId.toString() },
    });

    return { success: true, message: 'تم تقديم طلب السحب', data: created };
  }

  async adminApproveWithdrawal(admin: any, withdrawalId: bigint, approve: boolean, notes?: string) {
    if (admin.role !== 'admin') throw new ForbiddenException('Admin فقط');

    const wd = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId }, include: { wallet: { include: { store: true } } } });
    if (!wd) throw new NotFoundException('طلب السحب غير موجود');
    if (wd.status !== 'pending') throw new BadRequestException('تمت معالجة الطلب مسبقاً');

    if (approve) {
      const updated = await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'completed', processedAt: new Date(), adminNotes: notes },
      });

      await this.notifications.notifyUser(wd.wallet.store.ownerId, {
        titleAr: 'تمت الموافقة على السحب',
        titleEn: 'Withdrawal Approved',
        bodyAr: `تمت الموافقة على طلب السحب #${withdrawalId.toString()}`,
        bodyEn: `Withdrawal #${withdrawalId.toString()} approved`,
        type: 'system',
        data: { withdrawalId: withdrawalId.toString() },
      });

      return { success: true, message: 'تمت الموافقة', data: updated };
    }

    // reject: refund balance
    const amount = Number(wd.amount);

    const updated = await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: wd.walletId },
        data: { availableBalance: { increment: amount }, totalWithdrawn: { decrement: amount } },
      });

      const u = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: 'rejected', processedAt: new Date(), adminNotes: notes },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wd.walletId,
          amount,
          type: 'refund',
          description: `Withdrawal rejected refund #${withdrawalId.toString()}`,
          referenceId: withdrawalId,
          referenceType: 'withdrawal',
          balanceAfter: w.availableBalance,
        },
      });

      return u;
    });

    await this.notifications.notifyUser(wd.wallet.store.ownerId, {
      titleAr: 'تم رفض السحب',
      titleEn: 'Withdrawal Rejected',
      bodyAr: `تم رفض طلب السحب #${withdrawalId.toString()}`,
      bodyEn: `Withdrawal #${withdrawalId.toString()} rejected`,
      type: 'system',
      data: { withdrawalId: withdrawalId.toString() },
    });

    return { success: true, message: 'تم الرفض', data: updated };
  }

  private async assertStoreOwner(user: any, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role === 'admin') return;
    if (user.role !== 'merchant') throw new ForbiddenException('فقط التاجر');

    const store = await this.prisma.store.findUnique({ where: { id: storeId }, select: { ownerId: true } });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    if (store.ownerId !== BigInt(user.sub)) throw new ForbiddenException('ليس لديك صلاحية');
  }
}
