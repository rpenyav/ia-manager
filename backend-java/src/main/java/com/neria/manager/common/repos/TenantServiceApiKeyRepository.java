package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceApiKey;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceApiKeyRepository extends JpaRepository<TenantServiceApiKey, String> {
  Optional<TenantServiceApiKey> findByTenantIdAndServiceCode(String tenantId, String serviceCode);

  Optional<TenantServiceApiKey> findByHashedKeyAndStatus(String hashedKey, String status);

  List<TenantServiceApiKey> findByTenantId(String tenantId);

  List<TenantServiceApiKey> findByTenantIdAndServiceCodeIn(
      String tenantId, List<String> serviceCodes);

  void deleteByTenantIdAndServiceCode(String tenantId, String serviceCode);
}
