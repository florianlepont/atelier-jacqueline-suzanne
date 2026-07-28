---
phase: quick-260728-ok5
plan: 01
subsystem: ui
tags: [css, astro, clamp, editorial-tokens]

requires: []
provides:
  - "Éditions overview header's site-nav-to-title gap capped at 56px (down from the shared 96px ceiling) via a scoped padding-top clamp, without touching the shared --editorial-page-padding-block token"
affects: [editions-overview, editions-header]

tech-stack:
  added: []
  patterns:
    - "Scoped CSS override pattern: split a shorthand `padding` into longhands to override a single axis with a component-local clamp while the other axes keep consuming the shared design token — used to fix a component-specific visual issue without touching shared tokens consumed by other pages (About, Contact)."

key-files:
  created: []
  modified:
    - "src/components/EditionsOverviewBody.astro"

key-decisions:
  - "Kept the shared --editorial-page-padding-block token (defined in src/layouts/BaseLayout.astro) completely untouched; scoped the fix to .editions-list's own padding-top only, so About and Contact are provably unaffected."
  - "Used a clamp(48px, 7vw, 56px) with the same minimum and slope as the shared token but a lower 56px ceiling, so the fix is a ratio (correct at every viewport) rather than a fixed-pixel guess that would only work at one width."

requirements-completed:
  - "CONFIRMED LIVE-FEEDBACK CORRECTION: third real gap Florian flagged (with a screenshot) on the deployed Éditions header (sketch-012 F1, shipped in quick tasks 260728-lbh then 260728-nj7). Feedback verbatim: 'mais tu n'as pas réduit la marge entre le header et le titre' — the empty space between the site's top navigation and the 'ATELIER JACQUELINE SUZANNE' / 'Éditions' title block is too large. This is a DIFFERENT gap than 260728-nj7 fixed (that fixed the header-block-to-row-list gap BELOW the title; this is the site-nav-to-title gap ABOVE it). Root-caused and live-tested on https://florianlepont.github.io/ajs-website/editions/ via getBoundingClientRect()/getComputedStyle() at 800px and 1440px (not guessed). No new user-facing requirement of its own — same 'confirmed live-feedback correction' framing as 260728-lbh/260728-nj7 this session."

coverage:
  - id: D1
    description: "Éditions overview `.editions-list` padding-top capped at 56px at 1440px (down from 96px) on both /editions/ and /en/editions/, unchanged (56px) at 800px, via a scoped clamp(48px, 7vw, 56px) that replaces the shared shorthand's top value only."
    requirement: "CONFIRMED LIVE-FEEDBACK CORRECTION (260728-ok5)"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/edition.spec.ts tests/e2e/site-header.spec.ts tests/e2e/accessibility.spec.ts (63 passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test (full suite, 252 passed)"
        status: pass
      - kind: manual_procedural
        ref: "Playwright-driven getComputedStyle('.editions-list').paddingTop measurement against local preview server (astro preview) at 800px/1440px on /editions/ and /en/editions/"
        status: pass
    human_judgment: false
  - id: D2
    description: "About (/about/) and Contact remain numerically and visually unaffected because the shared --editorial-page-padding-block token was not modified."
    verification:
      - kind: manual_procedural
        ref: "Playwright-driven getComputedStyle on /about/ article.about-page at 800px (56px) and 1440px (96px), matching the shared token's unmodified clamp(var(--space-2xl), 7vw, 96px)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-28
status: complete
---

# Quick Task 260728-ok5: Cap Éditions Site-Nav-to-Title Gap Summary

**Split `.editions-list`'s padding shorthand into three longhands and capped only padding-top with an Éditions-scoped `clamp(48px, 7vw, 56px)`, dropping the site-nav-to-title gap from 96px to 56px at 1440px on both locales without touching the shared `--editorial-page-padding-block` token.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-07-28T15:51:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed the third real, screenshot-reported gap on the Éditions header (site-nav-to-title, above the title block — distinct from the 260728-nj7 header-block-to-row-list gap below it).
- `.editions-list`'s top padding now caps at 56px at desktop widths (was 96px) while remaining a no-op at 800px and mobile widths, because the override is a clamp ratio matching the shared token's minimum and slope, just with a lower ceiling.
- Shared `--editorial-page-padding-block` token left completely untouched — About and Contact keep byte-identical spacing.

## Task Commits

Each task was committed atomically:

1. **Task 1: Cap the Éditions site-nav-to-title gap by splitting `.editions-list`'s padding shorthand into three longhands** - `edf8c19` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/components/EditionsOverviewBody.astro` - `.editions-list` rule's single `padding` shorthand replaced by `padding-inline`, a new `padding-top: clamp(48px, 7vw, 56px)`, and `padding-bottom` (unchanged shared token)

## Decisions Made
- Scoped the fix to `.editions-list`'s own top padding via longhand override rather than touching the shared token, so About/Contact are provably unaffected.
- Used a clamp with matching minimum/slope to the shared token but a lower ceiling, so the fix holds correctly across all viewport widths rather than being a fixed-pixel value that would only be correct at one width.

## Deviations from Plan

None - plan executed exactly as written. One local-environment note (not a code deviation): the worktree lacked a `.env` file (gitignored, holds Sanity credentials) needed for `npm run build` to resolve content at build time; it was copied from the main repo checkout for local verification purposes only and is not part of the committed change.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Verification Results

- `npm run typecheck` - 0 errors, 0 warnings (2 pre-existing unrelated hints in test files)
- `npm run build` - succeeded, 27 pages built
- `npm run test:artifact` - static artifact verified (27 HTML files, base `/`)
- `npx playwright test tests/e2e/edition.spec.ts tests/e2e/site-header.spec.ts tests/e2e/accessibility.spec.ts` - 63/63 passed
- `npx playwright test` (full suite) - 252/252 passed
- Live-browser human-check (Playwright against local `astro preview` server, matching the plan's `<human-check>` measurement technique):
  - `/editions/` at 1440px: `.editions-list` computed `padding-top` = `56px` (down from 96px)
  - `/en/editions/` at 1440px: `.editions-list` computed `padding-top` = `56px` (down from 96px)
  - `/editions/` at 800px: `.editions-list` computed `padding-top` = `56px` (unchanged)
  - `/en/editions/` at 800px: `.editions-list` computed `padding-top` = `56px` (unchanged)
  - `/about/` at 800px/1440px: `article.about-page` computed `padding-top` = `56px` / `96px`, matching the unmodified shared token — About confirmed unaffected

## Next Phase Readiness
- Third and final live-feedback-reported Éditions header gap (of the three flagged this session: 260728-lbh, 260728-nj7, 260728-ok5) is resolved.
- No blockers. Ready for Florian's independent re-verification on the deployed site.

---
*Phase: quick-260728-ok5*
*Completed: 2026-07-28*

## Self-Check: PASSED
- FOUND: src/components/EditionsOverviewBody.astro
- FOUND: edf8c19 (commit)
