import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOtp(email: string, otp: string) {
    const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
    if (provider === 'console' || process.env.NODE_ENV === 'development') {
      this.logger.log(`[EMAIL DEV] OTP for ${email}: ${otp}`);
      return true;
    }

    // SMTP/provider wiring can be added here safely later.
    this.logger.warn(
      `EMAIL_PROVIDER "${provider}" is not implemented yet. Falling back to console OTP.`
    );
    this.logger.log(`[EMAIL FALLBACK] OTP for ${email}: ${otp}`);
    return true;
  }
}
