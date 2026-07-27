---
phase: quick-260727-drq
plan: 01
subsystem: ui
tags: [astro, playwright, vitest, css-transitions, home-carousel, detail-hero]

requires:
  - phase: quick-260727-bsm
    provides: the mousemove peek/parallax mechanism (updatePeek/resetPeek/commitEdge) and the wordmark rAF-sync loop this plan builds on
provides:
  - Un-eased (.is-tracking) live peek transform on .home-hero__img/.home-hero__peek, fixing Safari's per-mousemove transition-retarget jitter
  - Clamped computeWordmarkBackgroundPosition (both axes) so the wordmark photo-cutout never samples past the rendered image's real bounds
  - background-color: 300ms ease transition on .home-hero__accent so consecutive gallery navigations crossfade instead of hard-cutting
  - Restored .detail-hero__scroll-hint affordance (markup/CSS/script/prop) on both gallery and edition detail heroes, FR+EN
affects: [home-carousel, detail-hero, gallery-detail-pages, edition-detail-pages]

tech-stack:
  added: []
  patterns:
    - "Discrete-vs-continuous transition gating: a class (.is-tracking) added on mouseenter and removed only right before discrete state-change moments (mouseleave recede, edge-click commit) disables CSS transitions for the continuous phase while preserving easing for the discrete ones — the same pattern quick-260727-bsm established for the cursor split, now applied to the peek transform."

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - src/lib/home-carousel.ts
    - src/components/DetailHero.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - tests/unit/home-carousel.test.ts
    - tests/e2e/homepage.spec.ts
    - tests/e2e/gallery.spec.ts
    - tests/e2e/edition.spec.ts

key-decisions:
  - "is-tracking is added on mouseenter and removed only immediately before mouseleave's resetPeek() and commitEdge()'s full-slide targets — kept ON through updatePeek()'s else->resetPeek() branch (zone flips to center mid-hover, still continuous tracking, not a discrete moment) per the plan's explicit invariant."
  - "computeWordmarkBackgroundPosition clamps both x and y components even though only x was expected to overflow from a horizontal peek, using Math.min(0, Math.max(-min, raw)) so a degenerate bound (rendered image narrower/shorter than the wordmark box) resolves to 0 rather than inverting the clamp range."
  - "Bug 4's restoration is unconditional on both gallery and edition heroes (the original validated design) — no carousel-entry-only conditional logic was added, matching the plan's explicit instruction not to redesign."

patterns-established: []

requirements-completed: [QUICK-260727-drq]

coverage:
  - id: D1
    description: "Bug 1 — the live mousemove-driven peek transform on .home-hero__img/.home-hero__peek is un-eased (.is-tracking disables the transition) while the mouseleave recede and edge-click commit still ease over 420ms"
    requirement: "QUICK-260727-drq"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel peek transform is un-eased while tracking (Bug 1) > is-tracking disables the transform transition on the hero image and peek layers; removing it restores the transition"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts (full homepage suite, 83 tests)"
        status: pass
    human_judgment: true
    rationale: "The automated Chromium suite proves the structural transition-disable wiring, but cannot observe Safari's specific jitter (a WebKit-only rendering behavior) — the plan explicitly scopes the real jerk-measurement re-verify to the orchestrator's live desktop-Safari step."
  - id: D2
    description: "Bug 2 — computeWordmarkBackgroundPosition clamps its returned background-position to the rendered image's real bounds on both axes, so the wordmark photo-cutout never renders blank at extreme peek proximity"
    requirement: "QUICK-260727-drq"
    verification:
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeWordmarkBackgroundPosition > clamps the x position so it never samples past the rendered image right edge (large horizontal peek push)"
        status: pass
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts#computeWordmarkBackgroundPosition > clamps the y position so it never samples past the rendered image bottom edge (large vertical offset)"
        status: pass
      - kind: unit
        ref: "tests/unit/home-carousel.test.ts (full file, 19 tests — existing in-bounds/null-guard cases unchanged)"
        status: pass
    human_judgment: true
    rationale: "Unit tests deterministically prove the clamp math; the plan additionally asks for a live screenshot at max peek proximity confirming no blank glyphs render in the browser, which is a visual judgment outside this executor's automated scope."
  - id: D3
    description: "Bug 3 — .home-hero__accent gained a background-color: 300ms ease transition so consecutive gallery navigations crossfade the accent panel instead of hard-cutting"
    requirement: "QUICK-260727-drq"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel accent panel crossfades on navigation (Bug 3) > the accent panel has a background-color transition"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts (full homepage suite, 83 tests — no regression in existing accent/view-transition/fade-timing tests)"
        status: pass
    human_judgment: true
    rationale: "The automated assertion proves the transition property is wired; the plan asks for a live mid-transition color-sampling re-verify to confirm the perceived crossfade, which is a visual judgment outside this executor's automated scope."
  - id: D4
    description: "Bug 4 — the 'Faire défiler' / 'Scroll' scroll hint is restored on both gallery AND edition detail heroes (FR + EN), fading over the first ~150px of scroll, bounce disabled under reduced motion, enforced via a required scrollHintLabel prop"
    requirement: "QUICK-260727-drq"
    verification:
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors, scrollHintLabel required prop enforced across all 4 detail-page twins"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery hero reduced-motion (sketch 005) > the scroll-down hint is visible at rest on desktop, and its bounce is disabled/hidden under reduced motion"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery hero reduced-motion (sketch 005) > the scroll-down hint label reads \"Scroll\" on the matching EN route"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions scroll-down hint label (quick-260724-wdr) > the scroll-down hint shows the locale-aware label on both fr and en édition détail routes"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail footer-hidden scoping + scroll-track safety (quick-260726-ltr, Item 1) (all 3 tests — retained, unaffected by this restoration)"
        status: pass
    human_judgment: true
    rationale: "The plan's own done criteria asks the orchestrator to confirm the hint live on FR + EN; automated tests already cover visibility, label text, and reduced-motion behavior deterministically."

