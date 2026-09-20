-- =============================================================================
-- Migration 011: Question visibility + focused material
-- Apply: make db-shell → \i /docker-entrypoint-initdb.d/011_question_visibility_focus.sql
--
-- visibility: 'group' (default, visible to everyone in the conversation) or
--             'private' (a fork the student is exploring alone; only they see
--             it, and they can share it back by flipping to 'group').
-- focus_document_id: a material the question is explicitly about; RAG
--             retrieves from it first before falling back to all materials.
-- =============================================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'group'
    CHECK (visibility IN ('group', 'private'));
ALTER TABLE questions ADD COLUMN IF NOT EXISTS focus_document_id UUID
    REFERENCES documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_session_visibility ON questions (session_id, visibility, asked_at);
CREATE INDEX IF NOT EXISTS idx_questions_student_private ON questions (student_id, asked_at) WHERE visibility = 'private';
