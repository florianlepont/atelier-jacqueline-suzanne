---
phase: 260721-jm0-fix-sanity-studio-editorialdashboard-iss
verified: 2026-07-21T00:00:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task: Fix Sanity Studio EditorialDashboard Issues — Verification Report

**Task Goal:** Fix six issues in the Sanity Studio Editorial Dashboard surfaced by `.planning/ui-reviews/adhoc-sanity-dashboard-audit.md` (dark-mode support, inconsistent gray row background, human-readable error copy, preparation-status exclusion from urgent bucket, dead-code cleanup, heading semantics for priority-group titles) — excluding the two explicitly out-of-scope items (GitHub deployment API auth/rate-limit, Sanity member-list identity).

**Verified:** 2026-07-21
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Dashboard backgrounds follow active Sanity Studio color scheme (no forced-white panels in dark mode) | ✓ VERIFIED | `EditorialDashboard.css:1-3`: `--dashboard-page-background`/`--dashboard-surface-background` now derive from `var(--card-bg-color)`/`var(--card-fg-color)` via `color-mix()`, replacing the prior hardcoded `#f7f8fa`/`#ffffff` (confirmed via `git show fc1eef1`). Zero 6-digit hex literals remain in the file. This is a behavior-dependent (visual) truth — already live-confirmed by the user in a real logged-in Studio session, both light and dark schemes, approved 2026-07-21 per SUMMARY.md (blocking human checkpoint resolved, not re-litigated here). |
| 2 | Task rows within a priority group render with a consistent background (no stray gray) | ✓ VERIFIED | `EditorialDashboard.css:90-94`: `.editorial-dashboard__task-row, .editorial-dashboard__activity-row` now carry an explicit `background-color: var(--dashboard-surface-background)` — previously absent (rows relied on inherited Card-tone background, the plausible source of the inconsistency per the audit's hypothesis). Also confirmed by the same live human checkpoint (approved 2026-07-21). |
| 3 | Error state shows human, actionable French guidance with raw error only in a collapsed disclosure | ✓ VERIFIED | `EditorialDashboard.tsx:434-449`: primary text is now "Le tableau de bord n'a pas pu se charger. Réessayez dans quelques instants, ou contactez le développeur si le problème persiste." Raw `{error}` string moved inside `<details><summary>Détail technique</summary>...</details>` (line 441-446). Static truth, verifiable by reading source — no live check needed. |
| 4 | A complete "En préparation" collection (no missing fields, no unpublished draft) no longer appears as urgent | ✓ VERIFIED | `EditorialDashboard.tsx:361-369`: the `attention` filter's return clause is now `!summary.requiredComplete \|\| !summary.recommendedComplete \|\| row.hasDraft` — the standalone `publicationStatus === 'preparation'` inclusion clause is gone. Confirmed the 14-line window after `const attention = rows` contains zero occurrences of `publicationStatus === 'preparation'` (plan's own verify gate). A preparation item with missing required fields still passes via `!summary.requiredComplete` and correctly surfaces under "À corriger." |
| 5 | The four priority-group titles are exposed to assistive tech as level-3 headings | ✓ VERIFIED | `EditorialDashboard.tsx:723`: group title `Text` now carries `role="heading" aria-level={3}`, applied once in the shared `AttentionSection` component so all four groups (À corriger, Modifications à publier, À finaliser, À améliorer) inherit it. |
| 6 | No dead `editorial-dashboard__primary-action` class; `deploymentLabel()` no longer returns an unused hex color field | ✓ VERIFIED | `grep -n 'editorial-dashboard__primary-action' EditorialDashboard.tsx` → no matches (class removed from the `IntentButton`, line 397-406 now only has `editorial-dashboard__header-control`). `deployment.ts:26-33`: `deploymentLabel()` now returns `{label, tone}` with `DeploymentTone` values, zero hex literals in the file. `EditorialDashboard.tsx:781-782`: `DeploymentStatus` consumes `status.tone` directly — no parallel/duplicate tone ternary remains. |

