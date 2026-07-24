---
phase: 260724-dlc
plan: 01
subsystem: ui
tags: [astro, view-transitions, intersection-observer, lightbox, gallery-grid, editions]

requires:
  - phase: 12-data-fetch-routes
    provides: gallery/edition detail pages and the shared GalleryGrid/Lightbox components this plan rebuilds
provides:
  - Props-based, count-generalized asymmetric bento GalleryGrid (chunk-by-3, alternate-side, ported from editions/index.astro)
  - Staggered IntersectionObserver scroll-reveal with no-JS and no-IntersectionObserver fallbacks
  - Click-to-expand View Transitions morph wired into Lightbox.astro's open/close lifecycle (button, Escape, backdrop)
affects: [portfolio-galleries, editions]

tech-stack:
  added: []
  patterns:
    - "GalleryGridItem[] props contract (index/src/srcset/alt/ariaLabel) replacing slot-based children for GalleryGrid.astro"
    - "closeWithMorph() single funnel point for all Lightbox close paths (button/Escape-cancel/backdrop-click)"

key-files:
  created: []
  modified:
    - src/components/GalleryGrid.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/components/Lightbox.astro
    - tests/e2e/gallery.spec.ts
    - tests/e2e/edition.spec.ts

key-decisions:
  - "GalleryGrid.astro moved from a content-agnostic <slot/> wrapper to a props-based GalleryGridItem[] API to make the count-generalized bento grouping robust at any real count (2 through 11+), reusing the shipped editions/index.astro pattern instead of hand-verified CSS quantity-query rules"
  - "items defaults to [] in GalleryGrid's destructure so Task 1 (component rebuild) is independently buildable before Task 2 (caller re-plumbing) lands in its own atomic commit"
  - "Lightbox's three close paths (button, Escape via 'cancel' event preventDefault, backdrop click) all funnel through one closeWithMorph() helper so the closing morph is consistent everywhere"

patterns-established:
  - "Pattern: shared grid components take resolved GalleryGridItem[] props (index/src/srcset/alt/ariaLabel) rather than slotted markup, so bento/grouping logic lives in one place and callers only build data"
  - "Pattern: VTDocument-guarded startViewTransition wiring (narrow local type, named morph constant, imperative viewTransitionName assignment right before the transition call) mirrors HomeCarousel.astro's existing convention"

requirements-completed: [SKETCH-004-A2]

coverage:
  - id: D1
    description: "GalleryGrid.astro rebuilt as a props-based, count-generalized asymmetric bento grid (chunk-by-3, alternate-side) with a staggered scroll-reveal and no-JS/no-IntersectionObserver fallbacks"
    requirement: "SKETCH-004-A2"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery grid bento layout > bento grouping generalizes across every real gallery (G === ceil(N/3), hero larger + side-alternating)"
        status: pass
      - kind: other
        ref: "Orchestrator independent re-verification: grepped built dist/ output for Paysage (2 thumbs -> data-size=2) and The Victorian Tea Room (11 thumbs -> 3+3+3+2 groups); confirmed zero stale *-detail__thumb* class references anywhere in dist/"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four calling pages (galleries FR/EN, editions FR/EN) re-plumbed to pass GalleryGridItem[] props instead of slotted markup, preserving each page's exact existing semantics"
    requirement: "SKETCH-004-A2"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions lightbox > the hero opens the lightbox at 1/N; the first grid thumbnail opens it at 2/N"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail > serves responsive hero, thumbnail, and lightbox image candidates"
        status: pass
    human_judgment: false
  - id: D3
    description: "Click-to-expand View Transitions morph wired into Lightbox.astro's open/close lifecycle (button, Escape, backdrop), purely additive with unchanged behavior when unsupported"
    requirement: "SKETCH-004-A2"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery lightbox morph > morphs on open/close, never on prev/next, and every dialog interaction still works"
        status: pass
      - kind: other
        ref: "Orchestrator independently re-ran the full e2e suite (168/168, chromium + webkit-mobile) on an isolated port after finding a stale dev server on 4321; also independently re-ran build + test:artifact + test:unit (126/126) in the worktree"
        status: pass
    human_judgment: false
  - id: D4
    description: "Visual quality of the bento composition and morph animation feel (does the reveal/morph look intentional, not just functionally correct)"
    verification: []
    human_judgment: true
    rationale: "Playwright can assert layout geometry and API invocation counts but not subjective animation feel/timing quality — a human should eyeball the live pages."

duration: ~20min
completed: 2026-07-24
status: complete
---

# Quick Task 260724-dlc: Apply Sketch 004 Variant A2 (Bento + Scroll-Reveal + Morph) Summary

