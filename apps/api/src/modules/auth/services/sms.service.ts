import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

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
        this.logger.error(`SMS misconfiguration for provider: ${provider}`);
        throw new ServiceUnavailableException('خدمة الرسائل غير متاحة حالياً');
      }
      this.logger.error(`SMS provider not implemented: ${provider}`);
      throw new ServiceUnavailableException('خدمة الرسائل غير متاحة حالياً');
    }

    this.logger.error('SMS_PROVIDER not configured');
    throw new InternalServerErrorException('تعذر إرسال رمز التحقق');
  }
}
