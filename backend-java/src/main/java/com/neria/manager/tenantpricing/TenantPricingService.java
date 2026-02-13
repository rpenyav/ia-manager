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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

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
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    List<TenantPricing> assignments = tenantPricingRepository.findByTenantId(tenantId);
    return new TenantPricingResponse(
        tenantId, assignments.stream().map(TenantPricing::getPricingId).toList());
  }

  @Transactional
  public TenantPricingResponse upsert(String tenantId, TenantPricingUpdateRequest dto) {
    if (tenantsService.getById(tenantId) == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    Set<String> unique = new HashSet<>(dto.pricingIds == null ? List.of() : dto.pricingIds);
    if (!unique.isEmpty()) {
      List<String> found =
          pricingRepository.findAllById(unique).stream().map(item -> item.getId()).toList();
      if (found.size() != unique.size()) {
        List<String> missing =
            unique.stream().filter(id -> !found.contains(id)).toList();
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Pricing entries not found: " + missing);
      }
    }
    tenantPricingRepository.deleteByTenantId(tenantId);
    tenantPricingRepository.flush();
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
