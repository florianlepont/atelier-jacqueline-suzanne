---
phase: 21-homepage-scroll-experience
plan: 11
subsystem: ui
tags: [astro, css-custom-properties, visualViewport, playwright, mobile-safari, scroll]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience (plans 21-09, 21-10)
    provides: the deck's original 100svh sizing convention (21-09) and the per-frame motion driver / intro beats (21-10) that this plan's sync now runs alongside
provides:
  - "A `--deck-vh` custom property on `.home`, live-synced from `window.visualViewport`/`window.innerHeight`, replacing the deck's static `100svh` sizing"
  - "`syncDeckViewportHeight()`, a self-contained sizing sync outside the motion driver's element guard, exempt from D-15's reduced-motion gating"
  - "Every deck viewport-height length (`.home-scroll-deck__track`, `__stage`, `__wordmark` padding-block, `__intro`, `.home-slide`) expressed as `var(--deck-vh, 100svh)`"
  - "A mechanism-level Playwright regression net for the live convention (resolves near innerHeight, survives reduced motion, absent on desktop, tracks a resize)"
affects: [21-12, 21-13, 21-15]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Live-synced CSS custom property (not a static viewport unit) as the fix for a browser-chrome sizing defect, with a scale-guarded window.visualViewport read, a 1px change-detection cache, and a documented D-15 exemption for sizing-only (non-motion) scroll-adjacent JS"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "syncDeckViewportHeight() and its cache variable are declared at module scope, not nested inside `if (root) {...}`, so the later motion-driver guard's frame() can call the same function — the plan's own wording (\"guarded only on root being present\") means the function self-guards internally, not that it sits inside its own enclosing if-block"
  - "reduceMotion/mobile matchMedia queries hoisted above both guards so the sync and the motion driver share one instance of each instead of creating duplicates"
  - "--deck-vh deliberately excluded from clearInlineStyles() (the motion driver's own detach cleanup) so the property's presence/absence continues to be decided solely by the sync's own mobile.matches branch, surviving a reduced-motion or desktop-gate detach of the motion driver"

patterns-established:
  - "A sizing-correctness JS block living outside a motion driver's element guard, and outside D-15's reduced-motion gate, when it writes no transform and reads no scroll position — mirrors DetailHero.astro's own scroll-hint block"

requirements-completed: [HOME-14, HOME-15]

coverage:
  - id: D1
    description: "--deck-vh custom property is written onto .home from window.visualViewport (with a pinch-zoom scale guard) or window.innerHeight, once per >=1px change, and removed above 767px"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#phone width: --deck-vh resolves on .home to a non-empty pixel value within 2px of window.innerHeight"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#desktop (1280x800): --deck-vh is absent from .home entirely (UI-02 — nothing at 768px and above consumes or carries the unit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The sizing sync runs under reduced motion, independent of the motion driver attaching"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: 'tests/e2e/homepage-scroll-deck.spec.ts#reduced motion, phone width: --deck-vh is STILL present and still matches window.innerHeight — the sizing fix is not gated behind the motion driver'
        status: pass
    human_judgment: false
  - id: D3
    description: "Every deck viewport-height length (track, stage, wordmark padding, intro, slide) resolves from var(--deck-vh, 100svh); track/stage sticky-release algebra and every pre-existing deck geometry case is unchanged"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#deck sections resolve to the visible viewport height (regression net, not an iOS repro — svh/dvh coincide in a fixed-viewport test engine)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#track/stage delta is exactly the reveal distance (sticky-release algebra, independent of the existing WR-01 innerHeight comparison)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#resize resilience: after a viewport resize to a different phone height, --deck-vh and the first slide track the new window.innerHeight"
        status: pass
    human_judgment: false
  - id: D4
    description: "The visitor-facing truth (no white bar/gap above or below a deck section, in every intermediate Mobile Safari toolbar state) — a fixed-viewport engine cannot animate a dynamic toolbar, so this is confirmed only by the real-device check that closes the gap-closure set"
    requirement: "HOME-14"
    verification: []
    human_judgment: true
    rationale: "Deliberate per the plan's own Gap-closure gate: no fixed-viewport Playwright engine can reproduce Mobile Safari's dynamic toolbar collapse/expand. Real-device confirmation is scoped to plan 21-15."

# Metrics
duration: 14min
completed: 2026-08-09
status: complete
---

# Phase 21 Plan 11: Live Viewport-Height Sync (`--deck-vh`) Summary

**Replaced the homepage scroll deck's static `100svh` sizing with a live-synced `--deck-vh` custom property driven from `window.visualViewport`/`window.innerHeight`, closing `21-UAT.md` round-2 gap 4 (the deck undershooting the visible viewport whenever Mobile Safari's toolbar is retracted).**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-09T08:44:43+02:00 (base commit)
- **Completed:** 2026-08-09T08:58:16+02:00 (Task 3 commit)
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Added `syncDeckViewportHeight()`, a self-contained sizing sync (module-scope, guarded only on `root` internally) that writes `--deck-vh` onto `.home` from the browser's own reported current viewport size, with a pinch-zoom scale guard and 1px change-detection cache
- Deliberately exempted this sync from D-15's "no scroll-linked JS attaches under reduced motion" convention, since it drives no motion and only mirrors browser-reported geometry — the fix therefore also protects reduced-motion phone visitors
- Called the sync as the first statement of the motion driver's `frame()`, before `computeProgress()`'s `getBoundingClientRect()` read, so the same-frame forced layout reflects the new size rather than the previous frame's
- Converted every deck viewport-height length (`__track`, `__stage`, `__wordmark` padding-block, `__intro`, `.home-slide`) from bare `100svh` to `var(--deck-vh, 100svh)`, preserving the track/stage sticky-release algebra and the wordmark padding's exact 0.2 proportion
- Rewrote plan 21-09's superseded convention comment with the corrected reasoning (small-viewport bound undershoots during active scrolling; `.home-hero__photo`'s own precedent is a range, not an exact height)
- Extended the existing e2e viewport-height describe block with 4 new mechanism-level regression cases (resolves near innerHeight, survives reduced motion, absent on desktop, tracks a resize) without editing any pre-existing assertion

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the live viewport-height sync that writes --deck-vh** - `3b77a76` (feat)
2. **Task 2: Convert every deck viewport-height length to the live unit** - `118c315` (feat)
3. **Task 3: Cover the live viewport-height convention in the deck spec** - `82330c3` (test)

