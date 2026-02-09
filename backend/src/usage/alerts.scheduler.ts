import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsageAlertsService } from './usage-alerts.service';

@Injectable()
export class AlertsScheduler {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(
    private readonly alertsService: UsageAlertsService,
    private readonly notificationsService: NotificationsService,
    private readonly settingsService: SettingsService,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache
  ) {}

  @Cron('*/5 * * * *')
  async handleCron() {
    const schedule = await this.settingsService.getAlertsSchedule();
    const minIntervalMinutes = schedule.minIntervalMinutes || 15;

    const alerts = await this.alertsService.list();
    const grouped = new Map<string, typeof alerts>();

    for (const alert of alerts) {
      if (!grouped.has(alert.tenantId)) {
        grouped.set(alert.tenantId, []);
      }
      grouped.get(alert.tenantId)!.push(alert);
    }

    for (const [tenantId, tenantAlerts] of grouped.entries()) {
      if (tenantAlerts.length === 0) {
        continue;
      }

      const cacheKey = `alerts:last_sent:${tenantId}`;
      const lastSent = await this.cache.get<number>(cacheKey);
      const now = Date.now();

      if (lastSent && now - lastSent < minIntervalMinutes * 60 * 1000) {
        continue;
      }

      try {
        await this.notificationsService.sendAlerts(tenantId, tenantAlerts);
        await this.cache.set(cacheKey, now, minIntervalMinutes * 60);
      } catch (error) {
        this.logger.warn(`Failed to send alerts for tenant ${tenantId}`);
      }
    }
  }
}
