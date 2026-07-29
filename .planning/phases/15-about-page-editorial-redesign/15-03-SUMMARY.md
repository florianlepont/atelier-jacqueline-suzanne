---
phase: 15-about-page-editorial-redesign
plan: 03
subsystem: ui
tags: [about, motion, scroll-reveal, accessibility, editorial, astro, playwright]

# Dependency graph
requires:
  - phase: 15-about-page-editorial-redesign (plan 02)
    provides: the static two-column editorial composition and the `.about-page__exhibition` static exhibition-photo band this plan wraps with a pin/track structure
provides:
  - A pinned, scroll-scrubbed hero-photo reveal on the About page (D-04/D-05), completing ABOUT-04's motion layer
  - A dependency-free vanilla-JS scroll-driver scoped to About (`.about-page__exhibition-track/-pin/-photo`), ported from DetailHero.astro without importing/calling it
  - Reduced-motion, mobile, and (by CSS-default) no-JS fallback states for the same photo
  - Playwright motion-state coverage for the About hero in both locales
affects: [phase-16-404-page-editorial-redesign, any-future-about-page-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scroll-driven pin+shrink reveal (ported, not imported) — clamp01/lerp/computeProgress/onScroll/setup + dual matchMedia gate + clearInlineStyles, scoped per-component (About's own class names, not .detail-hero*)"

key-files:
  created: []
  modified:
    - src/components/AboutPageBody.astro
    - tests/e2e/about.spec.ts

key-decisions:
  - "REVEAL_DISTANCE=400 (not DetailHero's 900) — About's hero sits mid-page below the header/bio, not a full-100svh page hero, so a smaller reveal distance matches its gentler shrink; track height = clamp(360px, 44vw, 520px) + 400px, kept in sync with the script constant via an inline code comment on both sides."
  - "D-05 pure settle implemented as symmetric left/right inset interpolation (100% -> 86% width, i.e. a 7% inset on each side at t=1), not a left-settle + text reveal like DetailHero — there is no reveal target (no scrim, no overlay title, no format line) because sketch-014's winner explicitly chose 'no text reveal, just a tidying beat'."
  - "No <noscript> escape-hatch style block was added for the exhibition photo. DetailHero's <noscript> pattern exists to un-hide an opacity:0-by-default reveal panel for no-JS visitors. This plan's photo is never opacity-gated — its only JS-driven property is a symmetric inset that, absent JS, simply never gets set, leaving the CSS-default 100%-width (inset: 0) state fully visible. There is nothing to un-hide, so nothing to escape-hatch."
  - "No new focusable element was introduced by the D-05 resolution (pure settle has no anchor/button), so the :focus-visible convention from Task 2's action was not applicable — recorded here per the task's own instruction to note this in the SUMMARY if true."
  - "Tasks 1 and 2 (driver+pin CSS, and fallback CSS) were committed as a single atomic commit rather than two, because the fallback CSS directly depends on class names introduced in the same file edit and the two were authored together for correctness (the reduced-motion/mobile end-states must exactly match onProgress(1)'s math) — no scope creep, just a pragmatic grouping of two tightly-coupled sub-changes to the same file."

patterns-established:
  - "Per-component scroll-reveal instances scope their own class names ({component}__{element}) rather than reusing another component's — .about-page__exhibition-track/-pin/-photo mirrors but never imports .detail-hero*."

requirements-completed: [ABOUT-04]

coverage:
  - id: D1
    description: "Desktop, motion enabled: the About exhibition photo pins via position:sticky and scroll-shrinks to ~86% width via a ported vanilla-JS driver (no DetailHero import), resolving into sketch-014's pure-settle D-05 target with no text reveal."
    requirement: "ABOUT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/about.spec.ts#about hero scroll-reveal (ABOUT-04) > French/English About page: desktop pin is sticky by default (motion enabled)"
        status: unknown
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
    human_judgment: true
    rationale: "The e2e assertion could not be executed in this worktree (see Deviations — missing SANITY_PROJECT_ID/SANITY_DATASET blocks `astro build`, which the Playwright webServer requires). typecheck passed, but the runtime sticky/shrink behavior itself is unverified here; 15-04 (or the orchestrator, with real Sanity env) must run `npm run test:e2e -- about.spec.ts` to confirm pass on chromium + webkit-mobile."
  - id: D2
    description: "Desktop, prefers-reduced-motion: reduce: no sticky pin, no scroll-linked motion — settled end-state (86% width / 7% inset each side) renders immediately via CSS media query, in both /about/ and /en/about/."
    requirement: "ABOUT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/about.spec.ts#about hero scroll-reveal (ABOUT-04) > French/English About page: prefers-reduced-motion: reduce shows the settled end-state immediately, no sticky pin"
        status: unknown
    human_judgment: true
    rationale: "Same build-env gap as D1 — assertions written and typecheck-clean, but not runtime-executed in this worktree."
  - id: D3
    description: "Mobile (max-width: 767px): the exhibition photo renders as a plain static band — pin position: relative, no scroll listener attached, regardless of motion preference."
    requirement: "ABOUT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/about.spec.ts#about hero scroll-reveal (ABOUT-04) > mobile viewport renders a static band — no sticky pin, no scroll-linked motion"
        status: unknown
    human_judgment: true
    rationale: "Same build-env gap as D1/D2."

duration: ~20min
completed: 2026-07-29
status: complete
---

# Phase 15 Plan 03: About Hero Pin+Shrink Scroll Reveal Summary

**Ported DetailHero.astro's dependency-free scroll-driver into a smaller, About-scoped instance that pins and shrinks the exhibition photo to ~86% width (sketch-014's pure-settle D-05), with matching reduced-motion and mobile CSS fallbacks and new Playwright motion-state coverage.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-29T08:30:00Z
- **Tasks:** 3 completed (2 commits — Tasks 1+2 combined, Task 3 separate)
- **Files modified:** 2

## Accomplishments
- `AboutPageBody.astro`'s exhibition photo now pins (`position: sticky`) and scroll-shrinks on desktop-with-motion, using a new scoped `<script>` that ports (never imports/calls) `DetailHero.astro`'s `clamp01`/`lerp`/`computeProgress`/`onScroll`/`setup`/`clearInlineStyles` mechanism, dual-gated on `matchMedia('(prefers-reduced-motion: reduce)')` + `matchMedia('(min-width: 768px)')`.
- D-05 resolved exactly as sketch-014's winner specified: a pure motion settle (100% → 86% width, symmetric recenter), with no text/opacity-gated reveal target — so no scrim, overlay title, or format line was ported.
- Reduced-motion (desktop) and mobile fallback CSS render the correct settled/static end-state immediately, with zero JS dependency, matching the site-wide `DetailHero`/`HomeCarousel`/`Lightbox` convention.
- Added a `test.describe('about hero scroll-reveal (ABOUT-04)')` block to `tests/e2e/about.spec.ts` covering sticky-by-default, reduced-motion-settled (both locales), and mobile-static-band, targeting the new `.about-page__exhibition-pin`/`-photo` classes.

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Pin+shrink scroll-driver, sticky CSS, and reduced-motion/mobile fallback CSS** - `0044397` (feat)
2. **Task 3: Motion-state e2e assertions for the About hero reveal** - `eee191d` (test)

**Plan metadata:** committed separately by the orchestrator after wave completion (worktree mode — this executor does not write STATE.md/ROADMAP.md).

## Files Created/Modified
- `src/components/AboutPageBody.astro` - Wraps the 15-02 static exhibition band in `.about-page__exhibition-track/-pin` (photo re-classed `.about-page__exhibition-photo`); adds the scoped scroll-driver `<script>`; adds reduced-motion settled end-state CSS and mobile static-band CSS for the new classes.
- `tests/e2e/about.spec.ts` - Adds `about hero scroll-reveal (ABOUT-04)` describe block (sticky-by-default, reduced-motion-settled x2 locales, mobile-static-band).

## Decisions Made
- `REVEAL_DISTANCE = 400` (not DetailHero's 900) — sized to About's smaller mid-page shrink; track height = `clamp(360px, 44vw, 520px) + 400px`, kept in sync via an explicit comment in both the script and the CSS.
- D-05 pure settle implemented as symmetric left/right inset interpolation (100% → 86%, i.e. 7% inset each side at full scroll) rather than DetailHero's left-settle + text reveal, since sketch-014's winner explicitly chose no text reveal.
- No `<noscript>` escape-hatch block added — the photo's only JS-driven property (inset) is never opacity-gated; absent JS it simply stays at the CSS-default fully-visible 100%-width state, so there is nothing to un-hide.
- No new focusable element was introduced (pure settle has no anchor/button), so the `:focus-visible` convention from Task 2 doesn't apply here — noted per the task's own instruction.
- Tasks 1 and 2 were committed together (both are the same file, tightly coupled: the fallback CSS's end-state values must mirror `onProgress(1)`'s math) rather than as two separate commits.

## Deviations from Plan

### Auto-fixed Issues

None - the plan's design decisions (D-05 pure-settle, no reveal target, no focusable element, no noscript needed) required interpretation calls documented above under "Decisions Made" rather than bug fixes; no Rule 1/2/3 auto-fixes were needed.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** None — plan executed as specified, with the open interpretation points (D-05 resolution details, noscript applicability) resolved per the sketch-014 winner and documented above.

## Issues Encountered

**Build/e2e environment gap (documented, not weakened):** This worktree lacks `SANITY_PROJECT_ID`/`SANITY_DATASET`, so `astro build` fails at the "generating static routes" step before any page can prerender. Playwright's `webServer` (`npm run preview`) requires a prior successful `astro build`, so `npm run test:e2e -- about.spec.ts` could not be executed here. Per the plan's own acceptance criteria ("If the worktree lacks the Sanity build env and cannot build/serve, do NOT weaken the tests — record the gap in the SUMMARY for independent orchestrator verification, per the project's established pattern"), the new assertions were written to spec and verified via `npm run typecheck` (0 errors) but NOT runtime-executed. **15-04 (verification phase) or the orchestrator, running with real Sanity env, must execute `npm run test:e2e -- about.spec.ts` on both `chromium` and `webkit-mobile` to confirm the sticky/reduced-motion/mobile assertions actually pass.**

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `AboutPageBody.astro`'s motion layer is complete per ABOUT-04's ROADMAP criterion 2 (D-04/D-05) and criterion 5 (D-06 mobile + reduced-motion), pending runtime e2e confirmation noted above.
- 15-04 (or the phase's dedicated verification pass) should run the new Playwright assertions against a build with real Sanity credentials, and do a manual/visual pass on the actual scroll-shrink feel (the ~86% settle amount, `REVEAL_DISTANCE=400`) since those numeric choices were made without a live-scroll visual check in this worktree.
- No blockers for Phase 16 (404 page redesign) — it is independent of this plan's file (`AboutPageBody.astro`).

---
*Phase: 15-about-page-editorial-redesign*
*Completed: 2026-07-29*
