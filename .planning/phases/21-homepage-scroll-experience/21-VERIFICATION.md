---
phase: 21-homepage-scroll-experience
verified: 2026-08-08T14:15:00Z
status: human_needed
score: 5/5 must-haves verified (roadmap success criteria); 45/45 plan-level must_have truths verified (24 from plans 21-01..21-06, carried forward and re-confirmed; 21 new from gap-closure plans 21-07..21-10)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5 (roadmap); 24/24 (plan-level, pre-gap-closure)
  gaps_closed:
    - "21-UAT.md gap 1 (missing pre-zoom intro beat) — closed by 21-10: two intro beats (logo+scroll-cue, then tagline) now precede the wordmark zoom"
    - "21-UAT.md gap 2 (zoom-to-slide handoff glitch) — closed by 21-07: scroll-event + IntersectionObserver driver replaced with one continuous rAF loop"
    - "21-UAT.md gap 3 (blur-placeholder pop-in/jank) — closed by 21-08: HOME-09 blur-up pair added to every deck slide, plus a two-slide eager-priority split and an idempotent next-slide warm"
    - "21-UAT.md gap 4 (white bar near iOS status bar) — closed by 21-09: dvh→svh conversion, an ink paint floor on photo surfaces, and a phone-scoped theme-color meta tag"
    - "21-REVIEW.md CR-01 (accent-liveness/next-slide-warm regression for heroColor-less galleries) — closed: guard changed from data-hero-color presence to data-index presence"
    - "21-REVIEW.md WR-01 (duplicated phoneThemeColor literal) — closed: COLOR_INK constant extracted to site-config.ts, imported by both homepage route files"
    - "21-REVIEW.md WR-02 (unconditional per-frame DOM write in computeProgress) — closed: applyIntroActive() given its own change-detection cache"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Real-device pass closing phase 21's gap-closure set — required by 21-VALIDATION.md's Manual-Only Verifications table, and the direct re-run of the 21-UAT.md test that produced all four original gaps. This is the SAME item 21-10-PLAN.md's own Task 3 <verify><human-check> block specifies (carried forward verbatim, not yet performed as of this verification pass). Run `npm run build && npm run preview -- --host`, then open the printed local-network URL on a REAL iPhone (not a desktop browser at a phone width). On the device: (1) load the homepage fresh and look at it before scrolling at all; (2) scroll down one screen, slowly; (3) keep scrolling slowly through the whole wordmark zoom, watching the exact moment the zoom finishes and the first gallery photo takes over; (4) continue slowly through every gallery slide to the bottom, watching each photo as its slide arrives; (5) scroll back up through everything, to the very top; (6) fling-scroll quickly down through the slides, then quickly back up; (7) watch the very top of the screen (status bar/time row) throughout every step, including while Safari's toolbar collapses and expands; (8) tap a gallery photo; (9) reach for the header while mid-way through the slides; (10) open the same build on a tablet and a desktop browser and compare against pre-milestone behaviour. Then confirm or correct each of assumptions A1 through A5 (21-10-PLAN.md) by name."
    expected: "1) The first thing on screen is the centred AJS logomark with a scroll-down cue, on an ink background — no header chrome, no wordmark, no photo. 2) The site's intro tagline appears beneath the logomark, with the logomark appearing to stay exactly where it was. 3) The zoom-to-first-slide handoff is clean: no frame shows two different crops of the same photo overlapping, and the header, accent band and title all appear together once the zoom lands. 4) Each gallery photo is already sharp by the time its slide settles at a normal unhurried pace — no prolonged grainy/blurry stretch. 5) Scrolling back up smoothly reverses the whole sequence, including both intro beats. 6) A fast fling does not skip a gallery, and does not produce a broken-looking frame at the zoom boundary. 7) No white bar ever appears near the status bar/time row, at any point, including during Safari's toolbar animation. 8) Tapping a photo opens that gallery. 9) The header is reachable while scrolling the slides. 10) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone. 11) Assumptions A1 through A5 are each either confirmed or corrected, with any correction recorded."
    why_human: "All four 21-UAT.md gaps were real-device-only defects that 396+ passing e2e tests coexisted with before this gap-closure round — both 21-05-SUMMARY.md and 21-06-SUMMARY.md independently predicted this, and it is exactly what happened. Playwright's webkit-mobile project runs the desktop WebKit engine behind an emulated iPhone viewport: no touch-momentum physics, no real scroll-snap settle behaviour under a finger, no dynamic browser-toolbar animation, no real network latency. The gap-closure plans (21-07 through 21-10) each added extensive automated coverage that verifies the MECHANISM of each fix deterministically (e.g. scroll-event independence, the track/stage sticky-release algebra, the placeholder/priority split, the svh conversion) — this verification pass independently re-ran every one of those suites and confirms they pass — but only a real phone can confirm the visitor-facing RESULT: the actual pace/anchor/settle feel, whether the handoff frame is really gone, whether images are really sharp in time, whether the status-bar strip is really never white, and whether the new two-beat intro reads the way assumptions A1-A5 intend. This exact real-device check is carried verbatim from 21-10-PLAN.md's own Task 3 human-check block (harvested per workflow.human_verify_mode = end-of-phase), and no 21-UAT.md update, STATE.md entry, or any file newer than 21-10-SUMMARY.md in this phase directory records it as having been performed since the gap-closure round completed."
