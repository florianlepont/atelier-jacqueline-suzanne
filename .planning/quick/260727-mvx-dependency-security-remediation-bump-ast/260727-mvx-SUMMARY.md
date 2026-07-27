---
phase: quick-260727-mvx
plan: 01
subsystem: infra
tags: [npm, astro, sanity, dependency-security, audit-fix]

requires: []
provides:
  - "Root astro bumped from exact-pinned 7.0.6 to caret range ^7.1.4, clearing GHSA-4g3v-8h47-v7g6 (Astro View Transition reflected XSS)"
  - "Non-force npm audit fix applied in root (brace-expansion/postcss/svgo) and sanity/ (dompurify/tar/postcss, plus @oclif/core dedup)"
  - "Fixed real Sanity Studio build breakage caused by the audit-fix's transitive @sanity/icons 3.8.0 → 5.2.1 bump (barrel export removal) by switching to per-icon subpath imports"
affects: [sanity-studio, ci-cd]

tech-stack:
  added: []
  patterns:
    - "@sanity/icons v5+ requires per-icon subpath imports (e.g. `@sanity/icons/Dashboard`) instead of named barrel exports — the barrel now only exports `Icon`/`icons` registry"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - sanity/package-lock.json
    - sanity/sanity.config.ts
    - sanity/schemas/structure.ts
    - sanity/editorial/DocumentChecklist.tsx
    - sanity/editorial/dashboardLogic.ts
    - sanity/editorial/OpenSitePage.tsx
    - sanity/editorial/EditorialDashboard.tsx

key-decisions:
  - "Kept astro on the 7.x line via caret range ^7.1.4 (resolved 7.1.4), never touching 8.x, per the plan's explicit constraint"
  - "Did not force-resolve sanity's remaining adm-zip/brace-expansion advisories — the only non-breaking-free path is `sanity@6.1.0`, a downgrade that violates the plan's zero-major-version-jump rule; documented as accepted residual"
  - "Fixed the @sanity/icons build breakage introduced incidentally by the non-force audit fix's @oclif/core dedup, rather than reverting the fix or force-pinning icons back to 3.8.0 (which would have left Sanity Studio's own internals using an icons API version they don't expect)"

patterns-established:
  - "When @sanity/icons majors, import each icon from its own subpath (`@sanity/icons/<Name>`) rather than the package root barrel"

requirements-completed:
  - GHSA-4g3v-8h47-v7g6
  - npm-audit-transitive

coverage:
  - id: D1
    description: "Astro XSS advisory (GHSA-4g3v-8h47-v7g6) cleared by bumping astro to ^7.1.4, staying on the 7.x line"
    requirement: "GHSA-4g3v-8h47-v7g6"
    verification:
      - kind: other
        ref: "npm audit (root) — GHSA-4g3v-8h47-v7g6 absent from output"
        status: pass
      - kind: other
        ref: "npm ls astro — resolves to astro@7.1.4"
        status: pass
    human_judgment: false
  - id: D2
    description: "Non-force npm audit fix applied in root and sanity/, clearing resolvable transitive dev/build-tooling advisories; residual force-only advisories documented, not forced"
    requirement: "npm-audit-transitive"
    verification:
      - kind: other
        ref: "npm audit (root) — 0 vulnerabilities after fix"
        status: pass
      - kind: other
        ref: "npm --prefix sanity audit — dompurify/tar/postcss cleared; adm-zip/brace-expansion remain (force-only, sanity@6.1.0 downgrade required)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full root verification suite green on the final combined dependency tree (typecheck, unit, build, full Playwright e2e incl. View Transitions)"
    verification:
      - kind: other
        ref: "npm run typecheck — 0 errors, 0 warnings"
        status: pass
      - kind: unit
        ref: "npm run test:unit — 165/165 passed"
        status: pass
      - kind: other
        ref: "npm run build — 27 pages built, no errors"
        status: pass
      - kind: e2e
        ref: "npx playwright test — 247/247 passed (chromium full + webkit-mobile smoke)"
        status: pass
    human_judgment: false
  - id: D4
    description: "sanity/ subproject lint and build pass on the post-audit-fix dependency tree, including a fix for a real build breakage the audit fix introduced"
    verification:
      - kind: other
        ref: "npm --prefix sanity run lint — clean"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run build — Studio builds successfully"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-07-27
status: complete
---

# Quick Task 260727-mvx: Dependency Security Remediation Summary

**Bumped astro to ^7.1.4 clearing the View Transition XSS advisory (GHSA-4g3v-8h47-v7g6), ran non-force `npm audit fix` in root and sanity/, and fixed a real Sanity Studio build break the fix's transitive `@sanity/icons` 3.8.0→5.2.1 bump caused by migrating six files to per-icon subpath imports.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3 (all completed)
- **Files modified:** 9 (2 root, 1 sanity lockfile, 6 sanity source files)

