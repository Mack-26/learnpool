# Landing Page Rewrite — Design Spec
_2026-06-20_

## Problem

The landing page design is strong but the copy prioritizes poetry over clarity. The hero headline ("The questions didn't stop. They just went private.") is ambiguous — a first-time visitor doesn't know what questions, where, or what the product does until halfway down the page. The word "visibility" is abstract and nobody buys it. There is no section explaining what Horizon actually does per role.

## Scope

Copy and one new section only. No layout changes, no new components beyond the benefits card. The classroom visualization stays as-is; only its surrounding framing text changes.

---

## Section-by-Section Changes

### 1. Hero

**Headline** (replaces current):
```
Students already learn with AI.
Horizon makes that learning visible.
```

**Subtext** (replaces current paragraph + cycling word animation):
```
Students are asking ChatGPT questions anyway. Horizon turns those
private conversations into shared learning, giving instructors
insight into what their class actually struggles with.
```
- Remove the `CyclingWord` component entirely — it adds motion but dilutes the message.
- The empty second `<p>` tag (line 665) is also removed.

**Visualization framing**:
- The SVG already has bottom-of-card text for each state. Surface these more prominently by adding two short state labels *above* the toggle button (inside the card's bottom `px-5 pb-5` div), visible only for the current state.
- `WITHOUT HORIZON` label: "8 private AI conversations — professor sees nothing"
- `WITH HORIZON` label: "3 question clusters identified — professor has full context"
- Toggle button copy stays as-is.

---

### 2. InsightSection

**Headline** (replaces the 4-line staggered title):
```
Here's how big the gap actually is.
```
Two-tone treatment: "Here's how big the gap" bright, "actually is." faded — matching existing pattern.

**Subtext paragraph**: removed entirely. The 90% counter, 25% stat, animated bars, and Harvard citation are self-explanatory and carry the section.

Everything else (stat display, bar animation, citation link) stays unchanged.

---

### 3. Benefits Section (new)

Inserted between `InsightSection` and the CTA section.

**Section eyebrow label**: `WHAT HORIZON DOES`

**Layout**: single rounded card (matching `InsightSection` card style — `rgba(14,12,38,0.8)` background, `rgba(182,177,217,0.09)` border), two equal columns inside.

**For Students** (left column):
- Get AI answers grounded in your actual course materials
- See how classmates are thinking about the same problems
- Know you're not the only one when something doesn't click

**For Instructors** (right column):
- Know where students are stuck before exams reveal it
- See the questions students ask AI but never raise in class
- Understand which concepts need more time before moving on

**Styling**: column headers use `DM Mono` eyebrow treatment (same as existing section labels). Bullets use the dot-style list pattern already in `VisibilityGapSection` (7px filled/unfilled circle + Inter 14px text). Student dots use `#7c83f5`, instructor dots use `#f5a623`.

Reveal on scroll using existing `useReveal` hook.

---

### 4. CTA Section

**Headline** (replaces "Horizon Restores Visibility Into AI-Assisted Learning."):
```
Learning is already happening with AI.
Make sure it happens together.
```
Two-tone: first line bright `#f5f3ff`, second line faded `rgba(245,243,255,0.45)`.

**Subtext paragraph**: removed. The headline stands on its own.

The paragraph "Whether you're a student or an educator — see how Horizon works for your role." is also removed.

Button, sign-in line, and all other markup stay unchanged.

---

## What Is Not Changing

- `VisibilityGapSection` component — not currently rendered in the page (defined but not used); leave it as-is.
- Nav, footer, background gradient, all color tokens, font choices.
- `ClassroomVisual` SVG — no changes to the visualization itself.
- `InsightSection` stat display (90% counter, 25% stat, bars, Harvard link).
- All existing `useReveal` scroll animations.
- CTA button ("Get started") and sign-in link.

---

## Files Changed

- `frontend/src/pages/LandingPage.tsx` — all changes are in this single file.
