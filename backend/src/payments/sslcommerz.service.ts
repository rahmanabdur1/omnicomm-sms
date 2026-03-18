import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SslcommerzService {
  constructor(private config: ConfigService) {}

  async initiatePayment(amount: number, orderId: string, customerInfo: {
    name: string; email: string; phone: string;
  }) {
    const payload = {
      store_id: this.config.get('SSL_STORE_ID'),
      store_passwd: this.config.get('SSL_STORE_PASS'),
      total_amount: amount,
      currency: 'BDT',
      tran_id: orderId,
      success_url: `${this.config.get('BACKEND_URL')}/payments/ssl/success`,
      fail_url: `${this.config.get('BACKEND_URL')}/payments/ssl/fail`,
      cancel_url: `${this.config.get('BACKEND_URL')}/payments/ssl/cancel`,
      cus_name: customerInfo.name,
      cus_email: customerInfo.email,
      cus_phone: customerInfo.phone,
      cus_add1: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: 'OmniComm Subscription',
      product_category: 'Software',
      product_profile: 'non-physical-goods',
    };

    const res = await axios.post(
      this.config.get('NODE_ENV') === 'production'
        ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
      new URLSearchParams(payload as any),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return { gatewayUrl: res.data.GatewayPageURL, sessionKey: res.data.sessionkey };
  }

  async validatePayment(valId: string): Promise<boolean> {
    const res = await axios.get(
      `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php`,
      {
        params: {
          val_id: valId,
          store_id: this.config.get('SSL_STORE_ID'),
          store_passwd: this.config.get('SSL_STORE_PASS'),
          format: 'json',
        },
      },
    );
    return res.data.status === 'VALID';
  }
}