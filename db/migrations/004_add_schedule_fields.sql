-- Add scheduled_at and location for scheduled lectures
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location TEXT;
