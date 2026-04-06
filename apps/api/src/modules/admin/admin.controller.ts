import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  users(
    @CurrentUser() user: any,
    @Query('role') role?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    return this.admin.listUsers(user, role, Number(page) || 1, Math.min(100, Number(limit) || 20));
  }

  @Patch('users/:id')
  updateUser(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.admin.setUserSuspended(user, BigInt(id), !!body?.suspended, body?.reason);
  }

  @Get('settings')
  settings(@CurrentUser() user: any) {
    return this.admin.getSettings(user);
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: any, @Body() body: any) {
    return this.admin.updateSettings(user, body);
  }

  @Get('merchants')
  listMerchants(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    return this.admin.listMerchants(
      user,
      status,
      Number(page) || 1,
      Math.min(100, Number(limit) || 20)
    );
  }

  @Patch('merchants/:id/approve')
  approve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.admin.approveMerchant(user, BigInt(id), true);
  }

  @Patch('merchants/:id/reject')
  reject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.admin.approveMerchant(user, BigInt(id), false);
  }

  @Patch('merchants/:id/ban')
  ban(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.admin.setBan(user, BigInt(id), true, body?.reason);
  }

  @Patch('merchants/:id/unban')
  unban(@CurrentUser() user: any, @Param('id') id: string) {
    return this.admin.setBan(user, BigInt(id), false);
  }

  @Get('orders')
  orders(@CurrentUser() user: any, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.admin.listOrders(user, Number(page) || 1, Math.min(100, Number(limit) || 20));
  }

  @Get('payments')
  payments(@CurrentUser() user: any, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.admin.listPayments(user, Number(page) || 1, Math.min(100, Number(limit) || 20));
  }

  @Get('withdrawals')
  withdrawals(@CurrentUser() user: any, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.admin.listWithdrawals(user, Number(page) || 1, Math.min(100, Number(limit) || 20));
  }

  @Patch('withdrawals/:id/approve')
  approveWithdrawal(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.admin.handleWithdrawal(user, BigInt(id), true, body?.notes);
  }

  @Patch('withdrawals/:id/reject')
  rejectWithdrawal(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.admin.handleWithdrawal(user, BigInt(id), false, body?.notes);
  }

  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.admin.stats(user);
  }

  @Get('audit')
  audit(@CurrentUser() user: any, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.admin.auditLog(user, Number(page) || 1, Math.min(100, Number(limit) || 20));
  }
}
