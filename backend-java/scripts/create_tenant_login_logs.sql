CREATE TABLE IF NOT EXISTS tenant_login_logs (
  id VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NULL,
  apiKeyId VARCHAR(36) NULL,
  userId VARCHAR(36) NULL,
  email VARCHAR(160) NULL,
  status VARCHAR(32) NOT NULL,
  error VARCHAR(255) NULL,
  ipAddress VARCHAR(64) NULL,
  userAgent VARCHAR(255) NULL,
  createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tenant_login_logs_tenant (tenantId),
  INDEX idx_tenant_login_logs_service (serviceCode),
  INDEX idx_tenant_login_logs_created (createdAt)
);
