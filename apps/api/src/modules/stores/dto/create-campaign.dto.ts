import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const CAMPAIGN_STATUS = ['draft', 'scheduled', 'active', 'paused', 'completed'] as const;
const CAMPAIGN_CHANNEL = ['sms', 'whatsapp', 'email', 'push'] as const;
const CAMPAIGN_AUDIENCE = [
  'all_customers',
  'returning_customers',
  'new_customers',
  'abandoned_cart',
] as const;
const REMINDER_PRESETS = ['gentle', 'standard', 'aggressive'] as const;

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  nameAr!: string;

  @ApiProperty()
  @IsString()
  nameEn!: string;

  @ApiPropertyOptional({ default: 'sales_boost' })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ enum: CAMPAIGN_CHANNEL, default: 'sms' })
  @IsOptional()
  @IsIn(CAMPAIGN_CHANNEL)
  channel?: (typeof CAMPAIGN_CHANNEL)[number];

  @ApiPropertyOptional({ enum: CAMPAIGN_AUDIENCE, default: 'all_customers' })
  @IsOptional()
  @IsIn(CAMPAIGN_AUDIENCE)
  audience?: (typeof CAMPAIGN_AUDIENCE)[number];

  @ApiPropertyOptional({ enum: CAMPAIGN_STATUS, default: 'draft' })
  @IsOptional()
  @IsIn(CAMPAIGN_STATUS)
  status?: (typeof CAMPAIGN_STATUS)[number];

  @ApiPropertyOptional({ minimum: 1, maximum: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  discountPercent?: number;

  @ApiPropertyOptional({ enum: REMINDER_PRESETS, default: 'standard' })
  @IsOptional()
  @IsIn(REMINDER_PRESETS)
  reminderCadencePreset?: (typeof REMINDER_PRESETS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
