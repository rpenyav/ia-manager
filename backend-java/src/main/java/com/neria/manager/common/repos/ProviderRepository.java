package com.neria.manager.common.repos;

import com.neria.manager.common.entities.Provider;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderRepository extends JpaRepository<Provider, String> {
  List<Provider> findByTenantId(String tenantId);
}
