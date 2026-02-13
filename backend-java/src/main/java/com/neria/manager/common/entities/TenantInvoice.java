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
@Table(name = "tenant_invoices")
public class TenantInvoice {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "subscriptionId", length = 36)
  private String subscriptionId;

  @Column(name = "paymentRequestId", length = 36)
  private String paymentRequestId;

  @Column(length = 16, nullable = false)
  private String period;

  @Column(name = "basePriceEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal basePriceEur;

  @Column(name = "servicesPriceEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal servicesPriceEur;

  @Column(name = "totalEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal totalEur;

  @Column(length = 3, nullable = false)
  private String currency;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(name = "issuedAt", nullable = false)
  private LocalDateTime issuedAt;

  @Column(name = "paidAt")
  private LocalDateTime paidAt;

  @Column(name = "periodStart")
  private LocalDateTime periodStart;

  @Column(name = "periodEnd")
  private LocalDateTime periodEnd;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
