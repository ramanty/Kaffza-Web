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
  @Matches(/^\+968[0-9]{8}$/, { message: 'رقم الهاتف يجب أن يكون بصيغة عُمانية صحيحة (+968XXXXXXXX)' })
  phone?: string;

  @ApiPropertyOptional({ example: 'StrongPass1' })
  @IsString()
  @MinLength(1)
  password: string;
}
