package com.neria.manager.runtime;

import com.neria.manager.adapters.AdaptersService;
import com.neria.manager.adapters.ProviderInvocationResult;
import com.neria.manager.audit.AuditService;
import com.neria.manager.common.entities.AuditEvent;
import com.neria.manager.common.entities.Policy;
import com.neria.manager.common.entities.Provider;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.entities.UsageEvent;
import com.neria.manager.common.services.KillSwitchService;
import com.neria.manager.common.services.RateLimitService;
import com.neria.manager.policies.PoliciesService;
import com.neria.manager.pricing.PricingService;
import com.neria.manager.providers.ProvidersService;
import com.neria.manager.redaction.RedactionService;
import com.neria.manager.tenants.TenantsService;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.repos.TenantServiceConfigRepository;
import com.neria.manager.usage.UsageService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RuntimeService {
  private final TenantsService tenantsService;
  private final ProvidersService providersService;
  private final PoliciesService policiesService;
  private final RedactionService redactionService;
  private final AdaptersService adaptersService;
  private final UsageService usageService;
  private final AuditService auditService;
  private final RateLimitService rateLimitService;
  private final KillSwitchService killSwitchService;
  private final PricingService pricingService;
  private final TenantServiceConfigRepository tenantServiceConfigRepository;

  public RuntimeService(
      TenantsService tenantsService,
      ProvidersService providersService,
      PoliciesService policiesService,
      RedactionService redactionService,
      AdaptersService adaptersService,
      UsageService usageService,
      AuditService auditService,
      RateLimitService rateLimitService,
      KillSwitchService killSwitchService,
      PricingService pricingService,
      TenantServiceConfigRepository tenantServiceConfigRepository) {
    this.tenantsService = tenantsService;
    this.providersService = providersService;
    this.policiesService = policiesService;
    this.redactionService = redactionService;
    this.adaptersService = adaptersService;
    this.usageService = usageService;
    this.auditService = auditService;
    this.rateLimitService = rateLimitService;
    this.killSwitchService = killSwitchService;
    this.pricingService = pricingService;
    this.tenantServiceConfigRepository = tenantServiceConfigRepository;
  }

  public Map<String, Object> execute(String tenantId, ExecuteRequest dto) {
    try {
      Tenant tenant = tenantsService.getById(tenantId);
      if (tenant == null) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
      }

      boolean globalKill = killSwitchService.getGlobalKillSwitch();
      boolean tenantKill = killSwitchService.getTenantKillSwitch(tenantId);
      if (globalKill || tenantKill || !"active".equalsIgnoreCase(tenant.getStatus())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant is disabled");
      }

      TenantServiceConfig serviceConfig = null;
      if (dto.serviceCode != null && !dto.serviceCode.isBlank()) {
        serviceConfig =
            tenantServiceConfigRepository
                .findByTenantIdAndServiceCode(tenantId, dto.serviceCode.trim())
                .orElse(null);
      }

      String resolvedProviderId = dto.providerId;
      if (serviceConfig != null
          && serviceConfig.getProviderId() != null
          && !serviceConfig.getProviderId().isBlank()) {
        resolvedProviderId = serviceConfig.getProviderId();
      }

      if (resolvedProviderId == null || resolvedProviderId.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provider is required");
      }

      Provider provider = providersService.getByTenantAndId(tenantId, resolvedProviderId);
      if (provider == null || !provider.isEnabled()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found or disabled");
      }

      Policy policy =
          serviceConfig != null && serviceConfig.getPolicyId() != null
              ? policiesService.getByIdForTenant(tenantId, serviceConfig.getPolicyId())
              : policiesService.getByTenant(tenantId);
      if (policy == null) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Policy is required before runtime execution");
      }

      if (policy.getMaxRequestsPerMinute() > 0) {
        rateLimitService.consume(tenantId, policy.getMaxRequestsPerMinute());
      }

      UsageService.Totals totals =
          usageService.getDailyTotals(tenantId, LocalDate.now(ZoneOffset.UTC));
      int maxTokensPerDay = policy.getMaxTokensPerDay();
      double maxCostPerDayUsd = policy.getMaxCostPerDayUsd() != null
          ? policy.getMaxCostPerDayUsd().doubleValue()
          : 0d;
      if (maxTokensPerDay > 0 && totals.tokens() >= maxTokensPerDay) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Token limit exceeded");
      }
      if (maxCostPerDayUsd > 0 && totals.costUsd() >= maxCostPerDayUsd) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cost limit exceeded");
      }

      Map<String, Object> payload =
          policy.isRedactionEnabled() ? redactionService.redact(dto.payload) : dto.payload;

      String credentials = providersService.getDecryptedCredentials(provider);
      ProviderInvocationResult response;
      try {
        response =
            adaptersService.invokeProvider(provider.getType(), credentials, dto.model, payload);
      } catch (IllegalArgumentException ex) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
      } catch (IllegalStateException ex) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
      }

      var pricing =
          serviceConfig != null && serviceConfig.getPricingId() != null
              ? pricingService.resolveById(serviceConfig.getPricingId())
              : pricingService.resolveForTenant(tenantId, provider.getType(), dto.model);
      double computedCost =
          pricingService.calculateCost(pricing, response.getTokensIn(), response.getTokensOut());

      UsageEvent usage = new UsageEvent();
      usage.setTenantId(tenantId);
      usage.setProviderId(provider.getId());
      usage.setModel(dto.model);
      usage.setServiceCode(dto.serviceCode != null ? dto.serviceCode : null);
      usage.setTokensIn(response.getTokensIn());
      usage.setTokensOut(response.getTokensOut());
      usage.setCostUsd(BigDecimal.valueOf(computedCost));
      usageService.record(usage);

      AuditEvent audit = new AuditEvent();
      audit.setTenantId(tenantId);
      audit.setAction("runtime.execute");
      audit.setStatus("accepted");
      Map<String, Object> acceptedMeta = new java.util.HashMap<>();
      acceptedMeta.put("providerId", provider.getId());
      if (dto.requestId != null) {
        acceptedMeta.put("requestId", dto.requestId);
      }
      if (dto.model != null) {
        acceptedMeta.put("model", dto.model);
      }
      audit.setMetadata(toJson(acceptedMeta));
      auditService.record(audit);

      Map<String, Object> result = new java.util.HashMap<>();
      result.put("requestId", dto.requestId);
      result.put("output", response.getOutput());
      return result;
    } catch (RuntimeException ex) {
      AuditEvent audit = new AuditEvent();
      audit.setTenantId(tenantId);
      audit.setAction("runtime.execute");
      audit.setStatus("rejected");
      Map<String, Object> rejectedMeta = new java.util.HashMap<>();
      if (dto.requestId != null) {
        rejectedMeta.put("requestId", dto.requestId);
      }
      rejectedMeta.put("reason", ex.getMessage() != null ? ex.getMessage() : "unknown");
      audit.setMetadata(toJson(rejectedMeta));
      auditService.record(audit);
      throw ex;
    }
  }

  private String toJson(Object value) {
    try {
      return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(value);
    } catch (Exception ex) {
      return "{}";
    }
  }
}
