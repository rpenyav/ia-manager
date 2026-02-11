package com.neria.manager.common.repos;

import com.neria.manager.common.entities.Tenant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, String> {
  Optional<Tenant> findByAuthUsername(String authUsername);
}
