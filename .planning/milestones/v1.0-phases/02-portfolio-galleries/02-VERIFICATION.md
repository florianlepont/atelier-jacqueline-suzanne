---
phase: 02-portfolio-galleries
verified: 2026-07-07T19:31:00Z
status: passed
score: 4/4 roadmap success criteria verified (1 via override)
overrides_applied: 1
overrides:
  - must_have: "All known projects are migrated in this phase — no subset-now/rest-later split (D-13); real migrated content for all known projects is live"
    reason: "The full content-migration pipeline (Lightroom export → Studio batch drag-drop → bilingual alt text → bilingual statement → publish) is proven working end-to-end with 2 real, live galleries (Silos, Brume) — browsing, full-size viewing, bilingual statements, and unassisted CMS-01 editing are all independently verified against real content and a real device. Migrating the remaining known projects (Rebut, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO) is now a known, repeatable, low-risk content task with no further code dependency, and is deferred to follow-up work outside the phase gate rather than blocking progress to Phase 3."
    accepted_by: "florian"
    accepted_at: "2026-07-07T21:35:00Z"
gaps:
  - truth: "Visitor can browse a list of gallery/project pages migrated from the current site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.)"
    status: partial
    reason: "Only 2 of the ~8 known real-world projects (Silos, Brume) are published in Sanity. The browsing/listing/detail code path is fully built, wired, and verified working end-to-end (Playwright green, live staging site returns 200 for /galleries/silos/ and /en/galleries/brume/, statements render bilingually) — but the roadmap's literal success criterion names 8 specific projects, and Plan 02-03's own must_haves truth ('Real migrated content for all known projects is live') and 02-CONTEXT.md's D-13 decision ('All known projects are migrated in this phase — no subset-now/rest-later split') were not met. 02-03's Task 3 content-migration checkpoint was closed out (commit e812e11: 'Silos and Brume published...') with only 2/8 projects rather than being re-opened or explicitly re-scoped."
    artifacts:
      - path: "Sanity dataset (gallery documents)"
        issue: "Only 'silos' and 'brume' slugs exist as published gallery documents; Rebut, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO are absent. One draft-only 'Adults' document (title only, no images) exists but is correctly excluded from the build via perspective:'published'."
    missing:
      - "Published gallery documents (with real images, bilingual alt text, bilingual statement) for: Rebut, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, and any other known projects from the live Myportfolio site."
      - "A decision on the unfinished 'Adults' Studio draft (title only) — finish or discard."
human_verification: []
---

# Phase 2: Portfolio Galleries Verification Report

