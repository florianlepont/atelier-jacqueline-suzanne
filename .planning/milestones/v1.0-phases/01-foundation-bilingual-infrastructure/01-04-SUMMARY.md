---
phase: 01-foundation-bilingual-infrastructure
plan: 04
subsystem: frontend
tags: [astro, i18n, sanity, chrome, e2e, walking-skeleton]

# Dependency graph
requires:
  - phase: 01-foundation-bilingual-infrastructure (Plan 01)
    provides: Astro scaffold, i18n config, RED unit/e2e tests
  - phase: 01-foundation-bilingual-infrastructure (Plan 03)
    provides: getSiteSettings() build-time fetch helper, published bilingual siteSettings singleton
provides:
  - Shared-slug switcher utility (getSwitcherHref) at src/lib/i18n-paths.ts
  - Plain "FR | EN" LanguageSwitcher.astro component with cookie-on-click
  - BaseLayout.astro shared chrome (Sanity-sourced header/footer + pre-paint locale-cookie redirect)
  - Localized FR (/) and EN (/en/) placeholder homepages
  - Bilingual 404.astro wired into Apache via public/.htaccess
  - Full Nyquist gate GREEN: tests/unit/i18n-paths.test.ts + tests/e2e/i18n.spec.ts (locale content + switcher)
