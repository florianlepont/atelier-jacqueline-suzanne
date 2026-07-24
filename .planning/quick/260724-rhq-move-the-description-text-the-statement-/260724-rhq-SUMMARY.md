---
phase: quick-260724-rhq
plan: 1
subsystem: ui
tags: [astro, detail-hero, accessibility, e2e, playwright]

requires:
  - phase: quick-260724-mjp
    provides: shared DetailHero.astro scroll-reveal component (generalized from EditionHero) used by both édition and gallery detail pages
provides:
  - "DetailHero.astro optional statement prop rendered as real accessible content inside the reveal panel"
  - "noscript fallback forcing the reveal panel visible without JS"
  - "4-line clamp on the panel statement, bounded within the fixed-height pin at every breakpoint"
  - "Clean move of the description paragraph off all 4 detail-page twins into the shared hero panel"
affects: [detail-hero, editions-detail, galleries-detail, e2e-edition-suite, e2e-gallery-suite]

tech-stack:
  added: []
  patterns:
    - "Optional real (non-decorative) content rendered inside an otherwise aria-hidden reveal panel, distinguished from the caption/format echoes by omitting aria-hidden since it becomes the page's sole instance of that text"
    - "noscript <style is:inline> fallback pattern (mirrored from GalleryGrid.astro) reused on a second shared component"

key-files:
  created: []
  modified:
    - src/components/DetailHero.astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - tests/e2e/edition.spec.ts

key-decisions:
  - "Statement rendered without any default value on the prop (matches caption/formatText convention) so callers passing no statement stay byte-identical to before"
  - "No per-child opacity/reveal ramp for the statement -- it rides the panel's overall opacity/transform exactly like the h1 title, requiring zero scroll-script changes"
  - "New no-JS reachability e2e assertion anchors on meta description equality (both derive from the same statement local) rather than a raw opacity check, since Playwright's innerText/textContent do not reflect real no-JS browser rendering"

patterns-established:
  - "Real accessible content mixed into a decorative aria-hidden reveal panel is marked by the absence of aria-hidden, not a new wrapper element"

requirements-completed: [QUICK-260724-rhq]

coverage:
  - id: D1
    description: "DetailHero.astro renders an optional real (non-aria-hidden) statement paragraph between the h1 title and the format line"
    verification:
      - kind: other
        ref: "grep -n 'detail-hero__statement\" src/components/DetailHero.astro (line 111, no aria-hidden attribute)"
        status: pass
    human_judgment: false
  - id: D2
    description: "noscript fallback forces .detail-hero__reveal to opacity:1/transform:none without JS"
    verification:
      - kind: other
        ref: "src/components/DetailHero.astro noscript block, lines 117-124"
        status: pass
    human_judgment: false
  - id: D3
    description: ".detail-hero__statement is 4-line-clamped in the base rule (all breakpoints) with body-text tokens"
    verification:
      - kind: other
        ref: "grep -c 'line-clamp: 4' src/components/DetailHero.astro (2 occurrences: -webkit and standard)"
        status: pass
    human_judgment: false
  - id: D4
    description: "All four detail-page twins wire statement into DetailHero and no longer render it below the hero (clean move, no duplication)"
    verification:
      - kind: other
        ref: "grep -rn 'edition-detail__statement|gallery-detail__statement' src returns zero matches"
        status: pass
    human_judgment: false
  - id: D5
    description: "edition.spec.ts tracks the moved statement and gains a textContent()-vs-meta-description no-JS reachability assertion"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#the full statement text is present in the DOM (no-JS reachability), matching the page meta description"
        status: pass
    human_judgment: false
    rationale: "Orchestrator independently re-verified: supplied .env, built (27/27 pages), ran the full e2e suite on an isolated port-4399 preview (177/177 passing, chromium + webkit-mobile), and went further than the plan's assertion by launching a REAL Playwright browser context with javaScriptEnabled:false against the live preview — confirmed .detail-hero__statement has opacity:1, isVisible():true, and the full 294-character statement text intact, proving the <noscript> fallback works in an actual no-JS browser, not just via CSS source inspection."

