---
phase: 20-mobile-navigation-accent-color
plan: 06
subsystem: ui
tags: [astro, playwright, e2e, mobile-nav, accessibility, css]

requires:
  - phase: 20-mobile-navigation-accent-color
    provides: "MobileNavPanel.astro + SiteHeader.astro mobile-nav dialog (plans 20-03/20-04/20-05), 20-UAT.md Test 2's diagnosed gaps"
provides:
  - "Language switcher relocated from the panel's primary Display-size list to a small Label-size ink line in the secondary tier, stacked directly above the Instagram link"
  - "Instagram glyph (16x16, duplicated from SiteHeader.astro) inlined into the panel's secondary anchor beside the @handle"
  - "5 new (20-06)-tagged e2e tests (structural x2, typography x2, geometry x1) plus 2 new durable switcher-href guard tests encoding the reversed hierarchy so it cannot silently drift back"
affects: [21-homepage-scroll-experience, 23-about-portrait-placement-milestone-regression-close]

tech-stack:
  added: []
  patterns:
    - "Per-component inline SVG icon duplication (no shared Icon.astro exists in this codebase) — MobileNavPanel.astro now duplicates SiteHeader.astro's Instagram glyph at a smaller size, same convention documented in the mobile-nav-instagram-icon debug session"
    - "Three-class-deep selector chain (`.mobile-nav-panel > .language-switcher .switcher-link`) used to beat a component's own scoped style on specificity alone, rather than relying on stylesheet declaration order between an `is:global` block and a scoped component block"

key-files:
  created: []
  modified:
    - src/components/MobileNavPanel.astro
    - src/components/SiteHeader.astro
    - tests/e2e/mobile-nav.spec.ts
    - .planning/phases/20-mobile-navigation-accent-color/deferred-items.md

key-decisions:
  - "D-04's switcher clause reversed per 20-UAT.md Test 2 (user's live on-phone test): the switcher is no longer a fourth equal-weight primary item; it is a 14px/400/ink secondary-tier line, stacked above the Instagram link"
  - "D-04's Instagram-position/size clause and D-06 (switcher renders accent pink everywhere else) both stay unchanged — LanguageSwitcher.astro's own file has an empty diff"

patterns-established:
  - "When reversing a Display-role CSS override back to a component's own defaults, delete the override block entirely rather than adding a counter-override — restores the component's built-in tap-target/padding contract for free"

requirements-completed: [HOME-13]

coverage:
  - id: D1
    description: "Language switcher moves out of the panel's primary list into the secondary tier at Label size (14px/400/non-Unbounded) in ink, stacked directly above the Instagram line (20-UAT.md gap 1)"
    requirement: HOME-13
    verification:
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts \"the switcher sits in the panel's bottom secondary tier, stacked above an icon-bearing Instagram line (20-06)\" -- chromium project, both locale paths"
        status: pass
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts \"the primary list renders at Display size and the switcher renders at Label size in ink (20-06)\" -- chromium project, both locale paths"
        status: pass
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts \"the switcher and Instagram lines are two stacked rows near the panel's bottom edge (20-06)\" -- chromium project"
        status: pass
    human_judgment: false
  - id: D2
    description: "Instagram glyph (16x16, currentColor, aria-hidden) added beside the @handle in the panel's secondary anchor, matching the switcher's own globe size (20-UAT.md gap 2)"
    requirement: HOME-13
    verification:
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts \"the switcher sits in the panel's bottom secondary tier...\" svg count/aria-hidden assertions -- chromium project"
        status: pass
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts \"the primary list renders at Display size and the switcher renders at Label size in ink (20-06)\" switcherSvgWidth/secondarySvgWidth assertions -- chromium project"
        status: pass
    human_judgment: false
  - id: D3
    description: "No regression to any other page, the desktop header, panel motion/halftone/focus containment, or the script-count tripwire; full local CI blocking-gate sequence green in its documented order"
    verification:
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts full file -- 54/54 passed, chromium project"
        status: pass
      - kind: e2e
        ref: "npm run test:e2e (chromium + webkit-mobile) -- 375/377 passed; 2 failures are the pre-existing, already-documented NaN image-load-timing flake (deferred-items.md), confirmed unrelated by isolated reruns"
        status: pass
      - kind: unit
        ref: "npm run test:coverage -- 284/284 unit tests, statements 95.04%/branches 90.01%/functions 96.73%/lines 95.9% (thresholds 70/65/70/70), matches 20-05-SUMMARY.md baseline exactly"
        status: pass
      - kind: integration
        ref: "npm --prefix sanity run lint / build; npm run typecheck; npm run test:artifact (root base + ASTRO_BASE=/ajs-website/); un-prefixed-link grep guard"
        status: pass
    human_judgment: false
  - id: D4
    description: "Real-phone visual verification of the reversed hierarchy against 20-mobile-menu-reference.png, plus a subjective judgement on inter-line spacing between the switcher and Instagram lines (Task 3's own <human-check> item 4)"
    verification: []
    human_judgment: true
    rationale: "Per .planning/config.json's workflow.human_verify_mode = end-of-phase, this executor does not perform the plan's embedded <human-check> mid-flight; it is harvested by the phase verifier at end-of-phase into the phase's UAT flow. The plan's own action text names item 4 (spacing judgement) as \"the one judgement call the automated geometry gate cannot make\" — genuine human visual/aesthetic judgment, not something the geometry assertions (D1) can substitute for."

