# Horizon design — landing page, product screens & app UX

Source: the "Horizon Landing Page" design canvas (https://claude.ai/artifact/8r2WnqAw1kRfM8yTdZs7QP).
The `*.html` files here are the artboards, exported verbatim. They are 1440px-wide (390 for
mobile) inline-styled static HTML: **treat them as a spec, not code to paste.** Build with
Tailwind classes and the CSS variables in `frontend/src/index.css`, keep React Query and the
existing API calls unchanged, and don't invent API fields.

## Artboards → files

| Artboard | Frame | Implements |
|---|---|---|
| `Main.html` | Landing — desktop 1440 | `pages/LandingPage.tsx` |
| `Mobile.html` | Landing — mobile 390 | same file, responsive |
| `Product-Prep.html`, `Product-Space.html` | Product screenshots used *inside* the landing page (hero demo, private space) | content for `LandingPage.tsx` |
| `Product-Group.html`, `Product-Fork.html` | University-course variants (for the deck, not the site) | reference only |
| `App-Home.html` | Course home & lecture cards | `pages/SessionListPage.tsx`, `components/SessionCard.tsx`, `ClassCard.tsx` |
| `App-Student.html` | Student dashboard ("your week") | `pages/StudentDashboardPage.tsx` (new) |
| `App-Lecture.html` | Lecture Q&A | `pages/ChatPage.tsx`, `MessageBubble.tsx`, `CitationCard.tsx`, `QuestionInput.tsx`, `MessageList.tsx` |
| `App-States.html` | The four moments of asking (empty / answering / low-confidence / saved) | states inside `ChatPage.tsx` |
| `App-Mobile.html` | Asking on a phone (390) | `ChatPage.tsx` responsive |
| `App-Prof.html` | Professor dashboard | `pages/ProfessorReportsPage.tsx`, `CategoryBarChart.tsx`, `CitationMapCard.tsx`, `AnswerQualityBreakdown.tsx`, `StudentActivityTable.tsx` |

## Tokens (canvas note "tokens")

Palette — page `#FAF9F6`, band `#F3F1EA`, text `#191816` / `#56534C` / `#6F6B63`, hairline
`#E8E4DA`, accent `#1C4A3C`, AI surface `#F5F8F6` (border `#DCE8E1`, text `#24302B`, meta
`#4A7263`), material chip `#F5F1E7`, dark band `#1A1A17`.

Type — Instrument Sans throughout, 400/500/600. Section heads 48–50px at −0.03em; the problem
statement 58px at −0.034em with its second line in `#8A857C`. System mono for formulas, page
refs and eyebrows. **No serif.**

Copy rules — one idea per section, headlines 3–8 words, support 1–2 sentences, never describe
what the screenshot already shows, no subject or course name in the hero copy, "AI" once on
the page.

Demo content — the UI chrome stays generic (group name + members / questions / materials); the
subject is only ever content inside it. GRE Quant Prep in the hero and product section, Biology
101 in the people section, Python Fundamentals in the private-space section. Sections: Hero,
Problem, Product, People, Your own space, CTA — no separate how-it-works beat; the source card
inside Product carries the grounding proof. People: Sarah Mehta, David Okonkwo, Mei-Lin Chen,
Jonas Weber, Amara Boateng, Tyler Brooks.

Motion — reveal-on-scroll (16px rise, 850ms ease-out) for hero and section heads only; hover on
buttons, rows and chips; no parallax, no floating shapes. Reduced-motion disables reveals.

## App UX rules (canvas note "appux")

1. One card system. Status is a chip, never a repainted card — the live lecture differs by one
   tinted surface and one primary button, nothing else.
2. Every lecture card answers four questions: what it is, when, is it open, and what changed
   since you last looked ("3 new").
3. One primary action per card. "Ask a question" on the live lecture; plain "open" elsewhere.
4. Sources are open by default. The first passage, its page and its match sit under the answer;
   the rest are one click.
5. Scope and audience are visible at the moment of asking: which materials will be used, and
   whether the class sees it. Never buried in settings.
6. Honest empty and low-confidence states. If nothing in the materials matches, Horizon says so
   and hands the question to the class.
7. Phone first for asking: 44px targets, one-thumb composer, sources inline rather than behind
   a toggle.
8. Dashboards answer "what do I do next", not "how am I doing". The student board leads with
   unfinished work; the professor board leads with the five answers students pushed back on.
9. No student-facing score. Participation numbers are the professor's view; the student sees
   their own questions, notes and replies.

## Chart system (canvas note "charts")

Categorical, fixed order: `#0F8A60` · `#C05B2B` · `#3E6FB0` · `#A8862A`. Only slot 1 is used so
far: single-series bars are one hue, never a ramp over nominal categories.

Sequential (citation heat), light → dark: `#7FBCA3` · `#5AAA8B` · `#36996F` · `#1C7A57` ·
`#0B5A3E`, with `#F1EFE8` for "not cited".

Status, reserved, never reused as a series: good `#0F7A52` · warning mark `#B5741C` (text
`#8F5A12`) · critical `#A33327`, each shipped with an icon and a label.

Marks — 9px bars, 4px rounded data-ends anchored to the baseline, 2px surface gaps, recessive
`#EDE9E0` grid, direct labels only where they carry the story, hover tooltip on every mark, a
Table toggle on each chart. One axis per chart — never two scales on one plot.

All of the above are exposed as CSS variables in `frontend/src/index.css` (`--chart-1…4`,
`--seq-1…5`, `--seq-none`, `--status-*`, `--grid`).

## Needs backend work (scope separately)

- Low-confidence state → a similarity floor in `rag_service.py` (scores exist; nothing acts on them).
- "Since you were here" / "3 new" badges → per-user last-seen timestamp.
- "You haven't opened it" → material-open tracking.
- Professor "post a correction" → a write path that supersedes an answer.
