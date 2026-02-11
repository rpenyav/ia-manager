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
@Table(name = "db_connections")
public class DbConnection {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(length = 120, nullable = false)
  private String name;

  @Column(length = 32, nullable = false)
  private String engine;

  @Column(columnDefinition = "text", nullable = false)
  private String encryptedConfig;

  @Column(columnDefinition = "json", nullable = false)
  private String allowedTables;

  @Column(nullable = false)
  private boolean readOnly;

  @Column(columnDefinition = "json", nullable = false)
  private String metadata;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
