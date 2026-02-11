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
@Table(name = "service_catalog")
public class ServiceCatalog {
  @Id
  @Column(length = 36)
  private String id;

  @Column(length = 64, unique = true, nullable = false)
  private String code;

  @Column(length = 120, nullable = false)
  private String name;

  @Column(columnDefinition = "text", nullable = false)
  private String description;

  @Column(name = "priceMonthlyEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal priceMonthlyEur;

  @Column(name = "priceAnnualEur", precision = 10, scale = 2, nullable = false)
  private BigDecimal priceAnnualEur;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
