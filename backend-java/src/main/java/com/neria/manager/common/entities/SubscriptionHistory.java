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
@Table(name = "subscription_history")
public class SubscriptionHistory {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "subscriptionId", length = 36)
  private String subscriptionId;

  @Column(length = 16, nullable = false)
  private String period;

  @Column(name = "basePriceEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal basePriceEur;

  @Column(name = "servicesPriceEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal servicesPriceEur;

  @Column(name = "totalBilledEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal totalBilledEur;

  @Column(name = "startedAt", nullable = false)
  private LocalDateTime startedAt;

  @Column(name = "endedAt", nullable = false)
  private LocalDateTime endedAt;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
