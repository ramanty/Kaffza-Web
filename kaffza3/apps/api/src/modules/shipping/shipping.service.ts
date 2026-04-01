import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly notifications: NotificationsService) {}

  async createShipment(user: any, storeId: bigint, orderId: bigint) {
    await this.assertStoreOwner(user, storeId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { shipment: true, payment: true },
    });
    if (!order) throw new NotFoundException('الطلب غير موجود');
    if (order.shipment) throw new BadRequestException('الشحنة موجودة بالفعل');
    if (!order.payment || order.payment.status !== 'paid') throw new BadRequestException('لا يمكن إنشاء شحنة قبل الدفع');

    const trackingNumber = `TRK-${randomUUID().slice(0, 10).toUpperCase()}`;
    const awbNumber = `AWB-${randomUUID().slice(0, 10).toUpperCase()}`;

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        provider: 'jeena',
        trackingNumber,
        awbNumber,
        status: 'pending',
        fromAddress: { note: 'merchant address (mock)' } as any,
        toAddress: order.shippingAddress as any,
        weightKg: 0 as any,
        shippedAt: new Date(),
      },
    });

    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'shipped' } });

    return { success: true, message: 'تم إنشاء الشحنة (Mock)', data: shipment };
  }

  

async listStoreShipments(user: any, storeId: bigint, page: number = 1, limit: number = 20) {
  await this.assertStoreOwner(user, storeId);

  const take = Math.max(1, Math.min(50, limit));
  const skip = Math.max(0, (Math.max(1, page) - 1) * take);

  const [total, items] = await this.prisma.$transaction([
    this.prisma.shipment.count({ where: { order: { storeId } } }),
    this.prisma.shipment.findMany({
      where: { order: { storeId } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        order: { select: { id: true, orderNumber: true, createdAt: true, customer: { select: { id: true, name: true, phone: true } } } },
      },
    }),
  ]);

  return {
    success: true,
    data: items,
    meta: { page: Math.max(1, page), limit: take, total, hasPrev: skip > 0, hasNext: skip + items.length < total },
  };
}

private mapDashboardStatus(status: string) {
  const s = String(status || '').toLowerCase();
  // UI statuses: pending, processing, shipped, delivered, returned
  if (s === 'pending') return 'pending';
  if (s === 'processing') return 'in_transit';
  if (s === 'shipped') return 'out_for_delivery';
  if (s === 'delivered') return 'delivered';
  if (s === 'returned') return 'returned';
  // allow passing underlying enum values too
  return s;
}

async updateStatusById(user: any, storeId: bigint, shipmentId: bigint, status: string) {
  await this.assertStoreOwner(user, storeId);

  const shipment = await this.prisma.shipment.findFirst({ where: { id: shipmentId, order: { storeId } }, include: { order: { include: { store: true, payment: true } } } });
  if (!shipment) throw new NotFoundException('الشحنة غير موجودة');

  const mapped = this.mapDashboardStatus(status);
  const deliveredAt = mapped === 'delivered' ? new Date() : undefined;

  const updated = await this.prisma.shipment.update({ where: { id: shipment.id }, data: { status: mapped as any, deliveredAt } });

  // sync order/payment like existing logic
  if (mapped === 'delivered' && shipment.order.payment && shipment.order.payment.status === 'paid' && shipment.order.payment.escrowStatus === 'held') {
    const releaseAt = this.computeReleaseAt(shipment.order.store.trustLevel);
    await this.prisma.payment.update({ where: { orderId: shipment.orderId }, data: { releaseAt } });
    await this.prisma.order.update({ where: { id: shipment.orderId }, data: { status: 'delivered' } });
  }

  // notify customer
  try {
    await this.notifications.notifyUser(shipment.order.customerId, {
      titleAr: 'تحديث حالة الطلب',
      titleEn: 'Order Status Update',
      bodyAr: `تم تحديث حالة الشحن إلى: ${mapped}`,
      bodyEn: `Shipping status updated to: ${mapped}`,
      type: 'order',
      data: { orderId: shipment.orderId.toString(), shipmentId: shipment.id.toString() },
    });
  } catch {
    // ignore
  }

  return { success: true, message: 'تم تحديث حالة الشحنة', data: updated };
}
async track(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findFirst({ where: { trackingNumber } });
    if (!shipment) throw new NotFoundException('الشحنة غير موجودة');

    return {
      success: true,
      data: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
        events: [
          { status: shipment.status, timestamp: new Date().toISOString(), location: 'OM', description: 'Mock update' },
        ],
      },
    };
  }

  async updateStatus(user: any, trackingNumber: string, status: string) {
    const shipment = await this.prisma.shipment.findFirst({ where: { trackingNumber }, include: { order: { include: { store: true, payment: true }, } } });
    if (!shipment) throw new NotFoundException('الشحنة غير موجودة');

    await this.assertStoreOwner(user, shipment.order.storeId);

    const deliveredAt = status === 'delivered' ? new Date() : undefined;

    const updated = await this.prisma.shipment.update({
      where: { id: shipment.id },
      data: { status, deliveredAt },
    });

    // If delivered, start escrow countdown now (releaseAt)
    if (status === 'delivered' && shipment.order.payment && shipment.order.payment.status === 'paid' && shipment.order.payment.escrowStatus === 'held') {
      const releaseAt = this.computeReleaseAt(shipment.order.store.trustLevel);
      await this.prisma.payment.update({ where: { orderId: shipment.orderId }, data: { releaseAt } });
      await this.prisma.order.update({ where: { id: shipment.orderId }, data: { status: 'delivered' } });
    }

    

    // notify customer about order status change
    try {
      await this.notifications.notifyUser(shipment.order.customerId, {
        titleAr: 'تحديث حالة الطلب',
        titleEn: 'Order Status Update',
        bodyAr: `تم تحديث حالة الشحن إلى: ${status}`,
        bodyEn: `Shipping status updated to: ${status}`,
        type: 'order',
        data: { orderId: shipment.orderId.toString(), trackingNumber },
      });
    } catch {
      // ignore notification errors
    }

return { success: true, message: 'تم تحديث حالة الشحنة', data: updated };
  }

  private computeReleaseAt(trustLevel: string) {
    const cfg = this.config.get<any>('escrow') || {};
    const days = trustLevel === 'trusted' ? Number(cfg.trustedDays ?? 3) : trustLevel === 'standard' ? Number(cfg.standardDays ?? 7) : Number(cfg.newMerchantDays ?? 14);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
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
