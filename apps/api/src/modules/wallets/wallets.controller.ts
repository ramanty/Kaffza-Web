import { Body, Controller, Param, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { WithdrawDto } from './dto/withdraw.dto';

@ApiTags('Wallets')
@Controller('stores/:storeId/wallet')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    return this.wallets.getWallet(user, BigInt(storeId));
  }

  @Post('withdrawals')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  request(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: WithdrawDto) {
    return this.wallets.requestWithdrawal(user, BigInt(storeId), dto);
  }
}