duration: 25min
completed: 2026-07-24
status: complete
---

# Phase quick-260724-rhq: Move statement into DetailHero reveal panel Summary

**Moved the édition/gallery description paragraph out of the below-hero content block and into the shared `DetailHero.astro` scroll-reveal panel, as a real accessible `<p class="detail-hero__statement">` with a `<noscript>` fallback and a 4-line clamp.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-24
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- `DetailHero.astro` accepts an optional `statement?: string` prop, rendered as a real (non-`aria-hidden`) `<p class="detail-hero__statement">` between the `<h1>` title and the optional format line — the final child order inside `.detail-hero__reveal` is caption → title → statement → format.
- A `<noscript><style is:inline>` block forces `.detail-hero__reveal` to `opacity: 1 !important; transform: none !important;` without JS, mirroring `GalleryGrid.astro`'s existing pattern exactly.
- `.detail-hero__statement` is styled with the panel's body-text tokens and a 4-line `-webkit-line-clamp`/`line-clamp` in the single base rule (applies at every breakpoint); the full text stays in the DOM regardless of the visual clamp.
- All four detail-page twins (FR/EN éditions, FR/EN galleries) now pass `statement={statement}` into `<DetailHero>` and no longer render the statement below the hero — the two dead statement classes (`.edition-detail__statement`, `.gallery-detail__statement`) and their CSS rules are gone from `src` entirely (clean move, confirmed via grep: zero remaining matches).
- `edition.spec.ts`'s bilingual-statement test now reads `.detail-hero__statement` (both FR and EN); a new test proves the full, untruncated statement is present in the DOM (`.textContent()`) by asserting equality with the page's `<meta name="description">` content — the no-JS reachability guarantee. The `.tile__statement` overview tests were left untouched. `gallery.spec.ts`'s statement test asserts on generic `main` `innerText()` and required no edit.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add an optional statement prop to DetailHero** - `c8a4cc6` (feat)
2. **Task 2: Move the statement in all 4 detail-page twins** - `ed01afa` (feat)
3. **Task 3: Reconcile the e2e suites** - `e46499d` (test)

_No TDD gate applies — this plan is `type: execute`, not `type: tdd`._

## Files Created/Modified

- `src/components/DetailHero.astro` - New optional `statement` prop, real accessible `<p class="detail-hero__statement">` in the reveal panel, `<noscript>` fallback, 4-line-clamp CSS
- `src/pages/editions/[slug].astro` - Wires `statement={statement}` into `<DetailHero>`, deletes the below-hero `<p class="edition-detail__statement">` and its dead CSS
- `src/pages/en/editions/[slug].astro` - Same move as the FR édition twin
- `src/pages/galleries/[slug].astro` - Wires `statement={statement}` into `<DetailHero>`, deletes the below-hero `<p class="gallery-detail__statement">` and its dead CSS
- `src/pages/en/galleries/[slug].astro` - Same move as the FR gallery twin
- `tests/e2e/edition.spec.ts` - Locator swap (`.edition-detail__statement` → `.detail-hero__statement`) plus a new no-JS reachability assertion

## Decisions Made

- No default value on the `statement` prop (matches `caption`/`formatText` convention) — callers passing no `statement` stay byte-identical to before this plan.
- The statement rides the panel's overall opacity/transform exactly like the `<h1>` title; no per-child reveal ramp and no scroll-script changes were needed.
- The new no-JS reachability e2e assertion compares `.detail-hero__statement`'s `.textContent()` against the page's `<meta name="description">` content (both derive from the same `statement` local for éditions) rather than trying to disable JS in Playwright, since `textContent()` already reads the DOM independent of CSS opacity/clamping.

## Deviations from Plan

None - plan executed exactly as written. All three hard requirements (real non-aria-hidden statement, `<noscript>` fallback, 4-line clamp) were implemented and spot-checked via grep as specified in the plan's verification section.

