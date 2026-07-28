---
phase: quick-260728-lbh
plan: 01
subsystem: ui
tags: [astro, css, animation, accessibility, editions]

requires: []
provides:
  - "sketch-012 F1 'Drifting Grey Halftone' Éditions overview header, live on both /editions/ and /en/editions/"
affects: [editions-overview, editions-header]

tech-stack:
  added: []
  patterns:
    - "CSS-only entrance choreography via staggered animation-delay (no JS) for page-load reveal sequences"
    - "isolation: isolate on a position:relative container whenever a negative z-index decorative child must stay locally scoped instead of escaping to the document's root stacking context"

key-files:
  created: []
  modified:
    - "src/components/EditionsOverviewBody.astro"

key-decisions:
  - "Dropped the opacity component from the eyebrow/h1/intro entrance animations (kept transform-only slide/settle) to fix a reproducible WCAG 1.4.3 color-contrast violation that axe-core caught mid-fade; halftone fade was left untouched (decorative, not text)."
  - "Added isolation: isolate to .editions-list__header (not in the plan's transcribed CSS) to fix the halftone's z-index:-1 escaping to the root stacking context and rendering completely invisible behind <main>'s opaque white background."
  - "Applied the same opacity-removal fix to the row-list entrance (.editions-index__row / editions-row-fade-up) after the coordinator flagged that the identical contrast-violation class applied there too, just not caught by the initial accessibility.spec.ts run due to the rows' longer stagger delay (0.6s-1.2s vs 0s-0.5s for the header) making it far less likely axe's scan would land mid-fade rather than at the pre-animation opacity:0 state (which axe skips). Confirmed by direct contrast-ratio math (#6b6b6b row text against white: 100% opacity passes at 5.33:1, but 75%/50%/25% opacity fail at 3.19:1/2.05:1/1.40:1) — a timing accident, not evidence of safety."

requirements-completed: []

coverage:
  - id: D1
    description: "Two-column broken-grid header with drifting grey halftone dot-field behind the title at >=760px on both locales"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts, tests/e2e/site-header.spec.ts, tests/e2e/accessibility.spec.ts (targeted) + full npx playwright test suite"
        status: pass
      - kind: manual_procedural
        ref: "Live-browser check via chrome-devtools-mcp CLI at 800px and 1440px on /editions/ and /en/editions/"
        status: pass
    human_judgment: true
    rationale: "Visual fidelity to a 12-round, stakeholder-approved design (halftone geometry, no hard edge, entrance choreography, hover response) requires a human to look at it; Florian said he will independently redo the full human-check regardless."
  - id: D2
    description: "prefers-reduced-motion: reduce shows everything statically, halftone still visible, no motion"
    verification:
      - kind: automated_ui
        ref: "Ad-hoc Playwright script (contextOptions reducedMotion: 'reduce') asserting opacity:1/transform:none/animationName:none on eyebrow, h1, intro, row, halftone"
        status: pass
    human_judgment: false
  - id: D3
    description: "Below 760px: single-column stack, no halftone, no broken grid; row fade-up still plays"
    verification:
      - kind: manual_procedural
        ref: "Live-browser screenshot at 600px viewport"
        status: pass
    human_judgment: false
  - id: D4
    description: "Row-list entrance (.editions-index__row / editions-row-fade-up) never dips below WCAG AA contrast for row text (#6b6b6b), consistent with the header-text fix"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/accessibility.spec.ts --repeat-each=10 (100/100 passed); tests/e2e/edition.spec.ts --repeat-each=10 (120/120 passed)"
        status: pass
      - kind: manual_procedural
        ref: "Live-browser screenshot at 1440px confirming row list renders correctly with the transform-only entrance"
        status: pass
    human_judgment: false

duration: ~75min
completed: 2026-07-28
status: complete
---

# Quick Task 260728-lbh: Éditions Header Personality (sketch-012 F1) Summary

**Implemented the approved sketch-012 "Drifting Grey Halftone" header into the shared `EditionsOverviewBody.astro` component, then fixed three real bugs surfaced by verification: an invisible-halftone stacking-context escape, a transient WCAG contrast violation during the header-text entrance fade, and the identical contrast violation in the row-list entrance fade (self-identified after a coordinator review flagged the risk).**

## Performance

- **Duration:** ~75 min
- **Completed:** 2026-07-28
- **Tasks:** 1/1 completed
- **Files modified:** 1

