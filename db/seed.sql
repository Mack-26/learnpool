-- =============================================================================
-- LearnPool — Development Seed Data
-- Run with: make db-seed
--
-- Seed users password: devpassword
-- Uses pgcrypto's crypt() to generate real bcrypt hashes at insert time.
-- =============================================================================

-- Truncate in reverse dependency order so this script is safely re-runnable.
TRUNCATE TABLE
    answer_citations,
    answers,
    questions,
    session_documents,
    sessions,
    document_chunks,
    documents,
    course_enrollments,
    courses,
    users
CASCADE;


-- =============================================================================
-- USERS
-- =============================================================================

INSERT INTO users (id, email, password_hash, display_name, role) VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'prof@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Dr. Smith',
        'professor'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'alice@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Alice Johnson',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'bob@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Bob Chen',
        'student'
    );


-- =============================================================================
-- COURSE + ENROLLMENTS
-- =============================================================================

INSERT INTO courses (id, professor_id, name, description) VALUES
    (
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'Introduction to Machine Learning',
        'Core concepts: supervised learning, neural networks, model evaluation.'
    );

INSERT INTO course_enrollments (course_id, student_id) VALUES
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003');


-- =============================================================================
-- SESSIONS
-- One active session (students can ask questions),
-- one released session (students can browse Q&A).
-- =============================================================================

INSERT INTO sessions (id, course_id, title, status, started_at, ended_at) VALUES
    (
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000010',
        'Lecture 1 — Linear Regression',
        'released',
        now() - interval '7 days',
        now() - interval '7 days' + interval '90 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000010',
        'Lecture 2 — Gradient Descent',
        'active',
        now(),
        NULL
    );


-- =============================================================================
-- DOCUMENTS
-- Two documents in 'ready' state (chunked and embedded),
-- one in 'uploaded' state (simulates a pending upload).
-- storage_path uses a generic relative path — prefix with your bucket URL in the app.
-- =============================================================================

INSERT INTO documents (id, course_id, uploaded_by, filename, storage_path, processing_status, page_count, file_size_bytes, processed_at) VALUES
    (
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'lecture1_linear_regression.pdf',
        'courses/00000000-0000-0000-0000-000000000010/docs/lecture1_linear_regression.pdf',
        'ready',
        22,
        1048576,
        now() - interval '7 days'
    ),
    (
        '00000000-0000-0000-0000-000000000031',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'lecture2_gradient_descent.pdf',
        'courses/00000000-0000-0000-0000-000000000010/docs/lecture2_gradient_descent.pdf',
        'ready',
        18,
        819200,
        now() - interval '1 day'
    ),
    (
        '00000000-0000-0000-0000-000000000032',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'textbook_chapter3.pdf',
        'courses/00000000-0000-0000-0000-000000000010/docs/textbook_chapter3.pdf',
        'uploaded',  -- still processing, not yet available for RAG
        NULL,
        5242880,
        NULL
    );


-- =============================================================================
-- SESSION DOCUMENTS (checkbox configuration)
-- Session 1 (released): only lecture 1 doc was active.
-- Session 2 (active):   lecture 1 and 2 are active; textbook is inactive (still uploading).
-- =============================================================================

INSERT INTO session_documents (session_id, document_id, is_active) VALUES
    -- Session 1
    ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030', true),

    -- Session 2
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000030', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000031', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000032', false);


-- =============================================================================
-- DOCUMENT CHUNKS (sample — embedding is NULL since we have no real model here)
-- In production, the processing worker populates these after chunking the PDF.
-- =============================================================================

INSERT INTO document_chunks (id, document_id, chunk_index, page_number, content, token_count, embedding, embedding_model) VALUES
    (
        '00000000-0000-0000-0000-000000000040',
        '00000000-0000-0000-0000-000000000030',
        0,
        1,
        'Linear regression is a supervised learning algorithm that models the relationship between a dependent variable and one or more independent variables by fitting a linear equation to observed data.',
        38,
        NULL,  -- NULL in seed; real embeddings generated by processing worker
        NULL
    ),
    (
        '00000000-0000-0000-0000-000000000041',
        '00000000-0000-0000-0000-000000000030',
        1,
        2,
        'The cost function for linear regression is the Mean Squared Error (MSE): J(θ) = (1/2m) Σ(h(x) - y)². Minimizing this function yields the optimal model parameters.',
        42,
        NULL,
        NULL
    ),
    (
        '00000000-0000-0000-0000-000000000042',
        '00000000-0000-0000-0000-000000000031',
        0,
        1,
        'Gradient descent is an optimization algorithm that iteratively adjusts model parameters in the direction of steepest descent of the loss function, scaled by a learning rate α.',
        35,
        NULL,
        NULL
    );


-- =============================================================================
-- QUESTIONS + ANSWERS + CITATIONS (for the released session only)
-- Demonstrates the full Q&A chain the dashboard will query.
-- =============================================================================

INSERT INTO questions (id, session_id, student_id, content, asked_at) VALUES
    (
        '00000000-0000-0000-0000-000000000050',
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000002',
        'What is the difference between simple and multiple linear regression?',
        now() - interval '7 days' + interval '10 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000051',
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000003',
        'Why do we square the errors in the MSE cost function?',
        now() - interval '7 days' + interval '25 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000052',
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000002',
        'Why do we square the errors in the MSE cost function?',
        now() - interval '7 days' + interval '26 minutes'
    );

INSERT INTO answers (id, question_id, content, model_used, generation_latency_ms) VALUES
    (
        '00000000-0000-0000-0000-000000000060',
        '00000000-0000-0000-0000-000000000050',
        'Simple linear regression models one independent variable; multiple linear regression models two or more. Both use the same MSE cost function and are fit by minimizing it.',
        'claude-3-5-sonnet-20241022',
        820
    ),
    (
        '00000000-0000-0000-0000-000000000061',
        '00000000-0000-0000-0000-000000000051',
        'Squaring serves two purposes: it makes all errors positive (so negative and positive residuals do not cancel) and it penalizes large errors more heavily than small ones.',
        'claude-3-5-sonnet-20241022',
        910
    ),
    (
        '00000000-0000-0000-0000-000000000062',
        '00000000-0000-0000-0000-000000000052',
        'Squaring serves two purposes: it makes all errors positive (so negative and positive residuals do not cancel) and it penalizes large errors more heavily than small ones.',
        'claude-3-5-sonnet-20241022',
        875
    );

INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order) VALUES
    ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000040', 0.91, 1),
    ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000041', 0.94, 1),
    ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000041', 0.93, 1);


-- =============================================================================
-- VERIFY
-- =============================================================================

SELECT 'users'             AS table_name, count(*) FROM users
UNION ALL
SELECT 'courses',            count(*) FROM courses
UNION ALL
SELECT 'course_enrollments', count(*) FROM course_enrollments
UNION ALL
SELECT 'sessions',           count(*) FROM sessions
UNION ALL
SELECT 'documents',          count(*) FROM documents
UNION ALL
SELECT 'session_documents',  count(*) FROM session_documents
UNION ALL
SELECT 'document_chunks',    count(*) FROM document_chunks
UNION ALL
SELECT 'questions',          count(*) FROM questions
UNION ALL
SELECT 'answers',            count(*) FROM answers
UNION ALL
SELECT 'answer_citations',   count(*) FROM answer_citations
ORDER BY table_name;
