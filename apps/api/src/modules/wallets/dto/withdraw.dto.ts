import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty()
  @IsString()
  bankName: string;

  @ApiProperty()
  @IsString()
  accountNumber: string;

  @ApiProperty()
  @IsString()
  iban: string;
}