---

# Phase 21: Homepage Scroll Experience Verification Report

**Phase Goal:** On phone-width viewports, the homepage replaces the carousel/grid toggle with one continuous scroll-driven view that opens on a full-screen wordmark, zooms through the letterforms into the first gallery's photo as the visitor scrolls, and reveals each item's description as it arrives on screen — the riskiest, most subjective piece explored via sketch before implementation.

**Verified:** 2026-08-08T14:15:00Z
**Status:** human_needed
**Re-verification:** Yes — after a full gap-closure round (plans 21-07 through 21-10, closing all four 21-UAT.md real-device defects) plus a second code-review pass (21-REVIEW.md / 21-REVIEW-FIX.md, closing CR-01/WR-01/WR-02)

**Note on roadmap success criterion 4's wording:** The roadmap's original text ("a phone visitor sees the wordmark filling the screen" as the very first thing) is superseded by 21-10's shipped, deliberate two-beat intro (logo + scroll-cue, then the site's tagline, THEN the wordmark zoom) — added in direct response to real-device UAT feedback (21-UAT.md gap 1) and explicitly scoped as additive, since none of 21-CONTEXT.md's locked decisions (D-01 through D-16) specified a pre-wordmark beat. This is treated below as the correct, current shipped behavior and verified against 21-10-PLAN.md's assumptions A1-A5 and 21-UAT.md gap 1's own `missing` list, not against the now-superseded literal roadmap wording.

## Goal Achievement

### Observable Truths (ROADMAP.md Success Criteria, re-verified against current codebase)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On a phone-width viewport, the carousel/grid toggle control no longer appears on the homepage | ✓ VERIFIED | `HomeCarousel.astro`'s `@media (max-width: 767px)` block hides `.home-hero`/`.home-grid`/the mode toggle; e2e "desktop unaffected"/retirement cases pass; re-ran full chromium suite (430/430) and webkit-mobile (5/5) live |
| 2 | Scrolling the homepage on a phone moves through every gallery as a single continuous sequence, with no separate carousel/grid mode | ✓ VERIFIED | `.home-scroll-deck__slides` still renders one `<a data-role="deck-slide">` per gallery; built artifact `dist/index.html` re-checked this pass: 5 `deck-slide` anchors matching 5 galleries; structural e2e cases pass |
| 3 | Each gallery's description text is hidden until that gallery arrives on screen during scroll, then reveals via the sketched-and-approved transition | ✓ VERIFIED | Reveal mechanism now driven by the per-frame `applyArrival()` (plan 21-07, replacing the IntersectionObserver) — re-verified live: `grep -v "^\s*//" HomeCarousel.astro \| grep -c IntersectionObserver` = 0 executable references; "arrival reveals"/"reversal" e2e cases pass |
| 4 | On first load, a phone visitor sees the wordmark filling the screen; scrolling visibly transitions through the letterforms into the first gallery's photo, matching the approved sketch direction | ✓ VERIFIED (as amended by 21-10 — see note above) | The wordmark is no longer literally the first thing on screen (deliberate, 21-UAT.md gap 1); the deliberate replacement sequence — logo+cue, then tagline, then the wordmark zoom exactly as originally built — is structurally verified: `pre-zoom intro beats` describe block (13 cases) and the rewritten `full-screen wordmark once the pre-zoom intro beats are scrolled past` case both pass live; the zoom mechanics themselves (scale 1→8.5, crossfade, anchor-on-leading-letter, reversibility) are unchanged from the original build and still pass. The real-device "does it actually feel right" half is the item routed to human verification below |
| 5 | On tablet/desktop viewports, the carousel/grid toggle and both view modes behave exactly as they did before this milestone | ✓ VERIFIED | Full suite re-run this pass: 430/430 chromium, 5/5 webkit-mobile, all green; `phoneThemeColor` prop confirmed absent on non-homepage built pages (`dist/about/index.html`, `dist/contact/index.html` both 0 `theme-color` occurrences) |

