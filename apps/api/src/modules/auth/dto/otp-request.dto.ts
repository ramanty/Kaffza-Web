import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class OtpRequestDto {
  @ApiProperty({ example: '+96891234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'رقم الهاتف يجب أن يكون بصيغة دولية صحيحة (E.164)',
  })
  phone: string;
}
