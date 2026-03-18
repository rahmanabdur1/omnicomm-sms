import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class VoiceAiService {
  private readonly logger = new Logger(VoiceAiService.name);

  constructor(private config: ConfigService) {}

  // Generates dynamic IVR TwiML response using AI
  async generateIvrResponse(userInput: string, callContext: string): Promise<string> {
    const aiText = await this.askAi(
      `You are a phone IVR assistant. The caller said: "${userInput}". Context: ${callContext}. Reply in max 2 sentences, natural speech.`,
    );

    // Return TwiML (Twilio Markup Language)
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiText}</Say>
  <Gather numDigits="1" action="/telephony/ivr/input" method="POST" timeout="5">
    <Say voice="Polly.Joanna">Press 1 for Sales, Press 2 for Support, Press 0 for Operator.</Say>
  </Gather>
  <Say>We did not receive your input. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  async handleDtmfInput(digit: string, tenantId: string): Promise<string> {
    const routes: Record<string, string> = { '1': 'sales', '2': 'support', '0': 'operator' };
    const dept = routes[digit] || 'support';

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you to ${dept}. Please hold.</Say>
  <Dial timeout="30">
    <Sip>sip:${dept}@${this.config.get('ASTERISK_HOST')}</Sip>
  </Dial>
  <Say>No agents available. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  private async askAi(prompt: string): Promise<string> {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 80,
      },
      { headers: { Authorization: `Bearer ${this.config.get('OPENAI_API_KEY')}` } },
    );
    return res.data.choices[0].message.content.trim();
  }
}