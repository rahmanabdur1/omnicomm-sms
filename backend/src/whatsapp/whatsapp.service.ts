import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private config: ConfigService) {}

  // Send via WhatsApp Business API (Meta)
  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${this.config.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        },
        { headers: { Authorization: `Bearer ${this.config.get('WHATSAPP_ACCESS_TOKEN')}` } },
      );
      return true;
    } catch (err) {
      this.logger.error(`WhatsApp send failed: ${err.message}`);
      return false;
    }
  }

  async sendTemplate(to: string, templateName: string, languageCode = 'en_US', components: any[] = []) {
    await axios.post(
      `https://graph.facebook.com/v18.0/${this.config.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateName, language: { code: languageCode }, components },
      },
      { headers: { Authorization: `Bearer ${this.config.get('WHATSAPP_ACCESS_TOKEN')}` } },
    );
  }

  // Webhook verification (Meta requires GET challenge)
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.get('WHATSAPP_VERIFY_TOKEN')) {
      return challenge;
    }
    return null;
  }

  // Handle inbound WhatsApp message
  async handleInbound(body: any) {
    const entry   = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return;

    const from = message.from;
    const text = message.text?.body;

    this.logger.log(`WhatsApp inbound from ${from}: ${text}`);
    // Emit to AI reply or workflow handler
    return { from, text };
  }
}