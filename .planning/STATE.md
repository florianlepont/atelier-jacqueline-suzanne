---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Éditions
current_phase: 11
current_phase_name: schema-content-model
status: executing
stopped_at: Phase 11 context gathered
last_updated: "2026-07-22T14:50:46.995Z"
last_activity: 2026-07-22
last_activity_desc: Phase 11 execution started
progress:
  total_phases: 17
  completed_phases: 11
  total_plans: 36
  completed_plans: 35
  percent: 65
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-22)

**Core value:** Visitors can browse Romane's photographic work and buy a piece through a real, working checkout — everything else supports that. (v1 milestone delivers the portfolio/about/contact foundation; v1.3 adds a non-transactional Éditions showcase; checkout still follows in the future v1.x shop milestone.)
**Current focus:** Phase 11 — schema-content-model

## Current Position

Phase: 11 (schema-content-model) — EXECUTING
Plan: 1 of 2
Status: Executing Phase 11
Last activity: 2026-07-22 — Phase 11 execution started

Progress: [███████░░░░░░░] 10/14 phases complete (71%)

## Performance Metrics

**Velocity:**

- Total plans completed: 21
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02 | 4 | - | - |
| 03 | 3 | - | - |
| 04 | 3 | - | - |
| 04.3 | 3 | - | - |
| 07 | 2 | - | - |
| 09 | 2 | - | - |
| 10 | 4 | - | - |

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
| Phase 06 P01 | ~21h elapsed (two sessions, long overnight gap) | 3 planned tasks + live post-checkpoint follow-on | 3 files |
| Phase 07 P01 | 15min | 2 tasks | 2 files |
| Phase 07 P02 | ~20min | 2 tasks | 2 files |
| Phase 08 | unknown (implemented directly on main, outside plan/execute tracking) | - | 2 files (HomeCarousel.astro, homepage.spec.ts) + unrelated adjacent Sanity schema work |

## Accumulated Context

### Roadmap Evolution