**Score:** 6/6 truths verified (0 present, behavior-unverified — the two visual/behavior-dependent truths were already exercised and approved via the blocking human checkpoint recorded in SUMMARY.md, not left unexercised).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sanity/editorial/EditorialDashboard.css` | Scheme-aware background tokens, consistent row background | ✓ VERIFIED | No hex literals; `--card-bg-color`/`--card-fg-color` derived tokens; explicit row `background-color` added. |
| `sanity/editorial/EditorialDashboard.tsx` | Error `<details>`, preparation-filter change, `aria-level={3}`, dead class removed | ✓ VERIFIED | All four changes present and correctly wired (see truths 3-6 above). |
| `sanity/editorial/deployment.ts` | `deploymentLabel()` returns `{label, tone}`, no hex | ✓ VERIFIED | Confirmed, `DeploymentTone` type used throughout. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| Row `:hover` rule | `--dashboard-page-background` token | shared CSS custom property | ✓ WIRED | `EditorialDashboard.css:96-99` hover rule still reads `var(--dashboard-page-background)`, which is now scheme-aware (line 2) — hover stays consistent in both schemes automatically. |
| `deploymentLabel()` | `DeploymentStatus` | `status.tone` consumption | ✓ WIRED | `EditorialDashboard.tsx:781-782`: `const tone = status.tone` — no duplicate ternary recomputing tone elsewhere in the function. |
| `attention` eligibility filter | `buildAttentionGroups()` / `attentionPriority()` / `editorialStatus()` | shared `preparation` semantics | ✓ WIRED | Filter (lines 361-369) now gates entry; downstream classification functions (563-627, 668-683) still use `publicationStatus === 'preparation'` for *bucketing* items that already passed the filter (e.g. a preparation item with missing fields lands in "À finaliser" bucket display logic while still being present because of the missing-fields reason) — internally consistent, no drift found. |

### Behavioral Spot-Checks / Build Verification

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| No hex in CSS | `grep -cE '#[0-9a-fA-F]{6}' EditorialDashboard.css` | 0 matches | ✓ PASS |
| No hex in deployment.ts | `grep -cE '#[0-9A-Fa-f]{6}' deployment.ts` | 0 matches | ✓ PASS |
| Dead class removed | `grep -n 'editorial-dashboard__primary-action' EditorialDashboard.tsx` | 0 matches | ✓ PASS |
| Heading semantics present | `grep -nE 'as="h3"\|aria-level=\{3\}'` | line 723 matches | ✓ PASS |
| Error `<details>` present | `grep -n '<details'` | line 441 matches | ✓ PASS |
| ESLint | `cd sanity && npm run lint` | clean, zero errors | ✓ PASS |
| TypeScript check | `cd sanity && npx tsc --noEmit` | 10 errors — confirmed identical to pre-task baseline via git worktree diff against parent commit `69b6f7d` (same 10 errors, same messages, only line numbers shifted +2 in EditorialDashboard.tsx due to the added `<details>` block) | ✓ PASS (no regressions introduced) |
| Studio build | `cd sanity && npm run build` | succeeds | ✓ PASS |
| Debt-marker scan | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER" -i` on all 3 modified files | 0 matches | ✓ PASS |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| AUDIT-1 | Dark-mode support | ✓ SATISFIED | Scheme-aware CSS tokens, live-confirmed. |
| AUDIT-2 | Inconsistent gray row background | ✓ SATISFIED | Explicit consistent row background token, live-confirmed. |
| AUDIT-3 | Raw error message shown to non-technical editor | ✓ SATISFIED | Human copy + collapsed `<details>`. |
| AUDIT-4 | 'preparation' drafts bucketed as urgent blockers | ✓ SATISFIED | Standalone preparation clause removed from eligibility filter. |
| AUDIT-5 | Dead CSS class + unused deploymentLabel color field | ✓ SATISFIED | Both removed/consolidated. |
| AUDIT-6 | Priority-group titles not real headings | ✓ SATISFIED | `role="heading" aria-level={3}` applied. |

### Anti-Patterns Found

None. No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER), no empty stub implementations, no hardcoded-empty data paths found in the three modified files.

### Out-of-Scope Items (correctly untouched)

- Unauthenticated GitHub Actions deployment-status fetch (`deployment.ts:16-24`, rate-limit risk) — confirmed untouched; only the return shape of `deploymentLabel()` changed, the fetch itself is unmodified.
- Sanity project member-list identity ("Florian Algernon" activity author) — confirmed no code changes related to `useUserStore` or activity-author resolution.

### Human Verification Required

None outstanding. The two live-only, behavior-dependent findings (#1 dark mode, #2 gray row) were already exercised and approved by the user in a real, logged-in Studio session (both light and dark schemes) per the blocking `checkpoint:human-verify` task in the plan — recorded as "Approved 2026-07-21" in SUMMARY.md. This satisfies the behavioral evidence requirement for those two truths; no further human action needed.

### Gaps Summary

No gaps found. All six audit findings in scope are fixed, statically verified against the actual source (not just SUMMARY.md claims), cross-checked with git diffs against the pre-task baseline commit, and the two visual/live-only findings have a recorded, approved human checkpoint. ESLint and Studio build are clean; the 10 TypeScript errors are confirmed pre-existing (identical set, verified via a disposable git worktree against parent commit `69b6f7d`) and not introduced by this task. The two explicitly out-of-scope items remain untouched.

---

_Verified: 2026-07-21_
_Verifier: Claude (gsd-verifier)_
