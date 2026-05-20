import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: bigint;
    action: string;
    entity: string;
    entityId?: bigint;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog
      .create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          details: data.details || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      })
      .catch((e) => {
        console.error('Failed to write audit log:', e);
      });
  }
}