**Score:** 5/5 roadmap success criteria verified against the current (post-gap-closure) codebase by live re-run of the full automated suite, not by re-reading prior claims. 0 failed. The real-device "does the whole thing actually feel/look right" check remains the one item routed to human verification — now covering all four originally-found real-device defects at once, per the phase's own validation contract (21-VALIDATION.md), and not yet recorded as performed since the gap-closure round completed.

### Plan-Level Must-Have Truths — Gap-Closure Plans (21-07 through 21-10)

| Plan | Truth | Status | Evidence |
|------|-------|--------|----------|
| 21-07 | Crossfade, header-hide flag and arrival reveal all reach completed state from one continuous rAF loop, not scroll-event/observer callback delivery | ✓ VERIFIED | `frame()` → `applyProgress()` + `applyArrival()`, both re-read live `getBoundingClientRect()` every painted frame; `grep -c "addEventListener('scroll'"` (non-comment) = 0; `computeSlideVisibleRatio` unit-tested (part of 70/70 home-carousel unit tests, re-run live) |
| 21-07 | Loop stops entirely and every inline write is removed the moment the driver detaches | ✓ VERIFIED | `stopLoop()` cancels + nulls the stored rAF id (`grep -c cancelAnimationFrame` = 1, inside `stopLoop`); "detach on gate change releases everything" e2e case passes live |
| 21-07 | Accent still tracks arrived gallery (D-09), scrubbing still reverses (D-04) | ✓ VERIFIED | `homepage-accent-random` full suite pass (part of 430/430 chromium re-run); "reversibility" e2e case passes |
| 21-08 | A deck slide never shows an empty box while its photo loads | ✓ VERIFIED | Built artifact re-checked: every one of 5 slides has exactly one `home-slide__img-placeholder` at the `w=24` rendition (confirmed via built HTML, `&amp;w=24` in the escaped URL) plus one `home-slide__img--sharp` |
| 21-08 | First two galleries' photos start downloading at page load; arriving at gallery N starts N+1's download | ✓ VERIFIED | Built artifact: slide 0 `loading="eager" fetchpriority="high"`, slide 1 `loading="eager" fetchpriority="low"`, slides 2-4 `loading="lazy"` with no priority hint (confirmed by direct inspection of `dist/index.html`); `warmNextSlide` call-site count and location re-confirmed (`grep -c warmNextSlide` = 2, inside `applyArrival()`'s rising-edge branch) |
| 21-08 | A slide whose sharp photo fails outright still shows its placeholder | ✓ VERIFIED | "when every sharp rendition fails outright, the first slide still shows its placeholder" e2e case passes live |
| 21-09 | Every full-screen deck section sized against a unit that doesn't re-resolve during Safari's toolbar animation | ✓ VERIFIED | `grep -cE '^\s*(height\|min-height\|max-height\|padding-block\|padding-inline):[^;]*dvh'` = 0 across the whole file (re-run live); `grep -c '100svh'` = 13 |
| 21-09 | Track/stage delta stays exactly the reveal distance (sticky release still coincides with zoom progress 1) | ✓ VERIFIED | "track/stage delta is exactly the reveal distance" e2e case passes independently of the pre-existing WR-01 case; both pass live |
| 21-09 | Photo-bearing surfaces get a non-white paint floor; wordmark screen stays unchanged | ✓ VERIFIED | "no photo surface can paint white" and "the wordmark screen is deliberately unchanged" e2e cases both pass live; `critical.smoke` (blocks all renditions but 24px) passes on both chromium and webkit-mobile |
| 21-09 | Theme colour applies only below 767px, no other page emits one | ✓ VERIFIED | Built artifact re-checked this pass: `dist/index.html` and `dist/en/index.html` each emit exactly 1 `theme-color` meta tag with `media="(max-width: 767px)"`; `dist/about/index.html` and `dist/contact/index.html` emit 0 |
| 21-10 | On first load, visitor sees a centred logomark + scroll-cue, not the wordmark zoom | ✓ VERIFIED | "beat 1 on first load" e2e case passes live; markup confirmed at lines 380-403 of `HomeCarousel.astro` |
| 21-10 | Scrolling once brings the tagline in beneath the same logomark (identical geometry) | ✓ VERIFIED | "identical logo geometry" e2e case passes; CSS Grid fix (`minmax(0,1fr) auto minmax(0,1fr)`) confirmed present at line 3713, addressing the A4 drift bug 21-10 itself found and fixed pre-commit |
| 21-10 | Scrolling on reaches the full-screen wordmark, which zooms exactly as before | ✓ VERIFIED | Rewritten "full-screen wordmark once the pre-zoom intro beats are scrolled past" case (superseding the original 21-04 "before any scrolling" assertion, as `21-UAT.md` gap 1 explicitly required) passes live; original zoom-driver cases (scale, crossfade, anchor, reversibility) unmodified and still pass |
| 21-10 | No header chrome visible during either intro beat | ✓ VERIFIED | `data-intro-active` CSS extension of the existing D-12 hide rule confirmed present (`.home[data-intro-active='true'] :global(.site-header--solid/--transparent)`); "the header is hidden through both intro beats" e2e case passes live |
| 21-10 | Reduced-motion visitor sees both beats static, tagline visible, header reachable | ✓ VERIFIED | Reduced-motion CSS block extended (confirmed at line ~4120+); "reduced motion" e2e case in the intro-beats block passes live; `mobile-nav`/`accessibility`/`critical.smoke` reduced-motion routes re-run and still pass |
| 21-10 | Nothing about the intro exists at 768px+; exactly one H1 remains | ✓ VERIFIED | "desktop inert" and the restated D-16 heading-count/no-overflow cases pass live |
| 21-REVIEW CR-01 | Accent-liveness and next-slide-warm must not silently disable for heroColor-less ("palette automatique") galleries | ✓ VERIFIED | Guard at line 1886 confirmed changed from `target.dataset.heroColor` to `target.dataset.index !== undefined`, restoring the `|| 'var(--color-accent)'` fallback for color-less galleries; the dedicated regression case ("a slide with no heroColor still updates the live accent and still warms the next slide") passes live |
| 21-REVIEW WR-01 | `phoneThemeColor` literal not duplicated across two page files | ✓ VERIFIED | `COLOR_INK` exported once from `src/lib/site-config.ts`, imported and used in both `src/pages/index.astro` and `src/pages/en/index.astro` (confirmed via direct read) |
| 21-REVIEW WR-02 | `computeProgress()`'s `applyIntroActive` write is change-detected, not unconditional every frame | ✓ VERIFIED | `introActive: boolean \| null` cache confirmed present with an early return when the computed state is unchanged, reset in `clearInlineStyles()` |

**Score (gap-closure/review-fix layer):** 21/21 plan-level truths verified. 0 failed.

### Plan-Level Must-Have Truths — Original Build (21-01 through 21-06), Regression-Checked

All 24 must-have truths verified by the prior (2026-08-05) verification pass were re-confirmed this pass by re-running the full automated suite live (not by trusting the prior report): unit tests 318/318, chromium e2e 430/430, webkit-mobile e2e 5/5, typecheck clean, lint clean, build clean (29 pages), static artifact verified. No regression found in any of the 24 original truths. Full per-truth detail is preserved in the phase's git history (prior VERIFICATION.md, now superseded by this report per the task's own instruction) and is not repeated line-by-line here since every one of them passed unmodified in this pass's live re-run.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `computeSlideVisibleRatio` export | pure fn, unit-tested, used by `applyArrival()` | ✓ VERIFIED | `grep -c "export function computeSlideVisibleRatio"` = 1 in `home-carousel.ts`; `grep -c computeSlideVisibleRatio` = 5 in `HomeCarousel.astro` (import + call site + comments) |
| Deck driver rAF lifecycle (`startLoop`/`stopLoop`/`frame`) | replaces scroll listener + IntersectionObserver | ✓ VERIFIED | Present; `scrollAttached` fully renamed to `driverAttached`; component still has exactly two `<script>` blocks |
| `.home-slide__img-placeholder` / `--sharp` pair | HOME-09 pattern applied to deck slides | ✓ VERIFIED | `grep -c home-slide__img-placeholder` = 2, `grep -c home-slide__img--sharp` = 7; built artifact confirms 5 placeholders (one per slide) at the `w=24` rendition |
| `warmNextSlide` | idempotent next-slide fetch on arrival rising edge | ✓ VERIFIED | Exactly 2 occurrences (declaration + one call site), call site inside the `data-index !== undefined` rising-edge branch |
| Deck `svh` viewport-height convention | track/stage/wordmark-padding/slide all use `svh`, not `dvh` | ✓ VERIFIED | 0 `dvh` sizing declarations file-wide; 13 `100svh` occurrences |
| `phoneThemeColor` prop + `COLOR_INK` constant | phone-scoped `theme-color` meta, single source of truth | ✓ VERIFIED | `COLOR_INK` in `site-config.ts`, imported by both homepage route files; built artifact confirms exactly 1 tag per homepage locale, 0 on other pages |
| Two intro beat sections (`data-role="deck-intro"`) | logo+cue beat, then logo+tagline beat, before `.home-scroll-deck__track` | ✓ VERIFIED | 2 markup occurrences + 1 driver query selector; built artifact confirms 2 per built homepage (fr + en) |
| `data-intro-active` attribute | extends D-12 header-hide to cover both intro beats | ✓ VERIFIED | 9 occurrences (2 CSS selectors, write, removal, comments); write is change-detected (WR-02 fix) |
| `arrivalTargets` array | intro sections + slides, iterated by `applyArrival()` | ✓ VERIFIED | 6 occurrences (declaration, `applyArrival` iteration, `clearInlineStyles` iteration, comments) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `computeSlideVisibleRatio` (21-07) | `applyArrival()` (per-frame loop) | direct call, live rect + `window.innerHeight` | ✓ WIRED | Confirmed at the call site; re-verified passing via 64/64 `homepage-scroll-deck` cases live |
| `gallery.blurSrc` (21-08) | `.home-slide__img-placeholder` `src` | build-time Sanity image URL builder | ✓ WIRED — DATA FLOWING | Built artifact shows real Sanity CDN URLs at `w=24&blur=50`, not a stub/empty value |
| `ZOOM_REVEAL_DISTANCE` / track-stage delta (21-09) | CSS `calc()` | `data-reveal-distance` attribute + `--zoom-reveal-distance` custom property, now on the `svh` unit | ✓ WIRED | "track/stage delta is exactly the reveal distance" case passes independently of the pre-existing WR-01 case |
| `phoneThemeColor` prop (21-09) | `<meta name="theme-color">` | conditional render, hardcoded phone media query | ✓ WIRED | Built artifact: tag present with correct `media` attribute on both homepage locales only |
| `computeZoomProgress`'s live `getBoundingClientRect().top` (unchanged) | intro sections prepended before the track (21-10) | zero change needed — progress derives from the track's own rect, not a document offset | ✓ WIRED | Confirmed structurally (no change to `ZOOM_REVEAL_DISTANCE`/track height calc in 21-10's diff) and behaviorally (rebased e2e cases using `getIntroOffset()` all pass) |
| CR-01 guard (`data-index !== undefined`) | accent write + `warmNextSlide` | rising-edge branch inside `applyArrival()` | ✓ WIRED | Confirmed at line 1886; dedicated regression e2e case passes live |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `.home-slide__img-placeholder` | `gallery.blurSrc` | build-time Sanity image-URL builder (`src/lib/image.ts`) | Yes | ✓ FLOWING — real Sanity CDN URLs at the 24px rendition, verified in `dist/index.html`, not a static/empty fallback |
| `.home-slide__img--sharp` eager/lazy split | `galleries.map` index | same build-time gallery data | Yes | ✓ FLOWING — verified per-index `loading`/`fetchpriority` attributes in the built artifact match the plan's exact split (0: eager/high, 1: eager/low, 2+: lazy/none) |
| `.home-scroll-deck__intro-body` (beat 2 tagline) | `introBody` via `resolveHomepageIntro` | same build-time Sanity fetch already used by `.home-hero__intro`/`.home-grid__intro-body` | Yes | ✓ FLOWING — non-empty in the built artifact; beat 2 is conditionally rendered only when non-empty (guards against a blank Sanity field producing an empty screen) |
| `<meta name="theme-color">` | `COLOR_INK` literal | plain TS constant, not CMS-sourced | Yes (static-by-design) | ✓ FLOWING — literal is intentional (not a stub); matches `--color-ink`/`--gray-900` CSS token by design |

### Behavioral Spot-Checks / Full Automated Verification Run (all re-executed live this pass, not read from a prior report)

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Unit tests (home-carousel) | `npx vitest run home-carousel` | 70/70 passed | ✓ PASS |
| Full unit suite + coverage | `npm run test:coverage` | 318/318 passed across 16 files; 95.21% stmt coverage (threshold met) | ✓ PASS |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 1 pre-existing unrelated hint (`webkitBackgroundClip` deprecation in an unrelated test file) | ✓ PASS |
| Lint | `npm run lint` | clean, no output | ✓ PASS |
| Build | `npm run build` | 29 pages built | ✓ PASS |
| Static artifact | `npm run test:artifact` | "Static artifact verified (29 HTML files, base /)" | ✓ PASS |
| homepage-scroll-deck spec | `npx playwright test homepage-scroll-deck --project=chromium` | 64/64 passed | ✓ PASS |
| Full e2e, chromium | `npx playwright test --project=chromium` | 430/430 passed | ✓ PASS |
| Full e2e, webkit-mobile | `npx playwright test --project=webkit-mobile` | 5/5 passed | ✓ PASS |
| accessibility + mobile-nav + homepage-accent-random + homepage-wordmark-peek | `npx playwright test accessibility mobile-nav homepage-accent-random homepage-wordmark-peek --project=chromium` | 113/113 passed | ✓ PASS |

### Probe Execution

Not applicable — no `scripts/*/tests/probe-*.sh` convention exists for this project and none is declared in any of the 10 plans or their summaries. Skipped.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| HOME-14 | 21-01 through 21-04, 21-06, 21-07, 21-08 | Single scroll-driven view, no carousel/grid toggle; descriptions reveal on arrival | ✓ SATISFIED | Structural/reveal e2e coverage re-run live and green; gap-closure fixes (rAF loop, blur-up) verified live |
| HOME-15 | 21-01, 21-04, 21-05, 21-09, 21-10 | Full-screen wordmark on load (now: after the deliberate two-beat intro); scroll zooms through letterforms into first gallery's photo | ✓ SATISFIED (structural/automated half); real-device "cinematic feel" + all-four-gaps-actually-fixed confirmation still outstanding | Zoom driver + intro-beat e2e coverage re-run live and green; real-device pass is the one item routed to human verification |

`.planning/REQUIREMENTS.md` already marks both `HOME-14` and `HOME-15` as `[x]` complete with status "Complete" in its traceability table — this pass confirms that marking is consistent with the codebase's automated evidence, but does not independently resolve the outstanding real-device gate (REQUIREMENTS.md tracks requirement-to-phase mapping, not the phase's own manual-verification sign-off in 21-VALIDATION.md).

