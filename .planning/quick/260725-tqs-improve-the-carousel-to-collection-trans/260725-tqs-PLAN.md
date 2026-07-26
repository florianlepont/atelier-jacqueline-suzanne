---
phase: quick-260725-tqs
plan: 1
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [QUICK-260725-tqs]
tags: [astro, homepage-carousel, detail-hero, view-transitions, css, vanilla-js, playwright, e2e]
files_modified:
  - src/components/HomeCarousel.astro
  - src/components/DetailHero.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - tests/e2e/homepage.spec.ts
  - tests/e2e/gallery.spec.ts

must_haves:
  truths:
    - "The carousel caption no longer shows a per-gallery description/byline line under the title (FR + EN)."
    - "Hovering the carousel hero photo shows a custom cursor hinting at interactivity/scroll; the title link keeps its pointer cursor."
    - "The accent panel is narrower than before, the wordmark still fits inside it with no clipping across 768-1920px, and the intro paragraph is smaller and confined to ~the left half of the panel."
    - "On landing on a gallery detail page (before scroll), the visible overlay title reads at the same size (18px), same left offset (~16px), and same ALL-CAPS casing as the homepage carousel title, so the crossfade reads as continuous."
    - "On a gallery detail page, after genuinely scrolling down and returning to the very top, a sustained upward push navigates back to the homepage carousel showing the SAME gallery; ordinary small scroll corrections on a fresh load never navigate."
    - "The scroll-up-to-return feature is active only on gallery detail pages, never on edition detail pages."
  artifacts:
    - "src/components/HomeCarousel.astro (byline removed, custom photo cursor, narrower panel + retuned wordmark, resized/repositioned intro, ?carousel= init read, data-slug)"
    - "src/components/DetailHero.astro (overlay-title end-state match; opt-in scroll-up-to-return script gated on carouselReturnHref)"
    - "src/pages/galleries/[slug].astro and src/pages/en/galleries/[slug].astro (pass carouselReturnHref)"
    - "tests/e2e/homepage.spec.ts and tests/e2e/gallery.spec.ts (updated + new coverage)"
  key_links:
    - "DetailHero data-carousel-return-href attribute -> gallery pages pass carouselReturnHref; edition pages do NOT (feature scoping)."
    - "HomeCarousel ?carousel=<slug> URL param read on init -> initial carouselIndex via slug findIndex (no selector injection)."
    - "Overlay-title end-state match + existing @view-transition{navigation:auto} root crossfade -> title crossfades in place (continuous)."
    - "hasEngaged (scrolled down past ENGAGE_DISTANCE) + atTop() gate -> upward accumulator cannot arm on a fresh scrollY-0 load (the quick-260725-sj4 failure-mode guard)."
---

<objective>
Improve the carousel<->collection transition based on direct live-testing feedback. Six related changes across the homepage carousel (`HomeCarousel.astro`) and the gallery detail hero (`DetailHero.astro` + the two gallery `[slug].astro` routes):

1. Make the gallery detail page's visible overlay title read continuously with the homepage carousel title (same size / position / casing).
2. Remove the per-slide description/byline text from the carousel caption.
3. Add a custom cursor affordance over the carousel hero photo (silent/implicit, no visible hint UI).
4. Reduce the accent panel width (with a matching wordmark clamp + caption offset adjustment).
5. Resize + reposition the sitewide intro paragraph inside the accent panel.
6. NEW FEATURE: on a gallery detail page, a sustained upward push while genuinely at the top returns to the homepage carousel showing the SAME gallery — the mirror image of the existing homepage scroll-to-open gesture, designed explicitly against the quick-260725-sj4 accidental-navigation failure mode.

Purpose: polish the transition and add the missing "back to carousel" gesture the visitor expects, without regressing any existing DetailHero behavior (lightbox trigger, scroll-reveal pin/shrink, scroll-hint, view-transition photo/header morph) and without reintroducing the accidental-navigation bug fixed in quick-260725-sj4.

