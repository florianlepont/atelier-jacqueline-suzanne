---
phase: 16-404-page-editorial-redesign
verified: 2026-07-29T17:30:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 16: 404 Page Editorial Redesign Verification Report

**Phase Goal:** The 404 fallback page becomes a fully custom, interactive redesign: a full-bleed backdrop of Romane's photography popping (hard-cutting) at a pointer/touch-proximity-driven rate, with the AJS logo, a small "404" marker, and the bilingual "Page introuvable / Not found" message centered over a dimming scrim.
**Verified:** 2026-07-29
**Status:** passed
**Re-verification:** No — initial verification

## Note on known tool bug and executor-marked completion

Per the orchestrator's briefing, `gsd-tools.cjs`'s `extractPhaseToken()` mis-tokenizes this phase directory ("16-404-page-editorial-redesign") because "404" looks like a digit-leading sub-phase segment, so phase-number-only lookups were not used — the explicit phase directory path was read/verified directly instead. ROADMAP.md's checkbox and STATE.md's "milestone complete" status were marked by the last executor agent (plan 16-03) before this formal verification ran; those markings were treated as provisional and not as evidence — this report is an independent check of the actual codebase, git history, and test results.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria, cross-referenced with PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Full-bleed background of real photography, one photo at a time, hard-cutting between photos (not the bare fallback, not `PageTitleHeader`) | ✓ VERIFIED | `src/pages/404.astro` builds a `pool` from `getGalleries()` → `pickHeroIndex` → `fullSizeUrl`/`responsiveImageSrcSet` (lines 49-61), renders a `.not-found__pool` stack of `<img class="pop-photo">` with the first carrying `.is-active`. Built `dist/404.html` confirms 5 real pool `<img>` elements, exactly one with `is-active`. `.pop-photo` CSS has no `transition` (hard cut, D-05) and never uses `display:none`. |
| 2 | Photo-change rate driven by pointer/touch distance from screen center (closer = faster, farther = slower), capped at a finite maximum, per the D-10 override (≈6.7/sec, not the original ≈3/sec) | ✓ VERIFIED | `src/lib/pop-rate.ts`'s `proximityToInterval` implements the lerp curve (`MAX_INTERVAL_MS=2200` at proximity 0, `MIN_INTERVAL_MS=150` at proximity 1) with a hard `Math.max(interval, MIN_INTERVAL_MS)` floor. `tests/unit/pop-rate.test.ts` (9/9 passing, confirmed by running `npx vitest run tests/unit/pop-rate.test.ts` directly) proves the floor holds for all inputs incl. NaN/Infinity/out-of-range. `404.astro`'s client `<script>` imports these exact symbols (no local interval literal), computes proximity via a single `pointermove` listener, and drives an rAF accumulator (`tick`) that swaps `.pop-photo.is-active` when `now - lastSwapAt >= targetInterval`. The 150ms/≈6.7/sec value is a documented, git-verified, explicit user override (commits `4049bdb`, `0707207`, `181f7c2`, all authored by the actual project owner) — not a defect. |
| 3 | Centered over a dimming scrim: AJS logo, "404" marker, bilingual phrase, home links side by side | ✓ VERIFIED | `404.astro` renders `.not-found__scrim` (radial-gradient, center-weighted, z-index 2) above the pool, and `.not-found__content` (z-index 3) containing `<img class="not-found__logo" src={logoWhiteSrc}>`, `<p class="not-found__marker">404</p>`, an `<h1 class="not-found__phrase">` with both "Page introuvable" and "Not found" spans, and `.not-found__links` with `<a href={frHome}>`/`<a href={enHome}>` laid out via `display:flex` (side by side). `tests/e2e/not-found.spec.ts` asserts all these are visible; passing. |
| 4 | `prefers-reduced-motion` shows a slow, constant drift instead of pointer-driven popping | ✓ VERIFIED | `404.astro`'s script branches on `matchMedia('(prefers-reduced-motion: reduce)')`: the reduced-motion branch attaches no `pointermove` listener and runs `setInterval(..., DRIFT_INTERVAL_MS)` (4000ms). `tests/e2e/not-found.spec.ts`'s "under reduced motion..." test (using `page.emulateMedia` + a MutationObserver swap counter) passed when run directly: ≥1 swap in a 5s window (alive, not frozen) and ≤1 swap in a 1.5s window with the pointer at dead-center (pointer genuinely ignored). |
| 5 | 404 page renders correctly in both French and English (both shown together on every load) | ✓ VERIFIED | `404.astro` has no locale routing (unchanged structural constraint); `public/.htaccess` still serves this one file for all 404s. `dist/404.html` (built with `EXPECTED_BASE=/`) contains both `href="/"` and `href="/en/"`, and both "Page introuvable" and "Not found" render on the same load. `EXPECTED_BASE=/ npm run test:artifact` passed. `not-found.spec.ts` asserts both link hrefs and both language strings visible on a single `page.goto`; passing. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/pop-rate.ts` | Pure proximity→interval module, MIN/MAX/DRIFT constants, no browser globals | ✓ VERIFIED | Exists, exports exactly `MIN_INTERVAL_MS` (150), `MAX_INTERVAL_MS` (2200), `DRIFT_INTERVAL_MS` (4000), `proximityToInterval`. No `window`/`document`/`matchMedia` reference (source-confirmed). |
| `tests/unit/pop-rate.test.ts` | Fixture-free contract suite | ✓ VERIFIED | 9 `it` cases, all passing (`npx vitest run` confirms 9/9 green). |
| `src/pages/404.astro` | Full rewrite: static shell + client engine | ✓ VERIFIED | Frontmatter photo-pool sourcing, markup with pool/scrim/content, scoped CSS, and the client `<script>` engine are all present and match the PLAN's DOM/class contract exactly. |
| `tests/e2e/not-found.spec.ts` | Static assertions + reduced-motion case | ✓ VERIFIED | Both tests present and passing when run directly. |
| `tests/e2e/accessibility.spec.ts` | 404 axe coverage added | ✓ VERIFIED | Dedicated `test('the 404 page has no serious or critical automated accessibility violations', ...)` block present; passed when run directly (part of the 13/13 green run). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `404.astro` `<script>` | `src/lib/pop-rate.ts` | `import { proximityToInterval, MIN_INTERVAL_MS, MAX_INTERVAL_MS, DRIFT_INTERVAL_MS } from '../lib/pop-rate'` | ✓ WIRED | Import present; no local interval-floor literal found in `404.astro` (source-grepped: only the imported symbols are used). |
| `404.astro` frontmatter | `src/lib/sanity.ts` / `src/lib/image.ts` / `src/lib/image-orientation.ts` | build-time `getGalleries()` → `pickHeroIndex` → `fullSizeUrl`/`responsiveImageSrcSet` | ✓ WIRED | Confirmed real gallery data flows into the built artifact (5 real pool images in `dist/404.html`, not a static empty array). |
| `404.astro` home links | `astro:i18n` | `getRelativeLocaleUrl('fr'/'en', '')` rendered as literal `<a href>` | ✓ WIRED | CR-01 pattern preserved; `dist/404.html` (built with base `/`) contains `href="/"` and `href="/en/"` exactly. |
| Client engine | Static DOM contract (16-02) | `document.querySelector('.not-found')` / `.pop-photo` NodeList | ✓ WIRED | Engine queries and mutates exactly the classes the static shell renders; progressive-enhancement no-op guard (`photos.length >= 2`) present. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `404.astro` pool `<img>` stack | `pool` | `getGalleries()` (Sanity, build-time) | Yes — 5 real photo URLs in built `dist/404.html`, not a static/empty fallback | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Pop-rate math unit contract (incl. D-10 floor invariant) | `npx vitest run tests/unit/pop-rate.test.ts` | 9/9 passed | ✓ PASS |
| Typecheck clean | `npm run typecheck` | 0 errors | ✓ PASS |
| Production build succeeds | `npm run build` | 29 pages built, no errors | ✓ PASS |
| Static artifact base-aware links | `EXPECTED_BASE=/ npm run test:artifact` | "Static artifact verified (29 HTML files, base /)" | ✓ PASS |
| Static + reduced-motion + a11y e2e (404-related) | `npx playwright test not-found accessibility --project=chromium` | 13/13 passed | ✓ PASS |
| Pre-existing regression scope check | `npx playwright test tests/e2e/site-header.spec.ts --project=chromium` | 4 failed, all `/about/` only, 37 passed | ℹ️ Confirmed out of scope (see below) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` conventions apply to this phase (no migration/CLI tooling); no probes declared in PLAN/SUMMARY. Skipped — not applicable.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|-------------|--------------|--------|----------|
| ERR-01 | 16-01, 16-02, 16-03 | 404 page gets a fully custom, interactive redesign (revised 2026-07-29 from `PageTitleHeader`-reuse framing) | ✓ SATISFIED | All 5 ROADMAP success criteria verified above; `REQUIREMENTS.md` line 19/113 marked Complete and text matches the actually-shipped concept (not the stale `PageTitleHeader` framing). No orphaned Phase 16 requirements found in `REQUIREMENTS.md` (only ERR-01 maps to Phase 16). |

