import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class DisputeMessageDto {
  @ApiProperty({ example: 'رسالة...' })
  @IsString()
  @Length(1, 2000)
  message: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  attachments?: string[];
}
