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
@Table(name = "webhooks")
public class Webhook {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36)
  private String tenantId;

  @Column(length = 255, nullable = false)
  private String url;

  @Column(columnDefinition = "json", nullable = false)
  private String events;

  @Column(columnDefinition = "text")
  private String encryptedSecret;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
