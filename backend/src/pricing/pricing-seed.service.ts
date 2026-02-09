import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PricingService } from './pricing.service';
import { pricingDefaults } from './pricing.defaults';

@Injectable()
export class PricingSeedService implements OnModuleInit {
  constructor(
    private readonly pricingService: PricingService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<string>('PRICING_SEED_ON_STARTUP');
    if (enabled === 'false') {
      return;
    }

    for (const item of pricingDefaults) {
      await this.pricingService.upsertByModel(item);
    }
  }
}