**Rebuilt the shared GalleryGrid.astro thumbnail grid as a props-based, count-generalized asymmetric bento layout with a staggered IntersectionObserver reveal, and wired a click-to-expand View Transitions morph into Lightbox.astro's open/close lifecycle — applied uniformly across all four gallery/édition detail pages (FR/EN).**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-24
- **Tasks:** 4
- **Files modified:** 8

## Accomplishments

- `GalleryGrid.astro` is now a props-based component (`GalleryGridItem[]`) implementing the sketch-004 variant A2 asymmetric bento: build-time chunk-by-3 grouping ported verbatim from `editions/index.astro`'s shipped Poster Grid, generalizing correctly to any real count (verified live at 2, 5, 6, 7, and 11 across all published galleries/éditions).
- A staggered (~90ms) IntersectionObserver scroll-reveal was added with two mandatory progressive-enhancement fallbacks: a `<noscript>` rule for no-JS, and an immediate-reveal branch when `IntersectionObserver` is absent.
- All four calling pages (galleries FR/EN, éditions FR/EN) were re-plumbed to build a `GalleryGridItem[]` in frontmatter instead of slotting thumbnail markup as children, preserving each page's exact prior semantics (galleries skip index 0 with decorative alt; éditions keep the leadPhoto N+2 counter offset with real localized alt). The now-dead `*-detail__thumb-button`/`*-detail__thumb` CSS was removed from all four pages.
- `Lightbox.astro`'s open/close lifecycle now morphs the clicked thumbnail into the enlarged Lightbox image via `document.startViewTransition` (mirroring `HomeCarousel.astro`'s existing VTDocument convention), with all three close paths (button, Escape via a `cancel`-event handler, backdrop click) funneled through one `closeWithMorph()` helper. Purely additive: without View Transitions support the existing behavior is unchanged.
- Added a bento-layout invariant e2e test that discovers every real gallery from the homepage and asserts `G === ceil(N/3)` plus hero-larger-than-small geometry and correct side alternation — proving the algorithm generalizes rather than being overfit to one gallery's count.
- Added a morph e2e test proving `startViewTransition` fires on open/close but never on prev/next (Chromium), while every existing dialog interaction (open, Arrow-nav, Escape-close+focus-return, backdrop-close) still passes on every browser including WebKit (where `startViewTransition` is undefined).
- Fixed the one pinned literal-class e2e assertion (`.edition-detail__thumb-button`, which no longer exists) to a grid-scoped attribute locator.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rebuild GalleryGrid.astro as a props-based bento grid with staggered scroll-reveal** - `3032126` (feat)
2. **Task 2: Re-plumb the four calling pages to pass thumbnail data as props** - `23cdcd9` (feat)
3. **Task 3: Wire the click-to-expand View Transitions morph into Lightbox.astro's open/close lifecycle** - `d299593` (feat)
4. **Task 4: Update the pinned e2e assertion, add multi-count + morph coverage, and run full verification** - `f6b3d97` (test)

## Files Created/Modified

- `src/components/GalleryGrid.astro` - Rebuilt as a props-based (`GalleryGridItem[]`) asymmetric bento grid with staggered scroll-reveal
- `src/pages/galleries/[slug].astro` - Builds `GalleryGridItem[]` in frontmatter; dead thumb CSS removed
- `src/pages/en/galleries/[slug].astro` - Same, English locale
- `src/pages/editions/[slug].astro` - Builds `GalleryGridItem[]` with real localized alt and N+2 offset; dead thumb CSS removed
- `src/pages/en/editions/[slug].astro` - Same, English locale
- `src/components/Lightbox.astro` - Adds VTDocument-guarded `startViewTransition` morph on open/close, `closeWithMorph()` funnel, and the mandatory `::view-transition-*` / `prefers-reduced-motion: reduce` global CSS
- `tests/e2e/gallery.spec.ts` - New bento-invariant test (generalizes across every real gallery) and morph test (open/close morph, no morph on prev/next)
- `tests/e2e/edition.spec.ts` - Fixed the pinned `.edition-detail__thumb-button` locator to a grid-scoped attribute selector

## Decisions Made

