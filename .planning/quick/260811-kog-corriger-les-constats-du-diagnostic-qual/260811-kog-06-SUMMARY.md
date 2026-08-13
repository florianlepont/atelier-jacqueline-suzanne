---
phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual
plan: 06
subsystem: infra
tags: [ci, sanity, contact-form, coverage, vitest]

requires:
  - phase: 260811-kog-02
    provides: "Homepage unification (context for this plan's CI/coverage work, not a direct code dependency)"
  - phase: 260811-kog-04
    provides: "Detail-page unification (same)"
  - phase: 260811-kog-05
    provides: "Sanity Studio test harness + coverage gate (wired into CI by this plan)"
provides:
  - "Contact form fails honestly (no network, mailto fallback) when Web3Forms is unconfigured"
  - "Sanity pinned to exactly 6.6.0 with autoUpdates disabled"
  - "Root lint and Studio coverage as new blocking CI gates in .github/workflows/deploy.yml"
  - "Root coverage thresholds raised to 80/75/80/80"
affects: [contact-form, ci-pipeline, sanity-studio-deployment, coverage-gates]

tech-stack:
  added: []
  patterns:
    - "data-* attribute as the DOM-testable seam for a build-time env-derived value (data-access-key), mirroring the existing pattern already used for every other locale string on this component"
    - "Structured-but-dependency-free static config verification (slicing a specific source block / extracting ordered YAML step names via a single consistent regex) in place of either an ambiguous whole-file substring search or a new parsing-library dependency"

key-files:
  modified:
    - src/components/ContactForm.astro
    - tests/e2e/contact.spec.ts
    - tests/e2e/critical.smoke.spec.ts
    - README.md
    - sanity/sanity.cli.ts
    - sanity/package.json
    - sanity/package-lock.json
    - .github/workflows/deploy.yml
    - tests/unit/deployment.test.ts
    - vitest.config.ts

key-decisions:
  - "The no-key fallback message is deliberately worded differently from the existing submission-error message (which implies a send was attempted and failed) -- no network attempt is made at all, so the copy must not imply one was."
  - "Test scenarios reaching the mocked network path now inject a clearly-fake data-access-key via a shared injectFakeAccessKey() helper -- never a real key, never read from an env var or fixture that could accidentally hold one, satisfying the plan's own threat model entry on this exact point."
  - "sanity.cli.ts's autoUpdates check is verified by slicing just the `deployment: {...}` block and asserting on that slice, not eval'ing the TypeScript source or scanning the whole file -- avoids both the ambiguous-substring-search anti-pattern the plan warns against and the risk of executing arbitrary source in a test process."
  - "CI workflow step-order assertions extract ordered step names via a single consistent regex (`- name: ...`) rather than importing a YAML-parsing library, honoring the plan's explicit 'no new package in this plan' constraint -- independently cross-checked against js-yaml's own parse during this change (not shipped as a dependency)."
  - "Root coverage's include glob was silently catching sanity/editorial/test/setup.ts (Plan 05's Studio test-harness mock, not production logic) at a permanent 0%, understating this project's true coverage. Excluded explicitly rather than left to erode the raised threshold's headroom."
  - "No additional tests were needed to clear the raised 80/75/80/80 thresholds -- the codebase was already at 93.71/88.17/93/94.39% (96.33/88.17/98.15/97.11% once the measurement gap above was fixed). This plan's own text anticipated needing to 'enrichir prioritairement les tests contact/déploiement' if a gap existed; none did, once measured correctly."

requirements-completed: [QUICK-260811-KOG-QUALITY-GATES]

