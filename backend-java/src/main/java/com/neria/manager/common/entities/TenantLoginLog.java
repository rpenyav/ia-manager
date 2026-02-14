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
@Table(name = "tenant_login_logs")
public class TenantLoginLog {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64)
  private String serviceCode;

  @Column(name = "apiKeyId", length = 36)
  private String apiKeyId;

  @Column(name = "userId", length = 36)
  private String userId;

  @Column(length = 160)
  private String email;

  @Column(length = 32, nullable = false)
  private String status;

  @Column(length = 255)
  private String error;

  @Column(name = "ipAddress", length = 64)
  private String ipAddress;

  @Column(name = "userAgent", length = 255)
  private String userAgent;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
