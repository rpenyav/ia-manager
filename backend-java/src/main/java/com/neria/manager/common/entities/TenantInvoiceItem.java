package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tenant_invoice_items")
public class TenantInvoiceItem {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "invoiceId", length = 36, nullable = false)
  private String invoiceId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 255)
  private String description;

  @Column(name = "priceEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal priceEur;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
