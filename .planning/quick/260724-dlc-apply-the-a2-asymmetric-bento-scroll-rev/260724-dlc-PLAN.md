---
phase: 260724-dlc
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [SKETCH-004-A2]
files_modified:
  - src/components/GalleryGrid.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/components/Lightbox.astro
  - tests/e2e/gallery.spec.ts
  - tests/e2e/edition.spec.ts

must_haves:
  truths:
    - "Every gallery/édition detail page (FR+EN) renders its thumbnails as an asymmetric bento (hero + up to 2 stacked smalls per group, side alternating by group index) instead of a uniform 3-column grid."
    - "Tiles fade/slide in with a staggered scroll-reveal as they enter the viewport; when JS or IntersectionObserver is unavailable, all tiles are fully visible."
    - "Clicking a tile opens the shared Lightbox with a View-Transitions morph when startViewTransition is supported; closing via button, Escape, or backdrop morphs back to the originating thumbnail."
    - "Prev/next navigation inside an already-open Lightbox mutates the image WITHOUT any morph."
    - "The bento composition is correct and intentional at real counts 2, 3, 5, 6, 7 and 11 (trailing groups of 1 and 2 both handled)."
    - "With View Transitions unsupported, every existing Lightbox behavior (open, prev/next, counter, credit, Escape-close, focus return) is byte-for-byte unchanged; the morph is purely additive."
    - "prefers-reduced-motion:reduce disables morph animation (animation:none) and the scroll-reveal leaves tiles visible with no motion."
  artifacts:
    - src/components/GalleryGrid.astro
    - src/components/Lightbox.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - tests/e2e/gallery.spec.ts
    - tests/e2e/edition.spec.ts
  key_links:
    - "data-gallery-thumb + numeric data-index attribute contract preserved on every tile so Lightbox's single document-wide click listener keeps binding unchanged."
    - "Lightbox resolves the morph source/target as trigger.querySelector('img') on the recorded trigger button, reused for focus-return AND morph."
    - "view-transition-name is assigned imperatively to exactly one element at a time (clicked thumbnail img <-> Lightbox persistent img), never statically in CSS."
    - "Build-time chunk-by-3 grouping produces ceil(N/3) groups whose data-size (1|2|3) + data-side (left|right) drive the ported bento CSS, generalizing to any count."
---

<objective>
Apply sketch 004 variant A2 (approved winner) to the shared `GalleryGrid.astro`
thumbnail grid used by BOTH Portfolio gallery detail pages and Éditions detail
pages, in both locales: an asymmetric bento layout, a staggered
IntersectionObserver scroll-reveal, and a click-to-expand View Transitions morph
wired into the existing shared `Lightbox.astro` open/close lifecycle.

Purpose: The Éditions overview already ships the bold asymmetric Poster Grid;
the shared thumbnail grid below every detail hero is still the old uniform
3-column grid. This closes that visual gap with a single shared component so the
treatment is consistent across two page families and both locales, and adds the
polish (reveal + morph) the sketch validated.

Design-philosophy change (documented deliberately): `GalleryGrid.astro` moves
from a content-agnostic `<slot/>` wrapper to a **props-based** component that
performs the same build-time chunk-by-3 / alternate-side grouping already proven
in `editions/index.astro`. This is chosen over fragile CSS `:nth-child` /
`:nth-last-child` "quantity query" trickery because the real grid must be
correct at every count from 2 to 11+, and porting the shipped, count-generalized
`data-size`/`data-side` pattern is the lowest-risk way to guarantee that.

Output: A rebuilt `GalleryGrid.astro`, four re-plumbed calling pages, a
morph-capable `Lightbox.astro`, and extended e2e coverage — verified against
real Sanity content at multiple counts.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# Approved design (variant A2 is the winner) — read the #variant-a2 block:
#   bento nth-child CSS (~L107-119), .thumb/.revealed reveal CSS (~L118-129),
#   #morph-modal / ::view-transition-group CSS (~L131-142),
#   setupReveal / openMorph / closeMorph JS (~L264-325).
@.planning/sketches/004-thumbnail-grid-poster-treatment/index.html
@.planning/sketches/004-thumbnail-grid-poster-treatment/README.md

