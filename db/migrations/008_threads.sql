-- Create threads table first (questions will FK to it)
CREATE TABLE IF NOT EXISTS threads (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID        NOT NULL REFERENCES sessions(id)  ON DELETE CASCADE,
    student_id  UUID        NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
    title       TEXT,
    shared      BOOLEAN     NOT NULL DEFAULT false,
    shared_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS threads_session_shared_idx ON threads(session_id, shared);
CREATE INDEX IF NOT EXISTS threads_student_idx ON threads(student_id);

-- Add thread columns to questions
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thread_sequence INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS questions_thread_idx ON questions(thread_id, thread_sequence);
