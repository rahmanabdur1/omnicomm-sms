import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Subscription, SubStatus } from './entities/subscription.entity';
import { Plan } from './entities/plan.entity';
import { Payment } from '../payments/entities/payment.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(Plan) private planRepo: Repository<Plan>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'));
  }

  async getPlans() {
    return this.planRepo.find({ where: { isActive: true } });
  }

  async subscribe(tenantId: string, planId: string, billingCycle: 'monthly' | 'yearly') {
    const plan = await this.planRepo.findOneOrFail({ where: { id: planId } });

    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${plan.name} Plan` },
          unit_amount: Math.round(Number(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice) * 100),
          recurring: { interval: billingCycle === 'monthly' ? 'month' : 'year' },
        },
        quantity: 1,
      }],
      metadata: { tenantId, planId, billingCycle },
      success_url: `${this.config.get('FRONTEND_URL')}/dashboard?subscribed=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/pricing`,
    });

    return { checkoutUrl: session.url };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody, signature, this.config.get('STRIPE_WEBHOOK_SECRET'),
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { tenantId, planId, billingCycle } = session.metadata;
      const plan = await this.planRepo.findOne({ where: { id: planId } });

      const now = new Date();
      const end = new Date(now);
      billingCycle === 'monthly' ? end.setMonth(end.getMonth() + 1) : end.setFullYear(end.getFullYear() + 1);

      const sub = this.subRepo.create({
        tenantId, planId,
        plan,
        billingCycle: billingCycle as any,
        status: SubStatus.ACTIVE,
        smsUsed: 0,
        callMinutesUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: end,
        stripeSubscriptionId: session.subscription as string,
      });
      await this.subRepo.save(sub);

      await this.paymentRepo.save(this.paymentRepo.create({
        tenantId,
        amount: session.amount_total / 100,
        currency: session.currency,
        status: 'succeeded',
        provider: 'stripe',
        providerPaymentId: session.payment_intent as string,
        subscriptionId: sub.id,
      }));

      this.eventEmitter.emit('SUBSCRIPTION_ACTIVATED', { tenantId, planId });
    }

    if (event.type === 'customer.subscription.deleted') {
      const stripeSub = event.data.object as Stripe.Subscription;
      await this.subRepo.update(
        { stripeSubscriptionId: stripeSub.id },
        { status: SubStatus.CANCELLED },
      );
      this.eventEmitter.emit('SUBSCRIPTION_EXPIRED', { stripeSubscriptionId: stripeSub.id });
    }
  }

  async checkSmsQuota(tenantId: string): Promise<boolean> {
    const sub = await this.subRepo.findOne({
      where: { tenantId, status: SubStatus.ACTIVE },
      relations: ['plan'],
    });
    if (!sub) return false;
    return sub.smsUsed < sub.plan.smsQuota;
  }

  async incrementSmsUsage(tenantId: string) {
    const sub = await this.subRepo.findOne({ where: { tenantId, status: SubStatus.ACTIVE } });
    if (sub) {
      sub.smsUsed += 1;
      await this.subRepo.save(sub);
    }
  }

  async getUsage(tenantId: string) {
    return this.subRepo.findOne({
      where: { tenantId, status: SubStatus.ACTIVE },
      relations: ['plan'],
    });
  }
}