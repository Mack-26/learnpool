-- =============================================================================
-- LearnPool — Production Demo Data (Comedy 101 / "Lecture 20/05/2026")
--
-- Populates the existing empty "ended" session in the real Comedy 101 course
-- with 6 shared threads (questions + AI answers + citations + classmate
-- votes + comments + one fork), so the report/feed views have realistic
-- content for the demo video recorded as aromanan@umich.edu.
--
-- Grounded entirely in the course's actual chunked document (document_id
-- b1000000-0000-0000-0000-000000000001, "The Big Book of Comedy and Joke
-- Writing"). Wrapped in a transaction; safe to re-run (deletes its own rows
-- by fixed ID first).
-- =============================================================================

BEGIN;

DELETE FROM thread_feedback WHERE thread_id::text LIKE 'c3000000-0000-0000-0000-%';
DELETE FROM thread_comments WHERE thread_id::text LIKE 'c3000000-0000-0000-0000-%';
DELETE FROM answer_citations WHERE answer_id::text LIKE 'c2000000-0000-0000-0000-%';
DELETE FROM answers WHERE id::text LIKE 'c2000000-0000-0000-0000-%';
DELETE FROM questions WHERE id::text LIKE 'c1000000-0000-0000-0000-%';
DELETE FROM threads WHERE id::text LIKE 'c3000000-0000-0000-0000-%';

-- Release the session + activate the course document for citations
UPDATE sessions SET status = 'released'
WHERE id = '2475a3af-237a-48e6-ba96-80961f1dda27';

INSERT INTO session_documents (session_id, document_id, is_active)
VALUES ('2475a3af-237a-48e6-ba96-80961f1dda27', 'b1000000-0000-0000-0000-000000000001', true)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- THREADS
-- =============================================================================

INSERT INTO threads (id, session_id, student_id, title, shared, shared_at, include_questions, fork_count) VALUES
    ('c3000000-0000-0000-0000-000000000001', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000001',
     'Why does the Rule of Three beat a 4th item?', true, '2026-05-20 17:11:55+00', true, 0),
    ('c3000000-0000-0000-0000-000000000002', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000002',
     'Is punching down ever okay if it''s self-deprecating?', true, '2026-05-20 17:20:55+00', true, 0),
    ('c3000000-0000-0000-0000-000000000003', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000003',
     'How long should I wait before a callback?', true, '2026-05-20 17:28:55+00', true, 1),
    ('c3000000-0000-0000-0000-000000000005', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000006',
     'Incongruity Theory vs. Superiority Theory', true, '2026-05-20 17:44:55+00', true, 0),
    ('c3000000-0000-0000-0000-000000000006', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000005',
     'Summarize the theories of why things are funny', true, '2026-05-20 17:50:55+00', true, 0);

INSERT INTO threads (id, session_id, student_id, title, shared, shared_at, include_questions, forked_from) VALUES
    ('c3000000-0000-0000-0000-000000000004', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000004',
     'Ideal callback distance for a 5-minute set?', true, '2026-05-20 17:36:55+00', true,
     'c3000000-0000-0000-0000-000000000003');


-- =============================================================================
-- QUESTIONS
-- =============================================================================

INSERT INTO questions (id, session_id, student_id, content, anonymous, category, fork_count, thread_id, thread_sequence, asked_at) VALUES
    ('c1000000-0000-0000-0000-000000000001', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000001',
     'Why does the Rule of Three work better than adding a fourth item to the punchline?', false, 'Doubts', 0,
     'c3000000-0000-0000-0000-000000000001', 1, '2026-05-20 17:11:55+00'),

    ('c1000000-0000-0000-0000-000000000002', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000002',
     'Is punching down ever okay if it''s self-deprecating?', false, 'Doubts', 0,
     'c3000000-0000-0000-0000-000000000002', 1, '2026-05-20 17:20:55+00'),

    ('c1000000-0000-0000-0000-000000000003', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000003',
     'How long should I wait before doing a callback?', false, 'Homework', 1,
     'c3000000-0000-0000-0000-000000000003', 1, '2026-05-20 17:28:55+00'),

    ('c1000000-0000-0000-0000-000000000004', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000004',
     '[Forked from: "How long should I wait before doing a callback?"]

What''s the ideal callback distance for a 5-minute set specifically?', false, 'Homework', 0,
     'c3000000-0000-0000-0000-000000000004', 1, '2026-05-20 17:36:55+00'),

    ('c1000000-0000-0000-0000-000000000005', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000006',
     'What''s the difference between the Incongruity Theory and the Superiority Theory of humor?', false, 'Exam Prep', 0,
     'c3000000-0000-0000-0000-000000000005', 1, '2026-05-20 17:44:55+00'),

    ('c1000000-0000-0000-0000-000000000006', '2475a3af-237a-48e6-ba96-80961f1dda27', 'a1000000-0000-0000-0000-000000000005',
     'Can you summarize the theories of why things are funny?', false, 'Summaries', 0,
     'c3000000-0000-0000-0000-000000000006', 1, '2026-05-20 17:50:55+00');

UPDATE questions SET forked_from = 'c1000000-0000-0000-0000-000000000003'
WHERE id = 'c1000000-0000-0000-0000-000000000004';


-- =============================================================================
-- ANSWERS
-- =============================================================================

