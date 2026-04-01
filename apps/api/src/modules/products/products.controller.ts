import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQuery } from './dto/list-products.query';

@ApiTags('Products')
@Controller('stores/:storeId/products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: CreateProductDto) {
    return this.products.create(user, this.toBigInt(storeId), dto);
  }

  @Patch(':productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: any, @Param('storeId') storeId: string, @Param('productId') productId: string, @Body() dto: UpdateProductDto) {
    return this.products.update(user, this.toBigInt(storeId), this.toBigInt(productId), dto);
  }

  @Delete(':productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: any, @Param('storeId') storeId: string, @Param('productId') productId: string) {
    return this.products.remove(user, this.toBigInt(storeId), this.toBigInt(productId));
  }

  @Get()
  list(@Param('storeId') storeId: string, @Query() query: ListProductsQuery) {
    return this.products.list(this.toBigInt(storeId), query);
  }

  @Get(':productId')
  getOne(@Param('storeId') storeId: string, @Param('productId') productId: string) {
    return this.products.getOne(this.toBigInt(storeId), this.toBigInt(productId));
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('معرّف غير صالح');
    }
  }
}
