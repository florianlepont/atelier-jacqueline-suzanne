# Milestones

## v1.5 Global Improvements & Bug Fixes (Shipped: 2026-08-03)

**Phases completed:** 3 phases, 5 plans, 13 tasks

**Key accomplishments:**

- Removed pointer-hover auto-advance pause and the 2-line intro-paragraph clamp in `HomeCarousel.astro`, plus a `:focus-visible`-gated blur fix for a dash-click focus-lock regression the hover removal exposed.
- Removed the native-button UA-stylesheet border bleeding through GalleryGrid.astro's `.tile` rule after deleting the frame declaration, and restored the site footer on both gallery detail routes by omitting the now-unused `hideFooter` prop — both changes locked by inverted/new Playwright assertions covering masonry and bento grid modes.
- Removed `.detail-hero__statement`'s 4-line CSS clamp with no substitute cap, replacing it with an empirically-calibrated 700-character Sanity Studio validation applied in lockstep to both `gallery.ts` and `edition.ts`, proven by Playwright across every published gallery at two viewports and by a source-text unit test guarding the two duplicated schema helpers against divergence.
- Fixed a broken Astro `:global()` selector scope that silently prevented Éditions row-hover from ever recoloring the shared header (EDN-09), and added 16px horizontal padding to Contact's link rows without shrinking the black hover-fill (CONT-03) — both proven by new, transition-aware e2e coverage.
- Replaced PageTitleHeader's `overflow-x: clip` with viewport-relative geometry (`calc(50% - 50vw)`) so the halftone dot-texture bleeds to the true browser edge on Contact/About/Éditions again, proven safe by a 18-test regression net written before the change and a pre-existing single-word-heading overflow bug found and fixed along the way.

---

## v1.4 Editorial Design Consistency (Shipped: 2026-08-01)

**Phases completed:** 2 phases, 7 plans, 17 tasks

**Key accomplishments:**

- Sketch 014 presents 3 About-page layout variants resolving D-05 (hero-photo reveal) and D-07 (sections structure); user picked Variant A — pure settle hero + re-skinned two-column grid — on first review with no feedback rounds.
- About's giant title now renders via the shared PageTitleHeader component (retiring the local eyebrow/h1), and the resting layout below it matches the sketch-014 Variant A winner: standalone lead paragraph + circular portrait bio-row, static hero band, re-skinned two-column numbered sections.
- Ported DetailHero.astro's dependency-free scroll-driver into a smaller, About-scoped instance that pins and shrinks the exhibition photo to ~86% width (sketch-014's pure-settle D-05), with matching reduced-motion and mobile CSS fallbacks and new Playwright motion-state coverage.
- About page adopts PageTitleHeader with sketch-014 Variant A composition and scroll-scrubbed hero reveal; UAT caught and fixed a title-position regression before sign-off.
- Pure `proximityToInterval` module (350/2200/4000ms constants) proving the WCAG-adjacent ≈3/sec photosensitive-safety cap as a unit-tested invariant, ready for plan 16-03's client engine to import.
- Full-bleed 404 page with a build-time-sourced photo pool, opacity/z-index hard-cut background stack, radial scrim, and centered bilingual content — the no-JS-safe static shell the plan 16-03 pop-rate engine will animate.
- Pointer/touch-proximity-driven pop-rate engine layered onto the static 404 shell, hard-capped at a finite floor that the user explicitly raised live at the checkpoint from ~2.86/sec to ~6.7/sec (a knowing WCAG 2.3.1 tradeoff), with a reduced-motion branch that deliberately drifts instead of freezing.

---

## v1.0 MVP (Shipped: 2026-07-12)

**Delivered:** A custom Astro + Sanity bilingual (FR/EN) replacement for the old Myportfolio site — portfolio galleries with self-serve editing, an About page, a spam-protected contact form, baseline French/EU legal pages, and (via three inserted phases) the imported design-system rebrand and a real hero-carousel/grid-toggle homepage — deployed to GitHub Pages staging on every push.

**Phases completed:** 7 phases (1, 2, 3, 4, 04.1, 04.2, 04.3), 25 plans, ~60 tasks
**Requirements:** 13/14 v1 requirements shipped (PORT-01..03, ABOUT-01/02, I18N-01/02, CMS-01, CONT-01/02, LEGAL-01/03/05) — see `.planning/milestones/v1.3-REQUIREMENTS.md` for the full historical table
**Git range:** `6411501`..`1b0593a` (217 commits, 2026-07-05 → 2026-07-12, 791 files changed, +199496/-6)
**Closeout type:** override_closeout — Phase 5 (Launch & Domain Cutover, requirement LAUNCH-01) intentionally not shipped; see Known Gaps below. This entry was written retroactively on 2026-07-27, alongside v1.1 and v1.2, closing a gap the v1.3 retrospective itself flagged: those two milestones had shipped weeks earlier with no formal archive/tag.
**Known gaps:** Phase 5 "Launch & Domain Cutover" (LAUNCH-01) — the live DNS cutover to atelierjacquelinesuzanne.fr, replacing the old Myportfolio site — is **deliberately deferred, not abandoned**. Direct user decision (2026-07-27): *"cancel the initial plan to deliver and publish the website officially... we'll do it later."* The site has instead kept shipping and improving on GitHub Pages staging through v1.1/v1.2/v1.3 (and beyond); Phase 5 remains open in ROADMAP.md and will be picked up when launch is next prioritized.