# The proven, count-generalized bento pattern to PORT (build-time editionGroups
# chunk-by-3 loop + the data-size/data-side nth-child CSS). Do NOT modify this
# page — it is the OVERVIEW grid and is out of scope; it is reference only.
@src/pages/editions/index.astro

# The established View Transitions convention in this codebase (narrow
# VTDocument type + typeof startViewTransition === 'function' guard, imperative
# viewTransitionName assignment right before the call, the <style is:global>
# block required for ::view-transition-* pseudo-elements at ~L1814, and the
# @media (prefers-reduced-motion: reduce) { animation: none !important } override
# at ~L1891). Reference only — do not modify.
@src/components/HomeCarousel.astro

# The five files being modified for the grid/pages/lightbox change:
@src/components/GalleryGrid.astro
@src/components/Lightbox.astro
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro

# The e2e specs (attribute-selector based, except one pinned class in edition.spec.ts ~L187):
@tests/e2e/gallery.spec.ts
@tests/e2e/edition.spec.ts
@tests/e2e/critical.smoke.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rebuild GalleryGrid.astro as a props-based bento grid with staggered scroll-reveal</name>
  <files>src/components/GalleryGrid.astro</files>
  <action>
Replace the entire `<slot/>` wrapper with a props-based component. Keep it
locale-agnostic — it receives fully-resolved, pre-localized strings only.

Frontmatter: define and export a `GalleryGridItem` interface with these fields
per thumbnail: `index` (number — the value for `data-index`, preserving the
Lightbox contract), `src` (string — already built by the caller via
`thumbnailUrl(img, 600)`), `srcset` (string — caller's
`responsiveThumbnailSrcSet(img)`), `alt` (string — empty for galleries,
localized for éditions), and `ariaLabel` (string — the fully-formed localized
label built by the caller). `Props` is `{ items: GalleryGridItem[] }`. The
component itself imports NOTHING from `src/lib/*` and never knows about Sanity
types — the caller does all data work.

