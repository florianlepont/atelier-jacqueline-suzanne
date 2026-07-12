---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: milestone
status: Roadmap created, awaiting `/gsd-plan-phase 6`
stopped_at: Phase 6 UI-SPEC approved
last_updated: "2026-07-12T12:54:39.542Z"
last_activity: 2026-07-12 — v1.1 ROADMAP.md created (HOME-01/02/03 mapped to Phase 6, 3/3 coverage)
progress:
  total_phases: 9
  completed_phases: 7
  total_plans: 25
  completed_plans: 25
  percent: 78
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-05)

**Core value:** Visitors can browse Romane's photographic work and buy a piece through a real, working checkout — everything else supports that. (v1 milestone delivers the portfolio/about/contact foundation; checkout follows in v1.x.)
**Current focus:** Phase 6 — homepage view-mode toggle, grid hero & wordmark cutout (ROADMAP.md created, not yet planned)

## Current Position

Phase: Phase 6 (Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout) — roadmapped, not yet planned
Plan: —
Status: Roadmap created, awaiting `/gsd-plan-phase 6`
Last activity: 2026-07-12 — v1.1 ROADMAP.md created (HOME-01/02/03 mapped to Phase 6, 3/3 coverage)

## Performance Metrics

**Velocity:**

- Total plans completed: 13
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02 | 4 | - | - |
| 03 | 3 | - | - |
| 04 | 3 | - | - |
| 04.3 | 3 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 11min | 3 tasks | 12 files |
| Phase 01 P02 | 15min | 2 tasks | 1 files |
| Phase 01 P03 | 35min | 2 tasks | 9 files |
| Phase 01 P04 | 14min | 3 tasks | 8 files |
| Phase 01 P05 | 35min | 3 tasks | 3 files |
| Phase 02 P01 | 50 | 3 tasks | 13 files |
| Phase 02 P02 | 25 | 2 tasks | 5 files |
| Phase 02 P03 | ~2h (incl. content migration + 2 real bugs found/fixed) | 3 tasks | 8 files |
| Phase 02 P04 | 90 | 3 tasks | 3 files |

## Accumulated Context

### Roadmap Evolution

