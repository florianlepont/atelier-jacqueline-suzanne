# Roadmap: Atelier Jacqueline Suzanne — Website

## Milestones

- 🚧 **v1.0 MVP** — Phases 1-5 (Phases 1-4/4.1/4.2/4.3 shipped 2026-07-12, archived and formally closed — see `.planning/MILESTONES.md`; Phase 5 launch/domain cutover still pending, deliberately deferred — user decision 2026-07-27: "we'll do it later")
- ✅ **v1.1 Homepage Refinements** — Phase 6 (shipped 2026-07-13, archived — see `.planning/MILESTONES.md`)
- ✅ **v1.2 Homepage Polish, Pre-Launch** — Phases 7-10 (shipped 2026-07-20, archived — see `.planning/MILESTONES.md`)
- ✅ **v1.3 Éditions** — Phases 11-14 (shipped 2026-07-23, archived — see `.planning/milestones/v1.3-ROADMAP.md`)
- 🚧 **v1.4 Editorial Design Consistency** — Phases 15-16 (in progress)

## Overview

This roadmap covers the **v1 milestone** (Phases 1–5): a fast, bilingual replacement of the current Myportfolio site with portfolio galleries, an About page, contact, baseline French legal pages, self-service gallery editing for Romane, and a rehearsed DNS cutover to the live domain. The journey starts with the bilingual/CMS/hosting foundation (since French/English and non-technical editing cross-cut every later page), moves through the two content pillars (portfolio, then about/contact), adds the legally-required pages, and ends with the domain cutover that retires the old site. Shop, checkout, shipping, and exhibitions (the v1.x wave) are explicitly deferred and are not represented here.

It also covers the **v1.1 milestone** (Phase 6): homepage refinements — a single unified carousel/grid toggle, a grid view whose hero is the first grid tile instead of a separate band, and a transparent photo-cutout treatment for the hero wordmark. Per PROJECT.md, this milestone is intended to land before Phase 5's domain cutover, even though its phase number is higher (phase numbers reflect milestone-arrival order, not strict execution sequence — see the note under Progress).

It also covers the **v1.2 milestone** (Phases 7–10): homepage polish before the Phase 5 domain cutover — social presence (Instagram icon in the header nav), visual consistency (square toggle border), a mobile full-bleed hero regression fix, per-gallery description text (replacing the generic byline, in both carousel and grid-hover form), progressive/optimized image loading, and a structural consolidation of the homepage header with the shared About/Contact header plus a simplified language switcher. Phases are sequenced by blast radius: small, contained homepage-only fixes first (Phase 7), a content-model addition shared across two display modes next (Phase 8), a self-contained performance change (Phase 9), and the higher-risk shared-component refactor last (Phase 10) — so the header/toggle groundwork laid in Phase 7 is carried forward into the unified component once, rather than rebuilt twice.

It also covers the **v1.3 milestone "Éditions"** (Phases 11–14): a dedicated, non-transactional showcase for Romane's paper éditions (zines/artist books), added as a new content type and route tree alongside the existing Portfolio galleries, with its own main-nav entry. The four phases are sequenced by dependency and blast radius, per direct research grounded in this codebase: the `edition` Sanity schema and seeded content come first since every later phase builds on that shape existing (Phase 11); the build-time data-fetch layer and bilingual overview/detail routes come next, verifiable in isolation before touching anything shared (Phase 12); nav wiring — the one part of this feature that touches every-page shared chrome (`SiteHeader`, rendered from two independent call sites) — comes third, once the routes it points to already exist and work (Phase 13); and a dedicated verification/UAT pass closes the milestone, because this feature's dominant risk class is omission bugs (a missed locale, a missed sitemap entry, a missed nav call site) that don't fail loudly and need an explicit checklist rather than incidental testing (Phase 14). Selling éditions (price, stock, checkout) remains deferred to the future v1.x shop/checkout milestone.

