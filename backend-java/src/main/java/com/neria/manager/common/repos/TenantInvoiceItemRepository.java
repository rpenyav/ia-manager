package com.neria.manager.common.repos;

import com.neria.manager.common.entities.TenantInvoiceItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantInvoiceItemRepository extends JpaRepository<TenantInvoiceItem, String> {
  List<TenantInvoiceItem> findByInvoiceId(String invoiceId);

  void deleteByInvoiceIdIn(List<String> invoiceIds);
}
