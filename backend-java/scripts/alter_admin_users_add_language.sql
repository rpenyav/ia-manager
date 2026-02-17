ALTER TABLE admin_users
  ADD COLUMN language VARCHAR(8) NULL;

UPDATE admin_users
  SET language = 'es'
  WHERE language IS NULL;
