-- =============================================================================
-- Migration 006: Comments, Forks, and Question Categories
-- Apply: make db-shell → \i /docker-entrypoint-initdb.d/006_comments_forks_categories.sql
-- =============================================================================

-- 1. Category on questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- 2. Fork tracking
ALTER TABLE questions ADD COLUMN IF NOT EXISTS forked_from UUID REFERENCES questions(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS fork_count INT NOT NULL DEFAULT 0;

-- 3. Comments on questions
CREATE TABLE IF NOT EXISTS question_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_comments_question ON question_comments(question_id);
CREATE INDEX IF NOT EXISTS idx_question_comments_user ON question_comments(user_id);
