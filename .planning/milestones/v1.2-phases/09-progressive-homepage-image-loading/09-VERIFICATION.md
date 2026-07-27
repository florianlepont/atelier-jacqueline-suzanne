---
phase: 09-progressive-homepage-image-loading
verified: 2026-07-14T21:20:00Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 6/7
  gaps_closed:
    - "D-05: next-gallery hero photo prefetched to warm the cache — now covered by an automated Playwright test (`next-gallery hero photo is prefetched to warm the cache before the next swap (D-05)`) that asserts, via a `page.waitForRequest` predicate matching the exact next-gallery `data-hero-src` URL, that the browser actually issues that network request on reload. Independently re-run by this verifier (not just trusted from the commit message) — PASSED."
  gaps_remaining: []
  regressions: []
---

# Phase 9: Progressive Homepage Image Loading Verification Report

**Phase Goal:** The homepage page shell renders immediately, and hero/gallery photos load with priority and a smooth blur-to-sharp transition, so first-time visitors never see a blocking full-screen loading state.
**Verified:** 2026-07-14T21:20:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (D-05 automated test added, commit `65bfabc`)

## What Changed Since the Prior Pass

The prior verification (2026-07-14T19:12:28Z, status `human_needed`) found 6/7 truths VERIFIED and one, D-05 ("next gallery's hero photo is prefetched to warm the cache"), left ⚠️ PRESENT_BEHAVIOR_UNVERIFIED — the prefetch code (`new Image(); img.src = galleries[nextIndex]?.heroSrc`) was present and wired to real Sanity CDN data, but no test asserted the network request actually fired.

Commit `65bfabc` ("test(09): add automated coverage for D-05 next-photo prefetch") adds a new test to the existing `progressive image loading (HOME-09)` describe block in `tests/e2e/homepage.spec.ts`:

```
test('next-gallery hero photo is prefetched to warm the cache before the next swap (D-05)', ...)
```

