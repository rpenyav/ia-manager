package com.neria.manager.tenantpricing;

import com.neria.manager.common.entities.TenantPricing;
import com.neria.manager.common.repos.PricingModelRepository;
import com.neria.manager.common.repos.TenantPricingRepository;
import com.neria.manager.tenants.TenantsService;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TenantPricingService {
  private final TenantPricingRepository tenantPricingRepository;
  private final PricingModelRepository pricingRepository;
  private final TenantsService tenantsService;

  public TenantPricingService(
      TenantPricingRepository tenantPricingRepository,
      PricingModelRepository pricingRepository,
      TenantsService tenantsService) {
    this.tenantPricingRepository = tenantPricingRepository;
    this.pricingRepository = pricingRepository;
    this.tenantsService = tenantsService;
  }

  public TenantPricingResponse getByTenantId(String tenantId) {
    if (tenantsService.getById(tenantId) == null) {
      throw new IllegalArgumentException("Tenant not found");
    }
    List<TenantPricing> assignments = tenantPricingRepository.findByTenantId(tenantId);
    return new TenantPricingResponse(
        tenantId, assignments.stream().map(TenantPricing::getPricingId).toList());
  }

  public TenantPricingResponse upsert(String tenantId, TenantPricingUpdateRequest dto) {
    if (tenantsService.getById(tenantId) == null) {
      throw new IllegalArgumentException("Tenant not found");
    }
    Set<String> unique = new HashSet<>(dto.pricingIds == null ? List.of() : dto.pricingIds);
    if (!unique.isEmpty()) {
      long count = pricingRepository.findAllById(unique).size();
      if (count != unique.size()) {
        throw new IllegalArgumentException("One or more pricing entries not found");
      }
    }
    tenantPricingRepository.deleteByTenantId(tenantId);
    if (unique.isEmpty()) {
      return new TenantPricingResponse(tenantId, List.of());
    }
    List<TenantPricing> rows =
        unique.stream()
            .map(
                pricingId -> {
                  TenantPricing row = new TenantPricing();
                  row.setId(UUID.randomUUID().toString());
                  row.setTenantId(tenantId);
                  row.setPricingId(pricingId);
                  row.setCreatedAt(LocalDateTime.now());
                  return row;
                })
            .toList();
    tenantPricingRepository.saveAll(rows);
    return new TenantPricingResponse(tenantId, unique.stream().toList());
  }

  public record TenantPricingUpdateRequest(List<String> pricingIds) {}

  public record TenantPricingResponse(String tenantId, List<String> pricingIds) {}
}