**Phase Goal:** Visitors can browse Romane's photographic work by project/series and view full-size images; Romane can independently add and edit galleries without code.
**Verified:** 2026-07-07T19:31:00Z
**Status:** passed (1 override applied)
**Re-verification:** No — initial verification, override applied same session

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can browse a list of gallery/project pages migrated from the current site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.) | ✓ PASSED (override) | Code capability fully verified: `getGalleries()` → `GALLERIES_QUERY` (`order(orderRank)`) → `GalleryGrid`/`GalleryCard` render correctly; `npm run build` emits `dist/galleries/index.html`, `dist/galleries/silos/`, `dist/galleries/brume/` (+ EN equivalents); live staging (`https://florianlepont.github.io/ajs-website/galleries/`) returns HTTP 200 and shows the 2 published galleries in manual order. Only **Silos** and **Brume** are published — 6 of the 8 named projects remain to migrate. Override accepted by florian on 2026-07-07: the migration pipeline is proven end-to-end; remaining projects are follow-up content work, not a phase blocker. See frontmatter `overrides`. |
| 2 | Visitor can open a gallery and view full-size images (lightbox or dedicated view) | ✓ VERIFIED | `src/components/Lightbox.astro` implements a native `<dialog>` island with `showModal()`/`close()`, prev/next buttons, `ArrowLeft`/`ArrowRight` keydown handling, touchstart/touchend swipe (50px threshold + horizontal-dominance guard), `aria-live="polite"` counter, and focus-return-to-trigger on `close`. Wired into both `src/pages/galleries/[slug].astro` and the EN counterpart via `data-gallery-thumb`/`data-index` hooks. `npx playwright test tests/e2e/gallery.spec.ts -g lightbox` passes (opens on click, ArrowRight advances counter, Escape closes + returns focus). Live staging site confirmed reachable (200) for gallery detail pages. |
| 3 | Visitor can read a short artist statement for each gallery/project, in both French and English | ✓ VERIFIED | `gallery.statement.{fr,en}` required at the Studio schema level (`localeTextField`, both `rule.required()`); rendered at `.gallery-detail__statement` on both `[slug].astro` pages. Verified in built HTML: FR `/galleries/silos/` renders "Dans les plaines silencieuses..."; EN `/en/galleries/silos/` renders "Across silent plains..." — confirmed distinct per-locale text via direct `dist/` HTML inspection. |
| 4 | Romane can log into the CMS and add, edit, or reorder gallery images and create a new gallery entry without developer help | ✓ VERIFIED | Schema/wiring inspected directly: `sanity/schemas/gallery.ts` has required `title`/`slug`/`statement`/`images` (`.min(1)`) with required per-image bilingual `alt`; `orderRankField({type:'gallery'})` (hidden) + `orderableDocumentListDeskItem` in `sanity/schemas/structure.ts` gives Studio drag-reorder. Per 02-04-SUMMARY.md and the task-launch context, Romane personally completed an unassisted create/edit/reorder cycle in Studio against the live site and the checkpoint was explicitly approved by the user ("approveeddddd") — a human-verify signal, not a self-report narrative claim. |

**Score:** 4/4 roadmap success criteria verified; 3 fully verified, 1 passed via override (code proven, content migration for remaining projects deferred as follow-up).

### Plan-Level Must-Haves (supporting detail)

