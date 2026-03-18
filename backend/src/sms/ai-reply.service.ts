import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import axios from 'axios';

@Injectable()
export class AiReplyService {
  private readonly logger = new Logger(AiReplyService.name);

  constructor(
    private smsService: SmsService,
    private config: ConfigService,
  ) {}

  // Called from webhook when inbound SMS is received
  async handleInboundSms(from: string, message: string, tenantId: string) {
    this.logger.log(`Inbound SMS from ${from}: "${message}"`);

    const aiReply = await this.generateAiReply(message, tenantId);

    await this.smsService.sendSms(from, aiReply, tenantId);
    this.logger.log(`AI auto-reply sent to ${from}`);
  }

  private async generateAiReply(userMessage: string, tenantId: string): Promise<string> {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful customer support assistant. Reply concisely in under 160 characters for SMS.',
          },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 100,
      },
      { headers: { Authorization: `Bearer ${this.config.get('OPENAI_API_KEY')}` } },
    );

    return res.data.choices[0].message.content.trim();
  }

  // Webhook endpoint for SMS provider inbound delivery
  async handleProviderWebhook(body: any, provider: string) {
    let from: string, message: string, tenantId: string;

    if (provider === 'twilio') {
      from    = body.From;
      message = body.Body;
      tenantId = body.AccountSid; // map to tenantId via lookup
    } else if (provider === 'nexmo') {
      from    = body.msisdn;
      message = body.text;
      tenantId = body.to; // virtual number → tenant lookup
    }

    if (from && message) {
      await this.handleInboundSms(from, message, tenantId);
    }
  }
}