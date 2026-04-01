import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ShipmentStatusDto {
  pending = 'pending',
  picked_up = 'picked_up',
  in_transit = 'in_transit',
  out_for_delivery = 'out_for_delivery',
  delivered = 'delivered',
  returned = 'returned',
  failed = 'failed',
}

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: ShipmentStatusDto })
  @IsEnum(ShipmentStatusDto)
  status: ShipmentStatusDto;
}