| Plan | Truth | Status | Evidence |
|------|-------|--------|----------|
| 02-01 | Romane can create a gallery doc and drag-reorder in Studio | ✓ VERIFIED | `orderableDocumentListDeskItem` wired in `structure.ts`; `orderRankField` on schema |
| 02-01 | Every gallery image requires FR+EN alt text before publish | ✓ VERIFIED | `alt` object with required `fr`/`en` string sub-fields attached directly to the `image`-type array member in `gallery.ts` (see deviation note below) |
| 02-01 | Downstream pages render Romane's manual order without extra code | ✓ VERIFIED | `GALLERIES_QUERY` = `*[_type=="gallery"] \| order(orderRank){...}`, consumed as-is by listing/detail pages |
| 02-02 | Site-wide Dawn Pink/Woodsmoke/Wild Strawberry tokens replace grayscale | ✓ VERIFIED | `BaseLayout.astro` `:root` has `--color-dominant:#F0E7E4`, `--color-accent:#F92D97`, `--color-ink:#141213`; body uses `--color-ink` (not accent) for text |
| 02-02 | "Galeries"/"Galleries" nav link sourced from Sanity | ✓ VERIFIED | `siteSettings?.navLabels?.galleries?.[locale]` with literal fallback, rendered as second `.nav-link` |
| 02-02 | Homepage heading at Display role | ✓ VERIFIED | `clamp(2.5rem, 12cqi, 6.5rem)` present in `src/pages/index.astro`/`en/index.astro` with `container-type: inline-size` |
| 02-02 | Links show accent underline; focus-visible double-ring | ✓ VERIFIED | `text-decoration-color: var(--color-accent)`; `:focus-visible` has both `outline: 2px solid var(--color-ink)` and `box-shadow: 0 0 0 4px var(--color-accent)` |
| 02-03 | Grid of gallery cover thumbnails in Wild Strawberry panels, manual order | ✓ VERIFIED | `GalleryCard.astro` renders cover + `.gallery-card__panel` (Wild Strawberry fill, Display-role title), `GalleryGrid` 1/3-col responsive |
| 02-03 | Click card → detail page (statement + thumbnail grid) | ✓ VERIFIED | `[slug].astro` via `getStaticPaths`, renders title panel + statement + thumbnail grid |
| 02-03 | Statement FR at `/galleries/{slug}`, EN at `/en/galleries/{slug}` | ✓ VERIFIED | Confirmed distinct text in built HTML (see truth 3 above) |
| 02-03 | **Real migrated content for all known projects is live** | ✓ PASSED (override) | Only 2/8 known projects published; override accepted (see frontmatter) — remaining projects deferred as follow-up content work |
| 02-04 | Lightbox open/prev/next/keyboard/touch/counter/close | ✓ VERIFIED | See truth 2 above |
| 02-04 | Focus moves in on open, returns to trigger on close | ✓ VERIFIED | Native `showModal()` + explicit `trigger?.focus()` on `close` event; e2e asserts this |
| 02-04 | Romane can create/edit/reorder unassisted | ✓ VERIFIED | See truth 4 above |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sanity/schemas/gallery.ts` | gallery document schema | ✓ VERIFIED | Present, `defineType`, required fields, `orderRankField` hidden |
| `sanity/schemas/objects/galleryImage.ts` | reusable bilingual-alt image object type | ⚠️ SUPERSEDED (documented) | File no longer exists — intentionally removed in commit `a05681e` ("attach gallery alt-text fields directly to image array member") because nesting `image` inside a wrapper object broke Studio's native multi-file drag-and-drop. Alt fields now live directly on the `image`-type array member in `gallery.ts`. The underlying truth (required bilingual alt text per image) still holds; only the file path from the original plan changed. This is a legitimate, well-reasoned deviation, not a stub. |
| `src/lib/sanity.ts` | `getGalleries`/`getGallery` typed query functions | ✓ VERIFIED | Both exported, null-safe, `order(orderRank)` present |
| `src/lib/image.ts` | `thumbnailUrl`/`fullSizeUrl` builders | ✓ VERIFIED | Both exported, correct crop/uncropped params |
| `tests/e2e/gallery.spec.ts` | e2e coverage for listing/detail/lightbox | ✓ VERIFIED | 3/3 tests pass (`npx playwright test tests/e2e/gallery.spec.ts`) |
| `tests/unit/gallery-query.test.ts` | query-function null-safety unit coverage | ✓ VERIFIED | Part of 13/13 passing Vitest suite |
| `src/components/GalleryCard.astro` | cover thumbnail + title panel link | ✓ VERIFIED | 96 lines, all acceptance-criteria greps confirmed |
| `src/components/GalleryGrid.astro` | responsive 1/3-col grid | ✓ VERIFIED | `@media (min-width: 768px)` 3-col rule present |
| `src/pages/galleries/index.astro` / EN | FR/EN listing pages | ✓ VERIFIED | Both exist, render grid + empty-state fallback |
| `src/pages/galleries/[slug].astro` / EN | FR/EN detail pages via `getStaticPaths` | ✓ VERIFIED | Both exist, `getStaticPaths` present |
| `src/components/Lightbox.astro` | native `<dialog>` lightbox island | ✓ VERIFIED | `showModal()` present, no hand-rolled focus trap (`grep -c "focus trap"` = 0) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `sanity/schemas/index.ts` | gallery schema | `schemaTypes` array | ✓ WIRED | `schemaTypes = [siteSettings, gallery]` (galleryImage merged into gallery per deviation above) |
| `sanity/schemas/structure.ts` | `@sanity/orderable-document-list` | `orderableDocumentListDeskItem` | ✓ WIRED | Present once, filter excludes both `siteSettings` and `gallery` |
| `src/lib/sanity.ts` | gallery documents | GROQ `order(orderRank)` | ✓ WIRED | Confirmed in `GALLERIES_QUERY` |
| `src/pages/galleries/index.astro` | `getGalleries()` | build-time fetch → `GalleryGrid` | ✓ WIRED | `await getGalleries()`, mapped to `<GalleryCard>` |
| `src/pages/galleries/[slug].astro` | `getStaticPaths` + gallery props | one static page per slug | ✓ WIRED | Confirmed via build output (`dist/galleries/silos/`, `dist/galleries/brume/`) |
| `GalleryCard.astro` | `thumbnailUrl()` | cover image 1:1 crop | ✓ WIRED | `thumbnailUrl(cover, 600)` |
| `[slug].astro` thumbnails | `Lightbox.astro` | click opens dialog with `fullSizeUrl` | ✓ WIRED | `<Lightbox images={gallery.images} locale={locale} />`, thumbnails carry `data-gallery-thumb`/`data-index` |
| `BaseLayout.astro` header | `siteSettings.navLabels.galleries` | localized nav link + fallback | ✓ WIRED | `navLabels?.galleries?.[locale] ?? ...` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `src/pages/galleries/index.astro` | `galleries` | `getGalleries()` → live Sanity `perspective:'published'` query | Yes — confirmed 2 real documents (Silos, Brume) returned via direct CDN query | ✓ FLOWING (but incomplete data set — see gap) |
| `src/pages/galleries/[slug].astro` | `gallery` (props from `getStaticPaths`) | same query, per-slug | Yes — real bilingual statement text confirmed in built HTML | ✓ FLOWING |
| `Lightbox.astro` | `slides` | `images` prop → `fullSizeUrl()` | Yes — build-time URLs embedded in static `<ul hidden>` data block | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests pass | `npx vitest run` | 13/13 passed | ✓ PASS |
| Gallery e2e suite passes | `npx playwright test tests/e2e/gallery.spec.ts` | 3/3 passed | ✓ PASS |
| Full e2e suite (regression) | `npx playwright test` | 10/10 passed | ✓ PASS |
| Production build succeeds | `npm run build` | 9 pages built, no errors | ✓ PASS |
| Live staging reachable | `curl -o /dev/null -w '%{http_code}' https://florianlepont.github.io/ajs-website/galleries/` (+ silos, en/brume) | 200 / 200 / 200 | ✓ PASS |
| Live Sanity dataset gallery count | direct GROQ query against Sanity CDN API | 2 published (`silos`, `brume`) + 1 unpublished draft (`Adults`, 0 images) | ✗ FAIL (against D-13/roadmap SC #1 literal scope) |
| `npx tsc --noEmit` clean for phase-2 files | `npx tsc --noEmit` | Pre-existing, documented, unrelated errors only (`process` types, `vitest.config.ts`) — no new errors from Phase 2 files | ✓ PASS (deferred, documented in `deferred-items.md`) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention or PLAN/SUMMARY-declared probes found for this phase. SKIPPED (no probe-based verification declared; Playwright/Vitest serve this role and were executed directly above).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|--------------|--------|----------|
| PORT-01 | 02-01, 02-02, 02-03 | Visitor can browse portfolio galleries grouped by project/series (migrated content) | ⚠️ PARTIAL | Browsing mechanism fully built and working; only 2/8 named projects' content migrated. REQUIREMENTS.md still shows PORT-01 as "Pending" — consistent with this partial state, not yet flippable to Complete. |
| PORT-02 | 02-04 | Visitor can view full-size images (lightbox) | ✓ SATISFIED | Lightbox built, wired, e2e-verified, human-verified on real device |
| PORT-03 | 02-01, 02-03 | Each gallery includes a short bilingual artist statement | ✓ SATISFIED (for the 2 live galleries) | Verified in built HTML for both locales |
| CMS-01 | 02-01, 02-04 | Romane can add/edit galleries without code | ✓ SATISFIED | Schema/Studio wiring verified + human-verified unassisted workflow |

**Note:** REQUIREMENTS.md (lines 12-14, 28) still marks PORT-01/PORT-02/PORT-03/CMS-01 as "Pending" (unchecked) despite ROADMAP.md marking Phase 2 "Complete" — this checkbox state has not been synced post-execution. Given PORT-01's partial status, "Pending" is arguably more accurate for PORT-01 specifically; PORT-02/PORT-03/CMS-01 checkboxes should be updated once the content-migration gap is resolved or explicitly accepted.

No orphaned requirements found — all four IDs mapped to Phase 2 in REQUIREMENTS.md are claimed across the four plans' `requirements` frontmatter.

### Anti-Patterns Found

`git grep` for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` across all Phase 2-modified files (components, pages, lib, schemas, layout) returned **zero matches**. The only "coming soon" style copy found (`Galeries à venir` / `Galleries coming soon`) is the intentional, spec'd empty-state fallback for when `getGalleries()` returns zero results — not a code stub, and correctly guarded behind `galleries.length > 0` conditional rendering.

No hardcoded empty-data anti-patterns found in components/pages; `GalleryCard`/`GalleryGrid`/`Lightbox`/detail pages all consume real props with null-safe optional-chaining fallbacks per WR-03.

### Human Verification Required

None outstanding. The two behaviors that would normally require human/device verification (CMS-01 unassisted Studio workflow, real-device touch-swipe feel) were already explicitly performed and approved by the user during Plan 02-04's Task 3 checkpoint, per 02-04-SUMMARY.md and the verification task's launch context — this is treated as a genuine human sign-off event, not a self-reported narrative claim.

### Gaps Summary

Phase 2's **technical/code delivery is complete and verified working**: all schemas, read-layer functions, components, pages, and the lightbox island exist, are correctly wired, pass 13/13 Vitest + 10/10 Playwright (including all 3 gallery-specific e2e tests), build cleanly, and are live and reachable on the deployed GitHub Pages staging site. CMS-01 (Romane's self-serve Studio workflow) was independently human-verified and approved.

The one real gap is **content completeness**: only 2 of the ~8 known real-world projects (Silos, Brume) have been migrated into Sanity as published galleries. Rebut, Adults, The Victorian Tea Room, Paysages, Accumulation, and MADO are not yet present. This directly contradicts:
- The roadmap's own Phase 2 Success Criterion #1, which names all 8 projects explicitly.
- Plan 02-03's own `must_haves` truth: "Real migrated content for all known projects is live."
- 02-CONTEXT.md's explicit decision D-13: "All known projects are migrated in this phase — no subset-now/rest-later split."

02-03's Task 3 content-migration checkpoint was closed out with only 2/8 projects (commit `e812e11`), without an explicit, documented decision to reduce scope from "all known projects" to "2 projects as a proof-of-concept." There is also one harmless open loose end: an unfinished "Adults" gallery draft (title only, no images) sitting in Sanity Studio — correctly excluded from the live build via `perspective: 'published'`, but should be finished or discarded.

**This looks like it could be intentional** (e.g., shipping incrementally and finishing content migration as ongoing work outside the phase-gate process) rather than a code defect. If that's the case, to accept this deviation, add to VERIFICATION.md frontmatter:

```yaml
overrides:
  - must_have: "Real migrated content for all known projects is live"
    reason: "Content migration for the remaining 6 projects (Rebut, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO) is accepted as ongoing/follow-up work outside the phase gate; the code capability to browse/view/edit galleries is fully proven with the 2 live galleries."
    accepted_by: "<name>"
    accepted_at: "<ISO timestamp>"
```

Absent that override, this phase should not be considered fully closed against its own roadmap success criterion #1 and D-13 decision.

---

*Verified: 2026-07-07T19:31:00Z*
*Verifier: Claude (gsd-verifier)*
