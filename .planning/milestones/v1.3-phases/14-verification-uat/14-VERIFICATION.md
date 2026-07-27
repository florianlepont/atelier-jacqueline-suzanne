---
phase: 14-verification-uat
verified: 2026-07-23T16:16:04Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 14: Verification & UAT — Verification Report

**Phase Goal:** The Éditions feature closes cleanly with no omission-class gaps — every locale, every nav call site, and the sitemap are confirmed complete, and the "no commerce" boundary holds across the whole feature.
**Verified:** 2026-07-23T16:16:04Z
**Status:** passed
**Re-verification:** No — initial verification

## Mode Note (mvp tag vs. goal shape)

ROADMAP.md tags this phase `Mode: mvp`, but its goal is not phrased as a user story (`user-story.validate` on the goal text returns `valid: false` — no "As a … I want … so that …" structure). This is consistent with, not contradicted by, the phase's own plans: all four PLAN.md files (14-01..14-04) carry an identical "MVP-mode note (judgment per orchestrator)" stating this is a cross-cutting closure/hardening/audit pass over already-shipped work with no UI→API→DB vertical slice to build, so user-story slicing was deliberately not forced. Applying the MVP User Flow Coverage table here would produce a low-quality, forced section per the MVP verification guidance itself ("do not verify against a non-User Story goal"). Standard goal-backward verification (this report) is used instead — consistent with the planner's own repeated, explicit judgment call, not a new deviation introduced by this verification pass.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Both locales' Éditions overview + detail pages render (SC #1) | ✓ VERIFIED | Re-ran `npm run build` this session: 27 pages incl. `editions/index.html`, `editions/rebut/index.html`, `editions/silos/index.html` + EN twins. `npx playwright test tests/e2e/edition.spec.ts` re-run directly: 6/6 pass. Build now renders a genuine **second** édition ("Silos", from Plan 14-04's Romane UAT), independently confirming that pass produced real content, not a claim. |
| 2 | "Éditions" nav link present + correctly localized on every page, including both homepage `<SiteHeader>` call sites (SC #1) | ✓ VERIFIED | Re-ran `grep` against this session's fresh `dist/`: `dist/index.html` and `dist/about/index.html` (both via `BaseLayout.astro:190`'s call site) AND `dist/index.html`'s own homepage-specific render (via `HomeCarousel.astro:120`'s independent call site) all carry `<a href="/editions/" class="nav-link">Éditions</a>` as the first `.nav-link`; EN twins carry `/en/editions/`/"Éditions" identically. `npx playwright test tests/e2e/site-header.spec.ts` (part of this session's full e2e run, 163/163 pass) includes the dedicated "Éditions nav link (EDN-01, D-01, SC #1/#2)" describe block covering `/`, `/en/`, `/about/`, `/en/about/`, `/contact/`, `/en/contact/`. |
| 3 | Sitemap contains the Éditions URLs (SC #1) | ✓ VERIFIED | Re-ran `grep -o "<loc>...</loc>" dist/sitemap.xml \| grep editions` this session: 6 URLs (`/editions/`, `/en/editions/`, `/editions/rebut/`, `/en/editions/rebut/`, `/editions/silos/`, `/en/editions/silos/` — 2 URLs more than 14-03's audit found, because Plan 14-04's Romane UAT published a real second édition after that audit ran). `tests/e2e/seo.spec.ts` sitemap assertion passes in this session's e2e run. |
| 4 | Automated negative commerce check covers built HTML AND schema source (SC #2) | ✓ VERIFIED | Re-ran `npm run test:artifact` this session: `Static artifact verified (27 HTML files, base /)`, exit 0. Direct code read of `tests/scripts/verify-static-artifact.mjs:130-164` confirms it scans `sanity/schemas/edition.ts` through the same `symbolCommerceTokens`/`prefixCommerceTokens`/`wholeWordCommerceTokens` + `containsWholeWord` helper the dist-HTML scan already uses (grep count 3 for `edition.ts`, reused not forked). |
| 5 | Romane completed a real end-to-end content-editing pass (create/edit/publish/drag-reorder) confirming parity with galleries (SC #3) | ✓ VERIFIED | `14-ROMANE-UAT.md` (French, non-technical, EditorialDashboard-register checklist covering create→title→photo/credits→FR+EN statement→format→"En préparation" draft-check→publish→drag-reorder→refresh-persistence→optional cleanup) exists and was used as the script for a BLOCKING human-verify checkpoint (Plan 14-04, Task 2, `gate="blocking"`, `autonomous: false`). `14-04-SUMMARY.md` records an explicit typed approval relayed by Florian, independently cross-checked by the orchestrator against the live public Sanity dataset (project `gwz8iug4`, dataset `production`): "Silos" absent → present as `preparation` → both `published`; `Rebut`'s `orderRank` changed and `Silos` sits at a distinct rank — direct dataset evidence of a real drag-reorder, not a self-report. This verification pass independently re-confirms the same fact from a third angle: this session's own `npm run build` renders two distinct, real, differently-titled/differently-imaged éditions ("Rebut" and "Silos") in the current dataset — the checkpoint's claim is corroborated a second time by a completely independent code-verifier read, not just cited from the SUMMARY. |
| 6 | Every "Looks Done But Isn't" risk (missing locale route, missing sitemap entry, missing nav call site, + the other 4 PITFALLS items) explicitly checked off, not assumed (SC #4) | ✓ VERIFIED | `14-CLOSURE-AUDIT.md` (71 lines, exceeds `min_lines: 40`) maps all 7 PITFALLS.md "Looks Done But Isn't" items to specific re-run evidence, with 5/7 fully closed and 2/7 (Studio drag-reorder human exercise; a forward-looking schema code comment) honestly reported as partially closed rather than rounded up — the drag-reorder half is then closed for real by Plan 14-04 (Truth #5 above). This report independently re-ran the same four gate commands (build/unit/e2e/artifact) and confirms the audit's evidence still holds against current HEAD, not just at audit-time. |
| 7 | Éditions pages guard nested/array Sanity-document field access so one malformed/partially-populated édition cannot crash the whole static build (D-02, supports "no omission-class gaps") | ✓ VERIFIED | Direct code read of `src/pages/editions/[slug].astro` confirms `edition.dimensions?.width/.height/.unit`, `edition.pageCount ?? ''`, `edition.printRun ?? ''`, `edition.images?.length ?? 0`, `(edition.images ?? []).map`, `edition.statement?.[locale] ?? ''` are all present and guarded; EN twin and both overview pages carry the identical guards (grep-confirmed). `npm run build` + `npx astro check` (0 errors) + `edition.spec.ts` (6/6) all green against the current, real two-édition dataset. |
| 8 | REQUIREMENTS.md's EDN-01..07/CMS-04 are already `[x]`/Complete, attributed to Phases 11-13 (not owed by Phase 14) | ✓ VERIFIED | Re-ran `grep -cE "^- \[x\] \*\*(EDN-0[1-7]|CMS-04)\*\*" .planning/REQUIREMENTS.md` this session: 8. Traceability table (lines 198-205) maps all 8 to Phases 11-13 with status "Complete". `git status` shows `.planning/REQUIREMENTS.md` unmodified by any Phase 14 commit. |

**Score:** 8/8 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/pages/editions/[slug].astro` | Guarded FR detail page (D-02) | ✓ VERIFIED | All named guards present; build/e2e green |
| `src/pages/en/editions/[slug].astro` | EN twin, identical guards | ✓ VERIFIED | Byte-equivalent guards confirmed at same relative lines; only `locale`/import-depth differ |
| `src/pages/editions/index.astro` | Guarded FR overview (`statement?.[locale] ?? ''`) | ✓ VERIFIED | Guard present, unrelated lines untouched |
| `src/pages/en/editions/index.astro` | EN twin | ✓ VERIFIED | Guard present |
| `tests/scripts/verify-static-artifact.mjs` | Second scan target reading `sanity/schemas/edition.ts` (D-05) | ✓ VERIFIED | Present, reuses existing token arrays/helper, does not fork; `npm run test:artifact` exits 0 |
| `.planning/phases/14-verification-uat/14-CLOSURE-AUDIT.md` | 7-item PITFALLS closure map + REQUIREMENTS re-verify note | ✓ VERIFIED | 71 lines (≥ min_lines 40); all 7 items present; re-run evidence recorded |
| `.planning/phases/14-verification-uat/14-ROMANE-UAT.md` | French Studio checklist (create→publish→drag-reorder) | ✓ VERIFIED | 59 lines (≥ min_lines 20); create/drag-reorder terms present (`grep -ciE` confirms) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/pages/galleries/[slug].astro` (WR-03 idiom) | `src/pages/editions/[slug].astro` | `?.`/`?? ''` guard pattern applied to the equivalent édition field class | ✓ WIRED | Grep confirms `?? ''`/`?.` present on every named field in both files |
| `verify-static-artifact.mjs`'s existing `containsWholeWord` + token arrays | `sanity/schemas/edition.ts` | Reused (not forked) token loops applied to schema source string | ✓ WIRED | Direct read confirms the same three arrays/helper are called against `editionSchemaSource`, no redeclaration |
| `14-CLOSURE-AUDIT.md` item 5 | `14-ROMANE-UAT.md` (Plan 14-04 blocking checkpoint) | Audit references the Romane pass as closing evidence for the 11-UAT.md-waived drag-reorder | ✓ WIRED | Audit's item-5 row explicitly names "Plan 14-04's blocking Romane UAT checkpoint (ROADMAP SC #3)" |
| `14-ROMANE-UAT.md` create-a-second-édition step | `11-UAT.md` waived drag-reorder test | A genuine 2nd document makes drag-reorder meaningfully testable for the first time | ✓ WIRED | Checklist step 1 requires creating a second édition before the drag-reorder step; this session's own build independently confirms a second, real, distinct édition ("Silos") now exists in the dataset |

### Behavioral Spot-Checks / Direct Re-Runs (this session, not cited from prior SUMMARY/VERIFICATION prose)

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Static build | `npm run build` | 27 pages, 0 errors, incl. both éditions × both locales | ✓ PASS |
| Type check | `npx astro check` | 0 errors | ✓ PASS |
| Unit tests | `npm run test:unit` | 126/126 passed (12/12 suites) | ✓ PASS |
| Full e2e suite | `npm run test:e2e` | 163/163 passed (chromium + webkit-mobile) | ✓ PASS |
| Édition e2e suite (isolated) | `npx playwright test tests/e2e/edition.spec.ts --project=chromium` | 6/6 passed | ✓ PASS |
| Artifact/commerce guard | `npm run test:artifact` | `Static artifact verified (27 HTML files, base /)`, exit 0 | ✓ PASS |
| Base-path regression (CR-01 fix) | `ASTRO_BASE=/ajs-website/ npm run build` then grep hrefs | All 4 Éditions link sites compile to `/ajs-website/editions/...` / `/ajs-website/en/editions/...` (root-base rebuild afterward confirmed clean revert) | ✓ PASS |
| Sitemap URLs | `grep -o "<loc>...</loc>" dist/sitemap.xml \| grep editions` | 6 URLs (2 éditions × 2 locales × [overview+detail] pattern) | ✓ PASS |
| Both homepage `<SiteHeader>` call sites | `grep nav-link dist/index.html dist/en/index.html` | "Éditions" is first `.nav-link` in both | ✓ PASS |
| Debt markers | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` across the 6 phase-modified files | No matches | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` conventions exist in this repo and no PLAN/SUMMARY/success-criteria text references a probe script for this phase — Step 7c: **SKIPPED (no probes declared or discovered)**.

### Requirements Coverage

Phase 14 declares `requirements: []` in all four plan frontmatters by design (cross-cutting verification phase, owns no primary REQ). Cross-referencing REQUIREMENTS.md:

| Requirement | Owning Phase | Status | Evidence |
|---|---|---|---|
| CMS-04 | Phase 11 | ✓ SATISFIED (pre-existing) | `- [x]` at REQUIREMENTS.md:89; traceability table row Complete |
| EDN-01 | Phase 13 | ✓ SATISFIED (pre-existing) | `- [x]` at REQUIREMENTS.md:79; traceability table row Complete |
| EDN-02..04, EDN-06, EDN-07 | Phase 12 | ✓ SATISFIED (pre-existing) | `- [x]` at REQUIREMENTS.md:80-83,85; traceability table rows Complete |
| EDN-05 | Phase 11 | ✓ SATISFIED (pre-existing) | `- [x]` at REQUIREMENTS.md:84; traceability table row Complete |

No orphaned requirements found for Phase 14 (REQUIREMENTS.md contains no `Phase 14` mapping — it owns none by design, matching the plans' own stated scope).

### Anti-Patterns Found (Non-Blocking Residual Risks)

| File | Pattern | Severity | Status / Disposition |
|------|---------|----------|----------------------|
| `src/pages/editions/[slug].astro:50-51`, `src/pages/en/editions/[slug].astro` (equiv.), both `index.astro` overview files' `leadPhoto.alt` access | `edition.leadPhoto` and `edition.leadPhoto.alt` are dereferenced without a `?.`/nullish guard, unlike sibling fields (`dimensions`/`pageCount`/`printRun`/`images`/`statement`) in the same files | ⚠️ Warning (code-review WR-02, confirmed present by this verification) | **Accepted as documented residual risk, not a phase gap.** Plan 14-01's own objective text explicitly states "Do NOT guard `edition.leadPhoto` itself (out of D-02 scope) — leadPhoto is the required lead image," and the code review that surfaced WR-02 characterizes it as "an explicit, deliberate scope exclusion in Plan 14-01, not an oversight." Studio schema validation (`rule.required().assetRequired()`) prevents this at normal publish time; the residual risk is narrow (a document written via direct API mutation bypassing Studio validation) and does not violate any of D-02's stated must-have truths (which name `dimensions`/`pageCount`/`printRun`/`images`/`statement` specifically, not `leadPhoto`). Recommend tracking as a follow-up, not blocking this phase's closure. |
| `tests/scripts/verify-static-artifact.mjs:130-164` | Schema-source commerce scan has no comment/identifier-stripping safeguard (unlike the dist-HTML scan, which strips `<script>`/`<style>`) — a future explanatory code comment naming a forbidden word as a whole word would fail the build | ⚠️ Warning (code-review WR-01, confirmed present by this verification) | **Accepted as documented residual risk, not a phase gap.** The guard passes clean today (confirmed by this session's own `npm run test:artifact` run) and is a *fragility of the guard's own robustness*, not a failure of the "no commerce language" success criterion it protects. No must-have in Plan 14-02's frontmatter requires comment-stripping — the plan's scope was reuse-the-existing-helper, which was done. Recommend as a low-priority follow-up (extract only `title:`/`description:` string literals) whenever the schema file's comments are next touched. |
| `src/pages/editions/index.astro:39-59`, EN twin | Overview row `<a>` wraps title + full statement paragraph + `sr-only` suffix, giving a verbose screen-reader accessible name | ℹ️ Info (code-review IN-01) | Non-blocking accessibility polish suggestion, not tied to any must-have truth in this phase. No action required for phase closure. |

### Important Observation (Not a Phase 14 Defect — Flagged for Milestone Closure)

**The entire v1.3 "Éditions" milestone (Phases 11-14, 112 commits as of this verification) has never been merged into `main`.** `git log main..HEAD --oneline | wc -l` returns 112; `git log HEAD..main --oneline | wc -l` returns 0. GitHub Actions (`deploy.yml`) only deploys from `main` (on push, or via the Sanity webhook's `repository_dispatch`), so the public GitHub Pages URL (`https://florianlepont.github.io/ajs-website/`) currently does not serve the Éditions feature, and its live `sitemap.xml` has zero Éditions URLs — even though every truth above is verified true against this branch's own build output. This was already surfaced by the orchestrator during Plan 14-04's checkpoint (recorded in `14-04-SUMMARY.md`'s "Notes for Milestone Completion") and is presumed to be an intentional deferred-cutover decision (merge-to-main as a deliberate step performed after this verification phase signs off), not a gap this phase needs to close — ROADMAP SC #1's wording ("Automated tests confirm...") is about the automated-test/build evidence, not "is live in production," and every one of the plans' own verification commands operates against local/CI build output, not the deployed public site. Flagging this prominently per the escalation-gate spirit: **whoever performs the v1.3 merge-to-main/deploy cutover must be aware the public site will not show Éditions until that merge happens**, and SC #1's "sitemap contains the Éditions URLs" is only true of this branch's build artifacts today, not of the currently-live public sitemap.

### Human Verification Required

None. SC #3 (Romane's real Studio pass) was already closed via Plan 14-04's blocking human-verify checkpoint with an explicit typed approval relayed by Florian, independently cross-checked by the orchestrator against the live public Sanity dataset, and independently re-corroborated a third time by this verification pass's own `npm run build` (which renders two distinct, real éditions — "Rebut" and "Silos" — confirming the create+publish half of that pass actually happened in the current dataset, not just as a claim). No open item requires further human action for this phase to close.

### Gaps Summary

No gaps found. All four ROADMAP success criteria are independently re-verified against fresh command output in this session (not cited from prior SUMMARY/VERIFICATION prose, per this phase's own direct-evidence discipline). The three non-blocking residual risks (WR-01, WR-02, IN-01) are explicitly documented, were already assessed by a prior code review, and do not violate any must-have truth as literally scoped by the plans — they are recorded above for visibility, not as blockers. The milestone-merge status (branch not yet merged to `main`) is a real and important fact affecting what the *public* site shows today, but is explicitly out of this phase's scope per the task's own framing and does not correspond to any failed success criterion.

---

_Verified: 2026-07-23T16:16:04Z_
_Verifier: Claude (gsd-verifier)_
