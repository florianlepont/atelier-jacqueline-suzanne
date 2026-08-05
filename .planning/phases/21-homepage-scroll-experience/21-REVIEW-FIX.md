---
phase: 21-homepage-scroll-experience
fixed_at: 2026-08-05T06:49:39Z
review_path: .planning/phases/21-homepage-scroll-experience/21-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 21: Code Review Fix Report

**Fixed at:** 2026-08-05T06:49:39Z
**Source review:** .planning/phases/21-homepage-scroll-experience/21-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (critical + warning): 4
- Fixed: 4
- Skipped: 0

Fix scope was `critical_warning`, so CR-01, WR-01, WR-02, and WR-03 were in
scope; IN-01 (info) was out of scope but its recommended remediation was
folded into CR-01's fix per explicit orchestrator instruction, since the
review itself notes IN-01 needs "no separate fix beyond CR-01's gate."

## Fixed Issues

### CR-01: Mobile zoom-wordmark's text color silently cycles every 6 seconds due to the desktop carousel's un-gated auto-advance sharing `--current-accent-text` with the phone-only zoom stage

**Files modified:** `src/components/HomeCarousel.astro`
**Commit:** `782b4f7`
**Applied fix:** Added a `phoneViewport = window.matchMedia('(max-width: 767px)')`
query (matching the identical breakpoint the phone-only scroll-deck script
and CSS already use) to the desktop carousel's first `<script>` block, and
gated the single choke point every auto-advance call site already funnels
through — `startAutoAdvance()` itself — on `phoneViewport.matches`, rather
than duplicating the check at each of the many call sites (bottom-of-script
startup, focusout, the autoplay toggle, `showCarousel()`, the
reduced-motion-change listener, and the manual-nav resumes in
goToPrev/goToNext/goToIndex). Added a `phoneViewport.addEventListener('change', ...)`
listener so a resize/orientation-change crossing the breakpoint mid-session
also (re)applies the gate live, not just at initial load. Also
short-circuited the document-level `keydown` handler (`ArrowLeft`/
`ArrowRight`) on `phoneViewport.matches`, folding in IN-01's identical root
cause as instructed. This eliminates the recurring `render(true)` calls
(and their `--current-accent`/`--current-accent-text` writes) on phones
entirely, since the interval that drove them never starts there.
Verified: `npm run typecheck` (0 errors), full unit suite (310 passed),
full Playwright suite chromium+webkit-mobile (402 passed), manual
inspection of the built artifact's carousel script behavior via the
existing e2e coverage (`homepage-scroll-deck.spec.ts`, `homepage-accent-random.spec.ts`).

### WR-01: `ZOOM_REVEAL_DISTANCE` (900) is duplicated as an untracked CSS literal, with nothing enforcing the two stay in sync

**Files modified:** `src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`
**Commit:** `0243217`
**Applied fix:** Implemented fix option (a) from the review rather than
option (b) alone: imported `ZOOM_REVEAL_DISTANCE` into the frontmatter and
wrote it onto the zoom-track element as both a `data-reveal-distance`
attribute and an inline `--zoom-reveal-distance` custom property; the CSS
track-height rule now reads `calc(100dvh + var(--zoom-reveal-distance, 900px))`
instead of a hardcoded `900px` literal, so the exported TS constant is the
single source of truth and the CSS can no longer silently drift from it
(the remaining `900px` in the `var()` fallback only matters if the inline
property is ever absent). Additionally added a guard test in
`homepage-scroll-deck.spec.ts` that reads the constant back via
`data-reveal-distance` and asserts it matches the track's own live rendered
height (within 1px), independently re-deriving the expected value the way
the existing `getRevealDistance()` helper could not.
Verified: `npm run typecheck` (0 errors), `npm run build` (artifact
inspected — `data-reveal-distance="900"` present, `--zoom-reveal-distance: 900px`
present), full Playwright suite including the new guard test (402 passed).

### WR-02: Same CR-01 root cause causes indefinite background network usage on phones

**Files modified:** `src/components/HomeCarousel.astro` (same change as CR-01)
**Commit:** `782b4f7` (fixed as a direct consequence of CR-01's fix, per the review's own note: "Covered by the same fix as CR-01")
**Applied fix:** No separate code change was needed or made. Gating
`startAutoAdvance()` off at phone widths (CR-01) means the 6-second
`render(true)` tick — and the D-05 image-preload side effect inside it —
never runs on a phone in the first place, eliminating the background
hero-image download entirely.
Verified: covered by CR-01's verification (the interval's callback,
including the preload block, is provably unreachable on phone widths once
`startAutoAdvance()` no-ops there).

### WR-03: Progress-dash `role="tablist"`/`role="tab"` pairing uses `aria-current` instead of the ARIA-required `aria-selected`, and implements no tab keyboard pattern

**Files modified:** `src/components/HomeCarousel.astro`, `tests/e2e/homepage-wordmark-peek.spec.ts`
**Commit:** `c88cd55`
**Applied fix:** Implemented fix option (a) from the review (the smaller,
lower-risk change given the existing keyboard model): removed
`role="tablist"` from the progress-dash container and `role="tab"` from
each dash button, leaving `role="group"` + `aria-label` on the container
and the existing `aria-current="true"/"false"` on each button — which
correctly conveys "the current gallery" for a non-tab widget without
requiring `aria-selected` or the roving-tabindex/arrow-key tab pattern.
One e2e test (`homepage-wordmark-peek.spec.ts`) located a progress dash via
`page.getByRole('tab', { name: ... })`; updated it to
`page.getByRole('button', { name: ... })` since the implicit `<button>`
role is unaffected by the `role="tab"` removal.
Verified: `npm run typecheck` (0 errors), full Playwright suite including
`accessibility.spec.ts` and the updated `homepage-wordmark-peek.spec.ts`
test (402 passed). Note: initial post-edit test run against a stale
`dist/` build (from before this edit) produced a false-positive timeout;
rebuilding before re-running confirmed the fix.

## Full Verification Run (post-fix, all 3 commits applied)

- `npm run typecheck` (astro check): 0 errors, 0 warnings, 1 pre-existing
  hint in an unrelated test file (`homepage-wordmark-peek.spec.ts:1031`,
  deprecated `webkitBackgroundClip` API usage, not introduced by this fix).
- `npm run lint` (eslint): clean, no output.
- `npm run build` (astro build): 29 pages built successfully.
- `npm run test:artifact`: "Static artifact verified (29 HTML files, base /)".
- `npm run test:coverage` (vitest, full unit suite): 310 tests passed
  across 16 files; 95.16% statement coverage.
- `npx playwright test` (full suite, both configured projects — `chromium`
  and `webkit-mobile`, the latter scoped to `*.smoke.spec.ts` by config):
  402 passed, 0 failed.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-08-05T06:49:39Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
