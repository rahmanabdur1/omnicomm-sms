import { Controller, Get, Post, Body, Req, RawBodyRequest, Headers, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@Req() req, @Body() body: { planId: string; billingCycle: 'monthly' | 'yearly' }) {
    return this.subscriptionsService.subscribe(req.user.tenantId, body.planId, body.billingCycle);
  }

  @Post('webhooks/stripe')
  stripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    return this.subscriptionsService.handleStripeWebhook(req.rawBody, sig);
  }

  @Get('subscription/usage')
  @UseGuards(JwtAuthGuard)
  getUsage(@Req() req) {
    return this.subscriptionsService.getUsage(req.user.tenantId);
  }
}