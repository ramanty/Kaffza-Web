import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash, createHmac, randomBytes } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import {
  INTEGRATION_EVENT_DB_MAP,
  INTEGRATION_EVENT_NAME_MAP,
  INTEGRATION_EVENT_TYPES,
  IntegrationEventType,
} from './integrations.constants';

const WEBHOOK_TIMEOUT_MS = 5000;
const MAX_DELIVERY_ATTEMPTS = 5;

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  listSupportedEvents() {
    return {
      success: true,
      data: INTEGRATION_EVENT_TYPES.map((event) => ({
        code: event,
        labelAr: this.labelAr(event),
        labelEn: this.labelEn(event),
      })),
    };
  }

  async listWebhooks(user: any, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const hooks = await this.prisma.storeWebhookEndpoint.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: hooks.map((hook) => this.webhookResponse(hook)),
    };
  }

  async createWebhook(user: any, storeId: bigint, dto: any) {
    await this.assertStoreOwner(user, storeId);
    const secret = dto.secret?.trim() || this.generateWebhookSecret();
    const events = this.normalizeEvents(dto.events);

    const created = await this.prisma.storeWebhookEndpoint.create({
      data: {
        storeId,
        name: dto.name.trim(),
        url: this.validateWebhookUrl(dto.url),
        secret,
        events: events as any,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      success: true,
      message: 'تم إنشاء Webhook endpoint',
      data: {
        ...this.webhookResponse(created),
        secret,
      },
    };
  }

  async updateWebhook(user: any, storeId: bigint, webhookId: bigint, dto: any) {
    await this.assertStoreOwner(user, storeId);
    await this.assertWebhookExists(storeId, webhookId);

    const updated = await this.prisma.storeWebhookEndpoint.update({
      where: { id: webhookId },
      data: {
        name: dto.name?.trim(),
        url: dto.url ? this.validateWebhookUrl(dto.url) : undefined,
        events: dto.events ? (this.normalizeEvents(dto.events) as any) : undefined,
        isActive: dto.isActive,
      },
    });

    return { success: true, message: 'تم تحديث Webhook', data: this.webhookResponse(updated) };
  }

  async deleteWebhook(user: any, storeId: bigint, webhookId: bigint) {
    await this.assertStoreOwner(user, storeId);
    await this.assertWebhookExists(storeId, webhookId);
    await this.prisma.storeWebhookEndpoint.delete({ where: { id: webhookId } });
    return { success: true, message: 'تم حذف Webhook endpoint' };
  }

  async rotateWebhookSecret(user: any, storeId: bigint, webhookId: bigint) {
    await this.assertStoreOwner(user, storeId);
    await this.assertWebhookExists(storeId, webhookId);

    const secret = this.generateWebhookSecret();
    await this.prisma.storeWebhookEndpoint.update({ where: { id: webhookId }, data: { secret } });

    return {
      success: true,
      message: 'تم تدوير webhook secret',
      data: { webhookId: webhookId.toString(), secret },
    };
  }

  async listApiKeys(user: any, storeId: bigint) {
    await this.assertStoreOwner(user, storeId);
    const keys = await this.prisma.storeIntegrationApiKey.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: keys.map((k) => ({
        id: k.id.toString(),
        name: k.name,
        keyPrefix: k.keyPrefix,
        isActive: k.isActive,
        revokedAt: k.revokedAt,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      })),
    };
  }

  async createApiKey(user: any, storeId: bigint, dto: { name: string }) {
    await this.assertStoreOwner(user, storeId);
    const token = this.generateApiKeyToken();
    const created = await this.prisma.storeIntegrationApiKey.create({
      data: {
        storeId,
        name: dto.name.trim(),
        keyPrefix: this.apiKeyPrefix(token),
        keyHash: this.hashApiKey(token),
        isActive: true,
      },
    });

    return {
      success: true,
      message: 'تم إنشاء API Key',
      data: {
        id: created.id.toString(),
        name: created.name,
        keyPrefix: created.keyPrefix,
        apiKey: token,
        createdAt: created.createdAt,
      },
    };
  }

  async rotateApiKey(user: any, storeId: bigint, keyId: bigint) {
    await this.assertStoreOwner(user, storeId);
    await this.assertApiKeyExists(storeId, keyId);
    const token = this.generateApiKeyToken();

    const rotated = await this.prisma.storeIntegrationApiKey.update({
      where: { id: keyId },
      data: {
        keyPrefix: this.apiKeyPrefix(token),
        keyHash: this.hashApiKey(token),
        isActive: true,
        revokedAt: null,
      },
    });

    return {
      success: true,
      message: 'تم تدوير API Key',
      data: {
        id: rotated.id.toString(),
        keyPrefix: rotated.keyPrefix,
        apiKey: token,
      },
    };
  }

  async revokeApiKey(user: any, storeId: bigint, keyId: bigint) {
    await this.assertStoreOwner(user, storeId);
    await this.assertApiKeyExists(storeId, keyId);

    await this.prisma.storeIntegrationApiKey.update({
      where: { id: keyId },
      data: { isActive: false, revokedAt: new Date() },
    });

    return { success: true, message: 'تم إيقاف API Key' };
  }

  async emitEvent(storeId: bigint, eventType: IntegrationEventType, payload: unknown) {
    try {
      await this.prisma.integrationEvent.create({
        data: {
          storeId,
          eventType: INTEGRATION_EVENT_DB_MAP[eventType] as any,
          payload: payload as any,
          status: 'pending' as any,
          nextAttemptAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to enqueue integration event ${eventType}: ${(error as Error).message}`
      );
    }
  }

  @Cron('*/20 * * * * *')
  async dispatchDueEvents() {
    const now = new Date();
    const events = await this.prisma.integrationEvent.findMany({
      where: {
        status: { in: ['pending', 'processing'] as any },
        nextAttemptAt: { lte: now },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    for (const event of events) {
      await this.processEvent(event as any);
    }
  }

  private async processEvent(event: {
    id: bigint;
    storeId: bigint;
    eventType: string;
    payload: any;
    attempts: number;
  }) {
    const eventType = INTEGRATION_EVENT_NAME_MAP[event.eventType] as
      | IntegrationEventType
      | undefined;
    if (!eventType) {
      await this.prisma.integrationEvent.update({
        where: { id: event.id },
        data: { status: 'failed' as any, lastError: `Unknown event type ${event.eventType}` },
      });
      return;
    }

    await this.prisma.integrationEvent.update({
      where: { id: event.id },
      data: { status: 'processing' as any, attempts: { increment: 1 } },
    });

    const endpoints = await this.prisma.storeWebhookEndpoint.findMany({
      where: { storeId: event.storeId, isActive: true },
    });

    const matching = endpoints.filter((endpoint) => {
      const configured = Array.isArray(endpoint.events) ? (endpoint.events as string[]) : [];
      return configured.length === 0 || configured.includes(eventType);
    });

    if (!matching.length) {
      await this.prisma.integrationEvent.update({
        where: { id: event.id },
        data: { status: 'delivered' as any, processedAt: new Date(), lastError: null },
      });
      return;
    }

    const failures: string[] = [];
    for (const endpoint of matching) {
      const delivery = await this.sendWebhook(endpoint, eventType, {
        eventId: event.id,
        storeId: event.storeId,
        data: event.payload,
      });

      await this.prisma.integrationEventDelivery.create({
        data: {
          eventId: event.id,
          endpointId: endpoint.id,
          status: delivery.ok ? 'success' : 'failed',
          attempt: event.attempts + 1,
          httpStatus: delivery.httpStatus,
          error: delivery.error,
        },
      });

      if (!delivery.ok) {
        failures.push(`${endpoint.url}: ${delivery.error || `HTTP ${delivery.httpStatus || 0}`}`);
      }
    }

    if (!failures.length) {
      await this.prisma.integrationEvent.update({
        where: { id: event.id },
        data: { status: 'delivered' as any, processedAt: new Date(), lastError: null },
      });
      return;
    }

    const attempts = event.attempts + 1;
    if (attempts >= MAX_DELIVERY_ATTEMPTS) {
      await this.prisma.integrationEvent.update({
        where: { id: event.id },
        data: {
          status: 'failed' as any,
          processedAt: new Date(),
          lastError: failures.join(' | ').slice(0, 2000),
        },
      });
      return;
    }

    const backoffSeconds = Math.min(600, Math.pow(2, attempts) * 15);
    await this.prisma.integrationEvent.update({
      where: { id: event.id },
      data: {
        status: 'pending' as any,
        nextAttemptAt: new Date(Date.now() + backoffSeconds * 1000),
        lastError: failures.join(' | ').slice(0, 2000),
      },
    });
  }

  private async sendWebhook(
    endpoint: { id: bigint; url: string; secret: string },
    eventType: IntegrationEventType,
    payload: { eventId: bigint; storeId: bigint; data: any }
  ): Promise<{ ok: boolean; httpStatus?: number; error?: string }> {
    const body = {
      id: payload.eventId.toString(),
      event: eventType,
      storeId: payload.storeId.toString(),
      createdAt: new Date().toISOString(),
      data: payload.data,
    };
    const bodyRaw = JSON.stringify(body);
    const timestamp = Date.now().toString();
    const signature = createHmac('sha256', endpoint.secret)
      .update(`${timestamp}.${bodyRaw}`)
      .digest('hex');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        body: bodyRaw,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-kaffza-event': eventType,
          'x-kaffza-signature': signature,
          'x-kaffza-signature-algorithm': 'sha256',
          'x-kaffza-timestamp': timestamp,
        },
      });

      if (!response.ok) {
        return {
          ok: false,
          httpStatus: response.status,
          error: `HTTP ${response.status}`,
        };
      }

      await this.prisma.storeWebhookEndpoint.update({
        where: { id: endpoint.id },
        data: { lastDeliveryAt: new Date() },
      });

      return { ok: true, httpStatus: response.status };
    } catch (error) {
      return {
        ok: false,
        error: (error as Error).name === 'AbortError' ? 'Timeout' : (error as Error).message,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private webhookResponse(hook: any) {
    return {
      id: hook.id.toString(),
      storeId: hook.storeId.toString(),
      name: hook.name,
      url: hook.url,
      events: hook.events,
      isActive: hook.isActive,
      lastDeliveryAt: hook.lastDeliveryAt,
      createdAt: hook.createdAt,
      updatedAt: hook.updatedAt,
    };
  }

  private normalizeEvents(events?: string[]) {
    if (!events || events.length === 0) return [...INTEGRATION_EVENT_TYPES];
    const normalized = events
      .map((event) => event.trim())
      .filter((event): event is IntegrationEventType =>
        (INTEGRATION_EVENT_TYPES as readonly string[]).includes(event)
      );
    if (!normalized.length) {
      throw new BadRequestException('قائمة events غير مدعومة');
    }
    return [...new Set(normalized)];
  }

  private validateWebhookUrl(url: string) {
    const clean = (url || '').trim();
    let parsed: URL;
    try {
      parsed = new URL(clean);
    } catch {
      throw new BadRequestException('Webhook URL غير صالح');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException('Webhook URL يجب أن يبدأ بـ http أو https');
    }

    return clean;
  }

  private generateWebhookSecret() {
    return randomBytes(32).toString('hex');
  }

  private generateApiKeyToken() {
    return `kfz_live_${randomBytes(24).toString('hex')}`;
  }

  private apiKeyPrefix(token: string) {
    return token.slice(0, 12);
  }

  private hashApiKey(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async assertWebhookExists(storeId: bigint, webhookId: bigint) {
    const hook = await this.prisma.storeWebhookEndpoint.findFirst({
      where: { id: webhookId, storeId },
      select: { id: true },
    });
    if (!hook) throw new NotFoundException('Webhook endpoint غير موجود');
  }

  private async assertApiKeyExists(storeId: bigint, keyId: bigint) {
    const key = await this.prisma.storeIntegrationApiKey.findFirst({
      where: { id: keyId, storeId },
      select: { id: true },
    });
    if (!key) throw new NotFoundException('API Key غير موجود');
  }

  private async assertStoreOwner(user: { sub?: string; role?: string }, storeId: bigint) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role === 'admin') return;
    if (user.role !== 'merchant') throw new ForbiddenException('فقط التاجر');

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');
    if (store.ownerId !== BigInt(user.sub)) {
      throw new ForbiddenException('ليس لديك صلاحية');
    }
  }

  private labelAr(event: IntegrationEventType) {
    const map: Record<IntegrationEventType, string> = {
      'order.created': 'إنشاء طلب',
      'order.updated': 'تحديث طلب',
      'payment.status_changed': 'تغيير حالة الدفع',
      'product.created': 'إنشاء منتج',
      'product.updated': 'تحديث منتج',
      'customer.created': 'عميل جديد',
    };
    return map[event];
  }

  private labelEn(event: IntegrationEventType) {
    const map: Record<IntegrationEventType, string> = {
      'order.created': 'Order created',
      'order.updated': 'Order updated',
      'payment.status_changed': 'Payment status changed',
      'product.created': 'Product created',
      'product.updated': 'Product updated',
      'customer.created': 'Customer created',
    };
    return map[event];
  }
}
