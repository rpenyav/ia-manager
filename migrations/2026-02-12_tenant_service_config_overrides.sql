-- Add optional overrides for provider/pricing/policy on tenant service configs
SET @tsc_provider_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tenant_service_configs'
    AND column_name = 'providerId'
);

SET @tsc_pricing_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tenant_service_configs'
    AND column_name = 'pricingId'
);

SET @tsc_policy_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tenant_service_configs'
    AND column_name = 'policyId'
);

SET @tsc_provider_ddl = IF(
  @tsc_provider_exists = 0,
  "ALTER TABLE tenant_service_configs ADD COLUMN providerId varchar(36) NULL AFTER systemPrompt;",
  'SELECT 1'
);
SET @tsc_pricing_ddl = IF(
  @tsc_pricing_exists = 0,
  "ALTER TABLE tenant_service_configs ADD COLUMN pricingId varchar(36) NULL AFTER providerId;",
  'SELECT 1'
);
SET @tsc_policy_ddl = IF(
  @tsc_policy_exists = 0,
  "ALTER TABLE tenant_service_configs ADD COLUMN policyId varchar(36) NULL AFTER pricingId;",
  'SELECT 1'
);

PREPARE stmt_tsc_provider FROM @tsc_provider_ddl;
EXECUTE stmt_tsc_provider;
DEALLOCATE PREPARE stmt_tsc_provider;

PREPARE stmt_tsc_pricing FROM @tsc_pricing_ddl;
EXECUTE stmt_tsc_pricing;
DEALLOCATE PREPARE stmt_tsc_pricing;

PREPARE stmt_tsc_policy FROM @tsc_policy_ddl;
EXECUTE stmt_tsc_policy;
DEALLOCATE PREPARE stmt_tsc_policy;