It also covers the **v1.4 milestone "Editorial Design Consistency"** (Phases 15–16): extending the giant-title `PageTitleHeader` identity already established on Contact and Éditions to the two remaining pages still showing the old treatment. Phase 15 covers the About page: first the mechanical `PageTitleHeader` title swap (ABOUT-03), then a broader layout rework (ABOUT-04) explored via multiple sketched proposals before implementation — the same process already used for the Contact page redesign this session — kept as a single phase because both requirements touch the same file (`AboutPageBody.astro`) and are sequential steps toward one end state: an About page that reads as a coherent editorial composition, not a title swap grafted onto an unchanged layout. Phase 16 covers the 404 page (ERR-01): originally scoped as a visual-only redesign reusing the shared `PageTitleHeader` component, this was revised during `/gsd-discuss-phase 16` (2026-07-29) into a fully custom, interactive concept instead — a full-bleed backdrop of Romane's photography popping at a pointer/touch-proximity-driven rate, with the AJS logo, a small "404" marker, and the bilingual message centered over a dimming scrim (see `16-CONTEXT.md`). No backend or content-model changes anywhere in this milestone — pure Astro component/CSS/vanilla-JS work.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Bilingual Infrastructure** - Site scaffolding (Astro + OVH Web Hosting + Sanity) deployed with working FR/EN routing and a persistent language switcher (completed 2026-07-06)
- [x] **Phase 2: Portfolio Galleries** - Visitors can browse migrated galleries and full-size images; Romane can self-serve gallery edits via the CMS (completed 2026-07-07)
- [x] **Phase 3: About & Contact** - Visitors can read Romane's bio/practice info and reach her through a spam-protected contact form (reopened 2026-07-08 — verification found the About page ships placeholder-only content; gap-closure plan 03-03 added) (completed 2026-07-08)
- [x] **Phase 4: Legal & Compliance** - Mentions légales, privacy/GDPR notice, and CNIL-compliant cookie consent are live (completed 2026-07-08)
- [x] **Phase 04.1: Design System & Homepage Refresh (INSERTED)** - Adopt the imported design system's rebrand and rebuild the homepage per the imported prototype (completed 2026-07-10)
- [x] **Phase 04.2: Social Media Links (INSERTED)** - Instagram link visible in the footer and on the About/Contact page (completed 2026-07-10)
- [x] **Phase 04.3: Homepage Refinements (INSERTED)** - Logo hover crossfade, single gallery-browsing entry point, icon-based mode toggle, mobile hero fix, three-line wordmark, clickable gallery names (completed 2026-07-12)
- [ ] **Phase 5: Launch & Domain Cutover** - The new site is live at atelierjacquelinesuzanne.fr, replacing the old Myportfolio site
- [x] **Phase 6: Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout** - Unified carousel/grid toggle button, grid view's hero becomes the first grid tile, and the wordmark gets a transparent photo-cutout treatment (completed 2026-07-13)
- [x] **Phase 7: Homepage Quick Fixes & Mobile Hero Correctness** - Instagram icon in the header nav, square toggle border, and a fix for the mobile full-bleed hero regression (completed 2026-07-13)
- [x] **Phase 8: Gallery Descriptions** - Each gallery's own description text replaces the generic byline under its title, and reveals on hover in grid mode (completed 2026-07-14)
- [x] **Phase 9: Progressive Homepage Image Loading** - Homepage photos load with priority and a blur-to-sharp transition, with no blocking full-screen loader (completed 2026-07-14)
- [x] **Phase 10: Unified Header & Simplified Language Switcher** - Homepage header consolidated into the shared About/Contact header component; language switcher shows only the other language plus a globe icon (completed 2026-07-17)
- [x] **Phase 11: Schema & Content Model** - A dedicated `edition` Sanity content type exists, seeded with real éditions content, ready for the site to fetch and render (completed 2026-07-22)
- [x] **Phase 12: Data-Fetch Layer & Routes** - Visitors can browse an Éditions overview page and open per-édition detail pages, bilingually, with zero commerce affordances (completed 2026-07-22)
- [x] **Phase 13: Nav Integration** - Visitors can discover Éditions from the main site nav on every page, without it appearing on the homepage's photography carousel/grid (gaps found 2026-07-23 — see 13-VERIFICATION.md) (completed 2026-07-23)
- [x] **Phase 14: Verification & UAT** - The Éditions feature closes with no omission-class gaps (locale, sitemap, nav call sites) and the "no commerce" boundary confirmed to hold (completed 2026-07-23)
- [x] **Phase 15: About Page Editorial Redesign** - About page's title and broader layout adopt the shared PageTitleHeader editorial identity, via a sketch-explored layout redesign (completed 2026-07-29)
- [ ] **Phase 16: 404 Page Editorial Redesign** - The 404 fallback page gets a fully custom, interactive redesign: full-bleed photo backdrop popping at a pointer/touch-proximity-driven rate, centered AJS logo/404 marker/bilingual message (revised from the original PageTitleHeader-reuse plan, per user direction 2026-07-29 — see `16-CONTEXT.md`)

