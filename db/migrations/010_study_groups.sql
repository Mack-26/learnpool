-- =============================================================================
-- Migration 010: Study Groups
-- Apply: make db-shell → \i /docker-entrypoint-initdb.d/010_study_groups.sql
--
-- A study group is a courses row with course_type='study_group' and
-- professor_id=NULL, paired 1:1 with a study_groups row that holds the
-- owner. Membership reuses course_enrollments. The join code reuses
-- courses.invite_code (migration 007).
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE course_type AS ENUM ('institutional', 'study_group');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type course_type NOT NULL DEFAULT 'institutional';
ALTER TABLE courses ALTER COLUMN professor_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS study_groups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
    owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_owner ON study_groups (owner_id);
