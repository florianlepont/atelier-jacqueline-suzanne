---
phase: 15-about-page-editorial-redesign
plan: 04
subsystem: ui
tags: [about, verification, uat, accessibility, editorial, page-title-header]

requires:
  - phase: 15-about-page-editorial-redesign (15-01/15-02/15-03)
    provides: sketch-014 winner, static editorial composition, scroll-scrubbed hero reveal
provides:
  - Phase 15 acceptance verification against all 5 ROADMAP success criteria
  - Padding-parity fix so About's PageTitleHeader lands at the same position as Contact/Éditions
affects: [16-404-page-editorial-redesign]

tech-stack:
  added: []
  patterns:
    - "Page container padding must split top/bottom (dedicated smaller top clamp for header position parity; larger --editorial-page-padding-block reserved for bottom only) — now proven across Contact, Éditions, and About."

key-files:
  created:
    - .planning/phases/15-about-page-editorial-redesign/15-04-SUMMARY.md
  modified:
    - src/components/AboutPageBody.astro

key-decisions:
  - "UAT (human-verify checkpoint) found the About title rendering ~40-56px lower than Contact/Éditions — a real violation of ROADMAP criterion 1 ('same display font, size, position...'). Root-caused to About's container applying --editorial-page-padding-block to both top and bottom, instead of splitting top/bottom like Contact/Éditions do. Fixed directly (not deferred to a gap-closure phase) since the diagnosis was precise and the fix was a single CSS property change, verified pixel-for-pixel before re-requesting sign-off."
  - "Isolated worktree executors lack a real Sanity .env (gitignored, not copied into fresh worktrees) — build/e2e/preview cannot run there. All gate verification for this plan was run at the orchestrator level (the checkout that has a working .env), consistent with how the Contact redesign was verified."

patterns-established: []

requirements-completed: [ABOUT-03, ABOUT-04]

coverage:
  - id: D1
    description: "Full CI-equivalent gate green on the redesigned About page: astro check, Vitest unit+coverage, Playwright e2e (about.spec.ts on chromium + cross-browser smoke on webkit-mobile), and accessibility.spec.ts for /about/ and /en/about/."
    verification:
      - kind: unit
        ref: "npm run test:coverage — 210/210 tests, 96.3% statement coverage"
        status: pass
      - kind: e2e
        ref: "tests/e2e/about.spec.ts (chromium) — 12/12"
        status: pass
      - kind: e2e
        ref: "tests/e2e/critical.smoke.spec.ts (webkit-mobile) — 4/4"
        status: pass
      - kind: e2e
        ref: "tests/e2e/accessibility.spec.ts — /about/ and /en/about/, 10/10 total, no serious/critical violations"
        status: pass
      - kind: other
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
    human_judgment: false
  - id: D2
    description: "The redesigned About page reads as one coherent editorial composition matching Contact/Éditions, in both locales, across all motion states — including title position parity (criterion 1)."
    verification:
      - kind: manual_procedural
        ref: "Human UAT at http://localhost:4321/about/ and /en/about/, both before and after the padding fix (commit 22df1b8)"
        status: pass
    human_judgment: true
    rationale: "Visual/compositional coherence and cross-page position parity are inherently human judgment calls — the automated gate cannot assert 'reads as coherent' or catch a ~40px positional drift on its own; this is exactly what the checkpoint caught."

duration: 55min
completed: 2026-07-29
status: complete
---

# Phase 15: About Page Editorial Redesign Summary

**About page adopts PageTitleHeader with sketch-014 Variant A composition and scroll-scrubbed hero reveal; UAT caught and fixed a title-position regression before sign-off.**

## Performance

- **Duration:** ~55 min (Task 1 gate run + checkpoint + fix + re-verification + final sign-off)
- **Tasks:** 2/2 (Task 1 automated gate, Task 2 human-verify checkpoint)
- **Files modified:** 1 (`src/components/AboutPageBody.astro`, fix only — Task 1 itself modified nothing)

## Accomplishments
- Ran the full CI-equivalent gate against the redesigned About page (typecheck, build, unit+coverage, e2e chromium + webkit-mobile smoke, accessibility) — all green.
- Human UAT caught a real defect the automated gate could not: About's title rendered ~40-56px lower than Contact/Éditions, violating ROADMAP criterion 1 ("same display font, size, position..."). Root-caused to inconsistent container padding and fixed.
- Re-verified the fix pixel-for-pixel via screenshot comparison and re-ran the full gate — no regressions.
- User confirmed final approval across both locales.
- All 5 ROADMAP Phase 15 success criteria demonstrably satisfied (see below).

## Task Commits

This plan's Task 1 (`files_modified: []` per its own frontmatter) made no commits — verification only. The checkpoint (Task 2) surfaced an issue that required one fix commit outside this plan's original scope:

