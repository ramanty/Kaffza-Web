import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAutomationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  abandonedCartEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 5, maximum: 10080 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10080)
  abandonedCartDelayMin?: number;

  @ApiPropertyOptional({ type: [String], example: ['sms', 'whatsapp', 'email'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  abandonedCartChannels?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  abandonedCartDiscountEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  abandonedCartDiscountPercent?: number;

  @ApiPropertyOptional({ enum: ['gentle', 'standard', 'aggressive'], default: 'standard' })
  @IsOptional()
  @IsIn(['gentle', 'standard', 'aggressive'])
  reminderCadencePreset?: 'gentle' | 'standard' | 'aggressive';

  @ApiPropertyOptional({ enum: ['manual', 'scheduled'], default: 'manual' })
  @IsOptional()
  @IsIn(['manual', 'scheduled'])
  campaignScheduleMode?: 'manual' | 'scheduled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignTimezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  welcomeAutomationEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lowStockAlertEnabled?: boolean;
}
