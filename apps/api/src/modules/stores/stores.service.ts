import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as dns from 'dns';

import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';
import { UpdateShippingSettingsDto } from './dto/update-shipping-settings.dto';
import {
  normalizePaymentSettings,
  normalizeShippingSettings,
  validatePaymentSettings,
  validateShippingSettings,
} from './store-settings.util';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

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
type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService
  ) {}

  async createStore(user: { sub: string; role: string }, dto: CreateStoreDto) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');

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
          paymentSettings: normalizePaymentSettings(null) as any,
          shippingSettings: normalizeShippingSettings(null) as any,
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
              abandonedCartDiscountEnabled: false,
              abandonedCartDiscountPercent: 10,
              reminderCadencePreset: 'standard',
              campaignScheduleMode: 'manual',
              campaignTimezone: 'Asia/Muscat',
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

      await this.prisma.user.update({
        where: { id: ownerId },
        data: { role: 'merchant' }
      });

      const tokens = await this.authService.generateUserTokens(ownerId);

      return { success: true, message: 'تم إنشاء المتجر بنجاح', data: { store, tokens } };
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

  async verifyAndSaveDomain(user: { sub: string; role: string }, storeId: bigint, customDomain: string) {
    await this.assertStoreOwner(user, storeId);
    
    let domain = customDomain.trim().toLowerCase();
    if (domain.startsWith('http://')) domain = domain.replace('http://', '');
    if (domain.startsWith('https://')) domain = domain.replace('https://', '');
    if (domain.startsWith('www.')) domain = domain.replace('www.', '');

    try {
      const records = await dns.promises.resolveCname(domain);
      const target = 'shops.kaffza.me';
      
      const isValid = records.some(r => r.toLowerCase() === target || r.toLowerCase() === target + '.');
      if (!isValid) {
        throw new BadRequestException(`لم يتم العثور على CNAME يوجه إلى ${target}`);
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('فشل التحقق من إعدادات DNS. يرجى التأكد من إضافة CNAME Record يشير إلى shops.kaffza.me');
    }

    try {
      const updated = await this.prisma.store.update({
        where: { id: storeId },
        data: { customDomain: domain },
      });
      return { success: true, message: 'تم التحقق من الدومين وحفظه بنجاح', data: updated };
    } catch (e: any) {
      if (String(e?.code) === 'P2002') {
        throw new BadRequestException('النطاق المخصص مستخدم بالفعل بواسطة متجر آخر');
      }
      throw e;
    }
  }

  async remove(user: { sub: string; role: string }, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);

    await this.prisma.store.update({
      where: { id: storeId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { success: true, message: 'تم حذف المتجر بنجاح' };
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

    return {
      success: true,
      data: {
        ...store,
        paymentSettings: normalizePaymentSettings(store.paymentSettings),
        shippingSettings: normalizeShippingSettings(store.shippingSettings),
      },
    };
  }

  async getPaymentSettings(user: { sub: string; role: string }, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { paymentSettings: true },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    return { success: true, data: normalizePaymentSettings(store.paymentSettings) };
  }

  async updatePaymentSettings(
    user: { sub: string; role: string },
    storeId: bigint,
    dto: UpdatePaymentSettingsDto
  ) {
    await this.assertStoreOwner(user, storeId);

    const current = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { paymentSettings: true },
    });
    if (!current) throw new NotFoundException('المتجر غير موجود');

    const next = normalizePaymentSettings({
      ...normalizePaymentSettings(current.paymentSettings),
      ...dto,
    });

    try {
      validatePaymentSettings(next);
    } catch (e: any) {
      throw new BadRequestException(e?.message || 'إعدادات الدفع غير صحيحة');
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { paymentSettings: next as any },
      select: { paymentSettings: true },
    });

    await this.auditService.log({
      userId: BigInt(user.sub),
      action: 'PAYMENT_SETTINGS_UPDATED',
      entity: 'Store',
      entityId: storeId,
      details: { ...next },
    });

    return {
      success: true,
      message: 'تم حفظ إعدادات الدفع',
      data: normalizePaymentSettings(updated.paymentSettings),
    };
  }

  async getShippingSettings(user: { sub: string; role: string }, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { shippingSettings: true },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    return { success: true, data: normalizeShippingSettings(store.shippingSettings) };
  }

  async updateShippingSettings(
    user: { sub: string; role: string },
    storeId: bigint,
    dto: UpdateShippingSettingsDto
  ) {
    await this.assertStoreOwner(user, storeId);

    const current = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { shippingSettings: true },
    });
    if (!current) throw new NotFoundException('المتجر غير موجود');

    const next = normalizeShippingSettings({
      ...normalizeShippingSettings(current.shippingSettings),
      ...dto,
    });

    try {
      validateShippingSettings(next);
    } catch (e: any) {
      throw new BadRequestException(e?.message || 'إعدادات الشحن غير صحيحة');
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { shippingSettings: next as any },
      select: { shippingSettings: true },
    });

    await this.auditService.log({
      userId: BigInt(user.sub),
      action: 'SHIPPING_SETTINGS_UPDATED',
      entity: 'Store',
      entityId: storeId,
      details: { ...next },
    });

    return {
      success: true,
      message: 'تم حفظ إعدادات الشحن',
      data: normalizeShippingSettings(updated.shippingSettings),
    };
  }

  async getStoreBySubdomain(subdomain: string) {
    const store = await this.prisma.store.findUnique({
      where: { subdomain },
      include: { plan: true, owner: { select: { id: true, name: true } } },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');
    if (!store.isActive) throw new NotFoundException('المتجر غير متاح');

    return {
      success: true,
      data: {
        ...store,
        paymentSettings: normalizePaymentSettings(store.paymentSettings),
        shippingSettings: normalizeShippingSettings(store.shippingSettings),
      },
    };
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
    if (dto.campaignTimezone && dto.campaignTimezone.length > 100) {
      throw new BadRequestException('المنطقة الزمنية طويلة جداً');
    }

    const updated = await this.prisma.storeAutomationSettings.upsert({
      where: { storeId },
      update: {
        abandonedCartEnabled: dto.abandonedCartEnabled,
        abandonedCartDelayMin: dto.abandonedCartDelayMin,
        abandonedCartChannels: dto.abandonedCartChannels
          ? (dto.abandonedCartChannels as any)
          : undefined,
        abandonedCartDiscountEnabled: dto.abandonedCartDiscountEnabled,
        abandonedCartDiscountPercent: dto.abandonedCartDiscountPercent,
        reminderCadencePreset: dto.reminderCadencePreset,
        campaignScheduleMode: dto.campaignScheduleMode,
        campaignTimezone: dto.campaignTimezone,
        welcomeAutomationEnabled: dto.welcomeAutomationEnabled,
        lowStockAlertEnabled: dto.lowStockAlertEnabled,
      },
      create: {
        storeId,
        abandonedCartEnabled: dto.abandonedCartEnabled ?? false,
        abandonedCartDelayMin: dto.abandonedCartDelayMin ?? 60,
        abandonedCartChannels: (dto.abandonedCartChannels ?? ['sms']) as any,
        abandonedCartDiscountEnabled: dto.abandonedCartDiscountEnabled ?? false,
        abandonedCartDiscountPercent: dto.abandonedCartDiscountPercent ?? 10,
        reminderCadencePreset: dto.reminderCadencePreset ?? 'standard',
        campaignScheduleMode: dto.campaignScheduleMode ?? 'manual',
        campaignTimezone: dto.campaignTimezone ?? 'Asia/Muscat',
        welcomeAutomationEnabled: dto.welcomeAutomationEnabled ?? false,
        lowStockAlertEnabled: dto.lowStockAlertEnabled ?? true,
      },
    });

    return { success: true, message: 'تم حفظ إعدادات الأتمتة', data: updated };
  }

  async listCampaigns(user: { sub: string; role: string }, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const campaigns = await this.prisma.storeCampaign.findMany({
      where: { storeId },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    });
    return {
      success: true,
      data: campaigns.map((campaign) => ({
        ...campaign,
        discountPercent: campaign.discountPercent ?? null,
      })),
    };
  }

  async createCampaign(
    user: { sub: string; role: string },
    storeId: bigint,
    dto: CreateCampaignDto
  ) {
    await this.assertStoreOwner(user, storeId);
    const nameAr = dto.nameAr?.trim();
    const nameEn = dto.nameEn?.trim();
    if (!nameAr || !nameEn) {
      throw new BadRequestException('اسم الحملة مطلوب بالعربية والإنجليزية');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (startsAt && endsAt && endsAt < startsAt) {
      throw new BadRequestException('تاريخ نهاية الحملة يجب أن يكون بعد تاريخ البداية');
    }

    const automation = await this.ensureAutomationSettings(storeId);
    const defaultStatus: CampaignStatus =
      dto.status ??
      (automation.campaignScheduleMode === 'scheduled' || scheduledAt ? 'scheduled' : 'draft');

    const created = await this.prisma.storeCampaign.create({
      data: {
        storeId,
        nameAr,
        nameEn,
        objective: (dto.objective || 'sales_boost').trim(),
        channel: (dto.channel || 'sms') as any,
        audience: (dto.audience || 'all_customers') as any,
        status: defaultStatus as any,
        discountPercent: dto.discountPercent,
        reminderCadencePreset: dto.reminderCadencePreset || automation.reminderCadencePreset,
        scheduledAt,
        startsAt,
        endsAt,
      },
    });

    return { success: true, message: 'تم إنشاء الحملة', data: created };
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
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - days);

    const [orders, previousPeriodOrders] = await Promise.all([
      this.prisma.order.findMany({
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
      }),
      this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: prevFrom, lt: from } },
        include: { items: { select: { quantity: true, totalPrice: true } } },
      }),
    ]);

    const nonCancelled = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded');
    const revenue = nonCancelled.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const ordersCount = orders.length;
    const avgOrderValue = nonCancelled.length ? revenue / nonCancelled.length : 0;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const cancelledCount = orders.filter(
      (o) => o.status === 'cancelled' || o.status === 'refunded'
    ).length;
    const confirmedLikeCount = orders.filter((o) =>
      ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status)
    ).length;
    const statusCounts = {
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: deliveredCount,
      cancelled: cancelledCount,
    };

    const byCustomer = new Map<string, number>();
    for (const o of orders) {
      const key = o.customerId.toString();
      byCustomer.set(key, (byCustomer.get(key) || 0) + 1);
    }
    const repeatCustomers = [...byCustomer.values()].filter((x) => x > 1).length;
    const repeatCustomerRate = byCustomer.size ? (repeatCustomers / byCustomer.size) * 100 : 0;
    const repeatOrdersCount = orders.reduce((sum, o) => {
      const key = o.customerId.toString();
      return sum + ((byCustomer.get(key) || 0) > 1 ? 1 : 0);
    }, 0);
    const totalItemsSold = nonCancelled.reduce(
      (sum, o) => sum + o.items.reduce((x, item) => x + item.quantity, 0),
      0
    );
    const avgItemsPerOrder = nonCancelled.length ? totalItemsSold / nonCancelled.length : 0;
    const checkoutCompletionProxyRate = ordersCount ? (confirmedLikeCount / ordersCount) * 100 : 0;
    const deliverySuccessRate = nonCancelled.length
      ? (deliveredCount / nonCancelled.length) * 100
      : 0;
    const cancellationRate = ordersCount ? (cancelledCount / ordersCount) * 100 : 0;

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
    const dailyOrderCountMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      dailyOrderCountMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      dailyOrderCountMap.set(key, (dailyOrderCountMap.get(key) || 0) + 1);
    }

    const prevNonCancelled = previousPeriodOrders.filter(
      (o) => o.status !== 'cancelled' && o.status !== 'refunded'
    );
    const prevRevenue = prevNonCancelled.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const prevOrdersCount = previousPeriodOrders.length;
    const prevAvgOrderValue = prevNonCancelled.length ? prevRevenue / prevNonCancelled.length : 0;
    const prevByCustomer = new Map<string, number>();
    for (const o of previousPeriodOrders) {
      const key = o.customerId.toString();
      prevByCustomer.set(key, (prevByCustomer.get(key) || 0) + 1);
    }
    const prevRepeatCustomers = [...prevByCustomer.values()].filter((x) => x > 1).length;
    const prevRepeatCustomerRate = prevByCustomer.size
      ? (prevRepeatCustomers / prevByCustomer.size) * 100
      : 0;

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
          uniqueCustomers: byCustomer.size,
          repeatCustomers,
          repeatOrdersCount,
          returningOrdersShare: Number(
            (ordersCount ? (repeatOrdersCount / ordersCount) * 100 : 0).toFixed(1)
          ),
          checkoutCompletionProxyRate: Number(checkoutCompletionProxyRate.toFixed(1)),
          deliverySuccessRate: Number(deliverySuccessRate.toFixed(1)),
          cancellationRate: Number(cancellationRate.toFixed(1)),
          avgItemsPerOrder: Number(avgItemsPerOrder.toFixed(2)),
          repeatCustomerRate: Number(repeatCustomerRate.toFixed(1)),
        },
        dailySales: [...dayMap.entries()].map(([date, total]) => ({
          date,
          total: round3(total),
        })),
        dailyOrders: [...dailyOrderCountMap.entries()].map(([date, count]) => ({
          date,
          count,
        })),
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percent: Number((ordersCount ? (count / ordersCount) * 100 : 0).toFixed(1)),
        })),
        trendComparison: {
          revenueDeltaPercent: calcDeltaPercent(revenue, prevRevenue),
          ordersDeltaPercent: calcDeltaPercent(ordersCount, prevOrdersCount),
          avgOrderValueDeltaPercent: calcDeltaPercent(avgOrderValue, prevAvgOrderValue),
          repeatRateDeltaPercent: calcDeltaPercent(repeatCustomerRate, prevRepeatCustomerRate),
        },
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
        abandonedCartDiscountEnabled: false,
        abandonedCartDiscountPercent: 10,
        reminderCadencePreset: 'standard',
        campaignScheduleMode: 'manual',
        campaignTimezone: 'Asia/Muscat',
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

function calcDeltaPercent(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
