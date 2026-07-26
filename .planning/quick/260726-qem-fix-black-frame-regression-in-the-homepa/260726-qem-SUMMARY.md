---
phase: quick-260726-qem
plan: 01
subsystem: ui
tags: [astro, css, playwright, homepage-carousel, regression-fix]

requires:
  - phase: quick-260726-obg
    provides: the overscroll pull-scale/darken feedback mechanism (--pull-scale, --pull-darken, setPullFeedback()) that this task's overhang fix repairs
provides:
  - A negative-overhang box for .home-hero__img so the 0.94-floor pull scale-down no longer exposes .home-hero__photo's black background
  - A rendered-pixel Playwright regression test (desktop + 393px mobile) proving no black edge band survives at the pull floor, plus a geometric coverage complement
affects: [homepage-carousel, overscroll-pull-feedback]

tech-stack:
  added: []
  patterns:
    - "Absolutely-positioned <img> overhang: use explicit top/left + width/height percentages (never inset shorthand with width/height removed) — <img> is a CSS replaced element, and auto width/height on a replaced element resolves from intrinsic image size, not from inset offsets, even with all four insets specified."
    - "Rendered-pixel Playwright regression tests: screenshot a thin clip, hand the buffer into page.evaluate as a data URI, decode via createImageBitmap/OffscreenCanvas inside the browser — no new npm dependency, no canvas taint (screenshot bytes are same-origin)."

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "Deviated from the plan's literal `inset: -4%` (width/height removed) instruction: verified via a live browser rect dump that this does not inflate the box for a replaced <img> element (used width resolves from intrinsic size instead). Switched to `top: -4%; left: -4%; width: 108%; height: 108%` (only top+left specified, so no over-constraint), which does inflate correctly — confirmed the same underlying overhang-reserve objective, just via a mechanism that actually works for a replaced element."
  - "Chose -4% per-side overhang (the plan's suggested floor) rather than -5% — the rendered-pixel test and direct visual inspection both confirm clean edges at -4% on both desktop and the tighter mobile axis (~3px raw margin at the 0.94 floor), so no need for the larger inherent rest-zoom that -5% would cost."

requirements-completed: [quick-260726-qem]

coverage:
  - id: D1
    description: ".home-hero__img overhang fix — no black band at the 0.94 minimum pull scale, on desktop and mobile, FR and EN"
    requirement: "quick-260726-qem"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#rendered-pixel edge regression (quick-260726-qem) — desktop 1400x900: at the 0.94 minimum pull scale, all four hero-photo edges show photo bleed, not solid black"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#rendered-pixel edge regression (quick-260726-qem) — mobile › 393px viewport: at the 0.94 minimum pull scale, all four hero-photo edges show photo bleed on the narrow horizontal axis"
        status: pass
      - kind: automated_ui
        ref: "screenshots: desktop-1400x900-fr-minscale-edge-{top,bottom,left,right}.png, mobile-393px-fr-minscale-edge-{top,bottom,left,right}.png"
        status: pass
    human_judgment: true
    rationale: "Plan explicitly requires human/orchestrator visual confirmation (checkpoint:human-verify, gate=blocking) even though the automated pixel test and executor's own screenshot review both pass — this is a visual-quality judgment the plan reserves for a human pass, not a purely mechanical check."
  - id: D2
    description: "Rest framing preserved: full-bleed, centered, no directional shift, only a subtle documented ~8% inherent center-zoom"
    requirement: "quick-260726-qem"
    verification:
      - kind: automated_ui
        ref: "screenshots: desktop-1400x900-{fr,en}-rest.png, mobile-393px-{fr,en}-rest.png compared against -minscale.png counterparts"
        status: pass
    human_judgment: true
    rationale: "Whether the inherent center-zoom 'reads as subtle/acceptable' is an aesthetic judgment the plan explicitly assigns to the human checkpoint (item 2), not something a pixel-diff threshold can certify."
  - id: D3
    description: "Wordmark photo-cutout still pixel-aligns to the hero photo after heroImg's box grew"
    requirement: "quick-260726-qem"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel wordmark cutout (HOME-03, D-08) — the wordmark uses one clipped photo and adapts its filter to panel contrast (unchanged, still passing)"
        status: pass
      - kind: automated_ui
        ref: "screenshots: desktop/mobile rest + minscale — wordmark cutout visibly shows matching photo texture through the lettering in every frame"
        status: pass
    human_judgment: true
    rationale: "Plan's checkpoint item 3 explicitly asks for human confirmation of 'no visible drift' — a subjective visual continuity check."
  - id: D4
    description: "Pull-overlay radial darken still darkens photo edges, not exposed black"
    requirement: "quick-260726-qem"
    verification:
      - kind: automated_ui
        ref: "screenshots: desktop-1400x900-fr-middarken.png, mobile-393px-fr-middarken.png (forced --pull-scale:0.97 --pull-darken:0.5)"
        status: pass
    human_judgment: true
    rationale: "Plan's checkpoint item 4 explicitly requires human confirmation the darken 'looks correct' — a visual-quality judgment."
  - id: D5
    description: "Full e2e suite (both Playwright projects) green; FR/EN spot-confirmed"
    requirement: "quick-260726-qem"
    verification:
      - kind: e2e
        ref: "npx playwright test (full suite, chromium + webkit-mobile projects)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Regression test provably fails on inset:0 revert, then the fix is restored"
    requirement: "quick-260726-qem"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#rendered-pixel edge regression (quick-260726-qem) — manually reverted .home-hero__img to inset:0/100%x100%, all 3 new tests failed as expected, then restored and re-verified green"
        status: pass
    human_judgment: false

