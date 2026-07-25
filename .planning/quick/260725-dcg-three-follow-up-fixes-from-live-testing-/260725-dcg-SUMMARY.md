---
phase: quick-260725-dcg
plan: 1
subsystem: ui
tags: [astro, css, playwright, homepage-carousel]

requires:
  - phase: quick-260725-cfm
    provides: "The carousel scroll-to-open feature (footer/hero-scroll-hint markup, HomeCarousel.astro overscroll accumulator) this quick task fixes follow-up issues in."
provides:
  - "Footer hidden entirely in homepage carousel mode (visible again in grid mode, unaffected on all other pages)."
  - "Scroll-open hint visible at rest and correctly fading on scroll, mirroring DetailHero's fade formula."
  - "Instagram-Stories-style accent fill on the current progress dash, synced to the real 6000ms auto-advance cycle."
affects: [homepage, HomeCarousel]

tech-stack:
  added: []
  patterns:
    - "body:has() cross-component-boundary CSS selector for reaching a sibling-of-a-wrapper element from a scoped is:global style block, when a `~` general-sibling combinator can't reach across an intervening wrapper element."
    - "JS-managed .is-filling class (remove-all -> forced reflow -> add-one) to deterministically restart a CSS keyframe animation from 0% on a specific element, decoupled from an unrelated state attribute (aria-current)."

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
    - tests/e2e/i18n.spec.ts
    - tests/e2e/legal.spec.ts

key-decisions:
  - "Footer-hide rule placed in HomeCarousel's existing is:global style block (not BaseLayout.astro) via body:has(.home[data-display-mode='carousel']) footer.chrome-band, since footer.chrome-band is not a direct sibling of .home (a <main> wrapper sits between them in BaseLayout's markup) and only ships on the homepage."
  - "Progress-dash fill restarts from 0% on every auto-advance resume (hover/focus/toggle unpause), rather than continuing from its frozen mid-pause progress — a fresh 6s interval + fresh fill are created together in startAutoAdvance() so they stay perfectly synced, per the plan's explicit timing decision."
  - "Manual navigation (goToPrev/goToNext/goToIndex) resets the 6000ms auto-advance timer only when it is currently running (timer !== null), preserving hover/focus pause semantics — a manual click during a hover-pause does not secretly resume auto-advance."

requirements-completed: [QUICK-260725-dcg]

coverage:
  - id: D1
    description: "Homepage footer is hidden while in carousel mode (FR + EN) and reappears in grid mode; unaffected on all other pages."
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#footer visibility by display mode (quick-260725-dcg)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#mobile full-bleed hero regression (HOME-06)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#tall-desktop full-bleed hero regression"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified by the orchestrator with real Sanity credentials + isolated-port Playwright run: full e2e suite (196/196) passes. Full-suite verification (beyond this task's own homepage.spec.ts scope) also found 2 pre-existing spec files broken by this fix (i18n.spec.ts, legal.spec.ts) — see Issues Encountered."
  - id: D2
    description: "Scroll-open hint is visible at rest (opacity ~0.85) and fades toward 0 over the first ~150px of scroll, mirroring DetailHero; stays hidden in grid mode; never overlaps other always-visible hero content."
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > FR: the hint is visible at rest at the top in carousel mode and hidden in grid mode"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > FR: the hint fades toward 0 as scrollY increases, mirroring DetailHero"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel scroll-to-open (quick-260725-cfm) > the hint never overlaps .home-hero__accent or .home-hero__caption, at mobile or desktop widths"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified. A real layout collision was found and fixed during this verification — see Issues Encountered — the hint's position (not just its opacity direction) needed correcting; the plan's original 'visible at rest' fix was correct in direction but exposed a pre-existing positioning conflict with .home-hero__accent/.home-hero__caption that only becomes visible once the hint is actually shown."
  - id: D3
    description: "Current progress dash shows an accent fill growing 0%->100% over the real 6000ms auto-advance cycle, freezing on hover/focus/explicit-pause, restarting on every gallery change, and showing no animated fill under reduced motion."
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel progress fill (quick-260725-dcg)"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified via e2e run and a live browser check (real computed ::after transform/animation state, progress observed advancing mid-cycle)."

