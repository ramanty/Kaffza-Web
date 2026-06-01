import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
