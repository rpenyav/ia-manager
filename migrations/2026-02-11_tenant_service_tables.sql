-- Ensure chat_conversations has serviceCode column
SET @cc_col_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'chat_conversations'
    AND column_name = 'serviceCode'
);

SET @cc_ddl = IF(
  @cc_col_exists = 0,
  "ALTER TABLE chat_conversations ADD COLUMN serviceCode varchar(64) NOT NULL DEFAULT 'chat_generic' AFTER model;",
  'SELECT 1'
);

PREPARE stmt_cc FROM @cc_ddl;
EXECUTE stmt_cc;
DEALLOCATE PREPARE stmt_cc;

-- Tenant service config table
CREATE TABLE IF NOT EXISTS tenant_service_configs (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  systemPrompt text NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_service_config (tenantId, serviceCode)
) ENGINE=InnoDB;

-- Tenant service endpoints table
CREATE TABLE IF NOT EXISTS tenant_service_endpoints (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  slug varchar(64) NOT NULL,
  method varchar(12) NOT NULL,
  path varchar(255) NOT NULL,
  baseUrl varchar(255) NULL,
  headers json NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_service_endpoint (tenantId, serviceCode, slug)
) ENGINE=InnoDB;

-- Tenant service users table
CREATE TABLE IF NOT EXISTS tenant_service_users (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  userId varchar(36) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_service_user (tenantId, serviceCode, userId)
) ENGINE=InnoDB;
