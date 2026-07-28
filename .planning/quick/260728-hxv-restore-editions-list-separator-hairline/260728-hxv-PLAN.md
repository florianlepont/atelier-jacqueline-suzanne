---
phase: quick-260728-hxv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/EditionsOverviewBody.astro
autonomous: true
requirements:
  - "FOLLOW-UP UI CORRECTION: reverses a targeting mistake in the merged quick task 260728-el6, which wrongly removed the `.editions-index__row:first-of-type` separator hairline (the line between the intro paragraph and `Édition 01`). Active REQUIREMENTS.md was reset after v1.3 closed and carries no EDN tag, so this has no user-facing requirement of its own — it is Florian's live correction on the deployed /editions/ page, third and final hairline pass this session."
must_haves:
  truths:
    - "On both /editions/ and /en/editions/, a hairline separator (`border-top` in `--color-ink`) is present directly above the first `.editions-index__row` (`Édition 01 / Rebut`), sitting between the intro paragraph and the first row — restoring the line 260728-el6 wrongly removed."
    - "Both hairlines are simultaneously in their FINAL correct state: the row-list separator (`.editions-index__row:first-of-type` border-top) IS present, AND the `.editions-list__header`'s own top border + padding-top (removed by 260728-g76) STAYS absent — the header rule remains exactly `margin-bottom: var(--space-2xl)`, nothing added back above the `ATELIER JACQUELINE SUZANNE` eyebrow."
    - "The `.editions-index__row` base rule is unchanged (still `display: block; padding: var(--space-xl) 0; border-bottom` hairline in `--color-border`); the new rule only adds a `border-top` to the first row via `:first-of-type`."
  artifacts:
    - "src/components/EditionsOverviewBody.astro (`.editions-index__row:first-of-type` CSS rule restored: one rule, one `border-top` property, added immediately after the `.editions-index__row` base rule)"
  key_links:
    - "Both /editions/ and /en/editions/ render through this one shared `EditionsOverviewBody.astro` component → the single CSS edit applies to both locales with no per-locale route work."
    - "The restored `border-top` uses `--color-ink` (a stronger ink hairline) whereas the base `.editions-index__row` `border-bottom` uses `--color-border` → the first row's top edge is intentionally the darker separator between the header block and the list, distinct from the inter-row dividers."
---

<objective>
Restore the `.editions-index__row:first-of-type` separator hairline that quick task 260728-el6 wrongly removed from `src/components/EditionsOverviewBody.astro`. This is the line between the intro paragraph and `Édition 01 / Rebut`. Florian confirmed (this session) that 260728-el6's removal was a misreading of his original French request — the line he actually wanted gone was the DIFFERENT header hairline that 260728-g76 correctly removed (above the `ATELIER JACQUELINE SUZANNE` eyebrow), which stays gone.

Root cause (already confirmed — do not re-investigate): three hairline passes this session on this one page. `el6` removed the row-list separator (WRONG — restore it now). `g76` removed the `.editions-list__header` top border + padding-top (CORRECT — stays removed). This task restores only the `el6` line, leaving `g76`'s result intact.

Purpose: put the Éditions overview page in its final correct state — the row-list separator back, the header hairline still gone — after two prior misses on this exact page.
Output: one CSS rule (`.editions-index__row:first-of-type` with a single `border-top`) restored in one shared component.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

# The one file being touched — add ONE rule after the `.editions-index__row` base rule (currently ~lines 110-116). Confirm current line numbers before editing.
@src/components/EditionsOverviewBody.astro
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restore the `.editions-index__row:first-of-type` separator hairline</name>
  <files>src/components/EditionsOverviewBody.astro</files>
  <action>
In `src/components/EditionsOverviewBody.astro`, inside the `<style>` block, find the `.editions-index__row` base rule (currently ~lines 110-116; confirm the actual current line numbers by reading the file first — they may have shifted). It reads:

  .editions-index__row {
    display: block;
    padding: var(--space-xl) 0;
    border-bottom: var(--border-hairline) solid var(--color-border);
    text-decoration: none;
    color: var(--color-ink);
  }

