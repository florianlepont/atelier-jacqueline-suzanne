---
phase: 11-schema-content-model
verified: 2026-07-22T18:15:00Z
status: passed
score: 7/8 must-haves verified
behavior_unverified: 1
overrides_applied: 0
human_verification:

  - test: "Drag-reorder a second (or more) édition inside the 'Éditions' desk list in the hosted Studio, the same way galleries are reordered."
    expected: "The list re-orders and persists the new order across a refresh, exactly like the existing 'Collections photo' (gallery) list."
    why_human: "Only one édition ('Rebut') currently exists in the production dataset, so the reorder mechanism (orderRankField + orderableDocumentListDeskItem, confirmed wired and code-identical to gallery's) has never actually been exercised with more than one item. 11-02-SUMMARY.md itself documents this as accepted-but-unexercised ('Known follow-up (non-blocking): drag-reorder is code-verified but not yet exercised with real content'). A browser session is required to actually drag two list items and confirm persistence."

  - test: "Re-run `npm run deploy --prefix sanity` and confirm the hosted Studio (https://atelier-jacqueline-suzanne.sanity.studio/) reflects the current repo HEAD schema — specifically that `leadPhoto` now shows a required 'Crédits et droits' field, that adding an `images` array item without an uploaded asset is blocked on publish, and that `Dimensions → Unité` is a constrained cm/in dropdown rather than free text."
    expected: "All three code-review fixes (WR-01/WR-02/WR-03, commit c718414) are live in the hosted Studio, not just in the repo."
    why_human: "Verified via git history + a live query against the production dataset (see Gaps Summary) that commit `c718414` ('fix(11): address code review findings') was made AFTER 11-02's deploy+seed checkpoint and has never been followed by another `sanity deploy`. The hosted Studio Romane actually uses is currently running the pre-review-fix schema. This doesn't invalidate any of the 5 roadmap success criteria (all were satisfied by the schema as it existed at deploy time), but it means the review-report's fixes are not yet live where they matter, and the already-published 'Rebut' document's `leadPhoto` has no `rights` sub-field (predates the fix)."
---

# Phase 11: Schema & Content Model Verification Report

