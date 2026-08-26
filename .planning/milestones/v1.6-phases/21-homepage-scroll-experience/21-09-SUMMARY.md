---
phase: 21-homepage-scroll-experience
plan: 09
subsystem: ui
tags: [astro, css, playwright, mobile-safari, viewport-units, theme-color]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience
    provides: "plan 21-04/21-05's deck track/stage/wordmark/slide markup and CSS; plan 21-08's blur-up slide/photo layers this plan adds a paint floor behind"
provides:
  - "One constant viewport-height convention (svh, not dvh) across the deck's track, stage, wordmark padding, and every slide"
  - "A var(--color-ink) paint floor on the two photo-bearing deck surfaces (.home-slide, .home-scroll-deck__photo), scoped away from the pinned stage and deck root"
  - "An optional phoneThemeColor prop on BaseLayout.astro, rendering a phone-scoped <meta name=\"theme-color\"> only when supplied"
  - "Both homepage route files (fr + en) wired with the ink token's literal value"
  - "7 new e2e cases locking in the sizing convention, the track/stage algebra, the paint-floor scoping, and the meta tag's scoping"
affects: ["21-10 (real-device UAT pass closing all four 21-UAT.md gaps)"]

tech-stack:
  added: []
  patterns:
    - "svh (small viewport height), not dvh, for every full-bleed mobile CSS length in this codebase — dvh re-resolves live during Mobile Safari's toolbar collapse/expand and can leave a box larger than what is on screen; svh is constant and always the worst case"
    - "Photo-bearing surfaces (not shared/root containers) get an ink paint floor so a transient under-covered strip reads as intentional dark rather than the page's white background"
    - "Layout-level opt-in props with a hardcoded, non-caller-suppliable media query (phoneThemeColor) — the safest way to add a homepage-only, phone-only visual affordance to a shared layout without risking a site-wide regression"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - src/layouts/BaseLayout.astro
    - src/pages/index.astro
    - src/pages/en/index.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "Every dvh sizing declaration in the deck's phone-width CSS (track, stage, wordmark padding-block, slide height) switched to svh, matching .home-hero__photo's own real-device-validated convention and DetailHero.astro's calc(100svh + <distance>) precedent, rather than inventing a new fix"
  - "The paint floor (var(--color-ink)) is scoped to .home-slide and .home-scroll-deck__photo only — never the pinned stage or deck root, so the pre-zoom wordmark screen's white background (needed by the unsupported-engine fallback and critical.smoke.spec.ts's rendition-blocked test) stays exactly as it was"
  - "viewport-fit=cover and env(safe-area-inset-*) deliberately rejected — both would opt the whole site into rendering under the status bar, a blast radius far beyond this gap and forbidden by UI-02"
  - "Per-slide dynamic theme-colour swap deliberately rejected — the plan judged a chrome-color swap on every slide arrival to be more visually disruptive than the white flash it replaces"
  - "phoneThemeColor's phone-width media query is hardcoded into BaseLayout's meta tag rather than exposed as a second caller-supplied prop, so no call site can misuse it to tint desktop/tablet chrome"

requirements-completed: [HOME-14, HOME-15]

