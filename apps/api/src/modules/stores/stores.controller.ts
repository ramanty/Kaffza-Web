import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CompleteOnboardingStepDto } from './dto/complete-onboarding-step.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get('subdomain/:subdomain')
  getBySubdomain(@Param('subdomain') subdomain: string) {
    return this.stores.getStoreBySubdomain(subdomain);
  }

  @Get('check-subdomain/:subdomain')
  checkSubdomain(@Param('subdomain') subdomain: string) {
    return this.stores.checkSubdomain(subdomain);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  my(@CurrentUser() user: any) {
    return this.stores.getMyStores(user);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() dto: CreateStoreDto) {
    return this.stores.createStore(user, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.stores.updateStore(user, this.toBigInt(id), dto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stores.getStoreById(user, this.toBigInt(id));
  }

  @Get(':id/onboarding')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getOnboarding(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stores.getOnboardingStatus(user, this.toBigInt(id));
  }

  @Post(':id/onboarding/complete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  completeOnboardingStep(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CompleteOnboardingStepDto
  ) {
    return this.stores.completeOnboardingStep(user, this.toBigInt(id), dto.step);
  }

  @Get(':id/automation')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getAutomation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stores.getAutomationSettings(user, this.toBigInt(id));
  }

  @Patch(':id/automation')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateAutomation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationDto
  ) {
    return this.stores.updateAutomationSettings(user, this.toBigInt(id), dto);
  }

  @Get(':id/campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  campaigns(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stores.listCampaigns(user, this.toBigInt(id));
  }

  @Post(':id/campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCampaign(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateCampaignDto
  ) {
    return this.stores.createCampaign(user, this.toBigInt(id), dto);
  }

  @Get(':id/analytics/overview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  analyticsOverview(@CurrentUser() user: any, @Param('id') id: string, @Query('days') days = '30') {
    return this.stores.getAnalyticsOverview(user, this.toBigInt(id), Number(days) || 30);
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('معرّف غير صالح');
    }
  }
}
