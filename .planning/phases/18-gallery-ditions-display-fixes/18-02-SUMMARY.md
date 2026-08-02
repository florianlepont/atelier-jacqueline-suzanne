---
phase: 18-gallery-ditions-display-fixes
plan: 02
subsystem: ui
tags: [astro, css, sanity, playwright, vitest, tdd]

# Dependency graph
requires:
  - phase: 18-gallery-ditions-display-fixes
    provides: "Plan 01 (PORT-05, PORT-06) — thumbnail tile frame removal and footer restoration, merged before this worktree branched"
provides:
  - "Gallery/édition detail hero statement (`.detail-hero__statement`) renders its full text with no CSS line-clamp, on every published gallery, at both 1280x900 and 390x844"
  - "Sanity `statement` field (fr + en) capped at 700 characters in both `gallery.ts` and `edition.ts`, the source-of-truth overflow defence replacing the removed CSS clamp"
  - "Empirical calibration evidence trail for N=700, derived from the real rendered DetailHero panel geometry"
affects: [19-site-wide-visual-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Source-text regex unit tests (readFileSync + .max(N) pattern match) for asserting lockstep between two intentionally-duplicated Sanity schema helper copies that cannot be imported into a root Vitest project (sanity/ has its own node_modules)."
    - "Playwright viewport-swap discipline: setViewportSize() BEFORE page.goto() (never resize-then-mutate on an already-loaded page) when a component has JS driving viewport-gated inline styles with a debounced resize handler — avoids racing the debounce and reading stale inline styles from the previous viewport."

key-files:
  created:
    - tests/unit/statement-length-limit.test.ts
  modified:
    - src/components/DetailHero.astro
    - sanity/schemas/gallery.ts
    - sanity/schemas/edition.ts
    - tests/e2e/gallery.spec.ts

key-decisions:
  - "N=700 (not the CONTEXT.md starting estimate of 250-320, and not the expected ~500 landing zone) — empirically derived in Task 2: none of the 8 candidate lengths tested (300-700) overflowed at either the project's tested mobile (390x844) or desktop (1280x900) viewport, so N_safe_mobile = N_safe_desktop = N_binding = 700, the largest tested candidate. Only the informational-only 360x640 viewport began overflowing, at candidate 500+."
  - "This plan's own CONTEXT.md correction, reconfirmed: the 250-320 char starting estimate would have invalidated 4 of the 8 currently-published statements (all 3 éditions plus the-victorian-tea-room gallery, the longest being édition entasse at 453 fr chars) — re-verified via a fresh live GROQ query at execution time, content unchanged since planning."
  - "Provisioned this fresh worktree with `npm ci` (root) and `npm ci --prefix sanity` (mirrors CI's own two install steps exactly, from already-committed lockfiles) plus a copied local `.env` — required because Task 3's `npm --prefix sanity run lint`/`run build` verify gates cannot run at all without `sanity/node_modules`, unlike Plan 01 where the equivalent gap only affected one unrelated unit-test suite."

requirements-completed: [PORT-04]

coverage:
  - id: D1
    description: "The 4-line CSS clamp on .detail-hero__statement is removed entirely (display/-webkit-line-clamp/line-clamp/-webkit-box-orient/overflow all deleted), no substitute cap, matching the Phase 17 HOME-12 precedent"
    requirement: "PORT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail hero statement renders in full, no clamp, no clipping (PORT-04, D-01) > desktop (1280x900)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail hero statement renders in full, no clamp, no clipping (PORT-04, D-01) > mobile (390x844)"
        status: pass
      - kind: automated_ui
        ref: "grep of .detail-hero__statement rule: exactly margin-top/font-size/line-height/color remain, git diff --stat shows 5 deletions/0 additions"
        status: pass
    human_judgment: false
  - id: D2
    description: "The un-clamped statement never self-clips and never escapes .detail-hero__pin's clipped bounds, for every published gallery, at both tested viewports"
    requirement: "PORT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail hero statement renders in full, no clamp, no clipping (PORT-04, D-01) — loops all 5 published galleries, scrollHeight<=clientHeight + reveal-inside-pin assertions"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both gallery.ts and edition.ts cap statement.fr/statement.en at the same empirically-derived N=700, chained after the existing required() constraint, with matching French error messages naming the limit"
    requirement: "PORT-04"
    verification:
      - kind: unit
        ref: "tests/unit/statement-length-limit.test.ts (5 assertions: 2-per-file constraint count, cross-file identical value, sane-band check, siteSettings.ts untouched)"
        status: pass
      - kind: other
        ref: "npm --prefix sanity run lint && npm --prefix sanity run build (both exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "sanity/schemas/siteSettings.ts's third, explicitly out-of-scope localeTextField copy is provably untouched"
    requirement: "PORT-04"
    verification:
      - kind: unit
        ref: "tests/unit/statement-length-limit.test.ts#siteSettings.ts declares 0 max-length constraints"
        status: pass
    human_judgment: false
  - id: D5
    description: "N is traceable to recorded measurements of the real rendered DetailHero component (not guessed), and is at or above the longest currently-published statement"
    requirement: "PORT-04"
    verification:
      - kind: other
        ref: "Calibration evidence trail below (re-run GROQ table, 24-row overflow-measurement table, N_safe_mobile/N_safe_desktop/N_binding derivation)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The Studio dev-server enforces the new rule live (over-length input blocked with the new French message; the longest already-published document opens with no validation error) — visual confirmation of the full un-clamped statement at desktop/phone widths"
    human_judgment: true
    rationale: "Genuinely interactive/visual verification (typing into Studio, reading a live page at two widths) — per this project's workflow.human_verify_mode: end-of-phase config, deferred to the end-of-phase human-verify pass covering the whole of Phase 18, exactly as Plan 01 deferred its own footer/border visual check. The automated proof that the schema still compiles into a working Studio (npm --prefix sanity run build, D3 above) already passed; only the interactive click-through is deferred."

# Metrics
duration: 40min
completed: 2026-08-02
status: complete
---

# Phase 18 Plan 02: Gallery Description Truncation Fix Summary

**Removed `.detail-hero__statement`'s 4-line CSS clamp with no substitute cap, replacing it with an empirically-calibrated 700-character Sanity Studio validation applied in lockstep to both `gallery.ts` and `edition.ts`, proven by Playwright across every published gallery at two viewports and by a source-text unit test guarding the two duplicated schema helpers against divergence.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-08-02T19:45Z (approx, first Read)
- **Completed:** 2026-08-02T20:02Z
- **Tasks:** 3 completed (Task 2 produced evidence only, no committed source change)
- **Files modified:** 4 (`DetailHero.astro`, `gallery.ts`, `edition.ts`, `gallery.spec.ts`); 1 created (`statement-length-limit.test.ts`)

## Accomplishments

- PORT-04 (display): the gallery/édition detail hero's description text is no longer truncated after 4 lines — `.detail-hero__statement` reports a computed `-webkit-line-clamp` of `none`, self-clips nowhere, and stays inside `.detail-hero__pin`'s clipped bounds for every published gallery at both 1280x900 and 390x844.
- PORT-04 (source bound): `sanity/schemas/gallery.ts` and `sanity/schemas/edition.ts` now cap `statement.fr`/`statement.en` at the same empirically-derived limit (N=700), chained after the existing `.required()` constraint, with clear French error messages naming the limit — guarded against silent divergence by a new source-text unit test.
- Corrected CONTEXT.md's starting estimate of 250-320 characters, which was flagged as "a starting point to be verified, not a decision" and would have retroactively invalidated 4 of the 8 currently-published statements (all 3 éditions plus gallery `the-victorian-tea-room`) had it shipped unchanged.

## Task Commits

Each task followed the plan's TDD gate sequence (test → feat), Task 2 is measurement-only:

1. **Task 1: Remove the 4-line clamp and prove no clipping across every published gallery (PORT-04, D-01)**
   - RED: `e723606` — `test(18-02): add failing PORT-04 no-clamp/no-clip e2e tests for detail hero statement`
   - GREEN: `e87fcc2` — `feat(18-02): remove 4-line clamp from detail hero statement (PORT-04, D-01)`
2. **Task 2: Empirically calibrate the statement character limit N** — no commit (evidence-only task; full trail below)
3. **Task 3: Apply the calibrated limit to both duplicated Sanity localeTextField helpers, in lockstep (PORT-04, D-02/D-03)**
   - RED: `bd194d3` — `test(18-02): add failing lockstep unit tests for statement max-length (PORT-04, D-03)`
   - GREEN: `59a48c7` — `feat(18-02): cap statement.fr/en at 700 chars in both Sanity schemas (PORT-04, D-02/D-03)`

_Plan metadata commit: pending (final metadata commit, see below)._

## Files Created/Modified

- `src/components/DetailHero.astro` — deleted the five truncation declarations (`display: -webkit-box`, `-webkit-line-clamp: 4`, `line-clamp: 4`, `-webkit-box-orient: vertical`, `overflow: hidden`) from `.detail-hero__statement`; kept `margin-top`, `font-size`, `line-height`, `color` unchanged. No substitute cap added.
- `sanity/schemas/gallery.ts` — chained `.max(700)` between `.required()` and `.error(...)` on both `fr` and `en` subfields inside the local `localeTextField` helper's `statement` call site; updated both French error messages to name the 700-character limit.
- `sanity/schemas/edition.ts` — the identical edit, same N=700, same message shape, in its own private copy of the same helper.
- `tests/e2e/gallery.spec.ts` — new `PORT-04` describe block: 2 tests (desktop 1280x900, mobile 390x844), each looping every published gallery via the existing homepage-grid discovery convention, asserting computed clamp `none`, `scrollHeight <= clientHeight`, reveal-inside-pin (1px tolerance, both edges), and no ellipsis character.
- `tests/unit/statement-length-limit.test.ts` (new) — 5 source-text regex assertions: `gallery.ts` and `edition.ts` each declare exactly 2 `.max(N)` constraints, both files share the identical N, N is within [300, 800], and `siteSettings.ts`'s third out-of-scope helper copy declares 0.

## Calibration Evidence Trail (Task 2)

### Re-run GROQ length table (2026-08-02, execution time)

Content unchanged since planning — same query, same result:

| type | slug | fr length | en length |
|---|---|---|---|
| gallery | the-victorian-tea-room | **415** | 352 |
| gallery | adult | 217 | 190 |
| gallery | silos | 209 | 194 |
| gallery | brume | 159 | 141 |
| gallery | paysage | 59 | 62 |
| edition | entasse | **453** | 401 |
| edition | rebut | 294 | 300 |
| edition | silos | 295 | 288 |

**N_floor = 453** (the maximum across every fr/en length above — édition `entasse`, French).

### Probe overflow-measurement table

Probe navigated to `/galleries/the-victorian-tea-room/` (the longest-statement gallery), built filler text by concatenating the longest published French statement (édition `entasse`'s real prose, 453 chars) with itself and slicing to each candidate length at the last word boundary, then replaced `.detail-hero__statement`'s `textContent` and measured whether `.detail-hero__reveal`'s bounding rect escaped `.detail-hero__pin`'s bounds on either edge. Viewport was set **before** each navigation (not resize-then-mutate on an already-loaded page) so DetailHero's `matchMedia('(min-width: 768px)')`-gated inline-style reveal driver initialized cleanly for each viewport — an earlier version of the probe that reused one loaded page across viewport changes produced stale-inline-style artifacts and was corrected before accepting any numbers.

| viewport | candidate length | actual length | overflowed | self-clipped | reveal height (px) | pin height (px) |
|---|---|---|---|---|---|---|
| 390x844 | 300 | 295 | false | false | 265.3 | 590.8 |
| 390x844 | 350 | 341 | false | false | 313.3 | 590.8 |
| 390x844 | 400 | 396 | false | false | 337.3 | 590.8 |
| 390x844 | 450 | 439 | false | false | 361.3 | 590.8 |
| 390x844 | 500 | 499 | false | false | 385.3 | 590.8 |
| 390x844 | 550 | 537 | false | false | 409.3 | 590.8 |
| 390x844 | 600 | 598 | false | false | 457.3 | 590.8 |
| 390x844 | 700 | 695 | false | false | 505.3 | 590.8 |
| 1280x900 | 300 | 295 | false | false | 469.8 | 900.0 |
| 1280x900 | 350 | 341 | false | false | 469.8 | 900.0 |
| 1280x900 | 400 | 396 | false | false | 517.8 | 900.0 |
| 1280x900 | 450 | 439 | false | false | 517.8 | 900.0 |
| 1280x900 | 500 | 499 | false | false | 565.8 | 900.0 |
| 1280x900 | 550 | 537 | false | false | 565.8 | 900.0 |
| 1280x900 | 600 | 598 | false | false | 589.8 | 900.0 |
| 1280x900 | 700 | 695 | false | false | 637.8 | 900.0 |
| 360x640 (informational) | 300 | 295 | false | false | 289.3 | 448.0 |
| 360x640 (informational) | 350 | 341 | false | false | 313.3 | 448.0 |
| 360x640 (informational) | 400 | 396 | false | false | 361.3 | 448.0 |
| 360x640 (informational) | 450 | 439 | false | false | 385.3 | 448.0 |
| 360x640 (informational) | 500 | 499 | **true** | false | 433.3 | 448.0 |
| 360x640 (informational) | 550 | 537 | **true** | false | 457.3 | 448.0 |
| 360x640 (informational) | 600 | 598 | **true** | false | 505.3 | 448.0 |
| 360x640 (informational) | 700 | 695 | **true** | false | 553.3 | 448.0 |

Filler text was derived from real French prose (édition `entasse`'s actual published statement, concatenated with itself and sliced at word boundaries) rather than a repeated single character, per the plan's requirement.

### N derivation (Step 4 decision rule)

- `N_safe_mobile` (largest candidate not overflowing at 390x844) = **700** (none of the 8 tested candidates overflowed).
- `N_safe_desktop` (largest candidate not overflowing at 1280x900) = **700** (same — no overflow across the full 300-700 range).
- `N_binding` = min(700, 700) = **700**.
- `N_floor` = 453.
- **Branch taken: Step 4, branch 1** (`N_binding >= N_floor`) — `N` set to the largest multiple of 50 ≤ `N_binding` (700) and ≥ `N_floor` (453): **N = 700**.
- Sanity cross-check (Step 5): at 390x844 the pin is ~590.8px (matches the CSS's `70svh`/`min-height: 420px`, well above the floor), the reveal is bottom-anchored with `space-xl` (32px) offsets, and 700 characters at 16px/1.5 line-height produced a measured reveal height of only 505.3px against a 590.8px pin — an ~85px margin, consistent with the panel's real geometry, not a sign of measuring the wrong element.
- The informational-only 360x640 viewport (`70svh` = 448px, right at the CSS `min-height: 420px` floor) began overflowing at candidate 500+, confirming it is genuinely the tightest geometry variant in the codebase — but per the plan it is NOT used to lower N, since neither of the project's two actually-tested viewports (390x844, 1280x900) is that narrow.
- N=700 sits at the edge of, but within, the plan's expected 450-700 sanity band — higher than the pre-calibration estimate of ~500, because the real mobile/desktop panel geometry has more headroom than CONTEXT.md's rough starting estimate assumed.

## Decisions Made

- **N=700**, not the CONTEXT.md starting estimate (250-320) nor the plan's own pre-calibration expectation (~500) — see the full derivation above. This is Claude's Discretion per CONTEXT.md, explicitly required to be measured rather than guessed, and the measurement is what it is: no tested candidate up to 700 characters overflowed the real panel at either tested viewport.
- **Provisioned a completely fresh worktree** (`npm ci` at root, `npm ci --prefix sanity`, copied `.env` from the main checkout) before Task 3's `npm --prefix sanity run lint`/`run build` gates could run at all — this worktree had neither `node_modules` directory nor `sanity/node_modules`. Both installs restore exactly what each already-committed lockfile specifies (identical to CI's own `npm ci` / `npm ci --prefix sanity` steps), not new/unverified packages, so this is routine environment provisioning rather than a package-legitimacy concern.
- **Fixed a bug in my own first calibration-probe draft** before accepting any numbers from it: reusing one already-loaded page across `setViewportSize()` calls raced DetailHero's 100ms debounced resize handler and produced stale inline-style artifacts (uniform, content-length-independent "overflow" at the narrowest viewport). Corrected to set the viewport BEFORE each navigation, mirroring `gallery.spec.ts`'s own established convention — this is why the calibration table above is trustworthy.

## Deviations from Plan

None — plan executed exactly as written. The two setup steps above (worktree provisioning, probe self-correction) are execution-environment and measurement-instrument concerns, not deviations from the plan's specified source-file changes or acceptance criteria.

## Issues Encountered

- **This worktree had no `node_modules` at all (root or `sanity/`)** and no `.env` — a fresh worktree, unlike Plan 01's which retained some prior state. `npm ci` and `npm ci --prefix sanity` (mirroring CI's own provisioning steps from already-committed lockfiles) plus a copied `.env` resolved this; `sanity/node_modules`'s prior absence also incidentally fixed Plan 01's previously-logged `dashboard-logic.test.ts` import failure (now 16/16 unit test files pass, 276/276 tests).
- **Sanity Studio dev server (port 3333) was already occupied** by another process when attempting the Task 3 Step 6 interactive verification — not something this plan started. Per `workflow.human_verify_mode: end-of-phase`, this interactive check (typing over-length text into Studio and confirming the block, then confirming the longest published document opens clean) is deferred to the end-of-phase human-verify pass, exactly as Plan 01 deferred its own visual check. The automated proof that the schema still compiles (`npm --prefix sanity run build`, exit 0) already ran and passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 (PORT-04) is fully implemented and verified by automated tests (Playwright e2e, Vitest unit, `astro check`, Studio lint/build, full `npm run test:e2e` on both configured projects, `npm run test:coverage`).
- Per `workflow.human_verify_mode: end-of-phase`, two interactive checks remain for the end-of-phase pass: (1) this plan's Task 3 Step 6 Studio dev-server observations (over-length block, longest-published-document-opens-clean), and (2) Plan 01's already-noted footer/border visual confirmation — both can be done together in one end-of-phase session.
- All three of Phase 18's requirements (PORT-04, PORT-05, PORT-06) now have their automated verification complete; the phase is ready for its end-of-phase human-verify checkpoint.

---
*Phase: 18-gallery-ditions-display-fixes*
*Completed: 2026-08-02*
