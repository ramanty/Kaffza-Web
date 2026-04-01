import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get('subdomain/:subdomain')
  getBySubdomain(@Param('subdomain') subdomain: string) {
    return this.stores.getStoreBySubdomain(subdomain);
  }



@Get('check-subdomain/:subdomain')
checkSubdomain(@Param('subdomain') subdomain: string) {
  return this.stores.checkSubdomain(subdomain);
}

@Get('my')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
my(@CurrentUser() user: any) {
  return this.stores.getMyStores(user);
}


  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() dto: CreateStoreDto) {
    return this.stores.createStore(user, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.stores.updateStore(user, this.toBigInt(id), dto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stores.getStoreById(user, this.toBigInt(id));
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('معرّف غير صالح');
    }
  }
}
