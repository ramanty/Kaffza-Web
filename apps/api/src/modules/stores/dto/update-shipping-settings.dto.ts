import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ShippingZoneDto {
  @ApiPropertyOptional({ example: 'muscat' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'مسقط' })
  @IsString()
  nameAr: string;

  @ApiPropertyOptional({ example: 'Muscat' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsNumber()
  @Min(0)
  additionalCost: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  enabled: boolean;
}

class ShippingWeightTierDto {
  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  minWeightKg: number;

  @ApiPropertyOptional({ example: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeightKg?: number | null;

  @ApiPropertyOptional({ example: 1.2 })
  @IsNumber()
  @Min(0)
  cost: number;
}

export class UpdateShippingSettingsDto {
  @ApiPropertyOptional({ enum: ['legacy', 'flat', 'weight_tier'] })
  @IsOptional()
  @IsIn(['legacy', 'flat', 'weight_tier'])
  strategy?: 'legacy' | 'flat' | 'weight_tier';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  flatRate?: number;

  @ApiPropertyOptional({ example: 25, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number | null;

  @ApiPropertyOptional({ type: [ShippingZoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingZoneDto)
  zones?: ShippingZoneDto[];

  @ApiPropertyOptional({ type: [ShippingWeightTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingWeightTierDto)
  weightTiers?: ShippingWeightTierDto[];
}
