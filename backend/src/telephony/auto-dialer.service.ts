import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../contacts/entities/contact.entity';
import { CallLog } from './entities/call-log.entity';

@Injectable()
export class AutoDialerService {
  private readonly logger = new Logger(AutoDialerService.name);

  constructor(
    @InjectQueue('calls') private callQueue: Queue,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(CallLog) private callLogRepo: Repository<CallLog>,
  ) {}

  async launchDialerCampaign(tenantId: string, options: {
    campaignName: string;
    contactIds: string[];
    message: string;       // TTS message to play
    maxConcurrent: number; // parallel calls
    retryFailed: boolean;
  }) {
    const contacts = await this.contactRepo.findByIds(options.contactIds);

    this.logger.log(`Auto-dialer: ${contacts.length} contacts, max ${options.maxConcurrent} concurrent`);

    const jobs = contacts.map((c, i) => ({
      name: 'dial',
      data: {
        tenantId,
        phone: c.phone,
        contactName: c.name,
        message: options.message,
        campaignName: options.campaignName,
        retryFailed: options.retryFailed,
      },
      opts: {
        delay: Math.floor(i / options.maxConcurrent) * 3000, // stagger batches
        attempts: options.retryFailed ? 2 : 1,
        backoff: { type: 'fixed', delay: 30000 },
      },
    }));

    await this.callQueue.addBulk(jobs);
    return { queued: contacts.length, campaignName: options.campaignName };
  }

  async getDialerStats(tenantId: string, campaignName: string) {
    const logs = await this.callLogRepo.find({ where: { tenantId } });
    return {
      total: logs.length,
      answered: logs.filter(l => l.status === 'answered').length,
      missed:   logs.filter(l => l.status === 'missed').length,
      failed:   logs.filter(l => l.status === 'failed').length,
    };
  }
}