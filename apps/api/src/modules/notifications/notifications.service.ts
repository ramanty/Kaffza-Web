import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyUser(userId: bigint, payload: { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; type: any; data?: any }) {
    return this.prisma.notification.create({
      data: {
        userId,
        titleAr: payload.titleAr,
        titleEn: payload.titleEn,
        bodyAr: payload.bodyAr,
        bodyEn: payload.bodyEn,
        type: payload.type,
        data: payload.data ?? null,
      },
    });
  }

  async notifyAdmins(payload: { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; type: any; data?: any }) {
    const admins = await this.prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
    await Promise.all(admins.map((a) => this.notifyUser(a.id, payload)));
  }

  async audit(actorId: bigint, action: string, data?: any) {
    // store as system notifications to all admins for audit log
    return this.notifyAdmins({
      titleAr: 'سجل الأحداث',
      titleEn: 'Audit Log',
      bodyAr: action,
      bodyEn: action,
      type: 'system',
      data: { actorId: actorId.toString(), action, ...(data ?? {}) },
    });
  }
}