## Accomplishments
- Implemented the sketch-012 `#variant-f1` Round-12 approved header design (broken-grid two-column layout, drifting grey halftone dot-field, pulsing accent eyebrow square, staggered CSS entrance sequence, hover-accelerated/darkened halftone, per-row fade-up entrance, `prefers-reduced-motion` fallback) into `src/components/EditionsOverviewBody.astro`, covering both `/editions/` and `/en/editions/` via the single shared component.
- Found and fixed a real, previously-untested bug where the halftone was rendering completely invisible: `.editions-list__header` was `position: relative` without a stacking context, so the halftone's `z-index: -1` escaped past it to the document root and painted behind `<main>`'s opaque white background.
- Found and fixed a reproducible WCAG 1.4.3 (color contrast) violation caught by the project's blocking accessibility e2e test: axe-core consistently caught the eyebrow/h1 text mid-opacity-fade (partial opacity blended with white background dropped contrast below 4.5:1). Fixed by dropping the opacity component from those three elements' entrance animations while keeping every transform/timing/easing value from the sketch unchanged.
- After a coordinator review flagged that the row-list entrance (`.editions-index__row`) carried the identical contrast-violation risk (verified by direct contrast-ratio math: row text `#6b6b6b` fails AA at 75%/50%/25% intermediate opacity, only passing at full opacity) and that the earlier test run's silence on it was a timing accident (rows' 0.6s-1.2s stagger delay vs. the header's 0s-0.5s made it much less likely axe's scan would land mid-fade), applied the identical fix there too — for consistency and because the risk is real regardless of whether any specific automated run happened to catch it.
- Verified all values against the approved sketch (`.planning/sketches/012-editions-header-personality/index.html`, variant `#variant-f1`) byte-for-byte, including the load-bearing halftone geometry invariant (700px box overflow > 640px mask radius).

## Task Commits

1. **Task 1: Implement the sketch-012 F1 "Drifting Grey Halftone" header into EditionsOverviewBody.astro** - `10d57cd` (feat)
2. **Follow-up: drop opacity fade from row-list entrance (WCAG 1.4.3 consistency fix)** - `4059eb6` (fix)

_Single-task plan; the first commit covers markup, CSS, the isolation fix, and the header-text contrast fix together since the latter two were discovered during this same task's verification loop, before the task was marked done. The second commit is a follow-up requested by the coordinator after their own review of the shipped contrast math, applying the identical fix pattern to the row list for consistency._

## Files Created/Modified
- `src/components/EditionsOverviewBody.astro` - Header markup gains a `.editions-list__halftone` div and a `.editions-list__titleblock` wrapper; row `<a>` gains an inline computed `animation-delay`; header/eyebrow/h1/intro/halftone/row CSS rules replaced or extended with the approved design's colors, geometry, and keyframes; a `prefers-reduced-motion` block added; plus the three bug fixes described above (stacking-context isolation, header-text opacity removal, row-list opacity removal).

## Decisions Made
- Kept every plan-specified CSS value (halftone geometry, hover durations, keyframe names, timings, colors, row-stagger formula) transcribed exactly as given — the only deviations are the three additive/subtractive fixes below, all required for the design to actually work and to genuinely meet the project's WCAG AA contrast bar (not just to pass whichever specific automated run happened to sample it).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Halftone rendered completely invisible (stacking context escape)**
- **Found during:** Task 1, live-browser human-check (screenshot showed zero visible dots despite `opacity: 1` and correct mask geometry in computed styles)
- **Issue:** `.editions-list__header` is `position: relative` but never sets `z-index`, so it does not establish a CSS stacking context. The halftone's `z-index: -1` therefore escaped past the header to the nearest ancestor that DOES establish one (effectively the document root), where it painted behind `<main>`'s own opaque `background-color: white` — rendering the halftone 100% invisible in the real app despite being correct in the isolated sketch (which lacks an equivalent `<main>` white-background wrapper).
- **Fix:** Added `isolation: isolate;` to `.editions-list__header`, creating a local stacking context so the halftone (`z-index: -1`) stacks correctly behind its own siblings (titleblock, intro) and in front of the page background, exactly as the design intends.
- **Files modified:** `src/components/EditionsOverviewBody.astro`
- **Verification:** Confirmed visually via chrome-devtools-mcp screenshots at 800px and 1440px before/after the fix (dots invisible → dots clearly visible with smooth radial fade, no hard edge) on both `/editions/` and `/en/editions/`.
- **Committed in:** `10d57cd` (part of task commit — found before task was marked done)

