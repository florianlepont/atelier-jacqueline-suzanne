---
phase: 13-nav-integration
plan: 01
subsystem: ui
tags: [astro, sanity, i18n, nav, site-header]

# Dependency graph
requires:
  - phase: 10-unified-header-simplified-language-switcher
    provides: the shared <SiteHeader> component + solid/transparent variant mechanism this plan extends
  - phase: 12-data-fetch-layer-routes
    provides: the /editions/ (fr) and /en/editions/ (en) overview routes this nav link targets
provides:
  - "Éditions" as the first nav link in the shared <SiteHeader>, on every page, both locales
  - siteSettings.navLabels.editions bilingual Sanity field (Romane-editable)
  - resolveSiteCopy().editionsLabel resolver key
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "New shared-chrome nav entries: add a Sanity navLabels.<key> field, a resolveSiteCopy().<key>Label resolver, then thread <key>Label/<key>Href through BOTH SiteHeader call sites (BaseLayout.astro, HomeCarousel.astro) identically — omitting either call site silently drops the link on that one page."

key-files:
  created: []
  modified:
    - sanity/schemas/siteSettings.ts
    - src/lib/sanity.ts
    - src/lib/site-config.ts
    - src/components/SiteHeader.astro
    - src/layouts/BaseLayout.astro
    - src/components/HomeCarousel.astro
    - tests/e2e/site-header.spec.ts
    - tests/unit/site-config.test.ts

key-decisions:
  - "Éditions renders as the FIRST nav link (before À propos), matching D-01's explicit nav-priority decision — implemented as a new <a class=\"nav-link\"> inserted first in .site-nav, no new CSS class."
  - "English nav label stays 'Éditions' unchanged (not translated) in both locales, mirroring how contactLabel is 'Contact' in both locales already — single fallback string in resolveSiteCopy()."
  - "D-03's <359px abbreviation exception was NOT triggered — the existing @media (max-width: 359px) padding/gap/font-size trims already applied to About/Contact/Instagram proved sufficient at 320px (the narrowest supported width) with the 4th link present, confirmed both by an automated Playwright no-overflow assertion and a live 320px/375px screenshot in both header variants."

patterns-established:
  - "Nav-link addition checklist: Sanity schema field -> SiteSettings type member -> resolveSiteCopy() key -> SiteHeader.astro Props+markup -> BOTH call sites (BaseLayout.astro AND HomeCarousel.astro)."

requirements-completed: [EDN-01]