_No refactor commit needed — no cleanup pass required after the three feature/test commits._

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Hoisted `reduceMotion`/`mobile` matchMedia declarations above the motion driver's element guard; added `syncDeckViewportHeight()` at module scope; wired it into `frame()` as the first statement; excluded `--deck-vh` from `clearInlineStyles()`; converted 5 deck CSS rules' viewport-height terms to `var(--deck-vh, 100svh)`; rewrote the superseded plan-21-09 convention comment
- `tests/e2e/homepage-scroll-deck.spec.ts` - Added a `getDeckVh()` helper and 4 new test cases to the existing `deck viewport-height convention and phone theme colour` describe block

## Decisions Made
- `syncDeckViewportHeight()` is declared at module scope (not nested inside an `if (root) {...}` block), because the plan's own action text ("guarded only on root being present" / "returns immediately when root is absent") describes a self-guarding function callable from anywhere in the script — including from `frame()` inside the separate, later motion-driver guard block. A literal reading that wrapped the function declaration in its own `if (root) {}` block would have made it inaccessible to `frame()` under this file's ES-module strict-mode block scoping; this was caught and corrected before running any verification.
- `reduceMotion`/`mobile` are now declared exactly once, above both the sync and the motion driver, per the plan's Task 1 item 1 instruction — comments (including the byte-for-byte-767px Pitfall-2 note) were carried forward with them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree and ran `npm ci --prefix sanity`**
- **Found during:** Task 1 verification (`npm run build`) and Task 3 verification (`npm run test:coverage`)
- **Issue:** This worktree was created without the gitignored `.env` (Sanity project/dataset credentials) and without `sanity/node_modules` installed, so `npm run build` failed on a missing-env-var error and `npm run test:coverage` failed on `Cannot find package '@sanity/icons/BulbOutline'` — both pre-existing environment-setup gaps unrelated to this plan's own file changes, not new packages being introduced.
- **Fix:** Copied `/Users/florian/Projects/ajs-website/.env` into the worktree (gitignored, not committed) and ran `npm ci --prefix sanity` to install the sanity subproject's existing, lockfile-pinned dependencies — mirroring exactly the `npm ci --prefix sanity` step CLAUDE.md's own documented CI pipeline already runs. No new/different packages were selected; this reproduced the deterministic lockfile install.
- **Files modified:** None tracked (`.env` is gitignored; `sanity/node_modules` is gitignored)
- **Verification:** `npm run build`, `npm run test:coverage` (318/318 tests) both pass after the fix
- **Committed in:** N/A (no tracked files changed; environment setup only)

---

**Total deviations:** 1 auto-fixed (1 blocking, environment setup — no source changed)
**Impact on plan:** No scope creep; both actions reproduce this repo's own documented, deterministic CI setup steps rather than introducing anything new.

## Issues Encountered
- **`tests/e2e/edition.spec.ts` flake:** `galleries unaffected: the gallery masonry path renders identically now that éditions share it` failed once during the full-chromium-suite run (`ratios.naturalRatio` division producing `NaN`, an image-not-yet-loaded race), then passed on retry (`--retries=3` reported "1 flaky"). This is the same documented, pre-existing, out-of-scope flake noted in both `21-09-SUMMARY.md` and `21-10-SUMMARY.md` — unrelated to `HomeCarousel.astro` or `homepage-scroll-deck.spec.ts`. No action taken per the scope-boundary rule (fixes are limited to issues directly caused by this plan's changes).
- **Two acceptance-criteria grep bullets don't match literally, pre-existing pattern:** Task 1's `grep -c '<script'` bullet expects exactly 2 but returns 22 (20 of those are comments elsewhere in the file that mention "`<script>`" in prose, e.g. "handled in the `<script>` below" — confirmed the file still has exactly 2 real `<script>` tags via `grep -n`). Task 2's `grep -c 'min-height: 100svh'` bullet expects exactly 1 but returns 2 (the second is inside this plan's own rewritten convention comment, which quotes `.home-hero__photo`'s real declaration as the cited precedent per the plan's own action text). Both are grep-literalness artifacts of a prose-heavy, comment-dense file, not functional discrepancies — the underlying functional claims (exactly two `<script>` blocks; `.home-hero__photo`'s actual CSS declaration untouched) were verified directly and hold.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `--deck-vh` and its `var(--deck-vh, 100svh)` convention are now the single, correct viewport-height expression in the deck subtree — plans 21-12 (post-zoom dead zone) and 21-13 (pinned intro redesign) can build their new full-screen boxes on it directly rather than re-learning that `100svh` undershoots.
- Gap 4's mechanism is closed and regression-netted; the visitor-facing real-device confirmation remains correctly deferred to plan 21-15, per the plan's own Gap-closure gate.
- No blockers.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-09*
