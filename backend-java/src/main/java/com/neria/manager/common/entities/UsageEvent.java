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
@Table(name = "usage_events")
public class UsageEvent {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "providerId", length = 36, nullable = false)
  private String providerId;

  @Column(length = 64, nullable = false)
  private String model;

  @Column(name = "serviceCode", length = 64)
  private String serviceCode;

  @Column(nullable = false)
  private int tokensIn;

  @Column(nullable = false)
  private int tokensOut;

  @Column(name = "costUsd", precision = 10, scale = 6, nullable = false)
  private BigDecimal costUsd;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
