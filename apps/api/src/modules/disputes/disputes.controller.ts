import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeMessageDto } from './dto/message.dto';
import { ResolveDisputeDto } from './dto/resolve.dto';

@ApiTags('Disputes')
@Controller()
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  

// Alias endpoint: POST /disputes with { orderId, reason, description }
@Post('disputes')
@Throttle({ default: { limit: 5, ttl: 60000 } })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
openByBody(@CurrentUser() user: any, @Body() body: any) {
  const orderId = body?.orderId;
  if (!orderId) throw new BadRequestException('orderId مطلوب');

  // Map UI fields: reason (dropdown) -> type, description -> reason
  const dto: any = {
    type: body?.reason || body?.type,
    reason: body?.description || body?.reasonText || body?.descriptionText || body?.description,
    evidence: body?.evidence,
  };

  return this.disputes.open(user, BigInt(orderId), dto);
}

@Post('orders/:orderId/disputes')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  open(@CurrentUser() user: any, @Param('orderId') orderId: string, @Body() dto: CreateDisputeDto) {
    return this.disputes.open(user, BigInt(orderId), dto);
  }

  @Post('disputes/:disputeId/messages')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  message(@CurrentUser() user: any, @Param('disputeId') disputeId: string, @Body() dto: DisputeMessageDto) {
    return this.disputes.addMessage(user, BigInt(disputeId), dto);
  }

  

@Get('disputes')
  @ApiQuery({ name: 'storeId', required: false, description: 'Filter disputes by storeId (admin only) or required for merchant' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
list(@CurrentUser() user: any, @Query('storeId') storeId?: string) {
  return this.disputes.list(user, storeId ? BigInt(storeId) : undefined);
}

@Get('disputes/:disputeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: any, @Param('disputeId') disputeId: string) {
    return this.disputes.get(user, BigInt(disputeId));
  }

  @Patch('disputes/:disputeId/resolve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  resolve(@CurrentUser() user: any, @Param('disputeId') disputeId: string, @Body() dto: ResolveDisputeDto) {
    return this.disputes.resolve(user, BigInt(disputeId), dto);
  }
}