1. **UAT fix:** `22df1b8` — fix(15-04): match About page's top padding to Contact/Éditions

_No `15-04-PLAN.md` task itself was a `type="auto"` code-modifying task; this fix was applied directly in response to the Task 2 checkpoint's reported issue, per the checkpoint-resolution flow (report issue → diagnose → fix → re-verify → re-request approval)._

## Files Created/Modified
- `src/components/AboutPageBody.astro` — split `.about-page` container padding into `padding-top: clamp(48px, 7vw, 56px)` (matching Contact/Éditions) and `padding-bottom: var(--editorial-page-padding-block)`, replacing a single `padding` shorthand that applied the larger bottom-sized token to both edges.

## Decisions Made
- Fixed the UAT-found padding bug directly within this plan rather than deferring to a separate gap-closure phase — the diagnosis was precise (root-caused via direct CSS/component inspection, not guesswork) and the fix was a single, low-risk property change with full pixel-verification before re-requesting sign-off.
- Verified all automated gates at the orchestrator's own checkout (real `.env`/Sanity credentials) rather than in an isolated executor worktree, since fresh worktrees don't inherit the gitignored `.env` — consistent with the established pattern from the Contact redesign.

## Deviations from Plan

### Auto-fixed Issues

**1. [UAT finding] About page title/eyebrow positioned lower than Contact/Éditions**
- **Found during:** Task 2 (human-verify checkpoint) — user reported "le titre de À propos n'est pas positionné pareil" after reviewing a screen recording
- **Issue:** `.about-page` container used `padding: var(--editorial-page-padding-block) var(--editorial-page-padding-inline)`, applying the same ~96px value to top padding that Contact/Éditions reserve for bottom padding only. Contact/Éditions use `padding-top: clamp(48px, 7vw, 56px)` specifically so the title lands "at the exact same distance from the site header on both pages" (verbatim from `ContactPageBody.astro`'s own comment). About's title rendered ~40-56px lower as a result — a direct violation of ROADMAP criterion 1's "same display font, size, position" requirement.
- **Fix:** Split `.about-page`'s padding into `padding-top: clamp(48px, 7vw, 56px)` + `padding-bottom: var(--editorial-page-padding-block)`, matching Contact/Éditions exactly.
- **Files modified:** `src/components/AboutPageBody.astro`
- **Verification:** Playwright screenshot comparison at identical 1400×900 viewport confirmed pixel-identical eyebrow/title y-position across About, Contact, and Éditions after the fix. Full gate (typecheck, build, 210 unit tests, 12 About e2e tests) re-run and green post-fix. User re-confirmed approval.
- **Committed in:** `22df1b8`

---

**Total deviations:** 1 auto-fixed (UAT finding, not a plan-execution rule violation)
**Impact on plan:** Necessary correctness fix for ROADMAP criterion 1. No scope creep — single CSS property change, no new abstractions.

## Issues Encountered
- Isolated worktree executors (both this plan's own Wave 4 dispatch and prior waves) cannot run `npm run build`/`test:e2e`/`preview` — the gitignored `.env` with Sanity credentials isn't copied into fresh git worktrees. Resolved by running the full gate at the orchestrator's own checkout for every wave's post-merge verification, per the project's established pattern (documented in prior waves' SUMMARYs and in project memory).

## Human Sign-off (Task 2 checkpoint)

**Result:** Approved, after one round-trip.

1. First pass: user reported the title-position issue (see Deviations above), not approved.
2. Fix applied, re-verified, both `/about/` and `/en/about/` reopened for the user.
3. User confirmed: "I confirm" — all 5 ROADMAP criteria hold in both locales.

## ROADMAP Phase 15 Success Criteria — Final Status

1. ✅ **Title via shared `PageTitleHeader`** — same display font, size, **position** (post-fix), halftone texture, hairline divider as Contact/Éditions.
2. ✅ **Coherent editorial composition** — lead bio, circular portrait accent, pinned hero-photo reveal, two-column numbered sections read as one composition; confirmed via human UAT.
3. ✅ **Chosen from multiple sketched proposals** — sketch-014 (3 variants), Variant A named winner by the user (15-01).
4. ✅ **Copy preserved verbatim** — bio/practice/medium text unchanged in both locales (e2e-verified in `about.spec.ts`).
5. ✅ **Renders correctly in FR + EN** — verified via e2e (12/12) and human UAT at both `/about/` and `/en/about/`.

## Next Phase Readiness
- Phase 15 (About Page Editorial Redesign) is fully complete — ABOUT-03 and ABOUT-04 satisfied.
- Phase 16 (404 Page Editorial Redesign) has no dependency on Phase 15 beyond the already-shipped `PageTitleHeader` component, and can proceed independently.
- No blockers.

---
*Phase: 15-about-page-editorial-redesign*
*Completed: 2026-07-29*
