# Phase 14: Verification & UAT - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

A cross-cutting closure pass over the entire Éditions milestone (Phases 11–13): confirms no omission-class gaps remain (every locale route, both `<SiteHeader>` nav call sites, sitemap entries) and that the "no commerce" boundary holds across the whole feature — including a real, hands-on content-editing pass by Romane herself in Sanity Studio, not just Florian's dev-side testing.

Owns no primary requirement — EDN-01..EDN-07 and CMS-04 are already implemented and independently verified "Complete" by Phases 11–13's own VERIFICATION.md reports (each re-ran its success criteria via direct command execution, not SUMMARY claims). Phase 14 does not re-implement or re-litigate that work; it closes the specific items those phases' own reports flagged as still-open, plus the milestone-level "Looks Done But Isn't" checklist from `.planning/research/PITFALLS.md`.

Does not touch: any new capability, the gallery↔édition cross-link (EDN-08, deferred to its own future v1.x phase), or Phase 5 (Launch & Domain Cutover, separately tracked and untouched by this milestone).

</domain>

<decisions>
## Implementation Decisions

**Note:** All four gray areas below were surfaced by Claude's analysis and explicitly delegated to Claude's judgment by the user ("I let you choose the best decisions on these points") rather than discussed point-by-point. Decisions are grounded in direct evidence gathered from prior phase VERIFICATION.md reports and direct code reads (not assumption) — see rationale under each.

### Verification approach: audit + close named gaps, not duplicate coverage
- **D-01:** Phase 14 does NOT write a new large consolidated test suite (e.g. a single new `editions.spec.ts`/`edition-query.test.ts`) duplicating what Phases 11–13 already built and independently verified — `tests/e2e/edition.spec.ts`, `tests/e2e/site-header.spec.ts`, and the sitemap assertions in `tests/e2e/seo.spec.ts` all currently pass, and `11-VERIFICATION.md`/`12-VERIFICATION.md`/`13-VERIFICATION.md` each re-ran their own success criteria via direct command execution (build output, unit tests, e2e runs, grep of rendered HTML) rather than trusting SUMMARY.md claims. Instead, Phase 14's core deliverable is a genuine **closure audit**: an itemized checklist explicitly mapping to `PITFALLS.md`'s 7-item "Looks Done But Isn't" list, citing the specific existing evidence (file/line/test-run) that closes each item — this satisfies ROADMAP success criterion #4 ("explicitly checked off, not just assumed from a single happy-path pass") without redundant test code. New automated coverage is added ONLY where a real gap exists (see D-02 and D-05).
  - Rationale: avoiding duplicate test suites matches this project's convention of not adding coverage/abstraction beyond what's needed, and the fact that 11/12/13's verifications already re-proved everything with real command execution — rewriting it would be pure churn, not risk reduction.

