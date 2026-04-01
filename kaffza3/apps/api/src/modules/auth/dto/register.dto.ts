import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export enum UserRoleDto {
  merchant = 'merchant',
  customer = 'customer',
}

export enum LocaleDto {
  ar = 'ar',
  en = 'en',
}

export class RegisterDto {
  @ApiProperty({ example: 'محمد' })
  @IsString()
  @Length(2, 100)
  name: string;

  // Optional for phone-only customer registration (web).
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @Matches(/^\+968[0-9]{8}$/, { message: 'رقم الهاتف يجب أن يكون بصيغة عُمانية صحيحة (+968XXXXXXXX)' })
  phone: string;

  // Optional for phone-only customer registration (web).
  @ApiPropertyOptional({ example: 'StrongPass1' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: UserRoleDto, default: UserRoleDto.customer })
  @IsOptional()
  @IsEnum(UserRoleDto)
  role?: UserRoleDto = UserRoleDto.customer;

  @ApiPropertyOptional({ enum: LocaleDto, default: LocaleDto.ar })
  @IsOptional()
  @IsEnum(LocaleDto)
  locale?: LocaleDto = LocaleDto.ar;
}
