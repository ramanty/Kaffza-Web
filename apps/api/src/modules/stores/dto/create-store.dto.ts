import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'متجري' })
  @IsString()
  @Length(2, 100)
  nameAr: string;

  @ApiProperty({ example: 'My Store' })
  @IsString()
  @Length(2, 100)
  nameEn: string;

  @ApiProperty({ example: 'mystore' })
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-z0-9-]+$/, { message: 'النطاق الفرعي يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط' })
  subdomain: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  planId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descriptionAr?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descriptionEn?: string;
}
