# Atelier Jacqueline Suzanne — Design System

Design system for **Atelier Jacqueline Suzanne**, the photography and artistic practice of
Romane Lepont. It backs a custom-built bilingual (French/English) website replacing her
current Myportfolio-based site (`atelierjacquelinesuzanne.fr`). The site is being built by
her brother Florian as a near-zero-cost custom project (Astro + Sanity CMS + OVH hosting),
not a SaaS site builder.

**Core value:** visitors browse Romane's photographic work and buy a piece (print, original,
book, or merch) through a real, working checkout — everything else supports that. The
project ships in two milestones: **v1** (this design system's current scope) replaces the
old site with portfolio + about + contact, bilingual; **v1.x** (not yet built, no UI spec
exists for it) adds exhibitions, shop and Stripe checkout on top.

## Sources

This design system was built by reading the live planning/implementation repo, not a
screenshot or a mockup. **No application UI code exists in the repo yet** — it's at the
walking-skeleton/planning stage — so every visual decision here traces back to its written
UI-SPEC.

- **GitHub:** [florianlepont/ajs-website](https://github.com/florianlepont/ajs-website) —
  read `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, and
  `.planning/phases/01-foundation-bilingual-infrastructure/01-UI-SPEC.md` (the source of
  truth for every token in this system) for the full picture. Explore the repo directly to
  do a better job than this pass — in particular, a **later** in-repo document,
  `.planning/phases/02-portfolio-galleries/02-UI-SPEC.md`, proposes a completely different
  color/type identity (Dawn Pink + Wild Strawberry accent + a "Delight" variable font) —
  see the Visual Foundations note below on why this design system does *not* adopt it.
- **Uploaded assets:** `uploads/AJS_Brutalist_*.png` — the "AJS" wordmark, the only real
  brand mark provided (see Iconography).

## Index

- `styles.css` — root stylesheet, imports every token file below.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`.
- `components/` — React primitives, grouped by concern:
  - `navigation/` — `Header`, `LanguageSwitcher`, `Footer`
  - `gallery/` — `GalleryCard`, `Lightbox`
  - `forms/` — `Button`, `Input`, `Textarea`
  - `feedback/` — `EmptyState`
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `assets/logos/` — the AJS wordmark, black/white, with/without transparency.
- `ui_kits/website/` — click-through recreation of the site's core screens (homepage,
  gallery listing, gallery detail + lightbox, 404).
- `SKILL.md` — portable skill definition for use outside this environment (e.g. Claude Code).

## Content Fundamentals

- **Bilingual, FR-primary.** French is the primary market and is authored first; English is
  a professional translation of the same content, never a separate voice. French serves at
  root paths (`/`), English under `/en/` — this is a routing/locale detail, not a tone
  difference.
- **Plain, warm, unembellished.** Copy is short and functional rather than promotional —
  e.g. the placeholder homepage welcome reads "Bienvenue sur le site de l'Atelier Jacqueline
  Suzanne. Le site est en cours de construction." No exclamation points, no marketing
  superlatives, no urgency language.
  A gallery card's only visible copy is the project's proper-noun title (e.g. "Rebut",
  "Silos") — the actionable verb ("Voir la galerie" / "View gallery") is screen-reader-only,
  not visible chrome. This is a deliberate "let the work speak" convention: don't add visible
  button labels on top of gallery thumbnails.
- **Accessibility-first phrasing.** Every interactive element that isn't self-explanatory
  from visible text gets a written accessible name (e.g. the lightbox: "Voir en taille
  réelle, image 3 sur 12" / "View full size, image 3 of 12"). Treat this as part of the
  copywriting contract, not an afterthought.
- **No emoji, no icons-as-copy.** Chrome is text-only by explicit decision (D-11) — the
  language switcher is plain "FR | EN", not flag icons or a dropdown.
- **Error/empty copy stays plain and short.** 404: "Page introuvable. Retournez à l'accueil."
  / "Page not found. Return home." Empty gallery state: "Galeries à venir" / "Galleries
  coming soon" — factual, no apology, no filler.

## Visual Foundations

- **Neutral chrome, flashy pink accent.** Dominant `#FFFFFF` (main backgrounds, and now also
  the header/footer chrome bands — Secondary was merged into Dominant per feedback; chrome is
  delineated by a 1px hairline border instead of a background-color tint), ink `#1A1A1A`
  (body copy/headings).
  There is no destructive/error color in this system — form error states use bold ink text
  and a thicker ink border instead. **Accent is a flashy pop pink, `#FF3B94`** — updated
  from the initial monochrome placeholder per direct design-system feedback; it's the first
  real brand-color decision for the portfolio identity. Used more heavily than the original 10%
  reservation — the header/footer nav links, primary buttons, current-locale emphasis,
  `:focus-visible` outlines, and link text all read in pink now, making it the most visible
  color in the chrome (imagery still carries large background areas). Text rendered *on* an accent-pink fill uses `--color-on-accent`
  (dark ink), never white — pink-on-white reads fine, white-on-pink does not.
  **Note on the later repo revision:** a subsequent planning pass in the same repo
  (`02-UI-SPEC.md`) introduces a completely different, colorful identity (Dawn Pink
  background, Woodsmoke ink, Wild Strawberry accent, a "Delight" variable display font) as a
  live creative-direction decision made mid-project. This design system intentionally builds
  the **monochrome Phase 1 contract** instead, since that is the palette explicitly specified
  for this design system's build. If/when that later direction is confirmed as final, treat
  `tokens/colors.css` and `tokens/typography.css` as the single point of change — every
  component reads from those two files via CSS custom properties, so a repaint doesn't
  require touching component code.
- **Typography.** Two-tier stack: Label/Body use the system sans stack
  (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`) for
  reading comfort. Heading/Display use **`--font-display` = "Unbounded"** (Google Fonts) —
  ***a flagged substitution***: no usable typeface file exists for the brutalist wordmark
  logo (it's flattened into the provided PNGs), and Unbounded is the closest free match to
  its ultra-bold, blocky, slightly warped geometric character. Please supply the real logo
  typeface (or a licensed equivalent) if one exists, and this system will swap it in from a
  single file (`tokens/fonts.css`). Exactly 4 roles, exactly 2 weights: Label (14px/400),
  Body (16px/400), Heading (20px/600, Archivo Black), Display (32px/600, Archivo Black). Do
  not introduce a 5th size or a 3rd weight without revising this contract everywhere.
- **Spacing.** Strict 4px-based scale: xs 4, sm 8, md 16, lg 24, xl 32, 2xl 48, 3xl 64.
  Exception: interactive tap targets (switcher links, lightbox controls) get a 44px minimum
  height via padding, never by inflating font-size (WCAG 2.5.5).
- **Backgrounds.** Flat fills only — no gradients, no textures, no patterns. Imagery
  (galleries) is the only source of visual richness; chrome stays flat and neutral.
  Full-bleed cover photos anchor each gallery card and gallery-detail header.
  The provided AJS wordmark asset includes a grain/gradient treatment baked into the PNG
  itself (see Iconography) — that texture belongs to the logo lockup only, not to the UI.
- **Corners.** Square by convention — chrome, cards, and panels are 0px radius (matches the
  brutalist wordmark's hard edges); a minimal 2px radius is used only on buttons/inputs to
  soften touch affordance slightly.
- **Borders/shadows.** No shadow system — flat design throughout. A single hairline border
  (`--color-border`, a quiet neutral one step off Secondary) delineates inputs and any card
  that needs a boundary without a background-color difference.
- **Hover/press states.** Links: underline appears/intensifies in Accent color, never a color
  change (Accent is already the ink color). Buttons: opacity dips to ~0.8 on hover, resting
  state has no shadow/scale change. Gallery cards: `transform: scale(1.02)` on the cover photo
  on hover — a restrained, non-bouncy affordance. No press/active-state shrink is specified
  by the source; treat opacity/underline as the full hover vocabulary until told otherwise.
- **Animation.** None specified in the source. Treat the system as motion-neutral by default
  — a plain fade (150–200ms) is acceptable for the lightbox open/close, nothing more
  elaborate, until an animation decision is made.
- **Transparency/blur.** One documented use: the lightbox scrim, `rgba(26,26,26,0.96)` (a
  near-opaque tint of the Accent ink) behind the full-viewport image viewer. No blur
  (backdrop-filter) anywhere in the source spec.
- **Imagery color vibe.** Not yet determined — no real photography has been supplied to this
  design system (all gallery/cover images in the UI kit are placeholders). Do not invent a
  warm/cool/grain treatment; ask Romane/Florian for real photos before making that call.
- **Layout rules.** Header and footer are fixed-position chrome *bands* (not floating/sticky
  — they scroll with the page) on the Secondary color, full-width. Content area is Dominant
  white. Gallery grids: 1 column below 768px, 3 columns at/above — the only breakpoint used
  anywhere in the source spec.

## Iconography

- **No icon system or icon font.** The source UI-SPEC is explicit: Phase 1's chrome is
  text-only (no flag icons, no nav icons, no dropdown chevrons) — the language switcher is
  literally the text "FR | EN".
- **Hand-authored inline SVG, sparingly, planned for the lightbox only.** The one icon need
  identified in the source repo's planning docs (a later, colorful-identity revision) is
  stroke-based 24×24 chevron-left/chevron-right/close glyphs for the lightbox controls — not
  yet built as of this design system's source snapshot. This design system's `Lightbox`
  component uses plain Unicode glyphs (‹ › ✕) as a placeholder in the same spirit as the
  source's "text-only, no icon library" convention; swap in real inline SVG if/when that
  revision is adopted.
- **No emoji anywhere** — confirmed by both the copywriting contract and general tone.
- **Real logo asset provided and used as-is:** `assets/logos/AJS_Brutalist_*.png` — a bold
  "AJS" wordmark (initials of Atelier Jacqueline Suzanne) with a grain/gradient panel
  beneath it, supplied in black and white, with and without transparency. This is the only
  real brand mark in this system; it was not drawn or reconstructed by the design system
  author. No other logo, icon set, or illustration set was provided — none is invented here.

## Intentional Additions

Component-level guidance in this brief calls for building only what a concrete source
defines. The source repo's UI-SPEC is infrastructure-only (chrome + switcher) plus a gallery
card and lightbox from the Phase 2 planning doc — it does not yet define a button, form
input, or empty-state component, because the contact form (Phase 3) and shop (v1.x) aren't
specified yet. Added ahead of that need, sized to the nearest concrete upcoming requirement
(CONT-01 contact form; general CTA affordance):

- **`Button`** (`components/forms/`) — no CTA exists in the v1 copywriting contract yet, but
  Phase 3's contact form and v1.x's checkout will need one.
- **`Input` / `Textarea`** (`components/forms/`) — sized directly for the Phase 3 contact
  form (name/email/message fields), which is on the roadmap but not yet spec'd.
- **`EmptyState`** (`components/feedback/`) — the source UI-SPEC explicitly writes the empty
  gallery-list copy ("Galeries à venir") without describing a component shape; this gives it
  one.

## Components

- **Navigation** — `Header`, `LanguageSwitcher`, `Footer`
- **Gallery** — `GalleryCard`, `Lightbox`
- **Forms** — `Button`, `Input`, `Textarea`
- **Feedback** — `EmptyState`

## Caveats — please help iterate

- **Accent color is now a flashy pop pink** (`#E6007A`), updated from the initial
  monochrome placeholder per feedback. Typography is still the system font stack (no brand
  typeface chosen). The repo's own Phase 2 planning doc considers a different bold identity
  (Dawn Pink / Wild Strawberry / "Delight" font) — if that's the actual direction instead of
  this pop-pink accent, say so and this system repaints from `tokens/colors.css` /
  `tokens/typography.css` without touching component code.
- **No real photography exists here.** Every gallery/cover image in the UI kit is an
  `<image-slot>` placeholder. Drop in real photos (or point me at them) for a meaningful
  visual pass — imagery is meant to carry the color/mood this monochrome chrome deliberately
  leaves open.
- **No component-library source exists in the repo** (no `.astro`/`.css` files are committed
  yet — it's planning-stage). Every component here is inferred from the written UI-SPEC, not
  copied from real code. Re-run this pass once `BaseLayout.astro`, `LanguageSwitcher.astro`,
  etc. actually exist in the repo for a pixel-accurate rebuild.
- **Shop/checkout/exhibitions are out of scope.** No v1.x UI-SPEC exists yet for products,
  cart, or checkout — nothing was invented for them. Ask for this system to be extended once
  that spec exists.

Tell me which of these to tackle first.
