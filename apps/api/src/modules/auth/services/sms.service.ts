import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, otp: string) {
    const provider = process.env.SMS_PROVIDER;
    if (provider === 'console' || process.env.NODE_ENV === 'development') {
      this.logger.log(`[SMS DEV] OTP for ${phone}: ${otp}`);
      return true;
    }

    if (provider === 'mitto' || provider === 'unifonic') {
      const apiKey = process.env.SMS_API_KEY;
      const sender = process.env.SMS_SENDER_ID;
      if (!apiKey || !sender) {
        throw new Error('SMS_PROVIDER configured but SMS_API_KEY/SMS_SENDER_ID missing');
      }
      throw new Error(`SMS provider "${provider}" integration not implemented yet`);
    }

    throw new Error('SMS_PROVIDER not configured');
  }
}