## Phase Details

### v1.0 MVP (Phases 1-4, 04.1-04.3) — SHIPPED 2026-07-12

Full phase details (goals, dependencies, requirements, success criteria, wave/plan breakdowns) archived at `.planning/milestones/v1.3-ROADMAP.md` (full-project snapshot taken at v1.3 close, before this collapse). Summary: Astro 7 + Sanity bilingual (FR/EN) foundation, self-serve-editable portfolio galleries, About + spam-protected contact form, baseline French/EU legal pages (Phases 1-4), then three inserted phases — the imported design-system rebrand and hero-carousel/grid-toggle homepage (04.1), site-wide Instagram link (04.2), and a homepage refinement pass: logo hover crossfade, single gallery-browsing entry point, icon toggle, mobile hero fix, three-line wordmark, clickable gallery titles (04.3). 13/14 v1 requirements shipped (PORT-01..03, ABOUT-01/02, I18N-01/02, CMS-01, CONT-01/02, LEGAL-01/03/05); see `.planning/MILESTONES.md` for the full shipped entry and accomplishments. Phase 5 (LAUNCH-01) is deliberately NOT part of this shipped set — see below.

### Phase 5: Launch & Domain Cutover

**Goal**: The new site fully replaces the old Myportfolio site at the live domain, with no unplanned downtime or broken email.
**Mode:** mvp
**Depends on**: Phase 2, Phase 3, Phase 4, Phase 04.1, Phase 04.2
**Requirements**: LAUNCH-01
**Success Criteria** (what must be TRUE):

  1. Visiting atelierjacquelinesuzanne.fr serves the new site, not the old Myportfolio site.
  2. Any existing email service tied to the domain (MX records) continues to work after cutover.
  3. The DNS cutover was rehearsed/verified (e.g., staging alias tested, TTLs lowered in advance) before the production switch.

**Plans**: TBD

### v1.1 Homepage Refinements (Phase 6) — SHIPPED 2026-07-13

Full phase details archived at `.planning/milestones/v1.3-ROADMAP.md`. Summary: a single unified carousel/grid toggle button (HOME-01), grid view's hero rendering as the first grid tile itself rather than a separate band (HOME-02), and the wordmark's transparent photo-cutout effect revealing the hero photo through its own letterforms (HOME-03) — plus a live post-checkpoint follow-on (mobile full-bleed hero, dashed swipe/keyboard nav). 3/3 v1.1 requirements shipped; see `.planning/MILESTONES.md` for the full shipped entry and accomplishments.

### v1.2 Homepage Polish, Pre-Launch (Phases 7-10) — SHIPPED 2026-07-20

Full phase details archived at `.planning/milestones/v1.3-ROADMAP.md`. Summary: Instagram icon nav link + square mode-toggle border (HOME-04, HOME-05); a root-caused, view-transition-first fix for a real-device mobile full-bleed hero regression (HOME-06); per-gallery description text replacing the generic byline, in both carousel and grid-hover form (HOME-07, HOME-08); progressive image loading — priority hero load, blur-to-sharp transitions, lazy grid tiles, no blocking full-screen loader (HOME-09); and a single shared `<SiteHeader>` component consolidating the homepage and About/Contact headers, plus a simplified one-link-plus-globe language switcher (HOME-10, I18N-04), including a UAT gap-closure removing a duplicate back-home link overlapping the header logo. 8/8 v1.2 requirements shipped; see `.planning/MILESTONES.md` for the full shipped entry and accomplishments.

