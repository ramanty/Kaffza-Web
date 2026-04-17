import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('Integrations')
@Controller('stores/:storeId/integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('events')
  events() {
    return this.integrations.listSupportedEvents();
  }

  @Get('webhooks')
  listWebhooks(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    return this.integrations.listWebhooks(user, this.toBigInt(storeId));
  }

  @Post('webhooks')
  createWebhook(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateWebhookDto
  ) {
    return this.integrations.createWebhook(user, this.toBigInt(storeId), dto);
  }

  @Patch('webhooks/:webhookId')
  updateWebhook(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('webhookId') webhookId: string,
    @Body() dto: UpdateWebhookDto
  ) {
    return this.integrations.updateWebhook(
      user,
      this.toBigInt(storeId),
      this.toBigInt(webhookId),
      dto
    );
  }

  @Delete('webhooks/:webhookId')
  deleteWebhook(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('webhookId') webhookId: string
  ) {
    return this.integrations.deleteWebhook(user, this.toBigInt(storeId), this.toBigInt(webhookId));
  }

  @Post('webhooks/:webhookId/rotate-secret')
  rotateWebhookSecret(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('webhookId') webhookId: string
  ) {
    return this.integrations.rotateWebhookSecret(
      user,
      this.toBigInt(storeId),
      this.toBigInt(webhookId)
    );
  }

  @Get('api-keys')
  listApiKeys(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    return this.integrations.listApiKeys(user, this.toBigInt(storeId));
  }

  @Post('api-keys')
  createApiKey(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateApiKeyDto
  ) {
    return this.integrations.createApiKey(user, this.toBigInt(storeId), dto);
  }

  @Post('api-keys/:keyId/rotate')
  rotateApiKey(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('keyId') keyId: string
  ) {
    return this.integrations.rotateApiKey(user, this.toBigInt(storeId), this.toBigInt(keyId));
  }

  @Post('api-keys/:keyId/revoke')
  revokeApiKey(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('keyId') keyId: string
  ) {
    return this.integrations.revokeApiKey(user, this.toBigInt(storeId), this.toBigInt(keyId));
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('معرّف غير صالح');
    }
  }
}
