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
@Table(name = "notification_channels")
public class NotificationChannel {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36)
  private String tenantId;

  @Column(length = 16, nullable = false)
  private String type;

  @Column(columnDefinition = "json", nullable = false)
  private String config;

  @Column(columnDefinition = "text")
  private String encryptedSecret;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
