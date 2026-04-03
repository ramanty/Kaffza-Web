import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'merchant', 'customer'] })
  findAll(@Query('role') role?: string) {
    return this.users.findAll(role ? { role } : undefined).then((list) => ({
      success: true,
      data: list.map((u) => this.users.toSafeUser(u)),
    }));
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.users
      .findById(BigInt(user.sub))
      .then((u) => ({ success: true, data: this.users.toSafeUser(u) }));
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.users
      .update(BigInt(user.sub), dto)
      .then((data) => ({ success: true, message: 'تم تحديث البيانات', data }));
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.users
      .findById(BigInt(id))
      .then((u) => ({ success: true, data: this.users.toSafeUser(u) }));
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.users
      .update(BigInt(id), dto)
      .then((data) => ({ success: true, message: 'تم تحديث البيانات', data }));
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.users.remove(BigInt(id));
  }
}
