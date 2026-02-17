ALTER TABLE tenants
  ADD COLUMN language VARCHAR(8) NULL;

UPDATE tenants
  SET language = 'es'
  WHERE language IS NULL;