## Issues Encountered

- The worktree's root `node_modules` was missing (per the task constraints, this was expected) — ran `npm ci` to install before running `npm run typecheck`.
- `sanity/` subproject dependencies were not needed for this task (no Studio schema changes), so `npm ci` was not run there.
- No `.env` file exists in this worktree (Sanity project ID/dataset/token). `npm run build` fails with `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars` — this is expected per the task constraints, not a bug. As a result, `npm run test:e2e` could not be run locally in this worktree; `npm run typecheck` (the always-runnable gate per the plan's `<verification>` section) was run after every task and passes with 0 errors both times. The orchestrator's independent verification pass (which supplies real Sanity credentials) must run `npm run test:e2e -- tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts` to confirm the e2e suites pass against live content.

## User Setup Required

None - no external service configuration required for this change itself (it edits existing `.astro`/`.ts` files only, per the plan's threat model T-rhq-03).

## Orchestrator Independent Re-Verification

Re-confirmed everything above directly, not just from the executor's self-report. Reviewed all three commits' diffs line by line: `DetailHero.astro`'s new prop/markup/noscript/CSS; all 4 page twins' `statement={statement}` wiring and clean removal of the below-hero paragraph + dead CSS; the e2e locator swap and new assertion. Confirmed via `grep` on the built `dist/` output (not just source) that the statement's real 294-character text renders with no `aria-hidden`, in the correct order (caption → title → statement → format), and is gone from the below-hero content on both édition and gallery pages.

Resolved the environment gap: wrote `.env`, ran `npm ci` in `sanity/` (not strictly required for this task's files, but kept for a clean full-suite run). With that: `npm run build` succeeds (27/27 pages); `astro check` 0 errors; `npm run test:unit` 147/147; `test:artifact` 27 files. Ran the full e2e suite on an isolated port-4399 preview (routing around the same stale port-4321 process): 177/177 passing, chromium + webkit-mobile, including the new no-JS reachability test.

Beyond the automated suites, drove the real preview and confirmed live: at full scroll progress, the panel's children are exactly `[caption, title, statement, format]`; `.detail-hero__statement` has `opacity:1`, `-webkit-line-clamp:4`, `aria-hidden === null` (real content), a clamped visible height of 96px (bounded, not overflowing), and the panel's bounding box stays entirely within the sticky pin's box (`panelWithinPin: true`) — the layout-safety requirement holds on real content. Then went further than the plan's own e2e assertion: launched an actual Playwright browser context with `javaScriptEnabled: false` against the live preview (not a simulation) — confirmed the `<noscript>` fallback genuinely works in a real no-JS browser: the statement is visible (`opacity: 1`, `isVisible(): true`) with its full 294-character text intact. Deleted the temporary port-4399 config, the ad-hoc no-JS test script, and the worktree `.env` before merging.

## Next Phase Readiness

- Code changes are complete and typecheck-clean. The three hard requirements (real accessible statement, `<noscript>` fallback, 4-line clamp) are implemented and grep-verified per the plan's verification section.
- Outstanding: `npm run test:e2e -- tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts` needs to be run with real Sanity credentials (orchestrator's independent verification step) to confirm the locator swap and the new no-JS reachability assertion pass against live content, and that `gallery.spec.ts`'s unedited statement test still passes.
- Recommended non-blocking human spot-check (per the plan): on desktop, scroll a `/editions/{slug}/` and a `/galleries/{slug}/` page and confirm the statement reveals inside the right panel alongside the title, reads as a tasteful 4-line excerpt, and no longer appears below the hero; check an EN twin, a mobile width, and OS "Reduce motion".

---
*Phase: quick-260724-rhq*
*Completed: 2026-07-24*

## Self-Check: PASSED

All created/modified files verified present on disk; all three task commits (`c8a4cc6`, `ed01afa`, `e46499d`) verified present in git log. No missing items.