### Null-safety fix (carried WARNING from 12-VERIFICATION.md)
- **D-02:** Fix now, as part of Phase 14. Add the same defensive guards (`?.` / `?? ''`) the existing gallery detail page already uses (its own WR-03 precedent, `src/pages/galleries/[slug].astro`) to the Éditions pages' currently-unguarded field access — confirmed directly by reading the live code:
  - `src/pages/editions/[slug].astro` (+ `src/pages/en/editions/[slug].astro`): lines 57 (`edition.images` spread into the Lightbox array), 62–63 (`edition.dimensions.width`/`.height`/`.unit`, `edition.pageCount`, `edition.printRun`), 111/114 (`edition.images.length`/`.map`) — all unguarded. (Line 46's `edition.statement?.[locale] ?? ''` is already correctly guarded on this page — only the format-detail and images fields are missing guards.)
  - `src/pages/editions/index.astro:56` and `src/pages/en/editions/index.astro:52`: `edition.statement[locale]` — unguarded (unlike the detail page's own statement access).
  - Rationale: `12-VERIFICATION.md` flagged this as non-blocking today but severe in blast radius — because `getStaticPaths` renders every published édition in one `astro build` pass, a single malformed/partially-populated future édition document (created via bulk import or published before validation existed) would crash the **entire static build**, not just the Éditions pages — and it explicitly suggested Phase 14 could reasonably absorb this fix. The fix is a handful of `?? ''`/`?.` additions mirroring an already-established codebase convention (near-zero cost), and directly serves this phase's own ROADMAP goal that "the boundary holds across the whole feature" against exactly this class of omission-risk.

### Romane's Sanity Studio UAT (ROADMAP success criterion #3 — the one item not yet actually done)
- **D-03:** This is a human action Claude cannot perform directly. Phase 14's plan must produce a short, non-technical, French-language step-by-step checklist doc (matching the tone of the existing EditorialDashboard's French Studio copy) for Florian to hand to Romane. Her completed pass is a **blocking checkpoint gate** before Phase 14 can be marked complete — the same "real human approval, not self-reported by an executor" pattern already used for Phase 13's mobile-fit checkpoint (`13-VERIFICATION.md` explicitly cross-checked that the human-verify checkpoint was approved by the actual user, not an agent).
- **D-04:** The pass must exercise a genuine **create** step, not just an edit of the already-seeded "Rebut" édition. `11-UAT.md` shows the drag-reorder test was previously **skipped/waived by Florian** (not performed by Romane) specifically because only one édition existed at the time, so reordering couldn't be meaningfully tested. Romane's Phase 14 pass should create one new édition — using real content if a second one (e.g. "Sillo," already referenced in project docs) is ready, otherwise a temporary throwaway deleted afterward — so that create, edit, publish, AND drag-reorder (which needs 2+ documents) are all genuinely exercised, closing the gap `11-UAT.md` left open rather than repeating the same waiver.
  - Rationale: PROJECT.md's core maintainer constraint is that Romane self-serves content edits — this has never actually been confirmed with her own hands for Éditions (only Florian's dev-side work has touched it), and ROADMAP success criterion #3 explicitly requires it in her own words ("confirmed it works the same way galleries already do"). Reusing the single existing document would repeat the exact gap `11-UAT.md` already left open.

