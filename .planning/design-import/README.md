# Design Import Reference Material

Imported 2026-07-08 from two Claude Design projects, via the "Send to Claude Code Web" static
HTML/CSS/JS export path (DesignSync MCP auth wasn't available in this worktree session).

- `design-system/` — component library, tokens, guideline specimen cards, brand logo assets.
  Source: https://claude.ai/design/p/04051c3b-5c12-4425-ae1b-df66f83355ce
- `homepage-prototype/` — click-through DC prototype (`Atelier Homepage.dc.html`) covering
  homepage (hero carousel + grid toggle), gallery-detail, and 404 screens.
  Source: https://claude.ai/design/p/065a8e60-983a-49ae-80a4-13cad0de5245

## Known staleness — read before using

`design-system/readme.md` states this system was built by reading the repo at its
**pre-Phase-2 planning stage** ("no application UI code exists in the repo yet"). It
explicitly builds the **Phase 1 monochrome placeholder contract**
(`--color-dominant: #FFFFFF`, `--color-ink: #1A1A1A`, `--color-accent: #FF3B94`) and flags —
in its own words — that a later repo revision (`02-UI-SPEC.md`) already committed to a
different identity (Dawn Pink / Woodsmoke / Wild Strawberry / "Delight" font), which by the
time of this import **had already shipped** in Phase 2 (`--color-dominant: #F0E7E4`,
`--color-ink: #141213`, `--color-accent: #F92D97`, self-hosted Delight variable font).

**Decision (2026-07-08, Florian):** adopt the imported design system's monochrome +
pop-pink identity as the new brand direction, superseding Phase 2's Dawn Pink / Wild
Strawberry palette. This is a deliberate rebrand, not an oversight — recorded in
PROJECT.md Key Decisions.

## Token resolution notes (readme prose vs. actual token files — files win)

- **Accent color:** `design-system/readme.md` prose is internally inconsistent (`#FF3B94` in
  "Visual Foundations", `#E6007A` in "Caveats"). The actual `tokens/colors.css` uses
  **`#FF3B94`** — treat that file as authoritative.
- **Display font:** `design-system/readme.md` prose says "Unbounded". The actual
  `tokens/fonts.css` imports **Archivo Black** (Google Fonts) and sets
  `--font-display: 'Archivo Black', var(--font-sans)`. Treat the CSS file as authoritative.

## Already-compatible tokens

The 4px spacing scale (`--space-xs` through `--space-3xl`, `--tap-target-min: 44px`) in
`design-system/tokens/spacing.css` is **identical** to what's already live in
`src/layouts/BaseLayout.astro` — no migration needed there, only color and font tokens
change.

## What's genuinely new here

- `Button`, `Input`, `Textarea`, `EmptyState` components — not yet built as reusable
  components in the live codebase (the Phase 3 contact form was hand-rolled).
- Homepage redesign: full-bleed hero carousel with a rotating per-gallery accent-color
  panel, a carousel/grid display toggle, and a 3-column gallery-detail grid + lightbox —
  a real upgrade over the current placeholder "Bienvenue... en cours de construction" homepage.
- Real brand logo assets (`assets/logos/AJS_Brutalist_*.png`) — usable as-is (only real
  brand mark provided, not reconstructed).
