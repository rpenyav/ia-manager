-- Add i18n columns for documentation entries (es is stored in title/content)
ALTER TABLE documentation_entries
  ADD COLUMN title_en VARCHAR(160) NULL AFTER title,
  ADD COLUMN content_en TEXT NULL AFTER content,
  ADD COLUMN title_ca VARCHAR(160) NULL AFTER title_en,
  ADD COLUMN content_ca TEXT NULL AFTER content_en;
