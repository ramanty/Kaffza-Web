import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'رقم الهاتف يجب أن يكون بصيغة دولية صحيحة (E.164)',
  })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط' })
  otp: string;
}
