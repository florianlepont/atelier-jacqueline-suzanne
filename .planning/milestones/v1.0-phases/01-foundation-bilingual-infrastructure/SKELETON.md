# Walking Skeleton — Atelier Jacqueline Suzanne Website

**Phase:** 1
**Generated:** 2026-07-05

## Capability Proven End-to-End

A visitor can load the deployed staging site at `https://staging.atelierjacquelinesuzanne.fr/` in French (and `/en/` in English), see header/footer chrome and a placeholder homepage whose copy is edited in the Sanity CMS, switch languages via a persistent "FR | EN" toggle that lands on the equivalent page, and have that choice remembered on return — with the whole thing built as static output and deployed by CI over HTTPS.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Astro 7.0.6, `output: 'static'`, **no adapter** | Content/image-heavy site; ships zero JS by default; static output is the only fit for OVH's zero-compute Apache hosting (an SSR adapter would target a runtime that does not exist here). |
| i18n routing | Astro built-in `i18n` (`defaultLocale: 'fr'`, `locales: ['fr','en']`, `prefixDefaultLocale: false`) | Official, one-line config; French at root (`/`), English under `/en/` per D-01. No Accept-Language auto-redirect (D-02). |
| Equivalent-page switching | Hand-built shared-slug utility `src/lib/i18n-paths.ts` (`getSwitcherHref`) over `getRelativeLocaleUrl()` | Astro does not ship a "switch to equivalent page" feature (RESEARCH.md Pitfall 1); the shared-slug convention is durable infra every later content phase reuses (D-04). |
| Locale persistence | Client-side `ajs_locale` cookie + inline pre-paint redirect script in BaseLayout `<head>` | No server exists on OVH to read cookies; must run in-browser. `SameSite=Lax`, value only `fr`/`en`, 1-year max-age (D-03). Brief flash-of-locale is an accepted MVP tradeoff. |
| Data layer / CMS | Sanity (Content Lake + Studio), `@sanity/client` fetched at **build time only** | Non-technical editor UI, generous free tier. Token never reaches the browser; content is baked into static HTML at build (D-09). |
| First content type | `siteSettings` locale-aware **singleton** (siteTitle, navLabels, footerText, welcome heading/body — FR+EN) | Durable infrastructure, not throwaway; Phase 2/3 nav/footer/chrome keep pulling from it (D-09). |
| Deployment target | OVH mutualized Web Hosting, **staging subdomain** `staging.atelierjacquelinesuzanne.fr` over Let's Encrypt HTTPS | Near-zero budget; real domain cutover deferred to Phase 5 (D-07/D-08). Protocol/doc-root confirmed at execution time (D-06). |
| CI/CD (only compute tier) | GitHub Actions: `npm ci` → build (Node 22) → Playwright+Vitest gate → `SamKirkland/FTP-Deploy-Action` over **FTPS** | GitHub Actions is the sole compute tier; hard test-gate before deploy; FTPS (encrypted), not plain FTP. Git-clone-based OVH actions rejected (publish source, not `dist/`). |
| Content→rebuild | Sanity webhook → GitHub `repository_dispatch` (`sanity-content-published`) with a fine-grained, repo-scoped PAT | No CDN deploy-hook equivalent on OVH; CMS calls GitHub's API directly (correct architecture given zero-compute hosting). |
| Directory layout | `src/{layouts,components,lib,pages,scripts}` + separate `sanity/` Studio project + `tests/{unit,e2e}` + `.github/workflows/` | Matches RESEARCH.md Recommended Project Structure; the first patterns later phases copy. |
| Testing | Playwright (e2e against built `dist/` via `astro preview`) + Vitest (unit for the slug utility) | Astro-supported e2e tool; Nyquist gate wired RED-first in Plan 01, GREEN by Plan 04, enforced in CI. |

## Stack Touched in Phase 1

- [x] Project scaffold (Astro, build, lint via TS, Playwright + Vitest runners) — Plan 01
- [x] Routing — real FR (`/`) and EN (`/en/`) routes + bilingual 404 — Plans 01, 04
- [x] Database — real Sanity read (`getSiteSettings()`) AND a real write (publishing the singleton in Studio) — Plan 03
- [x] UI — interactive "FR | EN" switcher wired to the slug utility + cookie — Plan 04
- [x] Deployment — CI build+test+deploy to a live OVH staging URL over HTTPS — Plans 02, 05

## Out of Scope (Deferred to Later Slices)

Explicitly NOT in the skeleton — later phases must not re-litigate Phase 1's minimalism:

- Real portfolio/gallery content, lightbox, image pipeline (Phase 2).
- Real About/bio content and the contact form + honeypot (Phase 3).
- Mentions légales, privacy/GDPR notice, CNIL cookie-consent banner — including the deferred question of whether the `ajs_locale` cookie needs consent disclosure (Phase 4).
- Production domain cutover / DNS switch from Myportfolio (Phase 5).
- Any shop/checkout/exhibitions/commerce compute tier (v1.x — will require a hosting/compute re-evaluation, since OVH static hosting has no runtime).
- Component framework (`@astrojs/react`/`@astrojs/preact`), shadcn, brand fonts/colors — deliberately deferred until a real interactive/visual-identity need arises (RESEARCH.md A3; UI-SPEC placeholder font/monochrome palette).
- SSH+rsync deploy (only if OVH tier confirms SSH in Plan 02; FTPS is the default).

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2 — Portfolio Galleries:** gallery/project content types in Sanity + gallery list/detail pages + lightbox; reuses `i18n-paths.ts`, `BaseLayout.astro`, `getSiteSettings`, and the shared-slug switcher for per-gallery FR/EN pages.
- **Phase 3 — About & Contact:** About/bio content + spam-protected contact form (honeypot); same chrome/i18n infra.
- **Phase 4 — Legal & Compliance:** mentions légales, privacy notice, CNIL cookie-consent banner (resolves the D-03 cookie-disclosure flag).
- **Phase 5 — Launch & Domain Cutover:** point production `atelierjacquelinesuzanne.fr` at the OVH site, preserving MX/email, using the rehearsed staging pipeline.
