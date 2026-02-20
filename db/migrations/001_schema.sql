-- =============================================================================
-- LearnPool — Initial Schema
-- PostgreSQL 16 + pgvector
--
-- This file runs automatically on first `docker compose up` (via
-- docker-entrypoint-initdb.d). To apply changes after the first run, either:
--   1. `make db-reset`  (destroys all data, re-runs this file)
--   2. Create db/migrations/002_*.sql and apply it manually with `make db-shell`
-- =============================================================================


-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "vector";    -- pgvector for embeddings


-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role         AS ENUM ('student', 'professor');
CREATE TYPE processing_status AS ENUM ('uploaded', 'processing', 'ready', 'failed');
CREATE TYPE session_status    AS ENUM ('active', 'ended', 'released');


-- =============================================================================
-- USERS
-- All authenticated principals. Role discriminates professor vs student.
-- =============================================================================

CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    display_name  TEXT        NOT NULL,
    role          user_role   NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);


-- =============================================================================
-- COURSES
-- Top-level multi-tenant boundary. Each course is owned by one professor.
-- =============================================================================

CREATE TABLE courses (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name         TEXT        NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_professor ON courses (professor_id);


-- =============================================================================
-- COURSE ENROLLMENTS
-- Controls which students may join sessions for a course.
-- =============================================================================

CREATE TABLE course_enrollments (
    course_id   UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id  UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (course_id, student_id)
);

CREATE INDEX idx_enrollments_student ON course_enrollments (student_id);


-- =============================================================================
-- SESSIONS
-- A single class meeting within a course.
-- Status machine: active → ended → released
-- =============================================================================

CREATE TABLE sessions (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID           NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    title      TEXT           NOT NULL,
    status     session_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
    ended_at   TIMESTAMPTZ,                             -- set when professor ends session
    created_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_course        ON sessions (course_id);
CREATE INDEX idx_sessions_course_status ON sessions (course_id, status);


-- =============================================================================
-- DOCUMENTS
-- PDFs uploaded by professors, associated with a course.
-- storage_path is an opaque string (OCI, S3, GCS, or local path).
-- Swap the storage backend without touching this schema.
-- =============================================================================

CREATE TABLE documents (
    id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         UUID              NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    uploaded_by       UUID              NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    filename          TEXT              NOT NULL,
    storage_path      TEXT              NOT NULL,   -- e.g. "courses/abc/docs/xyz.pdf"
    processing_status processing_status NOT NULL DEFAULT 'uploaded',
    page_count        INT,
    file_size_bytes   BIGINT,
    error_message     TEXT,                         -- populated on 'failed'
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
    processed_at      TIMESTAMPTZ
);

CREATE INDEX idx_documents_course        ON documents (course_id);
CREATE INDEX idx_documents_course_status ON documents (course_id, processing_status);


-- =============================================================================
-- SESSION DOCUMENTS  (the "checkbox system")
-- Controls which documents are active for a specific session.
-- A row with is_active=false preserves toggle history vs. deleting the row.
-- =============================================================================

CREATE TABLE session_documents (
    session_id   UUID        NOT NULL REFERENCES sessions(id)  ON DELETE CASCADE,
    document_id  UUID        NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
    is_active    BOOLEAN     NOT NULL DEFAULT true,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (session_id, document_id)
);

CREATE INDEX idx_session_docs_session ON session_documents (session_id);

-- Partial index: only active rows — used on every RAG retrieval path
CREATE INDEX idx_session_docs_active ON session_documents (session_id, document_id)
    WHERE is_active = true;


-- =============================================================================
-- DOCUMENT CHUNKS + EMBEDDINGS
--
-- !! EMBEDDING DIMENSION LOCK-IN !!
-- vector(1536) matches OpenAI text-embedding-3-small / text-embedding-ada-002.
-- Changing this dimension requires dropping this column and re-embedding
-- every chunk in the database — decide on your model before populating.
--
-- Common alternatives:
--   vector(1024) — Cohere embed-v3, OCI Generative AI
--   vector(768)  — many open-weight models (e.g. all-mpnet-base-v2)
--   vector(384)  — all-MiniLM-L6-v2
-- =============================================================================

CREATE TABLE document_chunks (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index     INT         NOT NULL,       -- 0-based position within document
    page_number     INT,                        -- source page (null if not determinable)
    content         TEXT        NOT NULL,       -- raw text of the chunk
    token_count     INT,                        -- token count under embedding model's tokenizer
    embedding       vector(1536),              -- NULL until processing_status = 'ready'
    embedding_model TEXT,                      -- e.g. 'text-embedding-3-small'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_chunks_document ON document_chunks (document_id);

-- HNSW vector index for approximate nearest-neighbor search.
-- Better recall than IVFFlat; no training step; handles incremental inserts well.
-- Tune ef_search at query time (SET hnsw.ef_search = 64) for recall/speed tradeoff.
CREATE INDEX idx_chunks_embedding_hnsw
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);


-- =============================================================================
-- QUESTIONS
-- A student's question asked during a session.
-- =============================================================================

CREATE TABLE questions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID        NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    content    TEXT        NOT NULL,
    asked_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Covers: session dashboard (all questions), time-series query
CREATE INDEX idx_questions_session         ON questions (session_id, asked_at);
-- Covers: per-student question counts within a session
CREATE INDEX idx_questions_session_student ON questions (session_id, student_id);
-- Covers: cross-session student history
CREATE INDEX idx_questions_student         ON questions (student_id);


-- =============================================================================
-- ANSWERS
-- AI-generated response to a question. Enforced one-to-one via UNIQUE.
-- =============================================================================

CREATE TABLE answers (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id           UUID        NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
    content               TEXT        NOT NULL,
    model_used            TEXT        NOT NULL,   -- e.g. 'claude-3-5-sonnet', 'gpt-4o'
    generation_latency_ms INT,
    generated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_answers_question ON answers (question_id);


-- =============================================================================
-- ANSWER CITATIONS
-- Which document chunks were retrieved and cited for a given answer.
-- ON DELETE RESTRICT on chunk_id prevents deleting cited chunks.
-- =============================================================================

CREATE TABLE answer_citations (
    id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id       UUID  NOT NULL REFERENCES answers(id)         ON DELETE CASCADE,
    chunk_id        UUID  NOT NULL REFERENCES document_chunks(id) ON DELETE RESTRICT,
    relevance_score FLOAT NOT NULL,   -- cosine similarity or reranker score (0.0–1.0)
    citation_order  INT   NOT NULL,   -- 1-indexed rank in the context window

    UNIQUE (answer_id, chunk_id)
);

CREATE INDEX idx_citations_answer ON answer_citations (answer_id);
-- Used in "most cited documents" dashboard query
CREATE INDEX idx_citations_chunk  ON answer_citations (chunk_id);
