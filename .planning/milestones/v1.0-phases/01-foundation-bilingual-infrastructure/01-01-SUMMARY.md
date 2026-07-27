---
phase: 01-foundation-bilingual-infrastructure
plan: 01
subsystem: infra
tags: [astro, i18n, playwright, vitest, static-site, testing]

# Dependency graph
requires: []
provides:
  - "Buildable Astro 7.0.6 static-site project (no SSR adapter) at repo root"
  - "Astro built-in i18n routing config: defaultLocale fr, locales [fr,en], prefixDefaultLocale false"
  - "Playwright (chromium) + Vitest test harness wired to package.json scripts"
  - "RED unit test for the not-yet-built src/lib/i18n-paths.ts getSwitcherHref utility"
  - "RED e2e test suite (locale content + switcher groups) covering I18N-01/I18N-02"
affects: [01-02, 01-03, 01-04, 01-05]

# Tech tracking
tech-stack:
  added: ["astro@7.0.6", "@playwright/test@1.61.1", "vitest@4.1.9"]
  patterns:
    - "output: 'static', no adapter — all later phases must not introduce @astrojs/cloudflare or any SSR adapter"
    - "Astro i18n config as single source of truth for locale routing (defaultLocale/locales/routing.prefixDefaultLocale)"
    - "Playwright webServer drives `npm run preview` against built dist/, not a dev server"
    - "Vitest targets tests/unit/**/*.test.ts only, node environment, no watch mode"

key-files:
  created:
    - package.json
    - astro.config.mjs
    - tsconfig.json
    - .nvmrc
    - .gitignore
    - src/env.d.ts
    - src/pages/index.astro
    - playwright.config.ts
    - vitest.config.ts
    - tests/unit/i18n-paths.test.ts
    - tests/e2e/i18n.spec.ts
  modified: []

key-decisions:
  - "No SSR adapter installed (output: 'static' framework default) per OVH static-hosting constraint — @astrojs/cloudflare/wrangler deliberately excluded"
  - "Playwright serves the built static output via `npm run preview` rather than `astro dev`, matching production deploy shape"
  - "RED tests target the real future contracts (getSwitcherHref signature, ajs_locale cookie, 'FR | EN' switcher text) rather than stubs, per plan instruction not to weaken assertions"

patterns-established:
  - "Shared-slug switcher utility contract: getSwitcherHref(currentPath, targetLocale) at src/lib/i18n-paths.ts (interface only, implementation deferred to Plan 04)"
  - "Nyquist RED gate: tests/unit + tests/e2e authored and confirmed failing before any implementation, armed for Plans 03/04 to turn green"

requirements-completed: [I18N-01, I18N-02]

duration: 11min
completed: 2026-07-06
---

# Phase 01 Plan 01: Foundation & Bilingual Infrastructure Summary

**Astro 7.0.6 static-site scaffold with built-in FR-root/EN-`/en/` i18n routing, no SSR adapter, plus a wired Playwright+Vitest harness and confirmed-RED unit/e2e tests for the switcher and locale chrome that Plans 03/04 will implement.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-06T12:02:00Z (approx.)
- **Completed:** 2026-07-06T12:10:07Z
- **Tasks:** 3/3
- **Files modified:** 12

## Accomplishments
- Astro project builds to a static `dist/` with FR-at-root i18n routing configured (`defaultLocale: 'fr'`, `locales: ['fr','en']`, `prefixDefaultLocale: false`) and zero SSR adapter
- Playwright (chromium installed) and Vitest installed, configured, and both execute cleanly (no watch-mode flags anywhere)
- Failing unit test (`tests/unit/i18n-paths.test.ts`) and failing e2e test suite (`tests/e2e/i18n.spec.ts`, `locale content` + `switcher` groups) authored against the real future contracts and confirmed RED — the Nyquist gate is armed for Plans 03/04

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Astro project with i18n routing config** - `dc48306` (feat)
2. **Task 2: Install and configure Playwright + Vitest test harness** - `f4842e3` (test)
3. **Task 3: Author failing unit + e2e tests (RED)** - `64fc758` (test)

**Plan metadata:** _pending_ (docs: complete plan — added after this summary)

_Note: Task 3 is a single-commit RED authoring step per this plan's scope — the GREEN implementation (src/lib/i18n-paths.ts, BaseLayout chrome, switcher) is explicitly deferred to Plans 03/04, not part of this plan's TDD cycle._

## Files Created/Modified
- `package.json` - Astro + Playwright + Vitest scripts/dependencies (build/dev/preview/test:unit/test:e2e)
- `package-lock.json` - locked dependency tree
- `astro.config.mjs` - i18n config (defaultLocale fr, locales [fr,en], prefixDefaultLocale false), output: 'static', no adapter
- `tsconfig.json` - extends Astro's strict TS preset
- `.nvmrc` - pins Node 22 (Astro 7.0.6 requires >=22.12.0)
- `.gitignore` - node_modules/, dist/, .astro/, env files, Playwright artifacts
- `src/env.d.ts` - Astro client types reference
- `src/pages/index.astro` - temporary bare French placeholder homepage (build-enabling stub only; Plan 04 replaces it)
- `playwright.config.ts` - testDir tests/e2e, webServer runs `npm run preview` against http://localhost:4321, chromium project only
- `vitest.config.ts` - targets tests/unit/**/*.test.ts, node environment, watch disabled
- `tests/unit/i18n-paths.test.ts` - RED: imports getSwitcherHref from src/lib/i18n-paths (module doesn't exist yet)
- `tests/e2e/i18n.spec.ts` - RED: `locale content` and `switcher` test.describe groups covering I18N-01/I18N-02

## Decisions Made
- No SSR adapter installed — confirmed via `grep -c "adapter" astro.config.mjs` returning 0 (and rewrote an explanatory code comment that had accidentally contained the literal word "adapter", which would have failed that same grep-based acceptance check while being semantically correct)
- Manual project scaffold (hand-written package.json/config files) instead of the interactive `npm create astro@latest` wizard, for full non-interactive control over exact file contents matching the plan's acceptance criteria

## Deviations from Plan

None - plan executed exactly as written. The one adjustment (rewording an astro.config.mjs comment to avoid the substring "adapter") was a self-correction within Task 1 to satisfy that task's own literal acceptance-criteria grep, not a deviation from the plan's intent.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. (OVH FTP credentials, Sanity project, and staging DNS/subdomain remain open prerequisites tracked in STATE.md/RESEARCH.md for Plan 01-02 and later, not this plan.)

## Next Phase Readiness
- `npm run build`, `npm run test:unit`, and `npm run test:e2e` are all wired and runnable from a clean checkout (after `npm ci` and `npx playwright install --with-deps chromium`)
- Plan 03/04 can now implement `src/lib/i18n-paths.ts`, `BaseLayout.astro`, `LanguageSwitcher.astro`, and the `/en/` homepage against the RED tests authored here without further test-harness setup
- No blockers introduced by this plan; OVH deploy credentials and Sanity project creation remain the tracked open items for subsequent Phase 1 plans

---
*Phase: 01-foundation-bilingual-infrastructure*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 11 created files verified present on disk; all 3 task commit hashes (`dc48306`, `f4842e3`, `64fc758`) verified present in git history.