coverage:
  - id: D1
    description: "'Éditions' nav link renders first in .site-nav on every page (homepage, gallery pages, About, Contact) in both FR/EN"
    requirement: "EDN-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — nav structure (HOME-10, D-01) > /about/: .site-nav exposes Éditions, About, Contact, and Instagram links in that DOM order"
        status: pass
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — Éditions nav link (EDN-01, D-01, SC #1/#2) > (all 6 path cases: /, /en/, /about/, /en/about/, /contact/, /en/contact/)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — cross-page structural identity (HOME-10, D-01, D-05) > / and /about/ render the same .site-nav .nav-link count and order"
        status: pass
    human_judgment: false
  - id: D2
    description: "Clicking Éditions reaches the Phase 12 Éditions overview in the visitor's current language (/editions/ fr, /en/editions/ en)"
    requirement: "EDN-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — Éditions nav link (EDN-01, D-01, SC #1/#2) > href resolution per locale"
        status: pass
    human_judgment: false
  - id: D3
    description: "Homepage carousel/grid stays Éditions-free — only the header links to Éditions on the homepage; HomeCarousel's galleries data untouched"
    requirement: "EDN-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — homepage carousel/grid stay Éditions-free (EDN-01, D-13, SC #3)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Éditions label is editable via siteSettings.navLabels.editions (Sanity), with an 'Éditions' fallback in both locales when unpopulated"
    requirement: "EDN-01"
    verification:
      - kind: unit
        ref: "tests/unit/site-config.test.ts#resolveSiteCopy > falls back to the same 'Éditions' literal in both locales when Sanity is empty (EDN-01, SC #4)"
        status: pass
      - kind: unit
        ref: "tests/unit/site-config.test.ts#resolveSiteCopy > uses the editable navLabels.editions value when populated (EDN-01, SC #4)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The 4-link header fits on one row with no horizontal overflow from the widest viewport down to 320px (narrowest supported phone), in both solid and transparent variants"
    requirement: "EDN-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — mobile fit at 320px with 4 nav links (EDN-01, D-02) > /about/, /, /galleries/silos/"
        status: pass
      - kind: manual_procedural
        ref: "Live screenshot at 320px and 375px viewports for /about/ (solid) and / (transparent) — all 4 links + logo + language switcher legible on one row, no clipping"
        status: pass
    human_judgment: false

# Metrics
duration: 7min
completed: 2026-07-23
status: complete
---

# Phase 13 Plan 01: Nav Integration Summary

**Wired a bilingual, Sanity-editable "Éditions" nav link as the first entry in the shared `<SiteHeader>` component, present on every page (homepage, gallery pages, About, Contact) in both call sites — no changes needed to the mobile-fit CSS.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-07-23T08:33:00Z
- **Completed:** 2026-07-23T08:39:22Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- "Éditions" now renders as the first `.nav-link` in `<SiteHeader>`'s `.site-nav`, ahead of À propos/Contact/Instagram, on every page in both French and English (EDN-01, D-01)
- The link resolves to the already-shipped Phase 12 overview route (`/editions/` fr, `/en/editions/` en) via the same `getRelativeLocaleUrl` pattern as the other nav links
- The label is Romane-editable via a new `siteSettings.navLabels.editions` bilingual Sanity field, with an "Éditions" fallback (same literal in both locales) when unpopulated
- The homepage's photography carousel/grid remains completely Éditions-free — the only homepage Éditions link lives in the header (D-13/SC #3), verified by a dedicated e2e guard scoped to the carousel/grid/carousel-data regions
- Re-measured the header at the narrowest supported phone width (320px) with the 4th link present: the existing `@media (max-width: 359px)` trims already applied to the other three links proved sufficient — no D-03 abbreviation was needed, confirmed by both an automated test and a live screenshot

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — express the Éditions nav contract in the existing e2e + unit specs** - `ca92615` (test)
2. **Task 2: GREEN — full Éditions nav vertical slice across schema, resolver, types, and both call sites** - `764aab0` (feat)
3. **Task 3: Mobile-fit refinement — re-measure the 4-link header and confirm single-row fit live (D-02/D-03)** - `223ee23` (test)

**Plan metadata:** commit pending (this SUMMARY + STATE.md/ROADMAP.md updates are made by the orchestrator after wave completion, per worktree-mode conventions)

## Files Created/Modified
- `sanity/schemas/siteSettings.ts` - added `navLabels.editions` bilingual object field (mirrors about/contact) + `editions: {fr: 'Éditions', en: 'Éditions'}` default in `initialValue.navLabels`
- `src/lib/sanity.ts` - `SiteSettings.navLabels.editions?: Partial<LocaleString>` type member
- `src/lib/site-config.ts` - `resolveSiteCopy()` gains `editionsLabel: settings?.navLabels?.editions?.[locale] || 'Éditions'`
- `src/components/SiteHeader.astro` - `editionsLabel`/`editionsHref` props; new `<a class="nav-link">` rendered first in `.site-nav`
- `src/layouts/BaseLayout.astro` - `editionsLabel`/`editionsHref` consts computed from `resolveSiteCopy`/`getRelativeLocaleUrl`, passed into `<SiteHeader>`
- `src/components/HomeCarousel.astro` - same treatment as BaseLayout (2nd call site); `galleries` carousel/grid data and markup untouched
- `tests/e2e/site-header.spec.ts` - 4-link Éditions-first nav contract (every page, both locales), editions-route resolution assertions, homepage carousel/grid editions-free guard, and 320px narrowest-viewport no-overflow assertions
- `tests/unit/site-config.test.ts` - `editionsLabel` fallback (both locales) + override assertions

## Decisions Made
- Éditions is the first nav link (D-01), before À propos — implemented as a plain insertion, no new CSS class, no active-state treatment (matches the "no nav link gets current-page styling" site-wide convention)
- English nav label kept as "Éditions" unchanged in both locales (Claude's Discretion per 13-CONTEXT.md), mirroring `contactLabel`'s single-fallback-string shape rather than `aboutLabel`'s locale-branching shape
- D-03's abbreviation exception was evaluated but not exercised: live-measured at 320px, the pre-existing sub-359px trims already fit all 4 links + logo + language switcher on one row in both header variants

## Deviations from Plan

None — plan executed exactly as written. The one "gray area" the plan flagged (whether D-03's `<359px` abbreviation would be needed) resolved in the "not needed" direction after live measurement, exactly as the plan anticipated as a possible outcome ("If the trims alone suffice, add NO abbreviation and record that outcome").

## Issues Encountered
- The worktree's `.env` (Sanity build credentials) is gitignored and wasn't present in this isolated worktree checkout — copied from the main repo working tree (not committed, still gitignored) so `npm run build` could resolve `getSiteSettings()` at build time. No code change; purely a local build-environment prerequisite.
- Full-suite `npm run test:unit` surfaced one pre-existing, out-of-scope failure (`tests/unit/dashboard-logic.test.ts` can't resolve `@sanity/icons` at the repo root) — confirmed via `git log` that this predates Phase 13 and is unrelated to any file this plan touches. Logged to `.planning/phases/13-nav-integration/deferred-items.md`, not fixed (out of this plan's scope per the executor's scope-boundary rules).

## User Setup Required

None - no external service configuration required. (Romane can optionally edit the "Éditions" nav label later via the Sanity Studio's "Réglages du site" > "Libellés du menu" > "Lien Éditions" field, exactly like the existing À propos/Contact labels — no action required for this to ship with the correct default copy.)

## Next Phase Readiness
- EDN-01 is fully delivered: Éditions is discoverable from the main nav on every page, both locales, pointing at the correct-locale overview route, editable via Sanity, and the homepage stays pure photography
- This was the last requirement owned by the v1.3 Éditions milestone's build phases (Phases 11-13) — Phase 14 (Verification & UAT) is next, a dedicated cross-cutting pass for the milestone's omission-class risks (missed locale, missed nav call site, missed sitemap entry), which this plan's own dual-call-site + dual-locale test coverage already substantially de-risks for the nav specifically
- No blockers

---
*Phase: 13-nav-integration*
*Completed: 2026-07-23*

## Self-Check: PASSED

All 8 modified/created source and test files confirmed present on disk; all 3 task commits (`ca92615`, `764aab0`, `223ee23`) confirmed present in `git log`.
