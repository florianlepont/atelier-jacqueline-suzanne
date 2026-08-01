---
phase: 16-404-page-editorial-redesign
reviewed: 2026-07-29T15:34:44Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/lib/pop-rate.ts
  - src/pages/404.astro
  - tests/e2e/accessibility.spec.ts
  - tests/e2e/not-found.spec.ts
  - tests/unit/pop-rate.test.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-07-29T15:34:44Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the custom interactive 404 page: the pure pop-rate curve module (`pop-rate.ts`), the static + client-script page (`404.astro`), and the three test files covering it (unit, a11y, e2e delivery).

`pop-rate.ts` is clean: the non-finite/out-of-range input handling is correct and matches its own tests exactly (idle/dead-center/midpoint/clamping/never-throws/floor-sweep all verified by reading the implementation against `tests/unit/pop-rate.test.ts`). The client engine in `404.astro` correctly implements progressive enhancement (no-op below 2 pool photos), a single D-10 enforcement point (never re-derives the floor), proper reduced-motion branch inversion, and symmetric listener add/remove in `startPointerLoop`/`stopPointerLoop`. No crashes, injection vectors, or hardcoded secrets found.

No Critical/blocker-level issues were found. Three Warning-level and two Info-level findings are below, including (per this review's brief) an explicit, non-actionable note on the D-10 photosensitive-safety cap override, a real WCAG 3.1.2 (Language of Parts) gap on the bilingual `<h1>`/link markup that the current axe-core suite does not catch, and a stale numeric comment in the e2e drift test left over from before the D-10 override.

## Warnings

### WR-01: Mixed-language content has no `lang` attribute overrides (WCAG 3.1.2)

**File:** `src/pages/404.astro:90-99`
**Issue:** `BaseLayout.astro` sets `<html lang={locale}>` where `locale = Astro.currentLocale === 'en' ? 'en' : 'fr'` (`src/layouts/BaseLayout.astro:80`). Because `404.astro` lives at the site root (not under `en/`), its build-time `Astro.currentLocale` resolves to `'fr'`, so the page's document language is fixed at `lang="fr"` regardless of which URL actually 404'd. This is the one page on the site engineered to show French and English simultaneously in the same document ("FR and EN content must both appear together on every load"), yet none of the English-language text carries an explicit `lang="en"` override:
```astro
<h1 class="not-found__phrase">
  <span>Page introuvable</span>
  <br />
  <span>Not found</span>
</h1>
<p class="not-found__links">
  <a href={frHome}>Retourner à l'accueil</a>
  <span aria-hidden="true"> · </span>
  <a href={enHome}>Return home</a>
</p>
```
Screen readers that respect the document/element language (most modern ones do) will pronounce "Not found" and "Return home" using French phonetic rules. This is a genuine WCAG 2.1 SC 3.1.2 (Language of Parts, Level AA) violation, and it is **not** caught by `tests/e2e/accessibility.spec.ts`'s axe-core run — axe's `html-has-lang`/`valid-lang` rules only check that the document has a syntactically valid `lang` attribute, not that embedded foreign-language spans are individually tagged, so this passes the current automated a11y gate undetected.
**Fix:**
```astro
<h1 class="not-found__phrase">
  <span lang="fr">Page introuvable</span>
  <br />
  <span lang="en">Not found</span>
</h1>
<p class="not-found__links">
  <a href={frHome} lang="fr">Retourner à l'accueil</a>
  <span aria-hidden="true"> · </span>
  <a href={enHome} lang="en">Return home</a>
</p>
```

### WR-02: Stale `MIN_INTERVAL_MS` value in e2e test comment (350ms vs. actual 150ms)

**File:** `tests/e2e/not-found.spec.ts:62`
**Issue:** The comment reads:
```ts
// (proving this is the slow drift, not the fast pointer-driven rate capped by MIN_INTERVAL_MS = 350ms).
```
`MIN_INTERVAL_MS` was raised from 350ms to 150ms as part of the D-10 override documented in `src/lib/pop-rate.ts:22-38` and correctly reflected in `tests/unit/pop-rate.test.ts` (which explicitly calls out "raised from 350ms... to 150ms"). This e2e test's inline comment was not updated and still cites the pre-override value. The test's actual assertions don't depend on this number (they use hardcoded wait windows), so there's no functional bug — but a stale number sitting directly next to the file's only reasoning about the safety-relevant fast-vs-slow cadence distinction is exactly the kind of drift that misleads a future reader (or a future D-10 re-tuning) about what value is actually in force.
**Fix:** Update the comment to `MIN_INTERVAL_MS = 150ms` (or better, reference the exported constant name only, without hardcoding a value that can drift again: "...capped by `MIN_INTERVAL_MS` (currently 150ms per pop-rate.ts)").

### WR-03: D-10 photosensitive-safety cap — flagged for the record (not a defect)

**File:** `src/lib/pop-rate.ts:33-38` (consumed by `src/pages/404.astro:355-365`)
**Issue:** `MIN_INTERVAL_MS = 150` yields a worst-case cadence of ≈6.7 photo swaps/second at dead-center proximity, above the general ~3/sec threshold referenced by WCAG 2.3.1. This is documented as a deliberate, user-approved override (D-10, 2026-07-29 checkpoint) and this review is not asking for it to be reverted or "fixed" — per this review's brief it's included here as a legitimate safety observation for the audit trail, not an unreviewed magic number. One compounding detail worth noting alongside the existing documentation: the fastest cadence occurs at `proximity = 1` (dead-center), which is also where the readable heading/links content sits (`.not-found__content`, centered via `place-items: center`). A visitor whose pointer rests near the center — e.g., while reading the heading or aiming for the home links — is in the exact zone where the background is flashing fastest behind the scrim, which is a slightly stronger real-world exposure than an abstract "up to 6.7/sec somewhere on screen" framing might suggest.
**Fix:** No action requested — this is an accepted tradeoff per D-10. If revisited, consider either easing the interaction bias so the reading/interaction zone maps to something below dead-center-max speed, or keeping the existing floor with a documented rationale addendum noting this overlap.

## Info

### IN-01: No e2e coverage of the default (non-reduced-motion) pointer-driven engine

**File:** `tests/e2e/not-found.spec.ts` (whole file); compare `src/pages/404.astro:329-389`
**Issue:** `not-found.spec.ts` has exactly one test exercising interactive behavior, and it only covers the `prefers-reduced-motion: reduce` drift branch (`startDriftLoop`). The primary, non-reduced-motion pointer-proximity branch (`startPointerLoop`/`onPointerMove`/`updateProximity`/`tick`) — the actual headline feature of this phase — has no browser-level assertion at all. `tests/unit/pop-rate.test.ts` only proves the pure `proximityToInterval` math in isolation; it does not exercise the DOM wiring (event listeners attached to the right element, `swapTo` actually mutating `.is-active`, the rAF loop honoring `lastSwapAt`/`targetInterval`). A regression that broke `startPointerLoop` (e.g. wrong event name, wrong element, listener never attached) would not be caught by either test file.
**Fix:** Add an e2e test that moves `page.mouse` toward viewport center under default motion settings and asserts a materially higher swap rate over a short window than the idle/no-movement baseline (mirroring the existing `__popSwapCount` MutationObserver pattern already used for the drift test).

### IN-02: `loading="eager"` on the full pool undercuts the stated preload-competition rationale

**File:** `src/pages/404.astro:74-82`
**Issue:** The pool-capping comment (`404.astro:58-61`) justifies `.slice(0, 16)` as "bounds preload competition regardless of how many galleries Sanity ever ends up holding" — but every pooled `<img>` (all up to 16, each with a 1920px `src` + full `srcset`) is rendered with `loading="eager"` unconditionally (line 80), not just the first/active one. `fetchpriority="low"` (line 81) only affects browser prioritization among concurrent requests, not whether the request happens eagerly at all. So the pool cap bounds the competition to "at most 16 eagerly-fetched hero images" rather than eliminating the competition the comment frames it as guarding against; a low-bandwidth 404 visit still triggers up to 16 concurrent large image fetches. (Flagged as a quality/documentation-accuracy note, not a performance finding — out of this review's scope per project convention.)
**Fix:** Either narrow the comment to acknowledge this is a bound, not an elimination, of preload competition, or switch non-first pool photos to `loading="lazy"` if RESEARCH Pitfall 2 (browsers suppressing prefetch for hidden `display:none` elements) doesn't actually apply to `opacity:0` elements — worth re-confirming since `opacity:0` (unlike `display:none`) does not remove an element from the render tree, so `loading="lazy"` combined with `opacity:0` may not carry the same risk the current comment attributes only to `display:none`.

---

_Reviewed: 2026-07-29T15:34:44Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
