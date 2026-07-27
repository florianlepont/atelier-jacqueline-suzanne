---
phase: 01-foundation-bilingual-infrastructure
reviewed: 2026-07-06T13:29:08Z
depth: standard
files_reviewed: 32
files_reviewed_list:
  - .env.example
  - .github/workflows/deploy.yml
  - .gitignore
  - .nvmrc
  - astro.config.mjs
  - package.json
  - package-lock.json
  - playwright.config.ts
  - public/.htaccess
  - sanity/.gitignore
  - sanity/README.md
  - sanity/eslint.config.mjs
  - sanity/package.json
  - sanity/package-lock.json
  - sanity/sanity.cli.ts
  - sanity/sanity.config.ts
  - sanity/schemas/index.ts
  - sanity/schemas/siteSettings.ts
  - sanity/schemas/structure.ts
  - sanity/static/.gitkeep
  - sanity/tsconfig.json
  - src/components/LanguageSwitcher.astro
  - src/env.d.ts
  - src/layouts/BaseLayout.astro
  - src/lib/i18n-paths.ts
  - src/lib/sanity.ts
  - src/pages/404.astro
  - src/pages/en/index.astro
  - src/pages/index.astro
  - tests/e2e/i18n.spec.ts
  - tests/unit/i18n-paths.test.ts
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: fixed
fix_pass:
  fixed: [CR-01, WR-01, WR-02, WR-03, WR-04, WR-06]
  skipped: [WR-05, IN-01, IN-02, IN-03, IN-04]
  note: >
    IN-02 (Secure cookie attribute) was folded into the WR-02 commit as a
    freebie while touching that line, despite being listed as skipped scope —
    it's fixed in practice. WR-05 (README rewrite) and the remaining Info
    items (IN-01, IN-03, IN-04) were left deferred per Florian's explicit
    scope choice, not because they were hard to fix.
  verification: >
    Full Nyquist gate re-run after all fixes: npm run build (root base) +
    npx playwright test (7/7 pass) + npx vitest run (8/8 pass, 4 new tests
    added for WR-04/WR-06) all green. Additionally verified the base-prefixed
    build (ASTRO_BASE=/ajs-website/) directly: 404 page's links now
    correctly base-prefixed (confirming CR-01's fix), and the new CI grep
    guard (WR-04) finds zero bare href="/" or href="/en/" in that build.
---

# Phase 1: Code Review Report

**Reviewed:** 2026-07-06T13:29:08Z
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

Reviewed all Phase 1 (foundation-bilingual-infrastructure) source files: the Astro static-site scaffold, the built-in i18n routing config, the shared-slug language switcher (`i18n-paths.ts` / `LanguageSwitcher.astro`), `BaseLayout.astro`'s Sanity-sourced chrome + pre-paint locale-cookie redirect, the bilingual homepages and 404 page, the Sanity Studio schema/singleton, the build-time Sanity client, and the two-build GitHub Actions CI/deploy pipeline.

No hardcoded secrets, no `set:html`/`innerHTML`/`eval` usage, no debug artifacts (`console.log`/`TODO`/`FIXME`), no empty catch blocks, and no untrusted-registry dependencies were found. The CI's two-build design (root-base build for the test gate, `ASTRO_BASE=/ajs-website/` build for the deployed artifact) is coherent — the artifact actually published to GitHub Pages is unambiguously the second build's `dist/`, and `ASTRO_BASE` is correctly scoped to that one step only (not leaked into the test-gate build via `GITHUB_ENV` or similar).

However, the base-path bug fix applied mid-phase to `i18n-paths.ts` and `BaseLayout.astro`'s redirect script was **not applied consistently across the codebase** — `src/pages/404.astro` still hardcodes root-absolute `href="/"` and `href="/en/"` links, which are wrong under the GitHub Pages deploy base. This was verified live against the actual deployed staging site (see CR-01) and is a real, currently-shipping bug, not a hypothetical edge case. Several secondary robustness gaps were also found: the Sanity singleton's "enforcement" is a Studio-navigation-only convenience (not a real invariant), locale-cookie scoping is not base-path-aware (relevant on the shared `florianlepont.github.io` domain), and null-safety in `BaseLayout.astro` is inconsistent for partially-populated Sanity documents.

## Structural Findings (fallow)

No structural pre-pass was provided for this review (`<structural_findings>` block absent).

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: 404 page's "return home" links are hardcoded root-absolute, breaking under the GitHub Pages base path

**Outcome: FIXED** (commits `6c2d9cb`, `6992003`) — verified live-behavior-equivalent locally via an `ASTRO_BASE=/ajs-website/` build; both links now correctly emit `/ajs-website/` and `/ajs-website/en/`.

**File:** `src/pages/404.astro:14,19`
**Issue:** The bilingual 404 page hardcodes `href="/"` and `href="/en/"` for its "return home" links:
```astro
<p><a href="/">Retourner à l'accueil</a></p>
...
<p><a href="/en/">Return home</a></p>
```
Unlike `LanguageSwitcher.astro` (via `getSwitcherHref`) and `BaseLayout.astro`'s nav (`homeHref = getRelativeLocaleUrl(locale, '')`), these two links are plain literal strings — Astro does **not** rewrite hardcoded `href` string attributes based on the configured `base`; only `getRelativeLocaleUrl()`/`getAbsoluteLocaleUrl()`/asset helpers apply `base` automatically (confirmed by reading `astro/dist/virtual-modules/i18n.js`, which threads `base` into every URL helper but has no mechanism to touch raw markup strings).

This was mid-phase-fixed in `getSwitcherHref` and the locale-cookie redirect script (Plan 05) specifically because GitHub Pages serves this site under `/ajs-website/`, not root — but `404.astro` was never updated and still ships the old root-relative assumption.

**Verified live** against the actual deployed staging site:
```
$ curl -s https://florianlexpont.github.io/ajs-website/nonexistent-page-xyz | grep -o 'href="[^"]*"'
href="/ajs-website/"        <- nav Home link (getRelativeLocaleUrl, correct)
href="/ajs-website/404"     <- switcher fr link (see WR-06)
href="/ajs-website/en/404"  <- switcher en link (see WR-06)
href="/"                    <- BROKEN: goes to florianlepont.github.io/ root, not the site
href="/en/"                 <- BROKEN: goes to florianlepont.github.io/en/, doesn't exist
```
A visitor who lands on the 404 page (e.g., from a stale/mistyped link) and clicks "Retourner à l'accueil" or "Return home" is taken off the `/ajs-website/` project page entirely, to a URL under the bare `florianlepont.github.io` user domain that has nothing to do with this site. This is the exact class of bug the base-path fix in Plan 05 was meant to eliminate, but it was missed on this one page.

**Fix:** Use the same base-aware helper already used elsewhere in the codebase:
```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';
const frHome = getRelativeLocaleUrl('fr', '');
const enHome = getRelativeLocaleUrl('en', '');
---
...
<p><a href={frHome}>Retourner à l'accueil</a></p>
...
<p><a href={enHome}>Return home</a></p>
```

## Warnings

### WR-01: Sanity `siteSettings` singleton is only enforced at the Studio-navigation layer, not as a real invariant

**Outcome: FIXED** (commit `6992003`) — added `document.actions`/`newDocumentOptions` guard in `sanity/sanity.config.ts` per the suggested fix.

**File:** `sanity/schemas/structure.ts:9-18`
**Issue:** `structure.ts` pins `siteSettings` to a fixed document ID and removes it from the generic document-type list in the desk sidebar — but this only affects Studio's left-hand navigation. Sanity Studio's global "Create new document" / omnisearch command palette lists all registered schema types regardless of desk-structure filtering, and nothing in `sanity.config.ts` (no custom `document.actions`, no `document.badges`, no field/type-level guard) prevents an editor from creating a second `siteSettings` document with an auto-generated ID via that global affordance, or from using "Duplicate" on the existing one.
If a second document ever exists, `src/lib/sanity.ts`'s query (`*[_type == "siteSettings"][0]`) has no deterministic ordering guarantee and could silently start returning the "wrong" document — meaning edits Romane makes in the Studio (to what she believes is "the" settings document) might stop showing up on the live site, with no error or warning anywhere.
**Fix:** Add a real guard, e.g. via `document.actions` in `sanity.config.ts` to disable the "create"/"duplicate" action for `siteSettings` once one exists (a well-documented Sanity singleton pattern), or add a `_id` uniqueness check. Example:
```ts
// sanity.config.ts
document: {
  actions: (prev, context) =>
    context.schemaType === 'siteSettings'
      ? prev.filter((action) => !['duplicate'].includes(action.action ?? ''))
      : prev,
  newDocumentOptions: (prev, context) =>
    context.creationContext.type === 'global'
      ? prev.filter((template) => template.templateId !== 'siteSettings')
      : prev,
},
```

### WR-02: Locale-preference cookie is not base-path-scoped, leaking domain-wide on shared GitHub Pages user domain

**Outcome: FIXED** (commit `6992003`) — cookie path now derives from `import.meta.env.BASE_URL`; also added the `Secure` attribute (IN-02) while touching this line.

**File:** `src/components/LanguageSwitcher.astro:75`
**Issue:**
```js
document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
```
`path=/` is hardcoded regardless of the deployed `base`. On the eventual OVH production root this is correct, but on the current GitHub Pages staging target the site is actually served at `/ajs-website/` on the shared `florianlepont.github.io` user domain — `path=/` sets `ajs_locale` for the *entire* `florianlepont.github.io` domain, not scoped to this project. Any other project page Florian hosts under the same user domain (present or future) will also receive this cookie on every request, and — if that project happens to read/set a cookie with the same name — could interfere with this site's redirect logic (`BaseLayout.astro`'s pre-paint script reads `document.cookie` matching the same unscoped name).
**Fix:** Scope the cookie path to the deployed base, matching the base-awareness already applied to the redirect script:
```js
document.cookie = `${COOKIE_NAME}=${locale}; path=${basePath}; max-age=31536000; SameSite=Lax`;
```
(reusing the same `base`/`import.meta.env.BASE_URL`-derived path already computed in `BaseLayout.astro`'s inline script, passed down or duplicated into this component).

### WR-03: Inconsistent null-safety in `BaseLayout.astro` — a partially-populated Sanity document crashes the entire site build

**Outcome: FIXED** (commit `6992003`) — full optional chaining applied in `BaseLayout.astro`, `src/pages/index.astro`, and `src/pages/en/index.astro`.

**File:** `src/layouts/BaseLayout.astro:18-20`
**Issue:**
```js
const siteTitle = siteSettings?.siteTitle[locale] ?? 'Atelier Jacqueline Suzanne';
const footerText = siteSettings?.footerText[locale] ?? '';
const homeLabel = siteSettings?.navLabels.home[locale] ?? (locale === 'en' ? 'Home' : 'Accueil');
```
The optional chaining (`?.`) only guards against `siteSettings` itself being `null` (unpublished document). It does **not** guard against `siteSettings` being a truthy-but-partial object — e.g. if `navLabels` exists but `navLabels.home` doesn't, `siteSettings.navLabels.home[locale]` throws `Cannot read properties of undefined`. Sanity's schema-level `validation: rule.required()` only blocks *publish from the Studio UI*; it does not retroactively validate documents written via the API. Plan 03's own summary documents that this exact document was seeded via a temporary editor-role token calling `createOrReplace` directly (bypassing Studio's publish-time validation) — so the precedent for a script-written, potentially-incomplete document already exists in this project's history. Since this code runs in Astro frontmatter (build time), an unhandled exception here fails the **entire site build**, not just one page.
**Fix:** Use consistent optional chaining all the way down, with the same graceful fallbacks already established for the top-level null case:
```js
const siteTitle = siteSettings?.siteTitle?.[locale] ?? 'Atelier Jacqueline Suzanne';
const footerText = siteSettings?.footerText?.[locale] ?? '';
const homeLabel = siteSettings?.navLabels?.home?.[locale] ?? (locale === 'en' ? 'Home' : 'Accueil');
```
Same applies to `src/pages/index.astro:10-11` and `src/pages/en/index.astro:8-9` (`siteSettings?.welcomeHeading.fr` / `.en`) — one level of chaining is missing there too.

