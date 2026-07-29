---
phase: 16-404-page-editorial-redesign
plan: 02
subsystem: ui
tags: [404, error-page, astro, css, scrim, bilingual, accessibility, sanity, playwright]

# Dependency graph
requires:
  - phase: 16-404-page-editorial-redesign (plan 01)
    provides: src/lib/pop-rate.ts (proximity->interval math) -- not consumed by this plan, only by plan 16-03
provides:
  - Rewritten src/pages/404.astro static shell (full-bleed photo pool, radial scrim, centered bilingual content), no client <script> yet
  - Realigned tests/e2e/not-found.spec.ts and tests/e2e/accessibility.spec.ts assertions/coverage for the new markup
affects: [16-404-page-editorial-redesign (plan 03 -- wires the pop-rate client engine onto the .not-found/.pop-photo contract this plan establishes)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Full-bleed background <img> stack with opacity/z-index hard-cut (no transition, no display:none) as both the interactive-effect substrate AND the no-JS static fallback"
    - "Build-time photo-pool sourcing reusing index.astro's getGalleries -> pickHeroIndex -> fullSizeUrl/responsiveImageSrcSet pipeline, without the showOnHomePage filter, capped to 16 entries"
    - "BaseLayout headerVariant='none' + hideFooter for a single-viewport immersive page composition"

key-files:
  created: []
  modified:
    - src/pages/404.astro
    - tests/e2e/not-found.spec.ts
    - tests/e2e/accessibility.spec.ts

key-decisions:
  - "BaseLayout rendered with headerVariant=\"none\" and hideFooter (Claude's Discretion per CONTEXT.md -- no locked decision governs chrome visibility) so the immersive full-bleed composition owns the whole viewport; the two in-composition home links are the escape route, so no nav is lost"
  - "Logo defaults to logoWhiteSrc unconditionally (no logoBlackSrc, no per-photo color analysis) since the radial scrim guarantees contrast against every pool photo"
  - "Pool sourcing deliberately omits index.astro's showOnHomePage filter for maximum photo variety; capped to .slice(0, 16) per the threat model's T-16-01 client resource-exhaustion mitigation"
  - "not-found.spec.ts's old getByRole('heading', ...) assertions replaced with getByText assertions for the '404' marker and both bilingual phrase lines, since the new DOM has one heading containing both lines rather than two separate per-language headings"
  - "accessibility.spec.ts's 404 coverage added as a dedicated test block (mirroring the file's existing dynamic-slug pattern) rather than a static path-array entry, since there is no literal /404/ route"

patterns-established:
  - "Hard-cut photo-swap CSS contract (.pop-photo / .pop-photo.is-active, no transition, no display:none) that plan 16-03's client engine will toggle"

requirements-completed: [ERR-01]

coverage:
  - id: D1
    description: "404 page renders a full-bleed background stack of real published gallery photos, with only the first photo visible by default (opacity/z-index, never display:none), so the page is a complete, correct, no-JS static fallback"
    requirement: "ERR-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/not-found.spec.ts#an unknown URL serves the bilingual noindex 404 page"
        status: pass
      - kind: other
        ref: "manual build-artifact inspection of dist/404.html: exactly one .pop-photo carries .is-active, no display:none, no transition on .pop-photo"
        status: pass
    human_judgment: false
  - id: D2
    description: "Centered content over a radial dimming scrim: AJS white logo (much larger than the header's 56px), a '404' marker, the bilingual 'Page introuvable / Not found' phrase, and the two home links side by side"
    requirement: "ERR-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/not-found.spec.ts#an unknown URL serves the bilingual noindex 404 page"
        status: pass
    human_judgment: true
    rationale: "Visual layout, scrim legibility, and side-by-side link positioning are subjective/visual judgments that automated text-presence assertions cannot fully confirm -- a human visual check of the built page is warranted before this is considered final."
  - id: D3
    description: "Page still serves HTTP 404 with noindex, shows both French and English content on every load, and both home links resolve through getRelativeLocaleUrl so they stay base-aware"
    requirement: "ERR-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/not-found.spec.ts#an unknown URL serves the bilingual noindex 404 page"
        status: pass
      - kind: other
        ref: "EXPECTED_BASE=/ npm run test:artifact"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every pool <img> is decorative (alt=\"\") and the pool container is aria-hidden=\"true\"; accessible content tree is exactly the marker, phrase, and links; automated axe scan is clean of serious/critical violations"
    requirement: "ERR-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/accessibility.spec.ts#the 404 page has no serious or critical automated accessibility violations"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-07-29
status: complete
---

# Phase 16 Plan 02: Static 404 Page Rewrite Summary

**Full-bleed 404 page with a build-time-sourced photo pool, opacity/z-index hard-cut background stack, radial scrim, and centered bilingual content — the no-JS-safe static shell the plan 16-03 pop-rate engine will animate.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Rewrote `src/pages/404.astro`'s body into the full-bleed, editorial composition: build-time photo pool (`getGalleries` -> `pickHeroIndex` -> `fullSizeUrl`/`responsiveImageSrcSet`, capped to 16 entries), stacked `.pop-photo` background images with the first `is-active` by default (the entire no-JS fallback), a radial dimming scrim, and centered logo/`404` marker/bilingual phrase/home-links content — all styled per `16-UI-SPEC.md`, with `headerVariant="none"`/`hideFooter` on `BaseLayout` so the composition owns the whole viewport.
- Realigned `tests/e2e/not-found.spec.ts`'s assertions to the new markup while preserving the load-bearing HTTP-404/`noindex`/base-aware-href checks, and added a dedicated 404 entry to `tests/e2e/accessibility.spec.ts`'s axe coverage (previously entirely absent).
- Verified the build-time gates end to end: `npm run typecheck` (0 errors), `npm run build`, `EXPECTED_BASE=/ npm run test:artifact` (built `404.html` still contains `href="/"` and `href="/en/"`), and `npx playwright test not-found accessibility` (12/12 passing).

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite the static 404 page (frontmatter, markup, scoped CSS)** - `71f0211` (feat)
2. **Task 2: Realign the e2e specs to the new markup (static assertions + 404 a11y entry)** - `1b92796` (test)

_No TDD tasks in this plan (`tdd_mode` is off for this project's config and neither task declared `tdd="true"`)._

## Files Created/Modified
- `src/pages/404.astro` - Rewritten body: photo-pool frontmatter sourcing, stacked background `<img>` markup, radial scrim, centered content, scoped CSS per UI-SPEC. No client `<script>` (deferred to plan 16-03).
- `tests/e2e/not-found.spec.ts` - Assertions updated for the new marker/phrase text; HTTP 404, `noindex` meta, and both home-link hrefs preserved.
- `tests/e2e/accessibility.spec.ts` - Added a dedicated 404-page axe-scan test block.

## Decisions Made
- `headerVariant="none"` + `hideFooter` on `BaseLayout` (Claude's Discretion per `16-CONTEXT.md` — no locked decision governs chrome visibility): the immersive, high-impact composition the user asked for would be undercut by the site's solid header/footer, and the two in-composition home links already provide the escape route.
- Logo defaults to `logoWhiteSrc` unconditionally (per `16-UI-SPEC.md` Color) — the radial scrim already guarantees legible contrast against every pool photo, so no per-photo dominant-color analysis or `logoBlackSrc` variant is needed.
- Photo pool intentionally omits `index.astro`'s `showOnHomePage` filter (RESEARCH A3 — maximum variety, not homepage curation) and is capped to 16 entries (T-16-01 threat-model mitigation for client-side resource exhaustion).
- `not-found.spec.ts`'s two old per-language `getByRole('heading', ...)` assertions were replaced with `getByText` assertions for the `404` marker and both phrase lines, since the redesigned DOM has one `<h1>` containing both bilingual lines rather than two separate headings.
- `accessibility.spec.ts`'s 404 coverage was added as a dedicated `test(...)` block (mirroring the file's existing dynamic-slug pattern) rather than a static path-array entry, since there is no literal `/404/` route — the page is only reachable via a genuinely nonexistent path.

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched their `<action>`/`<acceptance_criteria>` blocks without requiring Rule 1-4 fixes.

## Issues Encountered
- This worktree was missing `.env` (Sanity build-time credentials), which made `npm run build` fail at the `getGalleries()` call. Copied `.env` from the main repo checkout (same untracked, gitignored file every worktree needs for a Sanity-backed build) before proceeding — not a plan deviation, just worktree environment setup.
- `npm run test:unit` has one pre-existing, out-of-scope failure (`tests/unit/dashboard-logic.test.ts`, missing `@sanity/icons/BulbOutline` — a `sanity/` subproject dependency not installed in this worktree). Unrelated to any file this plan touches; logged in `.planning/phases/16-404-page-editorial-redesign/deferred-items.md` per the scope-boundary rule rather than fixed here.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The static 404 shell is complete, builds clean, and exposes the exact DOM/class contract (`.not-found`, `.not-found__pool`, `.pop-photo`/`.pop-photo.is-active`, `.not-found__scrim`, `.not-found__content`) that plan 16-03's pop-rate client `<script>` needs to attach to.
- Plan 16-03 can proceed independently: it adds the pointer/touch-driven pop-rate engine and the reduced-motion drift branch on top of this static shell, plus the reduced-motion e2e case deliberately deferred from this plan.
- No blockers.

---
*Phase: 16-404-page-editorial-redesign*
*Completed: 2026-07-29*