Build-time grouping (port from `editions/index.astro`'s `editionGroups` loop):
chunk `items` into groups of 3 IN ORDER (`for (let i = 0; i < items.length; i +=
3) groups.push(items.slice(i, i + 3))`). Never re-sort.

Markup: render `<div class="gallery-grid">` containing, per group, a `<div
class="gallery-grid__group" data-size={group.length} data-side={g % 2 === 0 ?
'left' : 'right'}>`. Inside each group render one tile per item as a
`<button type="button" class:list={['tile', idx === 0 ? 'tile--hero' :
'tile--small']} data-gallery-thumb data-index={item.index}
aria-label={item.ariaLabel}>`. Inside the button: the `<img>` (src, srcset,
`alt={item.alt}`, `loading="lazy"`, `decoding="async"`, and role-aware
`sizes` — hero: `'(max-width: 800px) 100vw, 58vw'`, small: `'(max-width: 800px)
100vw, 40vw'`, mirroring the overview) followed by the expand-icon SVG. The
expand-icon MUST be the EXACT four-`<polyline>` corner-arrows SVG already shipped
as `.edition-detail__hero-expand-icon` (viewBox 0 0 24 24, width/height 24,
fill none, stroke currentColor, stroke-width 1.8, aria-hidden) — copy that
markup verbatim, class `tile__expand-icon`. No text overlay, no title, no
statement (these are secondary photos on an already-titled page; sketch A2 has
photo + hover expand-icon only). Preserve the `data-gallery-thumb` + numeric
`data-index` attributes EXACTLY — nothing else in the Lightbox listener depends
on class names.

Naming: use `tile` / `tile--hero` / `tile--small` / `tile__expand-icon`,
mirroring the Éditions overview's shipped naming for cross-codebase consistency
(the old `gallery-detail__thumb*` / `edition-detail__thumb*` classes are retired
here; `.edition-detail__thumb-button` is handled in Task 4).

CSS (scoped `<style>`) — PORT the geometry from `editions/index.astro` exactly:
`.gallery-grid` is `display:flex; flex-direction:column; gap:var(--space-md)`
(replaces the old grid wrapper). `.gallery-grid__group` is `display:grid;
grid-template-columns:repeat(12,1fr); grid-auto-rows:16vw; gap:var(--space-md)`.
Copy every `[data-size='3'|'2'|'1'][data-side='left'|'right'] .tile:nth-child(n)`
grid-column/grid-row rule from the overview (size-1 uses `grid-auto-rows:11vw`
and a full-width single tile; size-2 = hero + 1 small; size-3 = hero + 2
stacked smalls). Copy the `@media (max-width: 800px)` collapse to single column
with `.tile { grid-column:1 !important; grid-row:auto !important; aspect-ratio:
3 / 4 }`.

Tile visual/interaction — take from sketch A2's `.thumb`: `.tile` is
`position:relative; display:block; overflow:hidden; cursor:zoom-in; width:100%;
padding:0; border:var(--border-hairline) solid var(--color-ink);
background:var(--color-ink)`. `.tile img` is `position:absolute; inset:0;
width:100%; height:100%; object-fit:cover; transition:transform 0.3s ease`, and
`.tile:hover img, .tile:focus-visible img { transform: scale(1.03) }`.
`.tile:focus-visible { outline:2px solid var(--color-accent);
outline-offset:var(--focus-ring-offset) }`. `.tile__expand-icon` is
`position:absolute; bottom:var(--space-sm); right:var(--space-sm); z-index:3;
color:#fff; opacity:0; transition:opacity 0.15s ease; pointer-events:none`, and
`.tile:hover .tile__expand-icon, .tile:focus-visible .tile__expand-icon {
opacity:0.9 }`.

Staggered scroll-reveal: base state `.tile { opacity:0; transform:
translateY(24px); transition: opacity 0.5s ease, transform 0.5s ease }` and
`.tile.revealed { opacity:1; transform: translateY(0) }` (matches sketch A2).
Note the reveal transform is on `.tile` while the hover scale is on `.tile img`
— different elements, no conflict.

Two mandatory progressive-enhancement fallbacks so tiles are NEVER permanently
invisible:
  (a) No-JS: add a `<noscript>` element containing `<style is:inline>` whose
      rule is `.gallery-grid .tile { opacity: 1 !important; transform: none
      !important }`. Use `is:inline` so Astro leaves it un-scoped and
      un-hoisted; the literal class names still match the rendered DOM and
      `!important` wins.
  (b) No-IntersectionObserver support (JS runs but API absent): the reveal
      script must, as its first branch, feature-detect and if
      `!('IntersectionObserver' in window)` add the `revealed` class to every
      `.gallery-grid .tile` immediately and return.

Reveal script (scoped `<script>`, plain module, no imports): query all
`.gallery-grid .tile`. Apply fallback (b). Otherwise create one
IntersectionObserver with `{ threshold: 0.15 }`; on intersect, compute the
tile's index within the NodeList and `setTimeout(() => tile.classList.add(
'revealed'), index * 90)`, then `unobserve` that tile (one-shot). Observe every
tile. This is the exact `setupReveal` pattern from the sketch (90ms stagger,
0.15 threshold, one-shot). Match the codebase's existing progressive-enhancement
style (see HomeCarousel's load/error-listener island pattern).

Update the file's top comment to state the new props-based, bento contract and
WHY the slot→props change was made (robustness/correctness at arbitrary counts,
proven pattern reuse, avoids per-count CSS quantity-query hand-verification).
  </action>
  <verify>
    <automated>npm run build && node -e "const fs=require('fs'),p=require('path');const pick=d=>{if(!fs.existsSync(d))return null;for(const s of fs.readdirSync(d)){const f=p.join(d,s,'index.html');if(fs.existsSync(f))return f}return null};const files=[pick('dist/galleries'),pick('dist/editions')].filter(Boolean);if(files.length<2){throw new Error('expected a built gallery AND édition detail page, got '+files.length)}for(const f of files){const h=fs.readFileSync(f,'utf8');if(!/gallery-grid__group/.test(h)||!/data-size=/.test(h)||!/data-side=/.test(h))throw new Error('bento group markup missing from '+f);if(!/data-gallery-thumb/.test(h))throw new Error('data-gallery-thumb contract missing from '+f)}console.log('OK bento markup present in',files.join(' + '))"</automated>
  </verify>
  <done>`npm run build` succeeds; at least one built gallery AND one built édition detail page contains `.gallery-grid__group` wrappers with `data-size`/`data-side` attributes and `data-gallery-thumb` tiles; the component exports a `GalleryGridItem` interface and imports nothing from src/lib.</done>
</task>

<task type="auto">
  <name>Task 2: Re-plumb the four calling pages to pass thumbnail data as props</name>
  <files>src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro, src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro</files>
  <action>
In each of the four pages, replace the slotted `<GalleryGrid>...children...
</GalleryGrid>` JSX with `<GalleryGrid items={...} />`, building the `items`
array in frontmatter. Preserve each page's exact existing semantics — only the
delivery mechanism (slot → prop) changes.

Galleries FR (`src/pages/galleries/[slug].astro`): build items from
`gallery.images.slice(1)` with `const index = i + 1`, `src: thumbnailUrl(img,
600)`, `srcset: responsiveThumbnailSrcSet(img)`, `alt: ''` (decorative — real
alt lives on the separate hero), and `ariaLabel: \`Voir en taille réelle, image
${index + 1} sur ${gallery.images.length}\``. Keep the existing `gallery.images.
length > 1 &&` guard around the component.

