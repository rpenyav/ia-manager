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
@Table(name = "tenant_service_api_keys")
public class TenantServiceApiKey {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(name = "hashedKey", length = 255, nullable = false)
  private String hashedKey;

  @Column(name = "encryptedKey", columnDefinition = "text", nullable = false)
  private String encryptedKey;

  @Column(nullable = false, length = 16)
  private String status;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
