---
phase: quick-260728-fjl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/e2e/edition.spec.ts
autonomous: true
requirements:
  - "CI-HOTFIX: make `main` green again — the merged quick task 260728-el6 (Éditions overview intro + statement-clip fix, commits 51f8f46/3893379) is blocked from deploy because CI is red. No user-facing requirement of its own."
must_haves:
  truths:
    - "The `editions overview layout` hover test's `not.toHaveClass(/active/)` assertion passes on BOTH loop iterations (/editions/ and /en/editions/), independent of cross-locale row geometry — including in CI's Linux-Chromium font environment where fr/en intro text wraps to different heights."
    - "The test's own intended-behavior assertions still hold: after the cursor reset, `firstRow.hover()` still activates the panel (`preview` gets `active`) and `firstRow`'s statement is visible — the fix does not mask what the test verifies."
    - "`main`'s Playwright e2e gate goes green: the targeted spec AND the full suite pass, proving no other test depended on cross-navigation mouse-position bleed."
  artifacts:
    - "tests/e2e/edition.spec.ts (one added line inside the `editions overview layout` hover test's for-loop)"
  key_links:
    - "`await page.mouse.move(0, 0)` runs immediately after each `await page.goto(url)` and before the `const preview = ...` / `not.toHaveClass(/active/)` block → resets Playwright's persistent virtual cursor so the second iteration's initial assertion no longer inherits the first iteration's leftover `secondRow.hover()` position."
---

<objective>
Fix the red `main` CI. GitHub Actions run 30344677877 fails deterministically (all 3 attempts, identical failure) at the Playwright e2e step, on `tests/e2e/edition.spec.ts` line 266 — `expect(preview).not.toHaveClass(/active/)` inside the `editions overview layout > hovering a row...` test.

Root cause (already confirmed — do not re-investigate): the test loops over `['/editions/', '/en/editions/']` with ONE shared `page`. Playwright's virtual mouse position persists across `page.goto()` (documented behavior, not a bug), so on the 2nd iteration the cursor is still parked where the first iteration's final `secondRow.hover()` left it. When the English page renders an `.editions-index__row` at that same stationary viewport coordinate, the browser fires an implicit hover that sets `.editions-preview.active` BEFORE the loop's own `not.toHaveClass(/active/)` assertion runs. This only started failing after 260728-el6 added the `.editions-list__intro` paragraph (rendered in the bare `--font-sans` system stack), which wraps to different heights fr-vs-en on the CI Ubuntu runner — shifting row Y-positions between locales enough for the leftover cursor to land on a row. It passed locally because macOS fr/en row geometry is currently identical at 1280×900.

The fix is one line: reset the virtual cursor to a neutral corner at the top of each loop iteration.

Purpose: unblock deploy of the already-merged 260728-el6 work.
Output: one added line in one test; a green e2e gate.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

# The one file being touched — only inside the `editions overview layout` hover test's for-loop (currently ~lines 251-289).
@tests/e2e/edition.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reset the persistent virtual cursor at the top of the editions-overview hover loop</name>
  <files>tests/e2e/edition.spec.ts</files>
  <action>
In `tests/e2e/edition.spec.ts`, inside the `test.describe('editions overview layout')` block's single hover test, find the `for (const url of ['/editions/', '/en/editions/'])` loop. Immediately after the loop body's `await page.goto(url);` line and BEFORE the `const preview = page.locator('.editions-preview');` / `not.toHaveClass(/active/)` block, add exactly one line:

`await page.mouse.move(0, 0);`

Also add a one-line comment directly above it explaining WHY, e.g. that Playwright's virtual mouse position persists across `page.goto()`, so without this reset the second iteration inherits the first iteration's leftover `secondRow.hover()` position and can implicitly hover a row on the new page, tripping the `not.toHaveClass(/active/)` assertion.

Scope guardrails (do NOT deviate):
- Touch ONLY this file, ONLY inside this one test's for-loop. Do not add the reset anywhere else.
- Do NOT touch any production code: not `EditionsOverviewBody.astro`, not `src/lib/site-config.ts`, not `src/lib/sanity.ts`, not any `sanity/schemas/*`, not either `editions/index.astro` route. The `--font-sans` system-font detail is root-cause context ONLY — do not add a web font or change the font stack.
- Do NOT modify any other test in this file (détail / gallery / lightbox / EDN-06 / a11y / scroll-hint blocks) or any other spec file.
- Do NOT change any existing assertion in this test — leave the `not.toHaveClass`, both `hover()` calls, the `data-img`/`src` checks, and the anti-truncation `expect.poll` exactly as they are. The only change is the one added `page.mouse.move(0, 0)` line (plus its comment).
  </action>
  <verify>
    <automated>npm run typecheck && npx playwright test tests/e2e/edition.spec.ts && npx playwright test</automated>
  </verify>
  <done>The `editions overview layout` hover test passes both loop iterations locally; the targeted `edition.spec.ts` run and the FULL Playwright suite pass; typecheck clean; the only diff is one added `await page.mouse.move(0, 0)` line (plus a why-comment) inside the for-loop, with no other assertion or file changed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| test harness → CI gate | This is a test-only change to a Playwright spec; it touches no runtime/production surface, no dependency, and no user-reachable code path. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-fjl-01 | Tampering | The e2e assertion being fixed | low | mitigate | The change ADDS a cursor reset; it does not weaken or delete any assertion. All existing intended-behavior checks (hover→active, statement visible, panel src matches row, anti-truncation poll) stay intact and must still pass — verified by running the targeted spec and full suite. |
| T-fjl-SC | Tampering | npm/pip/cargo installs | low | accept | No package installs; no dependency changes to root or `sanity/`. Supply-chain surface unchanged. |
</threat_model>

<verification>
1. `npm run typecheck` — Astro/TS clean.
2. `npx playwright test tests/e2e/edition.spec.ts` — the targeted spec passes, including the previously-failing `editions overview layout` hover test on both fr/en iterations, and its unchanged hover/src/anti-truncation assertions.
3. `npx playwright test` — the FULL e2e suite passes, confirming no other test anywhere relied on cross-navigation mouse-position bleed.
</verification>

<success_criteria>
- The `not.toHaveClass(/active/)` assertion passes on both loop iterations regardless of environment font/geometry.
- `firstRow.hover()` still activates the panel and the statement is still visible after the reset — intended behavior unmasked.
- Targeted spec + full Playwright suite green; typecheck clean.
- Diff is one added line (plus a comment) in `tests/e2e/edition.spec.ts`; no production code, no other test, no other file touched.
</success_criteria>

<output>
Create `.planning/quick/260728-fjl-fix-editions-e2e-hover-bleed-across-nav/260728-fjl-SUMMARY.md` when done.
</output>
