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
@Table(name = "pricing_models")
public class PricingModel {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "providerType", length = 64, nullable = false)
  private String providerType;

  @Column(name = "model", length = 128, nullable = false)
  private String model;

  @Column(name = "inputCostPer1k", precision = 10, scale = 6, nullable = false)
  private BigDecimal inputCostPer1k;

  @Column(name = "outputCostPer1k", precision = 10, scale = 6, nullable = false)
  private BigDecimal outputCostPer1k;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
