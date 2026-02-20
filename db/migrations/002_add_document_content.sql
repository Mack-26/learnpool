-- Add content column for inline text documents (lecture notes pasted by professor).
-- When content IS NOT NULL, document is text-based; storage_path is 'inline'.

ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT;