Galleries EN (`src/pages/en/galleries/[slug].astro`): identical, but
`ariaLabel: \`View full size, image ${index + 1} of ${gallery.images.length}\``.

Éditions FR (`src/pages/editions/[slug].astro`): build items from
`(edition.images ?? [])` with `const index = i + 1`, `src`/`srcset` as above,
`alt: img.alt?.[locale] ?? ''` (real localized alt — édition thumbs are NOT
decorative), and `ariaLabel: \`Voir en taille réelle, image ${i + 2} sur
${total}\`` (the N+2 offset for the separate leadPhoto — preserve exactly). Keep
the existing `(edition.images?.length ?? 0) > 0 &&` guard.

Éditions EN (`src/pages/en/editions/[slug].astro`): identical, but
`ariaLabel: \`View full size, image ${i + 2} of ${total}\``.

Do NOT touch the hero, back-link, statement, or format-details sections, the
`getStaticPaths`, the Lightbox invocation, or any fetch/SEO logic.

Remove the now-dead thumbnail-specific CSS from each page's scoped `<style>`:
the `.gallery-detail__thumb-button`, `.gallery-detail__thumb` rules (galleries)
and `.edition-detail__thumb-button`, `.edition-detail__thumb` rules (éditions).
Those elements no longer exist on the page (the tile markup + styling now lives
inside GalleryGrid). LEAVE untouched every hero / hero-trigger / hero-img /
hero-scrim / hero-title / hero-expand-icon / back-link / statement / format
rule.
  </action>
  <verify>
    <automated>npm run build && npx astro check</automated>
  </verify>
  <done>All four pages compile and type-check; `npm run build` succeeds; each page passes `items` to `<GalleryGrid>` and no longer uses slotted children; dead `*-detail__thumb*` CSS is removed while all hero/statement/back-link/format CSS remains.</done>
</task>

<task type="auto">
  <name>Task 3: Wire the click-to-expand View Transitions morph into Lightbox.astro's open/close lifecycle</name>
  <files>src/components/Lightbox.astro</files>
  <action>
Add the morph to the existing vanilla-JS island, following the HomeCarousel View
Transitions convention exactly. The morph is purely additive — if
`document.startViewTransition` is undefined, every current behavior must be
byte-for-byte unchanged.

In the `<script>`, add the narrow VT type near the top of the guarded block:
a `VTDocument` type = `Document & { startViewTransition?: (cb: () => void) => {
finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void>
} }`, and `const vtDoc = document as VTDocument;` (mirror HomeCarousel's local
typing). Define a single morph name constant, e.g. `const MORPH_NAME =
'lightbox-morph';`.