## Accomplishments

- Root `astro` dependency changed from the exact pin `7.0.6` to the caret range `^7.1.4`, resolving to `astro@7.1.4` — clears the moderate-severity GHSA-4g3v-8h47-v7g6 (Reflected XSS via unescaped View Transition animation properties) advisory. Confirmed via `npm audit`: the advisory is gone from the report.
- Non-force `npm audit fix` run in both the repo root and `sanity/`:
  - **Root:** before 4 vulnerabilities (1 moderate = the Astro XSS, already cleared by Task 1; 3 high = brace-expansion, postcss, svgo). After the fix: **0 vulnerabilities**.
  - **Sanity:** before 12 vulnerabilities (1 low, 1 moderate, 10 high — adm-zip, brace-expansion, dompurify, postcss, tar chains). After the fix: dompurify, tar, and postcss advisories cleared; **24 high** remain, all chained through `adm-zip` and `brace-expansion` inside `@sanity/cli`'s own dependency tree (`@module-federation/dts-plugin`, `@sanity/workbench-cli`, `@oclif/core`, etc.). See "Audit count nuance" below — this is not a regression.
- The sanity audit-fix's non-force dependency reflow deduped `@oclif/core` to a single consistent version across all of `@sanity/cli`'s sub-dependents, which as a side effect also deduped the transitive `@sanity/icons` resolution from `3.8.0` to `5.2.1` — a major version this codebase's own files import from directly, not just an internal Studio dependency. `@sanity/icons` v5's package barrel (`import {XIcon} from '@sanity/icons'`) no longer re-exports individual named icon components (replaced by an `Icon`/`icons`-registry API); the barrel-style imports in this codebase broke the Studio build with 27 `MISSING_EXPORT` errors. Fixed by switching every affected import to the package's still-supported per-icon subpath (e.g. `import {BookIcon} from '@sanity/icons/Book'`) across `sanity.config.ts`, `schemas/structure.ts`, `editorial/DocumentChecklist.tsx`, `editorial/dashboardLogic.ts`, `editorial/OpenSitePage.tsx`, and `editorial/EditorialDashboard.tsx` — a mechanical import-path fix with zero visual/behavioral change to the Studio UI. Re-verified `npm --prefix sanity run lint` and `npm --prefix sanity run build` both pass cleanly afterward.
- Full root verification suite run on the final combined dependency tree: `npm run typecheck` (0 errors), `npm run test:unit` (165/165 passed), `npm run build` (27 pages built cleanly, real Sanity content fetched), and `npx playwright test` full suite (247/247 passed — chromium full run including all View Transition / carousel-morph specs, plus webkit-mobile smoke). The astro bump did not break any View Transition behavior in `HomeCarousel.astro` / `DetailHero.astro`.

### Audit count nuance (sanity/)