coverage:
  - id: D1
    description: "Without a Web3Forms key, the form emits no request and shows an honest, localized mailto fallback"
    requirement: QUICK-260811-KOG-QUALITY-GATES
    verification:
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts (3 new tests: fr, en, honeypot-still-wins) + tests/e2e/critical.smoke.spec.ts (1 new representative smoke test, chromium + webkit-mobile)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Form network scenarios use only a fake key injected into the DOM plus a local endpoint interception -- no real key anywhere"
    requirement: QUICK-260811-KOG-QUALITY-GATES
    verification:
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts (7 existing success/failure tests, all now injecting injectFakeAccessKey() before submit)"
        status: pass
    human_judgment: false
  - id: D3
    description: "CI blocks on root lint, Studio lint, typecheck, root/Studio coverage, static builds and smoke tests"
    requirement: QUICK-260811-KOG-QUALITY-GATES
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts (new describe block: step-order assertions on .github/workflows/deploy.yml)"
        status: pass
      - kind: other
        ref: ".github/workflows/deploy.yml (new 'Lint (root)' step; npm --prefix sanity run test:coverage inserted into the existing Studio step)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The deployed Studio uses exactly Sanity 6.6.0 with autoUpdates disabled"
    requirement: QUICK-260811-KOG-QUALITY-GATES
    verification:
      - kind: unit
        ref: "tests/unit/deployment.test.ts (exact-version + autoUpdates:false assertions) + the plan's own node -e version-check script"
        status: pass
    human_judgment: false
  - id: D5
    description: "Root coverage thresholds move from 70/65/70/70 to 80/75/80/80 without masking any previously-measured file"
    requirement: QUICK-260811-KOG-QUALITY-GATES
    verification:
      - kind: unit
        ref: "npm run test:coverage (96.33/88.17/98.15/97.11% against the new 80/75/80/80 floor)"
        status: pass
    human_judgment: false

duration: ~1h, done directly in this session (no agent dispatch, following the precedent set by Plans 02/04/05)
completed: 2026-08-13
status: complete
---

# Quick Task 260811-kog Plan 06: Contact Fallback, Sanity Pin, CI Gates, Coverage Threshold Summary

**Contact form now fails honestly without a Web3Forms key (no request, real mailto fallback), Sanity is pinned to exactly 6.6.0 with auto-updates disabled, root lint and Studio coverage are new blocking CI gates, and root coverage thresholds moved from 70/65/70/70 to 80/75/80/80 — completing all 6 plans of the 260811-kog quality-diagnostic remediation.**

## Performance

- **Duration:** ~1h, executed directly in this session's main loop (no agent dispatch), the fourth and final plan of this remediation done this way (following Plans 02, 04, and 05's own direct-execution precedent).
- **Tasks:** 3 (contact form fallback + tests; Sanity pin + CI gates + static tests; coverage threshold + final verification)
- **Files modified:** 10

## Accomplishments

- `ContactForm.astro` resolves `PUBLIC_WEB3FORMS_ACCESS_KEY` to `''` by default, renders it as `data-access-key`, and re-reads it at submit time (after honeypot/validation, before any fetch): an empty key short-circuits with no network request and a new, honestly-worded fallback message with a real `mailto:` link, never claiming a send was attempted.
- 4 new e2e tests prove the no-key state on both locales, that the honeypot check still wins over it, and it stays true on both chromium and WebKit mobile; 7 existing tests were updated to inject a clearly-fake key (never a real one) to keep reaching their mocked-network scenarios.
- `sanity/package.json` pins `sanity` to exactly `6.6.0` (was `^6.4.0`); `sanity.cli.ts` sets `autoUpdates: false`. `npm install` confirmed zero actual dependency change — only the requested-version metadata line differs in the lockfile.
- `.github/workflows/deploy.yml` gains a "Lint (root)" step (root lint had no CI gate at all before this) and `npm --prefix sanity run test:coverage` wired into the Studio step — Plan 05's new coverage gate did not run in CI until now.
- `tests/unit/deployment.test.ts` gains 5 static checks: exact Sanity version in both package.json and the lockfile, `autoUpdates: false`, and CI step-order assertions — all via dependency-free source slicing/regex, per the plan's explicit "no new package" constraint.
- Root coverage thresholds now block at 80/75/80/80. No new tests were needed to clear them: the codebase already measured 93.71/88.17/93/94.39% before this change. A real measurement gap was found and fixed along the way — `sanity/editorial/test/setup.ts` (Plan 05's Studio test-harness mock) was silently sitting at 0% inside the root coverage glob; excluding it (it's test-support code, not production logic) brought the true numbers to 96.33/88.17/98.15/97.11%.
- Final verification ran the complete list together: both lints, typecheck, both coverage suites, the full root unit suite (435/435), the full chromium e2e suite (349/349), the WebKit smoke project, the Studio build, the plan's own version-check script, and `git diff --check` — all green.

