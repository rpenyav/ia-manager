-- Add endpoints enabled flag to service catalog

ALTER TABLE service_catalog
  ADD COLUMN endpointsEnabled boolean NOT NULL DEFAULT 1 AFTER description;
