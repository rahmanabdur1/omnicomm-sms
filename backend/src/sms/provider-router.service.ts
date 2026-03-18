import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsProvider } from './entities/sms-provider.entity';
import axios from 'axios';

@Injectable()
export class ProviderRouterService {
  private readonly logger = new Logger(ProviderRouterService.name);

  constructor(
    @InjectRepository(SmsProvider) private providerRepo: Repository<SmsProvider>,
  ) {}

  // Returns providers sorted by priority
  async getActiveProviders(): Promise<SmsProvider[]> {
    return this.providerRepo.find({
      where: { isActive: true },
      order: { priority: 'ASC' },
    });
  }

  async sendWithFailover(to: string, message: string): Promise<{ success: boolean; provider: string }> {
    const providers = await this.getActiveProviders();

    for (const provider of providers) {
      try {
        await this.sendViaProvider(provider, to, message);
        this.logger.log(`Sent via provider: ${provider.name}`);
        return { success: true, provider: provider.name };
      } catch (err) {
        this.logger.warn(`Provider ${provider.name} failed: ${err.message}`);
      }
    }

    return { success: false, provider: 'none' };
  }

  private async sendViaProvider(provider: SmsProvider, to: string, message: string): Promise<void> {
    switch (provider.name) {
      case 'twilio':
        await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${provider.apiKey}/Messages.json`,
          new URLSearchParams({ To: to, From: provider.fromNumber, Body: message }),
          { auth: { username: provider.apiKey, password: provider.apiSecret } },
        );
        break;

      case 'nexmo':
        await axios.post('https://rest.nexmo.com/sms/json', {
          api_key: provider.apiKey,
          api_secret: provider.apiSecret,
          from: provider.fromNumber,
          to, text: message,
        });
        break;

      case 'infobip':
        await axios.post(
          'https://api.infobip.com/sms/2/text/advanced',
          { messages: [{ from: provider.fromNumber, destinations: [{ to }], text: message }] },
          { headers: { Authorization: `App ${provider.apiKey}`, 'Content-Type': 'application/json' } },
        );
        break;

      default:
        // Generic REST provider
        await axios.post(provider.apiKey, { to, message, from: provider.fromNumber });
    }
  }
}