import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../common/entities/system-setting.entity';
import { KillSwitchService } from '../common/services/kill-switch.service';
import { Tenant } from '../common/entities/tenant.entity';
import { Provider } from '../common/entities/provider.entity';
import { Policy } from '../common/entities/policy.entity';
import { ApiKey } from '../common/entities/api-key.entity';
import { TenantService } from '../common/entities/tenant-service.entity';
import { TenantPricing } from '../common/entities/tenant-pricing.entity';

@Injectable()
export class SettingsService {
  constructor(
    private readonly killSwitchService: KillSwitchService,
    private readonly configService: ConfigService,
    @InjectRepository(SystemSetting)
    private readonly settingsRepository: Repository<SystemSetting>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
    @InjectRepository(Policy)
    private readonly policiesRepository: Repository<Policy>,
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>,
    @InjectRepository(TenantService)
    private readonly tenantServicesRepository: Repository<TenantService>,
    @InjectRepository(TenantPricing)
    private readonly tenantPricingRepository: Repository<TenantPricing>
  ) {}

  async setGlobalKillSwitch(enabled: boolean) {
    await this.killSwitchService.setGlobalKillSwitch(enabled);
    return { enabled };
  }

  async getGlobalKillSwitch() {
    const enabled = await this.killSwitchService.getGlobalKillSwitch();
    return { enabled };
  }

  async getAlertsSchedule() {
    const setting = await this.settingsRepository.findOne({ where: { key: 'alerts_schedule' } });
    const defaultCron = this.configService.get<string>('ALERTS_CRON') || '*/5 * * * *';
    const defaultInterval = Number(this.configService.get<string>('ALERTS_MIN_INTERVAL_MINUTES') || 15);

    return {
      cron: String(setting?.value?.cron || defaultCron),
      minIntervalMinutes: Number(setting?.value?.minIntervalMinutes || defaultInterval)
    };
  }

  async setAlertsSchedule(payload: { cron: string; minIntervalMinutes: number }) {
    const setting = this.settingsRepository.create({
      key: 'alerts_schedule',
      value: {
        cron: payload.cron,
        minIntervalMinutes: payload.minIntervalMinutes
      }
    });

    await this.settingsRepository.save(setting);
    return this.getAlertsSchedule();
  }

  async getDebugMode() {
    const setting = await this.settingsRepository.findOne({ where: { key: 'debug_mode' } });
    return {
      enabled: Boolean(setting?.value?.enabled ?? false)
    };
  }

  async setDebugMode(enabled: boolean) {
    const setting = this.settingsRepository.create({
      key: 'debug_mode',
      value: { enabled: Boolean(enabled) }
    });
    await this.settingsRepository.save(setting);
    return { enabled: Boolean(enabled) };
  }

  async purgeResources(resources?: string[]) {
    const { enabled } = await this.getDebugMode();
    if (!enabled) {
      throw new ForbiddenException('Debug mode disabled');
    }

    const targets = resources && resources.length > 0 ? resources : ['providers', 'tenants', 'policies', 'api_keys'];
    const summary: Record<string, number> = {};

    if (targets.includes('providers')) {
      summary.providers = await this.providersRepository.count();
      await this.providersRepository.clear();
    }
    if (targets.includes('policies')) {
      summary.policies = await this.policiesRepository.count();
      await this.policiesRepository.clear();
    }
    if (targets.includes('api_keys')) {
      summary.api_keys = await this.apiKeysRepository.count();
      await this.apiKeysRepository.clear();
    }
    if (targets.includes('tenants')) {
      summary.tenant_services = await this.tenantServicesRepository.count();
      summary.tenant_pricings = await this.tenantPricingRepository.count();
      summary.tenants = await this.tenantsRepository.count();
      await this.tenantServicesRepository.clear();
      await this.tenantPricingRepository.clear();
      await this.tenantsRepository.clear();
    }

    return { cleared: summary };
  }
}
