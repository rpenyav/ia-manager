-- Añadir URL base de la API al catálogo de servicios
ALTER TABLE service_catalog
  ADD COLUMN apiBaseUrl VARCHAR(255) NULL;
