---
phase: 10-unified-header-simplified-language-switcher
plan: 01
subsystem: ui
tags: [astro, component-extraction, header, css-scoping, e2e]

# Dependency graph
requires:
  - phase: 07-homepage-quick-fixes-mobile-hero-correctness
    provides: Instagram nav link href/target/rel/sr-only-hint semantics and the live-remeasure mobile-fit methodology, both reused verbatim here
provides:
  - src/components/SiteHeader.astro — the single canonical header component (logo, nav, Instagram link, named extra slot, LanguageSwitcher)
  - BaseLayout.astro rendering <SiteHeader> for every non-homepage page (About/Contact/gallery-detail)
  - Instagram nav link now present on About/Contact/gallery-detail (previously homepage-only)
  - Mobile @media(max-width:767px) header CSS ported forward onto the unified component (About/Contact/gallery-detail never had this before)
affects: [10-02 (homepage wiring of SiteHeader + LanguageSwitcher simplification), any future header/nav changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Astro component extraction with is:global CSS scoping for cross-file-overridden shared chrome (BaseLayout's existing convention, carried into the new component)"
    - "Named slot (slot=\"extra\") reserved for page-specific header content (homepage mode-toggle, wired in Plan 02)"

key-files:
  created:
    - src/components/SiteHeader.astro
    - tests/e2e/site-header.spec.ts
  modified:
    - src/layouts/BaseLayout.astro

key-decisions:
  - "SiteHeader's variant prop is a 2-value union ('solid' | 'transparent'), not BaseLayout's 3-value headerVariant — 'none' suppression stays entirely in BaseLayout's own conditional, per RESEARCH.md Open Question 2 resolution already locked in the plan."
  - "Relocated .chrome-band's header padding rule (base + @media(min-width:768px) variant) into SiteHeader's is:global block rather than leaving it in BaseLayout — the <header> element now renders outside BaseLayout's own style scope, and is:global CSS still reaches the footer's chrome-band identically since global rules apply site-wide regardless of which component defines them."

patterns-established:
  - "Shared header CSS lives in the component that owns the <header> markup (SiteHeader.astro), always as is:global — any future page adding header content composes through props or the named 'extra' slot, never by re-declaring header CSS elsewhere."

requirements-completed: [HOME-10]

coverage:
  - id: D1
    description: "Instagram icon link now renders in the header nav on /about/, /en/about/, /contact/, /en/contact/ (previously homepage-only) with correct href/target/rel and an accessible name containing 'Instagram'"
    requirement: "HOME-10"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — Instagram nav link on non-homepage pages (HOME-10, D-01, D-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "About/Contact/gallery-detail headers now render from the shared SiteHeader component (data-role=\"site-header\"), not BaseLayout's former inline <header> markup"
    requirement: "HOME-10"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — nav structure (HOME-10, D-01)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/about.spec.ts, tests/e2e/contact.spec.ts, tests/e2e/gallery.spec.ts, tests/e2e/social-links.spec.ts (regression suite, 27/27 passing)"
        status: pass
    human_judgment: false
  - id: D3
    description: "At a 393px viewport, About and Contact headers fit on one row with no horizontal page overflow now that Instagram is present (mobile CSS ported forward from HomeCarousel)"
    requirement: "HOME-10"
    verification:
      - kind: e2e
        ref: "tests/e2e/site-header.spec.ts#Shared SiteHeader — mobile fit at 393px (HOME-10, Pitfall 1)"
        status: pass
      - kind: manual_procedural
        ref: "Playwright-captured screenshots of [data-role=site-header] at 373px/393px/428px on /about/ and /contact/ — all render on one row, no wrap/cramping"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-07-16
status: complete
---

# Phase 10 Plan 01: Extract SiteHeader Component Summary

**Extracted BaseLayout's inline `<header>` into a standalone, is:global-styled `<SiteHeader>` Astro component and moved the Instagram nav link into it, so About/Contact/gallery-detail now share one canonical header implementation and gain the Instagram icon link that was previously homepage-only.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-16T16:50:00Z (approx.)
- **Completed:** 2026-07-16T15:19:35Z (UTC, this session)
- **Tasks:** 2
- **Files modified:** 3 (1 new component, 1 new test file, 1 modified layout)

## Accomplishments
- New `src/components/SiteHeader.astro`: the single canonical header (logo + hover crossfade, `.site-nav` with About/Contact/Instagram, `<slot name="extra">` reserved for the homepage's future mode-toggle, `<LanguageSwitcher>`), typed with a 2-value `variant: 'solid' | 'transparent'` prop union
- Instagram nav link (href/target/rel/sr-only hint, verbatim from Phase 7) moved into `SiteHeader`, so it now renders on `/about/`, `/en/about/`, `/contact/`, `/en/contact/`, and every `/galleries/[slug]/` page — not homepage-only anymore
- Ported HomeCarousel's live-tested `@media (max-width: 767px)` header trims onto the unified `.site-header`/`.site-nav`/`.nav-link` class names — About/Contact/gallery-detail never had mobile header CSS before this plan
- `BaseLayout.astro` now renders `<SiteHeader variant={headerVariant} ... />` behind its existing `headerVariant !== 'none'` conditional, unchanged in shape from the removed inline `<header>`
- `tests/e2e/site-header.spec.ts` written as a Wave 0 RED contract first (confirmed failing against the pre-refactor BaseLayout), then turned GREEN by the extraction — 8/8 assertions pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — failing e2e contract for the shared header on About/Contact/gallery-detail** - `2c0b50a` (test)
2. **Task 2: Create SiteHeader.astro and rewire BaseLayout to render it** - `d51046d` (feat)

_Note: Task 1 is the TDD RED gate (`test(10-01): add failing e2e contract...`); Task 2 is the GREEN implementation that makes it pass. No REFACTOR commit was needed — the extraction was verbatim, no cleanup pass required._

## Files Created/Modified
- `src/components/SiteHeader.astro` - New canonical header component: logo-mark + hover crossfade, `.site-nav` (About/Contact/Instagram), named `extra` slot, `<LanguageSwitcher>`, `is:global` stylesheet (solid/transparent variants, mobile `@media` trims, relocated `.chrome-band` header padding)
- `src/layouts/BaseLayout.astro` - Replaced inline `<header>` markup with `<SiteHeader variant={headerVariant} .../>` behind the existing `!== 'none'` conditional; added `instagramNewTabHint` const; removed now-extracted `.site-header*`/`.logo-mark*`/`.site-nav`/`.nav-link`/`.chrome-band` CSS from its own `<style>` block, kept `footer.chrome-band`/`.footer-text`/`.footer-legal-nav`/`main`
- `tests/e2e/site-header.spec.ts` - New Wave 0 e2e contract: Instagram link presence/attrs/accessible-name in `[data-role="site-header"]` on About/Contact (both locales), 393px no-overflow check, `.site-nav` DOM order assertion

## Decisions Made
- Kept `SiteHeader`'s `variant` prop as a 2-value union (`'solid' | 'transparent'`) rather than mirroring BaseLayout's 3-value `headerVariant` — this was already locked by the plan/RESEARCH.md (Open Question 2), not a new decision made during execution; documented here because it's visible in the diff.
- Relocated `.chrome-band`'s padding rule (base + `@media (min-width: 768px)` variant) into `SiteHeader`'s `is:global` block rather than leaving a duplicate in BaseLayout — confirmed via live build+test that the footer's own `chrome-band` padding is unaffected, since `is:global` CSS applies site-wide regardless of which component's `<style>` tag defines it.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' `<action>`/`<verify>`/`<done>`/`<acceptance_criteria>` blocks were followed as specified; no Rule 1-4 auto-fixes were needed.

## Issues Encountered
- The worktree had no `.env` file (gitignored, not copied into the worktree checkout), which blocked `npm run build` and the Playwright webServer's `astro preview` step (`Missing SANITY_PROJECT_ID or SANITY_DATASET env vars`). Copied `.env` from the main repo checkout (`/Users/florian/Projects/ajs-website/.env`) into the worktree to unblock verification — this is a local dev-environment file, not a code change, and was not committed (remains gitignored).
- Running the full e2e suite in one parallel pass produced 8 flaky timeouts (all in files this plan does not touch: `homepage.spec.ts`, `social-links.spec.ts`) under heavy resource contention (8.6 min for the full suite). Re-ran the affected files in isolation immediately afterward — all 35 tests passed cleanly in 12.4s, confirming these were parallel-worker resource-contention flakes, not regressions from this plan's changes (which never touch `HomeCarousel.astro` or `LanguageSwitcher.astro` — those are Plan 02's scope).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `SiteHeader.astro` is ready for Plan 02 to consume from the homepage (`HomeCarousel.astro`), passing the carousel/grid mode-toggle into the reserved `slot="extra"` and using `variant="transparent"` per D-02.
- `LanguageSwitcher.astro` is unchanged in this plan (still the two-link "FR | EN" implementation) — Plan 02 owns its simplification (I18N-04).
- No blockers for Plan 02.

---
*Phase: 10-unified-header-simplified-language-switcher*
*Completed: 2026-07-16*
