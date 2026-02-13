-- Add i18n texts and default endpoints to service catalog

ALTER TABLE service_catalog
  ADD COLUMN nameEs varchar(120) NULL AFTER name,
  ADD COLUMN descriptionEs text NULL AFTER description,
  ADD COLUMN nameEn varchar(120) NULL AFTER descriptionEs,
  ADD COLUMN descriptionEn text NULL AFTER nameEn,
  ADD COLUMN defaultEndpoints json NULL AFTER descriptionEn;
