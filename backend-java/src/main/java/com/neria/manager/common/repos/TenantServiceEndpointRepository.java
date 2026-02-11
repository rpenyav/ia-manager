package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceEndpoint;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceEndpointRepository
    extends JpaRepository<TenantServiceEndpoint, String> {
  List<TenantServiceEndpoint> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceEndpoint> findByIdAndTenantIdAndServiceCode(
      String id, String tenantId, String serviceCode);

  long countByTenantIdAndServiceCode(String tenantId, String serviceCode);
}
