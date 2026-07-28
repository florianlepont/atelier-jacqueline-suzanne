---
phase: quick-260728-dbf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/image.ts
  - tests/unit/image.test.ts
  - src/pages/editions/index.astro
  - src/pages/en/editions/index.astro
  - src/components/EditionsOverviewBody.astro
  - tests/e2e/edition.spec.ts
  - tests/e2e/gallery.spec.ts
  - tests/e2e/accessibility.spec.ts
autonomous: true
requirements:
  - "EDN-REDESIGN: replace the Éditions overview zigzag grid with sketch 010 variant B2 (Cursor Preview), the Romane-confirmed winner"
  - "EDN-06: zero commerce affordance preserved through the redesign (build-blocking guard)"
user_setup: []

must_haves:
  truths:
    - "Both /editions/ and /en/editions/ render a plain vertical list of text-only rows (index label + big title + statement) — no photo-tile grid, no inline thumbnail per row."
    - "On desktop (>800px), hovering a row reveals that row's statement AND a ~340px 3:4 photo panel appears and follows the cursor, showing that row's photo; non-hovered titles dim."
    - "On mobile (≤800px), the floating preview panel is hidden entirely and every row's statement is always visible."
    - "The zero-éditions EmptyState fallback still renders unchanged when there are no éditions."
    - "No commerce affordance appears on either overview route (EDN-06 build guard `npm run test:artifact` passes)."
    - "The page header (top hairline + eyebrow + h1 heading) is byte-unchanged from today; both locales render identical structure."
    - "The overview photo panel uses a 3:4 portrait crop (not the old 1:1 square crop)."
  artifacts:
    - src/lib/image.ts
    - src/components/EditionsOverviewBody.astro
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - tests/e2e/edition.spec.ts
  key_links:
    - "Route frontmatter builds imgSrc via the new previewPanelUrl(edition.leadPhoto, 680) → component renders it as the row's data-img attribute → client script copies data-img into the floating panel's <img> src on mouseenter."
    - "The row link class `.editions-index__row` is the single selector shared by the component template AND every navigating test (edition/gallery/accessibility specs) — it replaces the old `.tile`."
    - "Hover state chain: `.editions-index__row:hover` reveals `.editions-index__statement` (CSS) while the JS adds `.active` to `.editions-preview`; the ≤800px media query overrides both to the always-visible / hidden-panel mobile state."
---

<objective>
Replace the Éditions overview page's visual design with the "B2 — Cursor Preview" pattern from sketch 010 (`.planning/sketches/010-editions-overview-layout/index.html`, `#variant-b2` + its CSS + the "B2 / B4 — shared floating preview panel" script). The sketch is authoritative and Romane-confirmed — port it faithfully, do NOT re-derive the design.

The current overview renders an asymmetric zigzag "poster grid" of full-bleed photo tiles. The new direction drops the grid entirely: a plain vertical list of text-only rows (index / big title / statement), and on hover a large clean-color 3:4 photo panel appears and follows the cursor while non-hovered titles dim. On touch/mobile the panel is hidden and statements are always visible.

This is a redesign of ONE shared component (`EditionsOverviewBody.astro`) plus the minimal supporting changes: a new 3:4-crop image helper wired into both route files, and rewritten e2e assertions for the new structure.

Purpose: Ship the design Romane approved; retire the hover treatment she disliked.
Output: Rewritten overview component, new `previewPanelUrl` helper + unit test, both routes wired to it, and adapted e2e coverage.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

# Authoritative design source — port B2 faithfully (markup #variant-b2, its CSS block, and the "B2 / B4 — shared floating preview panel" IIFE near the bottom). The B4-specific `.hitem` half of that IIFE does NOT apply.
@.planning/sketches/010-editions-overview-layout/index.html