**Phase Goal:** A dedicated `edition` Sanity content type exists — structurally distinct from galleries, modeled with future shop fields in mind — seeded with at least one real édition, so every later phase (data-fetch, routes, nav) has real content to build on and verify against.
**Verified:** 2026-07-22T18:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `edition` document type renders a create/edit form in Studio with groups Publication / Présentation / Photos / Détails du format | ✓ VERIFIED | `sanity/schemas/edition.ts:44-52` defines exactly these 4 groups; `npm --prefix sanity run lint && npm --prefix sanity run build` both exit 0 locally; 11-02-SUMMARY.md documents visual confirmation of all 4 groups in the hosted Studio post-deploy. |
| 2 | Format details are typed fields — `pageCount`/`printRun` numbers, `dimensions` a structured `{width, height, unit}` object, grouped under "Détails du format" | ✓ VERIFIED | `edition.ts:256-321`; live production doc confirms `printRun: 2` and `pageCount: 50` as JSON numbers (not strings) and `dimensions: {width:21, height:29.7, unit:"cm"}` via direct `sanity documents query`. |
| 3 | A dedicated `leadPhoto` field exists, separate from the `images` photo-shoot array (D-04) | ✓ VERIFIED | `edition.ts:99-155` (`leadPhoto`) is structurally distinct from `edition.ts:160-254` (`images` array); production doc has both populated independently (`leadPhoto.asset` distinct from any `images[].asset`). |
| 4 | An "Éditions" drag-reorderable list appears in the Studio desk, mirroring galleries (success criterion #2) | ⚠️ PRESENT / UNVERIFIED BEHAVIOR | `orderableDocumentListDeskItem({type:'edition', ...})` present in `structure.ts:62-68`, `orderRankField({type:'edition'})` present in `edition.ts:324`, exclusion filter contains `'edition'` (`structure.ts:83`) — list appears once, not double-listed. Production doc has a valid `orderRank` value (`"0|100008:"`, the LexoRank format the plugin assigns on creation through its own desk pane — corroborates it was created via the real desk item, not a bypass script). However, only one édition document exists, so actual drag-and-drop reordering has never been exercised. Routed to human verification. |
| 5 | The Rebut naming overlap is recorded as Confirmed in `PROJECT.md`'s Key Decisions (success criterion #5, D-01/D-02) | ✓ VERIFIED | `PROJECT.md:124` — new Key Decisions row, Outcome column "Confirmed — raised with and confirmed by Romane during Phase 11 (D-01/D-02)"; `PROJECT.md:86` Context "Open item (v1.3)" bullet rewritten to "RESOLVED". |
| 6 | Romane/Florian can create, fill every field, and publish a real "Rebut" édition in the hosted Studio without developer help (CMS-04, success criterion #1) | ✓ VERIFIED | Live `sanity documents query` against the production dataset (projectId `gwz8iug4`, dataset `production`) independently confirms a published (`publicationStatus:"published"`, non-draft `_id`) "Rebut" document with title, slug (`rebut`), bilingual statement, `leadPhoto` (real 5742×3828 JPEG asset + bilingual alt), and 6 `images` entries each with a real uploaded asset, bilingual alt text, and full `rights` metadata. Alt text is specific/descriptive prose (not placeholder), consistent with genuine human data entry through the Studio UI rather than a script. |
| 7 | At least one real édition is seeded with real content, ready for Phase 12 to fetch (success criterion #4, D-15) | ✓ VERIFIED | Same production-dataset query as above — the "Rebut" édition is fully populated and published, matching the field names (`leadPhoto`, `images`, `statement`, `pageCount`, `printRun`, `dimensions`) Phase 12 will fetch against. |
| 8 | Hosted Studio (atelier-jacqueline-suzanne.sanity.studio) shows the new "Éditions" list after `sanity deploy` | ✓ VERIFIED (as of the deploy that occurred) | 11-02-SUMMARY.md documents a successful `npm run deploy --prefix sanity` run; `curl` against `https://atelier-jacqueline-suzanne.sanity.studio/` returns a 302 redirect to `https://www.sanity.io/@oZMsGpFsG/studio/y1g7kkfc0x3vjg52pfjjvr56`, the exact `appId` pinned in `sanity/sanity.cli.ts`, confirming the Studio is deployed and live at that target. See Gaps Summary below: this deploy is now stale relative to a later commit. |

**Score:** 7/8 truths verified (1 present, behavior-unverified — routed to human verification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sanity/schemas/edition.ts` | New document type, full field set | ✓ VERIFIED | 351 lines; all fields from 11-01-PLAN.md's "Artifacts this phase produces" present: `publicationStatus`, `title`, `slug`, `statement`, `leadPhoto`, `images`, `pageCount`, `printRun`, `dimensions`, hidden `orderRank`. No `heroColor`/`showOnHomePage`/`seo`/`publishedPageLinks`/`reference` field (correctly omitted per D-13/D-03/discretion). |
| `sanity/schemas/index.ts` | `edition` imported + registered | ✓ VERIFIED | `import {edition} from './edition'` (line 4), `edition` present in `schemaTypes` array (line 17), immediately after `gallery`. |
| `sanity/schemas/structure.ts` | Orderable desk item + exclusion filter | ✓ VERIFIED | `orderableDocumentListDeskItem({type:'edition', title:'Éditions', icon: BookIcon, ...})` at lines 62-68; `'edition'` present in the exclusion-filter array (line 83); `BookIcon` distinct from `TagsIcon`/`ImagesIcon` (imports at lines 4-12). |
| `.planning/PROJECT.md` | Confirmed Rebut resolution row | ✓ VERIFIED | New Key Decisions row (line 124) with Outcome "Confirmed"; Context "Open item (v1.3)" bullet (line 86) rewritten to "RESOLVED". |
| Deployed hosted Studio | Reflects `edition` schema | ⚠️ STALE | Live and reachable (302 to pinned appId), and reflected the schema *as of the last deploy* — but a later commit (`c718414`, code-review fixes) has not been redeployed. See Gaps Summary. |
| Seeded "Rebut" édition document | Published, real content, production dataset | ✓ VERIFIED | Confirmed via direct `npx sanity documents query` against the live production dataset (see truths 6/7 above). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `sanity/schemas/index.ts` | `sanity/schemas/edition.ts` | `import {edition} from './edition'` + `schemaTypes` array entry | ✓ WIRED | Confirmed by direct read; `npm --prefix sanity run build` succeeds (would fail on an unresolved import). |
| `sanity/schemas/edition.ts` (`orderRankField`) | `sanity/schemas/structure.ts` (`orderableDocumentListDeskItem`) | Both halves present for `type:'edition'` | ✓ WIRED | `edition.ts:324` and `structure.ts:62-68`; production doc has a real `orderRank` value, confirming the mechanism is live end-to-end. |
| `sanity/schemas/structure.ts` exclusion filter | generic `S.documentTypeListItems()` | `'edition'` string in the exclusion array | ✓ WIRED | `structure.ts:83`; prevents double-listing. |
| Local `sanity/schemas/edition.ts` (repo HEAD) | Hosted Studio (`atelier-jacqueline-suzanne.sanity.studio`) | `sanity deploy` | ⚠️ PARTIALLY WIRED (stale) | The deploy that ran (per 11-02-SUMMARY.md, before commit `c718414`) is confirmed live. No deploy has run since `c718414` landed. The link was correct at Plan 02's checkpoint time but has since drifted out of sync with repo HEAD. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Studio schema compiles (schema + wiring build) | `npm --prefix sanity run lint && npm --prefix sanity run build` | Both exit 0; build warns only about a local/runtime Sanity version mismatch (pre-existing, unrelated to this phase) | ✓ PASS |
| Production dataset actually holds a published, fully-populated "Rebut" édition | `npx sanity documents query '*[_type=="edition"]{...}'` (run directly against `projectId gwz8iug4`, `dataset production`) | Returns one document: `publicationStatus:"published"`, non-draft `_id`, `title:"Rebut"`, `slug.current:"rebut"`, bilingual `statement`, `leadPhoto` with real asset + bilingual alt, 6 `images` each with real asset + bilingual alt + full `rights`, `pageCount:50`, `printRun:2` (number), `dimensions:{width:21,height:29.7,unit:"cm"}`, `orderRank:"0|100008:"` | ✓ PASS |
| Hosted Studio is deployed and reachable at the pinned appId | `curl -s -o /dev/null -w "%{http_code}" https://atelier-jacqueline-suzanne.sanity.studio/` | `302` redirect to `https://www.sanity.io/@oZMsGpFsG/studio/y1g7kkfc0x3vjg52pfjjvr56` — matches `appId: 'y1g7kkfc0x3vjg52pfjjvr56'` pinned in `sanity/sanity.cli.ts` | ✓ PASS |
| Code-review fixes (WR-01/02/03) exist in the repo at HEAD | `git show c718414 --stat` + file read | 3 fixes present in `edition.ts` at HEAD (images array `assetRequired()`, `leadPhoto.rights`, constrained `dimensions.unit` list) | ✓ PASS (repo-side only — not yet redeployed, see Gaps Summary) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CMS-04 | 11-01, 11-02 | Romane can add/edit éditions herself via Sanity, without touching code | ✓ SATISFIED | Full field set present and Studio-editable; real content created/published through the hosted Studio (production-dataset query evidence above). |
| EDN-05 | 11-01 | Each édition detail page shows format details (page count, print run, dimensions) | ✓ SATISFIED (Phase 11's scoped portion) | Phase 11 delivers the typed/structured data model and seeded real values; ROADMAP.md explicitly scopes the "detail page" rendering itself to Phase 12 (front-end fetch/render is out of this phase's boundary per `11-CONTEXT.md`). REQUIREMENTS.md's roadmap-decomposition table maps EDN-05 fully to Phase 11 (line 199), which this phase satisfies as scoped. |

No orphaned requirements: REQUIREMENTS.md's Phase-11 mapping (`CMS-04 | Phase 11 | Complete`, `EDN-05 | Phase 11 | Complete`, plus the "8/8 mapped" note at line 219) lists only these two IDs for Phase 11, and both are declared in the plans' `requirements:` frontmatter (`11-01-PLAN.md`: `[CMS-04, EDN-05]`; `11-02-PLAN.md`: `[CMS-04]`).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/placeholder markers found in `edition.ts`, `index.ts`, or `structure.ts` | — | None |
| `sanity/schemas/edition.ts` (pre-`c718414`, now fixed in repo) | n/a | 11-REVIEW.md's WR-01/WR-02/WR-03 (missing `assetRequired()` on `images[]`, missing `rights` on `leadPhoto`, unconstrained `unit` free text) | Warning (advisory, per task instructions — not treated as blocking) | Confirmed fixed in repo at HEAD (commit `c718414`), but **not yet redeployed** to the hosted Studio Romane actually uses — see Gaps Summary. |

### Human Verification Required

### 1. Drag-reorder with a real second édition

**Test:** In the hosted Studio, seed (or temporarily create) a second édition and drag-reorder it against "Rebut" in the "Éditions" desk list.
**Expected:** The list re-orders and the new order persists across a page refresh, identical to how "Collections photo" (galleries) already behaves.
**Why human:** Only one édition document currently exists in production, so the reorder mechanism — while wired identically to galleries' already-proven implementation (`orderRankField` + `orderableDocumentListDeskItem`) — has never actually been exercised. This gap is self-acknowledged in `11-02-SUMMARY.md` ("Known follow-up (non-blocking): drag-reorder is code-verified but not yet exercised with real content").

### 2. Redeploy after the code-review fix commit

**Test:** Run `npm run deploy --prefix sanity` again (it has not run since commit `c718414`), then open the hosted Studio and confirm: `leadPhoto` now requires a "Crédits et droits" field, an `images` array item without an uploaded asset is blocked on publish, and `Dimensions → Unité` is a constrained cm/in list.
**Expected:** All three review fixes are live in the hosted Studio, matching repo HEAD.
**Why human:** Verified via `git log` timestamps that `c718414` ("fix(11): address code review findings") landed at `2026-07-22T17:33:18+02:00`, after 11-02's deploy+seed checkpoint completed (`2026-07-22T17:25:13+02:00`, per its own SUMMARY, and corroborated by the already-published "Rebut" document's `_updatedAt` of `2026-07-22T15:21:31Z`). No commit, SUMMARY, or tracking note documents a second `sanity deploy` after `c718414`. This means the hosted Studio Romane actually uses is currently running the **pre-review-fix** schema — the fixes exist only in the repo, not in production. This does not invalidate any of the 5 roadmap success criteria (all were met by the schema as it existed at the time of the actual deploy+seed), but it is a real, currently-open gap between repo HEAD and what's live.

## Gaps Summary

No roadmap success criterion FAILED outright, and the phase's core deliverable — a working, distinct `edition` content type with typed format fields, a dedicated lead photo, and one real, fully-populated, published "Rebut" édition ready for Phase 12 — is independently confirmed against the live production Sanity dataset, not just SUMMARY.md prose.

Two items are routed to human verification rather than accepted as passed outright:

1. **Drag-reorder (success criterion #2) has not actually been exercised** with more than one édition document. The underlying mechanism is wired correctly and is code-identical to galleries' already-shipped implementation, and the seeded document's `orderRank` value is consistent with having been created through the real orderable desk pane (not a bypass script) — but "the list re-orders" itself remains unproven with real data.

2. **A code-review fix commit (`c718414`, addressing 11-REVIEW.md's WR-01/WR-02/WR-03) exists in the repo but has never been deployed to the hosted Studio.** This is a genuine drift between repo HEAD and the live Studio: `leadPhoto` is missing its `rights` field in production (the already-published "Rebut" document predates the fix), `images[]` array members in the live Studio still lack the `assetRequired()` guard the reviewer flagged as a content-integrity risk (an editor could publish a photo-shoot entry with full metadata but no actual image), and `Dimensions → Unité` is still unconstrained free text live. None of the 5 roadmap success criteria as literally worded require these specific fixes (criterion #3 only requires `printRun` to be a number, which was already true in the very first commit), so this is not a BLOCKER — but it is real, current, and worth closing before the phase is fully considered done, since it's exactly the kind of easy-to-forget manual step (no CI step runs `sanity deploy`) the phase's own research already flagged as "Pitfall A."

Both items are advisory/human-verification-tier, not blocking gaps — they do not contradict or undermine any of the 5 roadmap success criteria, all of which have strong, independently-verified evidence (a live production-dataset query, not just SUMMARY.md claims).

---

_Verified: 2026-07-22T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
