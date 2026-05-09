```markdown
# Design System Document: Editorial Intelligence

## 1. Overview & Creative North Star: "The Academic Luminary"
This design system rejects the "SaaS-standard" aesthetic in favor of a high-end editorial experience. We are not building a simple dashboard; we are crafting a digital academy. The **Creative North Star** is "The Academic Luminary"—a marriage of traditional scholarly authority (the Georgia serif influence) and forward-leaning AI innovation. 

The system achieves this through **Intentional Asymmetry**. By utilizing a fixed 240px sidebar against a fluid, expansive workspace, we create a layout that feels like an open folio. We break the grid by using high-contrast typography scales and "floating" elements that prioritize breathing room over-density.

---

2. Colors: Tonal Depth vs. Structural Lines
The palette is rooted in a warm, sophisticated amber. To maintain a premium feel, we strictly adhere to the following logic:

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders to define sections. Boundaries must be established through background color shifts or tonal transitions.
*   **Surface Hierarchy:** Use `surface` as your base. Place a `surface-container-low` section over it to define a sidebar or secondary panel. 
*   **Nesting:** To create depth, stack containers using the tier system. A `surface-container-highest` card should sit atop a `surface-container-low` section, creating a natural, soft hierarchy without a single line of "ink."

### The "Glass & Gradient" Rule
Standard flat colors feel static. To inject "soul" and "innovation" (AI-forward):
*   **Signature Gradient:** All primary CTAs, badges, and avatars must use a linear gradient: `primary` (#8c4b00) to `primary_container` (#b06000) at a 135-degree angle.
*   **Glassmorphism:** For floating menus or popovers, use `surface_container_lowest` at 80% opacity with a `20px` backdrop-blur. This mimics frosted glass, allowing the amber warmth of the background to bleed through.

---

3. Typography: The Editorial Voice
We use a bi-font system to balance tradition with modernity.

*   **Display & Headlines (Newsreader/Georgia):** These are our "Editorial" voices. Use `display-lg` and `headline-md` for landing moments and section titles. The serif nature conveys academic "Trust."
*   **UI & Body (Manrope):** Our "Functional" voice. Manrope is a geometric sans-serif that feels clean and AI-forward. Use `body-md` for all instructional text.
*   **Hierarchy Tip:** Always pair a `headline-lg` (Serif) with a `label-md` (Sans-serif, All Caps, tracked out +10%) to create a sophisticated, "Curated" look.

---

4. Elevation & Depth: The Layering Principle
We convey importance through **Tonal Layering** rather than drop shadows or lines.

*   **Ambient Shadows:** If an element must float (like a modal or a primary card on hover), use a "Sunken Shadow": `0 20px 40px -12px rgba(35, 26, 19, 0.08)`. The shadow color is never black; it is a tinted version of `on_surface`.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline_variant` token at 15% opacity. It should be felt, not seen.
*   **Roundedness:** Stick strictly to the `xl` (1.5rem) scale for cards and `full` for buttons/chips to maintain the "Soft Modernism" vibe.

---

5. Components

### Buttons & Interaction
*   **Primary:** Gradient-filled (Amber to Orange), `xl` roundedness. On hover, apply a subtle `surface_bright` inner-glow (1px).
*   **Secondary:** No background. Use a `ghost-border` (15% `outline_variant`).
*   **Interactive Cards:** Must use `rounded-xl`. On hover, the card should transition from `surface_container_low` to `surface_container_highest` with a soft ambient shadow.

### Academic Components
*   **The Learning Sidebar (240px):** Fixed position. Use `surface_container_low`. Ensure no border exists between the sidebar and the main content; use a subtle `surface_dim` background for the main stage to create separation.
*   **AI Insight Chips:** Use `secondary_container` with `on_secondary_container` text. These should always be `rounded-full` to distinguish them from standard "action" buttons.
*   **Progress Orbs:** Use the signature gradient for the fill of circular progress indicators, emphasizing the "Vibe" of growth and warmth.

### Input Fields
*   **Text Inputs:** Forgo the 4-sided box. Use a `surface_container_highest` background with a 2px bottom-only border in `primary` that animates from the center on focus.

---

6. Do's and Don'ts

*   **DO** use whitespace as a separator. If you think you need a line, add 24px of padding instead.
*   **DO** mix your fonts. A Manrope label sitting above a Georgia headline is the hallmark of this system.
*   **DON'T** use pure black (#000) for text. Use `on_surface` (#231a13) to keep the "warmth."
*   **DON'T** use `rounded-sm` or sharp corners. Every interaction should feel organic and approachable.
*   **DON'T** use high-contrast shadows. If the shadow is distracting, it's too dark. It should feel like a soft glow of light being blocked, not a black ink stain.

---

7. Summary for Junior Designers
When in doubt, think: **"Is this a generic dashboard, or is this a premium textbook?"** If it feels too "techy," swap a sans-serif for a serif. If it feels too "flat," add a surface tier. If it feels too "cluttered," delete a border. This design system lives in the space between academic tradition and the fluid future of AI.```