Output: updated `HomeCarousel.astro`, `DetailHero.astro`, both gallery `[slug].astro` routes, and e2e coverage for every item (including the new feature's positive path AND its accidental-trigger regression guard), passing on FR and EN.
</objective>

<context>
@.planning/STATE.md
@src/components/HomeCarousel.astro
@src/components/DetailHero.astro
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro
@tests/e2e/homepage.spec.ts
@tests/e2e/gallery.spec.ts

Prior related work (read for the exact mechanics/lessons being mirrored):
@.planning/quick/260725-cfm-in-carousel-mode-on-the-homepage-homecar/260725-cfm-SUMMARY.md
@.planning/quick/260725-pit-simplify-the-carousel-scroll-to-open-ges/260725-pit-SUMMARY.md
@.planning/quick/260725-sj4-fix-a-confirmed-accidental-navigation-bu/260725-sj4-SUMMARY.md

Design tokens (defined in src/layouts/BaseLayout.astro :root): --space-xs 4px, --space-sm 8px, --space-md 16px, --space-lg 24px, --space-xl 32px, --space-2xl 48px, --space-3xl 64px; --text-label-size 14px, --text-body-size 16px, --text-display-size 32px; --weight-semibold 600; --font-display 'Unbounded'.

Cross-document View Transitions are enabled site-wide via `@view-transition { navigation: auto; }` in BaseLayout.astro (line ~227). This matters for Item 1: because a root crossfade already runs on every homepage->detail navigation, matching the overlay title's end-state size/position/casing makes it crossfade IN PLACE (reading as the same element) rather than doing a visible size/position jump.

IMPORTANT — before editing, the executor MUST re-open the current `HomeCarousel.astro` and `DetailHero.astro` and confirm the exact line anchors below; both files have been modified many times this session and line numbers may have drifted. Anchor on the CSS selectors / identifiers named, not on raw line numbers.
</context>

<tasks>

<task type="auto">
  <name>Task 1: HomeCarousel caption + accent-panel polish (Items 2, 3, 4, 5)</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
Four grouped changes, all in HomeCarousel.astro. Re-read the file first and anchor on selectors/identifiers.

ITEM 2 — Remove the per-slide byline/description from the caption:
- Delete the `<p class="home-hero__byline" data-role="gallery-statement">` element in the caption markup (currently renders `{firstGallery.statement || fallbackByline}`).
- Delete its script wiring: the `statementEl` query (`hero.querySelector('[data-role="gallery-statement"]')`) and the `if (statementEl) { ... }` block inside `render()` that sets its textContent.
- Delete the now-unused `fallbackByline` frontmatter const.
- Delete the `.home-hero__byline` CSS rule (desktop) AND its mobile override inside `@media (max-width: 767px)` (the `-webkit-line-clamp: 2` block).
- Update the caption grid to drop the byline row: desktop `.home-hero__caption` `grid-template-rows: 3px 21px 30px 63px;` -> `3px 21px 30px;` and `height: 129px;` -> `height: 62px;` (removes the 63px byline track + one 4px row-gap). Mobile `.home-hero__caption` `grid-template-rows: 3px 21px 30px 42px;` -> `3px 21px 30px;` and `height: 108px;` -> `height: 62px;`.
- CRITICAL COUPLING: the mobile `.home-hero__accent` `bottom: calc(108px + var(--space-xl) + var(--space-md));` hardcodes the old caption height — change `108px` -> `62px` so the mobile accent panel still clears the (now shorter) caption. Do NOT touch `.home-grid__tile-description` or `gallery.statement` used by the grid tiles (Item 2 only removes the CAROUSEL byline). Leaving the `data-statement`/`statement` client field in place is fine (grid uses the server-rendered value); only the carousel byline usage is removed.

ITEM 3 — Custom cursor affordance on the hero photo (silent, no visible hint):
- Add a `cursor` to `.home-hero__photo` using a small inline URL-encoded SVG data-URI cursor: a down-chevron glyph (a downward "V" path) drawn with a white stroke (~2.5px) over a subtle semi-transparent dark halo stroke beneath it (so it stays legible over both light and dark photos), 28x28 viewBox, hotspot at roughly `14 14`, with a `pointer` keyword fallback: `cursor: url("data:image/svg+xml,<url-encoded-svg>") 14 14, pointer;`. This hints "interactive / more content below" for both carousel nav and the scroll-to-open gesture without any visible hint element (the user explicitly rejected a visible hint in quick-260725-pit). Encode `#`, spaces, `<`, `>`, quotes properly for the data-URI.
- GOTCHA: `cursor` is an inherited property. The carousel title link `.home-hero__title` does NOT set its own cursor, so the custom photo cursor would inherit onto it and break the link's pointer affordance. Add an explicit `cursor: pointer;` to `.home-hero__title` to preserve it. The progress dashes (`.home-hero__progress-dash`) and autoplay toggle already declare `cursor: pointer`, so they are unaffected — verify this while editing.

ITEM 4 — Reduce the accent panel width (with matching wordmark + caption offset):
- `.home-hero__accent` `width: min(800px, 60%);` -> `width: min(700px, 52%);` (gives the photo more room).
- COUPLING A — caption clearance: `.home-hero__caption` `right: calc(min(800px, 60%) + var(--space-3xl) + var(--space-md));` -> `right: calc(min(700px, 52%) + var(--space-3xl) + var(--space-md));` so the caption keeps clearing the (now narrower, further-right) panel edge.
- COUPLING B — wordmark clamp: `.home-hero__wordmark` `font-size: clamp(44px, 6vw, 80px);` is deliberately tuned to the panel's own rate (the existing comment notes 6vw tracks the SAME 60% rate the panel width uses, and 80px/800px = a ~10% font-to-panel ratio at the cap). Retune to preserve that ratio against the new 52%/700px panel: starting point `clamp(38px, 5.2vw, 70px)` (70/700 = 10%; 5.2vw ≈ 6vw × 52/60; 38 ≈ 44 × 52/60). Treat these as a STARTING point and VERIFY LIVE across 768-1920px that the widest lines ("JACQUELINE" / "SUZANNE") do NOT clip past the narrower panel edge (the exact overflow failure the existing wordmark comment documents) — adjust the cap/rate down slightly if any clip appears. Update the stale `.home-hero__accent` measurement comment (it references "800px gives ~736px of inner width") to reflect the new 700px/52% panel and retuned wordmark.
- Do NOT change the mobile `.home-hero__accent` width (it is full-width `100%` on mobile — unrelated).

ITEM 5 — Resize + reposition the sitewide intro paragraph:
- `.home-hero__intro` `font-size: 16px;` -> `font-size: 15px;` (a modest reduction; keep line-height 1.5).
- Confine it to roughly the left half of the panel: add `max-width: 50%;` to the desktop `.home-hero__intro` rule (the panel is its containing block, so 50% ≈ the left half of the panel width).
- Preserve mobile full-width: the mobile `@media (max-width: 767px)` `.home-hero__intro` override already sets `font-size: 14px; line-height: 1.4;` — add `max-width: none;` there so the intro is not squeezed to half-width on phones (where the panel is full-width and this item does not apply).

Verify: `npx astro check` passes (0 errors on this file). Confirm no remaining reference to `home-hero__byline`, `gallery-statement`, `statementEl`, or `fallbackByline` in the file.
  </action>
  <verify>
    <automated>npx astro check 2>&1 | grep -E "error" | grep -c "HomeCarousel" | grep -qx 0 && ! grep -q "home-hero__byline\|data-role=\"gallery-statement\"\|statementEl\|fallbackByline" src/components/HomeCarousel.astro && echo OK</automated>
  </verify>
  <done>Byline element/CSS/script wiring removed and caption grid + mobile accent offset recomputed; custom SVG-data-URI cursor on `.home-hero__photo` with explicit `cursor: pointer` restored on `.home-hero__title`; accent panel width min(700px,52%) with matching caption `right` calc and retuned wordmark clamp (no live clipping 768-1920px); intro font-size reduced to 15px with `max-width: 50%` desktop / `max-width: none` mobile. `astro check` clean.</done>
</task>

<task type="auto">
  <name>Task 2: DetailHero overlay-title end-state match (Item 1)</name>
  <files>src/components/DetailHero.astro</files>
  <action>
Make the gallery detail page's VISIBLE-on-arrival title (`.detail-hero__overlay-title`, the `<p aria-hidden>` bottom-left over the photo — NOT `.detail-hero__reveal-title`, the big 72px scroll-revealed `<h1>`) read continuously with the homepage carousel title (`.home-hero__title`: 18px, left ≈ var(--space-md), ALL CAPS).

In `.detail-hero__overlay-title`'s CSS rule ONLY:
- `font-size: var(--text-display-size);` (32px) -> `font-size: 18px;` (match the homepage title's compact-heading size).
- `left: var(--space-xl);` (32px) -> `left: var(--space-md);` (16px, matching the caption's left edge on the homepage).
- Add `text-transform: uppercase;` (the homepage title renders via `.toUpperCase()`; the overlay title is currently Title Case).
- Keep everything else as-is: `bottom: var(--space-xl)` (already aligns with the homepage caption's own bottom offset), `font-weight: var(--weight-semibold)`, `font-family: var(--font-display)`, `color: #FFFFFF`, `line-height: 1.2`, `right`, `z-index`, `opacity`, `pointer-events`.

Do NOT touch `.detail-hero__reveal-title` (the deliberate 72px sketch-005 scrolled-down title stays exactly as-is). Do NOT touch the mobile `@media (max-width: 767px)` block, which sets `.detail-hero__overlay-title { display: none; }` — mobile is unaffected and correct.

DESIGN DECISION to record in a code comment on the rule (Item 1 judgment call): a shared cross-document `view-transition-name` on the two title elements was considered and deliberately NOT added. Rationale: `@view-transition { navigation: auto }` is already enabled site-wide, so a root crossfade already runs on the homepage->detail navigation; once the overlay title matches the homepage title's size/position/casing, it crossfades IN PLACE and reads as the same element — which is exactly the "reads as continuous, not a hard crossfade" outcome the user asked for. Adding a dedicated shared name would introduce a new cross-document view-transition group on an element inside the 100svh-sized `.detail-hero__pin` — the same always-on-name-on-a-100svh-element risk class (HOME-06 / D-10 / D-12) that forced `.detail-hero__img`'s own name to be desktop-gated — for only marginal benefit over an already-continuous in-place crossfade. End-state match is the stated minimum bar and it fully addresses the complaint; the shared name is out of scope for this low-risk pass.

Verify: `npx astro check` passes; `.detail-hero__reveal-title` is unchanged (still `clamp(40px, 6vw, 72px)`).
  </action>
  <verify>
    <automated>npx astro check 2>&1 | grep -E "error" | grep -c "DetailHero" | grep -qx 0 && grep -q "clamp(40px, 6vw, 72px)" src/components/DetailHero.astro && echo OK</automated>
  </verify>
  <done>`.detail-hero__overlay-title` computes font-size 18px, left var(--space-md), text-transform uppercase, unchanged weight/family/color; `.detail-hero__reveal-title` and the mobile override untouched; VT-name deferral decision documented in a comment. `astro check` clean.</done>
</task>

<task type="auto">
  <name>Task 3: Scroll-up-at-top returns to the carousel showing the same gallery (Item 6)</name>
  <files>src/components/DetailHero.astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro, src/components/HomeCarousel.astro</files>
  <action>
Add the mirror image of the homepage scroll-to-open gesture: on a GALLERY detail page (not edition), a sustained upward push while genuinely at the top navigates back to the homepage carousel showing the SAME gallery. Gallery-detail-only, additive only — preserve every existing DetailHero behavior.

--- A. Gallery pages pass the return href (opt-in scoping) ---
In BOTH src/pages/galleries/[slug].astro (FR) and src/pages/en/galleries/[slug].astro (EN):
- Import `getRelativeLocaleUrl` from 'astro:i18n' (match HomeCarousel's usage).
- Compute `const carouselReturnHref = `${getRelativeLocaleUrl(locale, '')}?carousel=${gallery.slug}`;` (FR -> `/?carousel=<slug>`, EN -> `/en/?carousel=<slug>`).
- Pass `carouselReturnHref={carouselReturnHref}` to `<DetailHero .../>`.
- Do NOT touch the edition pages (src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro) — they must NOT pass this prop, which is what keeps the feature off edition heroes.

--- B. DetailHero: accept the prop, expose it, run the guarded gesture ---
- Add optional `carouselReturnHref?: string;` to the Props interface and destructure it.
- On the root `.detail-hero` element, conditionally render the data attribute only when the prop is set: `data-carousel-return-href={carouselReturnHref}` (Astro omits an attribute whose value is undefined). This attribute's presence is the feature's on/off switch.
- Add a NEW independent top-level `<script>` block (mirror the existing self-contained scroll-hint block: do NOT nest it inside the `if (track && photo && scrim && overlayTitle && reveal)` reveal-driver guard — the feature must also work on mobile where the reveal is disabled). Read `const track = document.querySelector('.detail-hero')` and `const returnHref = track?.dataset.carouselReturnHref;`. If `!returnHref`, do nothing (edition pages / any page without the prop are inert).

  Implement the accumulator with EXPLICIT defenses against the quick-260725-sj4 failure mode (documented in a comment block — see SAFETY DESIGN below):
    - Constants (tunable, mirror the homepage's names/values where analogous): `RETURN_OVERSCROLL_THRESHOLD = 150` (mirrors OPEN_OVERSCROLL_THRESHOLD), `TOP_EPSILON = 4` (mirrors BOTTOM_EPSILON), `RESET_IDLE_MS = 800`, and a NEW `ENGAGE_DISTANCE = 300`.
    - State: `let hasEngaged = false; let upAccum = 0; let lastUpTs = 0; let navigatingHome = false;`
    - `function atTop() { return window.scrollY <= TOP_EPSILON; }`
    - Engagement + reset scroll listener (passive): on `scroll`, `if (window.scrollY >= ENGAGE_DISTANCE) hasEngaged = true;` and `if (!atTop()) upAccum = 0;` (the reset-on-leaving-boundary fix mirrors the quick-260725-cfm verification fix for keyboard/scrollbar/scrollTo paths).
    - `function registerUpwardIntent(delta)` where `delta > 0` means upward scroll intent: `if (navigatingHome || !hasEngaged || !atTop()) return;` then `if (delta <= 0) { upAccum = 0; return; }` then idle-reset `const now = Date.now(); if (now - lastUpTs > RESET_IDLE_MS) upAccum = 0;` then `upAccum += delta; lastUpTs = now; if (upAccum >= RETURN_OVERSCROLL_THRESHOLD) navigateHome();`
    - `function navigateHome() { if (navigatingHome) return; navigatingHome = true; window.location.href = returnHref; }`
    - Desktop input (passive, never preventDefault): `window.addEventListener('wheel', (e) => registerUpwardIntent(-e.deltaY), { passive: true });` (wheel deltaY < 0 = scrolling up = positive upward intent).
    - Mobile input (passive), independent window-level touch accumulator mirroring HomeCarousel's, but for UPWARD intent: track `lastMoveY`, `startX`, `startY` on touchstart; on touchmove compute upward intent `dy = touch.clientY - lastMoveY` (finger moving DOWN => scrolling UP => positive) and feed `registerUpwardIntent(dy)` ONLY when the drag is vertically dominant (`Math.abs(touch.clientY - startY) > Math.abs(touch.clientX - startX)`); update `lastMoveY`.

  SAFETY DESIGN (write this reasoning as a comment): "at the top" (scrollY ≈ 0) is trivially true on EVERY fresh page load, so an accumulator armed from load would misfire on ordinary small upward scroll corrections — the mirror image of the quick-260725-sj4 bug (where "at the bottom" was vacuously true at scrollY 0). The `hasEngaged` gate is the fix: the gesture DISARMS until the visitor has genuinely scrolled DOWN past `ENGAGE_DISTANCE` (300px — far beyond a small re-read correction, well within the desktop reveal's 900px track and reachable on mobile whenever a grid exists below the hero) at least once; only then, AND only once back at the very top, does a sustained ≥150px upward push navigate. On a fresh load `hasEngaged` is false, so no upward wheel/touch does anything. A tiny scroll-down-then-correct-up (< 300px) never arms it. If a short page (e.g. a single-image gallery on mobile with no grid) cannot scroll 300px, the gesture simply never arms — safe graceful degradation, no misfire. Listeners are passive and never preventDefault, so normal scrolling, the lightbox trigger, the scroll-reveal, and the scroll-hint are all unaffected.

--- C. HomeCarousel: land on the requested gallery ---
- Add `data-slug={gallery.slug}` to each `<li>` in the `ul[data-role="home-carousel-data"]` build-time data node.
- Add `slug: string;` to the client-side `GalleryEntry` interface (in the `<script>`) and map it: `slug: li.dataset.slug ?? ''`.
- On init, BEFORE the first `render()` call: read the requested slug from the URL and set the starting index. Use `const requested = new URLSearchParams(window.location.search).get('carousel');` then `if (requested) { const i = galleries.findIndex((g) => g.slug === requested); if (i >= 0) carouselIndex = i; }`. SECURITY: match with `findIndex` on the parsed value — do NOT build a DOM/attribute selector string from the untrusted param (no `querySelector(`[data-slug="${requested}"]`)`), so the URL param can never become a selector-injection sink. An unknown/absent slug harmlessly leaves `carouselIndex = 0` (default first gallery).

Verify: `npx astro check` passes across all four files.
  </action>
  <verify>
    <automated>npx astro check 2>&1 | grep -cE "error" | grep -qx 0 && grep -q "carouselReturnHref" src/pages/galleries/\[slug\].astro && grep -q "carouselReturnHref" src/pages/en/galleries/\[slug\].astro && grep -q "data-carousel-return-href\|carouselReturnHref" src/components/DetailHero.astro && grep -q "carousel" src/components/HomeCarousel.astro && echo OK</automated>
  </verify>
  <done>Gallery pages (FR+EN) pass `carouselReturnHref`; edition pages do not. DetailHero renders `data-carousel-return-href` only when the prop is set and runs a guarded upward-overscroll accumulator (hasEngaged + atTop + threshold + idle-reset + reset-on-leave-top, passive/no-preventDefault) that navigates to the return href. HomeCarousel emits `data-slug`, reads `?carousel=<slug>` on init via `findIndex` (no selector injection), and starts the carousel on the matching gallery. `astro check` clean; all existing DetailHero behavior preserved.</done>
</task>

<task type="auto">
  <name>Task 4: e2e coverage for the polish + title-consistency (Items 1-5)</name>
  <files>tests/e2e/homepage.spec.ts, tests/e2e/gallery.spec.ts</files>
  <action>
Update the tests broken by the byline removal, then add coverage for Items 1-5. Do NOT weaken unrelated assertions.

FIX broken tests in homepage.spec.ts (byline removal, Item 2):
- In the `collection statements on the homepage` describe block, the test `carousel uses the current collection statement instead of the generic byline` asserts `[data-role="gallery-statement"]` is visible — this element is gone. REPLACE it with a test asserting the carousel byline is removed: `await expect(page.locator('[data-role="gallery-statement"]')).toHaveCount(0)` and `await expect(page.locator('.home-hero__byline')).toHaveCount(0)` on `/` and `/en/`. Keep the sibling `grid tile reveals its collection statement on hover` test unchanged (grid descriptions are untouched).
- In `carousel keeps its navigation fixed and clamps long collection statements`, remove the statement-specific reads/assertions (`statement`, `statementRight`, `statementWidth`, `statementHeight`, `statementLineHeight`, `statementOverflow`, and the three `layout.statement*` expects). KEEP the progress-fixed-position loop, `titleFontSize === 18`, `captionRight <= accentLeft`, and `captionWidth`/`indexTitleGap` assertions. Because Item 4 narrows the panel, re-derive any now-stale numeric bound (e.g. the `accentLeft - captionRight >= 63` clearance and `captionWidth <= 721`) from the live layout so the test still asserts "caption clears the panel, nav row stays fixed" without hardcoding a value that the narrower panel invalidates.

ADD to homepage.spec.ts:
- Item 3 (cursor): a test that `.home-hero__photo` computed `cursor` contains a custom cursor (`getComputedStyle(el).cursor` contains `url(` or `data:image/svg+xml`), AND `.home-hero__title` computed `cursor` is `pointer` (the link affordance is preserved despite cursor inheritance). Run on `/`.
- Item 4 (panel width / no wordmark clip): at a wide viewport (e.g. 1600x900) assert the accent panel is narrower than before and the wordmark fits: read `.home-hero__accent` and `.home-hero__wordmark` bounding boxes; assert `accent.width <= 700 + 1` and the panel width is ~52% (or clearly less than the old 60%), and assert the wordmark's right edge does not exceed the panel's right inner edge (no clip): `wordmarkRect.right <= accentRect.right + 1`. Also assert `.home-hero__caption` right edge <= accent left edge (no overlap) after the narrowing.
- Item 5 (intro resize/reposition): at a wide desktop viewport assert `.home-hero__intro` computed `font-size` is `15px` and its rendered width is roughly the left half of the panel (`introRect.width <= accentInnerWidth * 0.6`); at a 393px mobile viewport assert the intro is NOT squeezed to half-width (`max-width` computes to `none`, or its width is close to the panel's inner width).

ADD to gallery.spec.ts (Item 1, title consistency) — reuse the file's grid-discovery pattern (goto `/`, Grille, read first `a.home-grid__tile` href, goto it):
- On a gallery detail page (FR and via the matching `/en/galleries/<slug>/` route), assert `.detail-hero__overlay-title` computes `font-size: 18px`, `text-transform: uppercase`, and `left` ≈ 16px (`var(--space-md)`); and assert `.detail-hero__reveal-title` is unchanged (its computed font-size is still large, > 18px — proving the deliberate 72px scrolled-down title was NOT altered). Use a desktop viewport so the overlay title is not `display: none`.

Verify with `npx astro check` (typecheck of the spec files) and confirm the new/updated tests are well-formed. NOTE (environment limitation, per prior summaries): this worktree has no Sanity `.env`, so a real `npm run test:e2e` pass must be produced by the orchestrator's verification pass on an isolated port with real credentials — write the tests per spec and typecheck-clean; do not report a false pass from a stale reused server.
  </action>
  <verify>
    <automated>npx astro check 2>&1 | grep -cE "error" | grep -qx 0 && grep -q "home-hero__byline" tests/e2e/homepage.spec.ts && grep -q "detail-hero__overlay-title" tests/e2e/gallery.spec.ts && echo OK</automated>
  </verify>
  <done>Byline-dependent homepage tests updated to assert the byline's ABSENCE and the statement-geometry assertions removed; new tests cover the custom photo cursor + preserved title pointer (Item 3), the narrower panel with no wordmark clip and no caption overlap (Item 4), the resized/repositioned intro on desktop vs mobile (Item 5), and the overlay-title end-state match with the reveal-title left intact (Item 1). Spec files typecheck clean.</done>
</task>

<task type="auto">
  <name>Task 5: e2e coverage for the scroll-up-to-return feature (Item 6) — positive path + accidental-trigger regression guard</name>
  <files>tests/e2e/gallery.spec.ts</files>
  <action>
Add a new describe block covering Item 6. Use the file's grid-discovery pattern to obtain a real gallery slug + title, and mirror the quick-260725-sj4 synthetic-event fresh-load pattern for the negative (accidental-trigger) tests. Use a desktop viewport (e.g. 1280x900) for the scroll tests unless a test is explicitly the mobile/touch variant.

Setup helper per test: goto `/`, click `Grille`, read the first `a.home-grid__tile` href (extract `<slug>`), and its visible title text; then `page.goto(href)` to land on the gallery detail page.

POSITIVE PATH (must navigate) — FR and EN:
- On the gallery detail page, arm engagement with a REAL scroll: `await page.evaluate(() => window.scrollTo(0, 500))` then a short settle (`waitForTimeout(150)`) so the `scroll` listener sets `hasEngaged` (ENGAGE_DISTANCE 300 < 500). Return to the very top: `window.scrollTo(0, 0)` + settle. Then dispatch a sustained upward wheel via synthetic event at scrollY 0: `window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true }))` (deltaY -200 => +200 upward intent >= 150 threshold in one push). Assert navigation to the homepage with the param: `await page.waitForURL('**/?carousel=' + slug)` (EN: `**/en/?carousel=' + slug`), and assert the carousel landed on the SAME gallery — `[data-role="gallery-title"]` text equals the gallery's title upper-cased (read promptly after load). Do the EN variant via the `/en/galleries/<slug>/` route asserting the `/en/?carousel=<slug>` destination.

ACCIDENTAL-TRIGGER REGRESSION GUARD (must NOT navigate) — mirrors quick-260725-sj4:
- Fresh load (FR): `page.goto(href)`; WITHOUT any prior scroll (hasEngaged false, scrollY 0), dispatch two upward wheel ticks via synthetic events: `new WheelEvent('wheel', { deltaY: -80 })` twice with a short gap; settle; assert `page.url()` still equals the gallery detail URL (no navigation to `/`). This is the core proof that an upward accumulator armed from a fresh scrollY-0 load does NOT misfire.
- Fresh load (EN): same on the `/en/galleries/<slug>/` route.
- Fresh load, small down-then-up correction (FR): dispatch a small real scroll `window.scrollTo(0, 60)` then back to `0` (below ENGAGE_DISTANCE 300), then an upward `WheelEvent({ deltaY: -200 })`; assert NO navigation — proving a minor re-read correction never arms the gesture.
- Touch fresh load (mobile viewport 390x844, hasTouch): dispatch a synthetic downward finger drag (touchstart then touchmove with increasing clientY = upward scroll intent, then touchend) on a fresh load; assert NO navigation. Mirror the exact synthetic Touch/TouchEvent construction used in homepage.spec.ts's `fresh load: one modest touch swipe` test.

BELOW-THRESHOLD GUARD (engaged, at top, tiny tick — must NOT navigate):
- Arm engagement (`scrollTo(0,500)` + `scrollTo(0,0)`), then a single small upward `WheelEvent({ deltaY: -60 })` (below 150); assert NO navigation.

FEATURE-SCOPING (edition exclusion — must be inert):
- Discover an edition detail route (grep-analogous: goto `/editions` or `/en/editions`, follow the first edition detail link) and assert the feature is disabled there: `await expect(page.locator('.detail-hero[data-carousel-return-href]')).toHaveCount(0)` — the attribute is absent, so the gesture never runs on editions. If the edition index route/selector differs, locate the first edition detail link structurally; keep this a lightweight presence check.

HOMEPAGE INIT (param -> gallery, independent of the gesture):
- In homepage.spec.ts OR here, navigate directly to `/?carousel=<known-slug>` (slug discovered via the grid) and assert the carousel shows that gallery: `[data-role="gallery-title"]` text equals that gallery's upper-cased title. Also assert a bogus `/?carousel=does-not-exist` harmlessly falls back to the first gallery (no error, carousel still renders a title). This proves the `?carousel=` init read in isolation.

Typecheck the spec with `npx astro check`. Same environment caveat as Task 4: real e2e execution is the orchestrator's verification pass (no `.env` in this worktree) — write tests per spec, typecheck-clean, and do not trust a stale reused preview server.
  </action>
  <verify>
    <automated>npx astro check 2>&1 | grep -cE "error" | grep -qx 0 && grep -q "carousel=" tests/e2e/gallery.spec.ts && grep -q "data-carousel-return-href" tests/e2e/gallery.spec.ts && echo OK</automated>
  </verify>
  <done>New describe block proves: genuine engagement + return-to-top + sustained upward push navigates to `/?carousel=<slug>` (FR) and `/en/?carousel=<slug>` (EN) landing on the same gallery; fresh-load upward wheel/touch and small down-then-up corrections do NOT navigate (synthetic-event regression guards, FR+EN+touch); an engaged below-threshold tick does not navigate; the feature is inert on edition heroes (attribute absent); and `/?carousel=<slug>` init lands the carousel on the right gallery with safe fallback for unknown slugs. Spec typechecks clean.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL query string -> homepage carousel init | `?carousel=<slug>` is untrusted client-read input used to select the initial carousel index |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-tqs-01 | Tampering/Injection | HomeCarousel `?carousel=` init read | low | mitigate | Match the untrusted param via `galleries.findIndex((g) => g.slug === requested)`; NEVER build a DOM/attribute selector or any HTML string from it (no selector-injection / XSS sink). Unknown value falls back to index 0. |
| T-tqs-02 | Denial of Service (accidental self-navigation) | DetailHero upward-overscroll gesture | medium | mitigate | `hasEngaged` (scrolled down past ENGAGE_DISTANCE) + `atTop()` + accumulator threshold + idle reset + reset-on-leave-top gates prevent a fresh-load scrollY-0 misfire (the quick-260725-sj4 failure-mode mirror); passive listeners, never preventDefault; regression-tested with synthetic fresh-load events. |
| T-tqs-03 | Tampering | npm/pip/cargo installs | n/a | accept | No new dependencies added — pure Astro/CSS/vanilla-JS + Playwright test edits; no package installs, so no supply-chain surface. |

No new external services, credentials, or network calls are introduced.
</threat_model>

<verification>
- `npx astro check` passes with 0 errors across all modified `.astro` and spec files.
- Manual/orchestrator live pass (real Sanity `.env`, isolated Playwright port — this worktree has no `.env`): full `npm run test:e2e` suite green, including the updated byline tests and all new Item 1-6 coverage; `npm run test:unit` green.
- Live browser spot-check on `/` and `/en/`: (a) no byline under the carousel title; (b) custom cursor over the hero photo, pointer preserved on the title link; (c) narrower accent panel with no wordmark clipping across 768-1920px; (d) smaller intro confined to ~left half of the panel; (e) landing on a gallery detail page the overlay title reads continuous with the homepage title (size/position/casing) across the morph; (f) on a gallery detail page, scroll down then back to the very top and keep pushing up -> returns to the carousel on the SAME gallery; ordinary small scroll corrections on a fresh load never navigate.
</verification>

<success_criteria>
- All six items delivered; FR and EN both correct for every item.
- No existing DetailHero behavior regressed (lightbox trigger, scroll-reveal pin/shrink, `.detail-hero__scroll-hint`, `.detail-hero__reveal-title`, cross-document photo/header morph).
- The quick-260725-sj4 accidental-navigation failure mode is NOT reintroduced in mirror form — proven by the fresh-load synthetic-event regression tests.
- The scroll-up-to-return feature is active only on gallery detail pages, never on edition detail pages.
- `astro check` clean; e2e coverage exists for every item (feature positive path + accidental-trigger guard); tests are typecheck-clean pending the orchestrator's credentialed e2e run.
</success_criteria>

<output>
Create `.planning/quick/260725-tqs-improve-the-carousel-to-collection-trans/260725-tqs-SUMMARY.md` when done.
</output>
