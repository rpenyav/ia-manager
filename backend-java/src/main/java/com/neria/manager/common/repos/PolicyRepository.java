package com.neria.manager.common.repos;

import com.neria.manager.common.entities.Policy;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyRepository extends JpaRepository<Policy, String> {
  Optional<Policy> findByTenantId(String tenantId);
  long deleteByTenantId(String tenantId);
}
