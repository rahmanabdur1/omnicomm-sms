import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ScheduledSms, ScheduledSmsStatus } from './entities/scheduled-sms.entity';
import { SmsService } from './sms.service';

@Injectable()
export class ScheduledSmsService {
  private readonly logger = new Logger(ScheduledSmsService.name);

  constructor(
    @InjectRepository(ScheduledSms) private scheduledRepo: Repository<ScheduledSms>,
    private smsService: SmsService,
  ) {}

  async schedule(tenantId: string, to: string, message: string, sendAt: Date) {
    return this.scheduledRepo.save(
      this.scheduledRepo.create({ tenantId, to, message, sendAt }),
    );
  }

  // Runs every minute to dispatch due messages
  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchDue() {
    const due = await this.scheduledRepo.find({
      where: {
        status: ScheduledSmsStatus.PENDING,
        sendAt: LessThanOrEqual(new Date()),
      },
    });

    for (const sms of due) {
      this.logger.log(`Dispatching scheduled SMS to ${sms.to}`);
      await this.smsService.sendSms(sms.to, sms.message, sms.tenantId);
      await this.scheduledRepo.update(sms.id, { status: ScheduledSmsStatus.DISPATCHED });
    }
  }
}