coverage:
  - id: D1
    description: "The deck's track, stage, wordmark padding, and every slide all size against the constant small-viewport unit (svh) instead of the live dynamic-viewport unit (dvh)"
    requirement: "HOME-14"
    verification:
      - kind: automated_ui
        ref: "grep -cE '^\\s*(height|min-height|max-height|padding-block|padding-inline):[^;]*dvh' src/components/HomeCarousel.astro == 0"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#deck sections resolve to the visible viewport height (regression net, not an iOS repro — svh/dvh coincide in a fixed-viewport test engine)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The track/stage delta still equals the reveal distance exactly, so the sticky release still coincides with zoom progress reaching 1 after the unit change"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#rendered reveal distance matches the exported ZOOM_REVEAL_DISTANCE constant (WR-01)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#track/stage delta is exactly the reveal distance (sticky-release algebra, independent of the existing WR-01 innerHeight comparison)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Photo-bearing deck surfaces (each slide, the zoom crossfade photo layer) carry a non-white paint floor; the pre-zoom wordmark stage is unchanged/transparent"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#no photo surface can paint white: every slide and the zoom photo layer carry a non-white background-color"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the wordmark screen is deliberately unchanged: the pinned stage stays transparent, proving the paint floor was scoped to photo surfaces only"
        status: pass
      - kind: e2e
        ref: "tests/e2e/critical.smoke.spec.ts#homepage wordmark stays readable while the sharp hero is unavailable"
        status: pass
    human_judgment: false
  - id: D4
    description: "Mobile Safari has a phone-scoped theme-color meta tag on the homepage only; every other page and every viewport at or above 768px is untouched"
    requirement: "HOME-15"
    verification:
      - kind: automated_ui
        ref: "grep -c 'name=\"theme-color\"' dist/index.html == 1, dist/en/index.html == 1, absent on dist/about/index.html and dist/contact/index.html"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#theme colour is present and phone-scoped"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#theme colour is homepage-only: the About page emits no theme-color meta at all"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#desktop unaffected: the deck root is still not visible and the homepage still renders its carousel"
        status: pass
    human_judgment: false
  - id: D5
    description: "Real-device confirmation that the white bar near the iPhone status bar is gone, including during Safari's toolbar collapse/expand"
    verification: []
    human_judgment: true
    rationale: "The iOS toolbar-animation artifact is real-device-only; neither Playwright project (chromium has no toolbar to animate, webkit-mobile is desktop WebKit with an emulated viewport) can reproduce it. This plan's own e2e cases lock in the structural preconditions of the fix; the plan explicitly defers visual confirmation to 21-10's real-device pass."

# Metrics
duration: ~12min
completed: 2026-08-05
status: complete
---

# Phase 21 Plan 09: Deck Viewport-Height Convention and Phone Theme Colour Summary

**Closed 21-UAT.md gap 4 (the white bar near the iPhone status bar) at both halves of its confirmed root cause: the scroll deck now sizes every full-screen section against the constant small-viewport unit (svh) instead of the live dynamic-viewport unit (dvh), photo-bearing deck surfaces carry a non-white paint floor, and the phone-width homepage now emits an explicit `theme-color` meta tag instead of leaving Mobile Safari to sample the page's white body background.**

## Performance

