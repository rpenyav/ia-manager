-- Add serviceCode to usage_events if missing (idempotent for MySQL 8+)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'usage_events'
    AND column_name = 'serviceCode'
);

SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE usage_events ADD COLUMN serviceCode varchar(64) NULL AFTER model;',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
