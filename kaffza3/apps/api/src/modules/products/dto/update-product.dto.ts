import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';

import { VariantDto } from './variant.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 200)
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 200)
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 10.0 })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 12.0 })
  @IsOptional()
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ type: [String] })
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
  isActive?: boolean;

  @ApiPropertyOptional({ type: [VariantDto], description: 'Upsert variants (id optional). Missing existing ids will be deleted.' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];
}