duration: ~35min (+ orchestrator verification/fix pass)
completed: 2026-07-25
status: complete
---

# Quick Task 260725-dcg: Footer/Scroll-Hint/Progress-Fill Follow-up Fixes Summary

**Three follow-up fixes to the homepage carousel from live testing of quick-260725-cfm: footer now hidden in carousel mode, the "keep scrolling to open" hint now visible at rest and fading correctly on scroll (previously inverted), and a new Instagram-Stories-style accent fill on the current progress dash synced to the 6000ms auto-advance cycle.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-25T11:41:42Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Footer (`footer.chrome-band`) is now `display: none` whenever the homepage is in carousel mode, via a `body:has(.home[data-display-mode='carousel'])` rule in HomeCarousel's existing `is:global` style block — reverts cleanly in grid mode, untouched on every other page, `BaseLayout.astro` left unmodified.
- Fixed the scroll-open hint's inverted visibility: base CSS opacity changed from `0` to `0.85` and `updateHintVisibility()` rewritten to mirror `DetailHero.astro`'s exact fade formula (`Math.max(0, 1 - scrollY/150) * 0.85`), so the hint is now visible at rest and fades on scroll instead of starting hidden and appearing only once scrolling begins.
- Added a dynamic per-gallery progress-dash fill: a JS-managed `.is-filling` class drives a `scaleX(0)->scaleX(1)` CSS animation over `6000ms linear` on the current dash's `::after`, restarted via a remove-all/forced-reflow/add-current sequence (`restartFill()`) on every `render()` call (auto-advance and manual nav alike), frozen via `animation-play-state: paused` whenever the root carries `is-autoplay-paused` (set by `stopAutoAdvance()`/`startAutoAdvance()`, covering hover/focus pause and the explicit toggle), and disabled entirely under `prefers-reduced-motion: reduce`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Hide the footer in carousel mode + update footer-position regression tests** - `9cff087` (feat)
2. **Task 2: Make the scroll-open hint visible at rest and fade on scroll** - `102d51c` (fix)
3. **Task 3: Instagram-Stories fill on the current progress dash** - `b8f3e17` (feat)
4. **Orchestrator fix: reposition the hint clear of the accent panel/caption** - `abc35ef` (fix) — see Issues Encountered
5. **Orchestrator fix: update i18n.spec.ts/legal.spec.ts for the carousel-mode footer-hide** - `cd0a122` (fix) — see Issues Encountered

_All 3 tasks live in the same two files (`HomeCarousel.astro`, `homepage.spec.ts`), per the plan's own `files_modified` scope — each commit was produced by splitting the combined working-tree diff into non-overlapping hunks per task and staging them individually via `git apply --cached`, so each commit contains exactly one task's changes despite all edits landing in the same files._

## Files Created/Modified

- `src/components/HomeCarousel.astro` - Footer-hide global CSS rule; scroll-hint base opacity + `updateHintVisibility()` fade formula + init call; progress-dash `::after` fill CSS (keyframes, dim track, pause hook, reduced-motion override) + `setFillPaused()`/`restartFill()` + wiring into `stopAutoAdvance()`/`startAutoAdvance()`/`render()`/`goToPrev()`/`goToNext()`/`goToIndex()`
- `tests/e2e/homepage.spec.ts` - Updated HOME-06 mobile + tall-desktop footer regression tests to assert hidden (not below-the-fold); new `footer visibility by display mode` describe block (FR+EN); rewritten FR hint-visible-at-rest test + new fade test; new `carousel progress fill` describe block (config/liveness, pause/resume, restart-on-manual-nav, reduced-motion, FR/EN parity)

## Decisions Made

- Footer-hide rule kept entirely inside `HomeCarousel.astro`'s existing `is:global` block rather than touching `BaseLayout.astro`, using `body:has()` to bridge the component-scope boundary a `~` general-sibling selector cannot cross (a `<main>` wrapper sits between `.home` and `footer.chrome-band` in BaseLayout's markup).
- Progress-dash fill deliberately restarts from 0% on every resume (not continued from its frozen pause point) — `startAutoAdvance()` creates a fresh 6s interval and a fresh fill together so they stay perfectly synced, exactly as specified in the plan's timing decision.
- Manual navigation only resets the 6000ms timer when it's currently running (`timer !== null`), so navigating while hover-paused does not secretly resume auto-advance.

