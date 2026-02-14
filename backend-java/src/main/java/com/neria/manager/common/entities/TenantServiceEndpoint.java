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
@Table(name = "tenant_service_endpoints")
public class TenantServiceEndpoint {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "serviceCode", length = 64, nullable = false)
  private String serviceCode;

  @Column(length = 64, nullable = false)
  private String slug;

  @Column(length = 12, nullable = false)
  private String method;

  @Column(length = 255, nullable = false)
  private String path;

  @Column(length = 255)
  private String baseUrl;

  @Column(columnDefinition = "json")
  private String headers;

  @Column(length = 255)
  private String responsePath;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
