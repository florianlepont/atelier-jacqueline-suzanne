---
task: quick-260726-ltr
subsystem: portfolio-detail-pages, homepage-hero
tags: [footer, detail-hero, scroll-hint, homepage-intro, e2e]
status: complete
dependency-graph:
  requires: [quick-260725-tqs, quick-260724-uf5, quick-260724-wdr]
  provides: [gallery-detail-footer-hidden, homepage-intro-2-3-width, detail-hero-scroll-hint-removed]
  affects: [BaseLayout.astro, DetailHero.astro, HomeCarousel.astro, gallery/edition detail pages, gallery.spec.ts, edition.spec.ts, homepage.spec.ts]
tech-stack:
  added: []
  patterns:
    - "Opt-in prop scoping (hideFooter, mirrors carouselReturnHref from quick-260725-tqs) — footer suppressed only on gallery detail twins, not édition twins"
key-files:
  created: []
  modified:
    - src/layouts/BaseLayout.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/components/DetailHero.astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/components/HomeCarousel.astro
    - tests/e2e/gallery.spec.ts
    - tests/e2e/edition.spec.ts
    - tests/e2e/homepage.spec.ts
decisions:
  - "Footer hidden via a new opt-in BaseLayout hideFooter prop (default false), passed only by the two gallery detail-page twins — édition twins deliberately untouched, proving gallery-only scoping (mirrors the existing carouselReturnHref opt-in pattern)."
  - "Scroll-hint affordance (.detail-hero__scroll-hint: label, chevron, sketch-bounce animation, fade listener, scrollHintLabel prop) removed entirely from DetailHero.astro and all 4 detail-page twins — now useless per direct feedback."
  - "Homepage .home-hero__intro max-width widened 50% -> 66.67% on desktop only; font-size 15px and mobile max-width:none unchanged."
metrics:
  duration: ~45min
  completed: 2026-07-26
---

# Quick Task 260726-ltr: Three Follow-Up Fixes — Hide Site Footer, Widen Homepage Intro, Remove Scroll-Hint Summary

Hid the site footer on gallery detail pages only (not éditions), widened the homepage intro paragraph from ~50% to ~66.67% of the accent panel on desktop, and fully removed the now-useless scroll-hint affordance from the shared detail hero — three independent live-testing follow-ups, all executed exactly per plan.

## What Was Built

**Task 1 — Footer hide on gallery detail pages (Item 1):** Added an opt-in `hideFooter?: boolean` prop to `BaseLayout.astro` (default `false`), wrapping the existing `<footer class="chrome-band">` in a conditional. Both gallery detail twins (`src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`) now pass `hideFooter`; both édition twins are untouched (footer still renders there), proving the gallery-only scoping mirrors quick-260725-tqs's `carouselReturnHref` opt-in pattern. This carried a prior-incident safety burden (the plan's `safety_investigation` — quick-260725-sj4's homepage footer-hide misfire) which was verified NOT applicable: the sj4-affected `atBottom()` gate lives only in `HomeCarousel.astro` (homepage), not `DetailHero.astro`; the gallery detail page's own tqs return-gesture `hasEngaged` gate fails SAFE under a shortened page (never arms early, never misfires); and the hero's own `calc(100svh + 900px)` desktop height provides a 900px scroll track independent of the footer/grid, comfortably above the 300px `ENGAGE_DISTANCE` requirement.

**Task 2 — Scroll-hint removal (Item 3):** Fully removed the `.detail-hero__scroll-hint` feature from `DetailHero.astro`: the `scrollHintLabel` prop (interface + destructure), the markup block (label span + chevron SVG), the script's `scrollHint` query + self-contained fade listener, and all CSS (base rule, label/icon rules, `@keyframes sketch-bounce`, the `prefers-reduced-motion` animation-disable rule, and the two nested `display: none` overrides inside the reduced-motion-desktop and mobile media queries — the enclosing media blocks and their other rules were kept intact). Also dropped the now-stale "the scroll-hint above," clause from the tqs return-gesture's SAFETY DESIGN comment. All 4 detail-page twins had their `scrollHintLabel` const + prop pass removed.

