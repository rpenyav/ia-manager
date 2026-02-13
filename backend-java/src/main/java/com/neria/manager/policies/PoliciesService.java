package com.neria.manager.policies;

import com.neria.manager.common.entities.Policy;
import com.neria.manager.common.repos.PolicyRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PoliciesService {
  private final PolicyRepository repository;

  public PoliciesService(PolicyRepository repository) {
    this.repository = repository;
  }

  public Policy getByTenant(String tenantId) {
    return repository.findByTenantId(tenantId).orElse(null);
  }

  public Policy getByIdForTenant(String tenantId, String policyId) {
    if (policyId == null || policyId.isBlank()) {
      return null;
    }
    Policy policy = repository.findById(policyId).orElse(null);
    if (policy == null) {
      return null;
    }
    return tenantId != null && tenantId.equals(policy.getTenantId()) ? policy : null;
  }

  public List<Policy> listAll() {
    return repository.findAll();
  }

  public Policy upsert(String tenantId, UpdatePolicyRequest dto) {
    Policy policy = getByTenant(tenantId);
    if (policy == null) {
      policy = new Policy();
      policy.setId(UUID.randomUUID().toString());
      policy.setTenantId(tenantId);
      policy.setCreatedAt(LocalDateTime.now());
    }
    policy.setMaxRequestsPerMinute(dto.maxRequestsPerMinute != null ? dto.maxRequestsPerMinute : 60);
    policy.setMaxTokensPerDay(dto.maxTokensPerDay != null ? dto.maxTokensPerDay : 200000);
    policy.setMaxCostPerDayUsd(
        dto.maxCostPerDayUsd != null ? dto.maxCostPerDayUsd : BigDecimal.ZERO);
    policy.setRedactionEnabled(dto.redactionEnabled != null ? dto.redactionEnabled : true);
    policy.setMetadata(dto.metadataJson != null ? dto.metadataJson : "{}");
    policy.setUpdatedAt(LocalDateTime.now());
    return repository.save(policy);
  }

  public void deleteByTenant(String tenantId) {
    repository.deleteByTenantId(tenantId);
  }

  public static class UpdatePolicyRequest {
    public Integer maxRequestsPerMinute;
    public Integer maxTokensPerDay;
    public BigDecimal maxCostPerDayUsd;
    public Boolean redactionEnabled;
    public String metadataJson;
  }
}