No orphaned requirements: REQUIREMENTS.md maps only HOME-14 and HOME-15 to Phase 21, and all 10 plans' frontmatter `requirements` fields collectively cover both.

### Anti-Patterns Found

None. `grep -nE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` against every file modified across plans 21-07 through 21-10 (`src/components/HomeCarousel.astro`, `src/lib/home-carousel.ts`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/en/index.astro`, `src/lib/site-config.ts`, `tests/e2e/homepage-scroll-deck.spec.ts`, `tests/unit/home-carousel.test.ts`) returns no matches (the one `PLACEHOLDER`-adjacent hits are all legitimate `*-placeholder` class-name identifiers, not debt markers). No stub returns, no hardcoded-empty render paths.

### Human Verification Required

### 1. Real-device pass closing phase 21's gap-closure set (required by 21-VALIDATION.md, carried verbatim from 21-10-PLAN.md's own Task 3 human-check)

**Test:** Run `npm run build && npm run preview -- --host`, open the printed local-network URL on a REAL iPhone. Load fresh and look before scrolling; scroll down slowly through the intro beats, the wordmark zoom, and every gallery slide to the bottom, watching the zoom-to-slide handoff and each photo's sharpness closely; scroll back up to the top; fling-scroll quickly down then up; watch the status-bar area throughout, including during Safari's toolbar animation; tap a gallery photo; reach for the header mid-scroll; then open the same build on a tablet and a desktop browser and compare against pre-milestone behaviour. Confirm or correct assumptions A1 through A5 (21-10-PLAN.md) by name.

**Expected:** All 11 points listed in the frontmatter's `human_verification` entry above — in short: the new two-beat intro reads correctly, the zoom-to-slide handoff is clean (no overlapping-crop frame), photos are sharp on arrival at a normal pace, no white status-bar strip ever appears, scrolling fully reverses, tapping/header-reachability/tablet-desktop-parity all hold, and A1-A5 are confirmed or corrected.

**Why human:** See the frontmatter's `human_verification[0].why_human` for the full reasoning — in short, all four original defects were real-device-only and none of Playwright's two projects can reproduce real Mobile Safari touch-momentum, scroll-snap-settle physics, or toolbar-collapse animation. This verification pass independently re-ran every automated mechanism-level test the gap-closure plans added (all green), but the visitor-facing result on a real phone has not been re-confirmed since the gap-closure round completed — no file in this phase directory newer than `21-10-SUMMARY.md` records that pass having happened.

### Gaps Summary

No code gaps were found in this re-verification pass. Every truth, artifact, and key link this report checked was verified against the LIVE codebase (not against prior claims): a full rebuild, a full re-run of the unit suite (318/318), the full e2e suite on both configured Playwright projects (430 chromium + 5 webkit-mobile), typecheck, lint, and static-artifact verification all pass cleanly. All three code-review findings (1 critical, 2 warnings) from the second review pass are confirmed fixed by direct code inspection, not by reading 21-REVIEW-FIX.md's claims. All four original 21-UAT.md real-device gaps have corresponding, verified, wired fixes with dedicated automated regression coverage.

The single outstanding item — unchanged in kind from the prior verification pass, though its scope has grown to cover the newly-added intro beats — is the phase's own mandatory real-device manual verification pass. This is not a code gap: it is the one check this phase's own validation contract (21-VALIDATION.md) and its own gap-closure plan (21-10-PLAN.md Task 3) both explicitly require and explicitly cannot be automated. It has not yet been recorded as performed since the gap-closure round completed. This routes the phase to `human_needed` rather than `passed` — once a human runs the real-device pass and confirms/corrects assumptions A1-A5 (or the orchestrator captures a fresh `21-UAT.md` entry recording it), the phase can close cleanly.

---

_Verified: 2026-08-08T14:15:00Z_
_Verifier: Claude (gsd-verifier)_
