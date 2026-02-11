import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdaptersService } from '../adapters/adapters.service';
import { AuditService } from '../audit/audit.service';
import { KillSwitchService } from '../common/services/kill-switch.service';
import { RateLimitService } from '../common/services/rate-limit.service';
import { PoliciesService } from '../policies/policies.service';
import { PricingService } from '../pricing/pricing.service';
import { ProvidersService } from '../providers/providers.service';
import { RedactionService } from '../redaction/redaction.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsageService } from '../usage/usage.service';
import { ExecuteRequestDto } from './dto/execute-request.dto';

@Injectable()
export class RuntimeService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly providersService: ProvidersService,
    private readonly policiesService: PoliciesService,
    private readonly redactionService: RedactionService,
    private readonly adaptersService: AdaptersService,
    private readonly usageService: UsageService,
    private readonly auditService: AuditService,
    private readonly rateLimitService: RateLimitService,
    private readonly killSwitchService: KillSwitchService,
    private readonly pricingService: PricingService
  ) {}

  async execute(tenantId: string, dto: ExecuteRequestDto) {
    try {
      const tenant = await this.tenantsService.getById(tenantId);
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const globalKill = await this.killSwitchService.getGlobalKillSwitch();
      const tenantKill = await this.killSwitchService.getTenantKillSwitch(tenantId);
      if (globalKill || tenantKill || tenant.status !== 'active') {
        throw new ForbiddenException('Tenant is disabled');
      }

      const provider = await this.providersService.getByTenantAndId(tenantId, dto.providerId);
      if (!provider || !provider.enabled) {
        throw new NotFoundException('Provider not found or disabled');
      }

      const policy = await this.policiesService.getByTenant(tenantId);
      if (!policy) {
        throw new ForbiddenException('Policy is required before runtime execution');
      }

      if (policy.maxRequestsPerMinute > 0) {
        await this.rateLimitService.consume(tenantId, policy.maxRequestsPerMinute);
      }

      const totals = await this.usageService.getDailyTotals(tenantId);
      const maxTokensPerDay = Number(policy.maxTokensPerDay || 0);
      const maxCostPerDayUsd = Number(policy.maxCostPerDayUsd || 0);

      if (maxTokensPerDay > 0 && totals.tokens >= maxTokensPerDay) {
        throw new ForbiddenException('Token limit exceeded');
      }
      if (maxCostPerDayUsd > 0 && totals.costUsd >= maxCostPerDayUsd) {
        throw new ForbiddenException('Cost limit exceeded');
      }

      const payload = policy.redactionEnabled ? this.redactionService.redact(dto.payload) : dto.payload;
      const credentials = await this.providersService.getDecryptedCredentials(provider);

      const response = await this.adaptersService.invokeProvider(
        provider.type,
        credentials,
        dto.model,
        payload
      );

      const pricing = await this.pricingService.resolveForTenant(tenantId, provider.type, dto.model);
      const computedCost = this.pricingService.calculateCost(
        pricing,
        response.tokensIn,
        response.tokensOut
      );

      await this.usageService.record({
        tenantId,
        providerId: provider.id,
        model: dto.model,
        serviceCode: dto.serviceCode || null,
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
        costUsd: computedCost
      });

      await this.auditService.record({
        tenantId,
        action: 'runtime.execute',
        status: 'accepted',
        metadata: {
          providerId: provider.id,
          requestId: dto.requestId,
          model: dto.model
        }
      });

      return {
        requestId: dto.requestId,
        output: response.output
      };
    } catch (error) {
      await this.auditService.record({
        tenantId,
        action: 'runtime.execute',
        status: 'rejected',
        metadata: {
          requestId: dto.requestId,
          reason: error instanceof Error ? error.message : 'unknown'
        }
      });
      throw error;
    }
  }
}
