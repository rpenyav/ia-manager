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
@Table(name = "subscriptions")
public class Subscription {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false, unique = true)
  private String tenantId;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(length = 16, nullable = false)
  private String period;

  @Column(name = "basePriceEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal basePriceEur;

  @Column(length = 3, nullable = false)
  private String currency;

  @Column(name = "currentPeriodStart", nullable = false)
  private LocalDateTime currentPeriodStart;

  @Column(name = "currentPeriodEnd", nullable = false)
  private LocalDateTime currentPeriodEnd;

  @Column(name = "cancelAtPeriodEnd", nullable = false)
  private boolean cancelAtPeriodEnd;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
