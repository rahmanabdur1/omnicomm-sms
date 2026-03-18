import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectMetric('sms_sent_total') private smsSentCounter: Counter<string>,
    @InjectMetric('sms_failed_total') private smsFailedCounter: Counter<string>,
    @InjectMetric('sms_fallback_total') private smsFallbackCounter: Counter<string>,
    @InjectMetric('api_request_duration') private requestDuration: Histogram<string>,
    @InjectMetric('active_subscriptions') private activeSubsGauge: Gauge<string>,
  ) {}

  incrementSmsSent(provider: string) {
    this.smsSentCounter.inc({ provider });
  }

  incrementSmsFailed() {
    this.smsFailedCounter.inc();
  }

  incrementFallback() {
    this.smsFallbackCounter.inc();
  }

  observeRequestDuration(route: string, duration: number) {
    this.requestDuration.observe({ route }, duration);
  }

  setActiveSubscriptions(count: number) {
    this.activeSubsGauge.set(count);
  }
}