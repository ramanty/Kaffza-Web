import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

import { LocaleDto, RegisterDto, UserRoleDto } from './register.dto';

export class MerchantRegisterDto extends RegisterDto {
  @ApiPropertyOptional({ example: 'merchant@example.com' })
  @IsOptional()
  @IsEmail()
  declare email?: string;

  @ApiPropertyOptional({ enum: UserRoleDto, default: UserRoleDto.customer })
  @IsOptional()
  @IsEnum(UserRoleDto)
  declare role?: UserRoleDto;

  @ApiPropertyOptional({ enum: LocaleDto, default: LocaleDto.ar })
  @IsOptional()
  @IsEnum(LocaleDto)
  declare locale?: LocaleDto;

  @ApiPropertyOptional({ example: 'cf-turnstile-token' })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