### Commerce-language check surface
- **D-05:** Extend the existing negative check to also grep `sanity/schemas/edition.ts`'s own field titles/descriptions (developer-authored Studio copy: labels, descriptions, group titles) for stray commerce terms (`price`/`prix`/`stock`/`disponib`/`acheter`/`buy`/`panier`/`cart`), not just rendered visitor-facing HTML (already covered by the existing `npm run test:artifact` guard, per `12-VERIFICATION.md`). Implement as a small extension to the existing artifact-check script (`tests/scripts/verify-static-artifact.mjs`) or a lightweight new unit test — not a new tool/framework.
  - Rationale: EDN-06 is worded around visitor-facing pages, but `PITFALLS.md`'s own "Looks Done But Isn't" item explicitly says to "grep the new templates/**schema**" — Studio field copy is developer-authored code, cheap to check, and this closes that PITFALLS.md item more thoroughly than the current build-output-only check does.

### Claude's Discretion
- **REQUIREMENTS.md bookkeeping lag** — both `12-VERIFICATION.md` and `13-VERIFICATION.md` independently flagged that `REQUIREMENTS.md`'s checkboxes (EDN-01..07, CMS-04) and its traceability table still show unchecked/"Pending" even though all are functionally complete. Flip these to checked/"Complete" as a trivial part of Phase 14's closure — not a gray area, just housekeeping two prior phases already called out.
- Exact wording/format of the Romane UAT checklist doc (D-03) and where it lives (e.g. a plain doc in the phase directory vs. a message Florian relays directly) — planner's/executor's judgment, following the EditorialDashboard's existing French-copy tone.
- Whether the null-safety fix (D-02) gets its own small unit/e2e test asserting graceful handling of a malformed édition document, mirroring however `WR-03`'s original gallery fix was verified — planner's discretion on test shape, not whether to fix (that's locked, D-02).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/ROADMAP.md` (Phase 14 section) — the 4 success criteria this phase must satisfy.
- `.planning/REQUIREMENTS.md` (EDN-01..07, CMS-04, lines 79–89, 198–221) — all already marked Complete in the phase-mapping table; the stale checkbox/Pending bookkeeping lag noted above.

### Milestone-level research this phase directly closes
- `.planning/research/PITFALLS.md` §"Looks Done But Isn't Checklist" (7 items) — the checklist D-01's closure audit must explicitly map against, citing existing evidence per item.
- `.planning/research/SUMMARY.md` §"Phase 4: Verification & UAT" — the original rationale/proposed deliverables for this phase from milestone research.

### Prior phase verification reports (evidence this phase's audit cites, and the two open items it closes)
- `.planning/phases/11-schema-content-model/11-VERIFICATION.md` and `11-UAT.md` — the skipped/waived drag-reorder test (D-03/D-04 close this gap for real).
- `.planning/phases/12-data-fetch-layer-routes/12-VERIFICATION.md` — the null-safety WARNING (D-02) and the existing negative-check coverage (D-05 extends it); also documents the 5/5 route/sitemap/no-commerce criteria D-01's audit cites as already-closed evidence.
- `.planning/phases/13-nav-integration/13-VERIFICATION.md` — nav-link/mobile-fit closure evidence (5/5, including the re-verified gap-closure) that D-01's audit cites for the nav-related PITFALLS.md items.

### Files this phase's decisions touch
- `src/pages/editions/[slug].astro` + `src/pages/en/editions/[slug].astro` — null-safety fix (D-02).
- `src/pages/editions/index.astro` + `src/pages/en/editions/index.astro` — null-safety fix (D-02).
- `src/pages/galleries/[slug].astro` — the WR-03 null-guard pattern D-02 mirrors.
- `sanity/schemas/edition.ts` — commerce-language grep target (D-05).
- `tests/scripts/verify-static-artifact.mjs` — existing negative-check script D-05 extends.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Gallery detail page's WR-03 null-guard pattern (`?? ''` / `?.`, `src/pages/galleries/[slug].astro`) — direct mirror target for D-02's fix.
- `tests/scripts/verify-static-artifact.mjs` — existing word-boundary-aware commerce-term grep guard (already passing against built HTML); extend for D-05 rather than writing a new script.
- Phase 13-02's blocking human-verify checkpoint pattern (real user typed approval, independently cross-checked by `13-VERIFICATION.md`) — mirror for D-03's Romane-approval gate.

### Established Patterns
- Every prior phase's VERIFICATION.md re-runs commands directly rather than trusting SUMMARY.md claims (build, unit tests, e2e, grep of rendered output) — Phase 14's own closure audit should hold itself to the same standard, not just cite prior reports without spot-checking.
- The project has already surfaced (twice) a REQUIREMENTS.md bookkeeping lag between "functionally complete" and "still shows Pending" — a recurring, low-cost hygiene item worth fixing once rather than flagging a third time.

### Integration Points
- `src/pages/editions/[slug].astro`, its `en` twin, and both overview pages — null-safety guards (D-02).
- `sanity/schemas/edition.ts` — commerce-term grep target (D-05).
- `tests/scripts/verify-static-artifact.mjs` — extended grep scope (D-05).
- A new Romane-facing checklist doc (D-03) — exact location left to planner/executor discretion.

</code_context>

<specifics>
## Specific Ideas

- User explicitly delegated all four identified gray areas to Claude's judgment ("I let you choose the best decisions on these points") rather than discussing each individually — decisions above were made from direct evidence (prior VERIFICATION.md reports, live code reads) rather than assumption, consistent with how prior phases' own verifications operated.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 14's cross-cutting verification scope. No new capabilities were proposed. EDN-08 (gallery↔édition cross-link) remains out of scope, already tracked in REQUIREMENTS.md's v2 section for a future phase.

</deferred>

---

*Phase: 14-verification-uat*
*Context gathered: 2026-07-23*
