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
@Table(name = "subscription_services")
public class SubscriptionService {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "subscriptionId", length = 36, nullable = false)
  private String subscriptionId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 16, nullable = false)
  private String status;

  @Column(name = "activateAt")
  private LocalDateTime activateAt;

  @Column(name = "deactivateAt")
  private LocalDateTime deactivateAt;

  @Column(name = "priceEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal priceEur;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
