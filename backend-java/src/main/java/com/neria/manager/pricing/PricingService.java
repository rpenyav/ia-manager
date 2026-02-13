package com.neria.manager.pricing;

import com.neria.manager.common.entities.PricingModel;
import com.neria.manager.common.repos.PricingModelRepository;
import com.neria.manager.common.repos.TenantPricingRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PricingService {
  private final PricingModelRepository pricingRepository;
  private final TenantPricingRepository tenantPricingRepository;

  public PricingService(
      PricingModelRepository pricingRepository, TenantPricingRepository tenantPricingRepository) {
    this.pricingRepository = pricingRepository;
    this.tenantPricingRepository = tenantPricingRepository;
  }

  public List<PricingModel> list() {
    return pricingRepository.findAllByOrderByProviderTypeAscModelAsc();
  }

  public PricingModel create(CreatePricingRequest dto) {
    PricingModel item = new PricingModel();
    item.setId(UUID.randomUUID().toString());
    item.setProviderType(normalizeProviderType(dto.providerType));
    item.setModel(dto.model);
    item.setInputCostPer1k(dto.inputCostPer1k);
    item.setOutputCostPer1k(dto.outputCostPer1k);
    item.setEnabled(dto.enabled != null ? dto.enabled : true);
    item.setCreatedAt(LocalDateTime.now());
    item.setUpdatedAt(LocalDateTime.now());
    return pricingRepository.save(item);
  }

  public PricingModel update(String id, UpdatePricingRequest dto) {
    PricingModel item = pricingRepository.findById(id).orElseThrow();
    if (dto.providerType != null) {
      item.setProviderType(normalizeProviderType(dto.providerType));
    }
    if (dto.model != null) item.setModel(dto.model);
    if (dto.inputCostPer1k != null) item.setInputCostPer1k(dto.inputCostPer1k);
    if (dto.outputCostPer1k != null) item.setOutputCostPer1k(dto.outputCostPer1k);
    if (dto.enabled != null) item.setEnabled(dto.enabled);
    item.setUpdatedAt(LocalDateTime.now());
    return pricingRepository.save(item);
  }

  public PricingModel resolve(String providerType, String model) {
    String normalized = normalizeProviderType(providerType);
    PricingModel exact =
        pricingRepository
            .findByProviderTypeAndModelAndEnabled(normalized, model, true)
            .orElse(null);
    if (exact != null) {
      return exact;
    }
    return pricingRepository
        .findByProviderTypeAndModelAndEnabled(normalized, "*", true)
        .orElse(null);
  }

  public PricingModel resolveForTenant(String tenantId, String providerType, String model) {
    String normalized = normalizeProviderType(providerType);
    List<String> pricingIds =
        tenantPricingRepository.findByTenantId(tenantId).stream()
            .map(item -> item.getPricingId())
            .toList();
    if (pricingIds.isEmpty()) {
      return null;
    }

    PricingModel exact =
        pricingRepository.findAllById(pricingIds).stream()
            .filter(item -> item.isEnabled())
            .filter(item -> normalized.equals(item.getProviderType()))
            .filter(item -> model.equals(item.getModel()))
            .findFirst()
            .orElse(null);
    if (exact != null) {
      return exact;
    }
    return pricingRepository.findAllById(pricingIds).stream()
        .filter(item -> item.isEnabled())
        .filter(item -> normalized.equals(item.getProviderType()))
        .filter(item -> "*".equals(item.getModel()))
        .findFirst()
        .orElse(null);
  }

  public PricingModel resolveById(String pricingId) {
    if (pricingId == null || pricingId.isBlank()) {
      return null;
    }
    PricingModel model = pricingRepository.findById(pricingId).orElse(null);
    if (model == null || !model.isEnabled()) {
      return null;
    }
    return model;
  }

  public double calculateCost(PricingModel entry, int tokensIn, int tokensOut) {
    if (entry == null) {
      return 0d;
    }
    double input = (tokensIn / 1000d) * entry.getInputCostPer1k().doubleValue();
    double output = (tokensOut / 1000d) * entry.getOutputCostPer1k().doubleValue();
    return Math.round((input + output) * 1_000_000d) / 1_000_000d;
  }

  public PricingModel upsertByModel(UpsertPricingRequest entry) {
    String normalized = normalizeProviderType(entry.providerType);
    PricingModel existing =
        pricingRepository.findByProviderTypeAndModel(normalized, entry.model).orElse(null);
    if (existing != null) {
      existing.setInputCostPer1k(entry.inputCostPer1k);
      existing.setOutputCostPer1k(entry.outputCostPer1k);
      existing.setEnabled(true);
      existing.setUpdatedAt(LocalDateTime.now());
      return pricingRepository.save(existing);
    }
    PricingModel created = new PricingModel();
    created.setId(UUID.randomUUID().toString());
    created.setProviderType(normalized);
    created.setModel(entry.model);
    created.setInputCostPer1k(entry.inputCostPer1k);
    created.setOutputCostPer1k(entry.outputCostPer1k);
    created.setEnabled(true);
    created.setCreatedAt(LocalDateTime.now());
    created.setUpdatedAt(LocalDateTime.now());
    return pricingRepository.save(created);
  }

  private String normalizeProviderType(String providerType) {
    String normalized = providerType == null ? "" : providerType.toLowerCase();
    if (List.of("azure", "azure_openai", "azure-openai").contains(normalized)) {
      return "azure-openai";
    }
    if (List.of("aws", "bedrock", "aws-bedrock").contains(normalized)) {
      return "aws-bedrock";
    }
    if (List.of("google", "gcp", "vertex", "vertex-ai").contains(normalized)) {
      return "vertex-ai";
    }
    return normalized.isBlank() ? "openai" : normalized;
  }

  public static class CreatePricingRequest {
    public String providerType;
    public String model;
    public BigDecimal inputCostPer1k;
    public BigDecimal outputCostPer1k;
    public Boolean enabled;
  }

  public static class UpdatePricingRequest {
    public String providerType;
    public String model;
    public BigDecimal inputCostPer1k;
    public BigDecimal outputCostPer1k;
    public Boolean enabled;
  }

  public static class UpsertPricingRequest {
    public String providerType;
    public String model;
    public BigDecimal inputCostPer1k;
    public BigDecimal outputCostPer1k;
  }
}
