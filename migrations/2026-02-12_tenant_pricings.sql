CREATE TABLE IF NOT EXISTS tenant_pricings (
  id varchar(36) NOT NULL,
  tenantId varchar(36) NOT NULL,
  pricingId varchar(36) NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tenant_pricings_tenant (tenantId),
  KEY idx_tenant_pricings_pricing (pricingId),
  UNIQUE KEY ux_tenant_pricings_tenant_pricing (tenantId, pricingId)
) ENGINE=InnoDB;
