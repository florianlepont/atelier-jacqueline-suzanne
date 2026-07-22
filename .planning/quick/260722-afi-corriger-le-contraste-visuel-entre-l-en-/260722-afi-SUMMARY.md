---
phase: quick-260722-afi
plan: 01
subsystem: ui
tags: [sanity-studio, css, react, editorial-dashboard]

# Dependency graph
requires: []
provides:
  - "editorial-dashboard__group-header-band CSS class + Box hook on AttentionSection's header, giving the header a recessed, dark-mode-safe tinted background distinct from item rows"
  - "editorial-dashboard__group-title CSS class + Text hook demoting the group title to an uppercase, letter-spaced section label"
  - "--dashboard-group-header-background CSS custom property (deeper tint than both --dashboard-page-background and --dashboard-surface-background)"
affects: [editorial-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Recessed header-band pattern for card sub-sections (background + hairline divider + uppercase label), mirroring the existing 'Raccourcis' header idiom in the same file"]

key-files:
  created: []
  modified:
    - "sanity/editorial/EditorialDashboard.tsx"
    - "sanity/editorial/EditorialDashboard.css"

key-decisions:
  - "Applied the header-band background class to the outer Box (not the inner Flex) so the tint fills the full padded header region with no white gutter"
  - "Set --dashboard-group-header-background to 87%/13% color-mix, deeper than the existing 92%/8% row-hover token, so the header stays visually recessed even when a row underneath is hovered"

patterns-established: []

requirements-completed: [QUICK-260722-afi]

coverage:
  - id: D1
    description: "AttentionSection header renders on a recessed tinted band, separated from item rows by a hairline divider, with an uppercase section-label title"
    requirement: "QUICK-260722-afi"
    verification:
      - kind: unit
        ref: "grep class-parity check: editorial-dashboard__group-header-band and editorial-dashboard__group-title present in both .tsx and .css"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit -p sanity/tsconfig.json"
        status: pass
      - kind: other
        ref: "npm run lint --prefix sanity"
        status: pass
    human_judgment: true
    rationale: "Visual hierarchy/contrast and dark-mode rendering require human eyes in a running Sanity Studio (npm run dev --prefix sanity); grep/tsc/lint prove the code is wired correctly but cannot confirm the band reads as visually distinct or that dark mode looks right. This is Task 2 of the plan — a blocking checkpoint:human-verify that cannot be auto-approved from this environment."

duration: 8min
completed: 2026-07-22
status: complete
---

# Quick Task 260722-afi: Attention-Section Header Contrast Summary

**Recessed the "Informations manquantes" card's header behind its own tinted band (deeper `color-mix` tint than the row-hover state) with a hairline divider and an uppercase, letter-spaced section-label title, so it reads as clearly distinct from the clickable item rows beneath it.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-22T05:32:00Z
- **Completed:** 2026-07-22T05:40:34Z
- **Tasks:** 1 of 2 (Task 1 complete/committed; Task 2 is a blocking human-verify checkpoint — see below)
- **Files modified:** 2

## Accomplishments
- `AttentionSection`'s header `<Box>` now carries `editorial-dashboard__group-header-band`, giving it its own recessed background (`--dashboard-group-header-background`, deeper than both the page-background and the surface it sits on) plus a hairline bottom divider and top-corner radius.
- The group title `<Text>` now carries `editorial-dashboard__group-title`, demoting it from an item-style semibold title to an uppercase, letter-spaced section label — the same idiom already used for the "Raccourcis" shortcut-card header.
- All existing modern styling (rounded corners, tinted icon chip, count badge, "Bloquant" severity pill) is untouched — only the header's own background/typography changed.
- Accessibility preserved: `role="heading"` and `aria-level={3}` kept intact on the title; `text-transform: uppercase` is presentation-only and does not change the accessible name.

## Task Commits

Task 1 was committed atomically:

1. **Task 1: Differentiate the attention-section header from its item rows (TSX class hooks + CSS)** - `c1aac52` (fix)

**Plan metadata:** not yet committed — orchestrator handles the docs commit in a later step, per this quick task's constraints.

## Files Created/Modified
- `sanity/editorial/EditorialDashboard.tsx` - Added `editorial-dashboard__group-header-band` className to `AttentionSection`'s header `Box`, and `editorial-dashboard__group-title` className to the group-title `Text`.
- `sanity/editorial/EditorialDashboard.css` - Added `--dashboard-group-header-background` token to `.editorial-dashboard__page`; added `.editorial-dashboard__group-header-band` (background + hairline divider + top-corner radius) and `.editorial-dashboard__group-title` (uppercase + letter-spacing) rule blocks.

## Decisions Made
- Header-band background class applied to the outer `<Box>`, not the inner `<Flex>`, per the plan's explicit reasoning — the `Flex` does not fill the `Box`'s padding, so a background on the `Flex` would leave a white gutter around the tinted band.
- `--dashboard-group-header-background` set to `color-mix(in srgb, var(--card-bg-color) 87%, var(--card-fg-color) 13%)`, deeper than the existing `--dashboard-page-background` (92%/8%, used for row hover), so the header band remains the most-recessed element in the card even while a row underneath is hovered.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored `sanity/` npm dependencies via `npm ci`**
- **Found during:** Task 1 verification (`npx tsc --noEmit -p sanity/tsconfig.json`)
- **Issue:** This worktree had no `node_modules` installed anywhere (neither root nor `sanity/`), so `tsc` failed with "Cannot find module 'react'" / `@sanity/*` etc. across the entire Studio codebase — a pre-existing environment gap, not caused by this task's edit, blocking the plan's own mandated verification step.
- **Fix:** Ran `npm ci` inside `sanity/` to restore dependencies exactly as pinned in the existing `package-lock.json` (no new packages added, nothing installed beyond what `package.json` already declares).
- **Files modified:** None tracked (installs into gitignored `sanity/node_modules/`).
- **Verification:** `npx tsc --noEmit -p sanity/tsconfig.json` then passed with zero errors; `npm run lint --prefix sanity` passed with zero errors.
- **Committed in:** N/A — `node_modules/` is gitignored, nothing to commit.

---

**Total deviations:** 1 auto-fixed (1 blocking — environment dependency restoration, not a package install of a new/unverified package)
**Impact on plan:** Necessary to run the plan's own mandated `tsc`/`eslint` verification steps. No scope creep — only existing, lockfile-pinned dependencies were restored.

## Issues Encountered
None beyond the dependency-restoration deviation above.

## User Setup Required
None - no external service configuration required.

## Task 2 Status: PENDING (blocking human-verify checkpoint)

Task 2 of this plan is `type="checkpoint:human-verify" gate="blocking"` and requires visual confirmation in a running Sanity Studio, which cannot be performed or faked from this execution environment. It was **not** attempted and remains open.

**To complete Task 2:**
1. Run `npm run dev --prefix /Users/florian/Projects/ajs-website/sanity` (Sanity dev server, http://localhost:3333).
2. Open the Studio dashboard ("Tableau de bord"), with at least one blocked/incomplete content item so "Informations manquantes" is visible.
3. Confirm the header (chip + title + count + "Bloquant" pill + description) sits on a subtly darker band, divided from the list by a thin line, with an uppercase-label title — visually distinct from item rows.
4. Confirm item rows are unchanged (title, type label, status pill, missing-fields line, hover "Compléter ›" action) and the card still looks modern (rounded corners, pills intact).
5. Toggle dark mode and re-check: the band stays subtly recessed (not a hardcoded light rectangle), divider stays visible.
6. Hover a row: the header band should remain distinguishable from the row-hover tint.

Per the plan's `<resume-signal>`: type "approved" if the header reads as clearly distinct in both light and dark mode with the modern look preserved, or describe what looks off (tint too strong/weak, divider missing, uppercase unwanted).

## Next Phase Readiness
- Task 1 (the only automatable task) is complete and committed (`c1aac52`); `tsc` and `eslint` both pass; diff scope is exactly the two intended files; `dashboardLogic.ts` is untouched.
- Task 2 (blocking human-verify) is the sole remaining item before this quick task can be considered fully closed — requires Romane/Florian to visually confirm in the running Studio per the steps above.

---
*Phase: quick-260722-afi*
*Completed: 2026-07-22*

## Self-Check: PASSED

- FOUND: sanity/editorial/EditorialDashboard.tsx
- FOUND: sanity/editorial/EditorialDashboard.css
- FOUND: .planning/quick/260722-afi-corriger-le-contraste-visuel-entre-l-en-/260722-afi-SUMMARY.md
- FOUND commit: c1aac52
