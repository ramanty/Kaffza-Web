import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShippingService } from './shipping.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

@ApiTags('Shipping')
@Controller()
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Post('stores/:storeId/shipments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: CreateShipmentDto) {
    return this.shipping.createShipment(user, BigInt(storeId), BigInt(dto.orderId));
  }

  

// Merchant dashboard: list shipments for a store
@Get('stores/:storeId/shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
listStore(@CurrentUser() user: any, @Param('storeId') storeId: string, @Query('page') page = '1', @Query('limit') limit = '20') {
  return this.shipping.listStoreShipments(user, BigInt(storeId), Number(page) || 1, Math.min(50, Number(limit) || 20));
}

// Merchant dashboard: update shipment status by shipmentId (uses simplified statuses)
@Patch('stores/:storeId/shipping/:shipmentId/status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
updateStatusById(@CurrentUser() user: any, @Param('storeId') storeId: string, @Param('shipmentId') shipmentId: string, @Body() dto: UpdateShipmentStatusDto) {
  return this.shipping.updateStatusById(user, BigInt(storeId), BigInt(shipmentId), dto.status);
}

@Get('shipments/track/:trackingNumber')
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.shipping.track(trackingNumber);
  }

  @Patch('shipments/:trackingNumber/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateStatus(@CurrentUser() user: any, @Param('trackingNumber') trackingNumber: string, @Body() dto: UpdateShipmentStatusDto) {
    return this.shipping.updateStatus(user, trackingNumber, dto.status);
  }
}