affects: [Phase 2+ (galleries/About/Contact reuse BaseLayout, LanguageSwitcher, getSwitcherHref)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vitest.config.ts uses astro/config's getViteConfig (not plain vitest/config defineConfig) so astro:i18n virtual-module imports resolve under Vitest"
    - "getSwitcherHref normalizes trailing slash independent of the project's trailingSlash/build.format config: homepage always ends in '/', every other page never does"
    - "BaseLayout consumes getSiteSettings() once per page render (build-time only) and passes locale-scoped strings down; no set:html anywhere (Astro auto-escaping only)"
    - "Astro strips whitespace between adjacent inline tags at compile time — use explicit {' '} expressions when literal spacing between rendered elements matters (e.g. 'FR | EN')"

key-files:
  created:
    - src/lib/i18n-paths.ts
    - src/components/LanguageSwitcher.astro
    - src/layouts/BaseLayout.astro
    - src/pages/en/index.astro
    - src/pages/404.astro
    - public/.htaccess
  modified:
    - src/pages/index.astro
    - vitest.config.ts

key-decisions:
  - "Wired the previously-unused Sanity navLabels.home field into BaseLayout as a localized 'Home'/'Accueil' nav link, since the seeded siteTitle is an intentionally untranslated brand name — without this, FR/EN header text would be byte-identical, failing the e2e 'copy differs' assertion."
  - "getSwitcherHref includes an explicit (currently always-true) hasTranslatedCounterpart check as the missing-counterpart fallback branch, satisfying D-04's durable-infra requirement without breaking the locked shared-slug unit test contract."
  - "Switched vitest.config.ts from vitest/config's defineConfig to astro/config's getViteConfig so the astro:i18n virtual module resolves under Vitest — a blocking-issue fix (Rule 3), not a scope change."

requirements-completed: [I18N-01, I18N-02]

duration: ~14min
completed: 2026-07-06
---

# Phase 1 Plan 04: Bilingual Walking Skeleton (Switcher + Chrome + Homepages + 404) Summary

**Turned the Plan 01 RED tests GREEN: a real getSwitcherHref shared-slug utility, a plain "FR | EN" switcher with cookie-on-click, a Sanity-sourced BaseLayout with a pre-paint locale-redirect script, localized FR/EN homepages, and a bilingual 404 wired into Apache — full unit + e2e suite passing.**

## Performance

- **Duration:** ~14 min
- **Completed:** 2026-07-06
- **Tasks:** 3/3
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments

- `src/lib/i18n-paths.ts` exports `getSwitcherHref(currentPath, targetLocale)`: strips the current locale prefix to recover the shared slug, calls `astro:i18n`'s `getRelativeLocaleUrl`, then normalizes the trailing slash (homepage always `/`-terminated, every other page never) so behavior is independent of the project's `trailingSlash`/`build.format` config. Includes an explicit (currently always-true) missing-counterpart fallback branch per D-04, forward-looking to Phase 2+.
- `tests/unit/i18n-paths.test.ts` is GREEN (all 4 mappings pass) — required switching `vitest.config.ts` from plain `vitest/config` to `astro/config`'s `getViteConfig` so the `astro:i18n` virtual module resolves under Vitest.
- `src/components/LanguageSwitcher.astro`: two `<a>` tags ("FR", "EN") plus a literal "|" separator, no dropdown/flags, hrefs computed via `getSwitcherHref(Astro.url.pathname, ...)`, 44px min tap target via padding, active locale bold+underlined, click handler sets `ajs_locale=<locale>; path=/; max-age=31536000; SameSite=Lax` before navigation.
- `src/layouts/BaseLayout.astro`: fetches `getSiteSettings()` at build time, renders a Secondary-band header (site title + localized Home nav link + switcher) and footer (footerText), Dominant content background, Accent links/focus-visible, UI-SPEC's 4 type sizes / 2 weights and spacing scale as CSS custom properties; inlines (`is:inline`, render-blocking) the D-03 locale-cookie redirect script in `<head>`. No `set:html` used anywhere on Sanity-sourced strings (T-01-XSS).
- `src/pages/index.astro` (French, root) and `src/pages/en/index.astro` (English) both wrap content in `BaseLayout`, rendering `welcomeHeading`/`welcomeBody` from Sanity — identical structure, only locale/copy differs.
- `src/pages/404.astro`: bilingual error page (French primary + English secondary) through `BaseLayout`, Heading/Body typography, Accent-colored homepage links.
- `public/.htaccess`: `ErrorDocument 404 /404.html`, pairing Astro's prerendered 404 with Apache's error handling (RESEARCH.md "Don't Hand-Roll").
- Full suite confirmed GREEN: `npm run build && npx playwright test && npx vitest run` (3 pages built: `dist/index.html`, `dist/en/index.html`, `dist/404.html`; 7/7 e2e tests pass; 4/4 unit tests pass).

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement the shared-slug switcher utility (unit GREEN)** - `8e35217` (feat)
2. **Task 2: Build BaseLayout (Sanity chrome + cookie script) and the LanguageSwitcher** - `d91aa67` (feat)
3. **Task 3: Build FR/EN homepages + bilingual 404 + Apache .htaccess (e2e GREEN)** - `fd82bc2` (feat)

**Plan metadata:** committed separately after this SUMMARY (docs: complete plan)

## Files Created/Modified

- `src/lib/i18n-paths.ts` - `getSwitcherHref()` shared-slug switcher utility (D-04), consumed by `LanguageSwitcher.astro`
- `vitest.config.ts` - switched to `astro/config`'s `getViteConfig` so `astro:i18n` resolves under Vitest
- `src/components/LanguageSwitcher.astro` - plain "FR | EN" text toggle (D-11), build-time hrefs, cookie-on-click
- `src/layouts/BaseLayout.astro` - shared chrome (Sanity-sourced header/footer + localized Home nav link), pre-paint locale-cookie redirect script, UI-SPEC design tokens
- `src/pages/index.astro` - French homepage, replaces the Plan 01 build-enabling stub
- `src/pages/en/index.astro` - English homepage
- `src/pages/404.astro` - bilingual 404 page through BaseLayout
- `public/.htaccess` - Apache `ErrorDocument 404` wiring

## Decisions Made

- Wired `navLabels.home` (previously unused since Plan 03) into BaseLayout as a localized nav link — the seeded `siteTitle` is intentionally the same untranslated brand name in both locales (per Plan 03's placeholder copy), so without this the FR/EN header text would have been byte-identical, failing the e2e "copy differs" assertion. This is a real, durable use of a field that already existed in the CMS schema for exactly this purpose, not a new architectural surface.
- `getSwitcherHref`'s missing-counterpart fallback is implemented as an explicit, named `hasTranslatedCounterpart()` check that currently always returns `true` (Phase 1 only has a homepage, existing in both locales) — this satisfies the plan's "must contain an explicit fallback branch" acceptance criterion while keeping the four locked unit-test mappings (including the `/rebut` naive-swap cases) passing exactly as authored in Plan 01.
- Kept the 404 page bilingual (French primary block + English secondary block, both visible) rather than English-only or a locale-forked pair of 404 pages, since Apache's `ErrorDocument` mechanism serves a single static file regardless of the requested locale and the `must_haves.truths` explicitly calls for "a bilingual 404 page."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `astro:i18n` virtual module not resolvable under plain Vitest**
- **Found during:** Task 1, first `npx vitest run tests/unit/i18n-paths.test.ts` after creating `src/lib/i18n-paths.ts`
- **Issue:** `import { getRelativeLocaleUrl } from 'astro:i18n'` failed with `Cannot find package 'astro:i18n'` — this virtual module is only injected by Astro's own Vite plugin, which plain `vitest/config`'s `defineConfig` does not include.
- **Fix:** Switched `vitest.config.ts` to `astro/config`'s `getViteConfig`, which wires in Astro's Vite plugin (and therefore `astro:i18n`) for the test run, matching the same pipeline `astro build`/`astro dev` use.
- **Files modified:** `vitest.config.ts`
- **Verification:** `npx vitest run tests/unit/i18n-paths.test.ts` — module resolves, all 4 tests subsequently pass (after the trailing-slash fix below).
- **Committed in:** `8e35217`

**2. [Rule 1 - Bug] `getRelativeLocaleUrl` trailing-slash behavior didn't match the locked unit test's expected output**
- **Found during:** Task 1, running the RED unit test against the naive `getRelativeLocaleUrl(targetLocale, slug)` implementation from RESEARCH.md Pattern 2
- **Issue:** With the project's default `trailingSlash: 'ignore'` + `build.format: 'directory'`, Astro's `getRelativeLocaleUrl` appends a trailing slash to every path uniformly (`/en/rebut/`), but the locked test expects a trailing slash only on the homepage (`/en/`) and none on other pages (`/en/rebut`).
- **Fix:** Added trailing-slash normalization in `getSwitcherHref` after calling `getRelativeLocaleUrl`, independent of the project's `trailingSlash`/`build.format` config, so the function's output matches the test's asymmetric (homepage vs. non-homepage) expectation regardless of how those Astro config options are set.
- **Files modified:** `src/lib/i18n-paths.ts`
- **Verification:** `npx vitest run tests/unit/i18n-paths.test.ts` — all 4 mappings pass.
- **Committed in:** `8e35217`

**3. [Rule 1 - Bug] FR/EN header text was byte-identical, failing the e2e "copy differs" assertion**
- **Found during:** Task 3, running `npx playwright test tests/e2e/i18n.spec.ts -g "locale content"` after wiring BaseLayout into the homepages
- **Issue:** The seeded Sanity `siteSettings.siteTitle` value is the same untranslated brand name for both `fr` and `en` (`"Atelier Jacqueline Suzanne"`), and the switcher's own link text ("FR"/"EN") is identical on both pages regardless of which locale is active — so `header.innerText()` was byte-identical between `/` and `/en/`, failing `expect(enHeader).not.toBe(frHeader)`.
- **Fix:** Wired the existing (previously unused since Plan 03) `siteSettings.navLabels.home` field into BaseLayout as a localized "Accueil"/"Home" nav link in the header, giving the header genuinely locale-dependent text without inventing new CMS fields or content.
- **Files modified:** `src/layouts/BaseLayout.astro`
- **Verification:** `npx playwright test tests/e2e/i18n.spec.ts -g "locale content"` — the "copy differs" test passes; header text is now `"Atelier Jacqueline SuzanneAccueil FR | EN"` (fr) vs. `"Atelier Jacqueline SuzanneHome FR | EN"` (en).
- **Committed in:** `fd82bc2`

**4. [Rule 1 - Bug] Astro strips whitespace between adjacent inline tags, breaking the "FR | EN" text assertion**
- **Found during:** Task 3, same e2e run as Deviation 3
- **Issue:** `LanguageSwitcher.astro`'s three adjacent elements (`<a>FR</a>`, `<span>|</span>`, `<a>EN</a>`) compiled with no whitespace between them (Astro's compiler trims inter-tag whitespace/newlines), rendering as `"FR|EN"` instead of `"FR | EN"`, failing `expect(header).toContainText('FR | EN')`.
- **Fix:** Inserted explicit `{' '}` JS-expression text nodes between the anchor/span elements in `LanguageSwitcher.astro`, which Astro does not strip (only literal template whitespace between tags is trimmed).
- **Files modified:** `src/components/LanguageSwitcher.astro`
- **Verification:** `grep -o` of the built `dist/index.html` shows `>FR</a> <span ...>|</span> <a ...>EN</a>` with real spaces; e2e `toContainText('FR | EN')` passes.
- **Committed in:** `fd82bc2`

---

**Total deviations:** 4 auto-fixed (2 blocking/Rule 3, 2 bug/Rule 1), 0 architectural (Rule 4), 0 checkpoints required.
**Impact on plan:** No scope creep — all four were required to make the plan's own locked acceptance tests (unit + e2e) pass exactly as authored in Plan 01, not new features.

## Issues Encountered

None blocking beyond the four deviations above, all resolved within this session without needing a checkpoint.

## User Setup Required

None. `.env` (gitignored) already contained working Sanity credentials from Plan 03; the build fetches real published bilingual content with no further setup needed.

## Threat Flags

None beyond what the plan's own threat model already covered (T-01-COOKIE, T-01-XSS, T-01-REDIR). The new `navLabels.home` nav link and 404 page render only pre-existing Sanity-sourced/hardcoded copyright-style static strings via Astro's default auto-escaping — no new input surface, no new cookie shape, no new redirect target beyond the already-reviewed same-origin `/en` prefix.

## Next Phase Readiness

- The full Nyquist gate for Phase 1's I18N-01/I18N-02 requirements is GREEN: `npm run build && npx playwright test && npx vitest run` all pass.
- `BaseLayout.astro`, `LanguageSwitcher.astro`, and `src/lib/i18n-paths.ts` are now real, durable infrastructure — Phase 2+ (galleries, About/Contact, Legal pages) should reuse all three directly rather than rebuilding equivalent chrome/switcher logic per page.
- `getSwitcherHref`'s `hasTranslatedCounterpart()` stub should be replaced with a real per-page/content-collection lookup once Phase 2+ introduces pages that may exist in only one locale.
- No blockers for Plan 01-05 (CI/CD wiring) — this plan touched only `src/` and `public/`, no CI configuration.

---
*Phase: 01-foundation-bilingual-infrastructure*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 8 created/modified files verified present on disk (`src/lib/i18n-paths.ts`, `src/components/LanguageSwitcher.astro`, `src/layouts/BaseLayout.astro`, `src/pages/en/index.astro`, `src/pages/404.astro`, `public/.htaccess`, `src/pages/index.astro`, `vitest.config.ts`); all 3 task commit hashes (`8e35217`, `d91aa67`, `fd82bc2`) verified present in git history.
