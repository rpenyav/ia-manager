package com.neria.manager.common.repos;

import com.neria.manager.common.entities.AuditEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, String> {
  List<AuditEvent> findTop500ByOrderByCreatedAtDesc();
  List<AuditEvent> findTop500ByTenantIdOrderByCreatedAtDesc(String tenantId);
}
