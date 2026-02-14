CREATE TABLE IF NOT EXISTS tenant_service_api_keys (
  id VARCHAR(36) NOT NULL,
  tenantId VARCHAR(36) NOT NULL,
  serviceCode VARCHAR(64) NOT NULL,
  hashedKey VARCHAR(255) NOT NULL,
  encryptedKey TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_service_api_keys_service (tenantId, serviceCode),
  INDEX idx_tenant_service_api_keys_hash (hashedKey),
  INDEX idx_tenant_service_api_keys_tenant (tenantId)
);
