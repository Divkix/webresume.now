-- Update default theme for site_data table
-- Migration from old MinimalistCreme to new MinimalistEditorial template
-- Part of hybrid resume+portfolio feature addition

-- Update existing rows
UPDATE site_data
SET theme_id = 'minimalist_editorial'
WHERE theme_id = 'minimalist_creme' OR theme_id IS NULL;

-- Update default value for future inserts
ALTER TABLE site_data
ALTER COLUMN theme_id SET DEFAULT 'minimalist_editorial';

-- Add comment documenting available themes
COMMENT ON COLUMN site_data.theme_id IS 'Template theme identifier. Available themes: bento, glass, minimalist_editorial (default), neo_brutalist';
