import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MinLength } from 'class-validator';

export class ForgotPasswordVerifyDto {
  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @Matches(/^\+968[0-9]{8}$/, { message: 'رقم الهاتف يجب أن يكون بصيغة عُمانية صحيحة (+968XXXXXXXX)' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط' })
  otp: string;

  @ApiProperty({ example: 'NewStrongPass1' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
