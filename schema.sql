-- Provider Manager IA schema

CREATE TABLE IF NOT EXISTS tenants (
  id varchar(36) NOT NULL,
  name varchar(120) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'active',
  killSwitch tinyint(1) NOT NULL DEFAULT 0,
  authUsername varchar(120) NULL,
  authPasswordHash varchar(255) NULL,
  authMustChangePassword tinyint(1) NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY authUsername (authUsername)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS providers (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  type varchar(64) NOT NULL,
  displayName varchar(255) NOT NULL,
  encryptedCredentials text NOT NULL,
  config json NOT NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS policies (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  maxRequestsPerMinute int NOT NULL DEFAULT 60,
  maxTokensPerDay int NOT NULL DEFAULT 200000,
  maxCostPerDayUsd decimal(10,4) NOT NULL DEFAULT 0,
  redactionEnabled tinyint(1) NOT NULL DEFAULT 1,
  metadata json NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usage_events (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  providerId varchar(36) NOT NULL,
  model varchar(64) NOT NULL,
  serviceCode varchar(64) NULL,
  tokensIn int NOT NULL,
  tokensOut int NOT NULL,
  costUsd decimal(10,6) NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_events (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  action varchar(64) NOT NULL,
  status varchar(32) NOT NULL,
  metadata json NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_keys (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NULL,
  name varchar(120) NOT NULL,
  hashedKey varchar(255) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_settings (
  `key` varchar(64) NOT NULL,
  value json NOT NULL,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pricing_models (
  id varchar(36) NOT NULL,
  providerType varchar(64) NOT NULL,
  model varchar(128) NOT NULL,
  inputCostPer1k decimal(10,6) NOT NULL,
  outputCostPer1k decimal(10,6) NOT NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS webhooks (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NULL,
  url varchar(255) NOT NULL,
  events json NOT NULL,
  encryptedSecret text NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_channels (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NULL,
  type varchar(16) NOT NULL,
  config json NOT NULL,
  encryptedSecret text NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenant_services (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  genericEnabled tinyint(1) NOT NULL DEFAULT 0,
  ocrEnabled tinyint(1) NOT NULL DEFAULT 0,
  sqlEnabled tinyint(1) NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_services_tenant (tenantId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenant_pricings (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  pricingId varchar(36) NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_pricing (tenantId, pricingId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_catalog (
  id varchar(36) NOT NULL,
  code varchar(64) NOT NULL,
  name varchar(120) NOT NULL,
  description text NOT NULL,
  priceMonthlyEur decimal(10,2) NOT NULL,
  priceAnnualEur decimal(10,2) NOT NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_catalog_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  period varchar(16) NOT NULL DEFAULT 'monthly',
  basePriceEur decimal(10,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  currentPeriodStart timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  currentPeriodEnd timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelAtPeriodEnd tinyint(1) NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscription_tenant (tenantId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscription_services (
  id varchar(36) NOT NULL,
  subscriptionId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  activateAt timestamp NULL,
  deactivateAt timestamp NULL,
  priceEur decimal(10,2) NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscription_service (subscriptionId, serviceCode)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscription_history (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  subscriptionId varchar(36) NOT NULL,
  period varchar(16) NOT NULL,
  basePriceEur decimal(10,2) NOT NULL,
  servicesPriceEur decimal(10,2) NOT NULL,
  totalBilledEur decimal(10,2) NOT NULL,
  startedAt timestamp NOT NULL,
  endedAt timestamp NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscription_payment_requests (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  subscriptionId varchar(36) NOT NULL,
  email varchar(160) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'pending',
  provider varchar(32) NOT NULL DEFAULT 'mock',
  providerRef varchar(160) NULL,
  tokenHash varchar(64) NOT NULL,
  amountEur decimal(10,2) NOT NULL,
  expiresAt timestamp NOT NULL,
  completedAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documentation_entries (
  id varchar(36) NOT NULL,
  menuSlug varchar(64) NOT NULL,
  category varchar(64) NOT NULL DEFAULT 'general',
  title varchar(160) NOT NULL,
  content text NOT NULL,
  link varchar(255) NULL,
  orderIndex int NOT NULL DEFAULT 0,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ocr_documents (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  title varchar(160) NOT NULL,
  source varchar(255) NULL,
  encryptedContent text NOT NULL,
  metadata json NOT NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS db_connections (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  name varchar(120) NOT NULL,
  engine varchar(32) NOT NULL DEFAULT 'mysql',
  encryptedConfig text NOT NULL,
  allowedTables json NOT NULL,
  readOnly tinyint(1) NOT NULL DEFAULT 1,
  metadata json NOT NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_users (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  email varchar(160) NOT NULL,
  name varchar(120) NULL,
  passwordHash varchar(255) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_conversations (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  userId varchar(36) NOT NULL,
  providerId varchar(36) NOT NULL,
  model varchar(128) NOT NULL,
  serviceCode varchar(64) NOT NULL DEFAULT 'chat_generic',
  title varchar(200) NULL,
  apiKeyId varchar(36) NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
  id varchar(36) NOT NULL,
  conversationId varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  userId varchar(36) NOT NULL,
  role varchar(16) NOT NULL,
  content text NOT NULL,
  tokensIn int NOT NULL DEFAULT 0,
  tokensOut int NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS admin_users (
  id varchar(36) NOT NULL,
  username varchar(120) NOT NULL,
  name varchar(120) NULL,
  email varchar(160) NULL,
  passwordHash varchar(255) NULL,
  mustChangePassword tinyint(1) NOT NULL DEFAULT 1,
  role varchar(32) NOT NULL DEFAULT 'admin',
  status varchar(16) NOT NULL DEFAULT 'active',
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_password_resets (
  id varchar(36) NOT NULL,
  userId varchar(36) NOT NULL,
  tokenHash varchar(64) NOT NULL,
  expiresAt timestamp NOT NULL,
  usedAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;
