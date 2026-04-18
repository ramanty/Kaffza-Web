import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { RegisterMethodDto } from './register.dto';

export class OtpRequestDto {
  @ApiProperty({ required: false, example: '+96891234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'رقم الهاتف يجب أن يكون بصيغة دولية صحيحة (E.164)',
  })
  phone?: string;

  @ApiProperty({ required: false, example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, enum: RegisterMethodDto, default: RegisterMethodDto.phone })
  @IsOptional()
  @IsEnum(RegisterMethodDto)
  method?: RegisterMethodDto;
}
