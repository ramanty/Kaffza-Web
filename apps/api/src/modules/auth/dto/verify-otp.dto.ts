import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { RegisterMethodDto } from './register.dto';

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: '+96891234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'رقم الهاتف يجب أن يكون بصيغة دولية صحيحة (E.164)',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: RegisterMethodDto, default: RegisterMethodDto.phone })
  @IsOptional()
  @IsEnum(RegisterMethodDto)
  method?: RegisterMethodDto = RegisterMethodDto.phone;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط' })
  otp: string;
}
