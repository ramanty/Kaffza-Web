import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export enum DisputeTypeDto {
  product_issue = 'product_issue',
  not_received = 'not_received',
  wrong_item = 'wrong_item',
  other = 'other',
}

export class CreateDisputeDto {
  @ApiProperty({ enum: DisputeTypeDto })
  @IsEnum(DisputeTypeDto)
  type: DisputeTypeDto;

  @ApiProperty({ example: 'سبب النزاع...' })
  @IsString()
  @Length(10, 1000)
  reason: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  evidence?: string[];
}
