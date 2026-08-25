---
phase: quick-260825-kt3
verified: 2026-08-25T15:20:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260825-kt3: Skip the Random Starting-Accent Override on Return Navigation — Verification Report

**Task Goal:** Fix a live bug where returning to the homepage from a gallery detail page (via the scroll-up-to-return gesture landing at `/?carousel=<slug>`) correctly shows the same gallery but with an unrelated random accent color instead of that gallery's own accent, breaking visual continuity.

**Verified:** 2026-08-25T15:20:00Z
**Status:** passed

## Goal Achievement

### Observable Truths (from PLAN.md `must_haves.truths`)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Landing on `/?carousel=<slug>` for a KNOWN gallery paints THAT gallery's own resolved accent | VERIFIED | `git show f947dda..e3ecd9d -- src/client/home-carousel-runtime.ts` shows `landedOnRequestedGallery` set `true` only inside the `if (i >= 0)` match branch, and the random-override block wrapped in `if (!landedOnRequestedGallery)`. Independently re-ran `homepage-accent-random.spec.ts` (chromium): 7/7 pass, including the new `a matched ?carousel= return keeps the returned-to gallery's own accent` case. Live-reproduced the original user scenario (Brume detail → `/?carousel=brume` → accent `#37013A`, no mismatch). |
| 2 | Fresh landing at `/` with no `carousel` param keeps the HOME-16/D-05 random-per-visit accent exactly as today | VERIFIED | The 4 pre-existing HOME-16 tests (`forced lowest`, `forced highest`, `palette membership`, `is-accent-init release`) are byte-identical in the diff (confirmed via `git diff` line-set comparison — zero removed lines in the test file) and all pass independently re-run. |
| 3 | An absent OR unknown `carousel` slug still falls back to gallery 0 AND still gets the random starting accent | VERIFIED | Directly tested live against the built app with an unknown slug (`?carousel=does-not-exist-xyz`) and `Math.random` forced to pick index 2 (silos, `#55FFE1`): dash 0 shows `aria-current="true"` (gallery 0 displayed) while the accent rendered was `#55FFE1` — the random pick's color, not gallery 0's own `#A6FD29`. Also confirmed `landedOnRequestedGallery` is declared `false` and only flips `true` inside the `i >= 0` branch, so an unmatched/absent slug structurally cannot suppress the override. `gallery.spec.ts -g "carousel"` (5 tests) also independently re-run and pass, including "an unknown slug falls back to the first gallery, no error". |
| 4 | Which gallery is displayed is unchanged on every path — fix never touches `carouselIndex` | VERIFIED | Diff shows the only change to the `?carousel=` block is adding `landedOnRequestedGallery = true;` alongside the pre-existing `carouselIndex = i;` line — the assignment itself and its condition (`i >= 0`) are unmodified. |
| 5 | `.is-accent-init` transition-suppression class is added/released only on the path that applies the override, never left stuck on `.home` | VERIFIED | Diff shows `classList.add('is-accent-init')` and the class-removal rAF pair are both INSIDE the new `if (!landedOnRequestedGallery)` block — on the guarded (return-navigation) path, the class is simply never added, so there's nothing to leak. `runtime.addCleanup`'s unconditional class removal (untouched, line ~1188) remains a harmless no-op backstop. |
| 6 | `render()`, the `?carousel=` parse/`findIndex` match, `resolveAutomaticAccent`, and the `view=grid` branch are byte-for-byte unchanged | VERIFIED | Line-set diff comparison (removed vs. added lines, whitespace-normalized) shows the only non-matching lines are: the flag declaration, the flag assignment, the guard open/close braces, comment-extension lines, and the `if (i >= 0) { ... }` brace restructuring. No line inside `render()` or the `findIndex` match logic itself changed. `resolveAutomaticAccent` and the `view=grid` branch are outside the diff entirely. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/client/home-carousel-runtime.ts` | Random-accent override block gated on return-navigation flag | VERIFIED | `landedOnRequestedGallery` flag + guard confirmed present and wired (see diff analysis above). |
| `tests/e2e/homepage-accent-random.spec.ts` | New return-navigation regression case, existing HOME-16 cases untouched | VERIFIED | New test present, passes; zero removed lines in the diff (purely additive). |

### Diff Minimality (specifically requested check)

Confirmed via `git show f947dda..e3ecd9d -- src/client/home-carousel-runtime.ts` and a whitespace-normalized line-set diff:
- One flag declaration: `let landedOnRequestedGallery = false;`
- One flag assignment inside the existing `if (i >= 0)` branch: `landedOnRequestedGallery = true;`
- One conditional wrap around the pre-existing override block (`if (!landedOnRequestedGallery) { ... }`), with only re-indentation inside — no statement added, removed, or reordered within the wrapped block.
- One comment extension (HOME-16/D-05 rationale, referencing quick-260825-kt3).

No other file outside `src/client/home-carousel-runtime.ts` and `tests/e2e/homepage-accent-random.spec.ts` was touched by commit `e3ecd9d` (confirmed via `git diff --name-only f947dda..e3ecd9d`, which also shows the plan doc itself — expected).

### Behavioral Spot-Checks (independently re-run, not trusted from SUMMARY)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full accent regression suite | `playwright test tests/e2e/homepage-accent-random.spec.ts --project=chromium` | 7 passed | PASS |
| Carousel init-read / unknown-slug fallback suite | `playwright test tests/e2e/gallery.spec.ts --project=chromium -g "carousel"` | 5 passed | PASS |
| Lint | `npm run lint` | clean | PASS |
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 1 pre-existing unrelated hint | PASS |
| Build | `npm run build` | 31 pages built | PASS |
| Live repro — unknown slug still gets random accent (not gallery 0's own) | ad hoc Playwright script against built+served app, forced `Math.random` to index 2 | dash 0 shown (`aria-current=true`) with accent `#55FFE1` (silos, the forced pick), not `#A6FD29` (gallery 0's own paysage color) | PASS |

### Anti-Patterns Found

None. No TODO/FIXME/TBD/XXX/placeholder markers introduced. No empty implementations. No hardcoded stub data.

### Requirements Coverage

`BUG-01` and `HOME-16` are quick-task-local requirement tags (not present in `.planning/REQUIREMENTS.md`, consistent with this being a quick task rather than a roadmap phase). Both are satisfied by the evidence above.

### Human Verification Required

None. All must-haves are verifiable via static diff analysis, automated test re-execution, and direct live reproduction against the built app — all independently reproduced by this verifier, not merely trusted from SUMMARY.md.

### Gaps Summary

No gaps found. The fix is minimal and precisely scoped: a single boolean flag set only on a genuine `?carousel=<slug>` match, gating the pre-existing random-accent override block with no other logic changes. All three specifically-requested checks (diff minimality, HOME-16 test byte-identity, unknown-slug fallback behavior) were independently verified against the live codebase and running app, not just re-read from SUMMARY.md claims.

---

*Verified: 2026-08-25T15:20:00Z*
*Verifier: Claude (gsd-verifier)*