# The component being redesigned (props stay unchanged); the two route files (only imgSrc's helper swaps); the image helpers; the tests to adapt.
@src/components/EditionsOverviewBody.astro
@src/lib/image.ts
@src/pages/editions/index.astro
@src/pages/en/editions/index.astro
@tests/e2e/edition.spec.ts
@tests/unit/image.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add previewPanelUrl 3:4-crop helper (+ unit test) and wire both routes to it</name>
  <files>src/lib/image.ts, tests/unit/image.test.ts, src/pages/editions/index.astro, src/pages/en/editions/index.astro</files>
  <action>
None of the existing image helpers produce a portrait crop matching the new preview panel's 3:4 aspect ratio, so the old square-cropped imgSrc would look wrong inside a 3:4 panel.

In `src/lib/image.ts`, add an exported `previewPanelUrl(img: GalleryImage, width = 680): string` immediately after `thumbnailUrl`. It mirrors `thumbnailUrl` exactly but produces a 3:4 portrait crop instead of 1:1: `builder.image(img).width(width).height(Math.round((width * 4) / 3)).fit('crop').auto('format').url()`. Give it a doc comment noting it is the éditions overview cursor-follow preview crop (sketch 010 B2), same crop idea as thumbnailUrl but portrait. Do not modify any existing helper.

In `tests/unit/image.test.ts`, add `previewPanelUrl` to the import list from `../../src/lib/image`, and add one `it(...)` mirroring the existing thumbnail test that asserts the default-width URL contains `width:680|height:907|fit:crop|auto:format` (680 * 4 / 3 = 906.67 → rounds to 907).

In BOTH `src/pages/editions/index.astro` and `src/pages/en/editions/index.astro`: change the image import from `{ thumbnailUrl, responsiveThumbnailSrcSet }` to `{ previewPanelUrl, responsiveThumbnailSrcSet }`, and change the tile's `imgSrc` from `thumbnailUrl(edition.leadPhoto, 600)` to `previewPanelUrl(edition.leadPhoto, 680)`. Leave the `imgSrcset: responsiveThumbnailSrcSet(edition.leadPhoto)` line EXACTLY as today (it becomes unused by the new template but still satisfies the required `imgSrcset` prop — do not delete it, removing it is unnecessary scope). Do not change the `tiles.map()` shape, the Props passed to EditionsOverviewBody, alt resolution, or any SEO strings.
  </action>
  <verify>
    <automated>npm run test:unit -- image && npm run typecheck</automated>
  </verify>
  <done>`previewPanelUrl` exists and is unit-tested; both routes import and use it for imgSrc; `responsiveThumbnailSrcSet`/`imgSrcset` remain; typecheck passes with no unused-import error.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite EditionsOverviewBody to the B2 Cursor-Preview design (markup + CSS + JS)</name>
  <files>src/components/EditionsOverviewBody.astro</files>
  <action>
Replace ONLY the non-empty branch's markup, the whole `<style>` block, and add a client `<script>`. Do NOT change the frontmatter `interface Props`, the `EditionTile` interface, the destructure, the `groups` chunking can be removed (B2 is a flat list, not groups). Keep the `<header class="editions-list__header">` (eyebrow + `<h1>{heading}</h1>`) and its top-hairline styles EXACTLY as today — every sketch variant kept this shared editorial chrome. Keep the `tiles.length === 0` branch rendering `<EmptyState heading={emptyHeading} body={emptyBody} variant="bold" />` unchanged.