**Key accomplishments:**

- Astro 7 static site (no SSR adapter, OVH-hosting-compatible) with built-in i18n routing (fr/en), a Playwright + Vitest test harness, and a GitHub Actions CI/CD pipeline deploying to GitHub Pages staging on every push.
- Sanity CMS wired in with a locale-aware `siteSettings` singleton, giving Romane a real headless-CMS foundation for every later content type.
- Portfolio galleries: browsable by project/series (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, etc.), full-size lightbox viewing, per-gallery artist statements, and fully self-serve add/edit/reorder via the CMS (CMS-01) — verified with Romane directly.
- Bilingual About page (bio + atelier/practice info) and a spam-protected (honeypot) contact form, both FR/EN.
- Mentions légales, privacy/GDPR notice, and a CNIL-compliant cookie consent banner shipped ahead of any public launch.
- Adopted the imported design system's monochrome + pop-pink rebrand and replaced the placeholder "under construction" homepage with a real hero-carousel/grid-toggle entry point (Phase 04.1).
- Instagram link added site-wide, in the footer and on About/Contact (Phase 04.2).
- Homepage refinement pass: logo hover crossfade, the grid view established as the single gallery-browsing entry point (standalone `/galleries` page removed), icon-based mode toggle, a real-device mobile hero-visibility fix, a three-line wordmark treatment, and clickable gallery titles (Phase 04.3).

## v1.1 Homepage Refinements (Shipped: 2026-07-13)

**Delivered:** The homepage's view-mode control, grid layout, and hero wordmark became one coherent surface — a single toggle, a grid view whose first tile *is* the hero, and a wordmark that reveals the hero photo through its own letterforms.

**Phases completed:** 1 phase (6), 1 plan, 6 tasks
**Requirements:** 3/3 v1.1 requirements shipped (HOME-01, HOME-02, HOME-03) — see `.planning/milestones/v1.3-REQUIREMENTS.md` for the full historical table
**Git range:** `6eed4af`..`8fd6802` (17 commits, 2026-07-12 → 2026-07-13, 18 files changed, +1829/-230)
**Closeout type:** verified_closeout — all Phase 6 work complete and verified at the time.
**Known gaps:** None within v1.1's own scope. This entry was written retroactively on 2026-07-27 — see the v1.0 entry above for why.

**Key accomplishments:**

- Single unified carousel/grid toggle button, replacing two separate mode buttons, with a clear visible-active-mode state (HOME-01).
- Grid view's hero (wordmark + intro paragraph, no CTA) now renders as the first tile inside the grid itself, not as a separate full-width band above it (HOME-02).
- The "Atelier Jacqueline Suzanne" wordmark gained its signature transparent photo-cutout effect in carousel mode — the hero photo visible through the letterforms — the foundation the whole session's later wordmark-tracking work (mirrored-peek, clamp fixes) built on (HOME-03).
- A live post-checkpoint follow-on folded in the same session: mobile full-bleed hero fix and a dashed swipe/keyboard progress nav.
- A same-day quick follow-up (260713-hcj) extended the wordmark cutout to the mobile grid-mode hero tile for visual consistency.

## v1.2 Homepage Polish, Pre-Launch (Shipped: 2026-07-20)

**Delivered:** The remaining homepage UX rough edges resolved ahead of the (still-pending) domain cutover — social presence, visual consistency, a mobile regression fix, real per-gallery description content, progressive image loading, and a single shared header component site-wide.

**Phases completed:** 4 phases (7, 8, 9, 10), 9 plans, ~15 tasks
**Requirements:** 8/8 v1.2 requirements shipped (HOME-04..HOME-10, I18N-04) — see `.planning/milestones/v1.3-REQUIREMENTS.md` for the full historical table
**Git range:** `eb0215d`..`580daa3` (170 commits, 2026-07-13 → 2026-07-20, 188 files changed, +34245/-1575)
**Closeout type:** verified_closeout — all Phases 7-10 work complete and verified at the time.
**Known gaps:** None within v1.2's own scope. This entry was written retroactively on 2026-07-27 — see the v1.0 entry above for why.

**Key accomplishments:**

