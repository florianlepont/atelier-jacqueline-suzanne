---
phase: 10-unified-header-simplified-language-switcher
plan: 04
subsystem: ui
tags: [astro, gap-closure, uat]

# Dependency graph
requires:
  - phase: 10-01
    provides: SiteHeader extraction; logo href -> site root (the home-navigation affordance this plan relies on as the sole "return home" control)
  - phase: 10-02
    provides: Homepage/About/Contact/gallery-detail all render the shared SiteHeader
provides:
  - Gallery-detail hero (both locales) with a single, non-overlapping home-navigation affordance (the SiteHeader logo)
affects: [gallery-detail, header, i18n]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SiteHeader logo is the sole 'return home' affordance across all page templates — page-local duplicate back-links are removed rather than repositioned"

key-files:
  created: []
  modified:
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro

key-decisions:
  - "Removed the legacy .gallery-detail__hero-back link entirely rather than repositioning it, per the user's UAT instruction that the SiteHeader logo already provides identical home-navigation behavior"

requirements-completed: [HOME-10]

coverage:
  - id: UAT-T5-gap
    description: "On both /galleries/{slug}/ and /en/galleries/{slug}/, no text link overlaps the SiteHeader logo in the top-left corner of the hero; the logo alone returns home"
    requirement: HOME-10
    verification:
      - kind: automated
        ref: "grep -rn 'hero-back|backHref|getRelativeLocaleUrl' src/pages/galleries/[slug].astro src/pages/en/galleries/[slug].astro — zero matches in both files"
        status: pass
      - kind: automated
        ref: "npm run build — succeeds (21 pages built, no dead-import/variable error)"
        status: pass
      - kind: automated
        ref: "npm run typecheck (astro check) — 0 errors, 0 warnings, 6 pre-existing hints unrelated to this change"
        status: pass
      - kind: automated
        ref: "npm run lint (eslint .) — clean, no output"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/gallery.spec.ts tests/e2e/site-header.spec.ts --project=chromium — 15/15 passed"
        status: pass
    human_judgment: false

# Metrics
duration: ~10min
completed: 2026-07-20
status: complete
---

# Phase 10 Plan 04: Remove Duplicate Gallery-Detail Back-Home Link Summary

**Removed the legacy page-local `.gallery-detail__hero-back` "← Back home"/"← Retour à l'accueil" link and its dead CSS/const/import from both gallery-detail locale templates, closing the single Phase 10 UAT gap (Test 5) — the link visually overlapped the shared SiteHeader logo, which already provides identical home navigation.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-07-20T12:13:15Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Removed the `<a class="gallery-detail__hero-back">` anchor from both `src/pages/galleries/[slug].astro` (FR) and `src/pages/en/galleries/[slug].astro` (EN) — the element that visually overlapped the SiteHeader logo in the hero's top-left corner
- Removed both dead CSS rule blocks (`.gallery-detail__hero-back` base positioning + its `:hover, :focus-visible` rule) from each file's `<style>` block, leaving every other `.gallery-detail__hero*` rule (scrim, img, title) untouched
- Removed the now-unused `backHref` const and the now-unused `getRelativeLocaleUrl` import from `astro:i18n` in both files — confirmed `backHref` was `getRelativeLocaleUrl`'s sole consumer, so removing the link left both dead
- Updated the stale `.gallery-detail__hero` CSS comment in both files so it no longer references a "white top-left back-link" that no longer exists
- Gallery-detail pages now present the SiteHeader logo (shipped in 10-01/10-02) as the single, non-overlapping home-navigation affordance — UAT Test 5 gap closed

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the duplicate gallery-detail back-home link from both locale templates** - `1e35694` (fix)

## Files Created/Modified

- `src/pages/galleries/[slug].astro` - Removed `hero-back` anchor, its two CSS rule blocks, the `backHref` const, the `getRelativeLocaleUrl` import; updated stale hero comment
- `src/pages/en/galleries/[slug].astro` - Same removal applied to the EN mirror template

## Decisions Made

- Removed the link entirely (not repositioned/restyled) per the user's explicit UAT instruction: "this one can be removed as the click on logo has the same behavior" — the SiteHeader logo's `homeHref` and the removed link's `backHref` both resolved to the site root, so this is a pure duplicate-affordance removal with no loss of functionality.

## Deviations from Plan

None - plan executed exactly as written. The task's own `<action>` block anticipated all five removal points (anchor, two CSS blocks, const, import, stale comment) and all five were present exactly as diagnosed in `.planning/debug/header-backhome-overlap-logo.md`.

## Issues Encountered

- The worktree's local `npm run build` initially failed with "Missing SANITY_PROJECT_ID or SANITY_DATASET env vars" — this was a pre-existing worktree environment gap (the gitignored `.env` file is not copied into fresh git worktrees), not something introduced by this plan's changes. Copied the existing `.env` from the main repo checkout into the worktree (no contents read/modified) to unblock the build verification; `.env` remains gitignored and was not staged or committed.
- `astro check` reports a pre-existing hint ("'Props' is declared but never used") on both gallery-detail files. This predates this plan (the `Props` interface was already declared but the destructured `gallery` prop is accessed via `Astro.props`, not the `Props` type directly) and is a hint, not an error/warning under the blocking gate (typecheck summary: 0 errors, 0 warnings, 6 hints) — out of scope per the deviation rules' scope boundary, left untouched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HOME-10's remaining UAT gap (Test 5, gallery-detail back-link/logo overlap) is closed. Phase 10 is now fully verified: 16/16 UAT truths pass (15 originally + this gap-closure), both HOME-10 and I18N-04 requirements complete.
- Verification run this session: `grep` checks clean (zero matches for `hero-back`/`backHref`/`getRelativeLocaleUrl` in both files), `npm run build` succeeds (21 pages), `npm run typecheck` (0 errors/warnings), `npm run lint` (clean), `npx playwright test tests/e2e/gallery.spec.ts tests/e2e/site-header.spec.ts --project=chromium` (15/15 passed).
- Recommend a final human re-UAT pass on both `/galleries/{slug}/` and `/en/galleries/{slug}/` at desktop and ~390px to visually confirm the logo alone returns home with no overlapping text, per the plan's `<human-check>` step — this was not performed by the executor (automated-only verification in this session).

---
*Phase: 10-unified-header-simplified-language-switcher*
*Completed: 2026-07-20*

## Self-Check: PASSED

All created/modified files and task commit hashes verified present:
- `src/pages/galleries/[slug].astro` - FOUND
- `src/pages/en/galleries/[slug].astro` - FOUND
- `.planning/phases/10-unified-header-simplified-language-switcher/10-04-SUMMARY.md` - FOUND
- Commit `1e35694` (Task 1, fix) - FOUND
