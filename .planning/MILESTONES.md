# Milestones

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
