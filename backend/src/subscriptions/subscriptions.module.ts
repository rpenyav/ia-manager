import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCatalog } from '../common/entities/service-catalog.entity';
import { Subscription } from '../common/entities/subscription.entity';
import { SubscriptionService } from '../common/entities/subscription-service.entity';
import { SubscriptionHistory } from '../common/entities/subscription-history.entity';
import { SubscriptionPaymentRequest } from '../common/entities/subscription-payment-request.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { SubscriptionsController } from './subscriptions.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { BillingController } from './billing.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionService,
      ServiceCatalog,
      SubscriptionHistory,
      SubscriptionPaymentRequest
    ]),
    TenantsModule
  ],
  controllers: [SubscriptionsController, AdminSubscriptionsController, BillingController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService]
})
export class SubscriptionsModule {}
