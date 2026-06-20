# Landing Page Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the landing page copy and add a benefits section so the product's value is clear within 10 seconds of landing on the page.

**Architecture:** All changes are in a single file (`frontend/src/pages/LandingPage.tsx`). A new `BenefitsSection` component is added inline in that file following the existing component-per-section pattern. No new files, no new dependencies.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, inline styles (existing pattern)

## Global Constraints

- All styling uses inline `style` props or Tailwind classes — no new CSS files or CSS modules.
- Font families: `'Instrument Serif', serif` for headlines, `'DM Mono', monospace` for labels/mono, `'Inter', sans-serif` for body.
- Color tokens in use: `#f5f3ff` (primary text), `rgba(245,243,255,0.45)` (faded headline), `#b6b1d9` (body text), `rgba(182,177,217,0.42)` (dim label), `#7c83f5` (student/indigo), `#f5a623` (instructor/amber).
- Scroll reveal uses the existing `useReveal` hook — do not add a new one.
- No new npm packages.

---

### Task 1: Rewrite hero headline and subtext, remove CyclingWord usage

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx` (hero section ~lines 654–665)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: updated hero copy; `CyclingWord` component remains defined in the file but is no longer used in JSX (leave the definition in place — removing it is out of scope)

- [ ] **Step 1: Replace the h1 headline**

Find this block (around line 654):
```tsx
<h1 className="mb-5 leading-[1.08] tracking-tight"
  style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)", fontWeight: 400, color: "#f5f3ff" }}>
  The questions didn't stop.
  <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>They just went private.</span>
</h1>
```

Replace with:
```tsx
<h1 className="mb-5 leading-[1.08] tracking-tight"
  style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)", fontWeight: 400, color: "#f5f3ff" }}>
  Students already learn with AI.
  <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>Horizon makes that learning visible.</span>
</h1>
```

- [ ] **Step 2: Replace the subtext paragraphs**

Find this block (around line 659):
```tsx
<p className="text-base leading-relaxed mb-4" style={{ color: "#b6b1d9", maxWidth: "42ch" }}>
  Students are using AI{" "}
  <CyclingWord words={["constantly", "privately", "invisibly"]} />
  <br />
  The questions are still there. The curiosity is still there. But the classroom can't see any of it.
</p>
<p className="text-base leading-relaxed mb-8" style={{ color: "#b6b1d9", maxWidth: "42ch" }}></p>
```

Replace with:
```tsx
<p className="text-base leading-relaxed mb-8" style={{ color: "#b6b1d9", maxWidth: "42ch" }}>
  Students are asking ChatGPT questions anyway. Horizon turns those private conversations into shared learning, giving instructors insight into what their class actually struggles with.
</p>
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Visual verify**

```bash
cd frontend && npm run dev
```

Open http://localhost:5173. Confirm:
- New headline renders in two lines with second line faded
- Subtext is a single plain paragraph, no animated word
- CTA button is still present and links to /signup

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx
git commit -m "feat: rewrite hero headline and subtext"
```

---

### Task 2: Add state description labels above the viz toggle button

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx` (viz card bottom section ~lines 699–713)

**Interfaces:**
- Consumes: `vizActive` boolean (already in scope in `LandingPage`)
- Produces: a `<p>` above the toggle button that shows what the current viz state means

- [ ] **Step 1: Add the state label above the toggle button**

Find this block (around line 699):
```tsx
<div className="px-5 pb-5">
  <button onClick={() => { setVizActive(prev => !prev); resetVizTimer(); }}
```

Replace with:
```tsx
<div className="px-5 pb-5">
  <p style={{
    fontFamily: "'DM Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.05em",
    color: "rgba(182,177,217,0.45)",
    textAlign: "center",
    marginBottom: "0.75rem",
    transition: "opacity 0.4s ease",
  }}>
    {vizActive
      ? "3 question clusters identified · professor has full context"
      : "8 private AI conversations · 0 shared · professor sees nothing"}
  </p>
  <button onClick={() => { setVizActive(prev => !prev); resetVizTimer(); }}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Visual verify**

Open http://localhost:5173. Confirm:
- Above the toggle button, the correct descriptive line appears for each state
- The text updates when the visualization auto-cycles or is manually toggled

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx
git commit -m "feat: add viz state labels above toggle button"
```

