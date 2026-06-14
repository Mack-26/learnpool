-- ============================================================
-- Comedy 101 Demo Seed Data
-- ============================================================
-- Populates the live Comedy 101 session with realistic student
-- interactions so every professor dashboard metric has data.
--
-- Run: psql $DATABASE_URL -f db/scripts/comedy101_demo_seed.sql
-- Or:  make db-shell  →  \i /scripts/comedy101_demo_seed.sql
--
-- Finds the course dynamically via aromanan@umich.edu.
-- All new student accounts use password: devpassword
-- ============================================================

\set ON_ERROR_STOP on

-- ============================================================
-- Dynamic ID lookup via temp tables
-- ============================================================
CREATE TEMP TABLE IF NOT EXISTS _prof AS
  SELECT id FROM users WHERE email = 'arora.m2611@gmail.com' LIMIT 1;

CREATE TEMP TABLE IF NOT EXISTS _course AS
  SELECT id FROM courses
  WHERE professor_id = (SELECT id FROM _prof)
    AND name ILIKE '%Joke%'
  LIMIT 1;

CREATE TEMP TABLE IF NOT EXISTS _session AS
  SELECT id FROM sessions
  WHERE course_id = (SELECT id FROM _course)
  ORDER BY created_at DESC
  LIMIT 1;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM _prof) THEN
    RAISE EXCEPTION 'Professor aromanan@umich.edu not found in users table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _course) THEN
    RAISE EXCEPTION 'No Joke Writing Workshop course found for aromanan@umich.edu';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _session) THEN
    RAISE EXCEPTION 'No session found for the Comedy course';
  END IF;
END $$;

-- ============================================================
-- STEP 1: Create 6 student accounts
-- ============================================================
INSERT INTO users (id, email, password_hash, display_name, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'tyler@comedy101.com',
   crypt('devpassword', gen_salt('bf', 12)), 'Tyler Chen', 'student'),
  ('a1000000-0000-0000-0000-000000000002', 'maya@comedy101.com',
   crypt('devpassword', gen_salt('bf', 12)), 'Maya Patel', 'student'),
  ('a1000000-0000-0000-0000-000000000003', 'jake@comedy101.com',
   crypt('devpassword', gen_salt('bf', 12)), 'Jake Rivera', 'student'),
  ('a1000000-0000-0000-0000-000000000004', 'priya@comedy101.com',
   crypt('devpassword', gen_salt('bf', 12)), 'Priya Nair', 'student'),
  ('a1000000-0000-0000-0000-000000000005', 'sam@comedy101.com',
   crypt('devpassword', gen_salt('bf', 12)), 'Sam Okonkwo', 'student'),
  ('a1000000-0000-0000-0000-000000000006', 'zoe@comedy101.com',
   crypt('devpassword', gen_salt('bf', 12)), 'Zoe Whitfield', 'student')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- STEP 2: Enroll students in the Comedy course
