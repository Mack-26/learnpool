-- Migration 002: add publish flow + professor review labels/notes to questions
ALTER TABLE questions
  ADD COLUMN published        BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN professor_labels TEXT[]    NOT NULL DEFAULT '{}',
  ADD COLUMN professor_notes  TEXT;
