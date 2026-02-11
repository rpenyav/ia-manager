package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "api_keys")
public class ApiKey {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36)
  private String tenantId;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(name = "hashedKey", length = 255, nullable = false)
  private String hashedKey;

  @Column(nullable = false, length = 16)
  private String status;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