- Phase 04.1: Design System & Homepage Refresh (INSERTED after Phase 4, URGENT) — import + adopt the Claude-Design-generated monochrome/pop-pink identity and rebuild the homepage per the imported prototype. See `.planning/design-import/README.md`.
- Phase 04.2: Social Media Links (INSERTED after Phase 4, URGENT) — Instagram link in the footer and on the About/Contact page.
- Phase 04.3 inserted after Phase 4: Homepage Refinements: logo hover crossfade, remove standalone Galleries page (grid view on homepage is now the sole browse entry point), icon-based carousel/grid toggle, fix mobile hero visibility bug, three-line wordmark, clickable gallery names in carousel + grid modes (URGENT)
- Phase 04.3 planned: 3 plans, 2 waves — plan-checker VERIFICATION PASSED, all 11 CONTEXT.md decisions covered
- v1.1 milestone (Homepage Refinements) roadmapped 2026-07-12: single new Phase 6 (integer, continuing numbering from v1.0's last phase, Phase 5) covers all three v1.1 requirements (HOME-01, HOME-02, HOME-03) — tightly-scoped, single-component (HomeCarousel.astro) refinement, so kept as one phase rather than split. Per PROJECT.md, Phase 6 is intended to execute before Phase 5's domain cutover despite the higher phase number (numbering reflects milestone-arrival order, not execution sequence).
- Phase 6 completed 2026-07-13: HOME-01/02/03 delivered per plan (commits `ad27437`..`dbebd6f`), plus a substantial live post-checkpoint follow-on (commit `44cc10d`) reworking the mobile hero (full-bleed `100svh`, panel overlaid on the photo) and replacing the arrow-button navigation with a clickable dashed progress indicator plus keyboard/swipe support — none of this follow-on was in the original plan; it was discovered through direct use after Task 3's checkpoint was already approved, and reconciled into tracked history via `06-01-SUMMARY.md` per explicit user request. v1.1 milestone is now complete; Phase 5 (Launch & Domain Cutover) is the only remaining v1 phase.
- v1.2 milestone (Homepage Polish, Pre-Launch) roadmapped 2026-07-13: four new integer phases (7–10, continuing numbering from Phase 6) cover all eight v1.2 requirements (HOME-04..HOME-10, I18N-04), sequenced by blast radius rather than dumped into one phase — Phase 7 (HOME-04, HOME-05, HOME-06): small, contained, homepage-only header/CSS tweaks and a mobile bug fix, done first with no shared-component or content-model risk. Phase 8 (HOME-07, HOME-08): grouped together because both surface the same new per-gallery description content (Sanity schema addition), just in two display forms (carousel byline, grid hover) — building the schema once and wiring both displays in the same phase avoids doing the content-model work twice. Phase 9 (HOME-09): kept standalone — progressive image loading has its own distinct testing surface (loading states/priority/transition timing) and potentially touches more than just the homepage's own images, so it wasn't folded into Phase 7's contained fixes. Phase 10 (HOME-10, I18N-04): the highest-risk item (structural header-consolidation refactor spanning homepage + About/Contact) done last, in its own phase, depending on Phase 7 — so the header nav/toggle groundwork already fixed in Phase 7 gets carried into the unified component once, rather than rebuilt twice; I18N-04 (language switcher globe-icon change) is bundled in because its presentation lives inside the same header being unified.
- v1.3 milestone "Éditions" roadmapped 2026-07-22: four new integer phases (11–14, continuing numbering from Phase 10; Phase 5 stays untouched/separately tracked and out of this milestone) cover all eight v1.3 requirements (EDN-01..EDN-07, CMS-04), following research/SUMMARY.md's proposed 4-phase structure near-verbatim (schema before data-fetch, routes before nav since nav touches every-page shared chrome, verification as an explicit final pass for omission-class risks). Phase 11 (Schema & Content Model — CMS-04, EDN-05): new `edition` Sanity document type mirroring `gallery.ts`'s richer editorial workflow, seeded with real content; format-detail fields grouped and typed now so a future shop `commerce` field group is additive, not a restructuring; also the phase where the "Rebut" gallery/édition naming-overlap question gets raised with Romane. Phase 12 (Data-Fetch Layer & Routes — EDN-02, EDN-03, EDN-04, EDN-06, EDN-07): build-time GROQ layer + bilingual overview/detail routes, verifiable in isolation before anything shared is touched; detail page mirrors `galleries/[slug].astro` directly, overview page is genuinely new (no gallery equivalent). Phase 13 (Nav Integration — EDN-01): touches the one piece of shared, every-page chrome in this feature (`SiteHeader`, threaded through two independent call sites — `BaseLayout.astro` and `HomeCarousel.astro`); sequenced last of the build phases so nav never points at an unready route. Phase 14 (Verification & UAT — no primary requirement, cross-cutting): a dedicated pass because this milestone's dominant risk class is omission bugs (missed locale, missed sitemap entry, missed nav call site) that don't fail loudly on a single happy-path check.

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: v1 milestone scoped to portfolio + about + contact + baseline legal + DNS cutover only; shop/checkout/exhibitions deferred to v1.x (separate future roadmap).
- [Roadmap]: Bilingual routing + CMS scaffolding front-loaded into Phase 1 since I18N cross-cuts every later content phase.
- [Roadmap]: Legal & Compliance (Phase 4) depends on Phase 3 (Contact) since the privacy notice must describe contact-form data handling.
- [Roadmap]: v1.1 milestone (Homepage Refinements) mapped to a single new Phase 6, continuing integer numbering from v1.0's Phase 5 — all three requirements (HOME-01/02/03) touch the same component (HomeCarousel.astro) and are cosmetic/interaction refinements with no new backend/data model, so a single phase was judged more coherent than splitting.
- [Roadmap]: v1.2 milestone (Homepage Polish, Pre-Launch) mapped to four new phases (7–10), continuing integer numbering from Phase 6 — split by blast radius/risk (contained visual fixes → shared content-model addition → self-contained perf change → shared-component structural refactor done last) rather than one large phase, since HOME-10/I18N-04 carry materially higher risk (multi-page shared component) than the other six requirements.
- [Roadmap]: v1.3 milestone "Éditions" mapped to four new phases (11–14), continuing integer numbering from Phase 10 — Phase 5 (Launch & Domain Cutover) is untouched and remains separately tracked, not part of this milestone. Phase order follows dependency + blast-radius reasoning from research/SUMMARY.md: schema/content model must exist and be seeded before the data-fetch layer can be verified against anything real; routes come before nav wiring since nav is the only part touching shared chrome used by every existing page; verification is its own explicit final phase because this milestone's pitfalls are dominated by omission-class bugs.
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
- [Phase 06]: Mobile hero restructured into two independently-sized boxes (.home-hero__photo / .home-hero__accent) after live feedback surfaced overlap bugs — the accent panel's own in-flow height was stretching the absolutely-positioned photo/caption/arrows that shared its containing block; hardcoded pixel offsets kept breaking as content changed, so the structural fix removed the need for them
- [Phase 06]: Mobile hero uses 100svh, not 100vh — 100vh resolves to the large (chrome-hidden) viewport on real mobile Safari, letting the site footer peek in before the user scrolls; 100svh always reflects the guaranteed-visible area
- [Phase 06]: Prev/next arrow buttons replaced with a compact (~20-30% viewport width) clickable dashed progress indicator plus keyboard ArrowLeft/ArrowRight and touch-swipe navigation, per direct user request — arrows are gone from the component entirely
- [Phase 06]: Mobile-only wordmark background-position bypass (added when the panel briefly sat below the photo) was removed once the panel returned to overlaying the photo — mobile now shares desktop's live pixel-alignment computation, not an approximation
- [Phase 07]: [Phase 07 Plan 01]: Instagram nav link and square mode-toggle box committed together (not split per-task) since HOME-05's 44px tap-target fix directly changed HOME-04's mobile pixel-budget math
- [Phase 07]: [Phase 07 Plan 01]: .home-header's mobile inter-item gap trimmed a second time (8px to 4px) beyond the plan's nav-only trims, to absorb the wider 44px toggle button and keep all 5 header items on one row at 393px
- [Phase 07]: [Phase 07 Plan 02]: HOME-06's D-10 view-transition hypothesis could not be directly confirmed/reproduced under Chromium mobile emulation (test passed GREEN before and after a disable/re-enable experiment) — applied the fix anyway per D-12 since it corrects a real, identified asymmetry (.home-hero__photo/.home-hero__accent's unconditional CSS view-transition-name vs the grid tile's always-dynamic naming)
- [Phase 07]: [Phase 07 Plan 02]: dynamic view-transition-name assignment for the hero photo/accent panel is set once per toggle click and never cleared afterward (not via transition.finished) — clearing raced a rapid second click and broke the pre-existing accent-panel fade-timing test
- [Phase 08]: HOME-07 and HOME-08 (gallery description on homepage byline + grid-tile hover) were implemented and shipped directly to `main` by Florian (commits `38457dd`, `3360f16`, `78f3c61`, `04b10a1`, `a68ee00`, `602d24b`, 2026-07-13/14) ahead of the formal `/gsd-discuss-phase` → `/gsd-plan-phase` → `/gsd-execute-phase` cycle. Both surfaces reuse the existing `gallery.statement` field from Phase 2 — no new Sanity schema field was needed, confirming the roadmap's rationale for grouping HOME-07/08 into one phase. `/gsd-discuss-phase 8` (2026-07-14) found the implementation already complete, verified it (13/13 unit tests, 23/23 e2e tests passing, including the dedicated "collection statements on the homepage" describe block), and retroactively closed the phase — see `.planning/phases/08-gallery-descriptions/08-CONTEXT.md` and `08-SUMMARY.md`.

### Pending Todos

None yet.

### Blockers/Concerns

None currently open. Both prior research-carryover items were resolved during Phase 1 execution:

- Domain email service: confirmed active (MX Plan + Zimbra mailbox) via the OVH panel — Phase 5's DNS cutover must preserve these records, not wipe the zone.
- OVH deployment method: confirmed via the OVH panel — "Free hosting" tier, SFTP enabled on port 22, host `ftp.cluster129.hosting.ovh.net`, user `atelihu`, home dir `/home/atelihu` (see 01-02-SUMMARY.md). Note: this same Free tier cannot attach any subdomain (multisite requires a paid tier) — Phase 1 staging used GitHub Pages instead; Phase 5's production cutover plan should account for the single-domain limitation.

Carried forward for v1.3 (from PROJECT.md's Context section, not yet resolved):

- Naming overlap: the shipped Portfolio already has a gallery titled "Rebut" (migrated in Phase 2), and the new "Éditions" milestone adds a paper édition also named "Rebut" (or "Sillo") documented via its own photo shoot. Unconfirmed whether these are the same subject or two unrelated things sharing a name — needs a direct check with Romane during Phase 11 content work, tracked as a Phase 11 success criterion, not resolved autonomously here.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 260713-hcj | Make the grid-mode hero tile's Atelier Jacqueline Suzanne wordmark bigger on mobile and give it the same transparent photo-cutout effect as the carousel wordmark | 2026-07-13 | 1b1b9e1 | | [260713-hcj-make-the-grid-mode-hero-tile-s-atelier-j](./quick/260713-hcj-make-the-grid-mode-hero-tile-s-atelier-j/) |
| 260713-jfz | Add an animated transition between carousel and grid view modes using the View Transitions API, with shared-element morphing and graceful fallback | 2026-07-13 | 57733a8 | | [260713-jfz-add-an-animated-transition-between-carou](./quick/260713-jfz-add-an-animated-transition-between-carou/) |
| 260713-kit | Fix the pink accent panel's view-transition fade — corrected to a sequential handoff (photo morph finishes, then panel fades in cleanly), not overlapping or popping | 2026-07-13 | 2a943ef | | [260713-kit-the-pink-accent-panel-now-appears-only-a](./quick/260713-kit-the-pink-accent-panel-now-appears-only-a/) |
| 260714-d6h | Improve the Sanity Studio EditorialDashboard "À faire maintenant" panel UI — urgency-distinct priority-section headers (tonal Card + circular tonal count badge) and denser, more scannable attention cards (tonal left accent bar, truncated Manque line, tonal completion badge) | 2026-07-14 | 1a19972 | | [260714-d6h-improve-the-sanity-studio-editorialdashb](./quick/260714-d6h-improve-the-sanity-studio-editorialdashb/) |
| 260718-qdz | Fix mode-toggle icon color regression on the homepage — restored the carousel-mode white / grid-mode ink color split for the display-mode toggle, silently dropped when Phase 10's SiteHeader refactor replaced the old `.home-header` container-level color rule with narrower per-element overrides | 2026-07-18 | 292488a | | [260718-qdz-fix-mode-toggle-icon-color-regression-on](./quick/260718-qdz-fix-mode-toggle-icon-color-regression-on/) |
| 260720-nm3 | Fix 2 UI-audit findings: darken the site-wide link/accent pink token (`--pink-600`) from `#FF3B94` to `#D6327C` to clear WCAG AA text contrast (4.56:1 vs white), and promote the homepage's two wordmark elements from `<p>` to semantic `<h1>` (homepage previously had zero heading elements). A 3rd audit finding — a colliding Sanity gallery slug (`/galleries/adults/` mistakenly used by the "Paysage" gallery, colliding with the real "Adults" gallery's `/galleries/adult/`) — was fixed directly via the Sanity CLI, renamed to `/galleries/paysage/`, outside this code plan | 2026-07-20 | 1e28b74 | | [260720-nm3-fix-3-ui-audit-findings-1-site-wide-pink](./quick/260720-nm3-fix-3-ui-audit-findings-1-site-wide-pink/) |
| 260721-jm0 | Fix 6 Sanity Studio EditorialDashboard audit findings: dark-mode-aware backgrounds (was hardcoded light-only hex), inconsistent gray row background, human error copy (raw error moved to a collapsed `<details>`), exclude intentional "en préparation" drafts from the urgent to-do bucket, level-3 heading semantics for priority-group titles, dead CSS class + deployment tone dead-code cleanup | 2026-07-21 | 05faefe | Verified | [260721-jm0-fix-sanity-studio-editorialdashboard-iss](./quick/260721-jm0-fix-sanity-studio-editorialdashboard-iss/) |
| 260718-r2o | Fix grid-mode hero tile text legibility on dark per-gallery accents (Violet/Plum) — wired a `--current-accent-text` companion CSS variable, mirroring the existing `--current-accent` mechanism, so the grid tile's text color follows the same WCAG-contrast value the carousel accent panel already used correctly | 2026-07-18 | 7900284 | [260718-r2o-fix-the-homepage-per-gallery-accent-colo](./quick/260718-r2o-fix-the-homepage-per-gallery-accent-colo/) |
| 260718-rhv | Fix grid-tile title misalignment (always-reserve description height + single-line title clamp for long gallery names) and add a per-tile accent-color hover tint + subtle title lift, human-verified live for alignment and on-brand legibility | 2026-07-18 | 0cd2741 | [260718-rhv-fix-grid-mode-tile-title-misalignment-an](./quick/260718-rhv-fix-grid-mode-tile-title-misalignment-an/) |
| 260720-dzi | Add CI/tooling quality gates from the quality-auditor findings: blocking `astro check` type-check step in CI, root flat ESLint config + wired lint script, Sanity Studio lint script, and Vitest v8 coverage reporting — fixed 3 genuine pre-existing type errors and several real lint violations surfaced by the new gates | 2026-07-20 | 725871e | [260720-dzi-add-ci-tooling-quality-gates-astro-check](./quick/260720-dzi-add-ci-tooling-quality-gates-astro-check/) |
| 260720-dzo | Fix stale CLAUDE.md/AGENTS.md/research/STACK.md "Technology Stack" docs (retired Cloudflare/Stripe-in-Workers plan replaced with the real static-Astro + GitHub Pages/OVH + Sanity architecture, e-commerce marked deferred to v1.x) and add a root README.md developer quick-reference | 2026-07-20 | b1b0520 | [260720-dzo-fix-the-stale-claude-md-agents-md-techno](./quick/260720-dzo-fix-the-stale-claude-md-agents-md-techno/) |
| 260720-dzs | Extract HomeCarousel.astro's pure computational logic (wordmark crop/scale math, swipe-direction detection) into a testable `src/lib/home-carousel.ts` module with unit tests, mirroring the i18n-paths.ts/site-config.ts pattern — pure refactor, zero behavior change, full e2e suite green | 2026-07-20 | 1ecfc21 | [260720-dzs-extract-homecarousel-astro-s-pure-comput](./quick/260720-dzs-extract-homecarousel-astro-s-pure-comput/) |
| 260720-sanity-dashboard-density | Simplify the Sanity dashboard density: retain two useful quick actions, remove redundant validation details from attention rows, and increase vertical rhythm throughout the main sections | 2026-07-20 | 7cee97a | [260720-sanity-dashboard-density](./quick/260720-sanity-dashboard-density/) |
| 260720-sanity-dashboard-activity-authors | Turn the Sanity dashboard's recent activity into a real editorial log using transaction history: identify the author, classify the action, summarize changed fields, and retain a safe fallback for purged history | 2026-07-20 | 3bff5d7 | [260720-sanity-dashboard-activity-authors](./quick/260720-sanity-dashboard-activity-authors/) |
| 260720-sanity-dashboard-compact-layout | Recompose the Sanity dashboard as a compact responsive editorial cockpit: header toolbar, horizontal metrics, single-line task rows, and a desktop 2/3 + 1/3 tasks/activity layout | 2026-07-20 | e64b856 | [260720-sanity-dashboard-compact-layout](./quick/260720-sanity-dashboard-compact-layout/) |
| 260720-sanity-dashboard-three-pass-polish | Complete three consecutive UI audit/fix loops on the compact Sanity dashboard: fix hierarchy and repetition, consolidate responsive metrics, strengthen affordances, and remove a duplicate styled-components runtime caught during the final audit | 2026-07-20 | 46d57fe | [260720-sanity-dashboard-three-pass-polish](./quick/260720-sanity-dashboard-three-pass-polish/) |
| 260720-remove-dashboard-home-action | Remove the redundant « Modifier l'accueil » action from the Sanity dashboard header, leaving only collection creation and site preview | 2026-07-20 | a12a615 | | [260720-remove-dashboard-home-action](./quick/260720-remove-dashboard-home-action/) |
| 260720-apply-personal-dashboard-ui-audit | Apply the personal dashboard UI audit: primary collection action, semantic iconography, vertical KPI structure, separate deployment status, stable task metadata, comfortable targets, fixed activity dates, and native Sanity card depth | 2026-07-20 | ce8bbb6 | | [260720-apply-personal-dashboard-ui-audit](./quick/260720-apply-personal-dashboard-ui-audit/) |
| 260720-polish-dashboard-pixel-perfect | Complete the dashboard pixel-polish pass: tinted canvas and white surfaces, explicit low-emphasis site status, per-task icons, compact targets, resilient activity dates, responsive header/KPI behavior, and hover/focus/accessibility states | 2026-07-20 | cfa3d84 | | [260720-polish-dashboard-pixel-perfect](./quick/260720-polish-dashboard-pixel-perfect/) |
| 260720-fix-dashboard-spacing-and-task-details | Standardize dashboard control heights and icon spacing, rebuild priority rows on a stable grid, and explicitly display the remaining work for each content item | 2026-07-20 | ae2591c | | [260720-fix-dashboard-spacing-and-task-details](./quick/260720-fix-dashboard-spacing-and-task-details/) |
| 260720-rebuild-dashboard-optical-grid | Rebuild the regressed dashboard header, priority rows, activity rows and KPI rhythm around shared optical text/icon axes, with two buttons and a separate compact site status | 2026-07-20 | 69b6f7d | | [260720-rebuild-dashboard-optical-grid](./quick/260720-rebuild-dashboard-optical-grid/) |
| 260722-afi | Corriger le contraste visuel entre l'en-tête et les items du tableau de bord éditorial (section Informations manquantes) — recessed header band, hairline divider, uppercase section-label title, human-verified via mockup replicating the exact CSS in light + dark mode | 2026-07-22 | 9762000 | Verified | [260722-afi-corriger-le-contraste-visuel-entre-l-en-](./quick/260722-afi-corriger-le-contraste-visuel-entre-l-en-/) |
| 260722-tcv | Close the complete test-coverage audit: blocking thresholds, Sanity pure-logic coverage/build gate, contact failure states, iPhone/WebKit smoke, deterministic CMS/static-route cases, 404/base-path artifact verification, axe accessibility checks, and portable visual baselines | 2026-07-22 | — | Verified | [260722-tcv-close-test-coverage-audit-gaps](./quick/260722-tcv-close-test-coverage-audit-gaps/) |

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v1.x scope | Exhibitions, shop, checkout, shipping, commerce-specific legal (EXHB-*, SHOP-*, CHK-*, SHIP-*, LEGAL-02, LEGAL-04, CMS-02/03, I18N-02b/03), plus the Éditions cross-link differentiator (EDN-08) | Tracked in REQUIREMENTS.md v2 section, not yet roadmapped | Roadmap creation 2026-07-05 (v2 baseline); EDN-08 added 2026-07-22 |

## Session Continuity

Last session: 2026-07-22T10:38:04.288Z
Stopped at: Phase 11 context gathered
Resume file: .planning/phases/11-schema-content-model/11-CONTEXT.md

**Next up:** `/gsd-plan-phase 11` — Schema & Content Model (CMS-04, EDN-05).
