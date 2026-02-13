-- Remove i18n fields from service catalog

ALTER TABLE service_catalog
  DROP COLUMN nameEs,
  DROP COLUMN descriptionEs,
  DROP COLUMN nameEn,
  DROP COLUMN descriptionEn;
