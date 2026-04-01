import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;
}