---

### Task 3: Rewrite InsightSection headline and remove subtext paragraph

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx` (InsightSection component ~lines 436–458)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: shortened headline array (2 items instead of 4); subtext paragraph removed

- [ ] **Step 1: Replace the headline lines array**

Find this block inside `InsightSection` (around line 436):
```tsx
{[
  { text: "AI Didn't Reduce", delay: 80, bright: true },
  { text: "Student Questions.", delay: 200, bright: true },
  { text: "It Changed Who Gets", delay: 330, bright: false },
  { text: "To See Them.", delay: 450, bright: false },
].map(({ text, delay, bright }) => (
  <div key={text} style={slideLeft(delay)}>
    <span style={{
      display: "block",
      fontFamily: "'Instrument Serif', serif",
      fontSize: "clamp(2rem, 4.2vw, 3.4rem)",
      fontWeight: 400,
      lineHeight: 1.12,
      color: bright ? "#f5f3ff" : "rgba(245,243,255,0.38)",
    }}>{text}</span>
  </div>
))}
```

Replace with:
```tsx
{[
  { text: "Here's how big", delay: 80, bright: true },
  { text: "the gap actually is.", delay: 200, bright: false },
].map(({ text, delay, bright }) => (
  <div key={text} style={slideLeft(delay)}>
    <span style={{
      display: "block",
      fontFamily: "'Instrument Serif', serif",
      fontSize: "clamp(2rem, 4.2vw, 3.4rem)",
      fontWeight: 400,
      lineHeight: 1.12,
      color: bright ? "#f5f3ff" : "rgba(245,243,255,0.38)",
    }}>{text}</span>
  </div>
))}
```

- [ ] **Step 2: Remove the subtext paragraph**

Find and delete this block (around line 456):
```tsx
<div className="space-y-3" style={fade(600)}>
  <p style={{ fontSize: "15px", color: "rgba(182,177,217,0.52)", lineHeight: 1.78, maxWidth: "44ch" }}>Horizon makes AI-assisted learning visible and collective. giving professors insight into what their class is actually struggling with, without monitoring private conversations or adding overhead.</p>
</div>
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Visual verify**

Open http://localhost:5173, scroll to the InsightSection. Confirm:
- Headline reads "Here's how big / the gap actually is." with second line faded
- No subtext paragraph below the headline
- 90% counter, bars, and Harvard citation are all still present and animating

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx
git commit -m "feat: rewrite InsightSection headline, remove subtext"
```

---

### Task 4: Add BenefitsSection component

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx` — add `BenefitsSection` component definition before `LandingPage`, and render it in `LandingPage`

**Interfaces:**
- Consumes: `useReveal` hook (already defined in this file)
- Produces: `BenefitsSection` — a React component with no props, rendered between `<InsightSection />` and the CTA `<section>` in `LandingPage`

- [ ] **Step 1: Add the BenefitsSection component**

Insert the following component definition immediately before the `// ── Main page ──` comment (around line 601):

