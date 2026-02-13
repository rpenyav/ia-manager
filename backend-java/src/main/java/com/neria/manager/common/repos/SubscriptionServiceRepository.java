package com.neria.manager.common.repos;

import com.neria.manager.common.entities.SubscriptionService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionServiceRepository extends JpaRepository<SubscriptionService, String> {
  List<SubscriptionService> findBySubscriptionId(String subscriptionId);

  void deleteBySubscriptionId(String subscriptionId);

  List<SubscriptionService> findBySubscriptionIdAndStatusAndActivateAtLessThanEqual(
      String subscriptionId, String status, LocalDateTime time);

  List<SubscriptionService> findBySubscriptionIdAndStatusAndDeactivateAtLessThanEqual(
      String subscriptionId, String status, LocalDateTime time);
}