### v1.3 Éditions (Phases 11-14) — SHIPPED 2026-07-23

Full phase details (goals, dependencies, requirements, success criteria, wave/plan breakdowns) archived at `.planning/milestones/v1.3-ROADMAP.md`. Summary: a dedicated, non-transactional showcase for Romane's paper éditions (zines/artist books), added as a new content type and route tree alongside the existing Portfolio galleries, with its own main-nav entry — Phase 11 (schema/content model) → Phase 12 (data-fetch layer/routes) → Phase 13 (nav integration) → Phase 14 (verification/UAT). All 8 requirements (EDN-01..07, CMS-04) shipped; see `.planning/MILESTONES.md` for accomplishments.

### Phase 15: About Page Editorial Redesign

**Goal**: The About page adopts the same giant-title editorial identity as Contact/Éditions — both in its title treatment and its broader supporting layout — closing the visual gap this milestone targets.
**Depends on**: Nothing (uses the already-shipped `PageTitleHeader` component; independent of Phase 14)
**Requirements**: ABOUT-03, ABOUT-04
**Success Criteria** (what must be TRUE):

  1. About page's title renders via the shared `PageTitleHeader` component — same display font, size, position, halftone texture, and hairline divider as Contact and Éditions.
  2. About page's supporting layout (portrait treatment, hero photo, section structure) reads as one coherent, modern editorial composition aligned with the Contact/Éditions identity — not the old layout with just a new title bolted on.
  3. The implemented layout direction was chosen from multiple sketched proposals (the same design-exploration process used for the Contact page redesign), not a single unreviewed guess.
  4. About page's existing bio/practice copy is fully preserved — only presentation changes, no content rewrite.
  5. About page renders correctly in both French and English.

**Plans**: 4/4 plans complete
**Wave 1**

- [x] 15-01-PLAN.md — About-page layout sketch exploration (2-3 variants → named winner; resolves D-05/D-07) [Wave 1]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 15-02-PLAN.md — PageTitleHeader integration + static editorial composition (ABOUT-03 + ABOUT-04 static layer) [Wave 2]

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 15-03-PLAN.md — Pinned scroll-reveal hero motion + reduced-motion/mobile/no-JS fallbacks (ABOUT-04 motion layer) [Wave 3]

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 15-04-PLAN.md — Full-gate + human-verify against all 5 success criteria [Wave 4]

**UI hint**: yes

### Phase 16: 404 Page Editorial Redesign

**Goal**: The 404 fallback page becomes a fully custom, interactive redesign: a full-bleed backdrop of Romane's photography popping (hard-cutting) at a pointer/touch-proximity-driven rate, with the AJS logo, a small "404" marker, and the bilingual "Page introuvable / Not found" message centered over a dimming scrim.
**Depends on**: Nothing (fully custom implementation reusing existing logo assets and the DetailHero scrim pattern; independent of Phase 15)
**Requirements**: ERR-01
**Success Criteria** (what must be TRUE):

  1. Full-bleed background of Romane's photography, one photo at a time, hard-cutting between photos — not the bare current fallback, not the `PageTitleHeader` treatment.
  2. Photo-change rate is driven by pointer/touch distance from the screen's center (closer = faster, farther = slower), capped at roughly 3 changes/second maximum for photosensitive safety.
  3. Centered over a dimming scrim: the AJS logo, a small "404" marker, the bilingual "Page introuvable / Not found" phrase, and the "Retourner à l'accueil" / "Return home" links side by side.
  4. `prefers-reduced-motion` shows a slow, constant drift instead of pointer-driven popping.
  5. 404 page renders correctly in both French and English (both languages shown together on every load, since this page has no per-locale routing).

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16