### WR-04: No automated test coverage for non-root base-path behavior — the exact gap that let CR-01 ship

**Outcome: FIXED** (commit `6992003`) — extracted `stripBasePath` as a directly unit-testable pure function (4 new Vitest cases), plus a CI-side grep guard in `deploy.yml` against any bare `href="/"`/`href="/en/"` in the base-prefixed build. Note the unit tests target the switcher's own logic; the CI grep guard is what actually would have caught CR-01, since that bug was a hardcoded link unrelated to `getSwitcherHref`.

**File:** `.github/workflows/deploy.yml:43-56`, `playwright.config.ts`, `vitest.config.ts`
**Issue:** The CI's two-build design deliberately runs the entire Playwright + Vitest suite only against the root-base (`ASTRO_BASE` unset) build, specifically to avoid coupling the "locked" test files to the deploy target's base path (per Plan 05's own stated rationale). This is a reasonable tradeoff for keeping the existing test contract stable, but it also means **no automated test anywhere in the suite exercises `ASTRO_BASE=/ajs-website/` behavior** — the actual shape that ships to the live staging URL. The base-path bugs that were fixed in `i18n-paths.ts`/`BaseLayout.astro` during Plan 05, and the one that was missed in `404.astro` (CR-01), were both found and would only be found via manual `curl`/browser verification, not CI. There is no regression protection against this class of bug recurring in future phases.
**Fix:** Add a lightweight unit test (or a second, narrowly-scoped Playwright project) that builds/tests specifically against a non-root `ASTRO_BASE`, e.g. a Vitest test that calls `getSwitcherHref` with a mocked non-root `import.meta.env.BASE_URL`, and/or a CI-only e2e smoke check (`curl`-based, not full Playwright) asserting that no rendered page contains a bare `href="/"` or `href="/en/"` when built with a non-root base.

### WR-05: `sanity/README.md` is unmodified Sanity CLI scaffold boilerplate

**Outcome: SKIPPED** — deferred per Florian's explicit scope choice (fix Critical + Warnings except this one); not a functional issue.

**File:** `sanity/README.md`
**Issue:** The file is the default `create sanity` template text ("Congratulations, you have now installed the Sanity Content Studio...") with no project-specific instructions (how to run the Studio for this project, where the token lives, singleton caveats from WR-01, etc.). Not a functional bug, but a missed opportunity for the "durable infrastructure" this phase is meant to establish for future maintainers (including Romane, indirectly, if she is ever handed Studio-admin documentation).
**Fix:** Replace with a short project-specific README covering: `npx sanity dev` from `sanity/`, the `siteSettings` singleton caveat (don't use "Create new document" for it — see WR-01), and where the Viewer token lives for local builds.

### WR-06: Language switcher on the 404 page produces confusing self-referential/dead links

**Outcome: FIXED** (commit `6992003`) — extended `hasTranslatedCounterpart` to treat the `404` slug as having no counterpart, so the switcher falls back to each locale's homepage via the fallback path that already existed.

**File:** `src/lib/i18n-paths.ts:13-45` (via `src/pages/404.astro` → `BaseLayout.astro` → `LanguageSwitcher.astro`)
**Issue:** `getSwitcherHref` treats every route as a "shared slug" page. On the 404 page, the current path's slug is literally `404`, so the switcher computes `/ajs-website/404` (fr) and `/ajs-website/en/404` (en) — neither of which is a real content page. Clicking the switcher on the 404 page therefore doesn't behave like a language switch at all; it either reloads the same 404 (fr, since the visited path already resolves there via Apache's/GitHub Pages' `ErrorDocument`/404 handling) or bounces to another nonexistent path that itself falls back to the same 404 page. Not a stranding bug (unlike CR-01, it doesn't leave the site), but it is a confusing dead end that undermines the switcher's purpose on the one page most likely to be seen by a lost visitor.
**Fix:** Special-case the 404 page: pass explicit locale-home hrefs into `LanguageSwitcher`/hide the switcher on this page, or extend `hasTranslatedCounterpart`'s stub (already flagged in the code as forward-looking) to recognize non-content routes and fall back to each locale's homepage instead of naively swapping the slug.

## Info

### IN-01: `@sanity/image-url` is an unused dependency

**Outcome: SKIPPED** — deferred; intentionally pre-installed for Phase 2, per the review's own no-action recommendation.

**File:** `package.json:16`
**Issue:** `@sanity/image-url@2.1.1` is declared as a dependency but is not imported anywhere in `src/` — Phase 1 has no image content yet (per RESEARCH.md, it was pre-installed "not strictly needed until Phase 2"). This is intentional per the plan, but as shipped in this phase's diff it is dead weight in the dependency tree and CI install time.
**Fix:** No action required now if Phase 2 is imminent and will consume it; otherwise, defer the install to the phase that actually uses it.

### IN-02: Locale cookie omits the `Secure` attribute

**Outcome: FIXED** (commit `6992003`) — folded into the WR-02 fix since it touched the same line.

**File:** `src/components/LanguageSwitcher.astro:75`
**Issue:** `document.cookie = 'ajs_locale=...; path=/; max-age=31536000; SameSite=Lax'` does not set `Secure`. Since the site is always served over HTTPS (GitHub Pages staging, and OVH production per D-08's Let's Encrypt requirement), adding `Secure` is a no-cost defense-in-depth improvement that prevents the cookie from ever being sent over a plaintext connection if one somehow existed.
**Fix:** `document.cookie = \`${COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax; Secure\`;`

### IN-03: Reserved unused CSS custom property

**Outcome: SKIPPED** — deferred; harmless, revisit when a later phase introduces destructive/error UI, per the review's own no-action recommendation.

**File:** `src/layouts/BaseLayout.astro:78`
**Issue:** `--color-destructive: #dc2626; /* reserved for later phases, unused this phase */` is dead code by the comment's own admission. Harmless, but worth tracking so it doesn't silently rot if the "later phase" plan changes.
**Fix:** No action required now; revisit when a later phase actually introduces destructive/error UI, or remove if the design token set changes before then.

### IN-04: No `engines` field in `package.json` to pair with `.nvmrc`

**Outcome: SKIPPED** — deferred per Florian's explicit scope choice; low-risk since CI already pins Node 22 explicitly.

**File:** `package.json`
**Issue:** `.nvmrc` pins Node 22, and Astro 7.0.6 requires `>=22.12.0`, but `package.json` has no `"engines"` field. A contributor running `npm install`/`npm run build` with an incompatible Node version outside of CI (which explicitly pins `node-version: '22'` in the workflow) gets no early, clear warning from npm itself.
**Fix:**
```json
"engines": {
  "node": ">=22.12.0"
}
```

---

_Reviewed: 2026-07-06T13:29:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
