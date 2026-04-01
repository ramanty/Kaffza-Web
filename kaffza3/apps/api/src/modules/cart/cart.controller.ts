import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { CartItemDto } from './dto/cart-item.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';

@ApiTags('Cart')
@Controller('stores/:storeId/cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    return this.cart.getCart(user, this.toBigInt(storeId));
  }

  @Post('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  add(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: CartItemDto) {
    return this.cart.addItem(user, this.toBigInt(storeId), { productId: dto.productId, variantId: dto.variantId, quantity: dto.quantity });
  }

  @Patch('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateQty(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: UpdateQuantityDto) {
    return this.cart.updateQuantity(user, this.toBigInt(storeId), { productId: dto.productId, variantId: dto.variantId, quantity: dto.quantity });
  }

  @Delete('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: any, @Param('storeId') storeId: string, @Query('productId') productId: string, @Query('variantId') variantId?: string) {
    if (!productId) throw new BadRequestException('productId مطلوب');
    return this.cart.removeItem(user, this.toBigInt(storeId), productId, variantId);
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('معرّف غير صالح');
    }
  }
}