```tsx
// ── Section: What Horizon Does ────────────────────────────────────────────────
function BenefitsSection() {
  const { ref, on } = useReveal(0.08);

  const fade = (d: number): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${d}ms, transform 0.7s ease ${d}ms`,
  });

  const studentBullets = [
    "Get AI answers grounded in your actual course materials",
    "See how classmates are thinking about the same problems",
    "Know you're not the only one when something doesn't click",
  ];

  const instructorBullets = [
    "Know where students are stuck before exams reveal it",
    "See the questions students ask AI but never raise in class",
    "Understand which concepts need more time before moving on",
  ];

  return (
    <section ref={ref} className="py-20 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
      <div className="max-w-6xl mx-auto">
        <p style={{ ...fade(0), fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "rgba(182,177,217,0.42)", marginBottom: "2.5rem" }}>
          WHAT HORIZON DOES
        </p>
        <div className="rounded-2xl p-10 md:p-14"
          style={{ ...fade(80), background: "rgba(14,12,38,0.8)", border: "1px solid rgba(182,177,217,0.09)" }}>
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#7c83f5", marginBottom: "1.75rem" }}>
                FOR STUDENTS
              </p>
              <div className="space-y-4">
                {studentBullets.map((text, i) => (
                  <div key={text} className="flex items-start gap-3"
                    style={{ opacity: on ? 1 : 0, transition: `opacity 0.6s ease ${200 + i * 80}ms` }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#7c83f5", flexShrink: 0, marginTop: "6px" }} />
                    <span style={{ fontSize: "14px", color: "#f5f3ff", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#f5a623", marginBottom: "1.75rem" }}>
                FOR INSTRUCTORS
              </p>
              <div className="space-y-4">
                {instructorBullets.map((text, i) => (
                  <div key={text} className="flex items-start gap-3"
                    style={{ opacity: on ? 1 : 0, transition: `opacity 0.6s ease ${200 + i * 80}ms` }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f5a623", flexShrink: 0, marginTop: "6px" }} />
                    <span style={{ fontSize: "14px", color: "#f5f3ff", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Render BenefitsSection in LandingPage**

Find this block in `LandingPage` (around line 719):
```tsx
{/* ── SECTION 3: AI DIDN'T REDUCE QUESTIONS ── */}
<InsightSection />

{/* ── SOLUTION + CTA ── */}
```

Replace with:
```tsx
{/* ── SECTION 3: AI DIDN'T REDUCE QUESTIONS ── */}
<InsightSection />

{/* ── SECTION 4: WHAT HORIZON DOES ── */}
<BenefitsSection />

{/* ── SOLUTION + CTA ── */}
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Visual verify**

Open http://localhost:5173, scroll past InsightSection. Confirm:
- "WHAT HORIZON DOES" eyebrow label appears
- Dark card with two columns renders
- "FOR STUDENTS" column (indigo dots) and "FOR INSTRUCTORS" column (amber dots) both visible
- Bullets fade in on scroll
- Section appears before the CTA

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx
git commit -m "feat: add BenefitsSection with student and instructor outcomes"
```

---

### Task 5: Rewrite CTA section

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx` (CTA section ~lines 722–759)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: updated CTA headline; two paragraphs removed; button and sign-in line unchanged

- [ ] **Step 1: Replace the CTA section content**

Find this block (around line 722):
```tsx
{/* ── SOLUTION + CTA ── */}
<section className="py-16 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
  <div className="max-w-xl mx-auto text-center">

    <h2 className="mb-4 leading-snug"
      style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 400, color: "#f5f3ff", lineHeight: 1.15 }}>
      Horizon Restores Visibility
      <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>Into AI-Assisted Learning.</span>
    </h2>

    <p className="mb-5 text-[15px] leading-relaxed" style={{ color: "#b6b1d9" }}>
      Students will keep learning with AI. Horizon makes that learning visible — to professors, and to the class.
    </p>

    <p className="mb-8" style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1rem, 1.8vw, 1.2rem)", color: "#f5f3ff", lineHeight: 1.5 }}>
      Whether you're a student or an educator —<br />see how Horizon works for your role.
    </p>

    <Link to="/signup"
```

Replace with:
```tsx
{/* ── SOLUTION + CTA ── */}
<section className="py-16 px-6" style={{ borderTop: "1px solid rgba(182,177,217,0.08)" }}>
  <div className="max-w-xl mx-auto text-center">

    <h2 className="mb-8 leading-snug"
      style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 400, color: "#f5f3ff", lineHeight: 1.15 }}>
      Learning is already happening with AI.
      <br /><span style={{ color: "rgba(245,243,255,0.45)" }}>Make sure it happens together.</span>
    </h2>

    <Link to="/signup"
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Visual verify**

Scroll to the bottom of http://localhost:5173. Confirm:
- New two-line headline renders with second line faded
- No subtext paragraphs between headline and button
- "Get started here" button present and links to /signup
- "Already have an account? Sign in" line still present

- [ ] **Step 4: Final full-page check**

Scroll the full page top to bottom and confirm the story flows:
1. Hero: "Students already learn with AI. Horizon makes that learning visible."
2. InsightSection: "Here's how big the gap actually is." + 90% stat + bars
3. BenefitsSection: "WHAT HORIZON DOES" + two-column outcomes
4. CTA: "Learning is already happening with AI. Make sure it happens together."

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LandingPage.tsx
git commit -m "feat: rewrite CTA section headline, remove abstract subtext"
```