Sanity's raw `npm audit` vulnerability count went from **12** (1 low, 1 moderate, 10 high) before the fix to **24 high** after. This reads like a regression but is not one: the non-force fix deduped `@oclif/core` to a single consistent version across every one of `@sanity/cli`'s sub-dependents (previously multiple, slightly different, all-vulnerable versions were scattered through the tree). npm's audit report counts *dependency paths* to a vulnerable package, and after the dedup more paths now converge on that one (still-vulnerable) `@oclif/core`/`adm-zip`/`brace-expansion` chain, inflating the path count even though the underlying vulnerable-package set is smaller and the *unique* advisories are the same two (`adm-zip`, `brace-expansion`) that were already present before the fix. The only resolution npm offers for these is `npm audit fix --force`, which would downgrade `sanity` to `6.1.0` — a breaking regression explicitly out of scope per this plan's "never a major/breaking bump" constraint. This is dev/build-tooling-only exposure (Sanity Studio's own CLI tooling), never shipped to browsers, and is accepted/reported rather than forced, consistent with the plan's threat register (T-mvx-03, T-mvx-SC).

## Task Commits

1. **Task 1: Bump Astro to a patched 7.x and update the root lockfile** - `35a4de1` (fix)
2. **Task 2: Non-force npm audit fix in root and sanity subproject** - `e0af91f` (fix)
3. **Task 3: Full root verification suite on the final dependency tree** - no commit (verification-only, no source changes)

## Files Created/Modified

- `package.json` - `dependencies.astro` changed from exact pin `7.0.6` to caret range `^7.1.4`
- `package-lock.json` - updated for astro 7.1.4 (Task 1) and non-force audit-fix transitive bumps (Task 2)
- `sanity/package-lock.json` - non-force audit-fix transitive bumps (dompurify/tar/postcss cleared; `@oclif/core` deduped, incidentally bumping `@sanity/icons` 3.8.0→5.2.1)
- `sanity/sanity.config.ts` - `DashboardIcon`/`DocumentsIcon`/`ImagesIcon` imports switched to per-icon subpaths
- `sanity/schemas/structure.ts` - `BookIcon`/`CalendarIcon`/`CogIcon`/`EnvelopeIcon`/`HomeIcon`/`ImagesIcon`/`TagsIcon`/`UserIcon` imports switched to per-icon subpaths
- `sanity/editorial/DocumentChecklist.tsx` - `TaskIcon` import switched to subpath
- `sanity/editorial/dashboardLogic.ts` - `BulbOutlineIcon`/`ErrorOutlineIcon`/`PublishIcon`/`TaskIcon` imports switched to subpaths
- `sanity/editorial/OpenSitePage.tsx` - `LaunchIcon` import switched to subpath
- `sanity/editorial/EditorialDashboard.tsx` - `AddIcon`/`CheckmarkCircleIcon`/`ChevronRightIcon`/`CogIcon`/`DocumentIcon`/`ErrorOutlineIcon`/`FolderIcon`/`ImagesIcon`/`LaunchIcon`/`WarningOutlineIcon` imports switched to subpaths

## Decisions Made

- Kept astro strictly on the 7.x line (`^7.1.4`, resolved `7.1.4`) per the plan's explicit "never 8.x" constraint.
- Did not force-resolve sanity's remaining `adm-zip`/`brace-expansion` advisories since the only path is a breaking `sanity@6.1.0` downgrade — accepted and documented as residual, matching the plan's threat-register disposition.
- Fixed the real Sanity Studio build breakage the audit fix incidentally introduced (via `@sanity/icons` major bump) rather than reverting the audit fix or force-pinning `@sanity/icons` back to `3.8.0` — pinning back would risk leaving Sanity Studio's own internal code (which now expects the v5 API) broken instead, a worse and less visible failure mode than the explicit build-time errors this approach surfaced and fixed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Sanity Studio build breakage from transitive @sanity/icons major bump**
- **Found during:** Task 2 (Non-force npm audit fix in root and sanity subproject)
- **Issue:** The non-force `npm --prefix sanity audit fix` deduped `@oclif/core` to a single version across `@sanity/cli`'s dependents, which as a side effect also deduped the transitive `@sanity/icons` resolution from `3.8.0` to `5.2.1`. `@sanity/icons` v5 removed all named per-icon exports from its main barrel (replaced with an `Icon`/`icons`-registry API), breaking every barrel-style `import {XIcon} from '@sanity/icons'` in this codebase — `sanity build` failed with 27 `MISSING_EXPORT` errors.
- **Fix:** Switched all affected imports across 6 files to the package's documented per-icon subpath exports (e.g. `import {BookIcon} from '@sanity/icons/Book'`), which still export the same named `XIcon` React components. Zero visual/behavioral change to the Studio UI — purely an import-path fix.
- **Files modified:** `sanity/sanity.config.ts`, `sanity/schemas/structure.ts`, `sanity/editorial/DocumentChecklist.tsx`, `sanity/editorial/dashboardLogic.ts`, `sanity/editorial/OpenSitePage.tsx`, `sanity/editorial/EditorialDashboard.tsx`
- **Verification:** `npm --prefix sanity run lint` (clean) and `npm --prefix sanity run build` (Studio builds successfully) both pass on the final tree.
- **Committed in:** `e0af91f` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug)
**Impact on plan:** The auto-fix was necessary to satisfy the plan's own Task 2 done criteria ("if sanity files changed, sanity lint + build pass"). No scope creep — the fix is a mechanical import-path change with no behavioral effect on the Studio's UI or functionality.

## Issues Encountered

- During verification, an intermediate state where `sanity/node_modules` and `sanity/package-lock.json` had drifted out of sync (installed tree reflecting an older resolution than the lockfile on disk) produced a false-negative "build passes" reading at one point. Re-ran `npm --prefix sanity install` to resync the installed tree to the lockfile before re-verifying, which reproduced the real build failure described above — resolved by the Rule 1 fix, then re-confirmed green on a consistent tree.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Root dependency tree is fully clean (0 `npm audit` vulnerabilities), astro is on a patched 7.x version, and the full verification suite (typecheck, unit, build, e2e) is green.
- Sanity subproject has 2 unique residual advisories (`adm-zip`, `brace-expansion`) that require a breaking `sanity@6.1.0` downgrade to force-resolve — deliberately left unresolved per the plan's zero-major-version-jump constraint; tracked here for future awareness if `@sanity/cli` ships a non-breaking fix upstream.
- No blockers for subsequent work.

---
*Quick task: 260727-mvx*
*Completed: 2026-07-27*

## Self-Check: PASSED

All 9 modified/created files confirmed present on disk; both task commits (`35a4de1`, `e0af91f`) confirmed present in git history.
