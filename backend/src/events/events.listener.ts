import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class EventsListener {
  private readonly logger = new Logger(EventsListener.name);

  constructor(
    private subscriptionsService: SubscriptionsService,
    private campaignsService: CampaignsService,
  ) {}

  @OnEvent('SMS_SENT')
  async onSmsSent(payload: { to: string; tenantId: string; campaignId?: string }) {
    this.logger.log(`SMS_SENT → ${payload.to}`);
    await this.subscriptionsService.incrementSmsUsage(payload.tenantId);
    if (payload.campaignId) await this.campaignsService.updateStats(payload.campaignId, true);
  }

  @OnEvent('SMS_FAILED')
  async onSmsFailed(payload: { to: string; tenantId: string; campaignId?: string }) {
    this.logger.error(`SMS_FAILED → ${payload.to}`);
    if (payload.campaignId) await this.campaignsService.updateStats(payload.campaignId, false);
  }

  @OnEvent('SMS_FALLBACK_USED')
  onFallback(payload: any) {
    this.logger.warn(`SMS_FALLBACK_USED → GSM modem used for ${payload.to}`);
  }

  @OnEvent('CALL_STARTED')
  onCallStarted(payload: any) {
    this.logger.log(`CALL_STARTED → ${payload.from} → ${payload.to}`);
  }

  @OnEvent('CALL_ENDED')
  onCallEnded(payload: any) {
    this.logger.log(`CALL_ENDED → duration: ${payload.duration}s`);
  }

  @OnEvent('SUBSCRIPTION_EXPIRED')
  onSubExpired(payload: any) {
    this.logger.warn(`SUBSCRIPTION_EXPIRED → tenant: ${payload.tenantId}`);
  }
}