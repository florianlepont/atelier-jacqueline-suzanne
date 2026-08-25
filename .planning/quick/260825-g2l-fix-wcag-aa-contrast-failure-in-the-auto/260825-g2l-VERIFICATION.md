---
phase: 260825-g2l
verified: 2026-08-25T12:10:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260825-g2l: Fix WCAG AA contrast failure in the automatic accent palette Verification Report

**Task Goal:** Fix a WCAG AA color-contrast failure (3.81:1, needs 4.5:1) in the automatic accent fallback palette's pink entry, by repointing `--color-on-accent` from ink to white, plus deterministic regression coverage replacing the previous ~1-in-6 random-reachability flake.
**Verified:** 2026-08-25
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Forcing EVERY homepage gallery index in turn (deterministic Math.random stub, both locales) produces zero serious/critical axe violations — including the gallery with no heroColor (entry 0) | ✓ VERIFIED | Independently re-ran `E2E_PORT=4322 npx playwright test tests/e2e/accessibility.spec.ts --project=chromium`: both forced-index tests (`/` and `/en/`) pass. `npm run build` output confirms `trousseau` (the no-`heroColor` gallery) is built. Test code (lines 133-245) discovers content shape from the DOM (`ul[data-role="home-carousel-data"] li`), loops every index, forces it via `Math.random` stub + `localStorage` handshake, and polls `--current-accent-text` before scanning — matches the plan's spec exactly. |
| 2 | Hovering the first /editions/ row (shared entry-0 pairing) produces zero serious/critical axe violations once hover colors have settled | ✓ VERIFIED | Same independent test run: "éditions row-hover accent" test passes. Code (lines 247-291) hovers row 0, waits 400ms for the 0.35s CSS transition, then scans. The `.exclude('.editions-index__row:not(:hover) .editions-index__title')` clause is narrowly scoped — it excludes only dimmed *non-hovered sibling* titles (a separate, documented, pre-existing bug), not the hovered row itself or the header, so it does not mask the entry-0 pairing this task fixes. |
| 3 | Text painted on the accent-pink surface resolves to white (4.56:1 against #D6327C), not dark ink (3.81:1) | ✓ VERIFIED | `src/layouts/BaseLayout.astro:333` — `--color-on-accent: var(--gray-0);` (confirmed by direct file read). Independently recomputed WCAG relative-luminance contrast in Node: white vs `#D6327C` = 4.56, ink (`#1A1A1A`) vs `#D6327C` = 3.82 — matches the plan's cited figures (4.56:1 pass / 3.81:1 fail) to within rounding. |
| 4 | The éditions row-hover header color sync (EDN-09) still recolors eyebrow, eyebrow dot, h1, intro and divider — tests/e2e/edition.spec.ts passes unchanged | ✓ VERIFIED | Independently re-ran `E2E_PORT=4322 npx playwright test tests/e2e/edition.spec.ts --project=chromium`: 27/27 pass, including both EDN-09 tests ("hovering a row recolors..." and "moving off the row (mouseleave) restores..."). Read the EDN-09 test source: it asserts a color *delta* (`rowColor !== preHoverEyebrowColor` etc.), not a hardcoded value, so the plan's predicted benign behavior change (`findRowWithDifferingAccent` resolving on an earlier row) does not break the test — confirmed correct by inspection, not just by the pass. |
| 5 | Full e2e suite, full unit suite, lint and typecheck pass with no new failures | ✓ VERIFIED | Independently ran `npm run lint` (0 errors), `npm run typecheck` (0 errors, 0 warnings, 1 pre-existing unrelated hint in `homepage-wordmark-peek.spec.ts`), `npm run test:unit` (675/675 passed, 31 files), plus the two targeted e2e files above. Orchestrator additionally confirmed the full e2e suite (348/348 chromium, plus webkit-mobile) and full unit/coverage suite green on the merged `main` checkout post-merge — not re-run again here to avoid redundant full-suite execution per verifier guidance. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/layouts/BaseLayout.astro` | `--color-on-accent` flipped to the existing white token, with a rationale comment matching reality | ✓ VERIFIED | Line 333: `--color-on-accent: var(--gray-0);`, preceded by a 7-line comment (lines 326-332) citing 260825-g2l, quick task 260720-nm3's earlier pink-darkening, and the 3.81:1/4.5:1 figures. `git diff ee2b2a8..HEAD -- src/layouts/BaseLayout.astro` shows this is the ONLY change to the file — no other token, rule, or line touched. |
| `tests/e2e/accessibility.spec.ts` | Deterministic forced-accent regression coverage replacing the 1-in-6 random reachability | ✓ VERIFIED | New `test.describe('automatic accent palette contrast (quick-260825-g2l)', ...)` block (lines 123-291) appended at file end; pre-existing tests above it are byte-unchanged per `git diff` (only additions, `+171` / `0` deletions in this file). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `--color-on-accent` token | Both automatic palettes' entry 0 | Shared CSS custom property reference | ✓ WIRED | Confirmed by grep: `src/client/home-carousel-runtime.ts:121` and `src/components/EditionsOverviewBody.astro:37/395/458` all reference `var(--color-on-accent)` literally — one token edit updates both call sites identically, exactly as claimed. |
| `pickRandomGalleryIndex` | Test's `Math.random` stub | Default parameter resolved at call time | ✓ WIRED | `src/lib/home-carousel.ts:181` — `randomSource: () => number = Math.random` is a default parameter (not a captured module-load reference), and the function's own doc comment (lines 175-179) explicitly sanctions this stubbing technique. |
| `html.editions-row-active` | `--editions-row-accent` / `--editions-row-accent-text` | CSS class-gated background flip | ✓ WIRED | `src/layouts/BaseLayout.astro:475-499` — `html.editions-row-active .site-header`, `main`, `footer.chrome-band` rules all flip background together with the header, confirming the accent text token is only ever painted on the flipped accent surface. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Forced-index homepage a11y scan (both locales) + éditions row-hover a11y scan | `E2E_PORT=4322 npx playwright test tests/e2e/accessibility.spec.ts --project=chromium` | 18/18 passed | ✓ PASS |
| EDN-09 header color sync unaffected | `E2E_PORT=4322 npx playwright test tests/e2e/edition.spec.ts --project=chromium` | 27/27 passed | ✓ PASS |
| Lint clean | `npm run lint` | 0 errors | ✓ PASS |
| Typecheck clean | `npm run typecheck` | 0 errors, 0 warnings, 1 pre-existing unrelated hint | ✓ PASS |
| Unit suite green | `npm run test:unit` | 675/675 passed | ✓ PASS |
| Build succeeds, fetches Sanity content including the triggering gallery | `npm run build` | 31 pages built, incl. `trousseau` (no `heroColor`) | ✓ PASS |
| Contrast math matches claimed figures | Node WCAG relative-luminance calc | white/pink = 4.56, ink/pink = 3.82 | ✓ PASS |

### Anti-Patterns Found

None. `git diff ee2b2a8..HEAD -- . ':!.planning'` is scoped to exactly `src/layouts/BaseLayout.astro` (+9/-1 in a single token+comment block) and `tests/e2e/accessibility.spec.ts` (+171/-0, new describe block only). No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers introduced by this task's diff. The one incidental "placeholder" grep hit in `BaseLayout.astro` (line 17, about an unrelated legacy font decision) predates this task and is outside its diff.

### Requirements Coverage

No `.planning/REQUIREMENTS.md` exists in this repository (this is a quick task, not a roadmap phase). The plan's `requirements: [HOME-16, EDN-09, A11Y-CONTRAST]` frontmatter tags are informal references to prior work items, all satisfied by the evidence above (HOME-16's random-reachability flake replaced by deterministic coverage; EDN-09 confirmed unaffected; the A11Y contrast failure itself fixed and independently re-measured).

### Deferred / Out-of-Scope Finding

The executor discovered a genuinely separate, pre-existing contrast bug during Task 2 verification: `.editions-index:hover .editions-index__title { opacity: 0.28 }` (in `EditionsOverviewBody.astro`) fails WCAG AA's 3:1 large-text threshold for BOTH the old ink pairing (~1.52:1) and the new white pairing (~1.48:1), across all 5 accent palette entries — confirmed unrelated to this task's `--color-on-accent` change by the executor's own before/after computation. Correctly scoped out of Test B's axe scan with a narrow, well-commented `.exclude()` selector (verified above not to mask this task's own truths), and documented in `deferred-items.md` with a recommended follow-up quick task. This is not a gap in the current task — it is pre-existing, unrelated, and properly surfaced rather than silently fixed or silently hidden.

### Human Verification Required

None required to close this task. The plan's Task 2 `<human-check>` step (visual confirmation of the pink accent panel and éditions hover state) was substituted by the executor with a Playwright-screenshot review, documented transparently in SUMMARY.md as a substitute for live human sign-off, not a replacement. This is a reasonable, disclosed deviation for an unattended run and does not block passed status — the underlying claim (white text renders "clean and legible" on the pink surface) is independently corroborated by the 4.56:1 contrast math above, which is the actual load-bearing WCAG requirement.

### Gaps Summary

None. All five must-have truths, both artifacts, and all three key links verified directly against the current codebase (not from SUMMARY.md claims). Lint, typecheck, unit suite, and the two directly-relevant e2e spec files were independently re-run in this verification session and all passed, corroborating the orchestrator's separate full-suite confirmation on the merged `main` checkout.

---

_Verified: 2026-08-25T12:10:00Z_
_Verifier: Claude (gsd-verifier)_