duration: ~90min (session paused once between Task 3's CI sweep and SUMMARY authoring for a quota reset)
completed: 2026-08-04
status: complete
---

# Phase 20 Plan 06: Reverse switcher hierarchy, add Instagram glyph Summary

**Moved the mobile-nav panel's language switcher from a 32px Display-size primary item into a 14px Label-size ink line stacked above an icon-bearing Instagram link, closing both gaps from 20-UAT.md Test 2's live on-phone report.**

## Performance

- **Duration:** ~90 min (one session pause for a quota reset between Task 3's CI sweep and this SUMMARY)
- **Started:** 2026-08-04T13:15:00Z
- **Completed:** 2026-08-04T14:44:14Z
- **Tasks:** 3 completed
- **Files modified:** 4 (3 plan-scoped + 1 deviation-tracking log)

## Accomplishments

- Reversed D-04's switcher clause per 20-UAT.md Test 2 (user's live on-phone test, severity major): the language switcher is no longer a fourth equal-weight 32px primary item — it is now a 14px/400/ink secondary-tier line, a direct child of the dialog, stacked immediately above the Instagram anchor.
- Closed the Instagram-icon gap: duplicated SiteHeader.astro's Instagram glyph (rounded-square outline + circle + dot, `currentColor`) into `MobileNavPanel.astro`'s secondary anchor at 16x16, matching the switcher's own globe size.
- Encoded both reversals in `tests/e2e/mobile-nav.spec.ts` with 5 new `(20-06)`-tagged tests (2 structural, 2 typography, 1 geometry) written and proven RED before the source change, per this repo's regression-net-first pattern, plus 2 additional durable named tests guarding the switcher's href specifically against a future re-relocation regression.
- Ran the full local CI blocking-gate sequence in its documented real order (Sanity Studio, typecheck, both builds/artifact verifies, both Playwright projects, coverage) — everything green except two pre-existing, already-documented NaN image-load-timing flakes unrelated to this plan's files.
- `src/components/LanguageSwitcher.astro` has an empty diff — its D-06 accent-pink default is untouched everywhere else on the site.

## Task Commits

1. **Task 1: Encode the reversed hierarchy and the icon in the e2e contract (RED first)** - `4b5816a` (test)
2. **Task 2: Move the switcher to the secondary tier and give Instagram its glyph (GREEN)** - `657adac` (feat)
3. **Task 3: Full CI-order regression sweep and phase re-close** - `b294b65` (test)

**Plan metadata:** committed alongside this SUMMARY (see final commit below)

## Files Created/Modified

- `src/components/MobileNavPanel.astro` — `<LanguageSwitcher />` relocated from the 4th child of `.mobile-nav-panel__nav` to a direct child of `<dialog>`, immediately before `.mobile-nav-panel__secondary`; a 16x16 Instagram `<svg>` (duplicated from SiteHeader.astro) inlined into the secondary anchor before `{instagramLabel}`; header comment and D-04 in-markup comment updated to record the 20-06 reversal.
- `src/components/SiteHeader.astro` — deleted the three-rule Display-role override block (`.mobile-nav-panel .language-switcher { font-size: inherit }`, the 32px/600/Unbounded/`padding:0` `.switcher-link` block, the 22px svg rule); added `.mobile-nav-panel > .language-switcher` (position/z-index/align-self stacking) and `.mobile-nav-panel > .language-switcher .switcher-link` (`color: var(--color-ink)` only); added `gap: var(--space-xs)` to `.mobile-nav-panel__secondary`; corrected three stale D-04 comments (`.mobile-nav-panel__nav`, the stacking-pattern comment, `.mobile-nav-panel__secondary`) to name the 20-06 reversal.
- `tests/e2e/mobile-nav.spec.ts` — added 2 structural tests, rewrote 1 typography test (Display-size assertion inverted to Label-size/ink for the switcher half), added 1 geometry test, added 2 durable switcher-href guard tests; left the four Phase 20 net describe blocks (lines 1-154) and `EXPECTED_SCRIPT_COUNT = 4` byte-for-byte intact.
- `.planning/phases/20-mobile-navigation-accent-color/deferred-items.md` — logged a second, out-of-scope occurrence of the pre-existing NaN image-load-timing flake pattern, now also observed in `gallery.spec.ts`.

## Decisions Made

- Kept the switcher's colour (ink) unchanged through the reversal — 20-UI-SPEC.md's Colour rule ("every panel item renders in ink") was never part of what 20-UAT.md Test 2 asked to reverse; only the typographic SIZE/weight/family reverse from Display to Label role.
- Used a three-class-deep selector (`.mobile-nav-panel > .language-switcher .switcher-link`) for the ink override rather than relying on `is:global` stylesheet-order priority over `LanguageSwitcher.astro`'s own scoped accent-pink rule — matches the plan's explicit instruction and is more robust to future stylesheet reordering.
- Sized the duplicated Instagram glyph at 16x16 (not the header's 20x20) via the `width`/`height` SVG attributes, matching `LanguageSwitcher.astro`'s own 16x16 globe convention, rather than adding a scoped CSS override rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree; installed `sanity/` dependencies via `npm ci --prefix sanity`**
- **Found during:** Task 1 (RED gate build) and Task 3 (Sanity Studio lint/build)
- **Issue:** This worktree had no `.env` (gitignored, not carried into a fresh worktree checkout) and no `sanity/node_modules` (Node's ancestor-directory module resolution reaches the main checkout's root `node_modules` for most packages, but cannot reach a sibling `sanity/node_modules` for the Studio's own dependencies like `@sanity/eslint-config-studio`).
- **Fix:** Copied the existing `.env` from the main checkout (not a new secret, not committed — gitignored); ran `npm ci --prefix sanity` against the existing, unmodified `sanity/package-lock.json` (not a new/unvetted package — reproduces exactly the already-locked dependency tree the CI pipeline itself installs via the same command).
- **Files modified:** none tracked (`.env` gitignored; `sanity/node_modules` gitignored)
- **Verification:** `npm run build`, `npm --prefix sanity run lint`, `npm --prefix sanity run build` all succeed afterward.

**2. [Rule 3 - Blocking] Local port-4321 conflict during e2e verification, resolved without touching tracked config**
- **Found during:** Task 2's GREEN gate
- **Issue:** A stale, orphaned `astro dev` process (PPID 1, started the previous day in the main checkout, unrelated to this worktree or any active session) was squatting on port 4321. Playwright's `reuseExistingServer: true` attached to it instead of starting a fresh preview server against my rebuilt `dist/`, producing test results from stale/unrelated content (wrong script counts, stale switcher DOM position). Killing the process was denied by the permission classifier.
- **Fix:** Temporarily edited `playwright.config.ts` to point at port 4329 for verification runs only, then reverted it (`git checkout -- playwright.config.ts`) before any commit — this file is not in this plan's `files_modified` and a project-wide default port change would affect CI and every other session. This exact port-4321 pitfall (and the same temporary-local-port workaround) is independently documented in `20-05-SUMMARY.md`, so this worktree-local conflict recurring is a known, pre-existing environment quirk, not something introduced by this plan.
- **Files modified:** `playwright.config.ts` (reverted before commit — empty diff in the final worktree state)
- **Verification:** `git diff --stat playwright.config.ts` empty; all e2e verification re-run and confirmed against the port-4329 server before reverting.

**3. [Rule 3 - Blocking, minor] Reworded one MobileNavPanel.astro comment to keep a plan-stated grep count accurate**
- **Found during:** Task 2's acceptance-criteria check
- **Issue:** The plan's acceptance criteria expect `grep -c 'LanguageSwitcher' src/components/MobileNavPanel.astro` to return 2 (import + usage). The file's own pre-existing header comment (line 5, predating this plan, present in the file since Phase 20 Plan 03) already contributes a third match, and my first draft of the new relocation comment added a fourth by restating the component name in prose.
- **Fix:** Reworded the new comment to say "the switcher component's" instead of "LanguageSwitcher's own", bringing the count to 3 — matching the pre-existing baseline exactly rather than the plan's stated "2" (which did not account for the pre-existing line-5 mention). The semantic invariant the criterion protects — single import, single usage, no duplication — holds either way.
- **Files modified:** `src/components/MobileNavPanel.astro`
- **Verification:** `grep -c 'LanguageSwitcher' src/components/MobileNavPanel.astro` returns 3; `grep -n` confirms the three occurrences are the pre-existing header comment, the import, and the single usage — no duplication.

**4. [Rule 1 - Bug in new test code] Added rounding tolerance to a tap-target height assertion**
- **Found during:** Task 1's RED gate
- **Issue:** The new geometry test's tap-target check (`switcherBox!.height >= 44`) failed on a sub-pixel floating-point artifact (`43.999969482421875`) for a box whose CSS genuinely specifies `min-height: 44px` — a test-precision bug, not one of the intended RED-gate contract mismatches.
- **Fix:** Wrapped both height reads in `Math.round()` before the `>=44` comparison.
- **Files modified:** `tests/e2e/mobile-nav.spec.ts`
- **Verification:** Re-ran the RED gate; the only remaining failures were the intended contract mismatches (switcher still in `.mobile-nav-panel__nav` at 32px).

---

**Total deviations:** 4 auto-fixed (3 blocking-environment, 1 test-precision bug). No architectural changes, no scope creep — `playwright.config.ts` ends the plan with an empty diff.
**Impact on plan:** All four were necessary to complete verification in this specific worktree's environment; none altered the plan's actual deliverable (the switcher/Instagram markup and CSS changes, and the e2e contract encoding them).

## Issues Encountered

- **Resource contention under 5-worker parallel Playwright runs:** a full `npm run test:e2e` at the default 5 workers showed transient 30s timeouts in `accessibility.spec.ts` (axe-core `analyze()` calls), a handful of `mobile-nav.spec.ts` desktop-viewport "net" tests, and one `homepage-wordmark-peek.spec.ts` filter-contrast test. Every one of these passed cleanly when re-run in isolation (`--workers=1`) or with `--workers=2` — confirmed as local-machine CPU contention on this specific worktree's host, not a code regression. No fix applied (nothing to fix); documented here so the pattern is recognized if seen again rather than mistaken for a regression.
- **Two pre-existing NaN flakes** (`edition.spec.ts` "galleries unaffected", `gallery.spec.ts` "gallery detail (masonry)...never letterboxes") reproduced deterministically regardless of worker count — same unguarded `naturalWidth`/`naturalHeight` read pattern already documented in `deferred-items.md` from plan 20-04's own investigation. Confirmed out of scope (neither file is in this plan's `files_modified`; neither test touches `.mobile-nav*` markup/CSS). Logged the second occurrence in `deferred-items.md`; not fixed here.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both 20-UAT.md Test 2 gaps are closed and guarded by automated assertions (structural, typography, and geometry tests, plus a durable switcher-href guard) that fail if the hierarchy drifts back.
- The plan's own Task 3 `<human-check>` (real-phone visual comparison against `20-mobile-menu-reference.png`, including the item-4 spacing judgement) was **not** performed by this executor, per this project's `workflow.human_verify_mode: end-of-phase` setting — it is deferred to the phase verifier's end-of-phase UAT harvest (see coverage deliverable D4 above).
- Phase 20's other success criteria (hamburger replaces desktop bar, switcher reachable from inside the menu, desktop/tablet and every other page unchanged) remain demonstrably intact — confirmed via the full local CI blocking-gate sweep in Task 3.
- No blockers for Phase 21 (Homepage Scroll Experience), which depends on Phase 20's accent-color mechanism (HOME-16, untouched by this plan) rather than on the mobile-nav panel markup this plan changed.

---
*Phase: 20-mobile-navigation-accent-color*
*Completed: 2026-08-04*

## Self-Check: PASSED

- FOUND: `src/components/MobileNavPanel.astro`
- FOUND: `src/components/SiteHeader.astro`
- FOUND: `tests/e2e/mobile-nav.spec.ts`
- FOUND: `.planning/phases/20-mobile-navigation-accent-color/deferred-items.md`
- FOUND: `.planning/phases/20-mobile-navigation-accent-color/20-06-SUMMARY.md`
- FOUND commit: `4b5816a` (Task 1)
- FOUND commit: `657adac` (Task 2)
- FOUND commit: `b294b65` (Task 3)
- CONFIRMED: `git diff --stat playwright.config.ts` empty (temporary port workaround fully reverted)
- CONFIRMED: `git diff --stat src/components/LanguageSwitcher.astro` empty (D-06 accent-pink default untouched)
