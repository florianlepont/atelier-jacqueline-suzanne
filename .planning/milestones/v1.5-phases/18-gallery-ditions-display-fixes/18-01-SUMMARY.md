---
phase: 18-gallery-ditions-display-fixes
plan: 01
subsystem: ui
tags: [astro, css, playwright, tdd]

# Dependency graph
requires:
  - phase: 17-homepage-carousel-intro-fixes
    provides: v1.5 milestone in progress, HOME-11/HOME-12 shipped
provides:
  - Gallery and édition thumbnail tiles render with zero visible border on all four detail-page twins (galleries FR/EN masonry mode, éditions FR/EN bento mode)
  - Site footer restored on both gallery detail routes (FR/EN), matching édition detail pages
affects: [18-02-gallery-description-truncation, 19-site-wide-visual-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native <button>-as-tile components must explicitly zero the UA-stylesheet default border (border: none;) whenever the author no longer supplies an explicit border value — deletion alone is insufficient because appearance: none does not remove it in Chromium. Every other interactive button-styled element in this codebase already follows this convention (DetailHero.astro, HomeCarousel.astro, BaseLayout.astro, Lightbox.astro)."

key-files:
  created: []
  modified:
    - src/components/GalleryGrid.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - tests/e2e/gallery.spec.ts

key-decisions:
  - "CONTEXT.md D-04 correction confirmed at execution time: gallery detail pages render GalleryGrid in masonry mode (object-fit: contain) and édition detail pages render it in the default bento mode (object-fit: cover) — both live, both share the same .tile base rule, so one deletion still fixes both, but both modes needed independent Playwright coverage."
  - "Rule 1 auto-fix: pure deletion of the .tile border declaration left a visible 2px native Chromium <button> UA-stylesheet border (verified empirically: a bare <button> computes borderTopWidth: 2px, borderTopStyle: outset, appearance: auto). Added border: none; to zero that native chrome, matching the established codebase-wide convention for de-chroming interactive buttons."

patterns-established:
  - "Pattern: <button>-based custom components with no explicit border need an explicit border: none;/border: 0; reset — not implicit from deletion — because the browser UA stylesheet still applies a default border to <button> absent one."

requirements-completed: [PORT-05, PORT-06]

coverage:
  - id: D1
    description: "Gallery detail page (masonry mode) thumbnail tiles render with 0px border on all four sides, keep the D-05 ink loading background (rgb(26, 26, 26)), and never show letterbox bars against that background"
    requirement: "PORT-05"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes"
        status: pass
    human_judgment: false
  - id: D2
    description: "Édition detail page (bento mode) thumbnail tiles render with 0px border on all four sides"
    requirement: "PORT-05"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#édition detail (bento): every tile has 0px borders and object-fit: cover"
        status: pass
    human_judgment: false
  - id: D3
    description: "Gallery detail page renders exactly one footer.chrome-band, in both FR and EN, with the desktop scroll track still >= 300px"
    requirement: "PORT-06"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#fr: footer is present on the gallery detail page, and the desktop scroll track is still >= 300px"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#en: footer is present on the gallery detail page"
        status: pass
    human_judgment: false
  - id: D4
    description: "Édition detail page still renders exactly one footer.chrome-band (no regression from the PORT-06 change)"
    requirement: "PORT-06"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#no regression: footer is still present on an édition detail page"
        status: pass
    human_judgment: false
  - id: D5
    description: "Full e2e suite (both chromium and webkit-mobile projects) and typecheck still pass after both changes, with visual/styling confirmation deferred to the end-of-phase human check per workflow.human_verify_mode: end-of-phase"
    verification:
      - kind: e2e
        ref: "npm run test:e2e (265 passed, both projects)"
        status: pass
      - kind: other
        ref: "npm run typecheck (astro check): 0 errors"
        status: pass
    human_judgment: true
    rationale: "Visual confirmation of the restored footer's styling and the removed border's absence, at both desktop and phone widths in FR and EN, is explicitly deferred to the end-of-phase human-verify checkpoint per this project's workflow.human_verify_mode: end-of-phase config — automated assertions cover computed CSS values but not final subjective visual review."

duration: 25min
completed: 2026-08-02
status: complete
---

# Phase 18 Plan 01: Gallery Tile Frame Removal + Footer Restoration Summary

**Removed the native-button UA-stylesheet border bleeding through GalleryGrid.astro's `.tile` rule after deleting the frame declaration, and restored the site footer on both gallery detail routes by omitting the now-unused `hideFooter` prop — both changes locked by inverted/new Playwright assertions covering masonry and bento grid modes.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-02T19:24Z (approx, first Read)
- **Completed:** 2026-08-02T19:32Z
- **Tasks:** 2 completed
- **Files modified:** 4 (`GalleryGrid.astro`, `galleries/[slug].astro`, `en/galleries/[slug].astro`, `gallery.spec.ts`)

## Accomplishments

- PORT-05: gallery and édition thumbnail tiles show zero visible border in both live grid modes (masonry on gallery detail pages, bento on édition detail pages), while the D-05 ink loading-state background and letterbox-safety are both positively re-proven by Playwright.
- PORT-06: the site footer renders again on both `/galleries/{slug}/` and `/en/galleries/{slug}/`, reversing quick-260726-ltr Item 1 on direct user instruction, with the reversal explicitly documented in the spec file's own comment so a future reader doesn't "fix" it back. The DetailHero `ENGAGE_DISTANCE = 300` scroll-up-to-return gate's `>= 300px` desktop scroll-track guard is retained and still passes.
- CONTEXT.md's D-04 masonry-vs-bento correction (recorded in the plan before Task 1) was verified at execution time: `GalleryDetailBody.astro` line 63 passes `layout="masonry"`, `EditionDetailBody.astro` line 79 passes no `layout` prop (default bento) — confirmed by direct file read, not just the plan's prior analysis.

## Task Commits

Each task followed the plan's TDD gate sequence (test → feat):

1. **Task 1: Remove the thumbnail tile frame, keep the loading background, prove it in both grid modes (PORT-05, D-04/D-05)**
   - RED: `f5dc96d` — `test(18-01): add failing PORT-05 tile-border tests for both grid modes`
   - GREEN: `8005dc9` — `feat(18-01): remove tile frame, add border:none for native button UA default (PORT-05, D-04/D-05)`
2. **Task 2: Restore the site footer on both gallery detail routes and invert the tests that locked its absence (PORT-06, D-06)**
   - RED: `131eb12` — `test(18-01): invert footer-hidden tests to assert presence (PORT-06, D-06)`
   - GREEN: `c593afb` — `feat(18-01): restore site footer on both gallery detail routes (PORT-06, D-06)`

_Plan metadata commit: pending (final metadata commit, see below)._

## Files Created/Modified

- `src/components/GalleryGrid.astro` — deleted the `.tile` frame declaration (`border: var(--border-hairline) solid var(--color-ink)`); added `border: none;` in its place with an explanatory comment (Rule 1 auto-fix, see Deviations); `background: var(--color-ink)` (D-05) retained unchanged.
- `src/pages/galleries/[slug].astro` — removed the bare `hideFooter` prop from the `<BaseLayout>` call; all other props unchanged.
- `src/pages/en/galleries/[slug].astro` — same single-line removal as the FR twin.
- `tests/e2e/gallery.spec.ts` — new `PORT-05` describe block (2 tests: gallery/masonry, édition/bento) recording the D-04 correction in its leading comment; existing footer-scoping describe block (formerly asserting absence) inverted to assert presence, renamed, and its comment rewritten to record the PORT-06 reversal of quick-260726-ltr Item 1.

## Decisions Made

- **CONTEXT.md D-04 masonry correction confirmed, not just carried forward.** Re-verified against the live source (`GalleryDetailBody.astro` line 63 → `layout="masonry"`; `EditionDetailBody.astro` line 79 → no `layout` prop, defaults to bento) before writing any test, exactly as the plan's "Correction to CONTEXT.md D-04" section instructed.
- **`border: none;` added despite the plan's "deletion only, no substitute" instruction** — see Deviations below. This was necessary to satisfy the plan's own `<behavior>` spec and Playwright acceptance criteria (0px computed border on all four sides), which pure deletion cannot achieve on a native `<button>` element.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `.tile`'s frame deletion alone left a visible native `<button>` UA-stylesheet border**
- **Found during:** Task 1, GREEN step (first `npm run test:e2e` rerun after deleting the frame line)
- **Issue:** The plan's action explicitly said to delete the frame declaration and add nothing in its place ("Do NOT add a replacement declaration ... The rule is a deletion, not a substitution"). After deleting only the line, the two new Playwright tests failed again — not with `1px` (the pre-fix hairline) but with `2px`, a different value. Root-caused by an isolated Playwright check against a bare, unstyled `<button>` element: Chromium's UA stylesheet applies `border-width: 2px; border-style: outset; appearance: auto` to `<button>` by default, and this default only surfaces once no author `border` declaration exists to override it. `appearance: none` alone (tested in isolation) does NOT remove this default border in Chromium. `.tile` renders as a `<button>` (see `GalleryGrid.astro`'s markup), so the plan's "pure deletion" instruction was based on an incorrect assumption and directly contradicted its own `<behavior>` spec and acceptance criteria requiring exactly `0px` on all four sides.
- **Fix:** Added `border: none;` back to the `.tile` rule (with an explanatory comment distinguishing it from the deleted frame), matching the identical `border: none;`/`border: 0;` reset already present on every other interactive button-styled element in this codebase (`DetailHero.astro:442`, `HomeCarousel.astro:1514/1838/1876`, `BaseLayout.astro:379`, `Lightbox.astro:302/348`) — an established, consistent codebase convention, not a new pattern.
- **Files modified:** `src/components/GalleryGrid.astro`
- **Verification:** Both PORT-05 Playwright tests pass (GREEN); all 35 tests in `gallery.spec.ts` pass; full e2e suite (265 tests, both projects) passes; `astro check` reports 0 errors.
- **Committed in:** `8005dc9` (Task 1 GREEN commit)
- **Note on the plan's own automated verify gate:** the plan's `<verify>` block includes a literal grep gate asserting the `.tile` rule contains "0 declarations whose property name starts with `border`" and that `git diff --stat` shows "exactly 1 deleted line and 0 added lines." Both of these literal, mechanically-checked criteria are now technically not met (the diff is +13/-1, one of the 13 additions is `border: none;`) — but they were written under the same incorrect "deletion alone is sufficient" assumption that Rule 1 corrects here. The plan's `<behavior>` section and Playwright acceptance criteria (the actual functional oracle for "no visible border, PORT-05") ARE fully satisfied. This conflict is called out explicitly for phase-verifier visibility.

**Total deviations:** 1 auto-fixed (Rule 1 — bug fix, native-button UA border)
**Impact on plan:** Necessary for actual correctness — without it, PORT-05 would have shipped a worse regression (a boxy native button chrome border) instead of the intended clean, borderless tile. No scope creep: the fix stays inside `.tile`'s own rule, in the same file the plan already scoped for editing, and follows an existing, established codebase pattern rather than inventing a new one.

## Issues Encountered

- **`npm run build` initially failed** with `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars` — this worktree had no `.env` file (git worktrees don't carry gitignored files). Copied `.env` from the main repo checkout (a local, gitignored, read-only-token build dependency, not a secret committed to git) to unblock the build. Not a plan deviation — pure local environment setup, no source files affected.
- **`npm run test:unit` reports "1 failed | 14 passed (15)" at the suite level.** The one failing suite, `tests/unit/dashboard-logic.test.ts`, fails to even import (`Cannot find package '@sanity/icons/BulbOutline'`) because this worktree never ran `npm ci --prefix sanity`, so `sanity/node_modules/` doesn't exist here at all — confirmed by comparing against the main repo checkout, where the package is present. This is an environment-provisioning gap unrelated to any file this plan touches (`sanity/editorial/dashboardLogic.ts` is in the separate Studio subproject). At the individual-test level, all 170 real unit tests pass — the failing suite contributes 0 tests (it fails at import, before any test runs). Logged to `.planning/phases/18-gallery-ditions-display-fixes/deferred-items.md` per the scope-boundary rule rather than fixed inline (fixing it would require a `npm ci --prefix sanity` package-manager operation entirely outside this plan's declared file scope).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01 (PORT-05, PORT-06) is fully implemented and verified by automated tests. Plan 02 (PORT-04, gallery description truncation) is independent and can proceed.
- Per this project's `workflow.human_verify_mode: end-of-phase` config, the plan's `<human-check>` visual confirmation step (footer styling + border absence at desktop/phone widths, FR/EN) is deferred to the end-of-phase human-verify pass covering the whole of Phase 18, not performed inline in this plan.
- `deferred-items.md` (new, this plan) tracks the pre-existing `sanity/node_modules` worktree-provisioning gap for whoever next needs the full Studio-side unit suite to run in a fresh worktree.

---
*Phase: 18-gallery-ditions-display-fixes*
*Completed: 2026-08-02*

## Self-Check: PASSED

- FOUND: src/components/GalleryGrid.astro
- FOUND: src/pages/galleries/[slug].astro
- FOUND: src/pages/en/galleries/[slug].astro
- FOUND: tests/e2e/gallery.spec.ts
- FOUND: .planning/phases/18-gallery-ditions-display-fixes/18-01-SUMMARY.md
- FOUND: .planning/phases/18-gallery-ditions-display-fixes/deferred-items.md
- FOUND commits: f5dc96d, 8005dc9, 131eb12, c593afb, 0a219de
