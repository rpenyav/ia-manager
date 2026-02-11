package com.neria.manager.common.repos;

import com.neria.manager.common.entities.UsageEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsageEventRepository extends JpaRepository<UsageEvent, String> {
  List<UsageEvent> findTop200ByOrderByCreatedAtDesc();
  List<UsageEvent> findTop200ByTenantIdOrderByCreatedAtDesc(String tenantId);
}