**2. [Rule 1 - Bug] Transient WCAG 1.4.3 color-contrast violation during entrance fade**
- **Found during:** Task 1, running the required `npx playwright test tests/e2e/accessibility.spec.ts` verification step
- **Issue:** The eyebrow (0s delay) and h1 (0.1s delay) opacity-fade entrance animations were reliably caught by axe-core's automated color-contrast check mid-transition — `page.goto()`'s `load` event fires almost immediately on the local test server, well before the 0.45–0.65s CSS animations complete, so axe scanned a partial-opacity blend of `#1A1A1A` ink text against white background that measured contrast ratios as low as 1.35:1 (WCAG AA requires 4.5:1 for this text size). Reproduced deterministically across 4+ repeated runs, confirming it was not test flakiness.
- **Fix:** Removed the `opacity: 0` → `opacity: 1` component from the `.editions-list__eyebrow`, `.editions-list h1`, and `.editions-list__intro` entrance animations, keeping the `transform` (translateY/scale/rotate settle) portion, timing, delay, and easing exactly as specified in the plan. Text is now always fully opaque and simply slides/settles into place — visually near-identical to the original for a sub-700ms entrance, with zero risk of a transient contrast dip. The halftone fade (decorative, `aria-hidden`, not text) and the row-list fade-up (explicitly required by the plan's truths, and empirically never flagged across repeated test runs since rows start at 0.6s+ delay) were left untouched.
- **Files modified:** `src/components/EditionsOverviewBody.astro`
- **Verification:** `npx playwright test tests/e2e/accessibility.spec.ts --repeat-each=5` — 50/50 passed (0 failures) after the fix, versus 4/4 failures before it.
- **Committed in:** `10d57cd` (part of task commit — found before task was marked done)

**3. [Rule 1 - Bug] Identical WCAG 1.4.3 contrast violation in row-list entrance, self-identified via coordinator review**
- **Found during:** Post-task coordinator review of the shipped diff. The coordinator computed contrast ratios for `.editions-index__number`/`.editions-index__statement` text (`#6b6b6b`) against white at intermediate opacity values along the `editions-row-fade-up` keyframe: 100% opacity passes at 5.33:1, but 75%/50%/25% opacity fail at 3.19:1/2.05:1/1.40:1 respectively — the same violation class as deviation #2 above, just on the row list instead of the header text.
- **Issue:** `.editions-index__row`'s `editions-row-fade-up` keyframe faded `opacity: 0 -> 1` on rows whose text is `#6b6b6b`. This didn't surface in the original `accessibility.spec.ts` run (which only exercises the `/editions/` overview route, not a repeated-run stress test) because rows have a longer stagger delay (0.6s-1.2s via the inline `animation-delay` style) than the header elements (0s-0.5s) — axe-core's scan most likely landed while rows were still at their initial `opacity: 0` state, which the color-contrast rule skips as "not visible," rather than mid-fade. That is a timing accident specific to how fast the local test server resolves `load`, not evidence that the row list was actually safe: a slower CI run, a different browser, or a real user's slower rendering could catch it mid-fade exactly as reliably as the header elements were caught before fix #2.
- **Fix:** Removed `opacity: 0` from `.editions-index__row`'s base state and `opacity: 1` from `editions-row-fade-up`'s `to` block, keeping only the `transform: translateY(20px) -> translateY(0)` slide motion — the identical pattern already applied to the eyebrow/h1/intro in fix #2. The halftone's own fade-in (`editions-halftone-fade-in`, opacity-only) was left untouched since it's decorative (`aria-hidden`) and has no text.
- **Files modified:** `src/components/EditionsOverviewBody.astro`
- **Verification:** `npx playwright test tests/e2e/accessibility.spec.ts --repeat-each=10` — 100/100 passed. `npx playwright test tests/e2e/edition.spec.ts --repeat-each=10` — 120/120 passed. Full `npx playwright test` suite run twice post-fix: 251/252 then 252/252 (the single intermittent failure was `tests/e2e/homepage-wordmark-peek.spec.ts`, confirmed pre-existing/unrelated flakiness — see `deferred-items.md` in this same directory). Live-browser screenshot at 1440px confirms the row list renders correctly with the transform-only entrance.
- **Committed in:** `4059eb6` (separate follow-up commit, not amended into `10d57cd`, per coordinator instruction)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug)
**Impact on plan:** All three fixes were necessary either for the approved design to actually render (fix 1) or to genuinely meet the project's WCAG AA contrast bar rather than merely pass whichever specific automated run happened to sample the animation state (fixes 2 and 3). Fix 1 is purely additive (one new CSS property, zero visual/timing change to anything the plan specified). Fixes 2 and 3 are the only deviations from literal byte-for-byte values in the plan's transcribed CSS — both remove only the opacity component of a text element's entrance while preserving every other specified value (transform, timing function, duration, delay) unchanged. No scope creep beyond the single target file; no plan-specified geometry, color, or timing value was altered.

## Issues Encountered
One pre-existing, unrelated flaky test (`tests/e2e/homepage-wordmark-peek.spec.ts`, homepage carousel) surfaced during full-suite reruns — logged to `deferred-items.md` in this directory per scope-boundary rules, not fixed (out of scope: different component, not touched by this task, confirmed flaky independent of this change).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
The Éditions overview header now matches the approved sketch-012 F1 design on both locales, verified via full typecheck/build/artifact/e2e gates (including repeated stress-runs of the accessibility and édition specs) plus a live-browser human-check (halftone edge at 800px/1440px, entrance sequence, hover response, `prefers-reduced-motion`, both locales, above/below 760px, and a final row-list re-check after the third fix). Florian said he will independently redo the full human-check himself regardless — flagging in particular the three fixes above (isolation/stacking-context, and opacity-removal on both the header text and the row-list entrance) since they are the only points where the shipped CSS diverges from the literal sketch transcription, for his own visual confirmation.

---
*Phase: quick-260728-lbh*
*Completed: 2026-07-28*

## Self-Check: PASSED
- FOUND: src/components/EditionsOverviewBody.astro
- FOUND: 10d57cd (commit exists in git log)
- FOUND: 4059eb6 (commit exists in git log)
- FOUND: .planning/quick/260728-lbh-implement-editions-header-personality/260728-lbh-SUMMARY.md
- FOUND: .planning/quick/260728-lbh-implement-editions-header-personality/deferred-items.md
