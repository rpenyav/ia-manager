package com.neria.manager.common.repos;

import com.neria.manager.common.entities.Subscription;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, String> {
  Optional<Subscription> findByTenantId(String tenantId);
}
