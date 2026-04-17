import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, otp: string) {
    const provider = (process.env.SMS_PROVIDER || 'console').toLowerCase();
    if (provider === 'console' || process.env.NODE_ENV === 'development') {
      this.logger.log(`[SMS DEV] OTP for ${phone}: ${otp}`);
      return true;
    }

    if (provider === 'mitto' || provider === 'unifonic') {
      const apiKey = process.env.SMS_API_KEY;
      const sender = process.env.SMS_SENDER_ID;
      if (!apiKey || !sender) {
        this.logger.warn(
          `SMS misconfiguration for provider: ${provider}. Falling back to console OTP.`
        );
        this.logger.log(`[SMS FALLBACK] OTP for ${phone}: ${otp}`);
        return true;
      }

      this.logger.warn(
        `SMS provider ${provider} is not implemented yet. Falling back to console OTP.`
      );
      this.logger.log(`[SMS FALLBACK] OTP for ${phone}: ${otp}`);
      return true;
    }

    this.logger.warn(`Unknown SMS_PROVIDER "${provider}". Falling back to console OTP.`);
    this.logger.log(`[SMS FALLBACK] OTP for ${phone}: ${otp}`);
    return true;
  }
}
