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
@Table(name = "providers")
public class Provider {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "type", length = 64, nullable = false)
  private String type;

  @Column(name = "displayName", length = 255, nullable = false)
  private String displayName;

  @Column(name = "encryptedCredentials", columnDefinition = "text", nullable = false)
  private String encryptedCredentials;

  @Column(name = "config", columnDefinition = "json", nullable = false)
  private String config;

  @Column(name = "enabled", nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
