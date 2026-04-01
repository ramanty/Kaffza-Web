import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum OrderStatusDto {
  pending = 'pending',
  confirmed = 'confirmed',
  processing = 'processing',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled',
  refunded = 'refunded',
}

export class UpdateStatusDto {
  @ApiProperty({ enum: OrderStatusDto })
  @IsEnum(OrderStatusDto)
  status: OrderStatusDto;
}
