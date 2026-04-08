import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../auth/services/redis.service';
import { WalletsService } from '../wallets/wallets.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly wallets: WalletsService,
    private readonly notifications: NotificationsService
  ) {}

  private assertAdmin(user: any) {
    if (user.role !== 'admin') throw new ForbiddenException('Admin فقط');
  }

  private banKey(userId: string) {
    return `ban:user:${userId}`;
  }

  private settingsKey() {
    return 'admin:settings';
  }

  private defaultSettings() {
    return {
      appName: process.env.APP_NAME || 'Kaffza',
      appUrl: process.env.APP_URL || 'https://kaffza.om',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@kaffza.om',
      thawaniApiUrl:
        process.env.THAWANI_BASE_URL ||
        process.env.THAWANI_API_URL ||
        'https://uatcheckout.thawani.om/api/v1',
      escrowNewMerchantDays: Number(process.env.ESCROW_NEW_MERCHANT_DAYS || 14),
      escrowStandardDays: Number(process.env.ESCROW_STANDARD_DAYS || 7),
      escrowTrustedDays: Number(process.env.ESCROW_TRUSTED_DAYS || 3),
      walletMinWithdrawal: Number(process.env.WALLET_MIN_WITHDRAWAL || 10),
      maintenanceMode: (process.env.MAINTENANCE_MODE || 'false').toLowerCase() === 'true',
      updatedAt: null as any,
    };
  }

  async getSettings(user: any) {
    this.assertAdmin(user);
    const raw = await this.redis.get(this.settingsKey());
    const stored = raw ? JSON.parse(raw) : {};
    return { success: true, data: { ...this.defaultSettings(), ...stored } };
  }

  async updateSettings(user: any, body: any) {
    this.assertAdmin(user);

    const current = (await this.getSettings(user)).data;

    const next = {
      ...current,
      appName: body?.appName ?? current.appName,
      appUrl: body?.appUrl ?? current.appUrl,
      supportEmail: body?.supportEmail ?? current.supportEmail,
      thawaniApiUrl: body?.thawaniApiUrl ?? current.thawaniApiUrl,
      escrowNewMerchantDays:
        body?.escrowNewMerchantDays !== undefined
          ? Number(body.escrowNewMerchantDays)
          : current.escrowNewMerchantDays,
      escrowStandardDays:
        body?.escrowStandardDays !== undefined
          ? Number(body.escrowStandardDays)
          : current.escrowStandardDays,
      escrowTrustedDays:
        body?.escrowTrustedDays !== undefined
          ? Number(body.escrowTrustedDays)
          : current.escrowTrustedDays,
      walletMinWithdrawal:
        body?.walletMinWithdrawal !== undefined
          ? Number(body.walletMinWithdrawal)
          : current.walletMinWithdrawal,
      maintenanceMode:
        body?.maintenanceMode !== undefined ? !!body.maintenanceMode : current.maintenanceMode,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.set(this.settingsKey(), JSON.stringify(next));
    await this.notifications.audit(BigInt(user.sub), 'Admin settings updated', {
      keys: Object.keys(body || {}),
    });

    return { success: true, message: 'تم حفظ الإعدادات', data: next };
  }
  async listUsers(user: any, role?: string, page: number = 1, limit: number = 20) {
    this.assertAdmin(user);
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const r = (role || '').toLowerCase();
    const where: any = r ? { role: r } : {};

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);

    // stores count for merchants
    const counts = new Map<string, number>();
    if (!r || r === 'merchant') {
      const gb = await this.prisma.store.groupBy({ by: ['ownerId'], _count: { _all: true } });
      for (const row of gb as any[]) {
        counts.set(String(row.ownerId), Number(row._count._all || 0));
      }
    }

    const result: any[] = [];
    for (const u of users as any[]) {
      const banned = await this.redis.get(this.banKey(u.id.toString()));
      const status = banned ? 'suspended' : 'active';
      result.push({
        ...u,
        status,
        storesCount: u.role === 'merchant' ? counts.get(String(u.id)) || 0 : 0,
      });
    }

    return { success: true, data: result, meta: { page: Math.max(1, page), limit: take, total } };
  }

  async setUserSuspended(user: any, userId: bigint, suspended: boolean, reason?: string) {
    this.assertAdmin(user);
    if (suspended) await this.redis.set(this.banKey(userId.toString()), reason || 'suspended');
    else await this.redis.del(this.banKey(userId.toString()));

    await this.notifications.audit(
      BigInt(user.sub),
      `User ${userId.toString()} suspended=${suspended}`,
      { reason }
    );
    return { success: true };
  }
  async listMerchants(user: any, status?: string, page: number = 1, limit: number = 20) {
    this.assertAdmin(user);
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const merchants = await this.prisma.user.findMany({
      where: { role: 'merchant' },
      orderBy: { createdAt: 'desc' },
    });

    const result: any[] = [];
    for (const m of merchants) {
      const banned = await this.redis.get(this.banKey(m.id.toString()));
      const state = banned ? 'blocked' : m.isVerified ? 'active' : 'pending';
      if (status && state !== status) continue;
      result.push({ ...m, status: state });
    }

    const paginated = result.slice(skip, skip + take);
    return {
      success: true,
      data: paginated,
      meta: { page: Math.max(1, page), limit: take, total: result.length },
    };
  }

  async approveMerchant(user: any, merchantId: bigint, approve: boolean) {
    this.assertAdmin(user);
    const updated = await this.prisma.user.update({
      where: { id: merchantId },
      data: { isVerified: approve },
    });
    await this.notifications.audit(
      BigInt(user.sub),
      `Merchant ${merchantId.toString()} approval=${approve}`
    );
    return { success: true, data: updated };
  }

  async setBan(user: any, merchantId: bigint, banned: boolean, reason?: string) {
    this.assertAdmin(user);
    if (banned) await this.redis.set(this.banKey(merchantId.toString()), reason || 'banned');
    else await this.redis.del(this.banKey(merchantId.toString()));

    await this.notifications.audit(
      BigInt(user.sub),
      `Merchant ${merchantId.toString()} banned=${banned}`,
      { reason }
    );
    return { success: true };
  }

  async listOrders(user: any, page: number = 1, limit: number = 20) {
    this.assertAdmin(user);
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { payment: true, store: { include: { owner: true } }, customer: true },
      }),
    ]);
    return { success: true, data: orders, meta: { page: Math.max(1, page), limit: take, total } };
  }

  async listPayments(user: any, page: number = 1, limit: number = 20) {
    this.assertAdmin(user);
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);
    const [total, payments] = await this.prisma.$transaction([
      this.prisma.payment.count(),
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { order: { include: { store: true, customer: true } } },
      }),
    ]);
    return { success: true, data: payments, meta: { page: Math.max(1, page), limit: take, total } };
  }

  async listWithdrawals(user: any, page: number = 1, limit: number = 20) {
    this.assertAdmin(user);
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);
    const [total, withdrawals] = await this.prisma.$transaction([
      this.prisma.withdrawal.count(),
      this.prisma.withdrawal.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { wallet: { include: { store: true } } },
      }),
    ]);
    return {
      success: true,
      data: withdrawals,
      meta: { page: Math.max(1, page), limit: take, total },
    };
  }

  async handleWithdrawal(user: any, withdrawalId: bigint, approve: boolean, notes?: string) {
    this.assertAdmin(user);
    const res = await this.wallets.adminApproveWithdrawal(user, withdrawalId, approve, notes);
    await this.notifications.audit(
      BigInt(user.sub),
      `Withdrawal ${withdrawalId.toString()} approve=${approve}`,
      { notes }
    );
    return res;
  }

  async stats(user: any) {
    this.assertAdmin(user);
    const [ordersCount, merchantsCount, paidPayments] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: 'merchant' } }),
      this.prisma.payment.findMany({ where: { status: 'paid' }, select: { amount: true } }),
    ]);

    const totalSales = paidPayments.reduce((s, p) => s + Number(p.amount), 0);

    return { success: true, data: { totalSales, ordersCount, merchantsCount } };
  }

  async auditLog(user: any, page: number = 1, limit: number = 20) {
    this.assertAdmin(user);
    const take = Math.max(1, Math.min(100, limit));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);
    const where = { type: 'system' as const };
    const [total, logs] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    return { success: true, data: logs, meta: { page: Math.max(1, page), limit: take, total } };
  }
}