MARKUP (non-empty branch) — replace the `.editions-grid` block. Render a flat list plus the floating panel, both only inside the non-empty branch:
- Container `<div class="editions-index">` mapping `tiles` in existing order (never re-sort). For each `tile` at index `idx`, render `<a class="editions-index__row" href={tile.href} data-img={tile.imgSrc}>` containing, in order: `<span class="editions-index__number">{indexLabel}</span>`, `<h2 class="editions-index__title">{tile.title}</h2>`, `<p class="editions-index__statement">{tile.statement}</p>`, and the existing `<span class="sr-only">{viewEditionLabel}</span>` (keep it — it preserves the link's accessible purpose).
- `indexLabel` = the localized singular noun derived from `heading` by stripping a trailing "s", plus a space, plus the zero-padded position: compute `const label = \`${heading.replace(/s$/, '')} ${String(idx + 1).padStart(2, '0')}\``. This yields "Édition 01" (fr) / "Edition 01" (en) with NO Props change and correct per-locale wording. Compute it inline in the map.
- Immediately AFTER `</div>` of `.editions-index`, still inside the non-empty branch, render the floating panel: `<div class="editions-preview" aria-hidden="true"><img src="" alt="" /></div>`.

CSS — replace the entire `<style>` block. Keep the existing `.editions-list`, `.editions-list__header`, `.editions-list__eyebrow`, and `.editions-list h1` rules byte-for-byte (page shell + header chrome). Delete every `.editions-grid*` / `.tile*` rule. Add these ported B2 rules (exact values from the sketch's `#variant-b2` block, un-scoped). NOTE: `.editions-index` must NOT re-apply page width/padding — the `.editions-list` article wrapper already provides them; the sketch's `.stack2` only set width/padding because it had no wrapper. So:
- `.editions-index { position: relative; }`
- `.editions-index__row { display: block; padding: var(--space-xl) 0; border-bottom: var(--border-hairline) solid var(--color-border); text-decoration: none; color: var(--color-ink); }`
- `.editions-index__row:first-of-type { border-top: var(--border-hairline) solid var(--color-ink); }`
- `.editions-index__number { font-size: 13px; color: #6b6b6b; font-weight: var(--weight-semibold); letter-spacing: 0.08em; margin-bottom: var(--space-sm); display: block; }` — neutral gray #6b6b6b, NOT pink (explicit sketch fix).
- `.editions-index__title { font-family: var(--font-display); font-weight: var(--weight-semibold); font-size: clamp(32px, 5vw, 64px); line-height: 0.95; letter-spacing: -0.02em; margin: 0; transition: opacity 0.25s ease; }` — clamp(32px, 5vw, 64px) is the intentionally-shrunk value; margin:0 zeroes the h2 default.
- `.editions-index__statement { max-width: 46ch; line-height: 1.5; margin: var(--space-sm) 0 0; color: #6b6b6b; max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease; }`
- Dim + reveal: `.editions-index:hover .editions-index__title { opacity: 0.28; }` then `.editions-index__row:hover .editions-index__title { opacity: 1; }` then `.editions-index__row:hover .editions-index__statement { max-height: 80px; opacity: 1; }`.
- Keyboard parity (preserves a11y coverage — keyboard users get the same reveal + a visible focus ring): `.editions-index__row:focus-visible { outline: 2px solid var(--color-accent); outline-offset: var(--focus-ring-offset); }`, `.editions-index__row:focus-visible .editions-index__title { opacity: 1; }`, `.editions-index__row:focus-visible .editions-index__statement { max-height: 80px; opacity: 1; }`.
- Floating panel: `.editions-preview { position: fixed; top: 0; left: 0; width: 340px; aspect-ratio: 3 / 4; z-index: 9997; pointer-events: none; opacity: 0; transform: translate(-1000px, -1000px) scale(0.96); transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; box-shadow: 0 24px 48px -12px rgba(26, 26, 26, 0.35); background: var(--gray-0); }`
- `.editions-preview.active { opacity: 1; }`
- `.editions-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }`
- Mobile: `@media (max-width: 800px) { .editions-index__statement { max-height: none; opacity: 1; margin-top: var(--space-sm); } .editions-preview { display: none; } }`

JS — add ONE Astro-processed `<script>` at the end of the component (a client module; it only touches the DOM, so it must NOT import `../lib/image` or `../lib/sanity`). Port the B2 half of the sketch's shared-preview IIFE, guarded for the empty state:
- `const preview = document.querySelector('.editions-preview'); const previewImg = preview?.querySelector('img'); const container = document.querySelector('.editions-index'); if (!preview || !previewImg || !container) return;` (wrap in an IIFE or guard so early-return is valid).
- `container.addEventListener('mousemove', (e) => { preview.style.transform = \`translate(${e.clientX + 28}px, ${e.clientY - preview.offsetHeight / 2}px)\`; });`
- For each `.editions-index__row`: on `mouseenter` set `previewImg.src = row.dataset.img` and `preview.classList.add('active')`; on `mouseleave` `preview.classList.remove('active')`.

Do NOT port any duotone / negative / mask-spotlight mechanics from sketches 009/011, and do NOT add a `.dt` component — B2 uses plain unfiltered color photos. Do not spell any EDN-06 forbidden commerce token into any comment or string (the copy is data-driven from Sanity; no static commerce text belongs here).
  </action>
  <verify>
    <automated>npm run typecheck && npm run build && npm run test:artifact</automated>
  </verify>
  <done>Both overview routes build as a text-row list with a fixed 3:4 preview panel; header + EmptyState unchanged; `npm run test:artifact` (EDN-06 guard) passes; no `.editions-grid`/`.tile` markup remains in the component.</done>
</task>

<task type="auto">
  <name>Task 3: Rewrite the overview e2e assertions and update all navigation selectors</name>
  <files>tests/e2e/edition.spec.ts, tests/e2e/gallery.spec.ts, tests/e2e/accessibility.spec.ts</files>
  <action>
The redesign intentionally invalidates the OLD structural assertions — rewrite them for the new design; preserve functional / i18n / EDN-06 / accessibility intent, never silently drop it.

In `tests/e2e/edition.spec.ts`:
- `describe('editions overview')` — Test 1 ("lists each published édition..."): replace `.tile` → `.editions-index__row`, `.tile__title` → `.editions-index__title`, `.tile__statement` → `.editions-index__statement`. REMOVE the `tile.locator('img')...toBeVisible()` assertion (the new rows have no inline image; the photo lives only in the hover-activated floating panel — covered by the new hover test below). Read the statement via `.textContent()` NOT `.innerText()` (the statement is CSS-hidden `opacity:0/max-height:0` until hover, but its text is always in the DOM — `textContent` is state-independent, matching the pattern already used at edition.spec.ts's detail no-JS reachability test). Keep the title non-empty check and the `href` `/editions/[^/]+/?$` check.
- Test 2 ("renders the English overview..."): same selector swaps; compare fr vs en statement via `.textContent()`; keep the `/en/editions/[^/]+/?$` href check.
- Test 3 (EDN-06 `main` innerText token scan): KEEP AS-IS — it is structure-agnostic.
- `describe('editions overview layout')`: DELETE the entire `hero tile is larger than and left of its sibling small tile` test (it asserts the removed zigzag grid's data-size/data-side/bounding-box geometry). REPLACE it with a new test in the same describe block, keeping `test.use({ viewport: { width: 1280, height: 900 } })` (desktop > 800px so the panel is active; this file runs only on the chromium project). New test, run for both `/editions/` and `/en/editions/`: locate `.editions-preview` and `.editions-index__row` rows; assert the panel starts inactive (`await expect(preview).not.toHaveClass(/active/)`); `await firstRow.hover()`; assert `await expect(preview).toHaveClass(/active/)`, assert `await expect(firstRow.locator('.editions-index__statement')).toBeVisible()` (hover expands max-height:0 → 80px, so Playwright now sees a non-zero box), and assert the panel image src matches the hovered row — read `await firstRow.getAttribute('data-img')` and `await preview.locator('img').getAttribute('src')` and `expect(...).toBe(...)`; then hover the second row and assert the panel img src updates to the second row's `data-img`.
- Every OTHER `.tile` reference in this file (the détail / related-gallery / lightbox / no-commerce-detail / reduced-motion / scroll-hint describe blocks at ~lines 116, 170, 191, 212, 284, 317, 349, 373, plus the two explanatory header comments at ~lines 7 and 108 that say "first `.tile` href"): replace the selector `.tile` → `.editions-index__row`. These only DISCOVER the détail URL from the overview's first row; their intent is unchanged.

In `tests/e2e/gallery.spec.ts`: at the two spots that navigate `/editions/` then read `.tile` first href (the `feature scoping — inert on edition heroes` test ~line 741, and the `scoping: footer is still present on an édition detail page` test ~line 805), replace `.tile` → `.editions-index__row`. Do not touch the `a.home-grid__tile` gallery-navigation selectors.

In `tests/e2e/accessibility.spec.ts`: the édition-détail a11y test discovers the détail URL from `/editions/`'s first `.tile` (~line 32, plus the comment ~line 26) — replace `.tile` → `.editions-index__row`.

Do NOT modify `tests/e2e/seo.spec.ts` or `tests/e2e/site-header.spec.ts`. Do NOT alter the `wholeWordCommerceTokens`/`prefixCommerceTokens`/`symbolCommerceTokens` arrays or the `planner-discipline-allow` marker in edition.spec.ts.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/edition.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/gallery.spec.ts</automated>
  </verify>
  <done>The overview list/hover/i18n/EDN-06/a11y intents all pass against the new markup; no `.tile`/`.tile__*`/`data-size`/`data-side` overview assertions remain; seo/site-header specs untouched.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Sanity content → build-time render | Édition titles/statements/photos are authored content, rendered into static HTML at build; the EDN-06 guard is the trust check that no commerce affordance leaks in. |
| client hover script → DOM | The preview script reads `data-img` (build-emitted, from previewPanelUrl) and writes it to an `<img>.src`; no user input, no network beyond the Sanity CDN image the page already references. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-dbf-01 | Information Disclosure | EDN-06 commerce-token guard on the new overview markup | high | mitigate | Keep EDN-06 coverage: the `main` innerText token scan (edition.spec.ts) stays as-is, and `npm run test:artifact` (verify-static-artifact.mjs) runs in Task 2's verify — no static commerce copy is introduced into the component. |
| T-dbf-02 | Tampering | `data-img` → `previewImg.src` assignment | low | accept | `data-img` is build-emitted from previewPanelUrl (a trusted Sanity CDN URL), not user-controlled; assigning it to `<img>.src` cannot execute script. No package installs in this task. |
| T-dbf-03 | Denial of Service | `.editions-preview` fixed z-index:9997 overlay | low | accept | Panel is `pointer-events: none` and only `opacity:1` while hovering a row; it never blocks interaction and is `display:none` ≤800px. Faithful to the confirmed sketch. |
</threat_model>

<verification>
Full gate, in order (matches the task brief):
1. `npm run typecheck && npm run test:coverage && npm run build && npm run test:artifact` — types, Vitest unit (incl. the new previewPanelUrl test) with coverage thresholds, static build, and the EDN-06 build-blocking guard.
2. `npx playwright test tests/e2e/edition.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/gallery.spec.ts tests/e2e/seo.spec.ts tests/e2e/site-header.spec.ts` — the specifically-affected e2e files (seo/site-header included to prove they were NOT collaterally broken).
3. Full e2e suite (`npm run test:e2e`) green.
</verification>

<success_criteria>
- Both /editions/ and /en/editions/ render the B2 text-row list; hovering a row (desktop) reveals its statement and a cursor-following 3:4 photo panel showing that row's photo; non-hovered titles dim.
- ≤800px: panel hidden, statements always visible.
- Header (hairline + eyebrow + h1) and the zero-éditions EmptyState are unchanged.
- `previewPanelUrl` produces a 3:4 crop and is unit-tested; both routes use it for imgSrc; Props interface unchanged.
- EDN-06 guard passes; full unit + e2e suite green; seo/site-header specs untouched.
</success_criteria>

<output>
Create `.planning/quick/260728-dbf-redesign-ditions-overview-page-editionso/260728-dbf-SUMMARY.md` when done.
</output>
