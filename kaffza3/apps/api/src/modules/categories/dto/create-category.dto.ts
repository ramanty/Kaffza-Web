import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'أحذية' })
  @IsString()
  @Length(2, 100)
  nameAr: string;

  @ApiProperty({ example: 'Shoes' })
  @IsString()
  @Length(2, 100)
  nameEn: string;

  @ApiPropertyOptional({ description: 'Parent category id' })
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}
