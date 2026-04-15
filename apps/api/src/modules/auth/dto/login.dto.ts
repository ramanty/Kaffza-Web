import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+96891234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'رقم الهاتف يجب أن يكون بصيغة دولية صحيحة (E.164)',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'StrongPass1' })
  @IsString()
  @MinLength(1)
  password: string;
}
