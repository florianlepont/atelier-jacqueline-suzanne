---
phase: quick-260723-txi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/editions/index.astro
  - src/pages/en/editions/index.astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/components/EmptyState.astro
  - tests/e2e/edition.spec.ts
autonomous: true
requirements:
  - QUICK-260723-txi
user_setup: []

must_haves:
  truths:
    - "On /editions/ and /en/editions/, the éditions list renders as the asymmetric Poster Grid (per group of 3: 1 hero tile spanning 2 rows + up to 2 stacked small tiles; hero side alternates left/right by group index) instead of the old zigzag row list."
    - "With today's 2 published éditions, both overview locales render exactly one group of size 2 (hero + 1 small on the top-right, side=left), matching the sketch-approved 'quiet space below the small tile' look — not treated as a bug."
    - "Small tiles show TITLE ONLY (statement hidden via an explicit `.tile--small .tile__statement { display: none }` rule); hero tiles show title + full statement."
    - "Zero published éditions renders a bold empty state (dashed border + large Unbounded display heading) via an opt-in EmptyState variant, WITHOUT changing EmptyState's default plain look for any other/future consumer."
    - "Both détail pages (/editions/{slug}/, /en/editions/{slug}/) render the `.edition-detail__format` line as bold + uppercase + pink accent underline; every other part of the detail page is byte-for-byte unchanged."
    - "The overview keeps the shared solid header (no headerVariant override reintroduced, per quick task 260723-qiz); détail pages keep headerVariant=\"transparent\"."
    - "No price / stock / purchase affordance is present on overview or detail (EDN-06)."
    - "The full tests/e2e/edition.spec.ts suite passes against the new markup — including a rewritten grid regression guard for today's 2-item group — and test:artifact + test:unit stay green."
  artifacts:
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/components/EmptyState.astro
    - tests/e2e/edition.spec.ts
  key_links:
    - "The grouping MUST consume the getEditions() array in its existing orderRank order (chunk by array index in steps of 3) — never re-sort, re-rank, or re-fetch."
    - "Real design tokens only. `--font-display` + `font-weight: var(--weight-semibold)` renders Unbounded 900 because 900 is the ONLY loaded weight (see BaseLayout comment); the sketch's `--weight-black` / `--color-on-accent` sketch-theme tokens must be mapped to real tokens — `--weight-black` does NOT exist in this codebase."
    - "Both fr/en overview twins carry byte-identical markup/CSS, and both fr/en détail twins carry byte-identical CSS, except locale strings and import depth."
    - "`text-transform: uppercase` on the format line is CSS-only: the DOM text keeps its original case (`Tirage`/`Print run`), so the e2e `/Tirage/`, `/Print run/` assertions and the commerce-token scan remain valid."
    - "EmptyState bold styling is gated behind an opt-in `variant` prop defaulting to plain, so no other consumer is restyled (Astro scopes component styles — a parent scoped rule cannot reach into EmptyState without :global, which is why the prop approach is the clean one)."
    - "The e2e détail/lightbox/commerce tests derive the détail URL dynamically from the first `.tile` href — never hardcode a slug (existing convention preserved)."
---

<objective>
Replace the Éditions overview zigzag row list with the sketch-approved "Poster Grid" (asymmetric bento of full-bleed photo tiles), on both locale twins, and restyle the format-details line on both édition détail pages to the sketch-approved bold-uppercase + pink-underline treatment. Then repair the entire existing e2e suite that references the old zigzag markup so nothing is left broken or stale.

The visual direction is already fully validated (sketches 001 → 002 → 003, explicit user approval). This is a pure implementation/port task: port the sketch layout to real build-time Astro over the real `getEditions()` data, using the codebase's REAL design tokens (the sketch theme's tokens are not all real — see key_links).

Purpose: The current overview reads as a plain editorial list; the Poster Grid makes the Éditions section bold and graphic while staying on-brand, and the détail format-line accent keeps list→detail visually coherent.
Output: 2 rebuilt overview pages, 1 shared EmptyState variant, 2 restyled détail pages, 1 fully-repaired e2e spec.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@src/pages/editions/index.astro
@src/pages/en/editions/index.astro
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro
@src/components/EmptyState.astro
@tests/e2e/edition.spec.ts
@src/lib/sanity.ts

