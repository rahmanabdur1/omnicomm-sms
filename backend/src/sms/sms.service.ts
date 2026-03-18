import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsLog } from '../sms/entities/sms-log.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectQueue('sms') private smsQueue: Queue,
    @InjectRepository(SmsLog) private smsLogRepo: Repository<SmsLog>,
    private eventEmitter: EventEmitter2,
    private config: ConfigService,
  ) {}

  async sendSms(to: string, message: string, tenantId: string) {
    const job = await this.smsQueue.add(
      'send',
      { to, message, tenantId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
    return { jobId: job.id, status: 'queued' };
  }

  async sendViaSmsApi(to: string, message: string): Promise<boolean> {
    try {
      const apiKey = this.config.get('SMS_API_KEY');
      const from = this.config.get('SMS_FROM_NUMBER');

      await axios.post('https://api.twilio.com/2010-04-01/Accounts/.../Messages.json', {
        To: to, From: from, Body: message,
      }, {
        auth: { username: this.config.get('SMS_API_KEY'), password: this.config.get('SMS_API_SECRET') },
      });

      this.logger.log(`SMS sent via API to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`SMS API failed: ${err.message}`);
      return false;
    }
  }

  async sendViaGsmFallback(to: string, message: string): Promise<boolean> {
    if (!this.config.get('GAMMU_ENABLED')) return false;
    try {
      // Gammu CLI call
      const { exec } = require('child_process');
      exec(`gammu --sendsms TEXT ${to} -text "${message}"`);
      this.logger.warn(`SMS sent via GSM fallback to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`GSM fallback failed: ${err.message}`);
      return false;
    }
  }

  async logSms(data: Partial<SmsLog>) {
    return this.smsLogRepo.save(this.smsLogRepo.create(data));
  }
}