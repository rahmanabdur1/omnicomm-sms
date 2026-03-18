import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';

@Module({
  imports: [PrometheusModule.register({ path: '/metrics', defaultMetrics: { enabled: true } })],
  controllers: [MonitoringController],
  providers: [
    MonitoringService,
    makeCounterProvider({ name: 'sms_sent_total', help: 'Total SMS sent', labelNames: ['provider'] }),
    makeCounterProvider({ name: 'sms_failed_total', help: 'Total SMS failed' }),
    makeCounterProvider({ name: 'sms_fallback_total', help: 'Total GSM fallbacks' }),
    makeHistogramProvider({ name: 'api_request_duration', help: 'API request duration in ms', labelNames: ['route'] }),
    makeGaugeProvider({ name: 'active_subscriptions', help: 'Active tenant subscriptions' }),
  ],
  exports: [MonitoringService],
})
export class MonitoringModule {}