- Instagram icon (not text) link in the header nav, and a square (not rectangular) mode-toggle border (HOME-04, HOME-05).
- Root-caused and fixed a real-device mobile full-bleed hero regression via a view-transition-first fix (HOME-06).
- Each gallery's own description text now replaces the generic "Un projet de Romane Lepont" byline — shown under the title in carousel mode, revealed on hover/focus in grid mode — backed by a real per-gallery Sanity field Romane can edit herself (HOME-07, HOME-08).
- Progressive homepage image loading: the page shell renders immediately with no blocking full-screen loader, the hero photo loads with priority and a blur-to-sharp transition, and below-the-fold gallery tiles stay lazy (HOME-09).
- Extracted a single shared `<SiteHeader>` component rendering identically on the homepage and About/Contact (eliminating two independently-styled header implementations), and simplified the language switcher to one other-language link plus a globe icon (HOME-10, I18N-04).
- Gap-closure: removed a duplicate back-home link that overlapped the SiteHeader logo on gallery-detail pages, found during UAT.

## v1.3 Éditions (Shipped: 2026-07-23)

**Delivered:** A dedicated, non-transactional Éditions showcase (bilingual overview + detail pages, Sanity-editable, zero commerce affordance) sits alongside the existing Portfolio, discoverable from the main nav on every page.

**Phases completed:** 4 phases (11-14), 11 plans, 23 tasks
**Requirements:** 8/8 v1.3 requirements shipped (EDN-01..07, CMS-04) — see `.planning/milestones/v1.3-REQUIREMENTS.md`
**Git range:** `cbd71f7`..`1b40054` (108 commits, 2026-07-22 → 2026-07-23, 81 files changed, +10504/-79)
**Closeout type:** override_closeout — 11 pre-close audit items acknowledged as deferred (mostly stale status flags on already-shipped Phase 03/04.1 work plus 6 out-of-scope quick tasks); see STATE.md Deferred Items for the full list.
**Known gaps:** None within v1.3's own scope. Not yet done (tracked separately, out of this milestone): the branch this milestone shipped on has not been merged to `main`, so the live GitHub Pages site does not yet reflect it (see 14-04-SUMMARY.md); Phase 5 (Launch & Domain Cutover, part of the still-open v1.0 milestone) remains pending.

**Key accomplishments:**

- New `edition` Sanity document type (mirroring `gallery.ts`'s editorial workflow) with a dedicated `leadPhoto` field and typed/grouped format details (`pageCount`, `printRun`, `dimensions`), registered and wired as an orderable "Éditions" desk item, plus the Confirmed Rebut gallery↔édition naming resolution recorded in PROJECT.md.
- Deployed the `edition` schema to Romane's hosted Sanity Studio and seeded the first real, published "Rebut" édition through it — proving the unassisted create/edit/publish workflow required by CMS-04.
- Build-time `Edition`/`EditionImage` GROQ data-fetch layer in `src/lib/sanity.ts` (mirroring `Gallery`, with the corrected filter and no `seo` field) plus bilingual `/editions/` and `/en/editions/` overview routes rendering a vertical zigzag editorial list from real published Sanity content.
- FR/EN `/editions/{slug}/` detail routes mirroring `galleries/[slug].astro`, with a clickable hero opening the reused Lightbox on a combined `[leadPhoto, ...images]` array, a compact format-details line, and an in-flow back-link — zero commerce affordances.
- Extended `sitemap.xml.ts` to emit Éditions overview + per-édition detail URLs in both locales, and converted EDN-06's "no commerce affordance" boundary into a build-blocking `verify-static-artifact.mjs` guard with word-boundary-aware forbidden-string matching (fixing a real false-positive against seeded French alt text).
- Wired a bilingual, Sanity-editable "Éditions" nav link as the first entry in the shared `<SiteHeader>` component, present on every page (homepage, gallery pages, About, Contact) in both call sites — no changes needed to the mobile-fit CSS.
- CSS breakpoint fix (nowrap across 767px block + trim ceiling raised to 400px) closes the 360-390px header wrap regression; RED->GREEN e2e proven across 6 widths x 2 variants; live human re-verification (Task 3) approved by the real user — plan closed.
- Applied the WR-03 `?.`/`?? ''` guard idiom to every remaining unguarded nested/array field access on the four Éditions page files (lightbox-images spread, dimensions/pageCount/printRun, images-grid length/map, overview statement), closing the whole-build DoS risk from a single malformed édition document.
- Extended the existing build-blocking EDN-06 commerce-string scan (`tests/scripts/verify-static-artifact.mjs`) to also read `sanity/schemas/edition.ts` as source text and run it through the same reused token arrays/helper, closing the schema-copy blind spot PITFALLS.md flagged.
- Re-ran the full direct-check suite (build, unit, e2e, artifact guard) plus targeted sitemap/nav-link/schema greps in this worktree, then wrote a 7-item closure map against `PITFALLS.md`'s "Looks Done But Isn't" checklist — 5 items fully closed with fresh evidence, 2 items (Studio drag-reorder, a forward-looking schema code comment) honestly reported as partially closed rather than rounded up, and confirmed REQUIREMENTS.md's bookkeeping is already resolved with no edit needed.
- French Studio checklist for Romane plus a completed, independently cross-checked real content-editing pass (create/edit/publish/drag-reorder on a genuine second édition, "Silos") — closing ROADMAP success criterion #3 and the drag-reorder gap `11-UAT.md` waived.

---
