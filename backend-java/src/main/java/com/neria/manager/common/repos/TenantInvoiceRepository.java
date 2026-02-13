package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantInvoice;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantInvoiceRepository extends JpaRepository<TenantInvoice, String> {
  List<TenantInvoice> findByTenantIdOrderByIssuedAtDesc(String tenantId);

  List<TenantInvoice> findBySubscriptionId(String subscriptionId);

  Optional<TenantInvoice> findFirstByPaymentRequestId(String paymentRequestId);
}
