---
phase: quick-260718-rhv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: false
requirements: [260718-rhv]

must_haves:
  truths:
    - "In grid mode, every gallery tile's title sits at the same vertical offset from its own tile's bottom edge, regardless of whether its collection statement is present, short, or long"
    - "Hovering or keyboard-focusing a grid gallery tile tints its scrim toward that gallery's own resolved accent hex while the white caption text stays legible over the dark scrim floor"
    - "Hovering or focusing a grid gallery tile lifts its title a few px in sync with the description's existing 180ms fade/slide reveal"
    - "A gallery tile whose statement is empty reserves the same caption height as every other tile and shows no visible empty-space artifact or hover flicker"
  artifacts:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
  key_links:
    - "Each non-hero gallery tile receives its own per-tile accent CSS custom property (--tile-accent) from gallery.heroColor, distinct from the shared --current-accent the hero tile consumes (preserved from quick-260718-r2o)"
    - ".home-grid__tile-description reserves a fixed 3-line height on every tile so the bottom-anchored .home-grid__tile-copy block is the same height everywhere and titles align"
---

<objective>
Fix two grid-mode homepage defects in `HomeCarousel.astro` and one polish item, all locked in this task's CONTEXT.md:

1. **Title misalignment** — grid-tile titles sit at inconsistent heights because `.home-grid__tile-description` is conditionally rendered (Phase 8 D-05 defensive guard) and reserves content-dependent height even at `opacity: 0`, so tiles with/without a statement (or with different statement lengths) push their titles to different vertical positions. Fix: always render the description block and reserve a fixed 3-line height for every tile (locked decision "Title-position fix approach").

2. **Hover highlight** — extend the hover-reveal effect with a per-gallery color tint on the scrim, using each gallery's own already-resolved accent hex (locked decision "Hover highlight style — per-gallery color tint"), wired through as a new per-tile CSS custom property that mirrors — without duplicating or colliding with — the shared `--current-accent`/`--current-accent-text` pattern quick-260718-r2o established for the hero tile.

3. **Title lift** — keep a subtle few-px upward shift of the title on hover/focus, consistent with the description's existing `translateY` reveal motion (locked decision "Title lift on hover").

Purpose: Fixes a visible layout bug (misaligned titles, confirmed live on the "Paysage"-class missing-statement case) and makes the grid hover feel intentional and on-brand.
Output: Updated grid-tile markup + CSS in `HomeCarousel.astro`, new e2e coverage in `homepage.spec.ts`, and a human visual confirmation of alignment + hover polish.

Scope guardrails (from task constraints):
- Grid-mode tiles ONLY. Do NOT touch the carousel-mode byline (`.home-hero__byline`) or its Phase 8 D-03/D-04 behavior.
- Do NOT touch `sanity/schemas/` — pure frontend fix; the missing-statement content gap on "Paysage" is Romane's Studio content work, not this task.
- PRESERVE the existing `.home-grid__tile.home-grid__tile--hero` `--current-accent`/`--current-accent-text` wiring (quick-260718-r2o). This task ADDS a distinct per-tile property for the non-hero tiles; it must not reuse or overwrite `--current-accent` for them (that would make every tile show the carousel's currently-cycling accent instead of its own).
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260718-rhv-fix-grid-mode-tile-title-misalignment-an/260718-rhv-CONTEXT.md
@.planning/quick/260718-r2o-fix-the-homepage-per-gallery-accent-colo/260718-r2o-SUMMARY.md
@.planning/phases/08-gallery-descriptions/08-CONTEXT.md

# Source files (all changes land in HomeCarousel.astro + homepage.spec.ts):
# - Grid-tile markup: src/components/HomeCarousel.astro ~lines 219-237 (galleries.map -> <a class="home-grid__tile">)
# - Grid-tile CSS: src/components/HomeCarousel.astro ~lines 1358-1437 (.home-grid__tile, -scrim, -copy, -title, -description)
# - Hero-tile accent wiring to PRESERVE: src/components/HomeCarousel.astro lines 99-103 (.home SSR style), 312-319 (.home-grid__tile--hero CSS)
# - Per-gallery accent resolution (already done, reuse only): src/lib/site-config.ts (normalizeHeroColor, getHeroTextColor); src/pages/index.astro + src/pages/en/index.astro lines ~34-53 already give EVERY gallery a resolved heroColor/heroTextColor
@src/components/HomeCarousel.astro
@tests/e2e/homepage.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Always-reserve the grid-tile description height so titles align</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Implements the locked "Title-position fix approach" decision (always reserve description space), extending Phase 8 D-05/D-06.

Markup (`HomeCarousel.astro` ~line 234): remove the `gallery.statement &&` short-circuit guard so `<span class="home-grid__tile-description">` is rendered for EVERY gallery tile. Render `{gallery.statement}` as its content — when a gallery has no statement this yields an empty (but height-reserved) span, which is the intended graceful-degradation path per this task's CONTEXT.md and the constraint that an empty statement must not produce a visible artifact. Do NOT add a fallback string here (that is the carousel byline's D-03 behavior, explicitly out of scope for grid tiles).

