import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { SystemSetting } from '../common/entities/system-setting.entity';
import { Tenant } from '../common/entities/tenant.entity';
import { Provider } from '../common/entities/provider.entity';
import { Policy } from '../common/entities/policy.entity';
import { ApiKey } from '../common/entities/api-key.entity';
import { TenantService } from '../common/entities/tenant-service.entity';
import { TenantPricing } from '../common/entities/tenant-pricing.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      SystemSetting,
      Tenant,
      Provider,
      Policy,
      ApiKey,
      TenantService,
      TenantPricing
    ])
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