Open path — modify `open(index, triggerEl)`: keep `current = index; trigger =
triggerEl;`. Resolve `const thumbImg = triggerEl.querySelector('img');` (every
trigger — gallery grid tile buttons, édition grid tile buttons, and the édition
hero button — contains an `<img>`). Define the mutation `doOpen` = a function
that clears `thumbImg`'s `style.viewTransitionName`, calls `render()`, calls
`dialog.showModal()`, then sets `imageEl.style.viewTransitionName = MORPH_NAME`.
If `thumbImg` exists AND `typeof vtDoc.startViewTransition === 'function'`: set
`thumbImg.style.viewTransitionName = MORPH_NAME` FIRST (so the OLD snapshot
captures the clicked thumbnail), then call `vtDoc.startViewTransition(doOpen)`
(the NEW snapshot then captures the Lightbox image). Else call `doOpen()`
directly (existing behavior; `showModal()` is still called exactly once, inside
doOpen). Only ONE element may carry the name at a time — the clear-then-reassign
inside doOpen guarantees the handoff.

Close path — add a single `closeWithMorph()` helper that ALL close paths funnel
through so the closing morph is consistent everywhere. It resolves `const
thumbImg = trigger?.querySelector('img');` and defines `doClose` = clear
`imageEl`'s viewTransitionName, set `thumbImg`'s viewTransitionName to
MORPH_NAME (so the NEW snapshot captures the destination thumbnail), then
`dialog.close()`. If `thumbImg` exists AND startViewTransition is a function:
ensure `imageEl.style.viewTransitionName = MORPH_NAME` (OLD snapshot = open
Lightbox image), call `vtDoc.startViewTransition(doClose)`, and on
`transition.finished` (use `.finally`/`.then(x,x)`) clear `thumbImg`'s
viewTransitionName so no stale name lingers. Else call `doClose()` directly.

Route the three close paths to `closeWithMorph()`:
  1. Close button — change the existing `closeBtn` click handler from `dialog.
     close()` to `closeWithMorph()`.
  2. Escape — add a `dialog.addEventListener('cancel', (e) => { e.preventDefault
     (); closeWithMorph(); })`. The native `cancel` event fires on Escape and is
     cancelable; preventing it stops the native close so the morph can run
     `dialog.close()` itself. (Do NOT add Escape handling to the existing
     ArrowLeft/ArrowRight keydown listener.)
  3. Backdrop click — add `dialog.addEventListener('click', (e) => { if (e.target
     === dialog) closeWithMorph(); })`. Only a click on the dialog's own
     backdrop area (not the image or control buttons, whose clicks target
     descendants) closes it — matches the sketch modal's backdrop-close.

Keep the existing `'close'` event listener that restores focus to `trigger`
exactly as-is — it still fires (from the `dialog.close()` inside doClose) and
still returns focus. Reuse the same `trigger` variable for BOTH focus-return and
the morph destination.

Prev/next — DO NOT touch `showPrev`/`showNext`/`render`. They must never be
wrapped in a transition. `render()` keeps mutating the persistent `<img>` in
place; even though `imageEl` retains its viewTransitionName while open, nothing
calls startViewTransition on navigation, so no morph occurs.

Global VT CSS — add a `<style is:global>` block (Astro's scoped `<style>` cannot
target `::view-transition-*`; mirror the HomeCarousel precedent). Include:
`::view-transition-group(lightbox-morph)`, `::view-transition-old(lightbox-morph)`,
`::view-transition-new(lightbox-morph)` with `animation-duration: 400ms;
animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1)` (matches the sketch's
0.4s and the codebase easing). Then the MANDATORY accessibility override — a
`@media (prefers-reduced-motion: reduce)` block setting `animation: none
!important` on `::view-transition-group(*)`, `::view-transition-old(*)`, and
`::view-transition-new(*)`. The View Transitions API does not honor this media
query on its own; this override is a hard requirement, not optional polish.

