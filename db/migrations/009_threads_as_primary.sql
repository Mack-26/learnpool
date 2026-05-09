-- Migration 009: Threads as primary unit
-- Adds interaction columns to threads, and creates thread_comments + thread_feedback tables.

-- 1. threads: add include_questions (was missing from 008), professor fields, fork fields
ALTER TABLE threads
  ADD COLUMN IF NOT EXISTS include_questions BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS professor_labels  TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS professor_notes   TEXT,
  ADD COLUMN IF NOT EXISTS fork_count        INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forked_from       UUID    REFERENCES threads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS threads_forked_from_idx ON threads(forked_from);

-- 2. thread_comments: thread-level comments (replaces question_comments for dashboard)
CREATE TABLE IF NOT EXISTS thread_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID        NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS thread_comments_thread_idx ON thread_comments(thread_id);
CREATE INDEX IF NOT EXISTS thread_comments_user_idx   ON thread_comments(user_id);

-- 3. thread_feedback: per-thread voting (replaces answer_feedback for the dashboard)
CREATE TABLE IF NOT EXISTS thread_feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID        NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  feedback   TEXT        NOT NULL CHECK (feedback IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);
CREATE INDEX IF NOT EXISTS thread_feedback_thread_idx ON thread_feedback(thread_id);
