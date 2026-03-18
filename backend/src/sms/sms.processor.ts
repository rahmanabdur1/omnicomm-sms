import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('sms')
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private smsService: SmsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Process('send')
  async handleSend(job: Job<{ to: string; message: string; tenantId: string }>) {
    const { to, message, tenantId } = job.data;

    // Try primary SMS API
    const apiSuccess = await this.smsService.sendViaSmsApi(to, message);

    if (apiSuccess) {
      await this.smsService.logSms({ to, message, tenantId, status: 'delivered', provider: 'api' });
      this.eventEmitter.emit('SMS_SENT', { to, tenantId });
      return;
    }

    // Fallback to GSM modem
    this.logger.warn(`API failed for ${to}, trying GSM fallback...`);
    const gsmSuccess = await this.smsService.sendViaGsmFallback(to, message);

    if (gsmSuccess) {
      await this.smsService.logSms({ to, message, tenantId, status: 'delivered', provider: 'gsm' });
      this.eventEmitter.emit('SMS_FALLBACK_USED', { to, tenantId });
    } else {
      await this.smsService.logSms({ to, message, tenantId, status: 'failed', provider: 'none' });
      this.eventEmitter.emit('SMS_FAILED', { to, tenantId });
      throw new Error(`All delivery methods failed for ${to}`);
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed after all retries: ${err.message}`);
  }
}