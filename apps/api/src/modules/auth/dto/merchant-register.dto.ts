import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

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
}
