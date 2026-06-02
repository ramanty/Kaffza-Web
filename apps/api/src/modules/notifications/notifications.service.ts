import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Processor('notificationsQueue')
@Injectable()
export class NotificationsService extends WorkerHost {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notificationsQueue') private notificationsQueue: Queue
  ) {
    super();
  }

  async notifyUser(
    userId: bigint,
    payload: {
      titleAr: string;
      titleEn: string;
      bodyAr: string;
      bodyEn: string;
      type: any;
      data?: any;
    }
  ) {
    // Convert bigint to string for BullMQ serialization
    await this.notificationsQueue.add('notifyUser', {
      userId: userId.toString(),
      payload,
    });
    return true; // Fast return
  }

  async notifyAdmins(payload: {
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    type: any;
    data?: any;
  }) {
    await this.notificationsQueue.add('notifyAdmins', { payload });
    return true; // Fast return
  }

  async audit(actorId: bigint, action: string, data?: any) {
    await this.notificationsQueue.add('audit', {
      actorId: actorId.toString(),
      action,
      data,
    });
    return true; // Fast return
  }

  async process(job: Job<any>) {
    try {
      if (job.name === 'notifyUser') {
        const { userId, payload } = job.data;
        await this.prisma.notification.create({
          data: {
            userId: BigInt(userId),
            titleAr: payload.titleAr,
            titleEn: payload.titleEn,
            bodyAr: payload.bodyAr,
            bodyEn: payload.bodyEn,
            type: payload.type,
            data: payload.data ?? null,
          },
        });
      } else if (job.name === 'notifyAdmins') {
        const { payload } = job.data;
        const admins = await this.prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true },
        });
        await Promise.all(
          admins.map((a) =>
            this.prisma.notification.create({
              data: {
                userId: a.id,
                titleAr: payload.titleAr,
                titleEn: payload.titleEn,
                bodyAr: payload.bodyAr,
                bodyEn: payload.bodyEn,
                type: payload.type,
                data: payload.data ?? null,
              },
            })
          )
        );
      } else if (job.name === 'audit') {
        const { actorId, action, data } = job.data;
        const admins = await this.prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true },
        });
        await Promise.all(
          admins.map((a) =>
            this.prisma.notification.create({
              data: {
                userId: a.id,
                titleAr: 'سجل الأحداث',
                titleEn: 'Audit Log',
                bodyAr: action,
                bodyEn: action,
                type: 'system',
                data: { actorId, action, ...(data ?? {}) },
              },
            })
          )
        );
      }
    } catch (err) {
      this.logger.error(`Error processing job ${job.name}`, err);
      throw err;
    }
  }

  // Synchronous read operations
  async getNotifications(userId: bigint, skip = 0, take = 20) {
    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      success: true,
      data: items,
      meta: { total, skip, take, hasMore: skip + items.length < total },
    };
  }

  async markAsRead(userId: bigint, notificationId: bigint) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, data: updated };
  }
}

