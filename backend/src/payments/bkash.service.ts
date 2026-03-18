import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class BkashService {
  private readonly logger = new Logger(BkashService.name);
  private token: string;

  constructor(private config: ConfigService) {}

  private async getToken(): Promise<string> {
    const res = await axios.post(
      `${this.config.get('BKASH_BASE_URL')}/tokenized/checkout/token/grant`,
      {
        app_key: this.config.get('BKASH_APP_KEY'),
        app_secret: this.config.get('BKASH_APP_SECRET'),
      },
      {
        headers: {
          username: this.config.get('BKASH_USERNAME'),
          password: this.config.get('BKASH_PASSWORD'),
          'Content-Type': 'application/json',
        },
      },
    );
    return res.data.id_token;
  }

  async createPayment(amount: number, orderId: string, callbackUrl: string) {
    this.token = await this.getToken();
    const res = await axios.post(
      `${this.config.get('BKASH_BASE_URL')}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: orderId,
        callbackURL: callbackUrl,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderId,
      },
      { headers: { Authorization: this.token, 'X-APP-Key': this.config.get('BKASH_APP_KEY') } },
    );
    return { bkashURL: res.data.bkashURL, paymentID: res.data.paymentID };
  }

  async executePayment(paymentID: string): Promise<{ success: boolean; trxID: string }> {
    this.token = this.token || await this.getToken();
    const res = await axios.post(
      `${this.config.get('BKASH_BASE_URL')}/tokenized/checkout/execute`,
      { paymentID },
      { headers: { Authorization: this.token, 'X-APP-Key': this.config.get('BKASH_APP_KEY') } },
    );
    return {
      success: res.data.statusCode === '0000',
      trxID: res.data.trxID,
    };
  }
}