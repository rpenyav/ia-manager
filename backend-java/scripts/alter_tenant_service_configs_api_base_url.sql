-- Añadir URL base de la API a la configuración por tenant/servicio
ALTER TABLE tenant_service_configs
  ADD COLUMN apiBaseUrl VARCHAR(255) NULL;
