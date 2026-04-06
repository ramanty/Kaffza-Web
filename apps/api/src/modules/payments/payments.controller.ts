import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Post,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { createHmac, timingSafeEqual } from 'crypto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  private readonly logger = new Logger(PaymentsController.name);

  private isMobile(req: any) {
    const hdr = (req?.headers?.['x-client'] || req?.headers?.['x-platform'] || '')
      .toString()
      .toLowerCase();
    return hdr.includes('mobile') || hdr.includes('expo') || hdr.includes('react-native');
  }

  @Post('payments/create-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createSessionByOrderId(@CurrentUser() user: any, @Req() req: any, @Body() dto: CreateSessionDto) {
    return this.payments.createThawaniSessionByOrderId(
      user,
      BigInt(dto.orderId),
      this.isMobile(req)
    );
  }

  @Post('stores/:storeId/payments/create-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createSession(
    @CurrentUser() user: any,
    @Req() req: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateSessionDto
  ) {
    return this.payments.createThawaniSession(
      user,
      BigInt(storeId),
      BigInt(dto.orderId),
      this.isMobile(req)
    );
  }

  @Get('stores/:storeId/payments/status/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  status(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string
  ) {
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
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async thawaniWebhook(@Req() req: any) {
    const signature = req.headers['thawani-signature'] || req.headers['x-thawani-signature'];
    const webhookSecret = process.env.THAWANI_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        throw new ForbiddenException('Invalid webhook signature');
      }
      const rawBody =
        req.rawBody && Buffer.isBuffer(req.rawBody)
          ? req.rawBody
          : Buffer.from(JSON.stringify(req.body));
      if (!req.rawBody || !Buffer.isBuffer(req.rawBody)) {
        this.logger.warn('Thawani webhook rawBody missing; using JSON fallback for signature');
      }
      const hmac = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      const valid =
        hmac.length === String(signature).length &&
        timingSafeEqual(Buffer.from(hmac), Buffer.from(String(signature)));
      if (!valid) {
        throw new ForbiddenException('Invalid webhook signature');
      }
    }
    return this.payments.handleThawaniWebhook(req.body);
  }
}
