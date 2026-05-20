-- =============================================================================
-- Azure Production Init
-- Run once against the Azure PostgreSQL database.
-- Sets up the pgcrypto extension and the Joke Writing Workshop tutorial course.
-- =============================================================================

-- Required for bcrypt password hashing (gen_salt / crypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- System professor user that owns the tutorial course
INSERT INTO users (id, email, password_hash, display_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@horizon.app',
    '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'Horizon',
    'professor'
) ON CONFLICT (id) DO NOTHING;

-- Joke Writing Workshop — auto-enrolled for every new student signup
INSERT INTO courses (id, name, professor_id, invite_code)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    'Joke Writing Workshop',
    '00000000-0000-0000-0000-000000000000',
    'jokes001'
) ON CONFLICT (id) DO NOTHING;
