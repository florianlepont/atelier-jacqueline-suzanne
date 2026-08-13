---
phase: quick-260813-wb5-run-npm-audit-fix-no-force-in-root-and-s
plan: 01
subsystem: infra
tags: [npm, security, dependencies]

requires: []
provides:
  - "Root project: 0 npm audit vulnerabilities (was 4 high)"
  - "sanity/: brace-expansion, dompurify, nanoid vulnerabilities fixed (was 12 total); js-yaml + undici remain, both --force-only and left alone"
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - package-lock.json
    - sanity/package-lock.json

key-decisions:
  - "Did not run npm audit fix --force in sanity/ — its only remaining 2 advisories (js-yaml, undici) are nested inside @sanity/cli's own dependency chain (via @vercel/frameworks and @module-federation/dts-plugin) and only have a --force fix path that installs sanity@5.14.1, a downgrade from the version deliberately pinned to exactly 6.6.0 in quick task 260811-kog-06. Left as a recorded, intentional follow-up rather than silently forced."

patterns-established: []

requirements-completed: [QUICK-260813-WB5]

coverage:
  - id: D1
    description: "Root project's 4 high-severity vulnerabilities (brace-expansion, fast-uri, js-yaml, nanoid) fixed via npm audit fix, no --force"
    requirement: "QUICK-260813-WB5"
    verification:
      - kind: other
        ref: "npm audit — 0 vulnerabilities"
        status: pass
    human_judgment: false
  - id: D2
    description: "sanity/'s non-force-fixable vulnerabilities (brace-expansion, dompurify, nanoid) fixed; the 2 --force-only ones (js-yaml, undici) deliberately left alone with a recorded reason"
    requirement: "QUICK-260813-WB5"
    verification:
      - kind: other
        ref: "npm audit --prefix sanity — only js-yaml and undici remain, both explicitly --force-only per npm's own output"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full verification chain passes identically to before the fix — no regression from the dependency bumps"
    requirement: "QUICK-260813-WB5"
    verification:
      - kind: unit
        ref: "npm run typecheck (0 errors), npx vitest run (640/640), npm --prefix sanity run lint (clean), npm --prefix sanity run build (clean), npm --prefix sanity run test:coverage (45/45, thresholds + per-file gate pass)"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-08-13
status: complete
---

# Quick Task 260813-wb5: npm audit fix (non-breaking) Summary

**Patched all non-breaking npm audit vulnerabilities in both the root project (4 high → 0) and sanity/ (3 of 4 advisory groups fixed), leaving only 2 advisories that are nested inside Sanity's own CLI dependency chain and only fixable via a --force downgrade of the deliberately-pinned sanity version.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 1 completed

## Accomplishments
- Root project: `npm audit fix` resolved all 4 high-severity vulnerabilities (brace-expansion, fast-uri, js-yaml, nanoid) — 0 vulnerabilities remaining.
- `sanity/`: `npm audit fix` resolved brace-expansion, dompurify, and nanoid — down from 12 total vulnerabilities to 2 (both in the same advisory chain, js-yaml + undici, nested inside `@sanity/cli` → `@vercel/frameworks`/`@module-federation/dts-plugin`).
- Confirmed the 2 remaining advisories are correctly left alone: their only fix path (`npm audit fix --force`) would install `sanity@5.14.1`, downgrading from the version this project deliberately pinned to exactly `6.6.0` in `260811-kog-06` — forcing this would silently undo that pin.
- Full verification chain re-run and confirmed identical to pre-fix results: root typecheck (0 errors), root unit tests (640/640), Sanity Studio lint (clean), build (clean), and test:coverage (45/45, all thresholds pass) — no regression from the dependency bumps.

## Task Commits

1. **Task 1: Run npm audit fix in both projects and verify nothing broke** - committed as this quick task's docs+lockfile commit (no source code changed, only the two lockfiles)

## Files Created/Modified
- `package-lock.json` - 9 packages added, 4 removed, 16 changed (root audit fix)
- `sanity/package-lock.json` - dependency tree updated (355 insertions, 603 deletions) resolving 3 of 4 advisory groups

## Decisions Made

See `key-decisions` in frontmatter.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Two dev-tooling-only vulnerabilities remain in `sanity/`'s dependency tree (js-yaml, undici, both nested in `@sanity/cli`'s own dependencies), deliberately left unfixed since the only remediation path downgrades `sanity` itself. Worth periodically re-checking (`npm audit --prefix sanity`) in case Sanity ships a newer CLI release that resolves these without requiring a version downgrade.
- No other action needed — both projects' lockfiles are up to date and fully verified.

---
*Phase: quick-260813-wb5-run-npm-audit-fix-no-force-in-root-and-s*
*Completed: 2026-08-13*
