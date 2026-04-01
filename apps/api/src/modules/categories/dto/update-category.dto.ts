import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'أحذية رجالية' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nameAr?: string;

  @ApiPropertyOptional({ example: 'Men Shoes' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Parent category id (null to remove parent)' })
  @IsOptional()
  parentId?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
