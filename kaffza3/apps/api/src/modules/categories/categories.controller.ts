import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('stores/:storeId/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user, this.toBigInt(storeId), dto);
  }

  @Patch(':categoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(user, this.toBigInt(storeId), this.toBigInt(categoryId), dto);
  }

  @Delete(':categoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: any, @Param('storeId') storeId: string, @Param('categoryId') categoryId: string) {
    return this.categories.remove(user, this.toBigInt(storeId), this.toBigInt(categoryId));
  }

  @Get()
  list(@Param('storeId') storeId: string) {
    return this.categories.list(this.toBigInt(storeId));
  }

  @Get('tree')
  tree(@Param('storeId') storeId: string) {
    return this.categories.tree(this.toBigInt(storeId));
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('معرّف غير صالح');
    }
  }
}
