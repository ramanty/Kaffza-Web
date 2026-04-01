import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Refresh token (مطلوب للموبايل، اختياري للويب إذا موجود في cookie)' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  refreshToken?: string;
}
