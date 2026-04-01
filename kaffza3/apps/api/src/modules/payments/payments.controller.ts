import { Body, Controller, Get, Post, Req, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  private isMobile(req: any) {
    const hdr = (req?.headers?.['x-client'] || req?.headers?.['x-platform'] || '').toString().toLowerCase();
    return hdr.includes('mobile') || hdr.includes('expo') || hdr.includes('react-native');
  }

  

@Post('payments/create-session')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
createSessionByOrderId(@CurrentUser() user: any, @Req() req: any, @Body() dto: CreateSessionDto) {
  return this.payments.createThawaniSessionByOrderId(user, BigInt(dto.orderId), this.isMobile(req));
}

@Post('stores/:storeId/payments/create-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createSession(@CurrentUser() user: any, @Req() req: any, @Param('storeId') storeId: string, @Body() dto: CreateSessionDto) {
    return this.payments.createThawaniSession(user, BigInt(storeId), BigInt(dto.orderId), this.isMobile(req));
  }

  

@Get('stores/:storeId/payments/status/:orderId')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
status(@CurrentUser() user: any, @Param('storeId') storeId: string, @Param('orderId') orderId: string) {
  return this.payments.retrieveThawaniStatus(user, BigInt(storeId), BigInt(orderId));
}

  

@Get('payments/:sessionId/status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
statusBySession(@CurrentUser() user: any, @Param('sessionId') sessionId: string) {
  return this.payments.retrieveThawaniStatusBySession(user, sessionId);
}

// Webhook endpoint (no auth)
  @Post('payments/webhook/thawani')
  async thawaniWebhook(@Req() req: any) {
    return this.payments.handleThawaniWebhook(req.body);
  }
}