## Deviations from Plan

None - plan executed exactly as written. All three tasks, their CSS/script changes, and their e2e test updates/additions match the plan's `<action>` blocks verbatim in substance (selector, formula, class names, function wiring).

## Issues Encountered

**Executor-side: e2e/build could not run in this worktree.** No `.env` (Sanity credentials), a known standing limitation. `npx astro check` was run after every task and was clean throughout; all tests were written per spec and confirmed to typecheck.

**Orchestrator verification (with real credentials) found and fixed two real issues:**

1. **Hint/accent-panel/caption overlap (real layout bug).** After copying `.env` in and running the full suite on an isolated port, all 60 targeted `homepage.spec.ts` tests passed — but a live browser spot-check (per the plan's own recommended verification step, since D3 is genuinely visual) revealed that making the hint visible at rest (Task 2's whole point) exposed a pre-existing positioning problem the inverted-opacity bug had been silently masking: the hint is centered on the full viewport width at a fixed bottom offset, and HomeCarousel's hero already has always-visible content in exactly that space — `.home-hero__accent` (the wordmark/intro panel, desktop) and `.home-hero__caption` (title/byline, mobile, where the panel goes full-width). Confirmed via `getBoundingClientRect()` at both 1280px and 390px: the hint's text visibly overlapped the accent panel's paragraph text on desktop and the caption's byline on mobile. Root cause: DetailHero's hero (which this hint's visuals were modeled on) has no competing always-visible content, so bottom-centering never collided there; HomeCarousel's hero always does. Fixed by anchoring the hint near the top (`top: 190px`) instead — live-verified clear of both real header heights (148px desktop, 76px mobile measured) and both competing elements at both breakpoints, with a permanent `getBoundingClientRect()`-based regression test added.
2. **Two pre-existing spec files broken by Fix 1 (footer hide), outside this task's own `homepage.spec.ts` scope.** `i18n.spec.ts`'s two "locale content" tests asserted the homepage footer is always visible; `legal.spec.ts`'s "footer legal nav reachability" tests clicked footer legal links (mentions légales, confidentialité) directly from `/` without switching to grid mode first. Both are genuine regressions from Fix 1, caught by a full-suite run (not just the task's own spec file) — `legal.spec.ts` in particular is compliance-relevant (this project's CLAUDE.md flags mentions légales/confidentialité as EU legal requirements), so this was not just a test-maintenance nit. Fixed by updating `i18n.spec.ts` to the DOM-present-but-hidden contract (matching HOME-06's own established pattern) and `legal.spec.ts` to switch to grid mode before clicking the footer links, preserving the real "legal pages reachable from the homepage" guarantee rather than weakening the test.

Re-ran the full suite after both fixes: 196/196 pass, up from 191/195 (4 failures) on the first full-suite attempt.

## User Setup Required

None - no external service configuration required. (The pre-existing `.env`/Sanity-credentials gap is a known, standing limitation of this worktree, not new setup introduced by this task.)

## Next Phase Readiness

- All three fixes plus the two orchestrator-found corrections are complete: `astro check` clean, `npm run build` succeeds, `npm run test:unit` (147/147) and the full `npm run test:e2e` suite (196/196) pass with real Sanity credentials.
- Live browser spot-check performed at both 1280px and 390px confirming: footer hidden in carousel/visible in grid, hint visible at rest with no overlap, progress-dash fill actively animating (`::after` transform observed mid-cycle).
- No blockers for further homepage work.

---
*Quick task: 260725-dcg*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: src/components/HomeCarousel.astro
- FOUND: tests/e2e/homepage.spec.ts
- FOUND: .planning/quick/260725-dcg-three-follow-up-fixes-from-live-testing-/260725-dcg-SUMMARY.md
- FOUND commit: 9cff087
- FOUND commit: 102d51c
- FOUND commit: b8f3e17