**Task 3 — Homepage intro widen (Item 2):** In `HomeCarousel.astro`, the desktop `.home-hero__intro` rule's `max-width` changed from `50%` to `66.67%` (comment updated to "roughly two-thirds of the panel"). `font-size: 15px` and the mobile `max-width: none` override are unchanged.

**Task 4 — e2e coverage update:** Removed the two obsolete scroll-hint tests from `gallery.spec.ts` (kept the enclosing describe + its other test) and the entire `editions scroll-down hint label (quick-260724-wdr)` describe block from `edition.spec.ts`. Updated `homepage.spec.ts`'s intro-width test: renamed to reflect "two-thirds," kept the `font-size: 15px` assertion, and replaced the single `<= 0.6` upper bound with `(0.55, 0.70]` bounds — the lower bound (0.55) is calibrated so the old 50% rule's ~0.454 ratio would fail it, making the test a genuine proof of the widen rather than a loosened tolerance. Added a new `gallery detail footer-hidden scoping + scroll-track safety (quick-260726-ltr, Item 1)` describe block in `gallery.spec.ts` with three tests: footer absent on FR gallery detail (plus an executable `>= 300px` desktop scroll-track assertion encoding the safety_investigation's conclusion), footer absent on EN gallery detail, and footer still present (count 1) on an édition detail page (scoping proof).

## Verification Performed

- `npm run typecheck` (astro check): **0 errors** after every task (confirms the `scrollHintLabel` removal was mirrored correctly across the component and all 4 twins — a missed twin would have surfaced as a type error).
- `grep -rn "scrollHintLabel\|scroll-hint\|sketch-bounce" src tests`: **zero matches**, confirmed both under `src/` alone (per the plan's stated verify gate) and across `src/`+`tests/` combined.
- `npx eslint` on all 10 changed files: **0 errors**.
- `npm run test:unit` (Vitest): **147/147 passing** (after also running `npm ci` inside `sanity/` to resolve a known, pre-existing, unrelated `@sanity/icons` missing-package error in `tests/unit/dashboard-logic.test.ts` — not caused by this task).

## Known Stubs

None.

## Threat Flags

None — this task adds no new network endpoints, auth paths, or trust-boundary-crossing surface. `hideFooter` is a pure presentational opt-in prop consumed only at build time.

## Independent Verification (Orchestrator)

The executor could not run build/e2e in this worktree (no `.env`). The orchestrator independently re-verified with real Sanity credentials on an isolated port:

- `npm run build` succeeds.
- `npm run test:unit`: 147/147 passing.
- Full `npx playwright test` suite: **212/212 passing** (reduced to `--workers=2`; the default 5-worker run produced 12 spurious timeout failures from the lightweight `astro preview` server under parallel load — confirmed as a resource-contention artifact, not a real regression, by re-running the same failing tests in isolation and with reduced parallelism, where all passed cleanly).
- Confirmed the specific safety-critical proofs pass: footer absent on FR + EN gallery detail pages; footer present on an édition detail page (scoping); the gallery desktop scroll track is >= 300px with the footer hidden; the pre-existing quick-260725-tqs return-gesture positive-path AND accidental-trigger regression guards (unmodified by this task) still pass running against a footer-hidden page for the first time; homepage intro width lands in (0.55, 0.70] of the accent panel; zero remaining `.detail-hero__scroll-hint`/`scrollHintLabel`/`sketch-bounce` references.
- Full diff review of all 4 commits confirmed exact adherence to the plan, including the footer-hide's opt-in scoping (gallery twins only, éditions untouched) and the scroll-hint's complete removal (markup, CSS, keyframes, both media overrides, fade listener, prop across all 4 twins).

## Deviations from Plan

None — plan executed exactly as written for all 4 tasks. The only addition beyond the plan's literal text was running `npm ci` inside `sanity/` (Rule 3 — blocking issue: a pre-existing, task-unrelated missing-package error was blocking `npm run test:unit`, which I ran as an extra sanity check beyond the plan's own verify gates) and confirming zero stale preview/Playwright processes before concluding build/e2e genuinely cannot run here (not a Rule 1-3 fix, just diagnostic due diligence per the task's explicit constraint to check for that exact failure mode).

## Self-Check: PASSED

All 10 modified files confirmed present on disk; all 4 task commits (`f36c724`, `a245e26`, `fbe7a83`, `1c99b94`) confirmed present in `git log`.
