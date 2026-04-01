import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateQuantityDto {
  @ApiProperty({ example: '1' })
  productId: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
