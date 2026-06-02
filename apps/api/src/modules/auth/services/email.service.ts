import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Processor('emailQueue')
@Injectable()
export class EmailService extends WorkerHost {
  private readonly logger = new Logger(EmailService.name);

  constructor(@InjectQueue('emailQueue') private emailQueue: Queue) {
    super();
  }

  async sendOtp(email: string, otp: string) {
    // Enqueue the job for background processing
    await this.emailQueue.add('sendOtp', { email, otp });
    return true;
  }

  async process(job: Job<any>) {
    if (job.name === 'sendOtp') {
      const { email, otp } = job.data;
      const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
      
      if (provider === 'console' || process.env.NODE_ENV === 'development') {
        this.logger.log(`[EMAIL ASYNC] OTP for ${email}: ${otp}`);
        return true;
      }

      this.logger.warn(
        `EMAIL_PROVIDER "${provider}" is not implemented yet. Falling back to console OTP.`
      );
      this.logger.log(`[EMAIL FALLBACK ASYNC] OTP for ${email}: ${otp}`);
      return true;
    }
  }
}

