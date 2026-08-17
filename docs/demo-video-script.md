# LearnPool ("Horizon") Demo Video — Script & Shot List

**Length:** 2–3 min · **Audience:** customers (students/institutions) — investor-safe, no separate cut
**Thesis:** AI made learning solitary. Horizon makes it social again — the whole class, and the AI, thinking out loud together.

---

## Beat 1 — Hook (0:00–0:15)
**Screen:** Generic AI chat UI (or LandingPage's "8 private conversations, 0 shared" panel), mocked as a lone student typing.
**VO:**
> "Every student in this class is asking AI the same questions right now. Alone. In private tabs nobody else will ever see."

## Beat 2 — Turn (0:15–0:25)
**Screen:** Cut to LearnPool login → class card.
**VO:**
> "Horizon puts those questions back in the room."

## Beat 3 — Ask + Answer (0:25–0:55)
**Screen:** ChatPage, live session. Type a real lecture question (use the MSE/cost-function question — it has the richest downstream data).
**VO:**
> "Ask anything about today's lecture. The answer comes straight from your TA's own materials — cited, page and all — not the open internet."
**Action:** Show citation chip, click through to the cited page.

## Beat 4 — Classmates verify it (0:55–1:25)
**Screen:** Navigate to the session Report/Feed. Open the "Why do we square the errors in MSE?" thread.
**VO:**
> "But you're not the only one who asked. Three classmates already saw this answer — and confirmed it."
**Action:** Point at the **Answer Quality Breakdown** diverging bar (green, all agreement). Then scroll to the flagged thread:
> "And when the AI gets something wrong — like this gradient descent answer — the class catches it too."
**Action:** Show the "Gradient descent kept diverging on me" thread — mixed green/red bar, the classmate comment flagging it. This is the money shot: **AI answers get verified by real people, not just trusted blindly.**

## Beat 5 — Learn how others are learning (1:25–1:55)
**Screen:** Same feed — scroll to "How do I calculate R²?" and its fork, "Adjusted R² — when should I use it?"
**VO:**
> "See a question close to yours? Fork it. Build on what a classmate already asked, instead of starting over."
**Action:** Click the fork badge, show the linked thread. Then pan to the Citation Map card:
> "Every answer traces back to the exact page it came from — so 'the AI said so' is never the end of the story."

## Beat 6 — Zoom out (1:55–2:20)
**Screen:** Category chart + Question Timeline (now visible to students too).
**VO:**
> "Zoom out, and you can see the whole class's confusion take shape in real time — what everyone's stuck on, and when."
**Action:** Click a category bar to filter; show the timeline spike during a hard concept.

## Beat 7 — Close (2:20–2:30)
**Screen:** Clean class card / logo end screen.
**VO:**
> "AI didn't have to make studying lonely. Horizon puts the class back in class."

**On-screen text:** *Horizon — learn out loud.*

---

## Shot checklist (record in this order for clean cuts)

| # | Screen | Notes |
|---|---|---|
| 1 | Login → class card | Keep short, 3–4 sec |
| 2 | ChatPage: ask MSE question, get cited answer | Let the citation animate in fully |
| 3 | Report/Feed: hero thread (3/3 agreement) | AnswerQualityBreakdown bar fully green |
| 4 | Report/Feed: flagged thread (1 up / 2 down) | Scroll slowly, let the red show |
| 5 | Report/Feed: R² thread → fork → forked thread | Click the fork link live |
| 6 | Citation Map card | Hover a page bar |
| 7 | Category bar chart — click filter | |
| 8 | Question Timeline | |
| 9 | End card | |

## Before recording

1. `make db-up && make db-seed`
2. Apply `db/seed_demo_threads.sql` (see file header for the exact command)
3. Log in as `alice@example.com` / `devpassword` for the student-side shots
4. Confirm the two newly-shared components (Answer Quality Breakdown, Question Timeline) render for the student role in the Report page before recording
