import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatUser } from '../common/entities/chat-user.entity';
import { ServiceCatalog } from '../common/entities/service-catalog.entity';
import { Subscription } from '../common/entities/subscription.entity';
import { SubscriptionService } from '../common/entities/subscription-service.entity';
import { TenantServiceConfig } from '../common/entities/tenant-service-config.entity';
import { TenantServiceEndpoint } from '../common/entities/tenant-service-endpoint.entity';
import { TenantServiceUser } from '../common/entities/tenant-service-user.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { TenantServicesController } from './tenant-services.controller';
import { TenantServicesService } from './tenant-services.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantServiceConfig,
      TenantServiceEndpoint,
      TenantServiceUser,
      Subscription,
      SubscriptionService,
      ServiceCatalog,
      ChatUser
    ]),
    TenantsModule
  ],
  controllers: [TenantServicesController],
  providers: [TenantServicesService],
  exports: [TenantServicesService]
})
export class TenantServicesModule {}