duration: ~55min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-drq: Fix Safari Peek Jitter, Wordmark Clamp, Accent Crossfade, Scroll-Hint Restore Summary

**Un-eased `.is-tracking` peek transform (Safari jitter fix), clamped wordmark background-position math, a `background-color` crossfade on the accent panel, and the restored scroll-down hint on both detail-hero twins**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-07-27 (per plan pre-dispatch commit ef30bd6)
- **Completed:** 2026-07-27
- **Tasks:** 4 (Task 2 followed TDD RED→GREEN)
- **Files modified:** 11

## Accomplishments

- **Bug 1 (Safari peek-transition micro-jitter):** added a `.is-tracking` class, toggled on mouseenter/mouseleave and cleared before `commitEdge()`'s full-slide targets, that disables the `transform` transition on `.home-hero__img`/`.home-hero__peek` for the whole continuous mousemove-driven peek push — so per-frame writes to `--peek-shift` apply instantly instead of retargeting an in-flight 420ms eased transition (the exact anti-pattern WebKit interpolates roughly). The mouseleave recede and edge-click commit both keep the 420ms ease.
- **Bug 2 (wordmark blank-glyph clamp):** `computeWordmarkBackgroundPosition` now clamps both x and y components of its returned position to `[-(rendered - box), 0]`, so an extreme peek push can never sample past the rendered photo's real pixels (which would render blank/transparent under `background-repeat: no-repeat`, exposing the solid accent panel through the letter cutouts).
- **Bug 3 (accent-panel color cut):** `.home-hero__accent` gained `transition: background-color 300ms ease`, so `render()`'s per-navigation `--current-accent` write now crossfades instead of hard-cutting.
- **Bug 4 (scroll-hint restoration):** re-added the `.detail-hero__scroll-hint` affordance (required `scrollHintLabel` prop, markup, self-contained scroll-fade listener, CSS incl. `sketch-bounce` keyframes and reduced-motion/mobile `display: none` overrides) to `DetailHero.astro`, wired the label const + prop pass on all 4 detail-page twins (fr/en gallery, fr/en edition), and restored the e2e coverage removed by `1c99b94` additively (the footer-hidden-scoping tests it added stayed in place).

## Task Commits

Each task was committed atomically:

1. **Task 2 (RED): failing clamp tests** - `4f89249` (test)
2. **Task 2 (GREEN): clamp computeWordmarkBackgroundPosition** - `9cb6db0` (feat)
3. **Task 1: un-ease the live peek transform (Safari jitter)** - `28dace4` (fix)
4. **Task 3: accent-panel background-color crossfade** - `01b83d3` (feat)
5. **Task 4: restore the scroll hint on DetailHero + 4 twins + tests** - `5a1d729` (feat)