CSS (`.home-grid__tile-description`, ~lines 1419-1431): add a fixed reserved height equal to exactly three line-boxes so every tile's bottom-anchored `.home-grid__tile-copy` block is the same height and titles always align — regardless of whether the statement is absent, one line, or clamped at three. The description already has `line-height: 1.4`, `font-size: 14px`, and `-webkit-line-clamp: 3`; reserve `min-height: calc(1.4em * 3)` (≈58.8px, three 14px line-boxes) so content-length no longer changes the block's height. Keep the existing `margin-top: var(--space-sm)`, `opacity: 0`, `transform: translateY(8px)`, transition, and line-clamp untouched — the fixed height is additive. Because `opacity` never collapsed layout, this is what makes short/absent statements reserve the same room as long ones (the root cause). Leave the hero tile untouched — it has no `.home-grid__tile-copy`/`-description`.

Defensive detail (Claude's Discretion item in CONTEXT.md): with the height fixed, the on-hover reveal of an empty block changes only opacity/transform (no layout shift), so there is no stray hover flicker — no extra min-height guard is needed beyond the reserved height. An empty span carries no text, so it introduces no screen-reader artifact; do not add `aria-hidden` (it would also hide populated tiles if applied unconditionally).

Test (`homepage.spec.ts`): add a new `test.describe('grid-tile title alignment (260718-rhv)')` block. Test A: toggle to grid (`getByRole('button', { name: 'Grille' }).click()`), collect all non-hero gallery tiles (`a.home-grid__tile`), and for each compute `tileRect.bottom - titleRect.top` (title distance from its own tile's bottom edge — row-independent, works no matter how the 3-column grid wraps); assert `max - min <= 1`. Test B (empty-statement defensive): read the first tile's `.home-grid__tile-description` computed height, then via `evaluate` set that description's `textContent = ''`, and assert the tile's title offset (`tileRect.bottom - titleRect.top`) is unchanged within 1px — proving an empty statement reserves identical height.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts -g "grid-tile title alignment" && npm run build</automated>
  </verify>
  <done>Every non-hero grid tile renders a `.home-grid__tile-description` span (populated or empty); all gallery-tile titles align to within 1px of the same offset from their tile's bottom edge; clearing a tile's statement text does not change its title offset; the new alignment describe block passes and the site builds.</done>
</task>

<task type="auto">
  <name>Task 2: Wire per-tile accent color, tint the scrim on hover, and lift the title</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Implements the locked "Hover highlight style — per-gallery color tint" and "Title lift on hover" decisions, reusing (not duplicating) the accent resolution already done upstream. NOTE: `src/pages/index.astro` and `src/pages/en/index.astro` already resolve `heroColor`/`heroTextColor` for EVERY gallery in their `.map()`, so `gallery.heroColor` is already available on each entry inside `galleries.map(...)` in this component — no page-side or site-config.ts changes are required, and no new palette module.

Per-tile accent wiring (markup, `HomeCarousel.astro` ~line 220, the `<a class="home-grid__tile">`): add an inline style setting a NEW per-tile custom property from the gallery's own resolved hex, e.g. `style={{ '--tile-accent': gallery.heroColor ?? 'var(--color-accent)' }}` (object form, matching the existing `.home` SSR style at lines 99-103). Use a distinct name (`--tile-accent`) — do NOT reuse `--current-accent`, which is the shared carousel-cycling value the hero tile consumes; reusing it would tint every tile with whichever gallery the carousel currently shows instead of the tile's own color. The `?? var(--color-accent)` fallback covers galleries whose `heroColor` did not resolve to a named palette color (matches the hero tile's own `var(--current-accent, var(--color-accent))` fallback convention).

Hover scrim tint (CSS): add a tint layer over the existing dark scrim rather than replacing it (the dark `.home-grid__tile-scrim` gradient stays as the legibility floor). Add a `.home-grid__tile-scrim::after` pseudo-element positioned `absolute; inset: 0`, `background: var(--tile-accent, var(--color-accent))`, `opacity: 0`, `transition: opacity 180ms ease` (matching the description's 180ms reveal). Reveal it on `.home-grid__tile:hover .home-grid__tile-scrim::after, .home-grid__tile:focus-visible .home-grid__tile-scrim::after` by raising opacity to a moderate value (start ~0.35 and tune). `--tile-accent` inherits from the `<a>` ancestor down to the scrim, so the pseudo-element picks up each tile's own color. Claude's Discretion (per CONTEXT.md): exact intensity and whether to use a `mix-blend-mode` or a gradient — it must look intentional and on-brand, NOT garish, and must NOT compromise the white caption text's legibility (verify light presets like Lime `#A6FD29` / Teal `#55FFE1` do not wash out the white title/description near the bottom; lower the opacity or bias the tint toward the top of the tile if needed). The hero tile has no `.home-grid__tile-scrim`, so this rule never applies to it — its wiring stays untouched.

Title lift (CSS, `.home-grid__tile-title` ~lines 1411-1417): add `transition: transform 180ms ease`, and on `.home-grid__tile:hover .home-grid__tile-title, .home-grid__tile:focus-visible .home-grid__tile-title` set `transform: translateY(-4px)` (a few px — discretion on exact amount and whether timing matches the 180ms description fade). This shifts the title up as the description fades in, consistent with the description's existing translateY reveal.

Test (`homepage.spec.ts`): add a new `test.describe('grid-tile hover polish (260718-rhv)')` block. Test A (per-tile accent wiring): toggle to grid, take the first non-hero tile, assert `getComputedStyle(tile).getPropertyValue('--tile-accent')` is a non-empty value. Test B (hover tint): read the scrim `::after` opacity before hover via `getComputedStyle(scrim, '::after').opacity` (expect ~0), `hover()` the tile, then `expect.poll` the `::after` opacity to be `> 0.05`. Test C (title lift): read `getComputedStyle(title).transform` before hover (identity / `none`), hover, then `expect.poll` the title transform to be a non-identity matrix (translateY applied). Keyboard-focus parity is covered by the shared `:hover, :focus-visible` selectors — assert the CSS rule pairs both (optional: also exercise `.focus()` on the tile link and poll the same tint/transform).

Regression: run the full e2e suite to confirm no existing homepage test regressed — especially `collection statements on the homepage` (the hover-reveal test at ~line 163 still passes since the first tile has a statement), `grid hero tile text color tracks accent (260718-r2o)` (the hero tile's `--current-accent-text` path is untouched), and the grid blur-up / D-12 tile tests.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts && npm run build</automated>
  </verify>
  <done>Each non-hero grid tile exposes its own `--tile-accent` custom property sourced from its gallery's resolved hex; hovering/focusing a tile raises the scrim tint pseudo-element opacity above 0 and lifts the title (non-identity transform); the dark scrim + white caption stay legible; new hover-polish describe block passes and the entire `homepage.spec.ts` suite is green with no regressions; site builds.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Visual confirmation of title alignment and hover polish</name>
  <action>Pause after Tasks 1-2 land and all automated checks are green. Present the built grid-mode hover experience to the human for visual sign-off on the subjective, aesthetic quality (alignment, on-brand/non-garish tint, legibility, lift feel) that automated tests cannot assert. Do not proceed or write the SUMMARY until the human responds with the resume signal; if they report issues, adjust the tint intensity / lift amount / alignment in HomeCarousel.astro and re-present.</action>
  <what-built>
Grid-mode tile fixes in `HomeCarousel.astro`: (1) all tile titles now align regardless of statement length/presence via a fixed 3-line description reservation; (2) hovering/focusing a tile tints its scrim toward that gallery's own accent color; (3) the title lifts a few px on hover in sync with the description reveal. Automated e2e proves the mechanism (alignment offset, tint opacity change, title transform, per-tile `--tile-accent`), but the "intentional / on-brand / not garish / legible" aesthetic quality is subjective and needs a human eye.
  </what-built>
  <how-to-verify>
1. Run the dev server: `npm run dev` and open the homepage (http://localhost:4321/).
2. Click the mode toggle (top-right, "Grille") to switch to grid mode.
3. Confirm every gallery tile's title sits at the same height across the row — no title floating higher/lower than its neighbours (this is the primary bug being fixed; compare the two migrated galleries, Silos and Brume, whose statements differ in length).
4. Hover each gallery tile (and tab to it with the keyboard): the scrim should tint toward that gallery's own accent color, the description should fade/slide in, and the title should lift slightly. Confirm the tint reads as intentional and on-brand — not garish — and that the white title + description text stay clearly legible over the tint (pay attention to light-accent galleries if any are present).
5. Confirm no flicker or layout jump on hover, including on any tile with a short or missing statement.
6. Optionally re-check at a 393px mobile width and in the English homepage (/en/).
  </how-to-verify>
  <resume-signal>Type "approved" to finish, or describe what looks off (misalignment, garish/illegible tint, wrong lift amount) for adjustment.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | This change is pure static frontend CSS + markup + an inline CSS custom property (`--tile-accent`) sourced from build-time, already-fetched-and-filtered gallery data (per the existing T-04.1-04-ID note in HomeCarousel.astro). No new user input, network call, package, or runtime data path is introduced. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-rhv-01 | Injection (CSS) | `--tile-accent` inline style on grid tiles | low | accept | Value is `gallery.heroColor` (a hex from `normalizeHeroColor`, constrained to the fixed `HERO_COLORS` map) or the static `var(--color-accent)` fallback — never free-form user text, so no CSS-injection surface. No new packages installed (no legitimacy gate needed). |
</threat_model>

<verification>
- `npx playwright test tests/e2e/homepage.spec.ts` — full homepage suite green, including the two new describe blocks (`grid-tile title alignment (260718-rhv)`, `grid-tile hover polish (260718-rhv)`) and no regression to `collection statements on the homepage`, `grid hero tile text color tracks accent (260718-r2o)`, grid blur-up, and D-12 tile tests.
- `npm run build` — site builds cleanly (both FR and EN homepages).
- Human checkpoint (Task 3) confirms alignment and the on-brand/legible quality of the hover tint + title lift.
</verification>

<success_criteria>
- Grid-tile titles align to within 1px of the same per-tile bottom offset regardless of statement presence/length.
- Every non-hero grid tile carries its own `--tile-accent` (its gallery's resolved hex, or the accent fallback), and hover/focus tints the scrim toward it while keeping caption text legible over the dark scrim floor.
- Title lifts a few px on hover/focus in sync with the 180ms description reveal.
- Hero tile's `--current-accent`/`--current-accent-text` wiring (quick-260718-r2o) is unchanged; carousel byline (D-03/D-04) and Sanity schemas are untouched.
- Empty-statement tiles degrade gracefully (same reserved height, no visible artifact or flicker).
- Full `homepage.spec.ts` suite passes and the site builds.
</success_criteria>

<output>
Create `.planning/quick/260718-rhv-fix-grid-mode-tile-title-misalignment-an/260718-rhv-SUMMARY.md` when done.
</output>
