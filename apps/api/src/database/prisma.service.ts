import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    const maxAttempts = 10;
    const retryDelayMs = 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.$use(async (params, next) => {
          if (['User', 'Store', 'Product'].includes(params.model || '')) {
            if (params.action === 'findUnique' || params.action === 'findFirst') {
              params.action = 'findFirst';
              params.args.where = { ...params.args.where, deletedAt: null };
            }
            if (params.action === 'findMany') {
              if (params.args.where) {
                if (params.args.where.deletedAt === undefined) {
                  params.args.where.deletedAt = null;
                }
              } else {
                params.args.where = { deletedAt: null };
              }
            }
          }
          return next(params);
        });
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        console.warn(
          `[PrismaService] Database connection attempt ${attempt}/${maxAttempts} failed, retrying in ${retryDelayMs}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
