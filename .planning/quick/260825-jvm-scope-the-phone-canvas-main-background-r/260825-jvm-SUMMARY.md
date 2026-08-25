---
phase: quick-260825-jvm
plan: 01
subsystem: ui
tags: [astro, css, media-query, playwright]

requires: []
provides:
  - Viewport-gated `body.has-phone-canvas main` rule in BaseLayout.astro
  - Content-agnostic Playwright regression spec locking the phone-only scope
affects: [homepage, gallery-detail, edition-detail]

tech-stack:
  added: []
  patterns:
    - "Phone-canvas colour mechanisms (head style block + body.has-phone-canvas main rule) must share the same max-width: 767px breakpoint — divergence between them is the bug class this fix closes."

key-files:
  created:
    - tests/e2e/homepage-phone-canvas-scope.spec.ts
  modified:
    - src/layouts/BaseLayout.astro

key-decisions:
  - "Single scoped CSS change (wrap the existing rule in @media (max-width: 767px)) rather than removing/restructuring the mechanism — matches the sibling head style block's existing gate exactly."

patterns-established:
  - "Colour-mechanism pairs sharing a concept (phone-canvas colour: head <style> + body.has-phone-canvas main) must be kept on identical breakpoints; a future change to one must update the other."

requirements-completed: [BUG-01]

coverage:
  - id: D1
    description: "Desktop homepage (carousel and grid modes) paints main's normal dominant/white background instead of leaking the phone-canvas accent colour through empty grid cells"
    requirement: "BUG-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-phone-canvas-scope.spec.ts#desktop, carousel mode: main paints the dominant background, never the phone-canvas colour"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-phone-canvas-scope.spec.ts#desktop, grid mode: main paints the dominant background, never the phone-canvas colour nor any gallery hero accent"
        status: pass
    human_judgment: false
  - id: D2
    description: "Phone-width homepage still paints the phone-canvas colour on main, unchanged from before the fix"
    requirement: "BUG-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-phone-canvas-scope.spec.ts#phone width: main still paints the phone-canvas colour, unchanged"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-25
status: complete
---

# Quick Task 260825-jvm: Scope the phone-canvas main background rule to phone widths Summary

**Gated the previously-ungated `body.has-phone-canvas main` CSS rule in BaseLayout.astro to `@media (max-width: 767px)`, fixing a desktop rendering bug where a per-gallery hero accent leaked through empty homepage grid cells as a solid lime-green rectangle instead of the page's normal white background.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-25T12:28:20Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Fixed the live desktop bug: `main` now always resolves to `--color-dominant` (white) on desktop (>=768px), in both carousel and grid display modes, regardless of gallery count or per-gallery accent colours.
- Preserved the phone-width behaviour byte-for-byte: below 767px, `main` still paints `--phone-canvas-color` exactly as before, so iOS rubber-banding shows no white/black flash.
- Added `tests/e2e/homepage-phone-canvas-scope.spec.ts`, a content-agnostic Playwright regression spec (no hardcoded hex literals, no gallery-count assumptions) covering desktop carousel mode, desktop grid mode, and phone width.

## Task Commits

Task executed as a single TDD (RED -> GREEN) unit, committed atomically:

1. **Task 1: Gate the phone-canvas main rule to phone widths and lock it with a regression spec** - `7734ad1` (fix)

**Plan metadata commit:** handled by the orchestrator (not created by this executor per constraints).

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - Wrapped the `body.has-phone-canvas main` rule in `@media (max-width: 767px)`, matching the sibling head `<style is:inline set:html>` block's existing breakpoint for the same phone-canvas concept; extended the neighbouring comment to record the rationale and reference this quick task.
- `tests/e2e/homepage-phone-canvas-scope.spec.ts` - Three-test regression spec (desktop carousel, desktop grid, phone width) that normalizes CSS colour values to computed `rgb(...)` strings via a throwaway DOM element, then asserts `main`'s computed background against `--color-dominant`, `--phone-canvas-color`, and every published gallery's `data-hero-color`.

## Decisions Made
- Followed the plan exactly: a single, minimally-scoped media-query wrap around the existing rule, with no changes to the head style block, the `--color-dominant` desktop rule, the `has-phone-canvas` class application, `--phone-canvas-color` assignment, or `phoneCanvasColor`'s computation in `HomePage.astro`.

## Deviations from Plan

None - plan executed exactly as written.

One implementation-environment note (not a deviation from the plan's code changes): the Playwright `webServer` config reuses an already-running `astro preview` process when one is listening on the target port (`reuseExistingServer: !CI`), and `astro preview` serves `dist/` from an in-memory snapshot taken at server boot. After applying the GREEN CSS fix, a stale preview server from the earlier RED run was still running on the verification port and had to be killed (`kill <pid>`) before a fresh `npm run build` + `npm run test:e2e` picked up the fix — otherwise the GREEN run kept observing the old (buggy) in-memory build. This is an artifact of the local verification setup, not a plan or code deviation.

## Issues Encountered
- Initial GREEN verification run appeared to fail identically to RED (still observing the lime-green leak) because a stale `astro preview` server process from the RED run was still serving the old build in memory on the chosen `E2E_PORT`. Resolved by killing the stale process and rebuilding (`npm run build`) before re-running the spec; all three tests then passed as expected.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Desktop homepage rendering bug is fixed and locked with regression coverage; no follow-on work identified.
- Full `chromium` Playwright project (356 passed, 1 pre-existing skip), `npm run lint`, and `npm run typecheck` all pass with no new failures introduced.

---
*Quick task: 260825-jvm*
*Completed: 2026-08-25*

## Self-Check: PASSED

- FOUND: src/layouts/BaseLayout.astro
- FOUND: tests/e2e/homepage-phone-canvas-scope.spec.ts
- FOUND: .planning/quick/260825-jvm-scope-the-phone-canvas-main-background-r/260825-jvm-SUMMARY.md
- FOUND: 7734ad1 (git log --oneline --all)
