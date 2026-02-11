import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantPricing } from '../common/entities/tenant-pricing.entity';
import { PricingModel } from '../common/entities/pricing-model.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { TenantPricingController } from './tenant-pricing.controller';
import { TenantPricingService } from './tenant-pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantPricing, PricingModel]), TenantsModule],
  controllers: [TenantPricingController],
  providers: [TenantPricingService],
  exports: [TenantPricingService]
})
export class TenantPricingModule {}
