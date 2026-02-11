package com.neria.manager.usage;

import com.neria.manager.common.entities.Policy;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.repos.PolicyRepository;
import com.neria.manager.common.repos.TenantRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class UsageAlertsService {
  private final TenantRepository tenantRepository;
  private final PolicyRepository policyRepository;
  private final UsageService usageService;

  public UsageAlertsService(
      TenantRepository tenantRepository,
      PolicyRepository policyRepository,
      UsageService usageService) {
    this.tenantRepository = tenantRepository;
    this.policyRepository = policyRepository;
    this.usageService = usageService;
  }

  public List<UsageAlert> list(String tenantId) {
    List<Tenant> tenants =
        tenantId != null
            ? tenantRepository.findById(tenantId).map(List::of).orElse(List.of())
            : tenantRepository.findAll();
    List<UsageAlert> alerts = new ArrayList<>();

    for (Tenant tenant : tenants) {
      if (tenant.isKillSwitch()) {
        alerts.add(new UsageAlert(tenant.getId(), "kill_switch", "critical", "Kill switch activo", null, null));
      }
      Policy policy = policyRepository.findByTenantId(tenant.getId()).orElse(null);
      if (policy == null) {
        continue;
      }
      UsageService.Totals totals = usageService.getDailyTotals(tenant.getId(), java.time.LocalDate.now(java.time.ZoneOffset.UTC));
      double maxTokens = policy.getMaxTokensPerDay();
      double maxCost =
          policy.getMaxCostPerDayUsd() != null ? policy.getMaxCostPerDayUsd().doubleValue() : 0;

      if (maxTokens > 0) {
        double ratio = totals.tokens() / maxTokens;
        if (ratio >= 1) {
          alerts.add(new UsageAlert(tenant.getId(), "tokens", "critical", "Límite de tokens alcanzado", (double) totals.tokens(), maxTokens));
        } else if (ratio >= 0.8) {
          alerts.add(new UsageAlert(tenant.getId(), "tokens", "warning", "Tokens cerca del límite", (double) totals.tokens(), maxTokens));
        }
      }

      if (maxCost > 0) {
        double ratio = totals.costUsd() / maxCost;
        if (ratio >= 1) {
          alerts.add(new UsageAlert(tenant.getId(), "cost", "critical", "Límite de coste alcanzado", totals.costUsd(), maxCost));
        } else if (ratio >= 0.8) {
          alerts.add(new UsageAlert(tenant.getId(), "cost", "warning", "Coste cerca del límite", totals.costUsd(), maxCost));
        }
      }
    }

    return alerts;
  }

  public record UsageAlert(
      String tenantId, String type, String severity, String message, Double value, Double limit) {}
}
