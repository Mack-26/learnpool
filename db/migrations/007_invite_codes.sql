ALTER TABLE courses ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
UPDATE courses SET invite_code = substr(md5(random()::text), 1, 8) WHERE invite_code IS NULL;
ALTER TABLE courses ALTER COLUMN invite_code SET NOT NULL;