-- ============================================================
INSERT INTO course_enrollments (course_id, student_id)
SELECT (SELECT id FROM _course), u.id
FROM users u
WHERE u.email IN (
  'tyler@comedy101.com', 'maya@comedy101.com', 'jake@comedy101.com',
  'priya@comedy101.com', 'sam@comedy101.com',  'zoe@comedy101.com'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 3: Create inline document + chunks for citation map
-- ============================================================
INSERT INTO documents (
  id, course_id, uploaded_by, filename, storage_path,
  processing_status, page_count
) VALUES (
  'b1000000-0000-0000-0000-000000000001',
  (SELECT id FROM _course),
  (SELECT id FROM _prof),
  'The_Big_Book_of_Comedy_and_Joke_Writing.pdf',
  'inline',
  'ready',
  58
) ON CONFLICT DO NOTHING;

INSERT INTO session_documents (session_id, document_id, is_active)
VALUES (
  (SELECT id FROM _session),
  'b1000000-0000-0000-0000-000000000001',
  true
) ON CONFLICT DO NOTHING;

INSERT INTO document_chunks
  (id, document_id, chunk_index, page_number, content, token_count)
VALUES
  ('b2000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001', 0, 1,
   'Every joke has three structural components: the setup, which establishes context and primes expectations; the punchline, which delivers the subverted or surprising conclusion; and the optional tag, which adds a second unexpected beat after the punchline to extend the laugh. A setup should contain only the minimum information required for the punchline to land. Every unnecessary word in a setup is a step toward losing your audience before they reach the payoff.',
   92),
  ('b2000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000001', 1, 3,
   'The Rule of Three is one of comedy''s most reliable structural tools. Three items feel complete to the human brain — two items are a list, four items are tedious, but three items feel like a finished pattern. In comedy, we exploit this: the first two items establish the pattern and set the expectation, and the third violates it. The violating third must be genuinely surprising and must fit the category established by the first two items well enough to feel like a cheat. A fourth item after a successful rule-of-three punchline almost always diminishes the laugh.',
   108),
  ('b2000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000001', 2, 7,
   'Misdirection is the deliberate construction of a false expectation that the punchline then destroys and replaces. Effective misdirection requires the setup to point confidently toward the wrong interpretation — the audience must commit to reading the setup one way. The punchline then reveals the correct interpretation, which must be both surprising and, in retrospect, obviously present in the setup. The best misdirection makes the audience feel momentarily fooled, then immediately clever for understanding the reveal. If the audience sees the misdirect coming, the joke fails.',
   98),
  ('b2000000-0000-0000-0000-000000000004',
   'b1000000-0000-0000-0000-000000000001', 3, 12,
   'Timing in stand-up comedy operates at two levels: macro-timing (the placement of jokes within a set, the ordering of bits) and micro-timing (the millisecond-level decisions about pauses, emphasis, and pace within a single joke). Both matter, but micro-timing is what separates good comedians from great ones. The pause before a punchline creates tension and signals that a payoff is coming — used correctly, it amplifies the laugh; overused, it telegraphs the joke. Delivery choices — pace, volume, inflection — must serve the material rather than perform over it.',
   96),
  ('b2000000-0000-0000-0000-000000000005',
   'b1000000-0000-0000-0000-000000000001', 4, 15,
   'Punching up means directing humor at targets with more social power than the comedian or audience: institutions, the wealthy, the powerful. Punching down means targeting those with less power. The distinction matters ethically and practically — audiences are more comfortable laughing at the powerful than at the vulnerable. Self-deprecating humor occupies a unique position: the comedian is the target, and they hold the authority to decide how their own experience is framed. The line becomes contested when self-deprecation relies on stereotypes that affect others in the same group.',
   99),
  ('b2000000-0000-0000-0000-000000000006',
   'b1000000-0000-0000-0000-000000000001', 5, 18,
   'A callback is a joke that references a joke or moment from earlier in the same performance. Callbacks work because of two mechanisms: recognition (the audience experiences the pleasure of remembering) and surprise (the return feels unexpected even when anticipated). For a callback to land, the original moment must have been genuinely memorable — a callback to a weak joke will only remind the audience of a weak joke. The optimal callback distance is far enough that the audience has half-forgotten the original, usually 5–10 minutes in a longer set. Callbacks reward attentive audiences and create a sense of a cohesive, designed performance.',
   110),
  ('b2000000-0000-0000-0000-000000000007',
   'b1000000-0000-0000-0000-000000000001', 6, 22,
   'Voice in comedy refers to the consistent perspective, aesthetic, and personality that makes your material recognizably yours. Voice is not invented — it is excavated. It emerges from writing consistently, performing consistently, and paying attention to which material feels most authentically expressive versus borrowed or imitative. Common signs that you have found your voice: you write jokes that only you would write, your performance of your material feels effortless rather than performed, and other comedians can identify your work without attribution.',
   88),
  ('b2000000-0000-0000-0000-000000000008',
   'b1000000-0000-0000-0000-000000000001', 7, 25,
   'A five-minute set has a recognizable architecture. The opener should be fast, reliable, and low-risk — your job is to establish credibility quickly. Save your most adventurous or vulnerable material for the middle, once the audience has decided to trust you. Close with your strongest bit: the one with the biggest payoff, the most satisfying structure, and the highest emotional peak. Never close on experimental material. The last 30 seconds should feel inevitable — like the whole set was building to it. Leave the audience at a high point, not a plateau.',
   101),
  ('b2000000-0000-0000-0000-000000000009',
   'b1000000-0000-0000-0000-000000000001', 8, 31,
   'Observational comedy and absurdist comedy differ in their source material. Observational comedy begins with shared reality — things everyone has experienced — and finds the funny angle within it. The comedian is a mirror, held at a slightly distorted angle. Absurdist comedy begins with a premise that violates reality, then follows that violation to its most logical conclusion. The comedy is generated by the collision between the impossible premise and the rigorous logic applied to it. Observational comedy invites recognition; absurdist comedy invites disorientation.',
   95),
  ('b2000000-0000-0000-0000-000000000010',
   'b1000000-0000-0000-0000-000000000001', 9, 45,
   'Three major theories attempt to explain why things are funny. The Incongruity Theory holds that humor arises from the perception of two conflicting schemas simultaneously — the punchline resolves an incongruity created by the setup. The Superiority Theory (Hobbes, Plato) holds that laughter is a response to perceiving others'' inferiority or misfortune. The Relief Theory (Freud, Spencer) holds that laughter releases suppressed tension or anxiety. Bergson''s theory, distinct from these, proposes that laughter is a social corrective: we laugh at rigidity — the "mechanical encrusted on the living" — to remind each other to remain flexible and adaptive. All four theories capture something true; none captures everything.',
   122)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 4: Create threads (one per question)
-- ============================================================
INSERT INTO threads (id, session_id, student_id, shared, created_at) VALUES
  -- Doubts (Q1–Q6)
  ('c1000000-0000-0000-0000-000000000001', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000001', false, now() - interval '85 minutes'),
  ('c1000000-0000-0000-0000-000000000002', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000002', false, now() - interval '80 minutes'),
  ('c1000000-0000-0000-0000-000000000003', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006', false, now() - interval '78 minutes'),
  ('c1000000-0000-0000-0000-000000000004', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000001', false, now() - interval '72 minutes'),
  ('c1000000-0000-0000-0000-000000000005', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000002', false, now() - interval '68 minutes'),
  ('c1000000-0000-0000-0000-000000000006', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000003', false, now() - interval '65 minutes'),
  -- Homework (Q7–Q10)
  ('c1000000-0000-0000-0000-000000000007', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000003', false, now() - interval '60 minutes'),
  ('c1000000-0000-0000-0000-000000000008', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000004', false, now() - interval '55 minutes'),
  ('c1000000-0000-0000-0000-000000000009', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000005', false, now() - interval '50 minutes'),
  ('c1000000-0000-0000-0000-000000000010', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006', false, now() - interval '45 minutes'),
  -- Exam Prep (Q11–Q13)
  ('c1000000-0000-0000-0000-000000000011', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000005', false, now() - interval '40 minutes'),
  ('c1000000-0000-0000-0000-000000000012', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000002', false, now() - interval '35 minutes'),
  ('c1000000-0000-0000-0000-000000000013', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000004', false, now() - interval '30 minutes'),
  -- Summaries (Q14–Q15)
  ('c1000000-0000-0000-0000-000000000014', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006', false, now() - interval '25 minutes'),
  ('c1000000-0000-0000-0000-000000000015', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000001', false, now() - interval '20 minutes'),
  -- Fork threads (Q16–Q18)
  ('c1000000-0000-0000-0000-000000000016', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000004', false, now() - interval '75 minutes'),
  ('c1000000-0000-0000-0000-000000000017', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000005', false, now() - interval '69 minutes'),
  ('c1000000-0000-0000-0000-000000000018', (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006', false, now() - interval '62 minutes')
ON CONFLICT DO NOTHING;

-- Mark fork threads
UPDATE threads SET forked_from = 'c1000000-0000-0000-0000-000000000002'
  WHERE id = 'c1000000-0000-0000-0000-000000000016';
UPDATE threads SET forked_from = 'c1000000-0000-0000-0000-000000000004'
  WHERE id = 'c1000000-0000-0000-0000-000000000017';
UPDATE threads SET forked_from = 'c1000000-0000-0000-0000-000000000006'
  WHERE id = 'c1000000-0000-0000-0000-000000000018';

-- ============================================================
-- STEP 5: Insert questions
-- ============================================================
INSERT INTO questions (
  id, session_id, student_id, content, anonymous,
  category, fork_count, forked_from, thread_id, thread_sequence, asked_at
) VALUES
  -- ---- Doubts ----
  ('d1000000-0000-0000-0000-000000000001',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000001',
   'What''s the difference between a setup and a premise? My setups keep running way too long and I feel like I lose the audience before I even get to the punchline.',
   false, 'Doubts', 0, NULL,
   'c1000000-0000-0000-0000-000000000001', 1, now() - interval '85 minutes'),

  ('d1000000-0000-0000-0000-000000000002',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000002',
   'Can you explain the rule of three in comedy? Why does the third item always have to be the funny one — is there any flexibility?',
   false, 'Doubts', 1, NULL,
   'c1000000-0000-0000-0000-000000000002', 1, now() - interval '80 minutes'),

  ('d1000000-0000-0000-0000-000000000003',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006',
   'How do I know when I''m punching down? I want to write self-deprecating material but I''m worried about crossing a line I can''t see.',
   false, 'Doubts', 0, NULL,
   'c1000000-0000-0000-0000-000000000003', 1, now() - interval '78 minutes'),

  ('d1000000-0000-0000-0000-000000000004',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000001',
   'What makes a callback joke actually work? I tried one in the workshop today and it totally confused people instead of getting a laugh.',
   false, 'Doubts', 1, NULL,
   'c1000000-0000-0000-0000-000000000004', 1, now() - interval '72 minutes'),

  ('d1000000-0000-0000-0000-000000000005',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000002',
   'What is misdirection in joke writing exactly? The lecture mentioned it but I don''t fully understand how to build it into a joke.',
   false, 'Doubts', 0, NULL,
   'c1000000-0000-0000-0000-000000000005', 1, now() - interval '68 minutes'),

  ('d1000000-0000-0000-0000-000000000006',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000003',
   'Why does the same joke land so differently depending on who delivers it? Isn''t the writing what matters most at the end of the day?',
   false, 'Doubts', 1, NULL,
   'c1000000-0000-0000-0000-000000000006', 1, now() - interval '65 minutes'),

  -- ---- Homework ----
  ('d1000000-0000-0000-0000-000000000007',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000003',
   'For the 5-minute set homework, how do I decide which jokes to open with versus which ones to close with? Does the order really matter that much?',
   false, 'Homework', 0, NULL,
   'c1000000-0000-0000-0000-000000000007', 1, now() - interval '60 minutes'),

  ('d1000000-0000-0000-0000-000000000008',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000004',
   'The assignment says to develop a "comedic persona" — can you explain what that actually means and how it''s different from just being yourself on stage?',
   false, 'Homework', 0, NULL,
   'c1000000-0000-0000-0000-000000000008', 1, now() - interval '55 minutes'),

  ('d1000000-0000-0000-0000-000000000009',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000005',
   'How do I punch up a weak joke? I wrote one for the assignment and the punchline feels totally flat but I can''t figure out why.',
   false, 'Homework', 0, NULL,
   'c1000000-0000-0000-0000-000000000009', 1, now() - interval '50 minutes'),

  ('d1000000-0000-0000-0000-000000000010',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006',
   'The homework asks us to rewrite a classic joke in our own voice. What does "finding your voice" actually mean in stand-up comedy?',
   false, 'Homework', 0, NULL,
   'c1000000-0000-0000-0000-000000000010', 1, now() - interval '45 minutes'),

  -- ---- Exam Prep ----
  ('d1000000-0000-0000-0000-000000000011',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000005',
   'What topics from the first three lectures will be on the midterm? I want to make sure I''m studying the right things.',
   false, 'Exam Prep', 0, NULL,
   'c1000000-0000-0000-0000-000000000011', 1, now() - interval '40 minutes'),

  ('d1000000-0000-0000-0000-000000000012',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000002',
   'Can you explain the difference between wit, irony, and sarcasm for the exam? I keep mixing them up and I''m not sure I could identify them in an example.',
   false, 'Exam Prep', 0, NULL,
   'c1000000-0000-0000-0000-000000000012', 1, now() - interval '35 minutes'),

  ('d1000000-0000-0000-0000-000000000013',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000004',
   'Is Bergson''s "mechanical encrusted on the living" theory going to be on the exam? I''ve read the passage three times and I still don''t fully understand what he means.',
   false, 'Exam Prep', 0, NULL,
   'c1000000-0000-0000-0000-000000000013', 1, now() - interval '30 minutes'),

  -- ---- Summaries ----
  ('d1000000-0000-0000-0000-000000000014',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006',
   'Can you summarize the main punchline-writing techniques we covered today? I want to make sure I have them all before I work on the assignment.',
   false, 'Summaries', 0, NULL,
   'c1000000-0000-0000-0000-000000000014', 1, now() - interval '25 minutes'),

  ('d1000000-0000-0000-0000-000000000015',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000001',
   'What were the key differences between observational comedy and absurdist comedy that we covered in today''s lecture?',
   false, 'Summaries', 0, NULL,
   'c1000000-0000-0000-0000-000000000015', 1, now() - interval '20 minutes'),

  -- ---- Fork questions ----
  ('d1000000-0000-0000-0000-000000000016',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000004',
   'Wait — what if you flip the rule of three and make the FIRST item the surprising one instead of the third? Is that actually a technique comedians use?',
   false, 'Doubts', 0, 'd1000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000016', 1, now() - interval '75 minutes'),

  ('d1000000-0000-0000-0000-000000000017',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000005',
   'Can a callback reference something funny that happened in class today, not just a joke from earlier in your own set?',
   false, 'Doubts', 0, 'd1000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000017', 1, now() - interval '69 minutes'),

  ('d1000000-0000-0000-0000-000000000018',
   (SELECT id FROM _session), 'a1000000-0000-0000-0000-000000000006',
   'So if delivery matters as much as writing, how do stand-up comedians who stutter or have strong accents use that to their advantage rather than working around it?',
   false, 'Doubts', 0, 'd1000000-0000-0000-0000-000000000006',
   'c1000000-0000-0000-0000-000000000018', 1, now() - interval '62 minutes')
ON CONFLICT DO NOTHING;

-- Update fork counts on original questions
UPDATE questions SET fork_count = 1 WHERE id = 'd1000000-0000-0000-0000-000000000002';
UPDATE questions SET fork_count = 1 WHERE id = 'd1000000-0000-0000-0000-000000000004';
UPDATE questions SET fork_count = 1 WHERE id = 'd1000000-0000-0000-0000-000000000006';

-- ============================================================
-- STEP 6: Insert answers
-- ============================================================
INSERT INTO answers (id, question_id, content, model_used, generation_latency_ms, generated_at)
VALUES
  -- Q1: Setup vs premise
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Great question! A **premise** is the foundational worldview or observation your comedy is built on — it''s *why* the joke makes sense. A **setup** is the specific scenario or framing you use to deliver that premise in a particular joke. Think of the premise as "dogs are weirdly obsessed with approval" and the setup as "My dog looked so disappointed when I didn''t give him a high-five after he sneezed."

Your setups are running long because you''re likely including context that isn''t strictly necessary for the punchline. Try the **necessity test**: remove each sentence from your setup and see if the punchline still lands without it. If the punchline still works, cut that sentence. A setup should be the minimum information required for the punchline to make sense — not the maximum context you think the audience needs.',
   'gpt-4o', 2340, now() - interval '84 minutes'),

  -- Q2: Rule of three
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
   'The rule of three works because our brains naturally perceive three items as a complete pattern. The first item establishes a category, the second confirms the pattern, and the third — if it breaks the pattern — delivers the subverted expectation that generates the laugh.

Example: *"I love hiking, swimming, and filing my taxes."* Two outdoor activities set the expectation of leisure; the mundane third item creates the surprise. There''s no flexibility on position — the third must break the pattern. A funny first item would be a premise, not a setup. A funny second item kills the anticipation entirely.

The reason four items fails: by item four, the audience has already had the payoff and moved on. You''re asking them to wait for something they''ve already received.',
   'gpt-4o', 1980, now() - interval '79 minutes'),

  -- Q3: Punching up vs down
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003',
   '"Punching up" means directing humor at people or institutions with *more* social power than the comedian or audience. "Punching down" means targeting those with *less* power.

Self-deprecating humor is interesting because you''re technically the target — and you hold the authority over your own experience. The line becomes contested when your self-deprecation relies on a stereotype that also affects others in the same group (e.g., making a joke about your own ethnicity that reinforces a harmful generalization about that group).

A useful test: *"Does this joke require the audience to feel superior to a category of people?"* If yes, examine it carefully. The best self-deprecating comedy punches at your specific choices and behavior — not your identity or a group you belong to.',
   'gpt-4o', 2180, now() - interval '77 minutes'),

  -- Q4: Callback jokes
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004',
   'A callback works through two mechanisms: **recognition** (the audience experiences pleasure at remembering something) and **surprise** (the return feels unexpected even when half-anticipated). The key word is *unexpectedly* — callbacks fail when the audience sees them coming too early.

Your workshop callback may have failed because: (1) the original joke wasn''t memorable enough to stick in the audience''s mind, or (2) the callback came too soon — the sweet spot is usually 5–10 minutes after the original. The callback should feel like a surprise reunion, not a planned return trip.

Strong callbacks also add *new* information on the return — the revisit reveals something about the original joke you couldn''t have known at the time.',
   'gpt-4o', 2560, now() - interval '71 minutes'),

  -- Q5: Misdirection
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005',
   'Misdirection means deliberately steering the audience''s expectations toward one interpretation of a setup, then delivering a punchline that reveals a completely different — but retroactively valid — interpretation.

Example: *"I grew up in a tough neighborhood. When I was 5, I watched a man get stabbed... with compliments. He gave a terrible PowerPoint and everyone was too polite to say so."*

"Tough neighborhood" and "watched a man get stabbed" prime the audience for violence. The reveal flips the entire scene. The mechanic: the punchline must make the setup make *more* sense than the false interpretation did. The audience should feel momentarily fooled, then immediately clever. If they see the misdirect coming, you haven''t committed hard enough to the false path.',
   'gpt-4o', 2420, now() - interval '67 minutes'),

  -- Q6: Delivery vs writing (INTENTIONALLY WEAK — causes "needs attention")
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006',
   'Delivery is honestly the most important part of comedy — it accounts for probably 90% of what makes something land. The same words told by a great performer versus an average one produce completely different results. Writing is secondary to physical presence, timing, and stage energy.

Most working stand-ups will tell you that you can absolutely save a mediocre joke with great delivery. So if you''re struggling with your material, focus on your stage presence, facial expressions, and confidence first — the words themselves matter much less than how you inhabit them.',
   'gpt-4o', 1120, now() - interval '64 minutes'),

  -- Q7: Set structure / homework
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000007',
   'Opening jokes should be your most **reliable**, **quickest-hitting** material — short setups, big payoffs. In the first 60 seconds you''re establishing credibility: "I am funny, trust me with your next 5 minutes." Use jokes you could do in your sleep.

Your closing joke should be your **biggest, most crowd-pleasing** bit — the highest emotional peak, the most satisfying structure. Never close on experimental material.

A solid 5-minute structure: Quick opener (30s) → Reliable bit #1 (90s) → Middle bit where you can take a small risk (90s) → Big closer (90s). The middle is where you test new things — you''ve earned their trust by then, and they haven''t yet formed their final impression.',
   'gpt-4o', 2290, now() - interval '59 minutes'),

  -- Q8: Comedic persona
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000008',
   'A comedic persona is the consistent version of yourself you perform on stage — not fake, but deliberately *stable*. It''s the point-of-view your jokes speak from. Examples: Dave Chappelle performs as an observational street philosopher. Maria Bamford plays her anxiety as a feature, not a bug. John Mulaney is a well-mannered Catholic boy who is quietly appalled by everything.

Your persona answers: *"What is my relationship to the world?"* — are you the confused outsider, the wise cynic, the gleeful chaotic?

To discover yours: look at your 5 funniest real-life stories and find what role you play in all of them. The role you consistently occupy — hapless bystander, reluctant instigator, overcautious planner — is likely your natural comedic persona.',
   'gpt-4o', 2105, now() - interval '54 minutes'),

  -- Q9: Fixing a flat punchline
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000009',
   'A flat punchline almost always has one of three problems:

1. **It explains the joke.** You''re describing what should be implied. Cut everything after the first punchline word that the audience can infer on their own.

2. **The setup is too on-the-nose.** If the audience can predict your punchline from your setup, misdirection has failed. Make the setup point more firmly toward the *wrong* conclusion.

3. **The wrong word is last.** In English, the last word of a punchline carries the most emphasis. Compare: *"I punched a clown"* vs. *"I punched a guy in clown makeup."* "Clown" lands harder because it''s the most unexpected and final word. Rearrange so the funniest, most surprising word comes last.',
   'gpt-4o', 1870, now() - interval '49 minutes'),

  -- Q10: Finding your voice
  ('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000010',
   '"Finding your voice" means discovering the perspective, rhythm, and word choices that are distinctly and authentically yours — not borrowed from comedians you admire. You''ll know you''ve found it when someone reads a joke blind and knows it''s yours.

To get there: (1) Write 50 jokes without filtering — quantity over quality. (2) Read them aloud and notice which ones you would actually *say* in a real conversation. (3) Notice the topics you keep returning to — those are your voice''s home territory. (4) Notice the structure you naturally default to — slow-burn story or rapid-fire one-liner?

Voice is revealed by habit, not invented by decision. For the rewrite assignment, ask: *"How would I tell this story if I were texting a friend about it?"*',
   'gpt-4o', 2200, now() - interval '44 minutes'),

  -- Q11: Midterm topics
  ('e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000011',
   'Based on the first three lectures, here''s what to prioritize:

**Lecture 1 — Anatomy of a joke:** Setup, premise, punchline, tag. The rule of three. Joke types: observational, self-deprecating, absurdist.

**Lecture 2 — Mechanics:** Comedic timing (macro vs. micro), misdirection, callback structure (timing, distance, recontextualization).

**Lecture 3 — Craft and ethics:** Punching up vs. punching down, finding your comedic persona, structuring a short set (opener / middle / closer logic).

**Theory section:** Know the four major comedy theories — Incongruity, Superiority, Relief, and Bergson''s mechanical/living framework. The midterm will likely include both conceptual identification questions and a short practical exercise where you write or revise a joke.',
   'gpt-4o', 3140, now() - interval '39 minutes'),

  -- Q12: Wit vs irony vs sarcasm
  ('e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000012',
   'These three are often confused but have distinct meanings:

**Wit** is quick, clever observation or wordplay — intellectual agility, finding the funny angle in something real. The tone is warm or neutral.

**Irony** is saying the opposite of what you mean, where both speaker and listener understand the gap between the literal statement and the real meaning. It''s structural — about the relationship between what''s said and what''s meant.

**Sarcasm** is irony used to mock or wound. All sarcasm is ironic, but not all irony is sarcastic.

**Exam shortcut:** If the listener would feel insulted by the literal statement, it''s probably sarcasm. If both parties understand it''s playful, it''s wit or gentle irony.',
   'gpt-4o', 2780, now() - interval '34 minutes'),

  -- Q13: Bergson (INTENTIONALLY CONFUSING — causes "needs attention")
  ('e1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000013',
   'Yes, Bergson''s theory will be on the exam. His key idea from "Le Rire" (1900) is that laughter is a social corrective mechanism. The "mechanical encrusted on the living" means that when living beings behave with the rigidity and predictability of machines, it becomes comic. Comedy is what happens when the mechanical encrusts itself onto the living, because the living encrusted by the mechanical creates the comic of the mechanical, which Bergson identifies as the mechanism of the comic, meaning the comic arises from the mechanical quality encrusting the living quality, which is why the mechanical comic is what Bergson calls comedy. The living should be flexible and the mechanical is rigid, so the rigidity being comic is the comic rigidity.',
   'gpt-4o', 890, now() - interval '29 minutes'),

  -- Q14: Punchline techniques summary
  ('e1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000014',
   'Today we covered four main punchline techniques:

1. **The Reveal** — The punchline introduces new information that recontextualizes the setup. The audience re-reads what came before with new eyes.

2. **The Escalation** — The punchline takes the premise to an absurd or extreme logical conclusion. You follow the logic wherever it leads.

3. **The Reversal** — The punchline inverts the expected power dynamic or outcome. The weak character wins, the strong one fails.

4. **The Understatement** — The punchline deliberately reduces the emotional response when the audience expected amplification. The gap between the size of the event and the smallness of the reaction is where the comedy lives.

**Craft principle across all four:** The punchline''s last word should be the funniest or most surprising word in the sentence.',
   'gpt-4o', 2660, now() - interval '24 minutes'),

  -- Q15: Observational vs absurdist summary
  ('e1000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000015',
   'The key difference is the *source* of the comedy:

**Observational comedy** starts with something real and universal — an everyday experience — and finds the funny angle within it. The comedian acts as a mirror held at a slightly distorted angle. *"Have you ever noticed..."* is its signature. The comedy works because the audience recognizes themselves.

**Absurdist comedy** starts with a premise that *violates reality*, then follows that violation to its most logical conclusion. The comedy is generated by the collision between the impossible premise and the rigorous seriousness applied to it. Monty Python''s Knights Who Say Ni, played completely straight, is absurdism.

**The test:** Observational comedy asks *"Isn''t this relatable?"* Absurdist comedy asks *"What if we took this impossible thing completely seriously?"*',
   'gpt-4o', 2440, now() - interval '19 minutes'),

  -- Q16: Inverted rule of three (fork)
  ('e1000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000016',
   'Yes! What you''re describing is sometimes called the **"inverted rule of three"** or **"anti-rule."** It works when the first item is the surprising one and the subsequent items deflate or explain it:

*"I''ve been skydiving, bungee jumping, and I once left the house without checking if my keys were in my pocket."*

The two extreme adventures set an emotional register of excitement; the mundane anxiety of the third pulls the rug — but the actual punchline comes from the *contrast*, not third-position surprise. This works precisely because audiences expect the rule of three: you''re subverting the subversion.

It''s less common than the standard rule, which is part of its power. It requires the first item to be genuinely surprising enough to reframe everything that follows.',
   'gpt-4o', 2010, now() - interval '74 minutes'),

  -- Q17: Class callbacks (fork)
  ('e1000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000017',
   'Absolutely — callbacks can reference anything the *audience* shares as a common experience, including things that happened in class or the workshop that day. If something genuinely funny happened earlier in the session, referencing it in your set gives you the same double payoff: the audience feels the shared memory, the surprise of the return, and the implicit flattery of *"we were all there for that."*

This is actually a powerful technique for workshop and classroom performances — it builds community and makes the performance feel alive and specific to *this* room, *this* day.

The caveat: the original moment needs to have been genuinely funny and memorable to *most* of the room. If some people missed it, the callback inadvertently excludes them — and exclusion is the opposite of what a callback should do.',
   'gpt-4o', 1940, now() - interval '68 minutes'),

  -- Q18: Accents/stutters (fork)
  ('e1000000-0000-0000-0000-000000000018', 'd1000000-0000-0000-0000-000000000018',
   'This is one of comedy''s richest territories. Comedians with stutters, accents, or distinctive speech patterns often *weaponize* them rather than work around them.

A stutter, for example, gives a comedian timing control no one else has — the hesitation before a word lands differently than a deliberate pause, and it creates tension the performer can release on their own terms. An accent becomes a character voice, a marker of a specific perspective the audience doesn''t share.

Ronny Chieng and Russell Peters use their accents as *load-bearing* parts of their persona — the accent isn''t something to overcome, it''s something the audience has a relationship with, and exploiting that relationship is the comedy. The key insight: any perceived "disadvantage" in performance becomes an asset when you have more facility with it than your audience. Own the thing they''re noticing before they can be awkward about noticing it.',
   'gpt-4o', 2350, now() - interval '61 minutes')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 7: Answer citations (populates the citation map)
-- ============================================================
INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order) VALUES
  -- Q1 → pg 1 (joke anatomy)
  ('e1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 0.91, 1),
  -- Q2 → pg 3 (rule of three)
  ('e1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 0.94, 1),
  -- Q3 → pg 15 (punching up/down)
  ('e1000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000005', 0.88, 1),
  -- Q4 → pg 18 (callbacks)
  ('e1000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000006', 0.92, 1),
  -- Q5 → pg 7 (misdirection)
  ('e1000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 0.89, 1),
  -- Q6 → pg 12 (timing/delivery) — low relevance signals weak answer
  ('e1000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000004', 0.76, 1),
  -- Q7 → pg 25 (set structure)
  ('e1000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000008', 0.93, 1),
  -- Q8 → pg 22 (voice)
  ('e1000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000007', 0.87, 1),
  -- Q9 → pg 1 + pg 7
  ('e1000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000001', 0.82, 1),
  ('e1000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000003', 0.79, 2),
  -- Q10 → pg 22 (voice)
  ('e1000000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000007', 0.90, 1),
  -- Q11 → pg 1 + pg 3 + pg 45 (midterm covers everything)
  ('e1000000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000001', 0.85, 1),
  ('e1000000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000002', 0.83, 2),
  ('e1000000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000010', 0.88, 3),
  -- Q12 → pg 45 (comedy theory)
  ('e1000000-0000-0000-0000-000000000012', 'b2000000-0000-0000-0000-000000000010', 0.91, 1),
  -- Q13 → pg 45 — low relevance signals confused answer
  ('e1000000-0000-0000-0000-000000000013', 'b2000000-0000-0000-0000-000000000010', 0.72, 1),
  -- Q14 → pg 1 + pg 7 + pg 18 (punchline techniques span multiple sections)
  ('e1000000-0000-0000-0000-000000000014', 'b2000000-0000-0000-0000-000000000001', 0.86, 1),
  ('e1000000-0000-0000-0000-000000000014', 'b2000000-0000-0000-0000-000000000003', 0.84, 2),
  ('e1000000-0000-0000-0000-000000000014', 'b2000000-0000-0000-0000-000000000006', 0.81, 3),
  -- Q15 → pg 31 (obs vs absurdist)
  ('e1000000-0000-0000-0000-000000000015', 'b2000000-0000-0000-0000-000000000009', 0.93, 1),
  -- Q16 fork → pg 3 (rule of three)
  ('e1000000-0000-0000-0000-000000000016', 'b2000000-0000-0000-0000-000000000002', 0.88, 1),
  -- Q17 fork → pg 18 (callbacks)
  ('e1000000-0000-0000-0000-000000000017', 'b2000000-0000-0000-0000-000000000006', 0.90, 1),
  -- Q18 fork → pg 12 (timing/delivery)
  ('e1000000-0000-0000-0000-000000000018', 'b2000000-0000-0000-0000-000000000004', 0.85, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 8: Answer feedback (votes)
-- ============================================================
INSERT INTO answer_feedback (answer_id, student_id, feedback) VALUES
  -- Q1: 4 up (Tyler is the author, so the other 4 vote)
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'up'),
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'up'),
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'up'),
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 'up'),
  -- Q2: 3 up
  ('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'up'),
  ('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'up'),
  -- Q3: 2 up, 1 down (slightly divisive topic)
  ('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'up'),
  ('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'down'),
  -- Q4: 2 up
  ('e1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'up'),
  ('e1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'up'),
  -- Q5: 3 up
  ('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'up'),
  ('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', 'up'),
  -- Q6: 1 up, 3 down → NEEDS ATTENTION (bad AI answer)
  ('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'down'),
  ('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'down'),
  ('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'down'),
  ('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'up'),
  -- Q7: 4 up
  ('e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'up'),
  ('e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004', 'up'),
  ('e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000005', 'up'),
  -- Q8: 2 up
  ('e1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', 'up'),
  ('e1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000006', 'up'),
  -- Q9: 1 up
  ('e1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'up'),
  -- Q10: 3 up
  ('e1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002', 'up'),
  ('e1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000005', 'up'),
  -- Q11: 5 up (everyone cares about the midterm)
  ('e1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000002', 'up'),
  ('e1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000003', 'up'),
  ('e1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000004', 'up'),
  ('e1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000006', 'up'),
  -- Q12: 3 up
  ('e1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003', 'up'),
  ('e1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000004', 'up'),
  -- Q13: 1 up, 3 down → NEEDS ATTENTION (confusing Bergson answer)
  ('e1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000001', 'down'),
  ('e1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000002', 'down'),
  ('e1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000006', 'down'),
  ('e1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000003', 'up'),
  -- Q14: 2 up
  ('e1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000001', 'up'),
  ('e1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000005', 'up'),
  -- Q15: 1 up
  ('e1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000002', 'up')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 9: Professor labels + share threads
-- ============================================================
UPDATE threads SET
  professor_labels  = ARRAY['✓ Discussed in class'],
  professor_notes   = 'Covered in first 15 min — good reference for students',
  shared            = true,
  shared_at         = now() - interval '70 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000001';

UPDATE threads SET
  professor_labels  = ARRAY['⚡ Interesting Question'],
  shared            = true,
  shared_at         = now() - interval '65 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000002';

UPDATE threads SET
  professor_labels  = ARRAY['⚠️ Misleading'],
  professor_notes   = 'AI oversimplifies this — need to discuss nuance Thursday',
  shared            = true,
  shared_at         = now() - interval '63 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000003';

UPDATE threads SET
  professor_labels  = ARRAY['🎯 Good Analogy'],
  shared            = true,
  shared_at         = now() - interval '57 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000004';

UPDATE threads SET
  professor_labels  = ARRAY['❌ Wrong Answer'],
  professor_notes   = 'AI says delivery > writing — completely incorrect framing',
  shared            = true,
  shared_at         = now() - interval '50 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000006';

UPDATE threads SET
  professor_labels  = ARRAY['✓ Discussed in class', '🎯 Good Analogy'],
  shared            = true,
  shared_at         = now() - interval '45 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000007';

UPDATE threads SET
  professor_labels  = ARRAY['✓ Discussed in class'],
  professor_notes   = 'Midterm review sheet is posted on the course page',
  shared            = true,
  shared_at         = now() - interval '25 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000011';

UPDATE threads SET
  professor_labels  = ARRAY['❌ Wrong Answer', '🔄 Needs Follow-up'],
  professor_notes   = 'Bergson explanation is circular — I will clarify this Thursday',
  shared            = true,
  shared_at         = now() - interval '15 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000013';

UPDATE threads SET
  professor_labels  = ARRAY['🧠 Deep Understanding'],
  professor_notes   = 'Inverted rule of three — great instinct from Priya',
  shared            = true,
  shared_at         = now() - interval '60 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000016';

UPDATE threads SET
  professor_labels  = ARRAY['🔄 Needs Follow-up'],
  shared            = true,
  shared_at         = now() - interval '47 minutes',
  include_questions = true
WHERE id = 'c1000000-0000-0000-0000-000000000018';

-- ============================================================
-- STEP 10: Question comments
-- ============================================================
INSERT INTO question_comments (question_id, user_id, content, created_at) VALUES
  -- Professor corrects Q6
  ('d1000000-0000-0000-0000-000000000006',
   (SELECT id FROM _prof),
   'Note: Writing and delivery are equally important — this answer undersells the craft. Great writing makes even imperfect delivery survivable. We''ll revisit this in Week 4.',
   now() - interval '50 minutes'),
  -- Tyler reacts to Q2
  ('d1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000001',
   'Oh! So like "I like dogs, cats, and MIME ARTISTS" — the third breaks the category just enough to be weird. That makes so much sense now.',
   now() - interval '76 minutes'),
  -- Sam thanks after Q11
  ('d1000000-0000-0000-0000-000000000011',
   'a1000000-0000-0000-0000-000000000005',
   'Thank you!! I was so stressed about what to study. This breakdown is exactly what I needed.',
   now() - interval '38 minutes'),
  -- Priya frustrated by Q13
  ('d1000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000004',
   'I''ve read this three times and I''m more confused than when I started 😅 Can we please go over this in class?',
   now() - interval '27 minutes'),
  -- Maya adds insight on Q16
  ('d1000000-0000-0000-0000-000000000016',
   'a1000000-0000-0000-0000-000000000002',
   'I looked this up — I think it''s called a "subverted rule of three" and it''s actually a recognized technique. Norm Macdonald used it constantly.',
   now() - interval '72 minutes')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 11: Thread comments (on shared threads)
-- ============================================================
INSERT INTO thread_comments (thread_id, user_id, content, created_at) VALUES
  -- Professor clarifies on thread Q1
  ('c1000000-0000-0000-0000-000000000001',
   (SELECT id FROM _prof),
   'Great foundational question. Quick clarification: a premise is the worldview or observation (e.g., "airports are designed to make you feel stupid"). A setup is the specific scenario that activates that premise in a particular joke.',
   now() - interval '68 minutes'),
  -- Professor flags Q6 thread
  ('c1000000-0000-0000-0000-000000000006',
   (SELECT id FROM _prof),
   'I''m flagging this AI answer — it significantly undersells the importance of writing. Delivery can rescue a mediocre joke, but it cannot rescue a non-joke. We''ll revisit the writing/delivery relationship in Week 4.',
   now() - interval '48 minutes'),
  -- Zoe asks for help on Q13 thread
  ('c1000000-0000-0000-0000-000000000013',
   'a1000000-0000-0000-0000-000000000006',
   'Can we get a cleaner explanation of this in class? The AI answer just repeated the same phrase in circles.',
   now() - interval '13 minutes')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Summary
-- ============================================================
SELECT
  'Comedy 101 demo seed complete' AS status,
  (SELECT COUNT(*) FROM questions WHERE session_id = (SELECT id FROM _session)) AS total_questions,
  (SELECT COUNT(*) FROM threads   WHERE session_id = (SELECT id FROM _session) AND shared = true) AS shared_threads,
  (SELECT COUNT(*) FROM answer_feedback af
   JOIN answers a ON af.answer_id = a.id
   JOIN questions q ON a.question_id = q.id
   WHERE q.session_id = (SELECT id FROM _session)) AS total_votes,
  (SELECT COUNT(*) FROM document_chunks WHERE document_id = 'b1000000-0000-0000-0000-000000000001') AS doc_chunks;
