import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsLog } from './entities/sms-log.entity';

@Processor('sms-dlq')
export class SmsDlqProcessor {
  private readonly logger = new Logger(SmsDlqProcessor.name);

  constructor(@InjectRepository(SmsLog) private smsLogRepo: Repository<SmsLog>) {}

  @Process('failed')
  async handleFailed(job: Job<{ to: string; message: string; tenantId: string; reason: string }>) {
    const { to, message, tenantId, reason } = job.data;

    this.logger.error(`DLQ: Permanently failed SMS to ${to}. Reason: ${reason}`);

    // Persist to DB for investigation
    await this.smsLogRepo.save(
      this.smsLogRepo.create({
        to, message, tenantId,
        status: 'permanent_failure',
        provider: 'dlq',
      }),
    );

    // TODO: alert admin via email / Slack / webhook
  }
}