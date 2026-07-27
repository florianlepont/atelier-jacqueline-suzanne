---
phase: 10-unified-header-simplified-language-switcher
plan: 02
subsystem: ui
tags: [astro, component-extraction, header, css-scoping, view-transitions, e2e]

# Dependency graph
requires:
  - phase: 10-unified-header-simplified-language-switcher (Plan 01)
    provides: SiteHeader.astro (the canonical header component, named `extra` slot reserved for this plan's mode-toggle) and BaseLayout.astro already rendering it for About/Contact/gallery-detail
provides:
  - HomeCarousel.astro rendering the SAME <SiteHeader variant="transparent"> component every other page renders, with the carousel/grid mode-toggle composed via the named `extra` slot
  - Cross-page structural-identity e2e proof (/ vs /about/ render the same .site-nav .nav-link set/order) closing the untested gap RESEARCH.md flagged
  - Full retirement of .home-header/.home-nav/.home-nav-link/.home-logo*/[data-role="home-header"] from source and tests (D-05/D-06)
affects: [Phase 10 Plan 03 (LanguageSwitcher simplification, I18N-04) — SiteHeader/HomeCarousel now the stable base it composes on top of; any future header/nav changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixed-prop component + CSS attribute-selector re-skin (RESEARCH.md Pattern 1): <SiteHeader variant=\"transparent\"> renders once; carousel/grid visual swap is driven entirely by [data-display-mode] CSS overrides, never by changing the prop."
    - ":global() wrapping for cross-component CSS overrides in a scoped <style> block — HomeCarousel's own stylesheet reaches into SiteHeader.astro/LanguageSwitcher.astro-owned classes (.site-header--transparent, .logo-mark*, .switcher-link) by wrapping the SiteHeader-owned selector fragment in :global(), since Astro's scoped-CSS compiler only appends the local scope attribute to the rightmost compound selector and that attribute would never match markup rendered by a different component file."

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
    - tests/e2e/i18n.spec.ts
    - tests/e2e/site-header.spec.ts

key-decisions:
  - "Carousel-mode header re-skin CSS was deleted outright rather than ported forward: SiteHeader's own .site-header--transparent default (dark gradient scrim, white text) already IS the carousel look — re-declaring a near-duplicate override would defeat the phase's own point (true visual identity with gallery-detail's transparent header, not a coincidentally-similar copy)."
  - "Homepage's mobile @media(max-width:767px) header/nav/nav-link trims (flex-wrap, var(--space-xs) gaps/padding) were deleted, not renamed — Plan 01 already ported these exact live-tuned values forward into SiteHeader.astro's own is:global mobile baseline, so duplicating them in HomeCarousel would just re-declare the same rule twice for no effect. Re-verified live at 393px with the toggle present (a 5th flex item About/Contact never has) that zero additional homepage-only trims were needed."
  - "Grid-mode's logo/chip re-skin was written as a full inversion of SiteHeader's transparent-variant hover mechanic (rather than trying to reuse .site-header--solid's rules directly, which never apply since the variant prop stays fixed at \"transparent\") — confirmed correct via live screenshots of default and hover states in grid mode."

patterns-established:
  - "When a page composes a shared, is:global-styled component and needs page-scoped visual overrides, wrap only the shared-component-owned selector fragments in :global() inside the page's own scoped <style> block — ancestor selectors owned by the page itself (e.g. .home[data-display-mode]) do not need wrapping."

requirements-completed: [HOME-10]

coverage:
  - id: D1
    description: "The homepage header renders from the same <SiteHeader> component as About/Contact (via HomeCarousel), not a parallel .home-header implementation"
    requirement: "HOME-10"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — cross-page structural identity (HOME-10, D-01, D-05) — / and /about/ render the same .site-nav .nav-link count and order"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts, tests/e2e/i18n.spec.ts (full suite, unified selectors)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Carousel mode looks transparent (white logo/text over the scrim); grid mode looks solid (ink logo/text, hairline) — driven by [data-display-mode] CSS re-skinning a fixed variant='transparent' render, never a prop change"
    requirement: "HOME-10"
    verification:
      - kind: manual_procedural
        ref: "Playwright-captured screenshots at 1280px: carousel mode (white logo/nav over scrim), grid mode (solid white bg, ink logo/nav), grid-mode logo hover (black chip, white logo) — all correct"
        status: pass
      - kind: e2e
        ref: "npm run test:e2e (85/85 passing, includes HOME-01/02/03/05/06/09 regression suite)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The carousel/grid mode-toggle renders inside SiteHeader's extra slot on the homepage only, still toggles modes, and does NOT appear on About/Contact"
    requirement: "HOME-10"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#single unified mode toggle (HOME-01, D-01/D-02), #square mode-toggle box (HOME-05)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — nav structure (HOME-10, D-01) — /about/ .site-nav has exactly 3 links (no toggle)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The .nav-link count and order match between / and /about/ (Logo, About, Contact, Instagram, switcher)"
    requirement: "HOME-10"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — cross-page structural identity (HOME-10, D-01, D-05)"
        status: pass
    human_judgment: false
  - id: D5
    description: "At a 393px mobile viewport, the homepage header (6 items including the toggle) and About/Contact headers (5 items) fit on one row with no horizontal overflow"
    requirement: "HOME-10"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#Instagram nav link (HOME-04) — no horizontal page overflow at 393px; tests/e2e/site-header.spec.ts#mobile fit at 393px"
        status: pass
      - kind: manual_procedural
        ref: "Playwright-captured screenshots of [data-role=site-header] at 393px on / and /about/ — both render on one row, no wrap/cramping"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-07-17
status: complete
---

# Phase 10 Plan 02: Homepage SiteHeader Wiring Summary

**HomeCarousel.astro now renders the same `<SiteHeader variant="transparent">` component every other page renders (mode-toggle passed into its named `extra` slot), retiring `.home-header`/`.home-nav`/`.home-logo` entirely and closing the untested cross-page-identity gap with a new e2e assertion.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-07-17T15:50:00Z (approx.)
- **Completed:** 2026-07-17T16:00:49Z (UTC, this session)
- **Tasks:** 2
- **Files modified:** 4 (1 component, 3 e2e test files)

## Accomplishments
- `HomeCarousel.astro`'s inline `<header class="home-header">` is gone — it now renders `<SiteHeader variant="transparent" ...>` (fixed prop, never re-rendered by JS) with the carousel/grid mode-toggle button composed via SiteHeader's named `slot="extra"`, exactly matching Plan 01's contract
- Grid mode's "solid" look is achieved entirely by `[data-display-mode='grid']` CSS re-skinning `.site-header--transparent` (position/background/color, logo hover-swap inversion, switcher color) — the `variant` prop is never swapped, matching RESEARCH.md Pattern 1
- `.home-header`, `.home-nav`, `.home-nav-link`, `.home-logo*`, `[data-role="home-header"]` are fully retired from `HomeCarousel.astro` and the two Phase 7 e2e files that referenced them (`homepage.spec.ts`, `i18n.spec.ts`), replaced with the unified `.site-header`/`.site-nav`/`.nav-link`/`.logo-mark*`/`[data-role="site-header"]` names (D-05/D-06); `[data-role="mode-toggle"]`/`.home-toggle*` were left untouched per D-05's explicit exclusion
- New cross-page structural-identity assertion in `tests/e2e/site-header.spec.ts` proves `/` and `/about/` render the identical ordered `.site-nav .nav-link` href set (About, Contact, Instagram) — the gap RESEARCH.md flagged as untested by any prior assertion
- Homepage's mobile `@media(max-width:767px)` header trims were removed as redundant — Plan 01 already ported these exact live-tuned values forward into SiteHeader's own baseline mobile CSS — and re-verified live at 393px with the toggle present that no additional trims were needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — selector rename + cross-page structural-identity assertion (RED)** - `b8d4286` (test)
2. **Task 2: Render SiteHeader from HomeCarousel with the toggle in the extra slot; apply the D-05 rename to markup + CSS** - `d0b2772` (feat)

_Note: Task 1 is the TDD RED gate (`test(10-02): rename unified header selectors...`); Task 2 is the GREEN implementation that makes it pass. No REFACTOR commit was needed — CSS consolidation happened inline as part of the GREEN implementation, and the full suite was GREEN on the first pass after Task 2's changes._

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Replaced the inline `.home-header` block with `<SiteHeader variant="transparent">` (toggle in `slot="extra"`); removed the direct `LanguageSwitcher` import/render and the duplicated Instagram link/logo hover-crossfade CSS (now owned solely by `SiteHeader.astro`); rewrote the `[data-display-mode]` re-skin CSS to target `:global(.site-header--transparent)`/`:global(.logo-mark*)`/`:global(.switcher-link)` (cross-component overrides from a scoped `<style>` block); preserved `view-transition-name: ajs-header` + `z-index: 5` via `.home :global(.site-header)`; removed the now-redundant mobile header/nav trims (ported forward into SiteHeader in Plan 01)
- `tests/e2e/homepage.spec.ts` - Renamed `[data-role="home-header"]` → `[data-role="site-header"]`, `.home-nav` → `.site-nav` across all locators (9 occurrences); left `[data-role="mode-toggle"]`/`.home-toggle*` and the `'FR | EN'` text assertion untouched
- `tests/e2e/i18n.spec.ts` - Renamed `[data-role="home-header"]` → `[data-role="site-header"]` (4 occurrences); left the two-language-code switcher text assertions unchanged (Plan 03's scope)
- `tests/e2e/site-header.spec.ts` - Added a new `describe` block: cross-page structural-identity test comparing `/` and `/about/`'s `.site-nav .nav-link` hrefs (count, order, exact values)

## Decisions Made
- Deleted (not ported) the carousel-mode-specific header re-skin CSS entirely — `SiteHeader`'s own `.site-header--transparent` default (dark gradient scrim, white text) already produces the carousel look; keeping a near-duplicate override would have undermined the phase's actual goal of visual identity with gallery-detail's transparent header.
- Deleted (not renamed) the homepage's mobile header/nav/nav-link trims — Plan 01 already ported these exact tuned values into `SiteHeader.astro`'s own `is:global` mobile baseline (10-01-SUMMARY.md), so re-declaring them here would be a no-op duplicate. Re-verified live at 393px (with the toggle now present, a 5th item About/Contact never has) that this holds — no overflow, no additional trims needed.
- Wrote the grid-mode logo/chip re-skin as a full inversion of `SiteHeader`'s transparent-variant default/hover mechanic (rather than attempting to reuse `.site-header--solid`'s own rules, which never apply since the `variant` prop stays fixed at `"transparent"`) — verified correct via live screenshots of both default and hover states in grid mode.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' `<action>`/`<verify>`/`<done>`/`<acceptance_criteria>` blocks were followed as specified; no Rule 1-4 auto-fixes were needed. The mobile-CSS deletion (rather than rename) and the carousel-mode CSS deletion were both explicitly anticipated by the plan's own action text ("keeping ONLY the homepage-specific deltas... DELETE from HomeCarousel the base header/nav/logo rules that now live in SiteHeader's is:global stylesheet"), not scope additions.

## Issues Encountered
- The worktree had no `.env` file (gitignored, not copied into the worktree checkout), which blocked `npm run build` and the Playwright webServer's `astro preview` step. Copied `.env` from the main repo checkout (`/Users/florian/Projects/ajs-website/.env`) into the worktree to unblock verification — a local dev-environment file, not a code change, not committed (remains gitignored). Same resolution Plan 01 used.
- Astro's scoped-CSS compiler only appends the local component's scope attribute to the rightmost compound selector in each rule — since `HomeCarousel.astro`'s own `<style>` block is scoped (not `is:global`) and the `<header>` element it needs to re-skin now lives in `SiteHeader.astro`'s own template (a different component file, different scope id), every cross-component override selector had to be wrapped in `:global()` to match. This was anticipated by the plan/patterns doc's existing `:global(.switcher-link)` precedent already in the file; applied consistently to the new `.site-header--transparent`/`.logo-mark*`/`.switcher-link` overrides. Verified correct via live screenshots (grid-mode re-skin and logo hover both render as expected) — no incorrect/no-op selectors slipped through.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `HomeCarousel.astro` now composes on top of `SiteHeader.astro`/`LanguageSwitcher.astro` exactly like every other page — Plan 03 (I18N-04, `LanguageSwitcher` simplification) can proceed against this stable base with no further header-consolidation work outstanding.
- HOME-10 is fully delivered: one shared header component, verified structurally identical between `/` and `/about/` by an automated cross-page assertion, with the mode-toggle correctly scoped to the homepage only via the named slot.
- No blockers for Plan 03.

---
*Phase: 10-unified-header-simplified-language-switcher*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created/modified files confirmed present on disk (`src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts`, `tests/e2e/i18n.spec.ts`, `tests/e2e/site-header.spec.ts`, this SUMMARY). All three task/docs commits confirmed present in git log (`b8d4286`, `d0b2772`, `c0f0a2c`).
