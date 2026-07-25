---
phase: quick-260724-wdr
plan: 1
subsystem: ui
tags: [astro, sanity, playwright, i18n, view-transitions]

requires:
  - phase: quick-260724-uf5
    provides: cross-document View Transition morph (homepage -> gallery hero) and the DetailHero bouncing scroll-down chevron
  - phase: quick-260724-oep
    provides: pickHeroIndex landscape-preference helper (src/lib/image-orientation.ts), already used by gallery/édition detail heroes
provides:
  - Homepage cover selection now matches the gallery detail hero's pickHeroIndex-selected image, so the cross-document morph never swaps photos for portrait-first galleries
  - DetailHero's scroll-down hint carries a required, locale-aware text label ("Faire défiler" / "Scroll") alongside a visually-strengthened chevron, wired through all four detail-page twins
affects: [homepage, gallery-detail, edition-detail, e2e-suite]

tech-stack:
  added: []
  patterns:
    - "Homepage cover selection reuses src/lib/image-orientation.ts's pickHeroIndex helper (previously detail-page-only) so cross-document morph source/destination always resolve to the same underlying asset."
    - "DetailHero.astro's locale-aware primitives (scrollHintLabel, like heroAriaLabel/caption before it) are computed in each calling page's frontmatter and passed down as already-localized strings — the component itself never imports src/lib/sanity."

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/pages/en/index.astro
    - src/components/DetailHero.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - tests/e2e/homepage.spec.ts
    - tests/e2e/gallery.spec.ts
    - tests/e2e/edition.spec.ts

key-decisions:
  - "Reused pickHeroIndex verbatim at the homepage call site rather than duplicating/adapting its logic — src/lib/image-orientation.ts is untouched, per the plan's explicit constraint."
  - "scrollHintLabel is a REQUIRED (not optional/defaulted) DetailHero prop specifically so astro check fails the build if any of the four detail-page twins is missed — the compile error is the intended enforcement mechanism, not a bug to work around."
  - "Chevron size increased from 28px to 34px and the hint container switched to a centered flex column (label above chevron) to read as one stronger affordance, using only white text + --color-accent (a pink underline under the label), reusing --text-label-size/uppercase/letter-spacing conventions already established by .detail-hero__caption and .detail-hero__format."

patterns-established:
  - "Cross-document morph consistency: any future homepage/detail asset-selection logic should stay in sync via a single shared helper (pickHeroIndex), not independently hardcoded per page."

requirements-completed: [QUICK-260724-wdr]

coverage:
  - id: D1
    description: "Homepage cover for every gallery selects gallery.images[pickHeroIndex(gallery.images)] (both fr/en twins), matching the gallery detail hero exactly — portrait-first galleries (Paysage) no longer show a different photo on the homepage than on their own detail page."
    requirement: "QUICK-260724-wdr"
    verification:
      - kind: other
        ref: "npm run typecheck (astro check) — 0 errors, proves pickHeroIndex import resolves at the correct relative depth in both src/pages/index.astro and src/pages/en/index.astro"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#homepage hero photo matches the gallery detail hero (landscape-preference consistency) > every home-grid tile photo pathname equals its gallery detail-hero photo pathname"
        status: unknown
    human_judgment: true
    rationale: "The new e2e test could not be executed in this worktree — .env (SANITY_PROJECT_ID/SANITY_DATASET) is absent, so `npm run build`/`npm run test:e2e` fail before any browser runs (confirmed: build errors with 'Missing SANITY_PROJECT_ID or SANITY_DATASET env vars'). The orchestrator must supply .env and run the full e2e suite (or a human must run it) to confirm this deliverable, per this worktree's established note from quick-260724-uf5."

  - id: D2
    description: "DetailHero shows a locale-aware text label ('Faire défiler' fr / 'Scroll' en) plus a visually-strengthened chevron on all four detail-page twins (2 galleries + 2 éditions), with the ~150px fade, reduced-motion/mobile hiding, and bounce mechanics all unchanged."
    requirement: "QUICK-260724-wdr"
    verification:
      - kind: other
        ref: "npm run typecheck (astro check) — 0 errors, proves scrollHintLabel (a required prop) is satisfied by all four DetailHero consumers"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#scroll-down hint label assertions (fr + en) and tests/e2e/edition.spec.ts#editions scroll-down hint label (quick-260724-wdr)"
        status: unknown
    human_judgment: true
    rationale: "Same environment limitation as D1 — .env is absent so the e2e suite could not be run in this worktree. Additionally the plan explicitly calls for a non-blocking human visual spot-check (does the strengthened hint clearly read as an invitation to scroll, on-brand, tasteful) that automation cannot assert."

