package com.neria.manager.common.repos;

import com.neria.manager.common.entities.SubscriptionHistory;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, String> {
  Optional<SubscriptionHistory> findBySubscriptionIdAndStartedAt(
      String subscriptionId, LocalDateTime startedAt);

  void deleteByTenantId(String tenantId);

  void deleteBySubscriptionId(String subscriptionId);
}
