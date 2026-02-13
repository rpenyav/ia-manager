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
