#!/usr/bin/env python3
"""
Generates SQL to populate Comedy 101 / "Lecture 20/05/2026" with a much larger,
realistic demo dataset:

  - 23 new student users (bringing the class roster to ~30 total)
  - Each of the 30 students asks between 0 and 7 questions (uniform random)
  - Every question is grounded in one of the 10 real chunks of the course PDF,
    wrapped in its own shared thread (question + AI answer + citation)
  - Realistic classmate votes (mirrored into BOTH answer_feedback AND
    thread_feedback — the app reads consensus from the former, the feed's
    thumbs from the latter), a sprinkling of comments, and a handful of forks
  - Also backfills answer_feedback for the 6 threads seeded earlier (they only
    had thread_feedback, which is why Answer Quality Breakdown showed empty)

Prints SQL to stdout. Deterministic (fixed random seed) so re-running produces
identical output — safe to diff before applying.

Usage: python3 db/generate_bulk_demo_data.py > db/seed_demo_prod_bulk.sql
"""

import random

random.seed(20260817)

COURSE_ID = "00000000-0000-0000-0000-000000000011"
SESSION_ID = "2475a3af-237a-48e6-ba96-80961f1dda27"
PROF_ID = "2b780e08-1c4c-4d21-84c8-b81ea377e2e5"
MANAN_ID = "0eb0ab86-fba6-4932-83a2-ab713c773531"

EXISTING_STUDENTS = [
    ("a1000000-0000-0000-0000-000000000001", "Tyler Chen"),
    ("a1000000-0000-0000-0000-000000000002", "Maya Patel"),
    ("a1000000-0000-0000-0000-000000000003", "Jake Rivera"),
    ("a1000000-0000-0000-0000-000000000004", "Priya Nair"),
    ("a1000000-0000-0000-0000-000000000005", "Sam Okonkwo"),
    ("a1000000-0000-0000-0000-000000000006", "Zoe Whitfield"),
]

NEW_NAMES = [
    "Devon Marsh", "Lena Ferraro", "Omar Siddiqui", "Ava Bergstrom", "Caleb Nakamura",
    "Ines Bouazizi", "Marcus Delgado", "Ruth Achebe", "Felix Novak", "Harper Solis",
    "Nadia Volkov", "Theo Adeyemi", "Camille Duarte", "Wesley Okafor", "Ingrid Halvorsen",
    "Reza Tehrani", "Bianca Costa", "Miles Fontaine", "Yuki Tanaka", "Elena Petrov",
    "Julian Osei", "Sasha Kowalski", "Priyanka Rao",
]

def slug(name):
    return name.split()[0].lower()

NEW_STUDENTS = []
used = set(slug(n) for _, n in EXISTING_STUDENTS)
for i, name in enumerate(NEW_NAMES):
    s = slug(name)
    base = s
    n = 2
    while s in used:
        s = f"{base}{n}"
        n += 1
    used.add(s)
    NEW_STUDENTS.append((f"a1000000-0000-0000-0000-{i + 7:012d}", name, f"{s}@comedy101.com"))

ALL_STUDENTS = [(uid, name) for uid, name in EXISTING_STUDENTS] + [(uid, name) for uid, name, _ in NEW_STUDENTS]

# chunk_id -> page_number (from document_chunks; b1000000-...-0001 doc)
CHUNKS = {
    1: 1, 2: 3, 3: 7, 4: 12, 5: 15, 6: 18, 7: 22, 8: 25, 9: 31, 10: 45,
}
def chunk_uuid(n):
    return f"b2000000-0000-0000-0000-{n:012d}"

CATEGORIES = ["Doubts", "Homework", "Exam Prep", "Summaries"]

