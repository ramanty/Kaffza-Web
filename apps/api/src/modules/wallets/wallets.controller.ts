import { Body, Controller, Param, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { WithdrawDto } from './dto/withdraw.dto';

@ApiTags('Wallets')
@Controller()
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get('stores/:storeId/wallet')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    return this.wallets.getWallet(user, BigInt(storeId));
  }

  @Post('stores/:storeId/wallet/withdrawals')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  request(@CurrentUser() user: any, @Param('storeId') storeId: string, @Body() dto: WithdrawDto) {
    return this.wallets.requestWithdrawal(user, BigInt(storeId), dto);
  }

  @Patch('wallet/me/withdraw')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  requestMe(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return this.wallets.requestMyWithdrawal(user, dto);
  }
}
