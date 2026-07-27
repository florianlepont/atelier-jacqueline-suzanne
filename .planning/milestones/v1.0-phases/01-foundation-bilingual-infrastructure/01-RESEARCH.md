# Phase 1: Foundation & Bilingual Infrastructure - Research

**Researched:** 2026-07-05
**Domain:** Astro static-site scaffolding, built-in i18n routing, Sanity CMS wiring, CI-driven deploy to OVH shared (mutualized) web hosting
**Confidence:** HIGH (Astro core config, package versions, OVH SSL/multisite mechanics, package legitimacy) / MEDIUM (OVH-to-CI deploy tooling specifics, Sanity webhook→GitHub relay pattern — community-verified, not official-first-party) / LOW (exact OVH plan tier Florian currently holds, and therefore which protocol — FTP vs SSH — is actually available; explicitly flagged as an open question per CONTEXT.md D-06)

## Summary

Phase 1 is a **pure static-site walking skeleton**: Astro (`output: 'static'`, the framework default — no adapter needed) built in GitHub Actions and synced to OVH mutualized Web Hosting, which has **zero request-time compute**. Every pitfall and pattern in this research flows from that one fact: OVH shared hosting is an Apache file server, not a Cloudflare Workers-style edge runtime, so anything CLAUDE.md/prior research assumed would run "at the edge" (Cloudflare adapter, Pages Functions, deploy hooks) must instead run either at **build time** (in the GitHub Actions runner) or **client-side in the browser** (vanilla JS, no framework needed for a two-state text toggle).

Astro's built-in `i18n` config (`locales`, `defaultLocale`, `routing.prefixDefaultLocale: false`) cleanly satisfies D-01/D-02 (French at root, English under `/en/`, no auto-redirect) and is a one-line, official, HIGH-confidence config. What Astro does **not** provide out of the box is D-04's "navigate to the equivalent page in the other locale" — this is a well-documented community pattern (shared-slug convention + `getRelativeLocaleUrl()` path-swap), not a built-in feature, and must be designed now as reusable infrastructure since every later content phase (galleries, about, legal pages) depends on it. D-03's "remember language via cookie" has no server to set/read the cookie on OVH static hosting, so it must be implemented as a small client-side script that reads a cookie and does a same-origin path redirect on load of a root-locale page — a real architectural decision with UX tradeoffs (brief flash-of-French-content) that the planner needs to know about explicitly.

The OVH deploy mechanics (D-05/D-06) are the least certain part of this research: OVH's shared hosting comes in tiers that differ in protocol access (Personal = FTP only; Professional/Performance = adds SSH), and Florian's actual current plan tier is unverified. This research documents both the FTP path (works on any tier, recommended default since it degrades gracefully) and the SSH/rsync path (faster, incremental, only if the Pro/Performance tier is confirmed) so the planner can sequence "confirm OVH plan tier" as the literal first task, per D-06.

