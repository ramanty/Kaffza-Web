import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('redis.host') || process.env.REDIS_HOST || 'localhost';
    const port = this.config.get<number>('redis.port') || Number(process.env.REDIS_PORT || 6379);
    const password = this.config.get<string>('redis.password') || process.env.REDIS_PASSWORD || undefined;

    this.client = new Redis({ host, port, password, lazyConnect: true, maxRetriesPerRequest: 2 });
    this.client.connect().catch(() => undefined);
  }

  set(key: string, value: string, ttlSeconds?: number) {
    return ttlSeconds ? this.client.set(key, value, 'EX', ttlSeconds) : this.client.set(key, value);
  }

  get(key: string) {
    return this.client.get(key);
  }

  del(key: string) {
    return this.client.del(key);
  }

  incr(key: string) {
    return this.client.incr(key);
  }

  expire(key: string, ttlSeconds: number) {
    return this.client.expire(key, ttlSeconds);
  }

  ttl(key: string) {
    return this.client.ttl(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
      cursor = nextCursor;
      if (keys.length) {
        const res = await (this.client as any).unlink?.(...keys);
        if (typeof res === 'number') deleted += res;
        else deleted += await this.client.del(...keys);
      }
    } while (cursor !== '0');
    return deleted;
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      // ignore
    }
  }
}