Leave the existing scoped `<style>` (dialog layout, controls, credit, counter)
untouched.
  </action>
  <verify>
    <automated>npm run build && npx astro check && node -e "const fs=require('fs');const s=fs.readFileSync('src/components/Lightbox.astro','utf8');const need=['startViewTransition','lightbox-morph','is:global',\"addEventListener('cancel'\",'prefers-reduced-motion: reduce'];const miss=need.filter(t=>!s.includes(t));if(miss.length){throw new Error('Lightbox missing: '+miss.join(', '))}console.log('OK lightbox morph wiring present')"</automated>
  </verify>
  <done>Build + type-check pass; Lightbox source contains the VTDocument-guarded startViewTransition calls, a single `lightbox-morph` name, a `<style is:global>` block with the `::view-transition-*` rules and the `prefers-reduced-motion: reduce { animation: none !important }` override, a `cancel`-event Escape handler, and a backdrop-click handler — all three close paths route through `closeWithMorph()`; showPrev/showNext/render are unchanged.</done>
</task>

<task type="auto">
  <name>Task 4: Update the pinned e2e assertion, add multi-count + morph coverage, and run full verification</name>
  <files>tests/e2e/edition.spec.ts, tests/e2e/gallery.spec.ts</files>
  <action>
Update the one pinned literal-class assertion, then add regression coverage that
proves the bento generalizes across real counts and that the morph fires on
open/close but never on prev/next. Then run the full verification sweep.

(1) `tests/e2e/edition.spec.ts` ~line 187: the assertion
`page.locator('.edition-detail__thumb-button').first()` targets a class that no
longer exists (tiles are now `.tile` inside `.gallery-grid`). Replace the
locator with a grid-scoped, attribute-based one that resolves the first GRID
thumbnail (excluding the hero at data-index 0): use
`page.locator('.gallery-grid [data-gallery-thumb]').first()`. Keep the existing
`toHaveAttribute('data-index', '1')` assertion and the subsequent
click/counter-`2 / ${total}`/srcset assertions unchanged. (The hero trigger is
outside `.gallery-grid`, so this correctly skips it.)

(2) Add a bento-layout regression test that GENERALIZES across counts (not
overfit to one). In `tests/e2e/gallery.spec.ts` add a `describe` with
`test.use({ viewport: { width: 1280, height: 900 } })` (mirrors the editions
overview layout test so it runs on both projects with desktop bento applied).
Discover every gallery detail href from the homepage grid (goto '/', click the
'Grille' button, read all `a.home-grid__tile` hrefs). For each gallery: goto the
href; count `N = page.locator('.gallery-grid [data-gallery-thumb]').count()` and
`G = page.locator('.gallery-grid__group').count()`; assert `G ===
Math.ceil(N / 3)`. For each group with `data-size` of '2' or '3': read the
`.tile--hero` and first `.tile--small` bounding boxes and assert hero width >
small width AND hero height > small height; and assert side alternation by group
index — even-index groups have hero.x < small.x (left), odd-index groups have
hero.x > small.x (right). This invariant test inherently covers Paysage=2 and
The Victorian Tea room=11 without hardcoding slugs, proving the algorithm is not
hardcoded to one count. Add an assertion that at least one discovered gallery
produced more than one group (proves chunking actually happens on real content).

(3) Add a morph test (also in gallery.spec.ts). Before navigation, install a
spy via `page.addInitScript` that, only if `document.startViewTransition` exists,
wraps it to increment `window.__vtCalls` and delegate to the original (preserve
real behavior so the transition still runs). Navigate to the first gallery
detail page. Detect support with
`await page.evaluate(() => typeof document.startViewTransition === 'function')`.
Universal assertions (run on every browser project): clicking a tile opens the
dialog; ArrowRight changes the counter; Escape closes the dialog AND returns
focus to the clicked tile; a backdrop click (click the dialog at a point outside
the image, e.g. via `dialog.click({ position: { x: 5, y: 5 } })`) also closes
it. Support-gated assertions (wrap in `if (supported)`): after the opening click
`window.__vtCalls` is >= 1; capture the count, press ArrowRight, and assert
`__vtCalls` did NOT increase (prev/next must not morph); press Escape and assert
`__vtCalls` increased again (close morph fired). Keep the test resilient on
WebKit (where startViewTransition is undefined) — the gated block simply
does not run, and the universal fallback assertions still prove zero functional
regression.

(4) Do NOT weaken or delete any existing assertion. The existing gallery lightbox
tests, the credit test, the dialog-visibility regression test, and
critical.smoke's `native dialog opens...` test must all still pass unchanged
(the morph is additive; Escape still closes + restores focus via the retained
`close` event listener).

