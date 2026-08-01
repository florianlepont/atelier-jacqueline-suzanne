---
phase: quick-260801-pn7
plan: 01
subsystem: cms
tags: [sanity-studio, schema, array-item-component, tab-order]

requires:
  - phase: quick-260801-kgh
    provides: edition's images array now uses gallery's "first item is the cover" convention, which this task tried to make visually explicit
provides:
  - Collection Studio document now opens on the Photos tab (first in the tab row, and the default), instead of Visibilité
  - Confirmed (live, not assumed) that Sanity Studio 6.6.0's array grid layout (options.layout: 'grid') does not invoke a field's components.item override — documented for future reference so nobody re-attempts this exact approach against a grid-layout array without first switching to list layout
affects: [sanity-studio-schemas]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - sanity/schemas/gallery.ts
    - sanity/schemas/edition.ts

key-decisions:
  - "Attempted a shared components.item override (PrimaryPhotoItem.tsx) to badge the first images[] item as 'Couverture' on both gallery.ts and edition.ts. Verified live against the real Studio: the badge never rendered (confirmed via DOM inspection, not just visual check) on either schema. Root cause confirmed, not guessed: Sanity's grid-layout array input (options.layout: 'grid', used by both fields) does not invoke components.item at all — a Studio-level limitation, not a wiring bug (the code matched the version-exact API found in the installed sanity@6.6.0 package's own .d.ts files)."
  - "Presented the user two paths (switch to list layout to make the badge work, vs. keep the grid and drop the badge) rather than deciding unilaterally, since switching to list layout would meaningfully change Romane's day-to-day photo-editing ergonomics (one row per photo instead of a compact thumbnail grid) — a real UX tradeoff, not an implementation detail. User chose to keep the grid; the badge attempt was fully reverted (component deleted, both schema wirings removed) in the same session."
  - "Moved default: true from gallery.ts's publication group to its photos group, since the user asked to put the Photos tab 'first' — interpreted as also being the tab shown when a Collection document is first opened, not just first in the tab row. Reversible in one line if that reading is wrong."

requirements-completed: [260801-pn7]

coverage:
  - id: D1
    description: "Collection ('gallery') Studio document: Photos is the first tab in the tab row and the tab selected by default on open; Visibilité/Présentation/Couleur/SEO keep their prior relative order after it"
    requirement: "260801-pn7"
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build"
        status: pass
      - kind: manual_procedural
        ref: "localhost:3333 — opened a real published Collection ('Paysage'); confirmed tab row reads Photos, Visibilité, Présentation, Couleur, SEO and Photos is selected on open"
        status: pass
    human_judgment: false
  - id: D2
    description: "Primary-photo visual badge: attempted, confirmed infeasible against the current grid layout via live verification, reverted at the user's explicit choice — no badge present in either schema, no dead code left behind"
    requirement: "260801-pn7"
    verification:
      - kind: manual_procedural
        ref: "localhost:3333 — before revert: opened a real edition ('Silos') Photos tab, confirmed via DOM text search that 'Couverture' never appeared anywhere in the page despite the component being correctly wired. After revert: re-verified the grid renders identically to its pre-task state on both a real edition and a real gallery, no console errors, no leftover 'PrimaryPhotoItem' references anywhere in sanity/"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build && npm run test:unit (271/271) after revert"
        status: pass
    human_judgment: true
    rationale: "The decision to drop the badge rather than switch to list layout was the user's own explicit choice, made after being shown the live-confirmed limitation and the tradeoff — recorded as a decision, not inferred."

duration: ~25min (2 executor tasks + orchestrator live verification, badge revert, and checkpoint resolution)
completed: 2026-08-01
status: complete
---

# Phase quick-260801-pn7 Plan 01: Primary Photo Badge Attempt + Gallery Tab Reorder Summary

**Reordered Collection's Studio tabs so Photos is first (and the default tab on open). Attempted a visual "Couverture" badge on the first photo of both Collection and Édition's photo arrays, confirmed live that Sanity's grid layout doesn't support this customization point, and reverted the attempt at the user's explicit choice rather than force a layout change to Romane's photo-editing UI.**

## Performance

