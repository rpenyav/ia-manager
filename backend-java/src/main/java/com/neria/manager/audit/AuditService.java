package com.neria.manager.audit;

import com.neria.manager.common.entities.AuditEvent;
import com.neria.manager.common.repos.AuditEventRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
  private final AuditEventRepository auditRepository;

  public AuditService(AuditEventRepository auditRepository) {
    this.auditRepository = auditRepository;
  }

  public AuditEvent record(AuditEvent event) {
    if (event.getId() == null || event.getId().isBlank()) {
      event.setId(UUID.randomUUID().toString());
    }
    if (event.getCreatedAt() == null) {
      event.setCreatedAt(LocalDateTime.now());
    }
    if (event.getMetadata() == null) {
      event.setMetadata("{}");
    }
    return auditRepository.save(event);
  }

  public List<AuditEvent> list(int limit, String tenantId) {
    List<AuditEvent> events =
        tenantId != null && !tenantId.isBlank()
            ? auditRepository.findTop500ByTenantIdOrderByCreatedAtDesc(tenantId)
            : auditRepository.findTop500ByOrderByCreatedAtDesc();
    return events.subList(0, Math.min(limit, events.size()));
  }
}