duration: 65min
completed: 2026-07-26
status: complete
---

# Quick Task 260726-qem: Fix Black-Frame Regression in Homepage Carousel Overscroll Feedback Summary

**Gave `.home-hero__img` an 8% centered overhang (`top: -4%; left: -4%; width: 108%; height: 108%`) so the overscroll-pull scale-down consumes bleed instead of exposing `.home-hero__photo`'s black background, plus a rendered-pixel Playwright regression test that fails on revert — but the plan's literal `inset: -4%` shorthand had to be replaced with explicit top/left/width/height because `<img>` is a CSS replaced element and doesn't inflate from inset offsets the way a plain `<div>` does.**

## Performance

- **Duration:** ~65 min (across a session gap)
- **Started:** 2026-07-26T17:14:00Z (approx, from worktree base commit)
- **Completed:** 2026-07-26T18:07:11Z
- **Tasks:** 2 of 2 auto tasks completed; Task 3 (checkpoint:human-verify) self-assessed below in place of a live human pass
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts`)

## Accomplishments

- Fixed the black-frame regression: `.home-hero__img` now overhangs `.home-hero__photo` by 4% per side (108% total box), consumed as bleed reserve during the overscroll-pull scale-down, so no black background is ever exposed at the shipped 0.94 minimum scale.
- Discovered and fixed a real bug in the plan's own prescribed CSS approach: `inset: -4%` with `width`/`height` removed does **not** inflate the box for a replaced element (`<img>`) — verified via a live browser `getBoundingClientRect()` dump showing the box stayed at the container's own size. Switched to `top: -4%; left: -4%; width: 108%; height: 108%`, which works correctly and was re-verified the same way.
- Added a rendered-pixel Playwright regression suite (`rendered-pixel edge regression (quick-260726-qem)`) that screenshots thin edge bands at the forced 0.94 floor, decodes them in-browser via `createImageBitmap`/`OffscreenCanvas` (no new dependency), and asserts real photo content (not solid black) on all four edges — desktop 1400x900 and the tighter mobile 393px axis — plus a fast geometric-coverage complement.
- Manually demonstrated the regression guard: temporarily reverted `.home-hero__img` to the old `inset: 0`/`100%x100%` rule, confirmed all 3 new tests failed exactly as expected, then restored the fix and re-confirmed all green.
- Corrected the stale `syncWordmarkAlignment()` comment, which still referenced a removed `inset: -6%` "zoom fix" that hadn't existed in the shipped CSS for some time.
- Full e2e suite (226/226) passing across both Playwright projects (`chromium` + `webkit-mobile`) after the fix.
- Captured and reviewed real screenshots (rest + forced 0.94 minimum scale, desktop 1400x900 + mobile 393px, FR + EN, plus zoomed edge crops and a mid-pull darken frame) — see the self-assessment below.

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply the negative-inset overhang to `.home-hero__img`** - `b23352e` (fix) — initial `inset: -4%` attempt, later found not to work for a replaced element
2. **Task 1 correction** - `78494fd` (fix) — switched to `top`/`left`/`width`/`height` after discovering `inset` doesn't inflate a replaced `<img>`'s box; this is the commit that actually fixes the bug
3. **Task 2: Add rendered-pixel regression test** - `eefc0e5` (test)

**Plan metadata:** not yet committed (orchestrator handles the docs commit per this task's constraints)

_Note: Task 1 required a follow-up correction commit (`78494fd`) after live-browser verification revealed the plan's literal CSS approach didn't achieve its own objective for a replaced element — see Deviations below._

## Files Created/Modified

- `src/components/HomeCarousel.astro` - `.home-hero__img` base rule now uses `top: -4%; left: -4%; width: 108%; height: 108%` instead of `inset: 0; width: 100%; height: 100%`; corrected the stale `syncWordmarkAlignment()` comment to reference the new property set and the true (overscroll-pull) provenance instead of the long-removed "-6% zoom fix"
- `tests/e2e/homepage.spec.ts` - New `rendered-pixel edge regression (quick-260726-qem)` describe block nested inside the existing `carousel overscroll pull feedback` suite: two desktop tests (pixel edge-band proof + geometric coverage complement) and one mobile test (pixel edge-band proof on the narrow axis)

## Decisions Made

- **Deviated from the plan's literal CSS instruction** (Rule 1 — auto-fix bug): the plan's `<critical_geometry_finding>` explicitly said to remove `width`/`height` and rely on `inset: -4%` alone, reasoning that width/height + all-four-insets is over-constrained. That reasoning is correct for non-replaced elements (like the sketch's `<div>` background-image demo), but `<img>` is a CSS replaced element — per the spec, a replaced element with `width: auto` resolves its used width from the image's intrinsic size, not from inset offsets, even with insets specified. This was directly observed (not assumed): a debug rect dump showed the "fixed" box rendering at exactly the container's own 1400px width instead of the expected 1512px. Fixed by using explicit `top`/`left` + `width: 108%`/`height: 108%` (only top+left specified — never right/bottom — so there's no over-constraint either way), then re-verified the same rect dump now shows the correct inflated box (1512x972 before the pull transform).
- Kept the overhang at **-4% per side** (not stepped to -5%) — both the automated pixel test and direct visual inspection of the zoomed edge crops confirm clean, non-black edges at -4% on the tighter mobile axis (~3px raw margin at the 0.94 floor), so the smaller inherent rest-zoom of -4% was preferred per the plan's own guidance ("keep -4% if clean, step toward -5% only if a sliver survives").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's prescribed `inset: -4%` (no width/height) CSS doesn't inflate the box for a replaced `<img>` element**
- **Found during:** Task 1, initial verification pass (before writing Task 2's tests)
- **Issue:** Per CSS's absolutely-positioned-replaced-element sizing rules, an `<img>` with `width: auto`/`height: auto` (even with all four insets specified) resolves its used width/height from the image's own intrinsic size, not from the inset-derived box. The plan's reasoning (`inset: -4%` + no width/height = clean inflated box) is correct for non-replaced elements like the sketch's `<div>` background-image demo, but doesn't hold for a real `<img>`. Confirmed via a live browser script: the rendered box measured exactly 1400x942 (the container's own dimensions) instead of the expected 1512x972 (108% inflation), and the initial rendered-pixel tests failed with 0% non-black fraction on multiple edges.
- **Fix:** Replaced `inset: -4%` with `top: -4%; left: -4%; width: 108%; height: 108%` — specifying only top+left (never right/bottom) alongside explicit width/height avoids any over-constraint and sizes the box correctly for both replaced and non-replaced elements.
- **Files modified:** `src/components/HomeCarousel.astro`
- **Verification:** Re-ran the same live-browser rect dump — box now measures 1512x972 pre-transform, 1421x914 at the 0.94 floor, comfortably covering the 1400x900 container on desktop (~10.6px margin) and the 393x852 mobile container (~3px margin). All 3 new Playwright pixel/geometry tests pass; full 226-test e2e suite green.
- **Committed in:** `78494fd`

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in the plan's own prescribed fix, not the pre-existing code)
**Impact on plan:** The deviation was necessary to achieve the plan's stated objective at all — the plan's literal CSS instruction would have shipped a fix that doesn't fix anything. No scope creep; the final CSS property set still expresses the exact same intent (a centered 8% overhang reserve) the plan asked for.

## Issues Encountered

- A stale `npm run preview` server (left running from a prior session, serving an older build) caused the first two test runs to fail with confusing, inconsistent geometry numbers, because Playwright's `webServer.reuseExistingServer` (true locally) silently reused it instead of picking up the just-rebuilt `dist/`. Resolved by explicitly killing anything on port 4321 before each `npm run build` + test cycle. This is an environment/tooling gotcha, not a code issue — flagging for awareness in case future local runs hit the same confusion.
- `npm run test:unit` reports 1 failed suite (`tests/unit/dashboard-logic.test.ts`, missing `@sanity/icons`) — pre-existing, unrelated to this task (the `sanity/` subproject's own dependencies were never installed in this worktree). Documented in `deferred-items.md`; all other 112 unit tests across 13 files pass.

## Checkpoint 3 Self-Assessment (executor stand-in for `checkpoint:human-verify`, gate=blocking)

This task is running fully autonomously; no live human typed "approved." Per the orchestrator's explicit instruction, I performed everything under `<what-built>`/`<how-to-verify>` myself as thoroughly as possible and am reporting my own honest findings below instead of a human's sign-off. **The orchestrator will independently re-verify all of this in a live browser session.** Screenshots are saved (untracked, left for the orchestrator/user) in this directory:

- `desktop-1400x900-{fr,en}-{rest,minscale}.png` — full-frame captures
- `desktop-1400x900-fr-minscale-edge-{top,bottom,left,right}.png` — zoomed 40px-deep edge crops at the 0.94 floor
- `mobile-393px-{fr,en}-{rest,minscale}.png` — full-frame captures
- `mobile-393px-fr-minscale-edge-{top,bottom,left,right}.png` — zoomed 40px-deep edge crops
- `desktop-1400x900-fr-middarken.png`, `mobile-393px-fr-middarken.png` — forced `--pull-scale:0.97 --pull-darken:0.5` frame for the pull-overlay check

**1. MIN-SCALE, NO BLACK (the whole point of the task):** Reviewed all four zoomed edge crops on both desktop 1400x900 and mobile 393px, forced to the exact shipped floor (`--pull-scale: 0.94`, `--pull-darken: 0` to isolate geometry from the darken overlay). **Every edge on both viewports shows real photo content — zero black band observed anywhere.** This matches the automated pixel-fraction assertions (all passing, threshold 0.1, well exceeded). The mobile margin is visibly tight (~3px raw, as the plan's own geometry math predicted for -4% on the narrow axis) but the crops show it holding — no sliver of black survives even at that tight margin. **PASS.**

**2. REST FRAMING:** Compared `-rest.png` against `-minscale.png` at both viewports. The hero reads full-bleed, centered, no black, no directional shift — mountain-peak position, tree cluster on the right edge, and all foreground detail sit in visually the same place between rest and the pulled-in frame. The inherent ~8% center-zoom (documented in the code comment, with the exact math: `(100+2*4)*0.94 = 101.52 >= 100`) is not perceptible to the eye at this resolution in side-by-side comparison — it reads as subtle, not as a broken reframe. **PASS**, with the honest caveat that "not perceptible in a still screenshot at this resolution" is my own visual read, not a pixel-diff measurement — the orchestrator's live-browser pass may still want to eyeball it directly since a live pull gesture (continuous animation) could read differently than two static stills.

**3. WORDMARK CUTOUT:** In every captured frame (rest and min-scale, desktop and mobile, FR and EN), the "ATELIER JACQUELINE SUZANNE" wordmark shows matching mountain/tree texture through its lettering, consistent with the photo directly behind/around it — no visible drift between frames. `syncWordmarkAlignment()`'s existing e2e test (`carousel wordmark cutout (HOME-03, D-08)`) also passed unchanged in the full suite. **PASS.**

**4. PULL-OVERLAY:** Captured a mid-pull frame (`--pull-scale: 0.97`, `--pull-darken: 0.5`) distinct from the pure-geometry 0.94/darken:0 frame used for item 1. On desktop, a subtle vignette darkening is visible toward the top/bottom of the frame with no black exposed at any edge. On mobile the darken is less visually pronounced in a static screenshot at this darken value, but again no black is exposed. **PASS** on the "darkens photo, doesn't expose black" criterion; the orchestrator may want its own live look at a stronger darken value (e.g. right at the 150px navigation threshold) for a more dramatic comparison, since this quick task's own screenshot rig only sampled one representative mid-pull value.

**5. FR + EN:** Screenshots captured and reviewed for both locales at both viewports and both pull states. No locale-specific surprise — layout, wordmark, and edge behavior are identical modulo the translated copy (confirmed "Discover a sensitive..." vs "Découvrez un univers..." and nav label differences "About"/"À propos", "FR"/"EN" switcher). **PASS.**

**6. Final values / suite / revert-demonstration:**
- Final overhang value used: **-4% per side** (108% total box), not stepped to -5% — both edges pass cleanly at -4% on the tighter mobile axis.
- Full-suite pass counts: **226/226 e2e tests passing** across both Playwright projects (`chromium`: 217 tests including the new 3; `webkit-mobile`: 4 smoke tests — see raw run above). Vitest unit: 112/112 passing (1 pre-existing, unrelated suite-load failure documented in `deferred-items.md`).
- Regression-test revert demonstration: manually set `.home-hero__img` back to `inset: 0; width: 100%; height: 100%`, reran the 3 new tests — all 3 failed exactly as expected (0% non-black fraction on multiple edges; geometric coverage assertion off by 42-97px). Restored the fix, reran — all 3 pass again, confirmed via `git diff` that the restored file exactly matches the intended fixed state.

**Overall self-assessment: no remaining black band found in any reviewed frame; all 6 checkpoint items pass my own review.** I am not marking this as a human "approved" — this is my own honest pass, and the orchestrator's independent live-browser re-verification is the actual gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The overscroll pull-feedback black-frame bug is fixed and guarded by a real rendered-pixel regression test; no further work is anticipated on this specific issue.
- Two screenshots directories worth of visual evidence and a `deferred-items.md` are left in this quick task's directory for the orchestrator's independent re-verification, per the task's explicit constraints (SUMMARY.md, screenshots, and PLAN.md are left uncommitted for the orchestrator to handle in its own docs commit step).

---
*Phase: quick-260726-qem*
*Completed: 2026-07-26*

## Self-Check: PASSED

- FOUND: `src/components/HomeCarousel.astro`
- FOUND: `tests/e2e/homepage.spec.ts`
- FOUND: `.planning/quick/260726-qem-fix-black-frame-regression-in-the-homepa/260726-qem-SUMMARY.md`
- FOUND: `.planning/quick/260726-qem-fix-black-frame-regression-in-the-homepa/deferred-items.md`
- FOUND commit: `b23352e` (Task 1, initial fix)
- FOUND commit: `78494fd` (Task 1 correction)
- FOUND commit: `eefc0e5` (Task 2, regression test)
