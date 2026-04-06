import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async createStore(user: { sub: string; role: string }, dto: CreateStoreDto) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role !== 'merchant' && user.role !== 'admin') {
      throw new ForbiddenException('فقط التاجر أو الأدمن يمكنه إنشاء متجر');
    }

    const ownerId = BigInt(user.sub);
    const planId = BigInt(dto.planId);

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new BadRequestException('الخطة غير موجودة أو غير مفعلة');

    await this.assertStoreLimit(ownerId, plan);

    try {
      const store = await this.prisma.store.create({
        data: {
          ownerId,
          planId,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          subdomain: dto.subdomain,
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          isActive: true,
          wallet: {
            create: {
              availableBalance: 0,
              pendingBalance: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
            },
          },
          subscriptions: {
            create: {
              planId,
              status: 'active',
              startsAt: new Date(),
              endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        include: {
          plan: true,
          owner: { select: { id: true, name: true, email: true, phone: true, role: true } },
        },
      });

      return { success: true, message: 'تم إنشاء المتجر بنجاح', data: store };
    } catch (e: any) {
      if (String(e?.code) === 'P2002') {
        throw new BadRequestException('النطاق الفرعي أو النطاق المخصص مستخدم بالفعل');
      }
      throw e;
    }
  }

  async updateStore(user: { sub: string; role: string }, storeId: bigint, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    if (user.role !== 'admin' && store.ownerId !== BigInt(user.sub)) {
      throw new ForbiddenException('ليس لديك صلاحية تعديل هذا المتجر');
    }

    try {
      const updated = await this.prisma.store.update({
        where: { id: storeId },
        data: {
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          customDomain: dto.customDomain,
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          logoUrl: dto.logoUrl,
          bannerUrl: dto.bannerUrl,
        },
      });

      return { success: true, message: 'تم تحديث المتجر', data: updated };
    } catch (e: any) {
      if (String(e?.code) === 'P2002') {
        throw new BadRequestException('النطاق المخصص مستخدم بالفعل');
      }
      throw e;
    }
  }

  async getStoreById(user: { sub: string; role: string }, storeId: bigint) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        plan: true,
        owner: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    if (user.role !== 'admin' && store.ownerId !== BigInt(user.sub)) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذا المتجر');
    }

    return { success: true, data: store };
  }

  async getStoreBySubdomain(subdomain: string) {
    const store = await this.prisma.store.findUnique({
      where: { subdomain },
      include: { plan: true, owner: { select: { id: true, name: true } } },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');
    if (!store.isActive) throw new NotFoundException('المتجر غير متاح');

    return { success: true, data: store };
  }

  async checkSubdomain(subdomain: string) {
    const s = (subdomain || '').toLowerCase();
    const exists = await this.prisma.store.findFirst({ where: { subdomain: s } });
    return { success: true, data: { subdomain: s, available: !exists } };
  }

  async getMyStores(user: { sub: string; role: string }) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role !== 'merchant' && user.role !== 'admin')
      throw new ForbiddenException('فقط التاجر');

    const ownerId = BigInt(user.sub);
    const stores = await this.prisma.store.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    return { success: true, data: stores };
  }

  private async assertStoreLimit(ownerId: bigint, plan: any) {
    const count = await this.prisma.store.count({ where: { ownerId } });
    const features = (plan?.features || {}) as any;
    if (features?.maxStores === null) return;
    const maxStores = features?.maxStores === undefined ? 1 : Number(features.maxStores);

    if (count >= maxStores) {
      throw new BadRequestException(`خطتك الحالية تسمح بـ ${maxStores} متجر فقط. يرجى الترقية`);
    }
  }
}
