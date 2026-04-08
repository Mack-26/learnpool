# LearnPool Design System
*Derived from Refactoring UI by Adam Wathan & Steve Schoger*

---

## Personality

LearnPool serves professors (power users) and students (everyday users). The design should feel:
- **Trustworthy and modern** — not stiff or corporate, but not playful either
- **Confident and focused** — like a well-designed academic tool (think Linear, Notion, or Coursera's clean areas)
- **Neutral sans-serif** — not a rounded/bubbly font, not an old-school serif

Color: **Warm Amber-Orange** (`hsl(30, 94%, 44%)`) — bold, energetic, memorable. Rare in EdTech which makes LearnPool stand out. Pairs with a slightly warm off-white background and warm-grey neutrals.

---

## Typography

### Font Family

**Inter** (Google Fonts — free, 9 weights, excellent legibility, tall x-height)

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Why Inter: neutral sans-serif, 9 weights available (ignore typefaces with fewer than 5), tall x-height optimized for screen readability at small sizes, used by Linear, Vercel, and most modern SaaS products.

### Type Scale (hand-crafted, px only — never em)

| Token      | Size | Usage                                      |
|------------|------|--------------------------------------------|
| `text-xs`  | 12px | Badges, captions, timestamps, metadata    |
| `text-sm`  | 14px | Secondary body, table cells, labels       |
| `text-base`| 16px | Primary body text, form inputs            |
| `text-lg`  | 18px | Section introductions, card titles        |
| `text-xl`  | 20px | Page subtitles, large labels              |
| `text-2xl` | 24px | Section headings                          |
| `text-3xl` | 30px | Page headings                             |
| `text-4xl` | 36px | Hero headings (rare)                      |
| `text-5xl` | 48px | Display only (landing/empty states)       |

**Tailwind already uses this scale** — these are the standard Tailwind class names. Stick to these; never use arbitrary values like `text-[13px]`.

### Font Weights

Only two weights are needed for most UI work:

| Weight | Value | Usage                                         |
|--------|-------|-----------------------------------------------|
| Normal | 400   | Body text, descriptions, secondary content    |
| Medium | 500   | Slightly emphasised labels, nav items         |
| Semibold | 600 | Card headings, table headers, button text    |
| Bold   | 700   | Page titles, primary headings, key numbers    |

> **Never use weight below 400 in UI** — it's too hard to read at small sizes.

### Text Colors (hierarchy via color, not just size)

| Role           | HSL                      | Tailwind Approx    | Usage                             |
|----------------|--------------------------|--------------------|-----------------------------------|
| Primary        | hsl(222, 47%, 11%)       | `gray-900`         | Headlines, titles, key data       |
| Secondary      | hsl(220, 9%, 46%)        | `gray-500`         | Subtitles, descriptions, metadata |
| Tertiary       | hsl(220, 13%, 69%)       | `gray-400`         | Placeholders, disabled text       |
| Inverse        | hsl(0, 0%, 100%)         | `white`            | Text on dark backgrounds          |

> The book's rule: use **softer color** for secondary text instead of smaller font size. A 16px gray label reads better than a 12px dark label.

### Line Length

Keep paragraph text between **45–75 characters per line**. Use `max-w-prose` (Tailwind = `65ch`) for body content. Never let reading text go full-width on large screens.

### Line Height

| Size range   | Line height |
|--------------|-------------|
| 12–14px (small) | 1.5     |
| 16–20px (body)  | 1.6     |
| 24px+ (headings)| 1.25    |

Use Tailwind: `leading-tight` (headings), `leading-normal` (body), `leading-relaxed` (long form text).

### Alignment

- Align mixed font sizes to **baseline** (`align-items: baseline`), not center
- Left-align body text; center only for short headings in cards/empty states
- Never justify text

---

## Color System

All colors defined in HSL. Define shades up front — never use CSS `lighten()`/`darken()` at runtime.

### Primary — Amber Orange

The brand color. Used for: primary buttons, active nav states, links, focus rings, key data highlights.

| Shade | HSL                    | Usage                                  |
|-------|------------------------|----------------------------------------|
| 900   | hsl(25, 90%, 18%)      | Dark amber text on light backgrounds   |
| 800   | hsl(27, 90%, 26%)      | — (`#92400e` logo color)              |
| 700   | hsl(28, 92%, 34%)      | —                                      |
| 600   | hsl(29, 93%, 39%)      | —                                      |
| **500** | **hsl(30, 94%, 44%)** | **Primary button background (base)**  |
| 400   | hsl(32, 95%, 54%)      | Hover states                           |
| 300   | hsl(34, 95%, 65%)      | —                                      |
| 200   | hsl(36, 92%, 78%)      | Borders on light backgrounds           |
| 100   | hsl(38, 90%, 92%)      | Tinted alert/info backgrounds          |

> Increase saturation as lightness moves away from 44% to keep shades vivid (Refactoring UI: "Don't let lightness kill your saturation").

### Neutrals — Warm Grey

Text, backgrounds, panels, borders, dividers. Almost everything in the UI is grey.

| Shade | HSL                     | Usage                                  |
|-------|-------------------------|----------------------------------------|
| 900   | hsl(20, 25%, 10%)       | Primary text                           |
| 800   | hsl(22, 18%, 20%)       | Secondary headings                     |
| 700   | hsl(23, 12%, 32%)       | —                                      |
| 600   | hsl(24, 10%, 45%)       | —                                      |
| 500   | hsl(25, 8%, 58%)        | Secondary text                         |
| 400   | hsl(26, 8%, 70%)        | Tertiary text, placeholders            |
| 300   | hsl(27, 10%, 82%)       | Borders, dividers                      |
| 200   | hsl(28, 12%, 90%)       | Input backgrounds, subtle borders      |
| 100   | hsl(30, 15%, 96%)       | Page backgrounds, card backgrounds     |

> **Greys should have a slight warm tint** (H 20-30) to harmonise with the amber primary rather than fighting it.

### Semantic — Success (Green)

Used for: positive trends, success states, thumbs-up feedback, "session active" indicators.

| Shade | HSL                    |
|-------|------------------------|
| 700   | hsl(152, 68%, 22%)     |
| 500   | hsl(152, 57%, 38%)     |
| 300   | hsl(152, 53%, 60%)     |
| 100   | hsl(152, 70%, 93%)     |

### Semantic — Error (Red)

Used for: destructive actions, error messages, form validation.

| Shade | HSL                    |
|-------|------------------------|
| 700   | hsl(0, 74%, 32%)       |
| 500   | hsl(0, 72%, 51%)       |
| 300   | hsl(0, 80%, 73%)       |
| 100   | hsl(0, 100%, 95%)      |

### Semantic — Warning (Amber)

Used for: processing states, document not yet embedded, caution notices.

| Shade | HSL                    |
|-------|------------------------|
| 700   | hsl(32, 81%, 32%)      |
| 500   | hsl(36, 90%, 50%)      |
| 300   | hsl(42, 95%, 68%)      |
| 100   | hsl(48, 100%, 93%)     |

### Category Accent Colors (for question categories)

Each question category gets a consistent color. Use shade 500 for icons/text, shade 100 for pill backgrounds.

| Category    | Hue | Shade 500              | Shade 100              |
|-------------|-----|------------------------|------------------------|
| Homework    | 226 | Indigo (primary)       | Indigo-100             |
| Doubts      | 280 | hsl(280, 60%, 55%)     | hsl(280, 90%, 95%)     |
| Summaries   | 175 | hsl(175, 60%, 38%)     | hsl(175, 70%, 93%)     |
| Exam Prep   | 36  | hsl(36, 90%, 50%)      | hsl(42, 100%, 93%)     |

---

## Spacing System

Base unit: **4px**. All spacing values are multiples of 4. This maps exactly to Tailwind's default spacing scale.

| Token  | px   | Tailwind    | Usage                                   |
|--------|------|-------------|-----------------------------------------|
| 1      | 4px  | `p-1`       | Icon padding, tight inline spacing      |
| 2      | 8px  | `p-2`       | Small gaps, compact list items          |
| 3      | 12px | `p-3`       | Input padding (y-axis), badge padding   |
| 4      | 16px | `p-4`       | Standard card padding, form field gap   |
| 5      | 20px | `p-5`       | —                                       |
| 6      | 24px | `p-6`       | Card padding (default), section gaps    |
| 8      | 32px | `p-8`       | Large card padding, modal padding       |
| 10     | 40px | `p-10`      | Section padding (mobile)                |
| 12     | 48px | `p-12`      | Section padding (desktop)               |
| 16     | 64px | `p-16`      | Page-level vertical rhythm              |
| 20     | 80px | `p-20`      | Hero sections                           |
| 24     | 96px | `p-24`      | Large section separation                |

> **Rule from Refactoring UI**: start with too much white space and remove it. Don't add until it "stops looking bad" — add until it looks great, then pull back.

---

## Border Radius

Consistent rounded corners — pick one style and stick to it throughout (mixing is worse than either option).

LearnPool uses **medium-rounded** — friendly but not playful.

| Component            | Value  | Tailwind      |
|----------------------|--------|---------------|
| Buttons              | 8px    | `rounded-lg`  |
| Cards / Panels       | 12px   | `rounded-xl`  |
| Inputs / Select      | 8px    | `rounded-lg`  |
| Badges / Pills       | 9999px | `rounded-full`|
| Avatars              | 9999px | `rounded-full`|
| Modals               | 16px   | `rounded-2xl` |
| Dropdown menus       | 8px    | `rounded-lg`  |
| Tooltips             | 6px    | `rounded-md`  |

---

## Shadows

Use shadows to convey elevation, not decoration. Light source is above and slightly to the left.

| Level    | CSS Value                                      | Usage                          |
|----------|------------------------------------------------|--------------------------------|
| `sm`     | `0 1px 2px hsl(0,0%,0%,0.05)`                 | Inputs, subtle cards           |
| `md`     | `0 4px 6px -1px hsl(0,0%,0%,0.07), 0 2px 4px -1px hsl(0,0%,0%,0.04)` | Cards, dropdowns |
| `lg`     | `0 10px 15px -3px hsl(0,0%,0%,0.08), 0 4px 6px -2px hsl(0,0%,0%,0.04)` | Modals, panels |
| `xl`     | `0 20px 25px -5px hsl(0,0%,0%,0.10), 0 10px 10px -5px hsl(0,0%,0%,0.04)` | Floating elements |

Tailwind's built-in `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg` map well to these.

> **Use fewer borders** — a subtle shadow or background color difference separates elements better than a border, and looks cleaner.

---

## Component Specifications

### Buttons

Three tiers — one action per screen should be the primary.

| Variant   | Background         | Text       | Border     |
|-----------|--------------------|------------|------------|
| Primary   | Indigo-500         | white      | none       |
| Secondary | white              | Indigo-600 | Indigo-200 |
| Ghost     | transparent        | Gray-600   | Gray-200   |
| Danger    | Red-500            | white      | none       |

- Padding: `py-2 px-4` (sm), `py-2.5 px-5` (md/default), `py-3 px-6` (lg)
- Font: 14px semibold (600)
- Border radius: `rounded-lg` (8px)
- States: hover darkens background ~5% lightness; focus adds `ring-2 ring-indigo-300 ring-offset-2`

### Cards

- Background: white
- Border: `1px solid hsl(220, 15%, 90%)` (Gray-200) OR no border + `shadow-md`
- Border radius: `rounded-xl` (12px)
- Padding: `p-6` (24px) default, `p-4` (16px) compact
- Accent bar variant: `border-l-4 border-indigo-500` (used on ClassCard)

### Inputs / Form Controls

- Background: white
- Border: `1px solid hsl(220, 12%, 80%)` (Gray-300)
- Border radius: `rounded-lg`
- Padding: `py-2.5 px-3`
- Font: 16px, weight 400
- Focus: `border-indigo-400 ring-2 ring-indigo-100`
- Placeholder: Gray-400
- Label: 14px, weight 500 (Medium), Gray-700, `mb-1.5`

### Badges / Category Pills

- Padding: `py-0.5 px-2.5`
- Font: 12px, weight 500
- Border radius: `rounded-full`
- Background: color-100 shade; Text: color-700 shade

### Navigation (Sidebar)

- Background: Gray-900 (dark sidebar) OR white (light sidebar)
- Active item: Indigo-100 background + Indigo-700 text (light) OR Indigo-600 background + white (dark)
- Item padding: `py-2 px-3`
- Font: 14px, weight 500

---

## Visual Hierarchy Rules

From Refactoring UI ch. "Hierarchy is Everything":

1. **Use weight + color together**, not size alone. A bold 16px label outranks a light 20px label.
2. **De-emphasize secondary content** rather than emphasizing primary. Make supporting text gray, not bigger primary text.
3. **Three text colors max**: dark (primary), medium-gray (secondary), light-gray (tertiary).
4. **Two font weights** cover 90% of cases: 400 for body, 600-700 for emphasis.
5. **Never use gray text on colored backgrounds** — adjust opacity of white instead (`rgba(255,255,255,0.7)` on dark bg).

---

## Layout Rules

- **Content max-width**: `max-w-7xl` (1280px) for full layouts, `max-w-3xl` (768px) for forms/settings pages
- **Paragraph max-width**: `max-w-prose` (65ch) — never let reading text go edge-to-edge
- **Don't fill the whole screen** — a 500px form centered on a 1280px screen is fine
- **Column strategy**: use columns to fill space rather than stretching a narrow component wide
- **White space**: start with too much, remove until it feels right — never start cramped

---

## Tailwind CSS Variable Mapping

Add to `tailwind.config.js` or use CSS custom properties in `index.css`:

```css
:root {
  /* Primary - Indigo */
  --color-primary-900: hsl(226, 71%, 20%);
  --color-primary-700: hsl(226, 63%, 36%);
  --color-primary-500: hsl(226, 70%, 55%);
  --color-primary-200: hsl(226, 90%, 83%);
  --color-primary-100: hsl(226, 95%, 93%);

  /* Neutrals - Cool Grey */
  --color-gray-900: hsl(222, 47%, 11%);
  --color-gray-600: hsl(222, 14%, 45%);
  --color-gray-400: hsl(220, 10%, 70%);
  --color-gray-200: hsl(220, 15%, 90%);
  --color-gray-100: hsl(220, 20%, 96%);

  /* Semantic */
  --color-success-500: hsl(152, 57%, 38%);
  --color-success-100: hsl(152, 70%, 93%);
  --color-error-500: hsl(0, 72%, 51%);
  --color-error-100: hsl(0, 100%, 95%);
  --color-warning-500: hsl(36, 90%, 50%);
  --color-warning-100: hsl(48, 100%, 93%);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## What to Add to `index.html`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Do Not

- Use arbitrary font sizes (`text-[13px]`) — only use the type scale
- Mix square and rounded corners in the same UI
- Use pure black text (#000) — use gray-900
- Use gray text on colored backgrounds — use white with reduced opacity
- Use `em` units for font sizes — use `px` or `rem`
- Let paragraphs run full width on wide screens
- Add borders where a shadow or background difference would suffice
- Use more than 2 font weights in a single component
- Use font-weight 300 or below anywhere in the UI
