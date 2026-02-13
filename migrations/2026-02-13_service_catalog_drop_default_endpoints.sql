-- Remove default endpoints from service catalog

ALTER TABLE service_catalog
  DROP COLUMN defaultEndpoints;