### Anti-Patterns Found

None. Grepped `src/lib/pop-rate.ts`, `src/pages/404.astro`, `tests/unit/pop-rate.test.ts`, `tests/e2e/not-found.spec.ts`, `tests/e2e/accessibility.spec.ts` for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and "placeholder/coming soon/not yet implemented" — zero matches. No `display:none` in the pop-photo swap CSS (source-confirmed, required by RESEARCH Pitfall 2). No stub `console.log`-only handlers; the one `console.assert` present is an explicit, documented dev-only (`import.meta.env.DEV`-gated) defensive regression guard, not a stub.

### Out-of-Scope Regression (confirmed, not counted against this phase)

`tests/e2e/site-header.spec.ts` has 4 failures, all on `/about/` at narrow/mid viewports (320px/360px/767px — horizontal overflow). Independently confirmed via `git log` that neither `src/lib/pop-rate.ts` nor `src/pages/404.astro` (this phase's only modified source files) touch `SiteHeader.astro` or `AboutPageBody.astro` — the last commits to those files are Phase 15 work (`3656623`, `22df1b8`, `0044397`, `bca2c4b`). Logged in `.planning/phases/16-404-page-editorial-redesign/deferred-items.md`. Does not block Phase 16 goal achievement; recommend a follow-up quick task or bug-fix phase against the About page's mobile layout.

### D-10 Accessibility Cap Override — Verified as Genuine, Not Fabricated

The live mid-execution deviation (WCAG-adjacent cap raised from ≈2.86/sec to ≈6.7/sec at the plan 16-03 human-verify checkpoint) is corroborated by real git history, not just prose claims:
- `4049bdb` — "docs(16): override D-10 pop-rate cap per live checkpoint feedback" (updates `16-CONTEXT.md`)
- `0707207` — "fix(16-01): raise pop-rate cap to ~6.7/sec per live checkpoint override (D-10)" (updates `src/lib/pop-rate.ts` + `tests/unit/pop-rate.test.ts`)
- `181f7c2` — "docs(16): reconcile D-10 cap override across plan/summary text" (updates `16-01-PLAN.md`/`16-01-SUMMARY.md`)

All three commits are authored by the actual project owner (Florian Lepont), consistent with a real interactive checkpoint, not an executor-fabricated narrative. The current code (`MIN_INTERVAL_MS = 150`) and the current unit test (asserting the "hard floor exists" invariant rather than the superseded `<3/sec` framing) match this override exactly. ROADMAP.md's success criteria text (line 124) and REQUIREMENTS.md's ERR-01 line (line 19) were both updated to describe the new ≈6.7/sec value, so there is no stale/contradictory documentation left in the tracked planning artifacts.

### Human Verification Required

None outstanding. The phase's one blocking human-verify checkpoint (16-03 Task 3) was already exercised live during execution — its approval (including a second re-verification pass after the D-10 cap override) is corroborated by the genuine git commit trail above, not merely self-reported in SUMMARY.md. No further human verification items were identified by this independent review; the remaining subjective/visual qualities (scrim legibility, pointer-feel) were the exact subject of that already-completed checkpoint.

### Gaps Summary

No gaps found. All 5 ROADMAP success criteria are independently verified against the actual codebase (not SUMMARY.md claims): the static shell, the client pop-rate engine, the D-10 floor invariant (at its overridden ≈6.7/sec value), the reduced-motion drift branch, and the bilingual/base-aware/HTTP-404 static contract are all present, wired, tested, and green when the test suites are run directly. The one known regression (`site-header.spec.ts` on `/about/`) is independently confirmed to be pre-existing Phase 15 work, untouched by any Phase 16 commit, and does not affect this phase's goal achievement.

---

*Verified: 2026-07-29*
*Verifier: Claude (gsd-verifier)*
