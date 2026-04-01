import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CartItemDto {
  @ApiProperty({ example: '1' })
  productId: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
