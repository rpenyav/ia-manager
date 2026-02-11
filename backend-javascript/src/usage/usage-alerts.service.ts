import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from '../common/entities/policy.entity';
import { Tenant } from '../common/entities/tenant.entity';
import { UsageService } from './usage.service';

export type UsageAlert = {
  tenantId: string;
  type: 'tokens' | 'cost' | 'kill_switch';
  severity: 'warning' | 'critical';
  message: string;
  value?: number;
  limit?: number;
};

@Injectable()
export class UsageAlertsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(Policy)
    private readonly policiesRepository: Repository<Policy>,
    private readonly usageService: UsageService
  ) {}

  async list(tenantId?: string): Promise<UsageAlert[]> {
    let resolvedTenants: Tenant[] = [];
    if (tenantId) {
      const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
      resolvedTenants = tenant ? [tenant] : [];
    } else {
      resolvedTenants = await this.tenantsRepository.find();
    }

    const alerts: UsageAlert[] = [];

    for (const tenant of resolvedTenants as Tenant[]) {
      if (tenant.killSwitch) {
        alerts.push({
          tenantId: tenant.id,
          type: 'kill_switch',
          severity: 'critical',
          message: 'Kill switch activo'
        });
      }

      const policy = await this.policiesRepository.findOne({ where: { tenantId: tenant.id } });
      if (!policy) {
        continue;
      }

      const totals = await this.usageService.getDailyTotals(tenant.id);

      const maxTokensPerDay = Number(policy.maxTokensPerDay || 0);
      const maxCostPerDayUsd = Number(policy.maxCostPerDayUsd || 0);

      if (maxTokensPerDay > 0) {
        const ratio = totals.tokens / maxTokensPerDay;
        if (ratio >= 1) {
          alerts.push({
            tenantId: tenant.id,
            type: 'tokens',
            severity: 'critical',
            message: 'Límite de tokens alcanzado',
            value: totals.tokens,
            limit: maxTokensPerDay
          });
        } else if (ratio >= 0.8) {
          alerts.push({
            tenantId: tenant.id,
            type: 'tokens',
            severity: 'warning',
            message: 'Tokens cerca del límite',
            value: totals.tokens,
            limit: maxTokensPerDay
          });
        }
      }

      if (maxCostPerDayUsd > 0) {
        const ratio = totals.costUsd / maxCostPerDayUsd;
        if (ratio >= 1) {
          alerts.push({
            tenantId: tenant.id,
            type: 'cost',
            severity: 'critical',
            message: 'Límite de coste alcanzado',
            value: totals.costUsd,
            limit: maxCostPerDayUsd
          });
        } else if (ratio >= 0.8) {
          alerts.push({
            tenantId: tenant.id,
            type: 'cost',
            severity: 'warning',
            message: 'Coste cerca del límite',
            value: totals.costUsd,
            limit: maxCostPerDayUsd
          });
        }
      }
    }

    return alerts;
  }
}
