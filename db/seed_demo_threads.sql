-- =============================================================================
-- LearnPool — Demo Video Seed Additions (threads / social feed)
--
-- Additive on top of db/seed.sql — does NOT truncate anything. Run this AFTER
-- `make db-seed` to populate the "threads" feed (shared threads, comments,
-- votes, forks) that the Report/Feed screen and CategoryBarChart depend on.
-- The base seed.sql already has questions/answers/feedback/comments — this
-- file just wraps five of those existing questions into shared threads and
-- reuses their existing feedback/comment content so numbers stay consistent
-- across every screen in the demo.
--
-- Run with:
--   make db-shell
--   \i /docker-entrypoint-initdb.d/../seed_demo_threads.sql
-- (or from host: psql "$DATABASE_URL" -f db/seed_demo_threads.sql)
--
-- Safe to re-run: deletes its own rows by fixed ID before re-inserting.
-- =============================================================================

DELETE FROM thread_feedback WHERE thread_id IN (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0003-000000000004',
    '00000000-0000-0000-0003-000000000005'
);
DELETE FROM thread_comments WHERE thread_id IN (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0003-000000000004',
    '00000000-0000-0000-0003-000000000005'
);
UPDATE questions SET thread_id = NULL, thread_sequence = 1
WHERE id IN (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0001-000000000009',
    '00000000-0000-0000-0001-000000000011'
);
DELETE FROM threads WHERE id IN (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0003-000000000004',
    '00000000-0000-0000-0003-000000000005'
);


-- =============================================================================
-- THREADS
-- =============================================================================

INSERT INTO threads (id, session_id, student_id, title, shared, shared_at, include_questions, fork_count) VALUES
    -- A: hero "verified" thread — strong classmate agreement (3 up, 0 down)
    ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002',
     'Why do we square the errors in the cost function?', true, now() - interval '7 days' + interval '10 minutes', true, 0),

    -- B: "flagged" thread — classmates disagree with the AI (1 up, 2 down)
    ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000007',
     'Gradient descent kept diverging on me — why?', true, now() - interval '7 days' + interval '35 minutes', true, 0),

    -- C: the original thread that gets forked
    ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000005',
     'How do I calculate R-squared for the homework?', true, now() - interval '7 days' + interval '25 minutes', true, 1),

    -- E: well-understood thread from the active session
    ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002',
     'Momentum in gradient descent, explained', true, now() - interval '1 hour' + interval '5 minutes', true, 0);

-- D: fork of C — a classmate builds on Alice's question with a deeper follow-up
INSERT INTO threads (id, session_id, student_id, title, shared, shared_at, include_questions, forked_from) VALUES
    ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002',
     'Adjusted R-squared — when should I use it instead?', true, now() - interval '7 days' + interval '50 minutes',
     true, '00000000-0000-0000-0003-000000000003');


-- =============================================================================
-- LINK EXISTING QUESTIONS INTO THEIR THREAD
-- =============================================================================

UPDATE questions SET thread_id = '00000000-0000-0000-0003-000000000001', thread_sequence = 1 WHERE id = '00000000-0000-0000-0001-000000000001';
UPDATE questions SET thread_id = '00000000-0000-0000-0003-000000000002', thread_sequence = 1 WHERE id = '00000000-0000-0000-0001-000000000006';
UPDATE questions SET thread_id = '00000000-0000-0000-0003-000000000003', thread_sequence = 1 WHERE id = '00000000-0000-0000-0001-000000000004';
UPDATE questions SET thread_id = '00000000-0000-0000-0003-000000000004', thread_sequence = 1 WHERE id = '00000000-0000-0000-0001-000000000009';
UPDATE questions SET thread_id = '00000000-0000-0000-0003-000000000005', thread_sequence = 1 WHERE id = '00000000-0000-0000-0001-000000000011';


-- =============================================================================
-- THREAD-LEVEL VOTES (mirrors existing answer_feedback so numbers agree
-- across the AnswerQualityBreakdown chart and the feed's thumbs up/down)
-- =============================================================================

INSERT INTO thread_feedback (thread_id, user_id, feedback) VALUES
    ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000005', 'up'),

    ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000008', 'down'),
    ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000009', 'down'),

    ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000007', 'up'),

    ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000006', 'up'),

    ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000004', 'up');


-- =============================================================================
-- CLASSMATE COMMENTS (the "how classmates verify information" beat)
-- =============================================================================

INSERT INTO thread_comments (thread_id, user_id, content) VALUES
    ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001',
     'Great question! We will revisit MSE vs MAE in the next lecture.'),
    ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003',
     'Thanks! The squaring part really clicked for me now.'),

    ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000007',
     'This happened to me during the lab too! The loss just exploded.'),
    ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001',
     'Feature scaling is the most common fix — always normalise before training.'),
    ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000008',
     'AI answer says it''s fine at any learning rate but that wasn''t true for me — flagging this one.'),

    ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001',
     'Remember: adjusted R² is what you should report for multiple regression on the homework.'),
    ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000005',
     'Do we need to show the derivation or just the final value?'),

    ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000006',
     'This clears up something I was stuck on in the homework too — forking helped me find it.'),

    ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000004',
     'The rolling-ball analogy finally made this make sense!');