Add this rule immediately AFTER it (as a new, separate rule — do not merge into the base rule):

  .editions-index__row:first-of-type {
    border-top: var(--border-hairline) solid var(--color-ink);
  }

This restores the separator that sits between the header block's intro paragraph and the first row (`Édition 01 / Rebut`) — the line 260728-el6 wrongly removed.

Scope guardrails (do NOT deviate):
- Touch ONLY this file, adding ONLY this one CSS rule. No other selector, property, or markup change.
- Leave the `.editions-index__row` base rule exactly as-is (do not alter its `border-bottom`, padding, or any property).
- Do NOT touch the `.editions-list__header` rule — it currently reads only `margin-bottom: var(--space-2xl);` after 260728-g76's correct fix. Do NOT reintroduce a `border-top` or `padding-top` there; that was a DIFFERENT, correctly-removed hairline.
- Do NOT touch `AboutPageBody.astro` or `ContactPageBody.astro`.
- Do NOT touch any route file (`src/pages/editions/index.astro`, `src/pages/en/editions/index.astro`), `src/lib/site-config.ts`, `src/lib/sanity.ts`, or any Sanity schema.
- CSS-only, one rule added. No new test assertions (presentational restore, not a new invariant to lock in).
  </action>
  <verify>
    <automated>npm run typecheck && npm run build && npm run test:artifact && npx playwright test tests/e2e/edition.spec.ts && npx playwright test tests/e2e/site-header.spec.ts</automated>
  </verify>
  <done>The `.editions-index__row:first-of-type` rule exists with a single `border-top: var(--border-hairline) solid var(--color-ink);`, placed immediately after the unchanged `.editions-index__row` base rule. The `.editions-list__header` rule still contains only `margin-bottom: var(--space-2xl)` (no border-top, no padding-top). Typecheck, build, and artifact verification pass; `edition.spec.ts` and `site-header.spec.ts` still pass. The diff is one added rule in one file; both /editions/ and /en/editions/ show the separator above `Édition 01` restored while the header hairline stays gone.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build → static artifact | CSS-only change to one shared Astro component; touches no runtime/server surface, no dependency, no data path, no user input. Purely presentational. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-hxv-01 | Tampering | The `.editions-index` visual layout | low | mitigate | Change is scoped to a single added CSS rule (`.editions-index__row:first-of-type` border-top); the base row rule and the `.editions-list__header` rule are explicitly left untouched. Existing `edition.spec.ts` + `site-header.spec.ts` must still pass, plus build + artifact checks. |
| T-hxv-SC | Tampering | npm/pip/cargo installs | low | accept | No package installs; no dependency changes to root or `sanity/`. Supply-chain surface unchanged. |
</threat_model>

<verification>
1. `npm run typecheck` — Astro/TS clean.
2. `npm run build` — static build succeeds with the edited component.
3. `npm run test:artifact` — built artifact verification passes.
4. `npx playwright test tests/e2e/edition.spec.ts` — Éditions e2e still green.
5. `npx playwright test tests/e2e/site-header.spec.ts` — site-header e2e still green.
</verification>

<success_criteria>
- `.editions-index__row:first-of-type` rule restored with a single `border-top: var(--border-hairline) solid var(--color-ink)`, immediately after the unchanged base row rule.
- `.editions-list__header` still = only `margin-bottom: var(--space-2xl)`; 260728-g76's removal of its border-top/padding-top NOT reintroduced.
- No other selector, file, route, or Sanity surface touched; diff is one added rule in one file.
- Typecheck + build + artifact + both e2e specs pass. On /editions/ and /en/editions/: separator above `Édition 01` is back, header hairline above the eyebrow stays gone.
</success_criteria>

<output>
Create `.planning/quick/260728-hxv-restore-editions-list-separator-hairline/260728-hxv-SUMMARY.md` when done.
</output>