## Task Commits

1. **Task 1: Make an unconfigured Web3Forms key explicit and testable** - `f0253b5` (fix)
2. **Task 2: Pin Sanity to 6.6.0, disable auto-updates, add root lint + Studio coverage as CI gates** - `9ed62e4` (fix)
3. **Task 3: Raise root coverage thresholds to 80/75/80/80** - `e9614e3` (feat)

**Plan metadata:** committed separately by the orchestrator (this SUMMARY, STATE.md).

## Files Created/Modified

- `src/components/ContactForm.astro` - No-key short-circuit + honest mailto fallback
- `tests/e2e/contact.spec.ts` - 3 new no-key tests + `injectFakeAccessKey()` helper wired into 7 existing tests
- `tests/e2e/critical.smoke.spec.ts` - 1 new representative no-key smoke test (chromium + webkit-mobile) + fixed existing mocked-submission test
- `README.md` - Resynced Web3Forms env var documentation
- `sanity/sanity.cli.ts` - `autoUpdates: false`
- `sanity/package.json`, `sanity/package-lock.json` - `sanity` pinned to exact `6.6.0`
- `.github/workflows/deploy.yml` - New root lint step; Studio coverage wired into the existing Studio lint/build step
- `tests/unit/deployment.test.ts` - New describe block: version pin, autoUpdates, CI step-order static checks (5 tests)
- `vitest.config.ts` - Thresholds raised to 80/75/80/80; excluded `sanity/editorial/test/**`

## Decisions Made

See `key-decisions` in frontmatter above — six decisions recorded there, most notably the deliberate honest-fallback wording, the dependency-free static-verification approach (both for `sanity.cli.ts` and the CI YAML), and the coverage-measurement gap found and fixed before evaluating the raised threshold.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Excluded a test-harness file silently understating root coverage**
- **Found during:** Measuring baseline coverage before raising the threshold (Task 3).
- **Issue:** `sanity/editorial/test/setup.ts` (Plan 05's Studio Vitest mock/setup file) matches this project's `coverage.include` glob and sits at a permanent, uninstrumentable 0% — inflating the apparent coverage gap and understating the codebase's true, already-high coverage.
- **Fix:** Added `exclude: ['sanity/editorial/test/**']` to `vitest.config.ts`.
- **Files modified:** `vitest.config.ts`
- **Verification:** Aggregate moved from 93.71/88.17/93/94.39% to 96.33/88.17/98.15/97.11%; `npm run test:coverage` exits 0 against the new 80/75/80/80 floor.
- **Committed in:** `e9614e3` (part of the Task 3 commit)

---

**Total deviations:** 1 auto-fixed, a measurement-accuracy fix with no production-code or test-weakening implications.
**Impact on plan:** None beyond correcting what the plan's own threshold check would have measured.

## Issues Encountered

None beyond the deviation above. Every other part of the plan (contact form fallback, Sanity pin, CI gate additions, threshold raise) landed exactly as specified, and the codebase's already-strong test coverage (built up across this session's many quick tasks tonight, including Plans 01-05 of this same remediation) meant no new production-logic tests were needed to clear the raised bar.

## User Setup Required

None - no external service configuration required. `PUBLIC_WEB3FORMS_ACCESS_KEY` remains genuinely unset/deferred to Phase 5, as documented in README.md — this plan makes that state honest and testable, not resolved.

## Next Phase Readiness

- Plan 06 is complete, committed, and verified — the final plan of the `260811-kog` code-quality diagnostic remediation.
- **All 6 plans (01-06) of this quick task are now done, committed, and verified.** Every DIAGNOSTIC-01 through DIAGNOSTIC-10 finding from the original quality audit has been addressed.
- This branch (`codex/fix-code-quality-architecture`) has not been pushed to any remote and has not been merged into `main` — that decision belongs to the user.

---
*Phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual*
*Completed: 2026-08-13*
