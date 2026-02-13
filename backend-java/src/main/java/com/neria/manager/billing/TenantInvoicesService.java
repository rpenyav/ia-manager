package com.neria.manager.billing;

import com.neria.manager.common.entities.TenantInvoice;
import com.neria.manager.common.entities.TenantInvoiceItem;
import com.neria.manager.common.repos.TenantInvoiceItemRepository;
import com.neria.manager.common.repos.TenantInvoiceRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class TenantInvoicesService {
  private final TenantInvoiceRepository invoiceRepository;
  private final TenantInvoiceItemRepository itemRepository;

  public TenantInvoicesService(
      TenantInvoiceRepository invoiceRepository, TenantInvoiceItemRepository itemRepository) {
    this.invoiceRepository = invoiceRepository;
    this.itemRepository = itemRepository;
  }

  public List<Map<String, Object>> listByTenant(String tenantId) {
    List<TenantInvoice> invoices = invoiceRepository.findByTenantIdOrderByIssuedAtDesc(tenantId);
    Map<String, List<TenantInvoiceItem>> itemsByInvoice = new HashMap<>();
    for (TenantInvoice invoice : invoices) {
      itemsByInvoice.put(invoice.getId(), itemRepository.findByInvoiceId(invoice.getId()));
    }
    return invoices.stream()
        .map(
            invoice ->
                Map.of(
                    "invoice",
                    invoice,
                    "items",
                    itemsByInvoice.getOrDefault(invoice.getId(), List.of())))
        .toList();
  }
}
