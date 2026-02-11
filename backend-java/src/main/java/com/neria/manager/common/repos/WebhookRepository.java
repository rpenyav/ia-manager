package com.neria.manager.common.repos;

import com.neria.manager.common.entities.Webhook;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookRepository extends JpaRepository<Webhook, String> {
  List<Webhook> findByTenantId(String tenantId);

  List<Webhook> findAllByOrderByCreatedAtDesc();

  List<Webhook> findByEnabled(boolean enabled);
}
