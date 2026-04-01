import { Module } from '@nestjs/common';

import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRedisService } from './cart.redis.service';

@Module({
  controllers: [CartController],
  providers: [CartService, CartRedisService],
  exports: [CartService],
})
export class CartModule {}
