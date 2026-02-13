-- Subscription & service catalog schema update

CREATE TABLE IF NOT EXISTS service_catalog (
  id varchar(36) NOT NULL,
  code varchar(64) NOT NULL,
  name varchar(120) NOT NULL,
  description text NOT NULL,
  endpointsEnabled tinyint(1) NOT NULL DEFAULT 1,
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
  subscriptionId varchar(36) NULL,
  period varchar(16) NOT NULL,
  basePriceEur decimal(10,2) NOT NULL,
  servicesPriceEur decimal(10,2) NOT NULL,
  totalBilledEur decimal(10,2) NOT NULL,
  startedAt timestamp NOT NULL,
  endedAt timestamp NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

ALTER TABLE tenants
ADD COLUMN billingEmail varchar(180) NULL;

ALTER TABLE tenants
  ADD COLUMN companyName varchar(180) NULL,
  ADD COLUMN contactName varchar(180) NULL,
  ADD COLUMN phone varchar(40) NULL,
  ADD COLUMN addressLine1 varchar(180) NULL,
  ADD COLUMN addressLine2 varchar(180) NULL,
  ADD COLUMN city varchar(120) NULL,
  ADD COLUMN postalCode varchar(20) NULL,
  ADD COLUMN country varchar(80) NULL,
  ADD COLUMN billingAddressLine1 varchar(180) NULL,
  ADD COLUMN billingAddressLine2 varchar(180) NULL,
  ADD COLUMN billingCity varchar(120) NULL,
  ADD COLUMN billingPostalCode varchar(20) NULL,
  ADD COLUMN billingCountry varchar(80) NULL,
  ADD COLUMN taxId varchar(40) NULL,
  ADD COLUMN website varchar(180) NULL;

CREATE TABLE IF NOT EXISTS subscription_payment_requests (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  subscriptionId varchar(36) NOT NULL,
  email varchar(180) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'pending',
  provider varchar(16) NOT NULL,
  tokenHash varchar(128) NOT NULL,
  amountEur decimal(10,2) NOT NULL,
  expiresAt timestamp NOT NULL,
  providerRef varchar(120) NULL,
  completedAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_token (tokenHash)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenant_invoices (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  subscriptionId varchar(36) NULL,
  paymentRequestId varchar(36) NULL,
  period varchar(16) NOT NULL,
  basePriceEur decimal(10,2) NOT NULL DEFAULT 0,
  servicesPriceEur decimal(10,2) NOT NULL DEFAULT 0,
  totalEur decimal(10,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  status varchar(16) NOT NULL DEFAULT 'pending',
  issuedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paidAt timestamp NULL,
  periodStart timestamp NULL,
  periodEnd timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tenant_invoices_tenant (tenantId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tenant_invoice_items (
  id varchar(36) NOT NULL,
  invoiceId varchar(36) NOT NULL,
  serviceCode varchar(64) NOT NULL,
  description varchar(255) NULL,
  priceEur decimal(10,2) NOT NULL DEFAULT 0,
  status varchar(16) NOT NULL DEFAULT 'active',
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_invoice_items_invoice (invoiceId)
) ENGINE=InnoDB;

INSERT IGNORE INTO service_catalog
  (id, code, name, description, priceMonthlyEur, priceAnnualEur, enabled)
VALUES
  (UUID(), 'chat_generic', 'Chatbot genérico', 'Servicio conversacional general para FAQ y soporte.', 49.00, 499.00, 1),
  (UUID(), 'chat_ocr', 'Chatbot OCR', 'Servicio con OCR y consulta sobre documentos.', 79.00, 799.00, 1),
  (UUID(), 'chat_sql', 'Chatbot SQL', 'Servicio para consultas sobre bases de datos.', 99.00, 999.00, 1);
