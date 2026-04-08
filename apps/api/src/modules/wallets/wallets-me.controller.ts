import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { WithdrawDto } from './dto/withdraw.dto';

@ApiTags('Wallets')
@Controller('wallet')
export class WalletsMeController {
  constructor(private readonly wallets: WalletsService) {}

  @Patch('me/withdraw')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  requestMe(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return this.wallets.requestMyWithdrawal(user, dto);
  }
}
