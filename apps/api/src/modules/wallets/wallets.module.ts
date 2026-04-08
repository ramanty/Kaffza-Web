import { Module } from '@nestjs/common';

import { WalletsMeController } from './wallets-me.controller';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  controllers: [WalletsController, WalletsMeController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
