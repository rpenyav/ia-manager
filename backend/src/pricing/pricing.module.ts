import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingModel } from '../common/entities/pricing-model.entity';
import { TenantPricing } from '../common/entities/tenant-pricing.entity';
import { PricingController } from './pricing.controller';
import { PricingSeedService } from './pricing-seed.service';
import { PricingService } from './pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([PricingModel, TenantPricing])],
  controllers: [PricingController],
  providers: [PricingService, PricingSeedService],
  exports: [PricingService]
})
export class PricingModule {}
