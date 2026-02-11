package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceConfig;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceConfigRepository extends JpaRepository<TenantServiceConfig, String> {
  Optional<TenantServiceConfig> findByTenantIdAndServiceCode(String tenantId, String serviceCode);

  List<TenantServiceConfig> findByTenantId(String tenantId);

  List<TenantServiceConfig> findByTenantIdAndServiceCodeIn(String tenantId, List<String> codes);
}
