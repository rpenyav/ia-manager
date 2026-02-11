import { Module } from '@nestjs/common';
import { AdaptersModule } from '../adapters/adapters.module';
import { AuditModule } from '../audit/audit.module';
import { CommonModule } from '../common/common.module';
import { PoliciesModule } from '../policies/policies.module';
import { PricingModule } from '../pricing/pricing.module';
import { ProvidersModule } from '../providers/providers.module';
import { RedactionModule } from '../redaction/redaction.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsageModule } from '../usage/usage.module';
import { RuntimeController } from './runtime.controller';
import { RuntimeService } from './runtime.service';

@Module({
  imports: [
    CommonModule,
    TenantsModule,
    ProvidersModule,
    PoliciesModule,
    PricingModule,
    RedactionModule,
    AdaptersModule,
    UsageModule,
    AuditModule
  ],
  controllers: [RuntimeController],
  providers: [RuntimeService],
  exports: [RuntimeService]
})
export class RuntimeModule {}