- **Duration:** ~12 min (3 task commits, 20:03:33-20:15:15)
- **Tasks:** 3/3 completed
- **Files modified:** 5 (`src/components/HomeCarousel.astro`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/en/index.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`)

## Accomplishments
- Every `dvh` sizing declaration in the deck's phone-width CSS (`.home-scroll-deck__track`'s height, `.home-scroll-deck__stage`'s height, `.home-scroll-deck__wordmark`'s `padding-block`, `.home-slide`'s height) switched to `svh`, matching `.home-hero__photo`'s own real-device-validated convention and `DetailHero.astro`'s existing `calc(100svh + <distance>)` precedent
- `var(--color-ink)` paint floor added to `.home-scroll-deck__photo` and `.home-slide` — the two surfaces a photograph already covers — while the pinned stage and deck root stay untouched so the pre-zoom wordmark screen's white fallback (needed by the unsupported-engine wordmark colour and `critical.smoke.spec.ts`'s rendition-blocked test) is unchanged
- An optional `phoneThemeColor` prop added to `BaseLayout.astro`, rendering `<meta name="theme-color" media="(max-width: 767px)">` only when supplied, with the phone-width media query hardcoded into the tag (not caller-suppliable) so no call site can misuse it to tint desktop/tablet chrome
- Both homepage route files (`src/pages/index.astro`, `src/pages/en/index.astro`) wired with `phoneThemeColor="#1A1A1A"`, the literal value of the `--color-ink`/`--gray-900` token
- 7 new Playwright cases in a new `homepage-scroll-deck.spec.ts` describe block covering: viewport-height resolution, the track/stage delta invariant, the paint floor's scoping (present on photo surfaces, absent on the pinned stage), the theme-color tag's presence/phone-scoping, its homepage-only scoping, and the desktop-unaffected regression guard
- `viewport-fit=cover`/`env(safe-area-inset-*)` and a per-slide dynamic theme-colour swap both recorded as deliberately rejected, with reasons, per the plan's explicit instruction not to leave these as silent omissions

## Task Commits

Each task was committed atomically:

1. **Task 1: Align the deck's viewport-height strategy and add a photo-surface paint floor (D-01/D-02/D-05/D-08)** - `fb92786` (fix)
2. **Task 2: Give the phone-width homepage a theme colour, scoped so no other page or width changes** - `c95985a` (feat)
3. **Task 3: Cover the sizing convention and the scoped theme colour** - `4cc06d8` (test)

**Plan metadata:** this commit (docs: complete plan) — see final commit below.

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Deck's phone-width CSS: `dvh` → `svh` on track/stage/wordmark-padding/slide; `var(--color-ink)` paint floor on `.home-scroll-deck__photo` and `.home-slide`; a leading comment naming the gap, the debug doc, and the rejected `viewport-fit` approach
- `src/layouts/BaseLayout.astro` - New optional `phoneThemeColor?: string` prop; conditional `<meta name="theme-color" media="(max-width: 767px)">` in `<head>`
- `src/pages/index.astro` - Passes `phoneThemeColor="#1A1A1A"` to `BaseLayout`
- `src/pages/en/index.astro` - Same, mirroring the French route
- `tests/e2e/homepage-scroll-deck.spec.ts` - New `deck viewport-height convention and phone theme colour (HOME-14, HOME-15, 21-UAT.md gap 4)` describe block, 7 cases

## Decisions Made
- Unit convention carried forward from an existing, real-device-proven site pattern (`.home-hero__photo`, `DetailHero.astro`) rather than invented fresh — lowest-risk fix for a WebKit timing defect this codebase has already solved once
- Paint floor scoped strictly to photo-bearing surfaces (never the pinned stage/deck root) so the wordmark screen's white fallback semantics are provably unchanged, verified independently by `critical.smoke.spec.ts` on both Playwright projects
- `phoneThemeColor` given no default and a hardcoded media query inside the tag — the two structural choices that make the prop safe on a shared layout reaching every page on the site (mirrors the plan's own threat register T-21-09-A mitigation)
- `viewport-fit=cover`/`env(safe-area-inset-*)` and per-slide theme-colour swaps recorded as considered-and-rejected, not silently dropped, per the plan's explicit instruction

## Deviations from Plan

None - plan executed exactly as written. One environment-setup step was needed to run verification (not a plan deviation): this worktree's own `.env` (Sanity credentials, gitignored) and `sanity/node_modules` were both absent — copied/installed from the main checkout so `npm run build` and `npm run test:coverage` could execute at all. Neither touches a tracked file or a commit.

## Issues Encountered
- **Pre-existing, out-of-scope flake reconfirmed:** `edition.spec.ts:396` ("galleries unaffected: the gallery masonry path renders identically now that éditions share it") failed once in a full 5-worker chromium run, then passed 3/3 on a targeted `--repeat-each=3` re-run. This is the exact same pre-existing `naturalWidth`/`naturalHeight`-before-load race already documented in `21-08-SUMMARY.md`'s Issues Encountered — a file and page this plan never touches. Logged per the SCOPE BOUNDARY rule, not fixed.
- **Stale port occupation from a concurrent sibling session:** port 4321 was occupied by another worktree's stale preview server (per this project's documented "concurrent sessions are the norm" convention). A temporary, untracked `playwright.debug.config.ts` on port 4399 was used for all local verification runs and deleted before this SUMMARY was written — it never touched a commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `21-UAT.md` gap 4 is closed at both halves of its confirmed root cause: no deck length resolves against the live dynamic-viewport unit any more, and the phone-width homepage now declares its own browser-chrome colour.
- D-01, D-02, D-05, D-08 all still hold (pin, snap deck, footer reachability unchanged); the track/stage delta is now asserted equal to the reveal distance by an independent e2e case in addition to the pre-existing WR-01 case.
- Full e2e suite green on both Playwright projects (420 chromium, 5 webkit-mobile — the smoke-only project) modulo the one documented, pre-existing, out-of-scope flake; `npm run test:coverage` (318 unit tests), `npm run typecheck`, `npm run lint`, and `npm run test:artifact` are all clean.
- Plan 21-10's real-device UAT pass should include: (1) confirmation the white status-bar bar is gone across a full scroll including toolbar-collapse/expand moments, and (2) the same pre-existing `edition.spec.ts:396` flake noted here and in 21-08, tracked separately.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-05*

## Self-Check: PASSED

All claimed files exist (`src/components/HomeCarousel.astro`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/en/index.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`, this SUMMARY) and all claimed commit hashes (`fb92786`, `c95985a`, `4cc06d8`) resolve in `git log`.
