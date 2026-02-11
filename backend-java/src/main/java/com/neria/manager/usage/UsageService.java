package com.neria.manager.usage;

import com.neria.manager.common.entities.UsageEvent;
import com.neria.manager.common.repos.UsageEventRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UsageService {
  private final UsageEventRepository usageRepository;

  public UsageService(UsageEventRepository usageRepository) {
    this.usageRepository = usageRepository;
  }

  public UsageEvent record(UsageEvent event) {
    if (event.getId() == null || event.getId().isBlank()) {
      event.setId(UUID.randomUUID().toString());
    }
    if (event.getCreatedAt() == null) {
      event.setCreatedAt(LocalDateTime.now());
    }
    if (event.getCostUsd() == null) {
      event.setCostUsd(BigDecimal.ZERO);
    }
    return usageRepository.save(event);
  }

  public Totals getDailyTotals(String tenantId, LocalDate date) {
    LocalDateTime start = date.atStartOfDay();
    LocalDateTime end = date.plusDays(1).atStartOfDay();
    List<UsageEvent> events =
        usageRepository.findTop200ByTenantIdOrderByCreatedAtDesc(tenantId);
    int tokens = 0;
    double cost = 0;
    for (UsageEvent event : events) {
      if (event.getCreatedAt() == null) {
        continue;
      }
      LocalDateTime createdAt = event.getCreatedAt();
      if (createdAt.isBefore(start) || !createdAt.isBefore(end)) {
        continue;
      }
      tokens += event.getTokensIn() + event.getTokensOut();
      cost += event.getCostUsd().doubleValue();
    }
    return new Totals(tokens, cost);
  }

  public Map<String, Object> getSummaryByTenant(String tenantId) {
    Totals totals = getDailyTotals(tenantId, LocalDate.now(ZoneOffset.UTC));
    return Map.of("tenantId", tenantId, "tokens", totals.tokens, "costUsd", totals.costUsd);
  }

  public List<Map<String, Object>> getSummaryAll() {
    List<UsageEvent> events = usageRepository.findTop200ByOrderByCreatedAtDesc();
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    LocalDateTime start = today.atStartOfDay();
    LocalDateTime end = today.plusDays(1).atStartOfDay();
    return events.stream()
        .filter(event -> event.getCreatedAt() != null)
        .filter(event -> !event.getCreatedAt().isBefore(start) && event.getCreatedAt().isBefore(end))
        .collect(java.util.stream.Collectors.groupingBy(UsageEvent::getTenantId))
        .entrySet()
        .stream()
        .map(
            entry -> {
              int tokens = 0;
              double cost = 0;
              for (UsageEvent event : entry.getValue()) {
                tokens += event.getTokensIn() + event.getTokensOut();
                cost += event.getCostUsd().doubleValue();
              }
              Map<String, Object> summary = new java.util.HashMap<>();
              summary.put("tenantId", entry.getKey());
              summary.put("tokens", tokens);
              summary.put("costUsd", cost);
              return summary;
            })
        .toList();
  }

  public List<UsageEvent> listEvents(String tenantId, int limit) {
    List<UsageEvent> events = usageRepository.findTop200ByTenantIdOrderByCreatedAtDesc(tenantId);
    return events.subList(0, Math.min(limit, events.size()));
  }

  public List<UsageEvent> listEventsAll(int limit) {
    List<UsageEvent> events = usageRepository.findTop200ByOrderByCreatedAtDesc();
    return events.subList(0, Math.min(limit, events.size()));
  }

  public record Totals(int tokens, double costUsd) {}
}