Note: Phase 6 (v1.1) is intended to execute before Phase 5's domain cutover per PROJECT.md — see the Note under Phase 6 above. Phases 7–10 (v1.2) are likewise intended to execute before Phase 5, per PROJECT.md's current-milestone note. Phases 11–14 (v1.3 "Éditions") are new work continuing after Phase 10; Phase 5 (Launch & Domain Cutover) remains separately tracked, not started, and not part of this milestone. Phase numbering reflects milestone-arrival order, not strict execution sequence. Phases 15–16 (v1.4 "Editorial Design Consistency") are new work continuing after Phase 14; Phase 5 (Launch & Domain Cutover) remains separately tracked, not started, and not part of this milestone.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Bilingual Infrastructure | 5/5 | Complete   | 2026-07-06 |
| 2. Portfolio Galleries | 4/4 | Complete    | 2026-07-07 |
| 3. About & Contact | 3/3 | Complete    | 2026-07-08 |
| 4. Legal & Compliance | 3/3 | Complete    | 2026-07-08 |
| 5. Launch & Domain Cutover | 0/TBD | Not started | - |
| 6. Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout | 1/1 | Complete   | 2026-07-13 |
| 7. Homepage Quick Fixes & Mobile Hero Correctness | 2/2 | Complete    | 2026-07-13 |
| 8. Gallery Descriptions | 1/1 | Complete   | 2026-07-14 |
| 9. Progressive Homepage Image Loading | 2/2 | Complete    | 2026-07-14 |
| 10. Unified Header & Simplified Language Switcher | 4/4 | Complete    | 2026-07-17 |
| 11. Schema & Content Model | 2/2 | Complete    | 2026-07-22 |
| 12. Data-Fetch Layer & Routes | 3/3 | Complete    | 2026-07-22 |
| 13. Nav Integration | 2/2 | Complete    | 2026-07-23 |
| 14. Verification & UAT | 4/4 | Complete    | 2026-07-23 |
| 15. About Page Editorial Redesign | 4/4 | Complete    | 2026-07-29 |
| 16. 404 Page Editorial Redesign | 0/TBD | Not started | - |

## Milestone Scope Note

This roadmap covers the **v1 milestone "MVP"** (Phases 1–5 — Phases 1-4/04.1/04.2/04.3 shipped and formally closed 2026-07-12; Phase 5 launch/domain cutover deliberately deferred, not started — see `.planning/MILESTONES.md`), the **v1.1 milestone** (homepage refinements, Phase 6 — HOME-01, HOME-02, HOME-03 — shipped and archived 2026-07-13), the **v1.2 milestone** (homepage polish/pre-launch, Phases 7–10 — HOME-04..HOME-10, I18N-04 — shipped and archived 2026-07-20), and the **v1.3 milestone "Éditions"** (Phases 11–14 — EDN-01..EDN-07, CMS-04 — shipped and archived 2026-07-23; full detail at `.planning/milestones/v1.3-ROADMAP.md`). It also covers the **v1.4 milestone "Editorial Design Consistency"** (Phases 15–16 — ABOUT-03, ABOUT-04, ERR-01 — in progress, not yet shipped). v1.0/v1.1/v1.2 were formally closed retroactively on 2026-07-27 (full accomplishments in `.planning/MILESTONES.md`); their phase detail lives in the same `.planning/milestones/v1.3-ROADMAP.md` full-project snapshot since no earlier snapshot existed. The v1.x wave — exhibitions/agenda (EXHB-01, EXHB-02, CMS-02), shop (SHOP-01..04, building on the v1.3 `edition` content model), checkout (CHK-01..05), shipping (SHIP-01, SHIP-02), commerce-specific legal (LEGAL-02, LEGAL-04), the Éditions cross-link differentiator (EDN-08), and related bilingual/CMS extensions (I18N-02b, I18N-03, CMS-03) — is tracked in `.planning/REQUIREMENTS.md`'s v2 section and will get its own roadmap phases once scoped via `/gsd-new-milestone`.
