import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { TelephonyService } from './telephony.service';

@Processor('calls')
export class CallsProcessor {
  private readonly logger = new Logger(CallsProcessor.name);

  constructor(private telephonyService: TelephonyService) {}

  @Process('dial')
  async handleDial(job: Job<{
    tenantId: string; phone: string; contactName: string;
    message: string; campaignName: string;
  }>) {
    const { phone, message, tenantId, campaignName } = job.data;
    this.logger.log(`Auto-dialing ${phone} for campaign "${campaignName}"`);
    await this.telephonyService.originateCall('system', phone, tenantId);
    // In production: pass TTS message to Asterisk AGI script
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Call job failed for ${job.data.phone}: ${err.message}`);
  }
}