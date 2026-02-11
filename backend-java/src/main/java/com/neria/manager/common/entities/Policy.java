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
@Table(name = "policies")
public class Policy {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "maxRequestsPerMinute", nullable = false)
  private int maxRequestsPerMinute;

  @Column(name = "maxTokensPerDay", nullable = false)
  private int maxTokensPerDay;

  @Column(name = "maxCostPerDayUsd", precision = 10, scale = 4, nullable = false)
  private BigDecimal maxCostPerDayUsd;

  @Column(name = "redactionEnabled", nullable = false)
  private boolean redactionEnabled;

  @Column(name = "metadata", columnDefinition = "json", nullable = false)
  private String metadata;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
