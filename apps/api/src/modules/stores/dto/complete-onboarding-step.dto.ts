import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum OnboardingStepKeyDto {
  store_profile = 'store_profile',
  payment_setup = 'payment_setup',
  shipping_setup = 'shipping_setup',
  first_product = 'first_product',
  first_campaign = 'first_campaign',
  domain_connect = 'domain_connect',
}

export class CompleteOnboardingStepDto {
  @ApiProperty({ enum: OnboardingStepKeyDto })
  @IsEnum(OnboardingStepKeyDto)
  step: OnboardingStepKeyDto;
}
