import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';

import { VariantDto } from './variant.dto';

export class CreateProductDto {
  @ApiPropertyOptional({ example: 1, description: 'Category ID' })
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ example: 'منتج' })
  @IsString()
  @Length(2, 200)
  nameAr: string;

  @ApiProperty({ example: 'Product' })
  @IsString()
  @Length(2, 200)
  nameEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ example: 10.0 })
  price: number;

  @ApiPropertyOptional({ example: 12.0 })
  @IsOptional()
  compareAtPrice?: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ type: [String], example: ['https://...'] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  sku?: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ type: [VariantDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];
}
