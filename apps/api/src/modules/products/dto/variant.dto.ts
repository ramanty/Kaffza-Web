import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class VariantDto {
  @ApiPropertyOptional({ description: 'Variant ID (عند التعديل فقط)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'أحمر - XL' })
  @IsString()
  @Length(1, 100)
  nameAr: string;

  @ApiProperty({ example: 'Red - XL' })
  @IsString()
  @Length(1, 100)
  nameEn: string;

  @ApiProperty({ example: 10.5 })
  price: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'SKU-RED-XL' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  sku?: string;
}