(5) Run the full verification sweep and fix any regression before finishing:
`npm run build`, `npm run test:artifact`, `npm run test:unit`, and the FULL e2e
suite `npm run test:e2e` (both chromium and webkit-mobile projects) — not just
the gallery/edition specs, since GalleryGrid and Lightbox are central to
multiple page families.
  </action>
  <verify>
    <automated>npm run build && npm run test:artifact && npm run test:unit && npm run test:e2e</automated>
  </verify>
  <done>The pinned édition assertion uses a grid-scoped attribute locator and passes; the new bento-invariant test passes for every real gallery (G === ceil(N/3), hero larger than smalls, correct side alternation, at least one multi-group gallery); the morph test proves startViewTransition is invoked on open and close but NOT on prev/next (Chromium) and that dialog open/close/Escape/backdrop/focus-return work on every browser; `npm run test:artifact`, `npm run test:unit`, and the full `npm run test:e2e` all pass green.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time → static HTML | All thumbnail data is resolved at build time from the already-published Sanity dataset (published perspective) and emitted as static markup; no request-time compute, no user input crosses into this feature. |
| client JS → DOM only | The reveal + morph scripts read/write DOM and browser-native APIs (IntersectionObserver, View Transitions) only; they import nothing from `src/lib/sanity` and never touch tokens/secrets. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-dlc-01 | Tampering | Supply chain (deps) | low | accept | No new dependencies are added (constraint 5); View Transitions + IntersectionObserver are browser-native. No npm/pip/cargo install occurs, so the package-legitimacy gate is not applicable. |
| T-dlc-02 | Denial of Service | Scroll-reveal / morph client JS | low | mitigate | Progressive-enhancement fallbacks guarantee tiles stay visible and the Lightbox stays fully functional if JS, IntersectionObserver, or View Transitions are unavailable; reduced-motion disables animation. No infinite observers (one-shot `unobserve`). |
| T-dlc-03 | Information Disclosure | Client scripts | low | accept | Scripts operate on already-public, build-time-embedded image URLs and DOM only; no secret ever reaches the browser (same posture as the existing Lightbox/HomeCarousel islands). |
</threat_model>

<verification>
- `npm run build` succeeds (all four detail pages + both components compile).
- `npx astro check` passes (props types, no dead references).
- Built gallery AND édition detail pages contain `.gallery-grid__group` bento
  wrappers with `data-size`/`data-side` and `data-gallery-thumb` tiles.
- `npm run test:artifact` passes (no commerce leakage / static-artifact guards).
- `npm run test:unit` passes.
- Full `npm run test:e2e` passes on chromium AND webkit-mobile, including:
  - bento invariant across all real galleries (2 through 11+),
  - morph invoked on open + close but NOT on prev/next (Chromium),
  - dialog open / Arrow-nav / Escape-close+focus-return / backdrop-close on
    every browser,
  - the pre-existing lightbox, credit, dialog-visibility, and smoke tests,
    unchanged.
</verification>

<success_criteria>
- The shared thumbnail grid on all four detail pages (galleries FR/EN, éditions
  FR/EN) renders the sketch-004 A2 asymmetric bento, correct and intentional at
  every real count (2, 3, 5, 6, 7, 11), with trailing groups of 1 and 2 handled.
- Tiles reveal with a ~90ms staggered scroll-reveal; no-JS and
  no-IntersectionObserver both leave tiles fully visible.
- Clicking a tile morphs it open into the shared Lightbox (Chromium); close via
  button, Escape, and backdrop all morph back to the originating thumbnail;
  prev/next never morph.
- With View Transitions unsupported (WebKit), every existing Lightbox behavior is
  unchanged — the morph is purely additive.
- prefers-reduced-motion:reduce disables the morph animation and leaves the
  reveal motion-free.
- `data-gallery-thumb` + `data-index` contract preserved; no new dependencies.
- Full build + artifact + unit + e2e suites are green.
</success_criteria>

<output>
Create `.planning/quick/260724-dlc-apply-the-a2-asymmetric-bento-scroll-rev/260724-dlc-SUMMARY.md` when done.
</output>
