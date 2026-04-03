import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export enum LocaleDto {
  ar = 'ar',
  en = 'en',
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'محمد العمري' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: LocaleDto })
  @IsOptional()
  @IsEnum(LocaleDto)
  locale?: LocaleDto;
}