INSERT INTO answers (id, question_id, content, model_used, generation_latency_ms) VALUES
    ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
     'The Rule of Three works because three items feel like a complete pattern to the human brain — two items read as a list, but three feels finished. The first two items establish the pattern and the expectation; the third violates it, and that violation is the joke. A fourth item after a successful three-beat punchline almost always deflates the laugh, because the audience already got their pattern-completion payoff at item three — anything after that reads as padding, not payoff.',
     'gpt-4o', 1180),

    ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002',
     'Generally, yes — self-deprecating humor is a special case where the comedian is both the author and the target, so it doesn''t carry the same power dynamic as punching down at someone else. Since you''re making a choice about how to frame your own experience, it reads as safer territory for a set.',
     'gpt-4o', 1050),

    ('c2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003',
     'The optimal callback distance is usually 5–10 minutes into a longer set — long enough that the audience has half-forgotten the original moment, so the callback creates real surprise, but not so long that they''ve fully lost the thread. The bigger constraint isn''t time, though — it''s whether the original moment was memorable enough to be worth returning to. A callback to a weak joke just reminds people the joke was weak.',
     'gpt-4o', 1240),

    ('c2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004',
     'In a full set the rule of thumb is 5–10 minutes, but a 5-minute set doesn''t have room for that gap. Scale it down: place your callback in the closing 30–60 seconds, referencing something from your opener. The set architecture still applies — your closer should be your strongest bit and feel inevitable, so a callback there does double duty: it''s both your peak material and a payoff the audience earns for paying attention from the start.',
     'gpt-4o', 1310),

    ('c2000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005',
     'The Incongruity Theory says humor comes from holding two conflicting ideas in your head at once — the punchline resolves a mismatch the setup created. The Superiority Theory, going back to Hobbes and Plato, says we laugh in response to perceiving someone else''s misfortune or inferiority — it''s about a felt sense of comparison. They''re not mutually exclusive: a joke can create incongruity in its structure while also relying on a target feeling lesser for the laugh to land.',
     'gpt-4o', 1290),

    ('c2000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006',
     'Four major theories: Incongruity Theory — humor from perceiving two conflicting ideas at once, resolved by the punchline. Superiority Theory (Hobbes, Plato) — laughter as a response to others'' misfortune or inferiority. Relief Theory (Freud, Spencer) — laughter releases suppressed tension. And Bergson''s theory — laughter as a social corrective, mocking rigidity to push people back toward flexibility. None of them fully explains humor on its own, but each captures a real mechanism.',
     'gpt-4o', 1170);


-- =============================================================================
-- CITATIONS
-- =============================================================================

INSERT INTO answer_citations (id, answer_id, chunk_id, relevance_score, citation_order) VALUES
    ('c4000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 0.91, 1),
    ('c4000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000005', 0.83, 1),
    ('c4000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000006', 0.94, 1),
    ('c4000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000006', 0.88, 1),
    ('c4000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000008', 0.86, 2),
    ('c4000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000010', 0.95, 1),
    ('c4000000-0000-0000-0000-000000000007', 'c2000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000010', 0.92, 1);


-- =============================================================================
-- CLASSMATE VOTES
-- =============================================================================

INSERT INTO thread_feedback (thread_id, user_id, feedback) VALUES
    -- T1: hero — full agreement
    ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'up'),
    ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'up'),
    ('c3000000-0000-0000-0000-000000000001', '0eb0ab86-fba6-4932-83a2-ab713c773531', 'up'),

    -- T2: flagged — classmates catch the AI's oversimplification
    ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'up'),
    ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'down'),
    ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'down'),

    -- T3: original callback thread
    ('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'up'),
    ('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006', 'up'),

    -- T4: fork
    ('c3000000-0000-0000-0000-000000000004', '0eb0ab86-fba6-4932-83a2-ab713c773531', 'up'),
    ('c3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'up'),

    -- T5: well understood
    ('c3000000-0000-0000-0000-000000000005', '0eb0ab86-fba6-4932-83a2-ab713c773531', 'up'),
    ('c3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'up'),
    ('c3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'up'),

    -- T6: well understood
    ('c3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'up'),
    ('c3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'up');


-- =============================================================================
-- CLASSMATE COMMENTS ("how classmates verify information")
-- =============================================================================

INSERT INTO thread_comments (thread_id, user_id, content) VALUES
    ('c3000000-0000-0000-0000-000000000001', '2b780e08-1c4c-4d21-84c8-b81ea377e2e5',
     'Nice framing — the psychology term for this is "pattern completion." We''ll dig into that more next week.'),
    ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004',
     'I always wondered why my closer felt weaker with an extra beat tacked on — this explains it.'),

    ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003',
     'The AI made it sound like self-deprecation is always safe, but the book actually says it gets contested when it leans on stereotypes that affect your whole group — worth rereading page 15.'),
    ('c3000000-0000-0000-0000-000000000002', '0eb0ab86-fba6-4932-83a2-ab713c773531',
     'Good catch — the source material is more careful than the summary here.'),

    ('c3000000-0000-0000-0000-000000000003', '2b780e08-1c4c-4d21-84c8-b81ea377e2e5',
     'Careful with callbacks to material the room didn''t love the first time — it doubles down on a miss.'),

    ('c3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000005',
     'This helped me plan my closer for Friday''s open mic!'),

    ('c3000000-0000-0000-0000-000000000005', '2b780e08-1c4c-4d21-84c8-b81ea377e2e5',
     'This is the framework I''ll expect you to reference in the reflection paper.');

COMMIT;
