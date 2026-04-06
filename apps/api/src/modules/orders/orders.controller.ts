import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('stores/:storeId/orders/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user, this.toBigInt(storeId), dto);
  }

  @Get('stores/:storeId/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listStore(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    return this.orders.listStoreOrders(user, this.toBigInt(storeId));
  }

  @Get('orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listMy(@CurrentUser() user: any, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.orders.listMyOrdersPaginated(
      user,
      Number(page) || 1,
      Math.min(50, Number(limit) || 10)
    );
  }

  @Get('orders/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orders.getOrder(user, this.toBigInt(orderId));
  }

  @Patch('stores/:storeId/orders/:orderId/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateStatusDto
  ) {
    return this.orders.updateStatus(
      user,
      this.toBigInt(storeId),
      this.toBigInt(orderId),
      dto.status
    );
  }

  @Post('orders/:orderId/confirm-receipt')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  confirm(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orders.confirmReceipt(user, this.toBigInt(orderId));
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('معرّف غير صالح');
    }
  }
}