The test (lines 680-699):
1. Reads the second gallery entry's `data-hero-src` from the server-rendered data island (`ul[data-role="home-carousel-data"] li`).
2. Registers `page.waitForRequest((req) => req.url() === nextHeroSrc, { timeout: 5000 })` — a predicate match (not a glob string), deliberately avoiding Sanity CDN query-string characters being misparsed as Playwright glob wildcards.
3. Reloads the homepage (triggering `render()`'s initial, synchronous prefetch call).
4. Awaits the request and asserts its URL matches exactly.

**Independent re-run (not trusted from the commit message):**

```
npx playwright test tests/e2e/homepage.spec.ts --project=chromium -g "next-gallery hero photo is prefetched"
→ 1 passed (1.8s)
```

Also re-ran the full HOME-09 block (now 6 tests, up from 5) and the full chromium e2e suite (now 76, up from 75) and the unit suite to check for regressions:

```
npx playwright test tests/e2e/homepage.spec.ts --project=chromium -g "progressive image loading"
→ 6 passed (2.4s)

npx playwright test --project=chromium
→ 76 passed (5.8s)

npm run test:unit
→ 40 passed (5 files)
```

No regressions. This closes the only gap from the prior pass — the test is real, well-formed, targets the exact behavior D-05 claims (proactive prefetch of the *next* gallery's hero image, not the current one), and passes independently under this verifier's own execution, not just the executor's.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Homepage header/nav/mode-toggle visible on load without waiting on any image `load` event (no blocking full-screen loader) | ✓ VERIFIED | `tests/e2e/homepage.spec.ts` "shell renders immediately without waiting on images" — PASSED (re-run). No loader element exists anywhere in `HomeCarousel.astro`; header/nav/toggle are rendered unconditionally in server-rendered markup. |
| 2 | Hero `<img>` carries `fetchpriority="high"` and no `loading="lazy"` | ✓ VERIFIED | `HomeCarousel.astro:179` — `fetchpriority="high"`, no `loading` attribute. e2e test "hero image is requested with high priority" — PASSED (re-run). |
| 3 | Hero photo transitions from blurred Sanity-CDN placeholder to sharp on first paint AND on every swap, ~260ms dissolve | ✓ VERIFIED | Placeholder `<img data-role="hero-image-placeholder">`; CSS 260ms opacity transition; `render()` resets `.is-loaded` before reassigning `src`. e2e test "hero blur-up..." — PASSED (re-run). |
| 4 | Grid-mode tiles show the same blur-to-sharp treatment while lazy-loading, retaining `loading="lazy"` | ✓ VERIFIED | Placeholder tile + sharp tile retaining `loading="lazy" decoding="async"`; one-time load/error listener setup. e2e tests "grid tile blur-up..." and "grid tiles stay lazy..." — both PASSED (re-run). |
| 5 | Next gallery's hero photo is prefetched after each swap so it is warm in cache by the next auto-advance (D-05) | ✓ VERIFIED | `render()` (lines 464-469): `new Image(); preload.src = galleries[nextIndex]?.heroSrc` fires on every tick against a real build-time Sanity CDN URL. **Now behaviorally proven**: e2e test "next-gallery hero photo is prefetched to warm the cache before the next swap (D-05)" asserts, via a `waitForRequest` predicate on the exact second-gallery `data-hero-src` URL, that the browser issues that network request on page load — independently re-run by this verifier, PASSED. |
| 6 | A human confirmed the 24px/blur(50) placeholder reads as a recognizable color/shape preview (not a solid blob) across 2-3 real gallery covers, carousel + grid, FR + EN | ✓ VERIFIED (human checkpoint) | Plan 09-02 is a `checkpoint:human-verify` task with `gate: blocking`, "never auto-approvable". 09-02-SUMMARY.md records sign-off with rationale ("No tuning needed — D-01's locked width(24)/blur(50) values read as recognizable color/shape previews as-is"). |
| 7 | A human confirmed toggling carousel/grid mid-fade produces no jarring glitch | ✓ VERIFIED (human checkpoint) | Same blocking checkpoint as #6; 09-02-SUMMARY.md records "no jarring flash/pop... the dissolve reads clean". |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/image.ts` — `blurPlaceholderUrl(img, width = 24)` | Build-time-only helper, `.width(24).blur(50).auto('format').url()` | ✓ VERIFIED | Present at lines 30-37, matches spec exactly. |
| `src/pages/index.astro` / `src/pages/en/index.astro` — `blurSrc: blurPlaceholderUrl(cover)` | Threaded into the galleries `.map()` alongside `heroSrc`/`gridSrc` | ✓ VERIFIED | Both files compute `blurSrc: blurPlaceholderUrl(cover)`. |
| `src/components/HomeCarousel.astro` — hero placeholder, `fetchpriority`, grid placeholder, `data-blur-src`, `blurSrc` in both `GalleryEntry` interfaces, extended `render()`, grid-tile load listener, blur-up CSS | All present per PATTERNS.md | ✓ VERIFIED | Confirmed on re-read: no regression from prior pass. |
| `tests/e2e/homepage.spec.ts` — `progressive image loading (HOME-09)` describe block | Now 6 tests (5 original + D-05 automated coverage) | ✓ VERIFIED | Block at line 613, now 6 tests. All 6 PASS on independent re-run. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `blurPlaceholderUrl()` | Astro frontmatter only | Called only from `index.astro`/`en/index.astro` | ✓ WIRED | No regression — confirmed on re-check. |
| `render()` `.is-loaded` reset | Sharp hero `<img>` `src` reassignment | Must precede, not follow | ✓ WIRED | Line 415 precedes line 416, as before. |
| `--wordmark-photo` custom property | `render()` | Synchronous, unconditional | ✓ WIRED | No regression. |
| Grid sharp `<img>` | `loading="lazy" decoding="async"` | Must be retained | ✓ WIRED | No regression. |
| Placeholder `<img>` elements | View Transition naming | Must NOT carry `view-transition-name` | ✓ WIRED | No regression. |
| New D-05 test | `render()`'s prefetch call | `page.waitForRequest` predicate on next gallery's exact `data-hero-src` | ✓ WIRED | Confirmed via independent re-run — request predicate resolves before the 5s timeout, URL match asserted. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| D-05 prefetch test alone | `npx playwright test tests/e2e/homepage.spec.ts --project=chromium -g "next-gallery hero photo is prefetched"` | 1 passed (1.8s) | ✓ PASS |
| HOME-09 e2e block (6 tests) | `npx playwright test tests/e2e/homepage.spec.ts --project=chromium -g "progressive image loading"` | 6 passed (2.4s) | ✓ PASS |
| Full e2e suite (chromium) regression check | `npx playwright test --project=chromium` | 76 passed (5.8s) | ✓ PASS |
| Full unit suite | `npm run test:unit` | 40 passed (5 files) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HOME-09 | 09-01, 09-02 | Homepage photos load progressively (priority + blur-to-sharp transition), with no blocking full-screen loading state | ✓ SATISFIED | Marked `[x]` in REQUIREMENTS.md, mapped to "Phase 9 / Complete". All 6 automated e2e assertions pass (up from 5 — D-05 now automated); both index pages wire `blurPlaceholderUrl`; human checkpoint (Plan 02) signed off on the two visual judgments. No remaining unverified truths. |

No orphaned requirements — REQUIREMENTS.md maps only HOME-09 to Phase 9, and both plans declare `requirements: [HOME-09]`.

### Anti-Patterns Found

None. Grep for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` across the new/modified test code returned zero matches. No empty implementations, no hardcoded-empty stub data.

## Gaps Summary

None. All 7 must-haves resolve to VERIFIED. The one previously-unverified truth (D-05, next-gallery cache-warming prefetch) is now backed by a genuine, independently-re-run automated test that proves the network request fires — not merely that the code exists. Phase goal fully achieved.

---

_Verified: 2026-07-14T21:20:00Z_
_Verifier: Claude (gsd-verifier)_
