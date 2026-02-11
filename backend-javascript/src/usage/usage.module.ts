import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageEvent } from '../common/entities/usage-event.entity';
import { Policy } from '../common/entities/policy.entity';
import { Tenant } from '../common/entities/tenant.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { AlertsScheduler } from './alerts.scheduler';
import { UsageController } from './usage.controller';
import { UsageAlertsService } from './usage-alerts.service';
import { UsageService } from './usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([UsageEvent, Tenant, Policy]), NotificationsModule, SettingsModule],
  controllers: [UsageController],
  providers: [UsageService, UsageAlertsService, AlertsScheduler],
  exports: [UsageService, UsageAlertsService]
})
export class UsageModule {}
