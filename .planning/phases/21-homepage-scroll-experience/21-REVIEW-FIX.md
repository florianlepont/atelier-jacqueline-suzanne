---
phase: 21-homepage-scroll-experience
fixed_at: 2026-08-10T12:27:31Z
review_path: .planning/phases/21-homepage-scroll-experience/21-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 21: Code Review Fix Report

**Fixed at:** 2026-08-10T12:27:31Z
**Source review:** .planning/phases/21-homepage-scroll-experience/21-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

This fixes the scoped, round-2 gap-closure re-review (commit `2a341bf`,
covering plans 21-11 through 21-15 only, 0 critical / 3 warning / 1 info).
It replaces the content of this file previously recorded for an *earlier*
review pass (2026-08-08, CR-01/WR-01/WR-02, commits `9e089c4`, `dcc4b45`,
`e87ba6c`, `c857372` — all still present in git history, just no longer
summarized below, since that pass's `21-REVIEW.md` has itself since been
replaced by the current, scoped round-2 review).

Per fix scope, only the 3 warning findings (WR-01/WR-02/WR-03) were
addressed; IN-01 (duplicate `.home-scroll-deck__stage` selector blocks) was
explicitly out of scope — the review itself marks it "not urgent" and it is
a pure discoverability nit with no behavioral effect.

All three fixes are confined to `src/components/HomeCarousel.astro`, as
required — no other file was touched.

## Fixed Issues

### WR-01: `applyArrival()`'s viewport-height source diverged from `--deck-vh`

**Files modified:** `src/components/HomeCarousel.astro`
**Commit:** `c163d13`
**Applied fix:** Changed `applyArrival()`'s `viewportHeight` from an
unconditional `window.innerHeight` read to
`mobile.matches && lastDeckVh !== DECK_VH_SENTINEL ? lastDeckVh : window.innerHeight`
— the same module-scope cache `syncDeckViewportHeight()` maintains and that
`frame()` already refreshes immediately before calling `applyArrival()` on
the same frame (confirmed by reading `frame()`'s body: `syncDeckViewportHeight()`
is called, then `applyIntroScrub()`, then `applyArrival()`, in that order).
Verified the exact sentinel/cache identifiers (`DECK_VH_SENTINEL`, `lastDeckVh`,
`mobile`) against current source before writing the fix — they matched the
review's paraphrase exactly, no adaptation needed. `computeSlideVisibleRatio`'s
signature and `syncDeckViewportHeight()` itself were left untouched, as
required — only `applyArrival()`'s call site changed.

### WR-02: `applyArrival()` wrote `classList` unconditionally every frame

**Files modified:** `src/components/HomeCarousel.astro`
**Commit:** `3991e4a`
**Applied fix:** Gated the `target.classList.toggle('is-revealed', reached)`
call behind `if (reached !== wasRevealed) { ... }`, mirroring the
plain-equality change-detection guards `applyProgress()` (`lastProgress`)
and `applyIntroScrub()` (`lastIntroProgress`) already use, restoring the
file's documented "zero style writes when stationary" invariant for the
arrival reveal. Confirmed the accent-liveness/next-slide-warm block
immediately below (`if (reached && !wasRevealed && target.dataset.index !== undefined)`)
was untouched and still reads the same `reached`/`wasRevealed` values
computed above the guard — this change only removes the redundant
same-value DOM write, it does not alter when the class toggles or when the
accent/warm block fires.

### WR-03: No-JS visitor at phone width never sees the pinned intro tagline

**Files modified:** `src/components/HomeCarousel.astro`
**Commit:** `db1af15`
**Applied fix:** Added a `@media (max-width: 767px) and (scripting: none)`
rule for `.home-scroll-deck__intro-body` setting `opacity: 1; transform: none;`,
placed immediately after the existing `@media (max-width: 767px) and
(prefers-reduced-motion: reduce)` override (whose selector/nesting/comment
convention it matches exactly — verified against current source, no
adaptation needed beyond confirming line numbers had shifted from the
review's paraphrase due to the WR-01/WR-02 script-block edits landing
earlier in the file). This adds a third, independent path to visibility
(no-JS) alongside the two that already existed (JS-driven scrub,
reduced-motion override) without touching either of them. Verified via a
full `astro build` that the rule compiles and survives Astro's CSS
scoping — the built stylesheet contains
`@media (width<=767px) and (scripting:none){.home-scroll-deck__intro-body[data-astro-cid-a5gaoytn]{opacity:1;transform:none}}`.

## Full Verification Run (post-fix, all 3 commits applied)

- `npm run typecheck` (astro check): 0 errors, 0 warnings, 1 pre-existing
  hint in an unrelated test file (`homepage-wordmark-peek.spec.ts:1031`,
  deprecated `webkitBackgroundClip` API usage, not introduced by these fixes).
- `npm run lint` (eslint): clean, no output.
- `npm run build` (astro build): 29 pages built successfully.
- `npm run test:artifact`: "Static artifact verified (29 HTML files, base /)".
- `npm run test:unit` (vitest): 349/349 tests passed across 16 files — no
  regression, as expected (none of these fixes touch the pure functions in
  `src/lib/home-carousel.ts`).
- `npx playwright test homepage-scroll-deck homepage-accent-random mobile-nav
  accessibility critical.smoke --project=chromium`: 173/173 passed, 0
  failed. `homepage-accent-random` (6 tests) and the accent/warm cases
  inside `homepage-scroll-deck` all stayed green with zero new failures,
  confirming WR-02's gating change did not alter accent-liveness or
  next-slide-warm behavior.
- `npx playwright test critical.smoke --project=webkit-mobile`: 5/5 passed.

WR-03's fix was not exercised by any of the above tests (Playwright's fixed
engines always run with JS enabled, so `scripting: none` never matches in
CI — this is exactly the coverage gap the review finding calls out as
untestable by the existing suite). The existing `homepage-scroll-deck`
reduced-motion and JS-driven-scrub intro cases stayed green unchanged,
confirming the new rule is additive and does not interfere with either
existing path.

## Skipped Issues

None — all in-scope findings were fixed.

Note: IN-01 (`.home-scroll-deck__stage` declared as two non-adjacent rule
blocks) was intentionally excluded from this pass per fix scope
(critical + warning only) and the review's own "not urgent" guidance. It
remains open in `21-REVIEW.md` for a future pass if this file is touched
again.

---

_Fixed: 2026-08-10T12:27:31Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
