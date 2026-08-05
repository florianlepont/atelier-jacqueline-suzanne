---
phase: 21-homepage-scroll-experience
verified: 2026-08-05T06:57:51Z
status: human_needed
score: 5/5 must-haves verified (roadmap success criteria); 24/24 plan-level must_have truths verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Real-device pass closing phase 21 (harvested from 21-06-PLAN.md Task 2 <verify><human-check>, required by 21-VALIDATION.md's Manual-Only Verifications table before /gsd-verify-work). Run `npm run build && npm run preview -- --host`, open the printed local-network URL on a REAL phone (not an emulated viewport). On the device: (1) load the homepage fresh and look at it before scrolling; (2) scroll down slowly through the whole zoom, then through every gallery slide to the bottom; (3) scroll back up through the zoom to the top; (4) fling-scroll quickly through the slides; (5) tap a gallery photo; (6) reach for the header while mid-way through the slides. Then open the same build on a tablet and a desktop browser and compare against pre-milestone behaviour."
    expected: "1) The wordmark genuinely fills the screen on arrival, no header/title/description visible. 2) Scrolling down reads as flying into the letterforms at a cinematic (unhurried) pace, focused on the leading letter, landing on the first gallery's photo filling the screen. 3) Scrolling back up smoothly reverses the whole effect. 4) The header fades in once the zoom completes and stays reachable while scrolling the slides. 5) Slides settle one gallery at a time; a fast fling does not skip a gallery. 6) Each description appears only once its slide has settled, and the accent band colour changes with the gallery. 7) Tapping a photo opens that gallery. 8) Scrolling past the last gallery reaches the site footer. 9) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone."
    why_human: "Playwright's webkit-mobile project runs the desktop WebKit engine behind an emulated iPhone viewport — not real Mobile Safari, and has historically lagged on newer scroll APIs (scroll-snap settle, scroll-linked rAF feel). It validates logic and catches structural regressions but cannot validate the pace/anchor/settle FEEL under a real finger on real iOS — the exact quality this phase's own sketch process (sketch 015) required a real-phone pass to sign off. No grep, unit test, or emulated e2e run substitutes for it. As of this verification, no 21-UAT.md or STATE.md entry records this pass having been completed; 21-06-SUMMARY.md itself lists it as 'Not yet closed.'"
---

# Phase 21: Homepage Scroll Experience Verification Report

**Phase Goal:** On phone-width viewports, the homepage replaces the carousel/grid toggle with one continuous scroll-driven view that opens on a full-screen wordmark, zooms through the letterforms into the first gallery's photo as the visitor scrolls, and reveals each item's description as it arrives on screen — the riskiest, most subjective piece explored via sketch before implementation.
**Verified:** 2026-08-05T06:57:51Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On a phone-width viewport, the carousel/grid toggle control no longer appears on the homepage | ✓ VERIFIED | `HomeCarousel.astro` `@media (max-width: 767px)` hides `.home-hero`, `.home-grid`, and the mode-toggle button (lines ~3350-3363); e2e `homepage-scroll-deck.spec.ts` "mode-toggle and carousel/grid retirement below 767px" passes; `mobile-nav.spec.ts`'s prior toggle-visibility assertion was deleted (21-03) and replaced with a comment |
| 2 | Scrolling the homepage on a phone moves through every gallery as a single continuous sequence, with no separate carousel/grid mode | ✓ VERIFIED | `.home-scroll-deck__slides` renders one `<a data-role="deck-slide">` per gallery, in gallery order, each `height:100dvh` with `scroll-snap-align:start`/`scroll-snap-stop:always`; e2e "one slide exists per gallery, in the same order" and "every slide fills the viewport height" pass; built artifact `dist/index.html` has 5 `deck-slide` anchors matching 5 galleries |
| 3 | Each gallery's description text is hidden until that gallery arrives on screen during scroll, then reveals via the sketched-and-approved transition | ✓ VERIFIED (structurally + numerically) | `IntersectionObserver` (threshold `[0, 0.98, 1]`), never `unobserve`d, toggles `is-revealed`; CSS reuses `.home-grid__tile-description`'s exact 180ms opacity/translateY transition verbatim; e2e "before arrival: ... every description is hidden", "arrival reveals: ... reveals its description", "reversal: ... hides every description again" all pass |
| 4 | On first load, a phone visitor sees the wordmark filling the screen; scrolling visibly transitions through the letterforms into the first gallery's photo, matching the approved sketch direction | ✓ VERIFIED (structural/numeric half) — see human verification for the subjective "matches sketch direction" half | `computeWordmarkZoomState`/`computeZoomProgress` (unit-tested, 62/62 pass) drive scale 1→8.5, wordmark/photo opacity crossfade; e2e "wordmark fills most of the phone viewport", "mid-scrub scale is strictly between 1 and 8.5", "completion: wordmark fully faded, photo fully opaque", "reversibility: ... restores the rest state", "the zoom anchors on the leading letter, not the block center" all pass. The REAL-DEVICE pace/anchor "feel" check is the one item routed to human verification below |
| 5 | On tablet/desktop viewports, the carousel/grid toggle and both view modes behave exactly as they did before this milestone | ✓ VERIFIED | Full Playwright suite green on both projects: 397/397 `chromium`, 5/5 `webkit-mobile`; desktop-scoped `homepage-carousel-core`, `homepage-content-display`, `homepage-chrome-nav`, `site-header`, and the re-scoped tablet-touch block of `homepage-wordmark-peek` all pass unmodified; CSS gates every new/changed rule behind `max-width: 767px` or `min-width: 768px` |

**Score:** 5/5 roadmap success criteria structurally/numerically verified by automated evidence. 0 failed. 1 subjective/real-device quality check (part of SC4) routed to human verification per the phase's own validation contract (see below) — not yet completed as of this verification.

### Plan-Level Must-Have Truths (24 total across 6 plans)

| Plan | Truth | Status | Evidence |
|------|-------|--------|----------|
| 21-01 | Zoom curve computable from a single scroll-progress number, no DOM access | ✓ VERIFIED | `computeZoomProgress`/`computeWordmarkZoomState` are pure functions; unit tests pass |
| 21-01 | Zoom transform-origin derived from two measured rects, not a guessed percentage | ✓ VERIFIED | `computeFocusOrigin(wordmarkRect, focusRect)` implemented and unit-tested (null on zero-dim rect) |
| 21-01 | Photo-cutout filter heuristic exists in exactly one place | ✓ VERIFIED | `wordmarkPhotoFilter` exported once from `home-carousel.ts`; `grep -c "wordmarkPhotoFilter" HomeCarousel.astro` = 3 (1 import + 2 call sites), no local re-definition |
| 21-02 | Tapping a progress dash/autoplay toggle on a >=768px touch device never navigates away | ✓ VERIFIED | CR-01 guard present (`closest` check against caption in touchend handler); e2e "a tap on a progress dash does not navigate away..." and "...autoplay toggle..." pass on iPad-gen-7 viewport |
| 21-02 | Touch coverage runs at a viewport where the carousel still exists post-phase | ✓ VERIFIED | `grep -c "iPad (gen 7)"` = 2, `grep -c "iPhone 14 Pro"` = 0 in `homepage-wordmark-peek.spec.ts` |
| 21-03 | Every phone-width homepage e2e test survives carousel retirement | ✓ VERIFIED | Full suite (397 chromium / 5 webkit-mobile) green |
| 21-03 | No test asserts the mode toggle visible at phone width | ✓ VERIFIED | Only explanatory comments remain at the retired call sites; no visibility assertion below 768px found |
| 21-03 | Phase 20 hamburger nav coverage reached via a route independent of zoom header-hiding | ✓ VERIFIED | `mobile-nav.spec.ts` has 13 `emulateMedia` (reduced-motion) call sites; suite passes |
| 21-04 | Mode toggle absent/non-interactive at phone width; neither view mode renders | ✓ VERIFIED | e2e retirement test passes |
| 21-04 | Wordmark fills the screen on load at phone width | ✓ VERIFIED | e2e bounding-box test passes |
| 21-04 | One full-screen slide per gallery, gallery order, single sequence | ✓ VERIFIED | structural e2e tests pass; artifact slide count matches gallery count |
| 21-04 | Tapping a slide opens that gallery | ✓ VERIFIED | e2e "tap-to-open" test passes; slides are real `<a>` anchors (no synthesized handler) |
| 21-04 | Scrolling past the last slide reaches the footer | ✓ VERIFIED | e2e footer-reachable test passes; footer-hide rule now gated `min-width:768px` |
| 21-04 | Reduced-motion phone visitor sees descriptions already visible, no forced snapping | ✓ VERIFIED | e2e reduced-motion end-state test passes (`scroll-snap-type: none`, opacity 1) |
| 21-04 | Tablet/desktop toggle and both view modes unchanged | ✓ VERIFIED | Full suite green; desktop-regression e2e case passes |
| 21-05 | Scrolling down visibly zooms letterforms until photo fills screen | ✓ VERIFIED | e2e mid-scrub/completion cases pass |
| 21-05 | Scrolling back up smoothly reverses the zoom | ✓ VERIFIED | e2e reversibility case passes |
| 21-05 | No header chrome visible during zoom; fades in after completion | ✓ VERIFIED | e2e "header hidden during the zoom" and "header fades in on completion" pass |
| 21-05 | Zoom anchored on the measured first letter, not a guessed percentage | ✓ VERIFIED | e2e "anchors on the leading letter, not the block center" passes; `computeFocusOrigin` re-measured after `document.fonts.ready` |
| 21-05 | Reduced-motion visitor gets no scroll listener, static wordmark | ✓ VERIFIED | e2e reduced-motion case asserts absence of `zoom-active` attribute and no transform change on scroll |
| 21-05 | Nothing runs at 768px+ | ✓ VERIFIED | e2e "desktop inert" case passes; JS gate uses identical `(max-width: 767px)` breakpoint as CSS |
| 21-06 | Description hidden until settled, reveals with 180ms transition | ✓ VERIFIED | e2e arrival-reveal case passes |
| 21-06 | Scrolling back up hides description again | ✓ VERIFIED | e2e reversal case passes |
| 21-06 | Accent tracks each gallery's own hero colour on arrival | ✓ VERIFIED | e2e "accent tracks the arrived gallery" and "second slide" handoff cases pass |
| 21-06 | Phase-20 random starting accent untouched before first arrival | ✓ VERIFIED | e2e "phase-20 accent preserved" case passes; rising-edge-only write confirmed in code (`wasRevealed` guard) |
| 21-06 | Tapping a slide opens the gallery | ✓ VERIFIED | e2e tap-to-open case (this plan's own) passes |
| 21-06 | None of this attaches under reduced motion or at 768px+ | ✓ VERIFIED | e2e reduced-motion and desktop-inert cases pass |

### Code Review Findings (21-REVIEW.md) — Fix Verification

The phase's own code review found 1 critical + 3 warnings + 1 info. All 4 in-scope findings (critical + warnings) are confirmed fixed in the current codebase, not merely claimed in 21-REVIEW-FIX.md:

| Finding | Fix | Verified in codebase |
|---------|-----|----------------------|
| CR-01 (critical): desktop carousel's un-gated auto-advance silently overwrites the phone-only zoom-wordmark's text color every 6s | `phoneViewport = matchMedia('(max-width: 767px)')` gates `startAutoAdvance()`, the `keydown` handler, and re-applies on `change` | `grep -n "phoneViewport"` shows the guard at `startAutoAdvance()` (line 897), the `change` listener (975-976), and the keydown short-circuit (1052) |
| WR-01: `ZOOM_REVEAL_DISTANCE` duplicated as an untracked CSS literal | `data-reveal-distance` attribute + `--zoom-reveal-distance` custom property drive the CSS `calc()`, single source of truth | `grep -n "ZOOM_REVEAL_DISTANCE\|zoom-reveal-distance"` confirms import, attribute, and `calc(100dvh + var(--zoom-reveal-distance, 900px))` in CSS |
| WR-02: indefinite background network usage (consequence of CR-01) | No separate fix — eliminated as a consequence of CR-01's gate | Confirmed: `startAutoAdvance()`'s guard makes the `render(true)` preload tick unreachable on phones |
| WR-03: `role="tablist"`/`role="tab"` mismatched with `aria-current` | Removed `role="tablist"`/`role="tab"`, kept `role="group"` + `aria-current` | `grep -n "role=\"tablist\"\|role=\"tab\"\|role=\"group\""` confirms only `role="group"` remains on the progress-dash container |

`accessibility.spec.ts` (15/15) and the full suite pass post-fix, confirming no regression from the role change.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/home-carousel.ts` exports | `ZOOM_REVEAL_DISTANCE`, `computeZoomProgress`, `computeWordmarkZoomState`, `computeFocusOrigin`, `wordmarkPhotoFilter` | ✓ VERIFIED | All 5 present (grep confirmed); unit-tested (62/62 pass in `home-carousel.test.ts`) |
| `tests/unit/home-carousel.test.ts` | describe blocks for all 4 new functions + constant | ✓ VERIFIED | `computeZoomProgress`, `computeWordmarkZoomState`, `computeFocusOrigin`, `wordmarkPhotoFilter` describe blocks present |
| `.home-scroll-deck` markup block | sibling of `.home-hero`/`.home-grid` in `HomeCarousel.astro` | ✓ VERIFIED | Present at line 366, all `data-role` values match the artifacts contract |
| Phone-width CSS section | hides hero/grid/toggle, shows deck | ✓ VERIFIED | `@media (max-width: 767px)` block present (~3350+) |
| `min-width:768px` footer-hide gate | wraps the carousel-mode footer-hide rule | ✓ VERIFIED | Confirmed present; `homepage-chrome-nav` desktop footer-hide test still passes |
| Second `<script>` block (zoom driver) | independent from the carousel script | ✓ VERIFIED | Component contains exactly 2 `<script>` blocks; zoom driver imports the 21-01 functions |
| `tests/e2e/homepage-scroll-deck.spec.ts` | structure, zoom, arrival, reduced-motion, desktop-regression cases | ✓ VERIFIED | 31/31 tests pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `computeWordmarkZoomState`/`computeZoomProgress` (21-01) | zoom driver script (21-05) | import from `../lib/home-carousel` | ✓ WIRED | `grep -c "computeWordmarkZoomState"` = 1, `grep -c "computeZoomProgress"` = 1 in `HomeCarousel.astro` |
| `wordmarkPhotoFilter` (21-01) | frontmatter + client script | import, 2 call sites, 0 local duplicates | ✓ WIRED | `grep -c "wordmarkPhotoFilter"` = 3 total; `grep -c "from '../lib/home-carousel'"` = 2 |
| Zoom track's `getBoundingClientRect().top` | `computeZoomProgress` | `onScroll()` rAF-batched read | ✓ WIRED | Confirmed in driver script; not a bounded-div `scrollTop` |
| Deck slide `data-hero-color`/`data-hero-text-color` | `--current-accent`/`--current-accent-text` | `IntersectionObserver` rising-edge write | ✓ WIRED | `onArrival()` writes only on `reached && !wasRevealed`; `homepage-accent-random` (HOME-16) still passes |
| `ZOOM_REVEAL_DISTANCE` (TS) | CSS track height | `data-reveal-distance` attr + `--zoom-reveal-distance` custom property | ✓ WIRED | WR-01 fix confirmed live |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `.home-slide` (deck slides) | `galleries` prop (same as carousel/grid) | build-time Sanity fetch, mapped in frontmatter | Yes | ✓ FLOWING — `dist/index.html` shows 5 `data-role="deck-slide"` anchors matching 5 gallery `data-slug` entries |
| `--zoom-photo` custom property | `firstGallery.heroSrc` | same build-time gallery data | Yes | ✓ FLOWING — resolves to the same photo as slide 1's `<img>` |

### Behavioral Spot-Checks / Full Automated Verification Run

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Unit tests (home-carousel) | `npx vitest run home-carousel` | 62/62 passed | ✓ PASS |
| Full unit suite + coverage | `npm run test:coverage` | 310/310 passed; 95.16% stmt coverage (threshold 70%) | ✓ PASS |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 1 pre-existing unrelated hint | ✓ PASS |
| Lint | `npm run lint` | clean | ✓ PASS |
| Build | `npm run build` | 29 pages built | ✓ PASS |
| Static artifact | `npm run test:artifact` | verified, 29 HTML files | ✓ PASS |
| homepage-scroll-deck spec | `npx playwright test homepage-scroll-deck --project=chromium` | 31/31 passed | ✓ PASS |
| Full e2e, chromium | `npx playwright test --project=chromium` | 397/397 passed | ✓ PASS |
| Full e2e, webkit-mobile | `npx playwright test --project=webkit-mobile` | 5/5 passed | ✓ PASS |
| Accessibility (post WR-03 fix) | `npx playwright test accessibility --project=chromium` | 15/15 passed | ✓ PASS |
| homepage-wordmark-peek (CR-01 regression) | `npx playwright test homepage-wordmark-peek --project=chromium` | 40/40 passed | ✓ PASS |

### Probe Execution

Not applicable — this phase has no `scripts/*/tests/probe-*.sh` convention and none is declared in the PLAN/SUMMARY files. Skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| HOME-14 | 21-01, 21-02, 21-03, 21-04, 21-06 | Single scroll-driven view, no carousel/grid toggle; descriptions reveal on arrival | ✓ SATISFIED | Structural/reveal e2e coverage across `homepage-scroll-deck.spec.ts`; CR-01 fix verified |
| HOME-15 | 21-01, 21-04, 21-05 | Full-screen wordmark on load; scroll zooms through letterforms into first gallery's photo | ✓ SATISFIED (automated half); subjective "cinematic feel"/anchor-on-real-device half routed to human verification | Zoom driver e2e coverage (rest/scrub/completion/reversal/anchor); real-device pass outstanding |

No orphaned requirements: REQUIREMENTS.md maps only HOME-14 and HOME-15 to Phase 21, and both appear in plan frontmatter `requirements` fields (21-01 declares both; the rest split across the two).

Note: `.planning/REQUIREMENTS.md`'s checkbox list (`- [ ] HOME-14`, `- [ ] HOME-15`) and traceability table ("Pending") have not yet been updated to reflect phase completion — this is a documentation-sync item for the orchestrator post-verification, not a code gap.

### Anti-Patterns Found

None. `grep -n -E "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` against `src/components/HomeCarousel.astro` and `src/lib/home-carousel.ts` returns no matches. No stub returns, no hardcoded-empty render paths found in the new deck markup/script/CSS.

### Human Verification Required

### 1. Real-device pass closing phase 21 (required by 21-VALIDATION.md before `/gsd-verify-work`)

**Test:** Run `npm run build && npm run preview -- --host`, open the printed local-network URL on a REAL phone (not an emulated viewport). On the device: (1) load the homepage fresh and look at it before scrolling; (2) scroll down slowly through the whole zoom, then through every gallery slide to the bottom; (3) scroll back up through the zoom to the top; (4) fling-scroll quickly through the slides; (5) tap a gallery photo; (6) reach for the header while mid-way through the slides. Then open the same build on a tablet and a desktop browser and compare against pre-milestone behaviour.

**Expected:** 1) The wordmark genuinely fills the screen on arrival, no header/title/description visible. 2) Scrolling down reads as flying into the letterforms at a cinematic (unhurried) pace, focused on the leading letter, landing on the first gallery's photo filling the screen. 3) Scrolling back up smoothly reverses the whole effect. 4) The header fades in once the zoom completes and stays reachable while scrolling the slides. 5) Slides settle one gallery at a time; a fast fling does not skip a gallery. 6) Each description appears only once its slide has settled, and the accent band colour changes with the gallery. 7) Tapping a photo opens that gallery. 8) Scrolling past the last gallery reaches the site footer. 9) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone.

**Why human:** Playwright's `webkit-mobile` project runs the desktop WebKit engine behind an emulated iPhone viewport — not real Mobile Safari, and has historically lagged on newer scroll APIs (scroll-snap settle feel, scroll-linked rAF pacing). It validates logic and catches structural regressions, but cannot validate the pace/anchor/settle FEEL under a real finger on real iOS — exactly the quality this phase's own sketch process (sketch 015) required a real-phone pass to sign off originally. This item is harvested verbatim from `21-06-PLAN.md` Task 2's `<verify><human-check>` block (`workflow.human_verify_mode = end-of-phase`), and is explicitly listed as REQUIRED before `/gsd-verify-work` in `21-VALIDATION.md`'s Manual-Only Verifications table. As of this verification pass, no `21-UAT.md` exists and no `STATE.md`/summary entry records this real-device pass having been completed — `21-06-SUMMARY.md` itself states "Not yet closed."

### Gaps Summary

No code gaps were found — every automatable must-have truth (5 roadmap success criteria, 24 plan-level must-have truths, all 4 in-scope code-review findings) is verified against the live codebase with passing automated tests (unit: 310/310, e2e: 397 chromium + 5 webkit-mobile, typecheck/lint/build/artifact all clean). The single outstanding item is the phase's own mandatory real-device manual verification pass (pace/anchor/settle feel), which by its own nature cannot be automated and has not yet been recorded as performed. This routes the phase to `human_needed` rather than `passed` — once a human confirms the real-device pass (or the orchestrator captures it in a `21-UAT.md`), the phase can close cleanly.

---

_Verified: 2026-08-05T06:57:51Z_
_Verifier: Claude (gsd-verifier)_
