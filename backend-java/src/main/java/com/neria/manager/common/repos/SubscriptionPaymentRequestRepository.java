package com.neria.manager.common.repos;

import com.neria.manager.common.entities.SubscriptionPaymentRequest;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionPaymentRequestRepository
    extends JpaRepository<SubscriptionPaymentRequest, String> {
  Optional<SubscriptionPaymentRequest> findByTokenHashAndStatus(String tokenHash, String status);

  List<SubscriptionPaymentRequest> findByTenantIdAndStatusOrderByCreatedAtDesc(
      String tenantId, String status);

  Optional<SubscriptionPaymentRequest> findFirstByTenantIdAndStatusOrderByCreatedAtDesc(
      String tenantId, String status);

  void deleteByTenantId(String tenantId);

  void deleteBySubscriptionId(String subscriptionId);
}