# (chunk_index, category, question, answer)
TEMPLATES = [
    (1, "Doubts",
     "What exactly counts as the \"tag\" after a punchline?",
     "The tag is an optional second beat that comes right after the punchline and extends the laugh with one more unexpected turn. It's not required — a joke works fine with just setup and punchline — but a good tag squeezes extra value out of a premise the audience is already primed for. The risk is stacking too many tags: each one has to earn its place, or it just dilutes the original laugh."),
    (1, "Homework",
     "How tight should my setups be for the open mic assignment?",
     "As tight as possible — the setup should contain only what's strictly necessary for the punchline to land. Every extra word is a chance for the audience to drift before the payoff. For your open mic set, read each setup out loud and cut anything that isn't doing direct work to set up the twist."),
    (2, "Doubts",
     "Why do three items feel funnier than two or four in a list joke?",
     "Two items just read as a list — there's no real pattern yet. Three completes a pattern in a way our brains register as \"finished,\" which is exactly what the punchline exploits: the first two items set the expectation, and the third breaks it. A fourth item after that break almost always undercuts the laugh, because the audience already got their payoff at three."),
    (3, "Doubts",
     "What makes misdirection fail on stage?",
     "Misdirection fails when the audience sees the twist coming before you deliver it — if the setup doesn't fully commit to the false read, there's no real surprise left for the punchline to provide. The setup has to point confidently at the wrong interpretation so the reveal actually lands as a reveal, not a confirmation."),
    (4, "Exam Prep",
     "What's the difference between macro-timing and micro-timing?",
     "Macro-timing is set-level — where a bit sits in your running order, how bits are sequenced against each other. Micro-timing is inside a single joke — the millisecond decisions about pauses, emphasis, and pace. Micro-timing is usually what separates a good comedian from a great one, since a pause before a punchline builds tension, but an overused one telegraphs the joke before it lands."),
    (5, "Doubts",
     "Where's the line between punching up and punching down?",
     "Punching up targets people with more social power than you or your audience — institutions, the wealthy, people in charge. Punching down targets people with less power. Audiences are generally more comfortable laughing at power than at vulnerability, which is why punching down reads as riskier. Self-deprecating humor sits in its own category since you hold the authority over your own framing — but it gets contested fast if it leans on stereotypes that affect your whole group, not just you."),
    (5, "Exam Prep",
     "Is self-deprecating humor always considered punching up?",
     "Not automatically — self-deprecation is safer than punching down at someone else because you're the author and the target at once, but it isn't a blanket pass. It becomes contested the moment it relies on a stereotype that reflects on your whole group, not just your own individual experience. The book is careful about that distinction even though it's easy to summarize past."),
    (6, "Homework",
     "How do I know if a moment is worth calling back to later?",
     "A callback only works if the original moment was genuinely memorable on its own — calling back to a weak joke just reminds the audience the joke was weak the first time. Before you plan a callback, ask whether the room actually reacted to the original moment. If it landed, you have material to return to."),
    (6, "Doubts",
     "Why does a callback feel funnier the second time?",
     "Two things stack on top of each other: recognition (the pleasure of remembering something) and surprise (the return feeling unexpected even though part of you half-anticipated it). The ideal gap is long enough that the audience has partly forgotten the original — usually 5 to 10 minutes in a full set — so the callback rewards people who were paying attention."),
    (7, "Doubts",
     "How do I find my own comedic voice instead of copying comedians I like?",
     "Voice isn't invented, it's excavated — it shows up from writing and performing consistently and noticing which material feels authentically yours versus borrowed. A few signals you've found it: you write jokes only you would write, performing your material feels effortless instead of performed, and other comedians could identify your work without a byline."),
    (8, "Exam Prep",
     "What's the ideal structure for a 5-minute set?",
     "Open fast, reliable, and low-risk to establish credibility quickly. Save your more adventurous or vulnerable material for the middle, once the room has decided to trust you. Close with your strongest bit — highest payoff, most satisfying structure — and never close on experimental material. The last 30 seconds should feel inevitable, like the whole set was building toward it."),
    (8, "Homework",
     "Where should my riskiest joke go in a 5-minute set?",
     "In the middle, not the open or the close. The opener's job is just to establish credibility fast and reliably — that's not the place to gamble. Once the audience has decided to trust you (usually a minute or two in), that's your window for the more adventurous material. Save your safest, strongest bit for the close so you leave on a high point."),
    (9, "Doubts",
     "What's the difference between observational and absurdist comedy?",
     "Observational comedy starts from shared reality — things everyone has experienced — and finds the funny angle inside it; the comedian acts like a mirror held at a slightly distorted angle. Absurdist comedy starts from a premise that violates reality and follows that violation to its most logical conclusion, generating comedy from the collision between an impossible premise and rigorous logic. Observational invites recognition; absurdist invites disorientation."),
    (10, "Exam Prep",
     "Can you explain the four major theories of why things are funny?",
     "Incongruity Theory says humor comes from holding two conflicting ideas at once, resolved by the punchline. Superiority Theory (Hobbes, Plato) says laughter is a response to perceiving someone else's misfortune or inferiority. Relief Theory (Freud, Spencer) says laughter releases suppressed tension. Bergson's theory frames laughter as a social corrective — mocking rigidity to push people back toward flexibility. None fully explains humor alone, but each captures something real."),
    (10, "Summaries",
     "Can you summarize the theories of humor for the reflection paper?",
     "Four theories: Incongruity (humor from conflicting ideas resolved by the punchline), Superiority (laughing at others' misfortune or inferiority — Hobbes, Plato), Relief (laughter releasing suppressed tension — Freud, Spencer), and Bergson's social-corrective theory (laughing at rigidity to nudge people back toward flexibility). Reference whichever framework best explains the specific joke you're analysing — most jokes lean on more than one."),
    (2, "Summaries",
     "Summarize the Rule of Three for me.",
     "Three items feel like a complete pattern to the human brain in a way two or four don't. The first two items establish the pattern; the third breaks it, and that break is the joke. Adding a fourth item after a successful three-beat punchline almost always deflates the laugh — the audience already got their payoff."),
    (4, "Homework",
     "How much should I actually pause before a punchline in my next set?",
     "There's no fixed count — it's a feel decision, but the pause should be just long enough to signal a payoff is coming without giving away what it is. Used correctly it amplifies the laugh by building tension; overused, especially with a predictable rhythm, it telegraphs the joke before you say it. Record yourself and listen back — if you can guess your own punchline during the pause, it's too long."),
    (3, "Exam Prep",
     "What's the mechanism behind why misdirection works as a comedic device?",
     "It's the deliberate construction of a false expectation that the punchline then destroys and replaces. The setup has to make the audience commit to reading it one way; the punchline reveals the correct interpretation, which needs to be both surprising and, in hindsight, clearly present in the setup all along. Done well, the audience feels briefly fooled and then immediately clever for catching up."),
]


