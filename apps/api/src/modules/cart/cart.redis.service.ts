import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CartRedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('redis.host') || process.env.REDIS_HOST || 'localhost';
    const port = this.config.get<number>('redis.port') || Number(process.env.REDIS_PORT || 6379);
    const password = this.config.get<string>('redis.password') || process.env.REDIS_PASSWORD || undefined;

    this.client = new Redis({ host, port, password, lazyConnect: true, maxRetriesPerRequest: 2 });
    this.client.connect().catch(() => undefined);
  }

  get(key: string) {
    return this.client.get(key);
  }

  set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) return this.client.set(key, value, 'EX', ttlSeconds);
    return this.client.set(key, value);
  }

  del(key: string) {
    return this.client.del(key);
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      // ignore
    }
  }
}
