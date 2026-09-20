# Horizon frontend design rules

The visual system is defined in `../design/README.md` (tokens, app UX rules, chart system)
with the artboards beside it in `../design/*.html`. This file exists so any session that
reads `DESIGN.md` follows that system and not an older one.

- Palette, type and spacing come from the CSS variables in `src/index.css`. Use Tailwind
  classes (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-accent`)
  or `var(--…)`; never hard-code a hex in a component.
- One typeface: Instrument Sans (400/500/600). Mono (`.mono`) for formulas, page refs and
  eyebrows. No serif anywhere.
- Flat colour only: no gradients, no glass, no glow. 1px hairlines (`border-border`) are the
  normal way to separate things.
- One card system; status is a chip, never a repainted card. One primary action per card.
- Sources open by default under an answer; scope and audience visible at the moment of asking.
- Honest empty and low-confidence states. No student-facing score.
- Charts: one hue per single series (`--chart-1`), status colours reserved, one axis per chart.
- Motion: reveal-on-scroll for hero and section heads only; hover states; nothing floats.
  Respect `prefers-reduced-motion`.
- Phone first for asking: 44px targets, one-thumb composer, sources inline.
