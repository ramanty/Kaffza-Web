import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export enum ResolveStatusDto {
  resolved_merchant = 'resolved_merchant',
  resolved_customer = 'resolved_customer',
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ResolveStatusDto })
  @IsEnum(ResolveStatusDto)
  status: ResolveStatusDto;

  @ApiProperty({ example: 'قرار الأدمن...' })
  @IsString()
  @Length(1, 2000)
  resolution: string;

  @ApiPropertyOptional({ description: 'Partial refund amount (OMR)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
