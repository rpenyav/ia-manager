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
@Table(name = "audit_events")
public class AuditEvent {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(length = 64, nullable = false)
  private String action;

  @Column(length = 32, nullable = false)
  private String status;

  @Column(columnDefinition = "json", nullable = false)
  private String metadata;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
