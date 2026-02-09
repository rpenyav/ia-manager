import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { Tenant } from './entities/tenant.entity';
import { KillSwitchService } from './services/kill-switch.service';
import { RateLimitService } from './services/rate-limit.service';
import { TenantScopeGuard } from './guards/tenant-scope.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, SystemSetting])],
  providers: [KillSwitchService, RateLimitService, TenantScopeGuard, RolesGuard],
  exports: [KillSwitchService, RateLimitService, TenantScopeGuard, RolesGuard]
})
export class CommonModule {}
