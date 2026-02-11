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
@Table(name = "subscription_payment_requests")
public class SubscriptionPaymentRequest {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "subscriptionId", length = 36, nullable = false)
  private String subscriptionId;

  @Column(length = 180, nullable = false)
  private String email;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(length = 32, nullable = false)
  private String provider;

  @Column(length = 160)
  private String providerRef;

  @Column(length = 64, nullable = false)
  private String tokenHash;

  @Column(name = "amountEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal amountEur;

  @Column(name = "expiresAt", nullable = false)
  private LocalDateTime expiresAt;

  @Column(name = "completedAt")
  private LocalDateTime completedAt;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
