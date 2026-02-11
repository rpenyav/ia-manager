package com.neria.manager.common.repos;

import com.neria.manager.common.entities.DbConnection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DbConnectionRepository extends JpaRepository<DbConnection, String> {
  List<DbConnection> findByTenantIdOrderByCreatedAtDesc(String tenantId);

  Optional<DbConnection> findByIdAndTenantId(String id, String tenantId);
}
