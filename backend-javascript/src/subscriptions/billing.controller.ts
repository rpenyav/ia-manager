import { Body, Controller, Post } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('confirm')
  confirm(@Body() body: { token: string }) {
    return this.subscriptionsService.confirmPaymentByToken(body.token);
  }

  @Post('stripe/confirm')
  confirmStripe(@Body() body: { sessionId: string }) {
    return this.subscriptionsService.confirmStripeSession(body.sessionId);
  }
}
