import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, otp: string) {
    // TODO: integrate with real SMS provider
    this.logger.log(`📲 OTP to ${phone}: ${otp}`);
    return true;
  }
}