- Phase 04.1: Design System & Homepage Refresh (INSERTED after Phase 4, URGENT) — import + adopt the Claude-Design-generated monochrome/pop-pink identity and rebuild the homepage per the imported prototype. See `.planning/design-import/README.md`.
- Phase 04.2: Social Media Links (INSERTED after Phase 4, URGENT) — Instagram link in the footer and on the About/Contact page.
- Phase 04.3 inserted after Phase 4: Homepage Refinements: logo hover crossfade, remove standalone Galleries page (grid view on homepage is now the sole browse entry point), icon-based carousel/grid toggle, fix mobile hero visibility bug, three-line wordmark, clickable gallery names in carousel + grid modes (URGENT)
- Phase 04.3 planned: 3 plans, 2 waves — plan-checker VERIFICATION PASSED, all 11 CONTEXT.md decisions covered
- v1.1 milestone (Homepage Refinements) roadmapped 2026-07-12: single new Phase 6 (integer, continuing numbering from v1.0's last phase, Phase 5) covers all three v1.1 requirements (HOME-01, HOME-02, HOME-03) — tightly-scoped, single-component (HomeCarousel.astro) refinement, so kept as one phase rather than split. Per PROJECT.md, Phase 6 is intended to execute before Phase 5's domain cutover despite the higher phase number (numbering reflects milestone-arrival order, not execution sequence).

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: v1 milestone scoped to portfolio + about + contact + baseline legal + DNS cutover only; shop/checkout/exhibitions deferred to v1.x (separate future roadmap).
- [Roadmap]: Bilingual routing + CMS scaffolding front-loaded into Phase 1 since I18N cross-cuts every later content phase.
- [Roadmap]: Legal & Compliance (Phase 4) depends on Phase 3 (Contact) since the privacy notice must describe contact-form data handling.
- [Roadmap]: v1.1 milestone (Homepage Refinements) mapped to a single new Phase 6, continuing integer numbering from v1.0's Phase 5 — all three requirements (HOME-01/02/03) touch the same component (HomeCarousel.astro) and are cosmetic/interaction refinements with no new backend/data model, so a single phase was judged more coherent than splitting.
- [Phase 01]: No SSR adapter installed for Astro (output: 'static' framework default) per OVH static-hosting constraint — OVH Web Hosting is a zero-compute Apache file server; @astrojs/cloudflare/wrangler are explicitly excluded
- [Phase 01]: Phase 1 staging deploys to GitHub Pages (repo now public) instead of an OVH subdomain; OVH SFTP facts recorded for Phase 5 — OVH Free hosting tier cannot attach any subdomain (multisite requires paid tier); GitHub Pages reuses existing repo with zero new signup and automatic HTTPS
- [Phase 01]: Sanity read-only + one-time write tokens created and revoked entirely via CLI (sanity tokens add/delete), no dashboard visit needed — sanity tokens add/list/delete supports full non-interactive token lifecycle management
- [Phase 01]: siteSettings singleton bilingual placeholder copy published via a temporary editor-role token created and deleted in the same session — Viewer (read-only) token cannot write; a scoped, immediately-revoked editor token avoided a manual Studio-publish step for Florian
- [Phase 01]: [Phase 01 Plan 04]: Wired the previously-unused Sanity navLabels.home field into BaseLayout as a localized Home/Accueil nav link, since the seeded siteTitle is an intentionally untranslated brand name shared across locales
- [Phase 01]: [Phase 01 Plan 04]: vitest.config.ts switched from vitest/config defineConfig to astro/config getViteConfig so the astro:i18n virtual module resolves under Vitest
- [Phase 01]: [Phase 01 Plan 04]: getSwitcherHref normalizes trailing slash independent of the project's trailingSlash/build.format config (homepage always trailing-slash, other pages never) to match the locked shared-slug unit test contract
- [Phase 01]: [Phase 01 Plan 05]: CI builds the site twice (root base for the Playwright+Vitest hard gate, GitHub Pages base for the deployed artifact) to avoid coupling the locked e2e test suite to the deploy target's base path
- [Phase 01]: [Phase 01 Plan 05]: Fixed getSwitcherHref and the locale-cookie redirect script to strip the configured base path before computing slugs/paths — both broke under GitHub Pages' non-root base, only discovered once ASTRO_BASE was actually exercised in this plan
- [Phase 01]: [Phase 01 Plan 05]: Phase 1 staging site is live at https://florianlepont.github.io/ajs-website/, verified end-to-end (push-triggered deploy, repository_dispatch-triggered rebuild, live switcher/cookie/404 checks via a headless-browser script against the production URL) — Phase 1 is complete
- [Phase 01]: Post-completion code review (01-REVIEW.md) found 1 Critical + 6 Warnings; fixed CR-01 (404 page's hardcoded links weren't base-aware — real live bug, confirmed via curl against the deployed site) plus WR-01 (Sanity singleton create/duplicate guard), WR-02 (locale cookie scoped to base path, not domain-wide), WR-03 (null-safety for partially-populated Sanity docs), WR-04 (extracted stripBasePath + unit tests + a CI grep guard against un-prefixed hrefs), WR-06 (404 page switcher no longer computes a nonsensical /404 slug). WR-05 and remaining Info items deferred by explicit choice. Re-verified live post-fix: 404 page links all correctly base-prefixed, HTTP 404 served correctly.
- [Phase 02]: @sanity/orderable-document-list verified legitimate via blocking human checkpoint (npmjs.com, sanity-io org, v2.0.8, matching peer deps) before install — repo now lives in the sanity-io/plugins monorepo, a normal consolidation, not a legitimacy concern
- [Phase 02]: Shipped visual rebrand on the system-font fallback; Delight variable font sourcing/licensing deferred as a follow-up, not a Phase 2 blocker — user chose fallback-only at the checkpoint rather than block the phase on sourcing/licensing a Behance-hosted font with no CDN/npm distribution
- [Phase 02]: Fixed gallery images schema to attach alt-text fields directly on an image-type array member (not a wrapping object type), restoring Sanity Studio's native multi-file drag-and-drop upload — Romane's Lightroom-exported folders need batch upload; the original galleryImage object wrapper broke Studio's per-file-drop-to-array-item heuristic, discovered when she reported drag-and-drop of multiple files wasn't working
- [Phase 02]: Restricted sanityClient to perspective: 'published' so build-time queries never pull in unpublished drafts — an in-progress draft gallery (title set, no images) reached getGalleries() and crashed the static build with a null images array — published-only perspective ensures Romane's mid-edit documents can never break a production build
- [Phase 02]: Pushed to origin/main mid-phase to verify the CMS-01/lightbox checkpoint against real deployed GitHub Pages staging content, including a genuine mobile-device touch test — user chose live verification over local-only preview since real touch-swipe feel and Romane's unassisted Studio workflow can't be confidently confirmed from a local dev server
- [Phase 02]: Overrode D-13 (all-known-projects-migrated) to close Phase 2 with 2/8 projects published (Silos, Brume) — the content-migration pipeline is proven end-to-end with real content; remaining 6 projects (Rebut, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO) are tracked as follow-up content work, not a code blocker — user explicitly accepted this override

### Pending Todos

None yet.

### Blockers/Concerns

None currently open. Both prior research-carryover items were resolved during Phase 1 execution:

- Domain email service: confirmed active (MX Plan + Zimbra mailbox) via the OVH panel — Phase 5's DNS cutover must preserve these records, not wipe the zone.
- OVH deployment method: confirmed via the OVH panel — "Free hosting" tier, SFTP enabled on port 22, host `ftp.cluster129.hosting.ovh.net`, user `atelihu`, home dir `/home/atelihu` (see 01-02-SUMMARY.md). Note: this same Free tier cannot attach any subdomain (multisite requires a paid tier) — Phase 1 staging used GitHub Pages instead; Phase 5's production cutover plan should account for the single-domain limitation.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v1.x scope | Exhibitions, shop, checkout, shipping, commerce-specific legal (EXHB-*, SHOP-*, CHK-*, SHIP-*, LEGAL-02, LEGAL-04, CMS-02/03, I18N-02b/03) | Tracked in REQUIREMENTS.md v2 section, not yet roadmapped | Roadmap creation 2026-07-05 |

## Session Continuity

Last session: 2026-07-12T12:54:39.539Z
Stopped at: Phase 6 UI-SPEC approved
Resume file: .planning/phases/06-homepage-view-mode-toggle-grid-hero-wordmark-cutout/06-UI-SPEC.md
</content>
