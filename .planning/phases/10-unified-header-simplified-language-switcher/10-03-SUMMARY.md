---
phase: 10-unified-header-simplified-language-switcher
plan: 03
subsystem: ui
tags: [astro, i18n, accessibility, playwright]

# Dependency graph
requires:
  - phase: 10-01
    provides: SiteHeader extraction, .site-header/.nav-link/.logo-mark unified selectors
  - phase: 10-02
    provides: Homepage renders SiteHeader; [data-role="site-header"] used site-wide (D-05 rename already landed)
provides:
  - LanguageSwitcher.astro collapsed from two links + separator to one link (other language only) + inline globe icon
  - sr-only current-language hint on the switcher link (D-11)
  - Dead .switcher-separator selector removed from HomeCarousel.astro's display-mode color overrides
affects: [i18n, language-switcher, homepage-header]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Accessible-name-preserving icon+label link: only the decorative SVG is aria-hidden, the visible text stays in the accessible name so getByRole('link', {name}) locators keep resolving"

key-files:
  created: []
  modified:
    - src/components/LanguageSwitcher.astro
    - src/components/HomeCarousel.astro
    - tests/e2e/i18n.spec.ts
    - tests/e2e/homepage.spec.ts

key-decisions:
  - "sr-only hint phrased in the CURRENT page's language (FR page -> 'Passer en anglais', EN page -> 'Switch to French'), mirroring instagramNewTabHint's existing convention, per 10-UI-SPEC.md's Copywriting Contract"
  - "getSwitcherHref called once per render (non-current locale only), matching D-08"

patterns-established:
  - "One-link + globe language switcher is now the canonical LanguageSwitcher.astro contract site-wide"

requirements-completed: [I18N-04]

coverage:
  - id: D1
    description: "Switcher shows exactly ONE link (the other language) with a leading globe icon, no current-language link, no separator, on every page in both locales"
    requirement: I18N-04
    verification:
      - kind: e2e
        ref: "tests/e2e/i18n.spec.ts#locale content > French/English chrome renders (.switcher-link count===1, .switcher-separator count===0, getByRole name contains EN/FR)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#i18n non-regression guard > homepage header still exposes the one-link switcher"
        status: pass
    human_judgment: false
  - id: D2
    description: "Clicking the switcher navigates to the translated version of the current page and writes the ajs_locale cookie exactly as before"
    requirement: I18N-04
    verification:
      - kind: e2e
        ref: "tests/e2e/i18n.spec.ts#switcher (click-navigation + cookie tests, unchanged, still GREEN)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/legal.spec.ts#switcher (mentions-legales/confidentialite click-navigation, unchanged, still GREEN)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Globe icon legible at ~16px next to the EN/FR label on both the transparent (carousel) and solid (About) header variants"
    verification:
      - kind: manual_procedural
        ref: "Playwright screenshot of .language-switcher on / (fr), /en/, and /about/ at 1280px viewport, visually inspected this session"
        status: pass
    human_judgment: true
    rationale: "Icon legibility at rendered size is a subjective visual judgment call; the plan's own verify block flags it as a human-check item (10-03-PLAN.md Task 2 <human-check>), not something an automated assertion can confirm."

# Metrics
duration: 6min
completed: 2026-07-17
status: complete
---

# Phase 10 Plan 03: Simplified Language Switcher Summary

**Collapsed LanguageSwitcher.astro from a two-link "FR | EN" toggle to a single other-language link with an inline globe icon and an sr-only current-language hint, preserving the cookie-write/navigation behavior and the accessible-name substring existing tests depend on.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-17T18:06:00+02:00 (approx, first RED verification run)
- **Completed:** 2026-07-17T18:12:00+02:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `LanguageSwitcher.astro` now renders exactly one `<a class="switcher-link">` — the OTHER language's code preceded by a dependency-free inline globe `<svg>` — instead of two links joined by a `|` separator (I18N-04, D-07/D-08/D-09)
- Only the globe SVG is `aria-hidden`; the visible EN/FR text node stays in the accessible name, so every existing `getByRole('link', { name: 'EN' | 'FR' })` locator in `i18n.spec.ts` and `legal.spec.ts` keeps resolving with zero code changes to those click/cookie test blocks (D-11, Pitfall 3/4)
- `HomeCarousel.astro`'s dead `.switcher-separator` half of the display-mode color-override selectors removed (the element no longer exists in the DOM)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — rewrite the switcher assertions to the one-link + globe contract (RED)** - `d481309` (test)
2. **Task 2: Simplify LanguageSwitcher to one link + globe; clean up the dead separator override** - `3850e1d` (feat)

_Note: Task 1 was TDD RED — verified 3 targeted failures before Task 2's implementation turned them GREEN._

## Files Created/Modified
- `src/components/LanguageSwitcher.astro` - Rewritten to one link + inline globe SVG + sr-only current-language hint; cookie-write `<script>` untouched byte-for-byte
- `src/components/HomeCarousel.astro` - Removed the now-dead `.switcher-separator` selector half from the carousel/grid color-override rules
- `tests/e2e/i18n.spec.ts` - `locale content` block rewritten to assert one `.switcher-link`, zero `.switcher-separator`, accessible name contains EN/FR, and one inline `<svg>`
- `tests/e2e/homepage.spec.ts` - `i18n non-regression guard` rewritten to the same one-link contract on `[data-role="site-header"]`

## Decisions Made
- sr-only hint phrased in the CURRENT page's language ("Passer en anglais" on FR pages, "Switch to French" on EN pages) per 10-UI-SPEC.md's Copywriting Contract, resolving RESEARCH.md's Assumption A2 in favor of the UI-SPEC's explicit final copy over the research doc's illustrative "Passer en français" example.
- `getSwitcherHref` is now called exactly once per render (target locale only), matching D-08.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The RED verification (Task 1) failed with the exact expected signature (`.switcher-link` resolved to 2 elements instead of 1) before implementation, confirming the test rewrite was correctly targeting the still-unimplemented one-link contract.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- I18N-04 is fully delivered: the switcher shows only the other-language link + globe icon site-wide, click/cookie behavior is unchanged, and the accessible-name contract that `legal.spec.ts` depends on was preserved without touching that file.
- Full verification suite green: `npx playwright test tests/e2e/i18n.spec.ts tests/e2e/homepage.spec.ts tests/e2e/legal.spec.ts --project=chromium` (52/52), `npm run test:e2e` (85/85), `npm run test:unit` (40/40), `npm run build` succeeds.
- This was the final plan (Wave 3) of Phase 10 — both HOME-10 (SiteHeader unification, Plans 01-02) and I18N-04 (this plan) are now complete. Phase 10 is ready for `/gsd-verify-work`.

---
*Phase: 10-unified-header-simplified-language-switcher*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created/modified files and task commit hashes verified present:
- `src/components/LanguageSwitcher.astro` - FOUND
- `src/components/HomeCarousel.astro` - FOUND
- `tests/e2e/i18n.spec.ts` - FOUND
- `tests/e2e/homepage.spec.ts` - FOUND
- `.planning/phases/10-unified-header-simplified-language-switcher/10-03-SUMMARY.md` - FOUND
- Commit `d481309` (Task 1, RED) - FOUND
- Commit `3850e1d` (Task 2, GREEN) - FOUND
- Commit `fc9dcc2` (docs: summary + REQUIREMENTS.md) - FOUND
