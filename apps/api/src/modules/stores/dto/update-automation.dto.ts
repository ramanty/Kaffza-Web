import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
  welcomeAutomationEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lowStockAlertEnabled?: boolean;
}
