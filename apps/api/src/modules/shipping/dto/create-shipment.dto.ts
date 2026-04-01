import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;
}
