import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

const ONBOARDING_STEPS = [
  {
    key: 'store_profile',
    labelAr: 'إكمال بيانات المتجر',
    labelEn: 'Complete store profile',
    route: '/dashboard/settings',
  },
  {
    key: 'payment_setup',
    labelAr: 'إعداد بوابة الدفع',
    labelEn: 'Set up payment gateway',
    route: '/dashboard/settings',
  },
  {
    key: 'shipping_setup',
    labelAr: 'إعداد الشحن',
    labelEn: 'Set up shipping',
    route: '/dashboard/shipping',
  },
  {
    key: 'first_product',
    labelAr: 'إضافة أول منتج',
    labelEn: 'Add first product',
    route: '/dashboard/products/new',
  },
  {
    key: 'first_campaign',
    labelAr: 'إطلاق أول حملة تسويقية',
    labelEn: 'Launch first campaign',
    route: '/dashboard/growth',
  },
  {
    key: 'domain_connect',
    labelAr: 'ربط النطاق المخصص',
    labelEn: 'Connect custom domain',
    route: '/dashboard/settings',
  },
] as const;

type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['key'];

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
          automation: {
            create: {
              abandonedCartEnabled: false,
              abandonedCartDelayMin: 60,
              abandonedCartChannels: ['sms'] as any,
              welcomeAutomationEnabled: false,
              lowStockAlertEnabled: true,
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

  async getOnboardingStatus(user: { sub: string; role: string }, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);

    const progress = await this.prisma.storeOnboardingStepProgress.findMany({
      where: { storeId },
    });
    const done = new Set(
      progress.filter((x) => x.isCompleted).map((x) => x.step as OnboardingStepKey)
    );
    const steps = ONBOARDING_STEPS.map((step) => ({
      ...step,
      completed: done.has(step.key),
    }));
    const completedCount = steps.filter((x) => x.completed).length;
    const completionRate = Math.round((completedCount / steps.length) * 100);
    const nextStep = steps.find((x) => !x.completed) || null;

    return {
      success: true,
      data: {
        steps,
        completedCount,
        totalSteps: steps.length,
        completionRate,
        nextStep,
      },
    };
  }

  async completeOnboardingStep(user: { sub: string; role: string }, storeId: bigint, step: string) {
    await this.assertStoreOwner(user, storeId);
    if (!ONBOARDING_STEPS.some((x) => x.key === step)) {
      throw new BadRequestException('خطوة غير مدعومة');
    }

    await this.prisma.storeOnboardingStepProgress.upsert({
      where: {
        storeId_step: {
          storeId,
          step: step as any,
        },
      },
      update: { isCompleted: true, completedAt: new Date() },
      create: { storeId, step: step as any, isCompleted: true, completedAt: new Date() },
    });

    return this.getOnboardingStatus(user, storeId);
  }

  async getAutomationSettings(user: { sub: string; role: string }, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const settings = await this.ensureAutomationSettings(storeId);
    return { success: true, data: settings };
  }

  async updateAutomationSettings(
    user: { sub: string; role: string },
    storeId: bigint,
    dto: UpdateAutomationDto
  ) {
    await this.assertStoreOwner(user, storeId);

    if (dto.abandonedCartChannels && dto.abandonedCartChannels.length === 0) {
      throw new BadRequestException('يجب اختيار قناة واحدة على الأقل');
    }

    const updated = await this.prisma.storeAutomationSettings.upsert({
      where: { storeId },
      update: {
        abandonedCartEnabled: dto.abandonedCartEnabled,
        abandonedCartDelayMin: dto.abandonedCartDelayMin,
        abandonedCartChannels: dto.abandonedCartChannels
          ? (dto.abandonedCartChannels as any)
          : undefined,
        welcomeAutomationEnabled: dto.welcomeAutomationEnabled,
        lowStockAlertEnabled: dto.lowStockAlertEnabled,
      },
      create: {
        storeId,
        abandonedCartEnabled: dto.abandonedCartEnabled ?? false,
        abandonedCartDelayMin: dto.abandonedCartDelayMin ?? 60,
        abandonedCartChannels: (dto.abandonedCartChannels ?? ['sms']) as any,
        welcomeAutomationEnabled: dto.welcomeAutomationEnabled ?? false,
        lowStockAlertEnabled: dto.lowStockAlertEnabled ?? true,
      },
    });

    return { success: true, message: 'تم حفظ إعدادات الأتمتة', data: updated };
  }

  async getAnalyticsOverview(
    user: { sub: string; role: string },
    storeId: bigint,
    daysInput: number
  ) {
    await this.assertStoreOwner(user, storeId);
    const days = Math.max(1, Math.min(365, Math.floor(daysInput || 30)));
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { storeId, createdAt: { gte: from } },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
            totalPrice: true,
          },
        },
      },
    });

    const nonCancelled = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded');
    const revenue = nonCancelled.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const ordersCount = orders.length;
    const avgOrderValue = nonCancelled.length ? revenue / nonCancelled.length : 0;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const cancelledCount = orders.filter(
      (o) => o.status === 'cancelled' || o.status === 'refunded'
    ).length;

    const byCustomer = new Map<string, number>();
    for (const o of orders) {
      const key = o.customerId.toString();
      byCustomer.set(key, (byCustomer.get(key) || 0) + 1);
    }
    const repeatCustomers = [...byCustomer.values()].filter((x) => x > 1).length;
    const repeatCustomerRate = byCustomer.size ? (repeatCustomers / byCustomer.size) * 100 : 0;

    const productStats = new Map<string, { quantity: number; revenue: number }>();
    for (const o of nonCancelled) {
      for (const item of o.items) {
        const key = item.productName;
        const prev = productStats.get(key) || { quantity: 0, revenue: 0 };
        prev.quantity += item.quantity;
        prev.revenue += Number(item.totalPrice);
        productStats.set(key, prev);
      }
    }
    const topProducts = [...productStats.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const dayMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of nonCancelled) {
      const key = o.createdAt.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) || 0) + Number(o.totalAmount));
    }

    return {
      success: true,
      data: {
        rangeDays: days,
        kpis: {
          revenue: round3(revenue),
          ordersCount,
          avgOrderValue: round3(avgOrderValue),
          deliveredCount,
          pendingCount,
          cancelledCount,
          repeatCustomerRate: Number(repeatCustomerRate.toFixed(1)),
        },
        dailySales: [...dayMap.entries()].map(([date, total]) => ({
          date,
          total: round3(total),
        })),
        topProducts,
      },
    };
  }

  private async ensureAutomationSettings(storeId: bigint) {
    return this.prisma.storeAutomationSettings.upsert({
      where: { storeId },
      update: {},
      create: {
        storeId,
        abandonedCartEnabled: false,
        abandonedCartDelayMin: 60,
        abandonedCartChannels: ['sms'] as any,
        welcomeAutomationEnabled: false,
        lowStockAlertEnabled: true,
      },
    });
  }

  private async assertStoreOwner(user: { sub: string; role: string }, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role === 'admin') return;
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');
    if (store.ownerId !== BigInt(user.sub)) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذا المتجر');
    }
  }

  private async assertStoreLimit(ownerId: bigint, plan: any) {
    const count = await this.prisma.store.count({ where: { ownerId } });
    const features = (plan?.features || {}) as any;
    if (features?.maxStores === null) return;
    const maxStores = features?.maxStores === undefined ? 1 : Number(features.maxStores);
    if (!Number.isFinite(maxStores) || maxStores < 0) {
      throw new BadRequestException('إعدادات الخطة غير صحيحة');
    }

    if (count >= maxStores) {
      throw new BadRequestException(`خطتك الحالية تسمح بـ ${maxStores} متجر فقط. يرجى الترقية`);
    }
  }
}

function round3(v: number) {
  return Number(v.toFixed(3));
}