**Primary recommendation:** Use Astro 7.0.6 static output (no adapter) + built-in `astro:i18n` config for routing + a hand-built shared-slug switcher utility for D-04 + a client-side cookie script for D-03 + `SamKirkland/FTP-Deploy-Action` (protocol-agnostic FTP/FTPS) as the default OVH deploy mechanism, upgradeable to SSH+rsync once the OVH plan tier is confirmed. Sanity's site-settings singleton is fetched at Astro build time via `@sanity/client`, and content changes trigger rebuilds via a Sanity webhook calling GitHub's `repository_dispatch` API directly (no intermediate server needed, since none exists).

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** French is the default locale served at the root path (no `/fr/` prefix); English is served under `/en/`. Matches CLAUDE.md's `prefixDefaultLocale: false` recommendation.
- **D-02:** Visiting `/` always serves French — no Accept-Language browser detection or auto-redirect.
- **D-03:** Once a visitor switches to English, remember that choice via a cookie so return visits stay in English. (Flag for Phase 4: is this cookie "essential/functional" and exempt from CNIL consent banner, or must it be disclosed?)
- **D-04:** The language switcher navigates to the equivalent page in the other locale (not always homepage) — each page needs to know its translated-URL counterpart.
- **D-05:** Deploy via GitHub Actions: build Astro static output, sync to OVH Web Hosting over FTP/SFTP on every push to `main`. No manual upload.
- **D-06:** UNVERIFIED — exact OVH protocol/plan details (FTP vs SFTP vs SSH, OVH-specific tooling). Confirming this is the **first task of Phase 1 execution**, before wiring CI.
- **D-07:** Deploys to a staging subdomain (e.g. `staging.atelierjacquelinesuzanne.fr`), not OVH's temp URL, not production. Requires a new DNS record.
- **D-08:** Staging subdomain needs HTTPS (OVH free Let's Encrypt for subdomains).
- **D-09:** First Sanity content type is a site-wide settings singleton (nav labels, footer text, site title) — locale-aware, real durable infrastructure, not throwaway.
- **D-10:** Bare placeholder homepage with locale-aware welcome text.
- **D-11:** Language switcher is a plain "FR | EN" text toggle in the header. No dropdown, no flags.

### Claude's Discretion

None — all discussed areas resulted in explicit user decisions above.

### Deferred Ideas (OUT OF SCOPE)

- Whether the locale-preference cookie is "essential" or needs CNIL cookie-consent disclosure — belongs to Phase 4 (Legal & Compliance), not resolved here.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| I18N-01 | All v1 visitor-facing content available in French and English | Astro built-in `i18n` config (`locales: ['fr','en']`, `defaultLocale: 'fr'`, `routing.prefixDefaultLocale: false`) — HIGH confidence, official docs. Phase 1 scope = homepage + nav/footer chrome only (real content pages arrive in later phases). |
| I18N-02 | Visitor can switch language via a persistent switcher | D-11's plain-text toggle + `getRelativeLocaleUrl()`-based path-swap utility (D-04) + client-side cookie (D-03), since OVH static hosting has no server to persist state. Community pattern, MEDIUM confidence, cross-verified across multiple sources. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Locale URL routing (`/`, `/en/`) | Build-time (Astro static generation) | — | Every locale variant is prerendered to its own HTML file at build time; there is no runtime router because OVH serves static files only. |
| Language switcher UI + href computation | Browser/Client (build-time-computed hrefs, no JS needed for the link itself) | — | The `href` for "the equivalent page in the other locale" is computed at build time by Astro; only the cookie-write-on-click needs a tiny client script. |
| Locale-preference cookie read + redirect | Browser/Client (vanilla JS) | — | No middleware/SSR exists on OVH static hosting to read cookies server-side; must be a client-side inline script on locale-root pages. |
| Site settings content (nav/footer copy, FR+EN) | CMS (Sanity Content Lake) → consumed at Build-time | — | Sanity is the source of truth; Astro's build step fetches via `@sanity/client` and bakes the copy into static HTML — no runtime CMS calls ever happen in the browser. |
| Static file hosting + TLS termination | OVH Web Hosting (Apache) + Let's Encrypt (platform-level) | — | Purely a passive file server; HTTPS is provisioned once via the OVH control panel, not an application concern. |
| CI build + deploy orchestration | GitHub Actions (CI compute tier) | — | This is the **only** compute tier in the entire architecture — it is where `npm run build`, image processing (Sharp, build-time only), and the FTP/SSH sync all happen. |
| Content-change → rebuild trigger | Sanity webhook → GitHub REST API (`repository_dispatch`) directly | — | No CDN/Pages "deploy hook" equivalent exists on OVH. Because there is no server to relay the webhook through, Sanity must call GitHub's API directly — a structural consequence of the zero-compute hosting choice. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | 7.0.6 | Static site generator | `output: 'static'` is the framework default — confirmed via official config reference: no adapter required when there are no server-rendered routes. Verified current on npm registry (published 2026-07-02), matches CLAUDE.md. [VERIFIED: npm registry] |
| `@sanity/client` | 7.23.0 | Fetch CMS content (site settings) at Astro build time | Official Sanity JS client; works identically in any JS runtime (Node build step here). [VERIFIED: npm registry] |
| `@sanity/image-url` | 2.1.1 | Build transformed image URLs from Sanity asset refs | Not strictly needed until Phase 2 (galleries have real images), but install now if the site-settings singleton includes a logo/image field. [VERIFIED: npm registry] |
| `sanity` | 6.3.0 | Sanity Studio CLI/framework, for the separate Studio project | **Version discrepancy from CLAUDE.md**: CLAUDE.md cites "sanity v4 CLI" but `npm view sanity version` returns **6.3.0** as latest on 2026-07-05. Treat CLAUDE.md's "v4" reference as stale/imprecise — 6.3.0 is the currently verified version. [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro:i18n` (built-in, no install) | Astro 7 core | Locale routing, `getRelativeLocaleUrl()`/`getAbsoluteLocaleUrl()` helpers | Configure once in `astro.config.mjs`; used by every locale-aware page and by the switcher utility. [CITED: docs.astro.build/en/guides/internationalization/] |
| `@astrojs/react` or `@astrojs/preact` | 6.0.1 | Islands for interactive UI | **NOT required for Phase 1.** D-11's "FR \| EN" text toggle is two `<a>` tags with build-time-computed hrefs plus a ~10-line vanilla `<script>` for the cookie. No framework/hydration needed until a genuinely stateful UI (e.g. shop cart) arrives in v1.x. Recommend deferring this install to avoid unnecessary JS shipped on every page. [ASSUMED — architectural judgment, not from an external source] |

### Testing (new for this phase)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | 1.61.1 | End-to-end smoke tests against the built static output | Officially listed by Astro's own testing guide as a supported e2e tool. [VERIFIED: npm registry, CITED: docs.astro.build/en/guides/testing/] |
| `vitest` | 4.1.9 | Unit test the locale/slug-mapping utility function | Fast, no-config-heavy unit runner; commonly paired with Astro/Vite projects. [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `SamKirkland/FTP-Deploy-Action` (FTP/FTPS) | `Burnett01/rsync-deployments` (rsync over SSH) | Rsync is faster and truly incremental (byte-level diff) but **requires SSH access**, which OVH only grants on Professional/Performance shared-hosting tiers (not Personal/Starter). Switch to this once D-06 confirms Florian's plan includes SSH. |
| `SamKirkland/FTP-Deploy-Action` | `pitscher/ovh-deploy-hosting-action` or GitHub Marketplace "Deploy to OVH hosting" | These OVH-specific actions `git clone` the **whole repository** into the hosting root and are designed for sites with no build step (e.g. plain PHP). They are the **wrong tool** for Astro, which needs `npm run build` to run first and only the `dist/` output deployed — using them would publish source files, `node_modules` references, and config, not a working site. |
| Hand-built shared-slug switcher | A Sanity document-internationalization plugin's built-in "translation" cross-references | Overkill for Phase 1 (only one Sanity content type, no galleries yet). Revisit in Phase 2 when real per-gallery translated content exists in Sanity and a formal translation-reference model may pay for itself. |
| Sanity webhook → `api.github.com/repos/:owner/:repo/dispatches` directly | `flayks/sanity-plugin-webhooks-trigger` (Studio plugin for managing webhook URLs from inside Sanity) | The plugin is a nicer authoring UX for the webhook config but adds a Studio dependency; the raw HTTP webhook (configured in Sanity's own dashboard, no plugin) is simpler and sufficient for one webhook. |

**Installation:**
```bash
npm create astro@latest -- --template minimal
npm install @sanity/client @sanity/image-url
npm install -D @playwright/test vitest
npm create sanity@latest   # separate Studio project
```

**Version verification:** Confirmed live via `npm view <pkg> version` on 2026-07-05 (see Package Legitimacy Audit). All versions match CLAUDE.md except `sanity` (CLAUDE.md said "v4 CLI"; registry shows 6.3.0 as current — flagged above).

## Package Legitimacy Audit

Ecosystem: npm (Node.js phase). `slopcheck` was installed and run with `--ecosystem npm` explicitly forced.

**Important process note:** Running `slopcheck install <pkgs>` *without* `--ecosystem npm` auto-detects PyPI by default in this environment (no `package.json` present in the working directory at scan time) and returned **false SLOP verdicts** for `@sanity/client` and `@sanity/image-url` ("does not exist on pypi") while beginning to `pip install` unrelated Python packages that happen to share the names `astro` and `sanity` on PyPI (a spacecraft-trajectory library and a Flask microservice-testing tool, respectively — a real, observed instance of the documented cross-ecosystem hallucination vector). That run was killed before completion and its side effects (an unrelated `pip install`) do not affect this project. Re-running with `--ecosystem npm` inside a scratch npm project produced correct results below.

| Package | Registry | Age | Downloads (last week) | Source Repo | slopcheck | Disposition |
|---------|----------|-----|------------------------|-------------|-----------|--------------|
| `astro` | npm | 5+ yrs (created 2021-03-13) | 3,545,868 | github.com/withastro/astro | [OK] | Approved |
| `@sanity/client` | npm | 9+ yrs (created 2016-09-21) | 1,564,223 | github.com/sanity-io/client | [OK] | Approved |
| `@sanity/image-url` | npm | 8+ yrs (created 2017-11-13) | 942,050 | github.com/sanity-io/image-url | [OK] | Approved |
| `sanity` | npm | 13+ yrs (created 2012-11-19, note: this is the npm name's registration date, not the Sanity CMS product's founding date) | 685,671 | github.com/sanity-io/sanity | [OK] | Approved |

No `postinstall` scripts found on any of the four packages (`npm view <pkg> scripts.postinstall` returned empty for all).

**Packages removed due to slopcheck [SLOP] verdict:** none (the earlier SLOP verdicts were a mis-scoped PyPI check on npm-only package names, not genuine hallucinations — corrected by re-running with `--ecosystem npm`).
**Packages flagged as suspicious [SUS]:** none.

*GitHub Actions (`SamKirkland/FTP-Deploy-Action`, `Burnett01/rsync-deployments`) are not npm/pip/cargo packages and fall outside the slopcheck registry gate — vetted instead via GitHub star/fork/usage-count signals: FTP-Deploy-Action is a long-standing, actively maintained Marketplace action; Burnett01/rsync-deployments is documented as "used by 5k+ workflows." Both [CITED] from their own READMEs/Marketplace listings, MEDIUM confidence.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────┐        ┌──────────────────────────────────────┐
│  Sanity Studio   │        │           GitHub Repository          │
│ (Romane/Florian  │        │        florianlepont/ajs-website     │
│  edit content)   │        └──────────────────────────────────────┘
└────────┬─────────┘                    │  push to main
         │ publish                      ▼
         │ (GROQ webhook)     ┌──────────────────────────────────┐
         │                    │        GitHub Actions CI          │
         ▼                    │  1. checkout                      │
┌──────────────────┐          │  2. setup-node@22                 │
│ Sanity Content    │◄────────┤  3. npm ci                        │
│ Lake (API)        │  fetch  │  4. fetch Sanity content           │
└──────────────────┘  at      │     (@sanity/client, build-time)  │
                       build  │  5. npm run build → dist/          │
                       time   │     (Astro static output,          │
         ┌─────────────────  │      all locales prerendered,      │
         │                    │      Sharp runs here, build-time)  │
         │ POST                │  6. run Playwright + Vitest        │
         │ repository_dispatch │  7. FTP-Deploy-Action → OVH        │
         ▼                    └──────────────┬─────────────────────┘
┌──────────────────┐                         │ FTP/FTPS (or SSH+rsync,
│ api.github.com    │                         │ pending D-06 confirmation)
│ /repos/.../       │                         ▼
│ dispatches         │          ┌───────────────────────────────────┐
└──────────────────┘            │   OVH Web Hosting (Apache, static) │
   (triggers the CI              │   staging.atelierjacquelinesuzanne │
    run above on content          │   .fr — Let's Encrypt HTTPS       │
    publish, closing the loop)   └────────────┬──────────────────────┘
                                              │ HTTPS GET
                                              ▼
                                     ┌──────────────────┐
                                     │  Site visitor      │
                                     │  browser            │
                                     │  (client-side       │
                                     │   cookie + switcher  │
                                     │   redirect logic)    │
                                     └──────────────────┘
```

### Recommended Project Structure

```
/
├── astro.config.mjs         # i18n config: locales, defaultLocale, prefixDefaultLocale
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro # shared <head>, header/footer, imports switcher + cookie script
│   ├── components/
│   │   └── LanguageSwitcher.astro  # D-11 "FR | EN" toggle, uses locale-path util
│   ├── lib/
│   │   ├── sanity.ts         # @sanity/client instance + typed fetch helpers
│   │   └── i18n-paths.ts     # shared-slug → getRelativeLocaleUrl() mapping utility (D-04)
│   ├── pages/
│   │   ├── index.astro       # French homepage (root, D-10 placeholder content)
│   │   └── en/
│   │       └── index.astro   # English homepage
│   └── scripts/
│       └── locale-cookie.ts  # client-side cookie read + redirect (D-03), inlined in BaseLayout head
├── sanity/                   # separate Sanity Studio project (own package.json)
│   └── schemas/
│       └── siteSettings.ts   # D-09 singleton schema
├── tests/
│   ├── e2e/
│   │   └── i18n.spec.ts      # Playwright: FR at "/", EN at "/en/", switcher nav, cookie
│   └── unit/
│       └── i18n-paths.test.ts # Vitest: slug-mapping utility
├── public/
│   └── .htaccess             # custom 404 (ErrorDocument), optional DirectorySlash tuning
└── .github/
    └── workflows/
        └── deploy.yml         # build + test + FTP-Deploy-Action to OVH staging subdomain
```

### Pattern 1: Astro built-in i18n routing config

**What:** Configure `defaultLocale`/`locales`/`prefixDefaultLocale` once; Astro handles URL generation for prerendered pages.
**When to use:** Always, for every locale-aware route.
**Example:**
```js
// astro.config.mjs
// Source: https://docs.astro.build/en/guides/internationalization/ (official docs)
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

### Pattern 2: Shared-slug switcher (not a lookup table)

**What:** Instead of maintaining a manual mapping table between French and English page paths, use the **same slug** for a page's FR and EN variants (e.g. `src/pages/rebut.astro` and `src/pages/en/rebut.astro` — or later, the same Sanity document's `slug.current` field reused for both locale renders). The switcher then just swaps the locale segment of the current pathname using `getRelativeLocaleUrl()`.
**When to use:** For every content type built in this and later phases (galleries in Phase 2, About/Contact in Phase 3, Legal pages in Phase 4) — this is the reusable infrastructure D-04 asks for.
**Example:**
```ts
// src/lib/i18n-paths.ts
// Pattern verified across multiple community sources (MEDIUM confidence — not an official Astro API,
// but the documented idiom for "equivalent page in other locale" switchers)
import { getRelativeLocaleUrl } from 'astro:i18n';

export function getSwitcherHref(currentPath: string, targetLocale: 'fr' | 'en'): string {
  // Strip the current locale prefix, if any, to recover the shared slug
  const slug = currentPath.replace(/^\/en\//, '/').replace(/^\//, '');
  return getRelativeLocaleUrl(targetLocale, slug);
}
```
**Fallback for missing translations:** If a page genuinely has no counterpart yet (unlikely in Phase 1's minimal scope, but relevant from Phase 2 on), fall back to that locale's homepage rather than a 404, per the documented Astro i18n fallback-content idiom — flag this explicitly rather than silently 404ing.

### Pattern 3: Client-side locale-preference cookie (D-03)

**What:** Because OVH static hosting has no server/middleware to read cookies, persist and act on the locale preference entirely in the browser.
**When to use:** Only path affected: root-locale pages, on load, and the switcher's click handler.
**Example:**
```html
<!-- Inlined (not deferred) in <head> of BaseLayout.astro, so it runs before paint -->
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
**Known tradeoff:** A same-origin, render-blocking inline redirect script avoids a full flash-of-wrong-locale-content in most cases, but is not instantaneous — document this as an accepted MVP tradeoff, not a bug to "fix" later without a product decision.

### Anti-Patterns to Avoid

- **Relying on `@astrojs/cloudflare` or any SSR adapter:** CLAUDE.md's stack recommendation assumed Cloudflare Pages; under OVH mutualized hosting there is no adapter to install at all — `output: 'static'` (the default) with **zero** adapter is correct. Installing `@astrojs/cloudflare` here would be actively wrong (it targets a runtime that doesn't exist in this deployment).
- **Using `pitscher/ovh-deploy-hosting-action` or similar git-clone-based OVH actions for a build-step site:** These deploy the raw repository, not a compiled `dist/` folder — wrong tool once a build step exists.
- **Accept-Language-based auto-redirect on first visit:** Explicitly excluded by D-02 — do not add this "for SEO" or "for UX" without revisiting the locked decision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| FTP/SFTP sync to OVH | A custom `curl`/`lftp` script in the workflow | `SamKirkland/FTP-Deploy-Action` | Handles incremental sync via a remote state-tracking file, retries, and dry-run mode — a hand-rolled script would re-implement this poorly and risk full-wipe mistakes. |
| Sanity → GitHub rebuild trigger | A custom webhook-receiving server/serverless function | Sanity webhook configured to POST directly to `https://api.github.com/repos/:owner/:repo/dispatches` with a fine-grained PAT in the `Authorization` header | There is no server available on OVH to receive a webhook — going server-less end-to-end (CMS calls GitHub's API directly) is not a workaround, it's the correct architecture given the hosting constraint. |
| Locale-aware Sanity image URLs | Manual string concatenation of Sanity CDN URLs | `@sanity/image-url` | Handles crop/hotspot metadata, format params, and CDN domain correctly; will matter more once Phase 2 galleries exist but wire up the client now alongside `@sanity/client`. |
| Custom 404 page on Apache | A JS-based client-side "not found" page shown for any path | A real `public/.htaccess` with `ErrorDocument 404 /404.html` plus a static prerendered `404.astro` | Apache serves its own generic 404 unless told otherwise; Astro's `src/pages/404.astro` alone does not wire itself into Apache's error handling on static hosting. |

**Key insight:** Every "don't hand-roll" here traces back to the same root cause as the Architecture Responsibility Map: OVH's hosting model removes an entire compute tier (Pages Functions/edge middleware) that the original CLAUDE.md-era research assumed existed. The correct instinct is not "replicate that tier with custom code" but "move each responsibility to the tier that can actually own it" (build-time, CI, or browser).

## Common Pitfalls

### Pitfall 1: Astro's i18n does not give you a "switch to equivalent page" feature for free
**What goes wrong:** Teams configure `astro:i18n` routing, see `getRelativeLocaleUrl()` in the docs, and assume it automatically finds "the French version of the page I'm currently on." It only builds a URL for a *locale + path string you supply* — it doesn't know what the equivalent path is.
**Why it happens:** The helper's name and docs example make it look more automatic than it is.
**How to avoid:** Build the shared-slug convention + small utility (Pattern 2 above) explicitly, now, as reusable infra — not per-page ad hoc logic.
**Warning signs:** Switcher links hardcoded to `/` or `/en/` regardless of current page (violates D-04 explicitly).

### Pitfall 2: OVH deploy tooling mismatch — repo-clone actions vs. build-then-upload actions
**What goes wrong:** The top GitHub Marketplace/search results for "deploy to OVH hosting" (`pitscher/ovh-deploy-hosting-action`, the Marketplace "Deploy to OVH hosting" action) `git clone` the entire repository into the hosting root — fine for a plain PHP site with no build step, wrong for Astro (would publish source instead of `dist/`, and requires OVH SSH which may not be on Florian's plan).
**Why it happens:** Most OVH-specific tooling in the wild targets classic PHP/WordPress hosting, the dominant OVH shared-hosting use case.
**How to avoid:** Use a generic, protocol-flexible action (`SamKirkland/FTP-Deploy-Action`) with `local-dir: ./dist/` explicitly set, run *after* the `npm run build` step.
**Warning signs:** Deployed site shows `astro.config.mjs`, `package.json`, or `node_modules` references publicly — sign the wrong action deployed source instead of build output.

### Pitfall 3: OVH plan tier gates which protocol is even available
**What goes wrong:** Planning assumes SSH/rsync (fast, incremental) is available, but Florian's actual OVH Web Hosting plan may be the Personal/Starter tier, which per OVH's current plan matrix only includes **unlimited FTP**, not SSH — SSH access requires the Professional or Performance tier.
**Why it happens:** "OVH Web Hosting" is treated as one product in casual conversation, but it's actually multiple tiers with materially different capabilities.
**How to avoid:** D-06 already flags this — treat "confirm OVH plan tier + available protocol" as a literal, first, blocking task before writing the CI workflow. Design the workflow to work with FTP/FTPS as the safe default; upgrade to SSH+rsync only after confirming access.
**Warning signs:** CI workflow references an SSH key secret that was never actually provisioned because no one checked the plan tier first.

### Pitfall 4: Node.js version mismatch in GitHub Actions
**What goes wrong:** Astro 7.0.6 requires **Node >=22.12.0** (confirmed via `npm view astro@7.0.6 engines`). GitHub Actions' `actions/setup-node` does not default to this version automatically — an unpinned or outdated `node-version` in the workflow will fail the build or silently use an incompatible Node version.
**Why it happens:** Astro's Node version requirement has moved up across major versions; workflows copy-pasted from older Astro tutorials often pin Node 18 or 20.
**How to avoid:** Explicitly set `actions/setup-node@v4` with `node-version: '22'` (or `.nvmrc`-driven) in the deploy workflow.
**Warning signs:** CI fails at `npm ci`/`npm run build` with an engines warning or an obscure syntax error from a newer JS feature Astro's toolchain uses.

### Pitfall 5: Subdomain HTTPS provisioning is not instantaneous
**What goes wrong:** Sequencing the first deploy assuming HTTPS is available the moment the multisite/subdomain entry is created.
**Why it happens:** OVH's own documentation notes Let's Encrypt certificate setup "may take several hours" after activation — it is automatic and free, but not instant.
**How to avoid:** Sequence Phase 1 execution as: (1) create DNS record for the subdomain, (2) create the OVH multisite entry pointing it at a folder, (3) enable Let's Encrypt, (4) **wait** for cert issuance before treating "staging is live over HTTPS" as done, (5) then point the first CI deploy at it.
**Warning signs:** First deploy "looks broken" over HTTPS (cert warnings) when actually the cert simply hasn't finished provisioning yet — don't debug the deploy pipeline for what is actually a provisioning-time issue.

### Pitfall 6: Cross-ecosystem package-name confusion during verification tooling itself
**What goes wrong:** Running `slopcheck` (or any hallucination-checker) without explicitly specifying the ecosystem can silently check the wrong registry (PyPI instead of npm) and produce false positives/negatives — observed directly during this research session (see Package Legitimacy Audit).
**Why it happens:** Auto-detection heuristics rely on project files (e.g., `package.json`) being present in the current working directory; if absent, tools may default to a different ecosystem.
**How to avoid:** Always pass `--ecosystem npm` (or the appropriate ecosystem flag) explicitly for this project's Node.js-only dependency surface, rather than trusting auto-detection.
**Warning signs:** A verification tool reports a well-known, obviously-real package (e.g. `astro`) as nonexistent — that's a signal the tool checked the wrong registry, not that the package is fake.

## Code Examples

### GitHub Actions deploy workflow (FTP path, default recommendation)
```yaml
# .github/workflows/deploy.yml
# Source: pattern synthesized from SamKirkland/FTP-Deploy-Action README (MEDIUM confidence, community-verified)
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
          protocol: ftps                  # prefer encrypted FTPS over plain FTP
          local-dir: ./dist/
          server-dir: ./                  # confirm actual doc root during D-06 investigation
```

### Sanity webhook → GitHub `repository_dispatch` (configured in Sanity's dashboard, no code)
```
POST https://api.github.com/repos/florianlepont/ajs-website/dispatches
Headers:
  Authorization: Bearer <fine-grained PAT, Actions:write + Contents:read scope only>
  Accept: application/vnd.github+json
Body:
  {"event_type": "sanity-content-published"}
```
```yaml
# add to deploy.yml trigger list
on:
  push:
    branches: [main]
  repository_dispatch:
    types: [sanity-content-published]
```
Source: pattern cross-verified across multiple community write-ups on triggering GitHub Actions from Sanity webhooks. [CITED, MEDIUM confidence — not an official Sanity or GitHub first-party integration guide, but the mechanism (`repository_dispatch`) is official GitHub Actions API behavior.]

## State of the Art

| Old Approach (CLAUDE.md / prior STACK.md research) | Current Approach (this phase, per CONTEXT.md D-05..D-08) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloudflare Pages hosting + Pages Functions for dynamic logic | OVH mutualized Web Hosting, zero runtime compute | CONTEXT.md D-05 (2026-07-05), overriding CLAUDE.md | No API routes/webhooks receivers possible on the host itself; all "dynamic" behavior moves to build-time or client-side JS. Future v1.x checkout/webhook logic will need a **different** hosting/compute solution — already flagged in PROJECT.md as a re-evaluation item, not resolved here. |
| Cloudflare Pages "Deploy Hooks" (built-in feature) for CMS-triggered rebuilds | Sanity webhook → GitHub REST API `repository_dispatch` directly | Same override | One more moving part (a GitHub PAT to manage/rotate) but no added infrastructure — GitHub Actions was already required for the FTP deploy step. |
| `@astrojs/cloudflare` adapter + Sharp `compile`/`passthrough` runtime-image-service split | No adapter at all; Sharp only ever runs at build time (there is no runtime to split) | Same override | The entire Sharp/Cloudflare-adapter incompatibility pitfall from prior PITFALLS.md research **does not apply** under OVH — it was Cloudflare-Workers-specific. Verified by confirming `output: 'static'` needs zero adapter (official Astro docs). |

**Deprecated/outdated for this project specifically (not deprecated in general):**
- Any planning artifact instruction to install `@astrojs/cloudflare` or `wrangler` — these belong to the superseded Cloudflare-hosting plan and must not be installed for this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Florian's current OVH Web Hosting plan tier and its available protocol (FTP-only vs. FTP+SSH) | Standard Stack / Pitfall 3 | If the plan is Personal-tier (FTP only), the SSH/rsync alternative is not available and must not be attempted; if it's Pro/Performance, FTP-only is a missed opportunity for faster incremental sync. Either way, D-06 already schedules this as the first execution task — this research does not resolve it, only prepares both paths. |
| A2 | The domain's DNS zone (for adding the `staging.` subdomain record) is managed at OVH itself, not an external registrar/DNS provider | Architecture Patterns / Pitfall 5 | If DNS is external, OVH's automatic "ovhcontrol" TXT-record verification flow for multisite domain validation does not apply the same way, and the subdomain record must be created manually with the external DNS provider before OVH's multisite feature will recognize it — adds a manual step not currently planned for. |
| A3 | No framework/island library (`@astrojs/react` etc.) is needed for Phase 1's plain-text switcher | Standard Stack (Supporting) | Low risk — if the planner or a later UI decision wants richer switcher interactivity, adding React/Preact later is a small, additive change, not a rework. |
| A4 | `sanity` npm package's current major version (6.3.0) is compatible with the schema/CLI patterns referenced from older tutorials (some of which reference "Sanity v3/v4") | Standard Stack | If Sanity Studio's config API has changed meaningfully since v4, the singleton-document schema pattern (D-09) may need adjusted syntax — recommend the planner verify against Sanity's own current docs/Context7 at execution time rather than trusting a possibly-stale community tutorial. |

## Open Questions (RESOLVED)

1. **Which OVH Web Hosting plan tier is currently active, and does it include SSH access?**  _RESOLVED: operationalized as 01-02 Task 1 (OVH panel investigation & deploy protocol)._
   - What we know: OVH's current tiers are roughly Personal (FTP only), Professional (adds SSH), Performance (SSH + more resources). Pricing bands observed: ~€1-4/mo (Starter/Personal) up to ~€13/mo (Performance).
   - What's unclear: Which one Florian already has (a sunk cost per PROJECT.md, not a new spend decision).
   - Recommendation: D-06 already schedules this as the first Phase 1 execution task — log into the OVH control panel and check the hosting plan name/features before writing the CI workflow. Default the plan to the FTP-based `FTP-Deploy-Action` path since it works regardless of the answer.

2. **Does the existing `atelierjacquelinesuzanne.fr` DNS zone live at OVH (as registrar+DNS) or elsewhere?**  _RESOLVED: operationalized as 01-02 Task 2 (staging subdomain / DNS zone setup)._
   - What we know: The domain is already live with the current Myportfolio site; PROJECT.md doesn't specify the registrar.
   - What's unclear: Whether adding the `staging.` subdomain is a same-provider DNS-zone edit (simpler, OVH-native multisite flow) or requires manual coordination with an external DNS host.
   - Recommendation: Check this alongside the D-06 OVH-panel investigation, before attempting to create the staging subdomain.

3. **Should CI test failures block deploy, or only warn?**  _RESOLVED: implemented by 01-05 Task 1 (hard-gate tests before FTP deploy)._
   - What we know: `nyquist_validation` is enabled in config.json; Playwright/Vitest are recommended as Wave-0 additions.
   - What's unclear: Whether the walking-skeleton MVP mode wants a hard gate (test failure blocks FTP deploy) from day one, or a softer warn-only approach until the test suite matures.
   - Recommendation: Hard-gate from the start (`npx playwright test` and `npx vitest run` as required steps before the deploy step in the same job) — cheap to do now, much harder to retrofit as a discipline later, and matches the "Wave 0 test infra" spirit of nyquist validation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build (local + CI) | ✓ | v22.22.3 (local); pin `node-version: '22'` in CI | — |
| npm | package install/build | ✓ | 10.9.8 | — |
| git | version control | ✓ | 2.50.1 | — |
| GitHub repository (`florianlepont/ajs-website`) with `origin` remote | D-05 CI/CD | ✓ | — (already exists, 2 local commits ahead of `origin/main`) | — |
| `gh` CLI | Convenience for repo/secrets ops (optional) | ✓ | 2.92.0 | Use GitHub web UI to add repo secrets if CLI auth isn't set up |
| OVH FTP/SFTP/SSH credentials | D-05/D-06 deploy target | ✗ (not yet confirmed/provisioned in this session) | — | None — this is a genuine blocking prerequisite; D-06 already schedules its investigation as the first Phase 1 execution task |
| OVH subdomain + DNS record for `staging.atelierjacquelinesuzanne.fr` | D-07 | ✗ (not yet created) | — | None — must be created before first deploy can be verified publicly |
| Sanity project (dataset + API token) | D-09 CMS wiring | ✗ (not yet created) | — | None — `sanity init`/project creation is itself part of Phase 1 execution; free tier, no cost blocker |
| `slopcheck` (package legitimacy tool) | Research-time verification only | ✓ (installed this session, v0.6.1) | — | `npm view <pkg>` alone as a weaker fallback if slopcheck unavailable in a future session |

**Missing dependencies with no fallback:**
- OVH FTP/SFTP/SSH credentials and confirmed plan tier (D-06) — genuinely blocks the CI deploy step until investigated.
- OVH staging subdomain + DNS record (D-07) — blocks having a public URL to verify Phase 1's success criteria against.
- Sanity project/dataset (D-09) — blocks the CMS-read/write half of the walking skeleton.

**Missing dependencies with fallback:**
- None beyond the above — everything else needed (Node, npm, git, GitHub repo) is already present and working in this environment.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright `@playwright/test` 1.61.1 (e2e) + Vitest 4.1.9 (unit) |
| Config file | none yet — Wave 0 (`playwright.config.ts`, `vitest.config.ts`) |
| Quick run command | `npx vitest run tests/unit/i18n-paths.test.ts` (unit, sub-second) |
| Full suite command | `npm run build && npx playwright test && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| I18N-01 | French content served at `/`, English at `/en/`, both render the Sanity-sourced nav/footer copy in the correct language | e2e (Playwright, against built `dist/` served locally) | `npx playwright test tests/e2e/i18n.spec.ts -g "locale content"` | ❌ Wave 0 |
| I18N-02 | Switcher navigates from any page to its equivalent page in the other locale; cookie persists the choice across a fresh visit to `/` | e2e (Playwright: click switcher, assert URL + assert `document.cookie`; separately, pre-set the cookie via browser context and assert `/` redirects to `/en/`) | `npx playwright test tests/e2e/i18n.spec.ts -g "switcher"` | ❌ Wave 0 |
| (infra, not a numbered requirement) Shared-slug path-mapping utility correctness | unit | `npx vitest run tests/unit/i18n-paths.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run` (fast unit check on the slug-mapping utility as it's built)
- **Per wave merge / before deploy:** full suite (`npm run build && npx playwright test && npx vitest run`) — recommended as a **required, blocking** CI step before the FTP deploy step (see Open Question 3).
- **Phase gate:** Full suite green, plus a manual visit to the live staging URL, before `/gsd:verify-work`.

### Wave 0 Gaps

- [ ] `playwright.config.ts` — point `webServer` at a static file server (`npx serve dist` or similar) serving the built output
- [ ] `vitest.config.ts` — minimal config, no framework-specific plugin needed for a plain TS utility
- [ ] `tests/e2e/i18n.spec.ts` — covers I18N-01, I18N-02
- [ ] `tests/unit/i18n-paths.test.ts` — covers the shared-slug utility
- [ ] Framework install: `npm install -D @playwright/test vitest && npx playwright install --with-deps chromium`

## Security Domain

`security_enforcement` is enabled (ASVS Level 1, block on High) per config.json.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|--------------------|
| V2 Authentication | No (Phase 1 has no visitor-facing auth; Sanity Studio auth is Sanity's own hosted login, out of this project's code surface) | — |
| V3 Session Management | Marginal — the locale-preference cookie is not a session/auth cookie, just a UX preference | Use `SameSite=Lax`, no sensitive data in the cookie value, reasonable `max-age` (documented above: 1 year) |
| V4 Access Control | No (no protected routes in Phase 1) | — |
| V5 Input Validation | Marginal — the only "input" this phase handles is Sanity webhook payloads triggering `repository_dispatch` | Restrict the GitHub PAT used in the Sanity webhook to the minimum scopes (`Actions: write`, `Contents: read` only, fine-grained, repo-scoped, not a classic all-repos PAT) |
| V6 Cryptography | No custom crypto — TLS is OVH/Let's Encrypt-managed, GitHub API auth uses a PAT over HTTPS | Never hand-roll signature verification; there is none needed here since Sanity calls GitHub's API directly rather than this project running its own webhook receiver |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Overly broad GitHub PAT leaked via a compromised Sanity account | Elevation of Privilege | Fine-grained PAT scoped only to this one repo, only `Actions:write`+`Contents:read`, stored only in Sanity's webhook secret config (not in the repo) |
| FTP credentials transmitted in plaintext (if `protocol: ftp` used instead of `ftps`) | Information Disclosure | Use `protocol: ftps` (explicit, encrypted) in `FTP-Deploy-Action`, not plain `ftp`, once confirmed the OVH host supports it (most modern OVH hosting does) |
| Locale cookie used as an unintended tracking/fingerprinting vector | Information Disclosure (privacy) | Cookie stores only `fr`/`en`, no visitor identifier; still flagged to Phase 4 for CNIL disclosure assessment per D-03 |

## Sources

### Primary (HIGH confidence)
- `npm view <pkg> version / time.created / repository.url / scripts.postinstall` (live registry queries, 2026-07-05) for `astro`, `@sanity/client`, `@sanity/image-url`, `sanity` — confirmed versions, ages, repos, no postinstall scripts.
- `npm view astro@7.0.6 engines` — confirmed `node: '>=22.12.0'` requirement.
- https://docs.astro.build/en/reference/configuration-reference/ — confirmed `output` default is `'static'`, no adapter needed; confirmed `i18n.locales`/`defaultLocale`/`routing.prefixDefaultLocale` keys.
- https://docs.astro.build/en/guides/internationalization/ — official i18n routing guide, `prefixDefaultLocale` behavior, confirmed no built-in "equivalent page" switcher mechanism.
- https://docs.astro.build/en/guides/testing/ — confirms Playwright as an officially supported e2e testing tool for Astro.
- OVH official docs (`docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ssh-on-webhosting`, multisite guide on `github.com/ovh/docs`) and OVH's own SSL/Let's Encrypt help article — confirmed multisite subdomain-to-folder mechanism, free automatic Let's Encrypt provisioning (may take "several hours"), and general SSH-tier gating.

### Secondary (MEDIUM confidence)
- `github.com/SamKirkland/FTP-Deploy-Action` README — incremental state-file sync behavior, protocol options (ftp/ftps/ftps-legacy), config keys.
- `github.com/Burnett01/rsync-deployments` — SSH-based rsync alternative, "5k+ workflows" usage claim (third-party-reported, not independently verified by this research).
- `github.com/pitscher/ovh-deploy-hosting-action` README — confirmed this class of tool is git-clone-based (wrong fit for a build-step site), requires OVH Pro-tier SSH.
- Multiple independent community write-ups (cross-referenced) on: (a) Astro i18n shared-slug switcher pattern via content collections + `getRelativeLocaleUrl()`; (b) Sanity webhook → GitHub `repository_dispatch` relay pattern; (c) Sanity singleton document schema pattern.
- WebSearch aggregation on current OVH Web Hosting 2026 plan tiers/pricing (Personal/Professional/Performance, FTP vs. SSH gating) — consistent across independent sources, but not fetched from a single canonical current OVH pricing page (that fetch attempt 404'd) — treat exact price figures as approximate/MEDIUM confidence, re-verify on the actual OVH control panel during D-06 execution.

### Tertiary (LOW confidence)
- None of the load-bearing claims in this document rest solely on unverified single-source WebSearch — the OVH plan-tier pricing specifics are the closest to LOW confidence and are explicitly flagged in the Assumptions Log (A1) and Open Questions (#1) as needing on-panel confirmation rather than being treated as locked facts.

## Metadata

**Confidence breakdown:**
- Standard stack (Astro/Sanity package choices, versions): HIGH — verified live against npm registry, cross-checked against official Astro config docs.
- Architecture (static-only hosting implications, i18n routing, cookie/switcher design): MEDIUM-HIGH — core Astro mechanics are HIGH (official docs); the switcher/cookie/webhook-relay patterns are well-documented community idioms (MEDIUM) since Astro/Sanity don't ship them as one-line built-ins.
- OVH deploy mechanics specifically: MEDIUM — GitHub Actions tooling (FTP-Deploy-Action, rsync-deployments) is well-documented; the actual plan tier and protocol available to this specific project is LOW/unverified by design (D-06 explicitly defers this to execution-time investigation).
- Pitfalls: MEDIUM-HIGH — several (Node version requirement, adapter-not-needed, git-clone-action mismatch) are directly verified; the OVH-specific sequencing pitfalls (cert provisioning delay, plan-tier gating) are CITED from official/semi-official OVH sources.

**Research date:** 2026-07-05
**Valid until:** ~30 days for the Astro/Sanity package guidance (stable ecosystem); ~7-14 days for OVH plan-tier/pricing specifics given the 2026 OVH Web Hosting plan restructuring mentioned in OVH's own blog — re-verify on the OVH control panel directly rather than trusting this document's OVH pricing figures at execution time.

---
*Phase: 1-Foundation & Bilingual Infrastructure*
*Research completed: 2026-07-05*
