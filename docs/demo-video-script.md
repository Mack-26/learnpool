# LearnPool ("Horizon") Demo Video — Script & Shot List

**Length:** 2–3 min · **Audience:** customers (students/institutions) — investor-safe, no separate cut
**Thesis:** AI made learning solitary. Horizon makes it social again — the whole class, and the AI, thinking out loud together.
**Course used:** Comedy 101 (production), logged in as `aromanan@umich.edu`

---

## Beat 1 — Hook (0:00–0:15)
**Screen:** Generic AI chat UI (or LandingPage's "8 private conversations, 0 shared" panel), mocked as a lone student typing.
**VO:**
> "Every student in this class is asking AI the same questions right now. Alone. In private tabs nobody else will ever see."

## Beat 2 — Turn (0:15–0:25)
**Screen:** Cut to LearnPool login → Comedy 101 class card.
**VO:**
> "Horizon puts those questions back in the room."

## Beat 3 — Ask + Answer (0:25–0:55)
**Screen:** ChatPage, live session. Ask a real question about the course material — e.g. joke structure (setup/punchline/tag).
**VO:**
> "Ask anything about today's lecture. The answer comes straight from your TA's own materials — cited, page and all — not the open internet."
**Action:** Show citation chip, click through to the cited page.

## Beat 4 — Classmates verify it (0:55–1:25)
**Screen:** Navigate to the session Report/Feed. Open **"Why does the Rule of Three beat a 4th item?"**
**VO:**
> "But you're not the only one who asked. Three classmates already saw this answer — and confirmed it."
**Action:** Point at the **Answer Quality Breakdown** diverging bar (green, all agreement). Then scroll to the flagged thread:
> "And when the AI oversimplifies — like this answer on punching down — the class catches it too."
**Action:** Show **"Is punching down ever okay if it's self-deprecating?"** — mixed green/red bar (1 up, 2 down), and Jake's comment calling out the oversimplification. This is the money shot: **AI answers get verified by real people, not just trusted blindly.**

## Beat 5 — Learn how others are learning (1:25–1:55)
**Screen:** Same feed — scroll to **"How long should I wait before a callback?"** and its fork, **"Ideal callback distance for a 5-minute set?"**
**VO:**
> "See a question close to yours? Fork it. Build on what a classmate already asked, instead of starting over."
**Action:** Click the fork badge, show the linked thread. Then pan to the Citation Map card:
> "Every answer traces back to the exact page it came from — so 'the AI said so' is never the end of the story."

## Beat 6 — Zoom out (1:55–2:20)
**Screen:** Category chart (now visible to students too).
**VO:**
> "Zoom out, and you can see what the whole class is stuck on take shape — not just your own questions."
**Action:** Click a category bar to filter and show the class's question spread across Doubts / Homework / Exam Prep / Summaries.

## Beat 7 — Close (2:20–2:30)
**Screen:** Clean class card / logo end screen.
**VO:**
> "AI didn't have to make studying lonely. Horizon puts the class back in class."

**On-screen text:** *Horizon — learn out loud.*

---

## Shot checklist (record in this order for clean cuts)

| # | Screen | Notes |
|---|---|---|
| 1 | Login as `aromanan@umich.edu` → Comedy 101 class card | Keep short, 3–4 sec |
| 2 | ChatPage: ask a live question about joke structure, get cited answer | Let the citation animate in fully |
| 3 | Report/Feed: "Why does the Rule of Three beat a 4th item?" (3/3 agreement) | Answer Quality Breakdown bar fully green |
| 4 | Report/Feed: "Is punching down ever okay if it's self-deprecating?" (1 up / 2 down) | Scroll slowly, let the red show + Jake's flag comment |
| 5 | Report/Feed: "How long before a callback?" → fork → "Ideal callback distance for a 5-min set?" | Click the fork link live |
| 6 | Citation Map card — The Big Book of Comedy and Joke Writing | Hover a page bar, now ordered p.3 → p.45 |
| 7 | Category bar chart — click filter | |
| 8 | End card | |

## Before recording

1. Data is already live in production — Comedy 101, session "Lecture 20/05/2026," released, 6 threads seeded.
2. Log in as `aromanan@umich.edu` on horizonlabs.live for the student-side shots.
3. Confirm Answer Quality Breakdown renders on the Report page before recording.
4. For a local/offline rehearsal instead, use `make db-up && make db-seed` + `db/seed_demo_threads.sql` — that's ML-themed placeholder data, not what's described above.