**Plan metadata:** pending (docs commit handled by the orchestrator per this executor's constraints)

_Note: Task 2 followed TDD (RED test commit, then GREEN implementation commit). Task 1 was executed after Task 2 for RED/GREEN atomicity, then committed before Task 3 to keep per-task commits clean — the plan's execution order (1, 2, 3, 4) was preserved for verification, only the commit sequencing was reordered around the TDD gate._

## Files Created/Modified

- `src/components/HomeCarousel.astro` - `.is-tracking` transition-disable CSS rule + mouseenter/mouseleave/commitEdge wiring (Bug 1); `.home-hero__accent` background-color transition (Bug 3)
- `src/lib/home-carousel.ts` - clamped `computeWordmarkBackgroundPosition` (Bug 2)
- `tests/unit/home-carousel.test.ts` - two new clamp regression cases (x-overflow, y-overflow)
- `tests/e2e/homepage.spec.ts` - new is-tracking transitionProperty test (Bug 1); new accent-panel transition assertion (Bug 3)
- `src/components/DetailHero.astro` - restored `scrollHintLabel` prop, `.detail-hero__scroll-hint` markup/script/CSS (Bug 4)
- `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro` - restored `scrollHintLabel` const + prop pass (Bug 4)
- `tests/e2e/gallery.spec.ts`, `tests/e2e/edition.spec.ts` - restored scroll-hint e2e coverage, additive to the retained footer-hidden-scoping tests (Bug 4)

## Decisions Made

- Committed Task 1 and Task 3's changes to `HomeCarousel.astro` as two separate atomic commits even though both touched the same `.home-hero__accent`-adjacent region of the file — Task 3's hunk was temporarily reverted, Task 1 committed and verified in isolation, then Task 3's hunk re-applied and committed separately, preserving one-commit-per-task traceability despite an interruption that landed both edits in the working tree at once.
- Bug 2's clamp intentionally clamps both x and y axes (per the plan's explicit instruction) even though only x was expected to overflow from a horizontal peek push, using a `Math.min(0, Math.max(-min, raw))` form that degrades safely if the rendered image were ever narrower/shorter than the wordmark box.
- No new npm dependencies; no architectural changes. All four fixes stayed within the plan's specified files.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1-4 auto-fixes were needed; all four root causes were pre-diagnosed and the fixes matched the plan's specified mechanism exactly (verified via the full automated suite below).

## Issues Encountered

- This execution was resumed after an interruption (monthly spend-limit error) that landed right after Task 3 was announced but before it was committed. Per the coordinator's resume instructions, Task 1's uncommitted `.is-tracking` wiring was re-verified against the plan's exact invariants (grep-confirmed: added on mouseenter, removed before mouseleave's `resetPeek()`, removed in `commitEdge()` before its full-commit targets, left ON through `updatePeek()`'s `else { resetPeek(); return; }` branch) before being committed, then Task 3's temporarily-reverted hunk was re-applied and committed on its own. No work was lost; no code needed correction — verification confirmed the pre-interruption implementation was already correct.
- `.env` (gitignored Sanity credentials) was absent in this worktree, as flagged by the plan's verification-environment note; copied in from the main checkout to enable `npm run build` + isolated-port `astro preview` (port 4325, since 4321 was occupied by an unrelated process). A throwaway `playwright.isolated.config.ts` pointed the e2e suite at port 4325; both were deleted before finishing (never committed).
- `tests/unit/dashboard-logic.test.ts` fails with a pre-existing, unrelated `@sanity/icons` module-resolution gap in the Studio subproject — exactly the known-unrelated failure the plan's verification note anticipated. All other 121 unit tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four bugs fixed and verified via the full automated suite: `npm run typecheck` (0 errors), `npm run test:unit` (121/121 real tests pass, 1 known-unrelated pre-existing failure), and the full isolated-port Playwright suite (237/237 passing across chromium + webkit-mobile).
- Four live re-verification steps remain out of this executor's automated scope, per the plan's own `<verification>` section: real desktop-Safari jerk measurement (Bug 1), a max-peek-proximity screenshot confirming no blank wordmark glyphs (Bug 2), mid-transition accent color sampling (Bug 3), and FR + EN scroll-hint presence on both gallery and edition pages (Bug 4) — all four are reflected as `human_judgment: true` in this SUMMARY's coverage block for the orchestrator/user to confirm live.
- No blockers.

---
*Phase: quick-260727-drq*
*Completed: 2026-07-27*

## Self-Check: PASSED

All 11 modified/created files verified present on disk; all 5 task commit hashes (4f89249, 9cb6db0, 28dace4, 01b83d3, 5a1d729) verified present in `git log --oneline --all`.
