import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class KillSwitchService {
  private readonly ttlSeconds: number;

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(SystemSetting)
    private readonly settingsRepository: Repository<SystemSetting>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly configService: ConfigService
  ) {
    this.ttlSeconds = Number(this.configService.get('KILL_SWITCH_CACHE_TTL') || 30);
  }

  private tenantCacheKey(tenantId: string) {
    return `kill-switch:tenant:${tenantId}`;
  }

  private globalCacheKey() {
    return 'kill-switch:global';
  }

  async getTenantKillSwitch(tenantId: string): Promise<boolean> {
    const cached = await this.cache.get<boolean>(this.tenantCacheKey(tenantId));
    if (cached !== undefined) {
      return cached;
    }

    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    const enabled = tenant?.killSwitch ?? false;
    await this.cache.set(this.tenantCacheKey(tenantId), enabled, this.ttlSeconds);
    return enabled;
  }

  async setTenantKillSwitch(tenantId: string, enabled: boolean) {
    await this.cache.set(this.tenantCacheKey(tenantId), enabled, this.ttlSeconds);
  }

  async getGlobalKillSwitch(): Promise<boolean> {
    const cached = await this.cache.get<boolean>(this.globalCacheKey());
    if (cached !== undefined) {
      return cached;
    }

    const setting = await this.settingsRepository.findOne({ where: { key: 'global_kill_switch' } });
    const fallback = this.configService.get<string>('KILL_SWITCH_DEFAULT') === 'true';
    const enabled = Boolean(setting?.value?.enabled ?? fallback);

    await this.cache.set(this.globalCacheKey(), enabled, this.ttlSeconds);
    return enabled;
  }

  async setGlobalKillSwitch(enabled: boolean) {
    const setting = this.settingsRepository.create({
      key: 'global_kill_switch',
      value: { enabled }
    });
    await this.settingsRepository.save(setting);
    await this.cache.set(this.globalCacheKey(), enabled, this.ttlSeconds);
  }
}
