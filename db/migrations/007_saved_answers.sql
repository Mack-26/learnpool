CREATE TABLE IF NOT EXISTS saved_answers (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    answer_id   UUID        NOT NULL REFERENCES answers(id)  ON DELETE CASCADE,
    saved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, answer_id)
);
CREATE INDEX IF NOT EXISTS saved_answers_student_idx ON saved_answers(student_id);
