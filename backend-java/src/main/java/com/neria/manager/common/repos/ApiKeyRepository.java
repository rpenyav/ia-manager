package com.neria.manager.common.repos;

import com.neria.manager.common.entities.ApiKey;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiKeyRepository extends JpaRepository<ApiKey, String> {
  Optional<ApiKey> findByHashedKeyAndStatus(String hashedKey, String status);
  List<ApiKey> findByTenantId(String tenantId);
}
