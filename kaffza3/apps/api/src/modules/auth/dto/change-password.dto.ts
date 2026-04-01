import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123' })
  @IsString()
  @MinLength(1)
  oldPassword: string;

  @ApiProperty({ example: 'NewStrongPass1' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
