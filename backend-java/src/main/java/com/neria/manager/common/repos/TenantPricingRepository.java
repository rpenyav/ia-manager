package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantPricing;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantPricingRepository extends JpaRepository<TenantPricing, String> {
  List<TenantPricing> findByTenantId(String tenantId);
  void deleteByTenantId(String tenantId);
}
