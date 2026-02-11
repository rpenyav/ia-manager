package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantServiceUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantServiceUserRepository extends JpaRepository<TenantServiceUser, String> {
  List<TenantServiceUser> findByTenantIdAndServiceCodeOrderByCreatedAtDesc(
      String tenantId, String serviceCode);

  Optional<TenantServiceUser> findByTenantIdAndServiceCodeAndUserId(
      String tenantId, String serviceCode, String userId);

  List<TenantServiceUser> findByTenantIdAndUserId(String tenantId, String userId);

  long countByTenantIdAndServiceCode(String tenantId, String serviceCode);

  void deleteByTenantIdAndServiceCodeAndUserId(
      String tenantId, String serviceCode, String userId);

  void deleteByTenantIdAndUserId(String tenantId, String userId);
}