duration: ~35min (session resumed once after an interruption; net active work time)
completed: 2026-07-25
status: complete
---

# Quick Task 260724-wdr Summary

**Homepage now selects the same pickHeroIndex-preferred cover as the gallery detail hero (fixing the cross-document morph's photo-swap for portrait-first galleries), and DetailHero's scroll-down hint gained a required locale-aware text label + a larger chevron across all four detail-page twins.**

## Performance

- **Duration:** ~35 min (includes a mid-task session interruption and resume)
- **Tasks:** 2 completed
- **Files modified:** 10

## Accomplishments
- FIX 1: Both homepage locale twins (`src/pages/index.astro`, `src/pages/en/index.astro`) now build each gallery's `cover` from `gallery.images[pickHeroIndex(gallery.images)]` instead of the hardcoded `images[0]`, exactly matching the gallery detail hero's own selection — so the quick-260724-uf5 cross-document View Transition morph now always morphs a crop/size change of the *same* photo instead of swapping between two different photos for portrait-first galleries (Paysage).
- FIX 2: `DetailHero.astro` gained a required `scrollHintLabel: string` prop, rendered as a new `.detail-hero__scroll-hint-label` positioned above a larger (34px, up from 28px) chevron inside a centered flex column, using only white text + the existing `--color-accent` pink (as an underline) and reusing established typography tokens (`--text-label-size`, uppercase, letter-spacing). Wired `'Faire défiler'` (fr) / `'Scroll'` (en) through all four detail-page twins — the required prop turns a missed twin into an `astro check` compile error.
- The scroll-fade opacity listener, the `sketch-bounce` keyframe on the `.detail-hero__scroll-hint` container, and the reduced-motion/mobile hiding rules are all byte-for-byte unchanged.
- Extended e2e coverage: a new homepage describe block proves every gallery's grid-tile photo pathname equals its detail-hero photo pathname (the byte-identical-asset proof); `gallery.spec.ts`'s existing scroll-hint test now also asserts the fr label plus a new en-route test; `edition.spec.ts` gained a dedicated fr+en label test for the édition twins.

## Task Commits

Each task was committed atomically:

1. **Task 1: Homepage selects the landscape-preferred cover via pickHeroIndex (both locale twins) + prove homepage↔detail photo identity** - `b118c69` (fix)
2. **Task 2: Strengthen the DetailHero scroll-down hint — add a required locale-aware label prop wired through all four detail twins + stronger visual weight, preserving all existing behavior** - `13b6a6d` (feat)

**Plan metadata:** committed separately by the orchestrator after this summary.

## Files Created/Modified
- `src/pages/index.astro` - FR homepage: import `pickHeroIndex`, select cover via `gallery.images[pickHeroIndex(gallery.images)]`
- `src/pages/en/index.astro` - EN homepage: same change, `../../lib/image-orientation` import depth
- `src/components/DetailHero.astro` - new required `scrollHintLabel` prop, `.detail-hero__scroll-hint-label` markup + CSS, larger chevron, flex-column hint layout
- `src/pages/galleries/[slug].astro` - passes `scrollHintLabel="Faire défiler"` to `DetailHero`
- `src/pages/en/galleries/[slug].astro` - passes `scrollHintLabel="Scroll"` to `DetailHero`
- `src/pages/editions/[slug].astro` - passes `scrollHintLabel="Faire défiler"` to `DetailHero`
- `src/pages/en/editions/[slug].astro` - passes `scrollHintLabel="Scroll"` to `DetailHero`
- `tests/e2e/homepage.spec.ts` - new describe block proving homepage-tile/detail-hero photo pathname identity for every gallery
- `tests/e2e/gallery.spec.ts` - extended scroll-hint test with the fr label assertion + new en-route label test
- `tests/e2e/edition.spec.ts` - new describe block asserting the fr/en scroll-hint labels on both édition détail twins

## Decisions Made
- Reused `pickHeroIndex` verbatim at the homepage call site (no changes to `src/lib/image-orientation.ts`), per the plan's explicit constraint — the fallback-to-0 behavior for galleries whose `images[0]` is already landscape (or is the only image) stays a no-op.
- Made `scrollHintLabel` a required DetailHero prop (not optional/defaulted) specifically so a missed twin fails `astro check` at compile time — this is the plan's intended enforcement mechanism for "all four twins wired," not something to work around with a default.
- Chevron grew from 28px to 34px and the hint container became a centered flex column (label above chevron, `gap: var(--space-xs)`) so the label and chevron read as one strengthened affordance rather than two separate elements.

## Deviations from Plan

None — plan executed exactly as written. `src/lib/image-orientation.ts` was left untouched as required; the required-prop enforcement mechanism was implemented (not worked around) as explicitly instructed in this task's constraints.

## Issues Encountered
- **Mid-task session interruption:** Execution paused mid-Task-2 (before the CSS for `.detail-hero__scroll-hint-label`/`-icon` was written and before any of the four detail-page twins were wired). Resumed from the coordinator's handoff state, completed the remaining CSS + all four twin wirings + all e2e test additions, then ran `npm run typecheck` to confirm 0 errors before committing either task.
- **Missing `.env`:** This worktree has no `.env` file (Sanity `SANITY_PROJECT_ID`/`SANITY_DATASET`). `npm run build` fails immediately with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" before any Astro page can prerender, which means `npm run test:e2e` cannot run here either (Playwright's webServer needs a successful build). Per this worktree's established constraint (mirroring quick-260724-uf5's prior note), I did not fabricate credentials — `npm run typecheck` (astro check, 0 errors) and the positive `grep -c` verification checks from both tasks' `<verify>` blocks are the gates that were actually run and passed. The orchestrator is expected to supply `.env` and run the full `npm run test:e2e -- tests/e2e/homepage.spec.ts tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` during independent verification.
- **Sanity Studio subproject deps missing:** `sanity/node_modules` was also absent, causing an unrelated pre-existing unit test (`tests/unit/dashboard-logic.test.ts`, which imports `sanity/editorial/dashboardLogic.ts`) to fail with "Cannot find package '@sanity/icons'". Ran `npm ci` inside `sanity/` (per this task's environment constraints) to resolve it — unrelated to this plan's own files, but confirms `npm run test:unit` now passes cleanly (147/147 tests, 14/14 files) with no regressions from this plan's changes.

## User Setup Required

None - no external service configuration required beyond the pre-existing `.env` gap noted above (Sanity credentials), which the orchestrator supplies per this worktree's standing convention.

## Next Phase Readiness
- Both fixes are code-complete and pass `npm run typecheck` (0 errors) and `npm run test:unit` (147/147 passing, no regressions).
- The three extended/new e2e specs (`homepage.spec.ts`, `gallery.spec.ts`, `edition.spec.ts`) need a real `.env` + full `npm run test:e2e` run to confirm — flagged as `human_judgment: true` / `status: unknown` in the coverage block above specifically for that reason, not because the assertions themselves are in doubt.
- Recommended non-blocking human spot-check (per the plan's own verification section): on desktop Chrome/Edge, click a portrait-first gallery (Paysage) from the homepage and confirm the morph now reads as a clean crop/zoom of the SAME photo; confirm the strengthened scroll hint (label + chevron) clearly reads as an invitation to scroll, fades on scroll, and disappears under OS "Reduce motion" and on a mobile width.

---
*Phase: quick-260724-wdr*
*Completed: 2026-07-25*

## Self-Check: PASSED

All 10 modified files confirmed present on disk; both task commits (`b118c69`, `13b6a6d`) confirmed present in `git log`.