- Kept `GalleryGrid`'s `items` prop defaulted to `[]` (rather than strictly required) so Task 1's own build-and-verify step could pass in isolation before Task 2's caller updates landed in their own atomic commit — harmless in production since every real caller always passes `items`.
- All three Lightbox close paths funnel through a single `closeWithMorph()` helper rather than duplicating the transition-guard logic three times, keeping the morph behavior consistent and easy to audit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added a defensive `items = []` default in GalleryGrid's props destructure**
- **Found during:** Task 1 verification
- **Issue:** The plan's Task 1 verify command (`npm run build && ...`) failed because the four calling pages (not yet updated — that's Task 2) still passed slotted children, leaving `items` `undefined` and crashing the static build with `TypeError: Cannot read properties of undefined (reading 'length')`.
- **Fix:** Destructured `const { items = [] } = Astro.props;` so an empty items array (rather than a crash) is the safe fallback until every real caller passes it.
- **Files modified:** src/components/GalleryGrid.astro
- **Verification:** `npm run build` succeeds and the Task 1 node verification script confirms bento markup is present once Task 2's real callers pass `items`.
- **Committed in:** `3032126` (Task 1 commit)

**2. [Rule 3 - Blocking] Installed the `sanity/` subproject's dependencies from its committed lockfile**
- **Found during:** Task 4's full verification sweep (`npm run test:unit`)
- **Issue:** This fresh worktree never had `npm install` run inside the separate `sanity/` subproject, so `tests/unit/dashboard-logic.test.ts` failed with `Cannot find package '@sanity/icons'` — a worktree environment-setup gap, unrelated to any file this plan touches.
- **Fix:** Ran `npm ci` inside `sanity/` against its already-committed `package-lock.json` (no new/unvetted packages — package-manager-install exclusion doesn't apply since nothing new was added to any `package.json`). `sanity/node_modules` is gitignored and was not staged.
- **Files modified:** none (only restored gitignored `sanity/node_modules`)
- **Verification:** `npm run test:unit` now passes (126/126, 12/12 files) instead of failing to even collect one suite.
- **Committed in:** not applicable (no tracked files changed)

**3. [Rule 3 - Blocking] Used a temporary, uncommitted alternate-port Playwright config to avoid a stale dev server from the main checkout**
- **Found during:** Task 4's full e2e verification sweep
- **Issue:** A stale `astro dev` process (cwd `/Users/florian/Projects/ajs-website`, the main repo checkout — not this worktree) was already bound to port 4321. Playwright's `reuseExistingServer: !process.env.CI` would have silently reused it, testing against old markup instead of this worktree's build.
- **Fix:** Per the task's own constraints, created `playwright.config.altport.ts` pointed at port 4399 with `reuseExistingServer: false`, ran the full suite against it, confirmed 168/168 tests passing (chromium + webkit-mobile), then deleted the temp file immediately. The real `playwright.config.ts` was never modified.
- **Files modified:** none (temp file created and deleted, never committed)
- **Verification:** `git status --short` confirms no trace of the temp config remains.
- **Committed in:** not applicable (no tracked files changed)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking — both blocking fixes were environment/verification-tooling issues, not code changes)
**Impact on plan:** No scope creep; all fixes were necessary to get a clean, trustworthy verification signal. No plan code or test assertions were weakened.

## Issues Encountered

None beyond the three deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The shared bento/morph treatment is live on all four gallery/édition detail pages (FR/EN) and fully covered by e2e tests (build, artifact, unit, and full e2e suite all green, 168/168 passing on chromium + webkit-mobile).
- No blockers. A human should eyeball the live pages for the bento composition's visual intentionality and the morph's animation feel (D4 in the coverage block above) — Playwright proves correctness/functional invariants but not subjective visual polish.

## Orchestrator Independent Re-Verification

Re-confirmed everything above directly, not just from the executor's self-report: reviewed the `GalleryGrid.astro`, `Lightbox.astro` (morph wiring), and calling-page diffs line by line; independently rebuilt in the worktree (copying `.env`, never committed); grepped `dist/galleries/paysage/index.html` (2 thumbs → one `data-size="2"` group) and `dist/galleries/the-victorian-tea-room/index.html` (11 thumbs → 3+3+3+2 groups) to prove the bento algorithm generalizes at both real extremes; confirmed zero stale `*-detail__thumb*` class references anywhere in `dist/`; re-ran the full e2e suite on an isolated port (168/168, chromium + webkit-mobile — WebKit passing confirms the no-View-Transitions fallback path is unbroken); re-ran `test:artifact` (27 HTML files) and `test:unit` (126/126) independently.

---
*Phase: 260724-dlc*
*Completed: 2026-07-24*

## Self-Check: PASSED

All 8 claimed files confirmed present on disk (`src/components/GalleryGrid.astro`, `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro`, `src/components/Lightbox.astro`, `tests/e2e/gallery.spec.ts`, `tests/e2e/edition.spec.ts`). All 4 task commit hashes confirmed present in `git log` (`3032126`, `23cdcd9`, `d299593`, `f6b3d97`).
