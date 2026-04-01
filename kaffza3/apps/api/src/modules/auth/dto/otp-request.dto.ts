import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class OtpRequestDto {
  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @Matches(/^\+968[0-9]{8}$/, { message: 'رقم الهاتف يجب أن يكون بصيغة عُمانية صحيحة (+968XXXXXXXX)' })
  phone: string;
}