- **Duration:** ~25 min total (2 executor task commits + orchestrator's live verification, checkpoint resolution, and revert)
- **Tasks:** 2 executed as planned (badge component + wiring, tab reorder) + 1 revert (badge only, orchestrator-driven after live verification failed and the user chose to keep the grid layout)
- **Files modified:** 2 net (gallery.ts, edition.ts); 1 file created then deleted (PrimaryPhotoItem.tsx)

## Accomplishments
- `sanity/schemas/gallery.ts`: `groups` reordered so `photos` (title "Photos") is first, with `default: true` moved onto it from `publication`. Live-confirmed: opening any real Collection document now lands directly on the Photos tab.
- Investigated and definitively resolved a real technical uncertainty about Sanity Studio 6.6.0's array-item customization API by reading the installed package's own `.d.ts` files rather than trusting generic web search (which was inconclusive/contradictory) — found `BaseItemProps.index` gives the item's position directly, no need for the more fragile `path`+`useFormValue`+`_key`-comparison approach originally hypothesized.
- Built and wired a shared `PrimaryPhotoItem` component (`components: {item: PrimaryPhotoItem}` on both `gallery.ts`'s and `edition.ts`'s `images` fields) implementing that verified API correctly.
- **Live verification caught a real, undocumented-by-Sanity limitation**: opened a real edition's Photos tab and confirmed via direct DOM inspection that the "Couverture" badge text never appeared anywhere on the page, despite zero console errors and structurally correct wiring. Root-caused to `options: {layout: 'grid'}` (used by both `images` fields) not invoking `components.item` at all — the grid layout has its own internal item renderer that bypasses this customization surface entirely.
- Presented the tradeoff to the user (switch to list layout to make the badge work, vs. keep the compact grid without a badge) rather than deciding unilaterally, since it's a real UX ergonomics tradeoff for Romane's daily editing, not an implementation detail.
- User chose to keep the grid layout; fully reverted the badge attempt in the same session — deleted `PrimaryPhotoItem.tsx`, removed both `components: {item: ...}` wirings and now-unused imports from `gallery.ts`/`edition.ts`. Re-verified live that both schemas render their photo grids identically to their pre-task state, no console errors, no dead references anywhere in `sanity/`.

## Task Commits

1. **Task 1: Shared PrimaryPhotoItem component + wire into both schemas** - `3fba363` (feat) — later reverted
2. **Task 2: Photos tab first + default on gallery.ts** - `bdc444c` (feat) — kept
3. **Revert of Task 1, after live verification + user decision** - `c242ddc` (revert)

**Plan metadata:** committed separately by the orchestrator (per instructions, the executor does not commit docs artifacts)

## Files Created/Modified
- `sanity/schemas/gallery.ts` — Photos group moved first in `groups`, `default: true` moved to it from `publication`. (Badge wiring added then reverted; net diff from pre-task is only the tab reorder.)
- `sanity/schemas/edition.ts` — (Badge wiring added then reverted; net diff from pre-task is zero.)
- `sanity/schemas/PrimaryPhotoItem.tsx` — created, then deleted in the revert.

## Decisions Made
- `default: true` interpretation: moved to `photos` on the assumption "put the tab first" implies "and open there by default" — flagged as reversible if the user only meant tab-row order.
- Badge implementation correctness was never in question — verified against the exact installed `sanity@6.6.0` type declarations, not assumed from documentation. The failure mode was a genuine Studio-level limitation (grid layout arrays don't support `components.item`), confirmed by direct DOM inspection live against the real Studio rather than trusted from a screenshot or visual impression alone.
- Given the fix (switching to list layout) has real, non-trivial UX consequences for the actual end user (Romane, editing potentially dozens of photos per collection), the choice was routed to the user rather than made autonomously — consistent with this session's established pattern of asking before changing established editing ergonomics.

## Deviations from Plan

**1. [User-directed, not an auto-fix] Task 3 (live verification checkpoint) surfaced a real infeasibility; badge reverted per user's explicit choice**
- **Found during:** Orchestrator's live verification (the plan's own Task 3 checkpoint), performed after the executor completed Tasks 1-2 and handed off (no browser tooling available to the executor).
- **Issue:** The badge never rendered — confirmed via DOM text search finding zero occurrences of "Couverture" anywhere in the page, despite structurally correct component code and wiring. Root cause: `options: {layout: 'grid'}` array inputs do not invoke `components.item`.
- **Resolution:** Presented the user the plan's own pre-identified fallback options (switch to list layout vs. drop the badge). User chose to drop the badge and keep the grid.
- **Files modified:** `sanity/schemas/gallery.ts`, `sanity/schemas/edition.ts` (badge wiring + import removed), `sanity/schemas/PrimaryPhotoItem.tsx` (deleted).
- **Verification:** Full gate suite re-run clean after the revert (`npm run test:unit` 271/271, `npm run lint`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`); live re-verification confirmed both a real gallery and a real edition's photo grids render identically to their pre-task state.
- **Committed in:** `c242ddc`

---

**Total deviations:** 1, entirely user-directed following a correctly-executed live-verification checkpoint exactly as the plan specified — not a code defect, not a planning gap.
**Impact on plan:** The Photos-tab-first reorder (independently verified, unrelated to the badge) is unaffected and shipped as planned. The badge requirement itself is not delivered — by the user's own informed choice after seeing the concrete tradeoff, not by omission.

## Issues Encountered
None beyond the documented grid-layout limitation above, which is itself the expected kind of finding a live-verification checkpoint exists to catch.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Tab reorder is live-verified and shipped.
- The primary-photo visual-indicator request remains genuinely unmet (by choice, not oversight) — if revisited later, the two known paths are: (a) switch `images` to `layout: 'list'` on the field(s) where a badge is wanted (accepted UX cost: one row per photo instead of a thumbnail grid), or (b) some other Sanity Studio version/API may lift this grid limitation in the future — worth re-checking `context7`/installed `.d.ts` types if this is revisited on a newer Sanity release.
- All gates green: unit (271/271), lint, typecheck, Sanity Studio lint + build.

---
*Phase: quick-260801-pn7*
*Completed: 2026-08-01*

## Self-Check: PASSED

All 3 commits confirmed present in `git log --oneline` (3fba363, bdc444c, c242ddc). `sanity/schemas/PrimaryPhotoItem.tsx` confirmed absent from the working tree. `grep -r "PrimaryPhotoItem" sanity/` confirmed zero matches. Working tree clean.