Reference sketches (winners only — ignore the losing variants):
@.planning/sketches/001-editions-overview-composition/index.html   (use the `#variant-b` "Poster Grid" block: markup lines 262-292, CSS lines 121-164)
@.planning/sketches/002-poster-grid-scaling/index.html   (use the grouping JS `groupHtml`/`render` lines 208-260 and the `.grid-group[data-size][data-side]` CSS lines 74-132 — this is the authoritative grouping + scaling spec)
@.planning/sketches/003-edition-detail-coherence/index.html   (use ONLY `#variant-synth1 .detail__format`, lines 93-97 — the "Synthesis" winner; ignore variant B's big title / "Nouveau" tag)

## Confirmed facts (do NOT re-derive)

Design tokens (verified in `src/layouts/BaseLayout.astro` `:root`, lines 226-302):
- Exist and are the ONLY tokens to use: `--gray-0` (#FFFFFF), `--color-ink` (= `--gray-900` = #1A1A1A), `--color-accent` (= `--pink-600` = #D6327C), `--color-border` (#E3E1DE), `--color-on-accent` (= ink), `--font-display` ('Unbounded', sans), `--font-sans`, `--weight-regular` (400), `--weight-semibold` (600), `--radius-sm` (2px), `--border-hairline` (1px), the `--space-*` scale (`xs` 4 / `sm` 8 / `md` 16 / `lg` 24 / `xl` 32 / `2xl` 48 / `3xl` 64), `--text-label-size` (14px), `--text-label-leading` (1.5), `--text-body-size` (16px), `--text-display-size` (32px), `--editorial-page-max` (1180px), `--editorial-page-title-size`, `--editorial-page-padding-block/inline`, `--tap-target-min` (44px), `--focus-ring-offset` (2px).
- DOES NOT EXIST: `--weight-black`. Unbounded is self-hosted at **weight 900 only** (`@fontsource/unbounded/900.css`). Every `--font-display` consumer in this codebase declares `font-weight: var(--weight-semibold)` yet renders visually at 900 because 900 is the only loaded weight file. So: for the bold poster titles use `font-family: var(--font-display); font-weight: var(--weight-semibold);` — that IS the codebase's convention for "big black Unbounded". Do NOT invent `--weight-black`, and do NOT hand-write `font-weight: 900` (matches neither existing rule in these files nor the codebase convention).
- The scrim gradient's `rgba(26, 26, 26, x)` equals `--color-ink` with alpha (keep the literal rgba — CSS `var()` can't carry an alpha channel here; this mirrors the sketch).

Data (`src/lib/sanity.ts`): `getEditions()` returns published `Edition[]` already sorted by `orderRank` (Romane's drag order); fields available per tile: `title` (shared across locales), `slug`, `statement` (LocaleString), `leadPhoto` (EditionImage with `alt` LocaleString). Image helpers `thumbnailUrl(img, w)` and `responsiveThumbnailSrcSet(img)` are already imported in the overview files.

Today there are exactly 2 published éditions (Rebut, Silos) → the grid is one group of size 2. There is NO "isNew"/tag field on the `edition` schema — the sketch's pink "Nouveau" tag is synthetic mock data with no real source, so DO NOT port any tag to either the overview or the detail page.

Scope guards (from the task constraints):
- KEEP EXACTLY AS-IS on the overview: `<BaseLayout>` usage (no `headerVariant`), the `<header class="editions-list__header">` block + its eyebrow/h1 markup and CSS, and the `getEditions()` call. Only the éditions list below the header changes.
- Do NOT touch: Sanity schema, `getEditions()`/`getEdition()`, `Lightbox.astro`, `GalleryGrid.astro`, the détail hero/back-link/thumbnail-grid structure, `tests/scripts/verify-static-artifact.mjs`, and the détail `headerVariant="transparent"`.
- No new dependencies. Plain CSS/Astro only.
</context>

<tasks>

<!-- planner-discipline-allow: editions-list__row editions-list__photo editions-list__text editions-list__title editions-list__statement editions-list__row--reverse weight-black -->

<task type="auto">
  <name>Task 1: Rebuild both Éditions overview pages as the Poster Grid + add the bold EmptyState variant</name>
  <files>src/pages/editions/index.astro, src/pages/en/editions/index.astro, src/components/EmptyState.astro</files>
  <action>
Three files. Apply the overview changes IDENTICALLY to both `src/pages/editions/index.astro` (locale `'fr'`, imports at `../../`) and `src/pages/en/editions/index.astro` (locale `'en'`, imports at `../../../`) — they are byte-identical twins except locale strings, SEO copy, and import depth. Preserve the leading file-header comment (update its "vertical editorial zigzag list" description to describe the new Poster Grid, but keep the "mirrors the EN/FR twin" note and the byte-identical-twins convention).

STEP A — EmptyState.astro (shared component, single edit, opt-in and backward-compatible):
  - Add an optional prop: `variant?: 'plain' | 'bold'`, destructured with a default of `'plain'` (`const { heading, body, variant = 'plain' } = Astro.props;`). Keep `heading`/`body` required.
  - On the root element apply the variant class conditionally: `<div class:list={['empty-state', variant === 'bold' && 'empty-state--bold']}>`. Leave the two inner `<p>` elements and their classes (`empty-state__heading`, `empty-state__body`) unchanged.
  - Add scoped CSS (do NOT modify any existing `.empty-state*` rule — only ADD new `--bold` overrides so the default plain look is untouched for any other/future consumer):
      `.empty-state--bold` → `border: var(--border-hairline) dashed var(--color-border); padding: var(--space-3xl) var(--space-xl);`
      `.empty-state--bold .empty-state__heading` → `font-family: var(--font-display); font-weight: var(--weight-semibold); font-size: clamp(32px, 5vw, 56px); line-height: 1; letter-spacing: -0.02em;`
  - Rationale for the prop approach (not a parent override): Astro scopes each component's `<style>` to its own elements, so a scoped rule written in the overview page cannot reach EmptyState's internals without `:global()`; an opt-in variant prop is the clean, side-effect-free way to make it bolder only where asked.

STEP B — overview frontmatter grouping (both twins): after `const editions = await getEditions();`, add a type import `import type { Edition } from '../../lib/sanity';` (fr) / `'../../../lib/sanity';` (en), then chunk éditions into groups of 3 IN EXISTING ORDER (do not sort/re-rank):
      `const editionGroups: Edition[][] = [];`
      `for (let i = 0; i < editions.length; i += 3) { editionGroups.push(editions.slice(i, i + 3)); }`
  This is the exact port of sketch 002's `render()` loop (chunk of 3, side = groupIndex % 2). Hero = first item of each group; the rest are smalls.

STEP C — overview markup (both twins): keep the `<article class="editions-list">` wrapper and the `<header class="editions-list__header">…</header>` block verbatim. REPLACE the entire `editions.length === 0 ? (…) : ( editions.map(…) )` expression that follows the header with:
  - Empty branch: the SAME `<EmptyState heading=… body=… />` call but with an added `variant="bold"` prop (keep the existing FR/EN heading/body copy verbatim).
  - Non-empty branch: a `<div class="editions-grid">` containing `editionGroups.map((group, g) => …)`. For each group render `<div class="editions-grid__group" data-size={group.length} data-side={g % 2 === 0 ? 'left' : 'right'}>` wrapping `group.map((edition, idx) => …)`. For each édition render an anchor:
      `<a class:list={['tile', idx === 0 ? 'tile--hero' : 'tile--small']} href={getRelativeLocaleUrl(locale, ` + "`editions/${edition.slug}`" + `)}>`
      children, in order: an `<img>` (`src={thumbnailUrl(edition.leadPhoto, 600)}`, `srcset={responsiveThumbnailSrcSet(edition.leadPhoto)}`, `sizes={idx === 0 ? '(max-width: 800px) 100vw, 58vw' : '(max-width: 800px) 100vw, 40vw'}`, `alt={edition.leadPhoto.alt?.[locale] ?? ''}`, `loading="lazy"`, `decoding="async"`); then `<div class="tile__scrim" aria-hidden="true"></div>`; then `<div class="tile__body"><span class="tile__title">{edition.title}</span><p class="tile__statement">{edition.statement?.[locale] ?? ''}</p></div>`; then `<span class="sr-only"> — Voir l'édition</span>` (fr) / `<span class="sr-only"> — View edition</span>` (en).
  Render `.tile__statement` on EVERY tile (hero and small) — the small tiles hide it via CSS in STEP D (robust regardless of statement length, per the approved look). "Voir l'édition"/"View edition" is pure navigation-affordance text (no price/stock/CTA) — EDN-06 preserved.

STEP D — overview CSS (both twins): KEEP the `.editions-list`, `.editions-list__header`, `.editions-list__eyebrow`, and `.editions-list h1` rules exactly. DELETE every zigzag rule (all `.editions-list__row` / `.editions-list__photo` / `.editions-list__text` / `.editions-list__title` / `.editions-list__statement` selectors including the `--reverse` variants and their `@media (max-width: 767px)` block) and REPLACE them with the Poster Grid CSS ported from sketch 002 (rename `.grid-groups`→`.editions-grid`, `.grid-group`→`.editions-grid__group`, keep `.tile`, `.tile--hero`, `.tile--small`; rename `.tile-scrim`→`.tile__scrim`, `.tile-body`→`.tile__body`, `.tile-title`→`.tile__title`, `.tile-statement`→`.tile__statement`):
      `.editions-grid { display: flex; flex-direction: column; gap: var(--space-md); }`
      `.editions-grid__group { display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 16vw; gap: var(--space-md); }`
      `.tile { position: relative; overflow: hidden; display: block; color: var(--gray-0); text-decoration: none; border: var(--border-hairline) solid var(--color-ink); background: var(--color-ink); transition: transform 0.25s ease, box-shadow 0.25s ease; }`
      `.tile:hover { transform: translate(-4px, -4px); box-shadow: 6px 6px 0 var(--color-ink); }`
      `.tile:focus-visible { transform: translate(-4px, -4px); box-shadow: 6px 6px 0 var(--color-ink); outline: 2px solid var(--color-accent); outline-offset: var(--focus-ring-offset); }`  (keep the site's accent focus ring in addition to the brutalist offset — the sketch dropped the outline, but this codebase's a11y convention keeps an accent focus ring; the axe check must stay green)
      `.tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }`
      `.tile:hover img { transform: scale(1.04); }`
      `.tile__scrim { position: absolute; left: 0; right: 0; bottom: 0; height: 60%; background: linear-gradient(to top, rgba(26, 26, 26, 0.9), rgba(26, 26, 26, 0)); }`
      `.tile__body { position: absolute; left: 0; right: 0; bottom: 0; padding: var(--space-lg); }`
      `.tile__title { display: block; font-family: var(--font-display); font-weight: var(--weight-semibold); line-height: 0.95; margin-bottom: var(--space-xs); }`
      `.tile--hero .tile__title { font-size: clamp(28px, 4.5vw, 48px); }`
      `.tile--small .tile__title { font-size: clamp(20px, 2.6vw, 28px); }`
      `.tile__statement { font-size: var(--text-body-size); line-height: 1.4; max-width: 40ch; opacity: 0.9; margin: 0; }`
      `.tile--small .tile__statement { display: none; }`
      then the group templates verbatim (renamed): for `[data-size="3"][data-side="left"]` nth-child(1) `grid-column: 1 / 8; grid-row: 1 / 3;`, nth-child(2) `grid-column: 8 / 13; grid-row: 1 / 2;`, nth-child(3) `grid-column: 8 / 13; grid-row: 2 / 3;`; for `[data-size="3"][data-side="right"]` nth-child(1) `grid-column: 6 / 13; grid-row: 1 / 3;`, nth-child(2) `grid-column: 1 / 6; grid-row: 1 / 2;`, nth-child(3) `grid-column: 1 / 6; grid-row: 2 / 3;`; for `[data-size="2"][data-side="left"]` nth-child(1) `grid-column: 1 / 8; grid-row: 1 / 3;`, nth-child(2) `grid-column: 8 / 13; grid-row: 1 / 2;`; for `[data-size="2"][data-side="right"]` nth-child(1) `grid-column: 6 / 13; grid-row: 1 / 3;`, nth-child(2) `grid-column: 1 / 6; grid-row: 1 / 2;`; for `[data-size="1"]` the group gets `grid-auto-rows: 11vw;` and nth-child(1) `grid-column: 1 / 13; grid-row: 1 / 2;`.
      then the mobile rules: `@media (max-width: 800px) { .editions-grid__group, .editions-grid__group[data-size="1"] { grid-template-columns: 1fr; grid-auto-rows: auto; } .editions-grid__group .tile { grid-column: 1 !important; grid-row: auto !important; aspect-ratio: 3 / 4; } .tile--hero .tile__title { font-size: clamp(28px, 9vw, 40px); } }`
  Do NOT reference any deleted class name in a new CSS comment (it would echo into the built file and trip the removal check in the verify step).
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5 && for f in src/pages/editions/index.astro src/pages/en/editions/index.astro; do grep -q 'editions-grid__group' "$f" && grep -q 'tile--hero' "$f" && grep -q 'tile--small .tile__statement' "$f" || { echo "FAIL new grid classes missing in $f"; exit 1; }; test "$(grep -Ec 'editions-list__(row|photo|text|title|statement)' "$f")" -eq 0 || { echo "FAIL stale zigzag class remains in $f"; exit 1; }; grep -q 'weight-black' "$f" && { echo "FAIL invented --weight-black token in $f"; exit 1; }; done; grep -q "variant === 'bold'" src/components/EmptyState.astro && grep -q 'empty-state--bold' src/components/EmptyState.astro || { echo "FAIL EmptyState bold variant missing"; exit 1; }; echo OK</automated>
  </verify>
  <done>`npm run build` succeeds (Sanity fetch of the 2 real éditions included). Both overview twins contain the new `.editions-grid`/`.tile` markup + CSS, carry no `editions-list__(row|photo|text|title|statement)` selector, and use no `--weight-black`. EmptyState exposes an opt-in `bold` variant while its plain default is unchanged; both overview pages pass `variant="bold"` to their empty-state call. FR and EN twins are identical except locale strings, SEO copy, and import depth.</done>
</task>

<task type="auto">
  <name>Task 2: Restyle the format-details line on both détail pages (bold + uppercase + pink underline)</name>
  <files>src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro</files>
  <action>
Two files, IDENTICAL CSS edit (the `<style>` blocks are byte-identical twins). Change ONLY the `.edition-detail__format` CSS rule — do not touch the frontmatter, the `formatText` string composition, the markup, the hero, back-link, statement, thumbnail grid, `headerVariant="transparent"`, or any other rule. This is the sketch-003 "Synthesis" winner: keep today's whole page, restyle only this one line.

Replace the current `.edition-detail__format` body:
  from `font-size: var(--text-label-size); font-weight: var(--weight-regular); line-height: var(--text-label-leading); color: var(--color-ink); margin: var(--space-2xl) 0;`
  to `display: inline-block; font-size: var(--text-label-size); font-weight: var(--weight-semibold); line-height: var(--text-label-leading); text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-ink); border-bottom: 2px solid var(--color-accent); padding-bottom: var(--space-sm); margin: 0 0 var(--space-2xl);`

Notes:
  - `display: inline-block` makes the pink `border-bottom` underline hug the text width (not full-bleed), exactly as in `#variant-synth1 .detail__format`. The margin shifts from `2xl 0` to `0 0 2xl` because the preceding `.edition-detail__statement` already carries a `0 0 2xl` bottom margin — this preserves the existing vertical gap above the line without doubling it, and keeps the 2xl gap below (before the thumbnail grid).
  - Update the existing `/* D-09/D-10: compact Label-role line … */` comment to state the new sketch-003 synthesis treatment (bold uppercase + pink accent underline) while KEEPING the note that this stays inside the EDN-06 "informational, not a product-spec / not a commerce affordance" boundary.
  - `text-transform: uppercase` is a paint-time visual transform only: `HTMLElement.innerText` (what Playwright reads) returns the ORIGINAL case, so `formatText` stays `Pages : … Tirage : …` / `Pages: … Print run: …` in the DOM — the existing e2e `/Tirage/`, `/Print run/`, `/cm|in/` assertions and `verify-static-artifact.mjs` remain valid. Do not change `formatText`.
  </action>
  <verify>
    <automated>for f in src/pages/editions/\[slug\].astro src/pages/en/editions/\[slug\].astro; do grep -q 'text-transform: uppercase' "$f" && grep -q 'border-bottom: 2px solid var(--color-accent)' "$f" || { echo "FAIL format restyle missing in $f"; exit 1; }; done; npm run build 2>&1 | tail -3; echo OK</automated>
  </verify>
  <done>Both détail twins render `.edition-detail__format` as an inline-block, bold, uppercase, pink-underlined line; `formatText`, markup, and all other CSS/props are unchanged; `npm run build` succeeds.</done>
</task>

<task type="auto">
  <name>Task 3: Repair the entire edition e2e suite for the new markup + swap the grid regression guard</name>
  <files>tests/e2e/edition.spec.ts</files>
  <action>
Update `tests/e2e/edition.spec.ts` so no locator references the deleted zigzag classes and the layout guard tests the NEW grid. Keep the file's structure, the `wholeWordCommerceTokens`/`containsForbiddenCommerceToken` helpers, and the `planner-discipline-allow` comment on line 16 unchanged. Preserve the "derive the détail URL dynamically from the overview, never hardcode a slug, never use the main nav" convention. Update the stale Phase 12 header comments to reflect that these routes now exist and use the Poster Grid.

Edits by describe block:

1. `editions overview` — test "lists each published édition …": replace `.editions-list__row` first-match with `.tile` first-match (the first `.tile` in DOM order is the group-1 hero, which keeps its statement). Read title from `.tile__title`, statement from `.tile__statement` (hero statement is visible — assert non-empty). Keep the href assertion `toMatch(/\/editions\/[^/]+\/?$/)` (the tile IS the `<a>`, so `getAttribute('href')` works directly; the `xpath=ancestor::a` fallback can be dropped). Update the test title from "…as a linked row…" to "…as a linked tile…".

2. `editions overview` — test "renders the English overview …": same selector swaps (`.editions-list__row`→`.tile`, `.editions-list__statement`→`.tile__statement`); keep the fr≠en statement assertion and the `/\/en\/editions\/[^/]+\/?$/` href assertion.

3. `editions overview` — test "shows no price… (EDN-06)": unchanged (it reads `main` innerText; still valid).

4. `editions detail`, `editions lightbox`, `no commerce affordances (detail)`: in each, change the URL-discovery locator from `page.locator('.editions-list__row').first()` to `page.locator('.tile').first()`. Everything downstream (`.edition-detail__*` selectors, `/Tirage/`, `/Print run/`, `/cm|in/`, back-link href regexes, lightbox counter/data-index logic, srcset checks) is unchanged and still correct.

5. `editions overview layout` (the OLD zigzag regression guard for quick task 260723-r1e) — REPLACE its premise. The zigzag reversed-row bug class no longer exists. Write an equivalent guard for the NEW grid using today's real 2-item group. Keep `test.use({ viewport: { width: 1280, height: 900 } })`. New test (title should contain a stable phrase like "hero tile is larger than and left of its sibling small tile"): for each URL in `['/editions/', '/en/editions/']` →
     - locate the first `.editions-grid__group`; assert `toHaveAttribute('data-size', '2')` and `toHaveAttribute('data-side', 'left')` (today's real state: one trailing group of 2, side=left for group index 0);
     - `hero = group.locator('.tile--hero')`, `small = group.locator('.tile--small').first()`; read `boundingBox()` for both, assert non-null;
     - assert `heroBox.width > smallBox.width` (hero spans 7 of 12 cols vs 5), `heroBox.height > smallBox.height` (hero spans 2 grid rows vs 1), `heroBox.x < smallBox.x` (side=left → hero on the left), and `Math.abs(heroBox.y - smallBox.y) < 4` (both top-aligned to the group's first row). These four relations regress the grouping CSS if the hero span, side alternation, or row placement breaks.

No new imports, no new dependencies, match the existing Playwright `test`/`expect` style.
  </action>
  <verify>
    <automated>test "$(grep -Ec 'editions-list__(row|photo|text|title|statement)' tests/e2e/edition.spec.ts)" -eq 0 || { echo "FAIL stale zigzag locator remains"; exit 1; }; grep -q "data-size', '2'" tests/e2e/edition.spec.ts && grep -q '.tile--hero' tests/e2e/edition.spec.ts || { echo "FAIL new grid guard missing"; exit 1; }; npm run build && npm run test:e2e -- tests/e2e/edition.spec.ts && npm run test:artifact && npm run test:unit</automated>
  </verify>
  <done>`tests/e2e/edition.spec.ts` references no `editions-list__(row|photo|text|title|statement)` selector; every describe block (overview x3, detail, lightbox, commerce-detail, layout) passes against the rebuilt markup; the new grid guard asserts hero > small in width/height and hero-left-of-small, top-aligned, for today's 2-item group in both locales; `test:artifact` and `test:unit` are green; `npm run build` succeeds.</done>
</task>

</tasks>

<threat_model>
No new trust boundary is introduced. All rendered content is fetched at BUILD time from the already-trusted Sanity Content Lake (published perspective) and emitted as static HTML/CSS — there is no request-time compute, no user input, and no new dependency. The only behavioral surface is presentational (layout + one restyled line). The single standing control to preserve is EDN-06 (no commerce affordance): enforced by `tests/scripts/verify-static-artifact.mjs` (unchanged) plus the two `no commerce affordances` e2e tests, both re-run in Task 3.

| Threat ID | Category | Component | Severity | Disposition | Mitigation |
|-----------|----------|-----------|----------|-------------|------------|
| T-txi-01 | Information Disclosure | Accidental commerce/price copy leaking into overview or detail markup | low | mitigate | `npm run test:artifact` + the EDN-06 e2e tests re-run in Task 3; "Voir l'édition"/"View edition" is nav-only text with no commerce token |
| T-txi-SC | Tampering | npm/pip/cargo installs | n/a | accept | No package installs in this plan (plain CSS/Astro only) — nothing to audit |
</threat_model>

<verification>
- `npm run build` succeeds with the 2 real published éditions (Rebut, Silos).
- `npm run test:e2e -- tests/e2e/edition.spec.ts` passes fully (all describe blocks).
- `npm run test:artifact` and `npm run test:unit` stay green.
- Manual (recommended, not gating): `npm run preview`, open `/editions/` and `/en/editions/` at desktop and ~375px width — confirm the hero+small poster grouping, hero-only statement, alternating side rule (visible once ≥3 éditions exist), and the bold dashed empty state look intentional; open a détail page and confirm the format line is bold/uppercase with a pink underline and nothing else moved.
</verification>

<success_criteria>
- Both overview twins render the Poster Grid (grouped-by-3, alternating hero side) over the real `getEditions()` order; today's 2 éditions show as one size-2 group.
- Small tiles are title-only; hero tiles keep the statement.
- Bold empty state available via opt-in EmptyState variant with no default-look regression.
- Both détail twins show the bold-uppercase pink-underlined format line; nothing else on the detail page changed.
- Overview keeps the solid header; détail keeps the transparent header.
- EDN-06 preserved on all four pages.
- Full edition e2e spec + artifact + unit tests green; build succeeds; FR/EN twins kept in parity.
</success_criteria>

<output>
Create `.planning/quick/260723-txi-rebuild-the-editions-overview-page-as-th/260723-txi-SUMMARY.md` when done.
</output>
