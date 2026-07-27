# Phase 1: Foundation & Bilingual Infrastructure - Pattern Map

**Mapped:** 2026-07-05
**Files analyzed:** 16 (new; 0 modified — greenfield repo)
**Analogs found:** 0 / 16 (in-repo) — this project has **no existing application code** to mine for patterns.

## Greenfield Notice

This repository currently contains only `.planning/`, `.claude/`, and `CLAUDE.md` (verified via direct directory listing at mapping time: no `src/`, no `package.json`, no prior Astro/Sanity/CI files exist). There is **no in-repo analog** for any file listed below — Phase 1 is establishing the first patterns every later phase will copy from.

Because there is nothing to mine from the codebase, this PATTERNS.md instead does two things for the planner:
1. Classifies every file CONTEXT.md/RESEARCH.md implies needs to be created, by role and data flow.
2. Points to the **concrete code excerpts already vetted in RESEARCH.md** (`01-RESEARCH.md`'s "Code Examples" and "Architecture Patterns" sections) as the closest thing to an analog — these are the patterns to copy from when writing each file, since there is no prior sibling file in this repo to imitate instead.

Do not force a false in-repo match. Future phases (2+) should use the files built in this phase (e.g. `src/lib/i18n-paths.ts`, `BaseLayout.astro`, `siteSettings.ts`) as their real analogs once they exist.

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|-----------------|----------------|
| `astro.config.mjs` | config | request-response (build-time routing config) | none (greenfield) | no analog — use RESEARCH.md Pattern 1 |
| `src/layouts/BaseLayout.astro` | component | request-response | none | no analog — use RESEARCH.md Pattern 3 |
| `src/components/LanguageSwitcher.astro` | component | request-response | none | no analog — use RESEARCH.md Pattern 2 |
| `src/lib/i18n-paths.ts` | utility | transform | none | no analog — use RESEARCH.md Pattern 2 |
| `src/lib/sanity.ts` | service | CRUD (read-only fetch) | none | no analog — use RESEARCH.md `@sanity/client` guidance |
| `src/scripts/locale-cookie.ts` | utility | event-driven (client-side, browser load event) | none | no analog — use RESEARCH.md Pattern 3 |
| `src/pages/index.astro` | route | request-response | none | no analog — placeholder homepage, D-10 |
| `src/pages/en/index.astro` | route | request-response | none | no analog — placeholder homepage, D-10 |
| `src/pages/404.astro` | route | request-response | none | no analog — Don't-Hand-Roll table, Apache `.htaccess` pairing |
| `public/.htaccess` | config | request-response | none | no analog — Don't-Hand-Roll table |
| `sanity/schemas/siteSettings.ts` | model | CRUD | none | no analog — D-09 singleton schema |
| `.github/workflows/deploy.yml` | config | batch (CI pipeline) | none | no analog — RESEARCH.md Code Examples, FTP deploy workflow |
| `tests/e2e/i18n.spec.ts` | test | request-response (e2e assertions) | none | no analog — RESEARCH.md Validation Architecture |
| `tests/unit/i18n-paths.test.ts` | test | transform (unit) | none | no analog — RESEARCH.md Validation Architecture |
| `playwright.config.ts` | config | — | none | no analog |
| `vitest.config.ts` | config | — | none | no analog |

## Pattern Assignments

Since no in-repo analog exists, each assignment below cites the RESEARCH.md pattern/example to copy from directly (file path + line range within `01-RESEARCH.md`), rather than a sibling source file.

### `astro.config.mjs` (config, request-response)

**Source:** `01-RESEARCH.md`, Pattern 1 (lines 202-219)

```js
// astro.config.mjs
export default defineConfig({
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: false, // fr at "/", en at "/en/" — D-01
    },
  },
});
```
No adapter should be installed (RESEARCH.md Anti-Patterns, line 267): `output: 'static'` is the framework default, correct for OVH.

---

### `src/lib/i18n-paths.ts` (utility, transform)

**Source:** `01-RESEARCH.md`, Pattern 2 (lines 221-238)

```ts
import { getRelativeLocaleUrl } from 'astro:i18n';

export function getSwitcherHref(currentPath: string, targetLocale: 'fr' | 'en'): string {
  const slug = currentPath.replace(/^\/en\//, '/').replace(/^\//, '');
  return getRelativeLocaleUrl(targetLocale, slug);
}
```
**Fallback rule (RESEARCH.md line 238):** if a page has no counterpart in the target locale, fall back to that locale's homepage rather than 404ing — this matters starting Phase 2, not Phase 1 (only homepage exists this phase, so no missing-counterpart case yet — but write the fallback branch now since this file is durable infra per CONTEXT.md D-04).
**Unit test target:** `tests/unit/i18n-paths.test.ts` exercises this function directly (pure function, no DOM needed).

---

### `src/components/LanguageSwitcher.astro` (component, request-response)

**Source:** CONTEXT.md D-11 (plain "FR | EN" text toggle, no dropdown/flags) + `01-RESEARCH.md` Pattern 2/3 combined.

Core shape: two `<a>` tags whose `href` is computed via `getSwitcherHref(Astro.url.pathname, otherLocale)`, plus an inline `onclick`/script that sets the cookie (see below) before navigating. No framework/hydration — RESEARCH.md explicitly recommends deferring `@astrojs/react`/`@astrojs/preact` (Assumption A3, Standard Stack line 76).

---

### `src/scripts/locale-cookie.ts` / inline `<script is:inline>` in `BaseLayout.astro` (utility, event-driven)

**Source:** `01-RESEARCH.md`, Pattern 3 (lines 240-263)

```html
<script is:inline>
  (function () {
    var COOKIE_NAME = 'ajs_locale';
    var match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
    var preferred = match ? decodeURIComponent(match[1]) : null;
    var onFrenchRootPage = !location.pathname.startsWith('/en/');
    if (preferred === 'en' && onFrenchRootPage) {
      location.replace('/en' + location.pathname);
    }
  })();
</script>
```
```ts
// Switcher click handler sets the cookie on explicit choice (not on every nav)
document.cookie = 'ajs_locale=en; path=/; max-age=31536000; SameSite=Lax';
```
**Must be `is:inline`, not deferred** — needs to run before paint to avoid flash-of-wrong-locale (documented tradeoff, not a bug — RESEARCH.md line 263).
**Security note (ASVS V3, RESEARCH.md line 473):** `SameSite=Lax`, no sensitive/identifying data in the cookie value, 1-year `max-age` is the vetted choice — don't invent a different cookie shape.

---

### `src/lib/sanity.ts` (service, CRUD — read-only at build time)

**Source:** `01-RESEARCH.md` Standard Stack (`@sanity/client` 7.23.0, lines 67, 141) + Architectural Responsibility Map (line 55).

Pattern: instantiate a single `@sanity/client` client, export typed fetch helper(s) called only from `.astro` frontmatter / build-time code — never from browser-shipped JS. Consumed once in Phase 1 for the `siteSettings` singleton; this file becomes the shared analog for Phase 2's gallery/content fetches.

---

### `sanity/schemas/siteSettings.ts` (model, CRUD)

**Source:** CONTEXT.md D-09 (site-wide settings singleton: nav labels, footer text, site title, locale-aware) — no code example exists yet in RESEARCH.md/CONTEXT.md beyond the requirement; RESEARCH.md flags (Assumption A4, line 390) that Sanity's current v6.3.0 schema/CLI syntax should be verified live against Sanity's own docs at execution time rather than copied from a possibly-stale tutorial. **No analog, no vetted excerpt — planner/executor should pull the live Sanity v6 singleton-document pattern from Sanity's docs at implementation time.**

---

### `.github/workflows/deploy.yml` (config, batch/CI)

**Source:** `01-RESEARCH.md`, Code Examples section (lines 322-351)

```yaml
name: Deploy to OVH staging
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'          # Astro 7.0.6 requires >=22.12.0
      - run: npm ci
      - run: npm run build            # outputs to ./dist
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test      # e2e smoke: i18n routing + switcher
      - run: npx vitest run           # unit: slug-mapping utility
      - uses: SamKirkland/FTP-Deploy-Action@v4.4.0
        with:
          server: ${{ secrets.OVH_FTP_HOST }}
          username: ${{ secrets.OVH_FTP_USER }}
          password: ${{ secrets.OVH_FTP_PASSWORD }}
          protocol: ftps
          local-dir: ./dist/
          server-dir: ./                  # confirm actual doc root during D-06 investigation
```
Extend the `on:` trigger list with `repository_dispatch: types: [sanity-content-published]` per RESEARCH.md lines 362-369 once the Sanity webhook is wired.
**Test gate:** RESEARCH.md Open Question 3 recommends hard-gating — Playwright/Vitest run **before** the FTP deploy step in the same job, blocking deploy on failure (already reflected above).
**Do NOT use** `pitscher/ovh-deploy-hosting-action` or similar git-clone-based OVH actions (Anti-Pattern, line 268) — they publish source, not `dist/`.

---

### `sanity` webhook config (no file — configured in Sanity's dashboard UI)

**Source:** `01-RESEARCH.md` lines 353-361

```
POST https://api.github.com/repos/florianlepont/ajs-website/dispatches
Headers:
  Authorization: Bearer <fine-grained PAT, Actions:write + Contents:read scope only>
  Accept: application/vnd.github+json
Body:
  {"event_type": "sanity-content-published"}
```
**Security:** PAT must be fine-grained, scoped to this one repo only, `Actions:write` + `Contents:read` — never a classic all-repos PAT (ASVS V2/Elevation-of-Privilege note, RESEARCH.md line 482).

---

### `public/.htaccess` + `src/pages/404.astro` (config + route, request-response)

**Source:** `01-RESEARCH.md` Don't-Hand-Roll table (line 278)

Pattern: real `public/.htaccess` with `ErrorDocument 404 /404.html` pointing at Astro's prerendered `src/pages/404.astro` output — Apache does not auto-wire Astro's 404 page into its own error handling on static hosting; both pieces are required together.

---

### `tests/e2e/i18n.spec.ts` / `tests/unit/i18n-paths.test.ts` (test)

**Source:** `01-RESEARCH.md` Validation Architecture section (lines 431-462)

- e2e: Playwright against locally-served `dist/`, asserting FR at `/`, EN at `/en/`, switcher link target + cookie write/read, and cookie-triggered redirect on a fresh `/` visit with a pre-set cookie.
- unit: Vitest against `getSwitcherHref()` directly — no DOM/browser needed.
- `playwright.config.ts` should point `webServer` at `npx serve dist` (or equivalent static server) per Wave 0 Gaps (line 458).

## Shared Patterns

### i18n routing config
**Source:** `01-RESEARCH.md` Pattern 1
**Apply to:** `astro.config.mjs` only (single source of truth), consumed implicitly by every page and by `i18n-paths.ts`/`LanguageSwitcher.astro`.

### Shared-slug switcher utility
**Source:** `01-RESEARCH.md` Pattern 2 (`src/lib/i18n-paths.ts`)
**Apply to:** `LanguageSwitcher.astro` now; every future content-page pair (Phase 2 galleries, Phase 3 About/Contact, Phase 4 Legal) reuses this same utility — do not build a per-page ad hoc mapping.

### Client-side cookie + redirect
**Source:** `01-RESEARCH.md` Pattern 3
**Apply to:** `BaseLayout.astro` `<head>` (inline script) and the switcher's click handler. Flag for Phase 4: assess CNIL cookie-consent applicability (CONTEXT.md D-03 deferred note) — do not resolve in Phase 1.

### Build-time-only Sanity fetch
**Source:** Architectural Responsibility Map, `01-RESEARCH.md` line 55
**Apply to:** `src/lib/sanity.ts` and any `.astro` frontmatter that calls it — never fetch Sanity from browser-shipped JS in this architecture (no runtime compute tier exists on OVH to keep API tokens server-side otherwise).

### Node version pin in CI
**Source:** `01-RESEARCH.md` Pitfall 4 (line 302)
**Apply to:** `.github/workflows/deploy.yml` — `actions/setup-node@v4` with `node-version: '22'` explicitly (Astro 7.0.6 requires Node >=22.12.0).

### FTPS over plain FTP
**Source:** `01-RESEARCH.md` Known Threat Patterns, line 483
**Apply to:** `.github/workflows/deploy.yml` — `protocol: ftps`, never `protocol: ftp`.

## No Analog Found

Every file in this phase has no in-repo analog — the repository has no application code prior to this phase. Full list (all 16 files from File Classification table above) should be treated as "no analog" by the planner; use the RESEARCH.md excerpts embedded above instead of searching the codebase further.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `astro.config.mjs` | config | request-response | Greenfield repo, first Astro config file |
| `src/layouts/BaseLayout.astro` | component | request-response | Greenfield repo, first layout |
| `src/components/LanguageSwitcher.astro` | component | request-response | Greenfield repo, first component |
| `src/lib/i18n-paths.ts` | utility | transform | Greenfield repo, first utility |
| `src/lib/sanity.ts` | service | CRUD | Greenfield repo, first CMS client wiring |
| `src/scripts/locale-cookie.ts` | utility | event-driven | Greenfield repo, first client script |
| `src/pages/index.astro` | route | request-response | Greenfield repo, first page |
| `src/pages/en/index.astro` | route | request-response | Greenfield repo, first localized page |
| `src/pages/404.astro` | route | request-response | Greenfield repo, first error page |
| `public/.htaccess` | config | request-response | Greenfield repo, first Apache config |
| `sanity/schemas/siteSettings.ts` | model | CRUD | Greenfield repo, first CMS schema; also no code excerpt exists yet anywhere (see Assumption A4) — verify against live Sanity v6 docs |
| `.github/workflows/deploy.yml` | config | batch | Greenfield repo, first CI workflow |
| `tests/e2e/i18n.spec.ts` | test | request-response | Greenfield repo, first e2e test |
| `tests/unit/i18n-paths.test.ts` | test | transform | Greenfield repo, first unit test |
| `playwright.config.ts` | config | — | Greenfield repo, first test config |
| `vitest.config.ts` | config | — | Greenfield repo, first test config |

## Metadata

**Analog search scope:** Entire repository root (`.`, excluding `.git`, `.planning`, `.claude`) — confirmed via direct directory listing to contain only `.claude/`, `.git/`, `.planning/`, `CLAUDE.md`. No `src/`, `package.json`, or prior build artifacts exist.
**Files scanned:** 0 application source files (none exist); 2 planning documents read in full (`01-CONTEXT.md`, `01-RESEARCH.md`).
**Pattern extraction date:** 2026-07-05