def sql_escape(s):
    return s.replace("'", "''")


def main():
    out = []
    out.append("-- =============================================================================")
    out.append("-- LearnPool — Production Bulk Demo Data (Comedy 101)")
    out.append("--")
    out.append("-- Generated by db/generate_bulk_demo_data.py (seed 20260817) — do not hand-edit,")
    out.append("-- regenerate instead. Adds 23 students (~30 total on the roster) and gives each")
    out.append("-- of the 30 between 0 and 7 questions, grounded in the real course PDF chunks.")
    out.append("-- Also backfills answer_feedback for the 6 hand-authored threads from")
    out.append("-- seed_demo_prod_comedy101.sql, since Answer Quality Breakdown reads consensus")
    out.append("-- from answer_feedback, not thread_feedback.")
    out.append("-- =============================================================================")
    out.append("")
    out.append("BEGIN;")
    out.append("")

    # ---- Backfill answer_feedback for the 6 existing hand-authored threads ----
    out.append("-- Backfill answer_feedback to match the thread_feedback already seeded")
    out.append("-- (mirrors seed_demo_prod_comedy101.sql's thread_feedback exactly)")
    backfill = [
        ("c2000000-0000-0000-0000-000000000001", "a1000000-0000-0000-0000-000000000002", "up"),
        ("c2000000-0000-0000-0000-000000000001", "a1000000-0000-0000-0000-000000000003", "up"),
        ("c2000000-0000-0000-0000-000000000001", MANAN_ID, "up"),
        ("c2000000-0000-0000-0000-000000000002", "a1000000-0000-0000-0000-000000000005", "up"),
        ("c2000000-0000-0000-0000-000000000002", "a1000000-0000-0000-0000-000000000003", "down"),
        ("c2000000-0000-0000-0000-000000000002", "a1000000-0000-0000-0000-000000000006", "down"),
        ("c2000000-0000-0000-0000-000000000003", "a1000000-0000-0000-0000-000000000004", "up"),
        ("c2000000-0000-0000-0000-000000000003", "a1000000-0000-0000-0000-000000000006", "up"),
        ("c2000000-0000-0000-0000-000000000004", MANAN_ID, "up"),
        ("c2000000-0000-0000-0000-000000000004", "a1000000-0000-0000-0000-000000000001", "up"),
        ("c2000000-0000-0000-0000-000000000005", MANAN_ID, "up"),
        ("c2000000-0000-0000-0000-000000000005", "a1000000-0000-0000-0000-000000000002", "up"),
        ("c2000000-0000-0000-0000-000000000005", "a1000000-0000-0000-0000-000000000003", "up"),
        ("c2000000-0000-0000-0000-000000000006", "a1000000-0000-0000-0000-000000000006", "up"),
        ("c2000000-0000-0000-0000-000000000006", "a1000000-0000-0000-0000-000000000004", "up"),
    ]
    out.append("DELETE FROM answer_feedback WHERE answer_id IN (%s);" % ", ".join(
        f"'{a}'" for a in sorted(set(a for a, _, _ in backfill))))
    out.append("INSERT INTO answer_feedback (answer_id, student_id, feedback) VALUES")
    out.append(",\n".join(f"    ('{a}', '{s}', '{f}')" for a, s, f in backfill) + ";")
    out.append("")

    # ---- New students ----
    out.append("-- New students (23) — bring the roster to ~30")
    out.append("INSERT INTO users (id, email, password_hash, display_name, role) VALUES")
    rows = []
    for uid, name, email in NEW_STUDENTS:
        rows.append(f"    ('{uid}', '{email}', crypt('devpassword', gen_salt('bf', 12)), '{sql_escape(name)}', 'student')")
    out.append(",\n".join(rows) + "\nON CONFLICT (id) DO NOTHING;")
    out.append("")

    out.append("INSERT INTO course_enrollments (course_id, student_id) VALUES")
    rows = [f"    ('{COURSE_ID}', '{uid}')" for uid, _, _ in NEW_STUDENTS]
    out.append(",\n".join(rows) + "\nON CONFLICT DO NOTHING;")
    out.append("")

    # ---- Generate questions/threads ----
    q_idx = 0
    thread_rows, question_rows, answer_rows, citation_rows = [], [], [], []
    feedback_rows, thread_feedback_rows, comment_rows = [], [], []
    fork_updates = []

    threads_by_id = []  # (thread_id, student_id) for fork selection

    for uid, name in ALL_STUDENTS:
        n_questions = random.randint(0, 7)
        for _ in range(n_questions):
            q_idx += 1
            chunk_n, category, qtext, atext = random.choice(TEMPLATES)
            tid = f"f3000000-0000-0000-0000-{q_idx:012d}"
            qid = f"f1000000-0000-0000-0000-{q_idx:012d}"
            aid = f"f2000000-0000-0000-0000-{q_idx:012d}"
            asked_offset_sec = random.randint(0, 3400)
            title = qtext if len(qtext) <= 70 else qtext[:67] + "..."

            thread_rows.append(
                f"    ('{tid}', '{SESSION_ID}', '{uid}', '{sql_escape(title)}', true, "
                f"'2026-05-20 17:06:55+00'::timestamptz + interval '{asked_offset_sec} seconds', true)"
            )
            question_rows.append(
                f"    ('{qid}', '{SESSION_ID}', '{uid}', '{sql_escape(qtext)}', false, '{category}', 0, "
                f"'{tid}', 1, '2026-05-20 17:06:55+00'::timestamptz + interval '{asked_offset_sec} seconds')"
            )
            answer_rows.append(
                f"    ('{aid}', '{qid}', '{sql_escape(atext)}', 'gpt-4o', {random.randint(950, 1450)})"
            )
            relevance = round(random.uniform(0.82, 0.97), 2)
            citation_rows.append(
                f"    ('f4000000-0000-0000-0000-{q_idx:012d}', '{aid}', '{chunk_uuid(chunk_n)}', {relevance}, 1)"
            )
            threads_by_id.append((tid, uid, qid, chunk_n))

            # Votes — skewed positive, occasional mixed/flagged thread
            roll = random.random()
            if roll < 0.20:
                n_votes = 0
            else:
                n_votes = random.randint(1, 6)
            if n_votes > 0:
                outcome_roll = random.random()
                if outcome_roll < 0.72:
                    n_up = n_votes
                    n_down = 0
                elif outcome_roll < 0.90:
                    n_up = max(1, n_votes - random.randint(1, 2))
                    n_down = n_votes - n_up
                else:
                    n_down = max(1, n_votes - random.randint(0, 1))
                    n_up = n_votes - n_down
                voters = random.sample([s for s, _ in ALL_STUDENTS if s != uid], min(n_votes, len(ALL_STUDENTS) - 1))
                for i, voter in enumerate(voters):
                    fb = "up" if i < n_up else "down"
                    feedback_rows.append(f"    ('{aid}', '{voter}', '{fb}')")
                    thread_feedback_rows.append(f"    ('{tid}', '{voter}', '{fb}')")

            # Sparse comments
            if random.random() < 0.15:
                commenter = random.choice([PROF_ID] + [s for s, _ in ALL_STUDENTS if s != uid])
                comment_text = random.choice([
                    "This is a great example — I'll probably reference it in class.",
                    "Same thing tripped me up until I reread that section.",
                    "Worth double-checking this against the page cited, the summary simplifies it a bit.",
                    "This helped me rework a bit I've been stuck on.",
                    "Good question — came up in office hours too.",
                ])
                comment_rows.append(f"    ('{tid}', '{commenter}', '{sql_escape(comment_text)}')")

    out.append(f"-- {q_idx} questions generated across {len(ALL_STUDENTS)} students")
    out.append("")

    out.append("INSERT INTO threads (id, session_id, student_id, title, shared, shared_at, include_questions) VALUES")
    out.append(",\n".join(thread_rows) + ";")
    out.append("")

    out.append("INSERT INTO questions (id, session_id, student_id, content, anonymous, category, fork_count, thread_id, thread_sequence, asked_at) VALUES")
    out.append(",\n".join(question_rows) + ";")
    out.append("")

    out.append("INSERT INTO answers (id, question_id, content, model_used, generation_latency_ms) VALUES")
    out.append(",\n".join(answer_rows) + ";")
    out.append("")

    out.append("INSERT INTO answer_citations (id, answer_id, chunk_id, relevance_score, citation_order) VALUES")
    out.append(",\n".join(citation_rows) + ";")
    out.append("")

    if feedback_rows:
        out.append("INSERT INTO answer_feedback (answer_id, student_id, feedback) VALUES")
        out.append(",\n".join(feedback_rows) + "\nON CONFLICT (answer_id, student_id) DO NOTHING;")
        out.append("")

    if thread_feedback_rows:
        out.append("INSERT INTO thread_feedback (thread_id, user_id, feedback) VALUES")
        out.append(",\n".join(thread_feedback_rows) + "\nON CONFLICT (thread_id, user_id) DO NOTHING;")
        out.append("")

    if comment_rows:
        out.append("INSERT INTO thread_comments (thread_id, user_id, content) VALUES")
        out.append(",\n".join(comment_rows) + ";")
        out.append("")

    # ---- A handful of forks among the new threads ----
    FOLLOWUPS = [
        "Can you go a bit deeper on this — what does it look like applied to my own set?",
        "Building on this — is there a version of this rule that bends for a shorter set?",
        "Related to this: how do I know when I'm doing this well versus just guessing?",
        "This clicked for me too — what's the most common way beginners get this wrong?",
        "Following up on this one — does this change for a bigger room vs. an open mic?",
    ]
    if len(threads_by_id) >= 6:
        fork_sources = random.sample(threads_by_id, 5)
        for i, (src_tid, src_uid, src_qid, chunk_n) in enumerate(fork_sources):
            forker = random.choice([s for s, _ in ALL_STUDENTS if s != src_uid])
            q_idx += 1
            new_tid = f"f3000000-0000-0000-0000-{q_idx:012d}"
            new_qid = f"f1000000-0000-0000-0000-{q_idx:012d}"
            new_aid = f"f2000000-0000-0000-0000-{q_idx:012d}"
            followup = FOLLOWUPS[i % len(FOLLOWUPS)]
            asked_offset_sec = random.randint(0, 3400)
            out.append(f"-- Fork of thread {src_tid}")
            out.append(
                f"INSERT INTO threads (id, session_id, student_id, title, shared, shared_at, include_questions, forked_from) "
                f"VALUES ('{new_tid}', '{SESSION_ID}', '{forker}', 'Following up on a classmate''s question', "
                f"true, '2026-05-20 17:06:55+00'::timestamptz + interval '{asked_offset_sec} seconds', true, '{src_tid}');"
            )
            out.append(
                f"INSERT INTO questions (id, session_id, student_id, content, anonymous, category, fork_count, thread_id, thread_sequence, forked_from, asked_at) "
                f"VALUES ('{new_qid}', '{SESSION_ID}', '{forker}', "
                f"'[Forked from a classmate''s question]\n\n{sql_escape(followup)}', false, 'Doubts', 0, "
                f"'{new_tid}', 1, '{src_qid}', "
                f"'2026-05-20 17:06:55+00'::timestamptz + interval '{asked_offset_sec} seconds');"
            )
            out.append(
                f"INSERT INTO answers (id, question_id, content, model_used, generation_latency_ms) VALUES "
                f"('{new_aid}', '{new_qid}', "
                f"'Building on the earlier thread: the same principle applies, but scale your expectations to the room and the set length — what works in a 20-minute set often needs to be compressed or cut entirely in a 5-minute one. Try it on stage in a low-stakes room first and adjust based on what actually gets a reaction, not what you expect to.', "
                f"'gpt-4o', {random.randint(950, 1450)});"
            )
            out.append(
                f"INSERT INTO answer_citations (id, answer_id, chunk_id, relevance_score, citation_order) VALUES "
                f"('f4000000-0000-0000-0000-{q_idx:012d}', '{new_aid}', '{chunk_uuid(chunk_n)}', {round(random.uniform(0.8, 0.95), 2)}, 1);"
            )
            out.append(f"UPDATE threads SET fork_count = fork_count + 1 WHERE id = '{src_tid}';")
            out.append("")

    out.append("COMMIT;")
    print("\n".join(out))


if __name__ == "__main__":
    main()
