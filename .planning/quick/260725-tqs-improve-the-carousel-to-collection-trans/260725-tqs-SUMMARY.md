---
phase: quick-260725-tqs
plan: 1
subsystem: ui
tags: [astro, homepage-carousel, detail-hero, view-transitions, css, vanilla-js, playwright, e2e]

requires:
  - phase: quick-260725-pit
    provides: The simplified, silent carousel scroll-to-open gesture (OPEN_OVERSCROLL_THRESHOLD=150) this task's scroll-up-to-return mirrors
  - phase: quick-260725-sj4
    provides: The accidental-navigation failure-mode analysis (atBottom() vacuously true at scrollY 0) this task's hasEngaged/atTop() defenses are designed against, mirrored in reverse
provides:
  - "Carousel byline/description removed from the caption (Item 2)"
  - "Custom photo cursor affordance on the carousel hero, title link pointer preserved (Item 3)"
  - "Narrower accent panel (min(700px,52%)) with a retuned, non-clipping wordmark clamp and a matching caption offset (Item 4)"
  - "Resized/repositioned sitewide intro paragraph, desktop-only left-half confinement (Item 5)"
  - "Gallery detail overlay-title matches the homepage carousel title's end-state (18px/left 16px/uppercase), crossfading in place (Item 1)"
  - "Scroll-up-at-top on a gallery detail page returns to the homepage carousel on the same gallery, gated against the quick-260725-sj4 failure mode (Item 6)"
affects: [homepage-carousel, home-carousel, detail-hero, gallery-detail-routes, e2e-test-suite]

tech-stack:
  added: []
  patterns:
    - "Upward-overscroll accumulator (hasEngaged + atTop() + threshold + idle-reset + reset-on-leave-top), the mirror image of HomeCarousel's own downward-overscroll accumulator, applied on DetailHero"
    - "?carousel=<slug> URL param read at carousel init, matched via findIndex (never built into a DOM selector) to avoid selector-injection"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - src/components/DetailHero.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - tests/e2e/homepage.spec.ts
    - tests/e2e/gallery.spec.ts

key-decisions:
  - "Item 1: deliberately did NOT add a shared cross-document view-transition-name between the homepage title and the overlay title — the site-wide @view-transition{navigation:auto} root crossfade already makes an end-state-matched title read as continuous in place, and a dedicated name would add a new always-on-name on a 100svh element (the same HOME-06/D-10/D-12 risk class that forced .detail-hero__img's own name to be desktop-gated) for only marginal benefit."
  - "Item 6: implemented as a fully independent top-level <script> block in DetailHero (not nested in the existing reveal-driver guard), so the gesture also works on mobile where the scroll-reveal driver is inactive."
  - "Item 6 safety design: hasEngaged (armed only after a genuine >=300px scroll down) + atTop() + accumulator threshold + idle-reset + reset-on-leave-top, mirroring quick-260725-sj4's own post-mortem in reverse — an accumulator armed from a fresh scrollY-0 load would otherwise misfire on ordinary small upward corrections, exactly like the sj4 bug's vacuously-true atBottom() at load."

requirements-completed: [QUICK-260725-tqs]

coverage:
  - id: D1
    description: "Carousel caption no longer shows a per-gallery byline/description (FR+EN); grid tile hover description is unaffected"
    requirement: "QUICK-260725-tqs"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#collection statements on the homepage > carousel byline/description is removed, on FR and EN"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified by the orchestrator with real Sanity credentials + isolated-port Playwright run: full e2e suite (212/212) passes."
  - id: D2
    description: "Custom cursor over the carousel hero photo hints at interactivity; the title link keeps its own pointer cursor despite cursor inheritance"
    requirement: "QUICK-260725-tqs"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel custom cursor affordance (Item 3) > the hero photo has a custom cursor while the title link keeps its pointer cursor"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified via e2e and a live browser check: computed cursor on .home-hero__photo resolves to the custom SVG data-URI, .home-hero__title computed cursor is 'pointer'."
  - id: D3
    description: "Accent panel narrowed to min(700px,52%); wordmark does not clip against the narrower panel across 768-1920px; caption still clears the panel"
    requirement: "QUICK-260725-tqs"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel accent panel narrowing, no wordmark clip (Item 4) > the accent panel is narrower and the wordmark stays within it, and the caption never overlaps it"
        status: pass
      - kind: other
        ref: "Standalone Playwright geometry harness (Unbounded font, real CSS values) measuring 'JACQUELINE'/'SUZANNE' line-right vs panel-right at 768/800/900/1000/1100/1200/1280/1333/1346/1400/1500/1600/1728/1920px — zero clip at any width (38-91px margin); harness deleted after the run, not committed."
        status: pass
    human_judgment: false
    rationale: "Independently re-verified via e2e and a live browser geometry check at 1280px: accentWidth 665.6px (narrower than the old 800px cap), wordmarkRight <= accentRight with margin, captionRight <= accentLeft (no overlap)."
  - id: D4
    description: "Sitewide intro paragraph resized to 15px and confined to ~left half of the panel on desktop; full-width on mobile"
    requirement: "QUICK-260725-tqs"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage.spec.ts#carousel intro paragraph resize + reposition (Item 5)"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified via e2e and a live browser check on desktop (font-size 15px, width well under half the panel) and mobile (max-width: none, 14px unchanged)."
  - id: D5
    description: "Gallery detail overlay-title matches the homepage carousel title's end-state (18px, left ~16px, uppercase); reveal-title (72px scrolled-down state) unchanged, FR+EN"
    requirement: "QUICK-260725-tqs"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail overlay-title matches the homepage carousel title (Item 1)"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified via e2e and a live browser check: landing on a real gallery detail page, the overlay title computes font-size 18px, left 16px, text-transform uppercase — an exact match to the homepage title measured during the original audit that motivated this task."
  - id: D6
    description: "On a gallery detail page, genuine engagement + return-to-top + sustained upward push navigates back to the homepage carousel showing the SAME gallery (FR+EN); fresh-load/below-threshold/small-correction inputs never navigate; feature inert on edition heroes"
    requirement: "QUICK-260725-tqs"
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery detail scroll-up-to-return (Item 6, quick-260725-tqs)"
        status: pass
    human_judgment: false
    rationale: "Independently re-verified — the highest-risk item, given direct lineage from quick-260725-sj4. Full e2e suite (212/212) passed on the first run, including all positive-path, accidental-trigger, below-threshold, and edition-scoping tests. Additionally replayed live in a real browser: genuine scroll-down (500px) + return-to-top + sustained upward wheel push navigated correctly to /?carousel=<slug>, landing the carousel on the SAME gallery (confirmed via the navigation's own snapshot, with zero extra delay, to rule out an auto-advance timing artifact); the ?carousel= init read was independently confirmed correct for multiple slugs; and the data-carousel-return-href attribute was confirmed absent on a real edition detail page (feature correctly inert there). One live-testing false alarm during verification: batching multiple scrollTo() calls into a single synchronous script (or leaving multiple seconds between separate manual checks, letting the 6s auto-advance timer tick) produced misleading results — root-caused as artifacts of the manual test methodology, not bugs in the shipped code; the fast, single-transaction automated e2e tests are unaffected by either artifact and are the authoritative signal."

duration: ~30min (+ orchestrator verification pass)
completed: 2026-07-26
status: complete
---

# Quick Task 260725-tqs: Carousel<->Collection Transition Polish Summary

**Six related changes across HomeCarousel.astro and DetailHero.astro: removed the carousel byline, added a silent custom-cursor affordance, narrowed the accent panel with a retuned wordmark, resized the intro paragraph, matched the gallery-detail overlay title to the homepage title's end-state for a continuous crossfade, and added a safety-gated scroll-up-at-top gesture that returns from a gallery detail page to the homepage carousel showing the same gallery.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-07-26
- **Tasks:** 5/5 completed
- **Files modified:** 6 (2 components, 2 gallery detail routes, 2 spec files)

## Accomplishments

- **Item 2** — Removed the carousel's per-slide byline/description entirely: markup, script wiring (`statementEl`, the `if (statementEl)` render block), the `fallbackByline` const, and all CSS (desktop + mobile line-clamp), recomputing the caption grid's row tracks/height and the mobile accent panel's coupled `bottom` offset (was hardcoded to the old caption height).
- **Item 3** — Added a silent, no-visible-hint custom cursor to `.home-hero__photo`: a small down-chevron SVG data-URI (white stroke over a dark halo for legibility on any photo), with an explicit `cursor: pointer` restored on `.home-hero__title` to counter cursor inheritance from its ancestor.
- **Item 4** — Narrowed the accent panel from `min(800px, 60%)` to `min(700px, 52%)`, with the caption's `right` calc updated to track the same panel-width token (clearance stays exactly `var(--space-3xl)`, invariant to the width change) and the wordmark clamp retuned from `clamp(44px, 6vw, 80px)` to `clamp(38px, 5.2vw, 70px)` — preserving the SAME font-to-panel ratio the previous panel used. Verified via a standalone Playwright geometry harness (real self-hosted Unbounded font, exact shipped CSS values) that "JACQUELINE"/"SUZANNE" never clip the panel's right edge across 768-1920px (38-91px of margin at every checked width).
- **Item 5** — Reduced the intro paragraph from 16px to 15px and confined it to `max-width: 50%` (roughly the left half of the panel) on desktop; added `max-width: none` in the mobile override so the intro stays full-width there.
- **Item 1** — Matched `.detail-hero__overlay-title` (the visible-on-arrival title) to the homepage carousel title's end-state: `font-size: 18px`, `left: var(--space-md)`, `text-transform: uppercase`. Combined with the site-wide `@view-transition{navigation:auto}` root crossfade already in place, the title now reads continuously in place across the homepage->gallery-detail navigation instead of jumping. `.detail-hero__reveal-title` (the 72px scrolled-down state) and the mobile override are untouched; the shared-VT-name alternative was considered and documented as deliberately deferred.
- **Item 6 (new feature)** — Added the mirror image of the homepage's own scroll-to-open gesture: on a gallery detail page, a sustained upward push while genuinely at the top navigates back to the homepage carousel showing the same gallery. Implemented as an opt-in feature (gallery pages pass `carouselReturnHref`; edition pages don't) with the exact safety design specified in the plan — `hasEngaged` (armed only after a genuine 300px+ scroll down) + `atTop()` + accumulator threshold (150) + idle-reset (800ms) + reset-on-leave-top, passive listeners, never `preventDefault`. `HomeCarousel` reads `?carousel=<slug>` on init via `findIndex` (never building a DOM selector from the untrusted param) to land on the requested gallery.

## Task Commits

Each task was committed atomically:

1. **Task 1: HomeCarousel caption + accent-panel polish (Items 2, 3, 4, 5)** - `eb3dff2` (feat)
2. **Task 2: DetailHero overlay-title end-state match (Item 1)** - `135b831` (feat)
3. **Task 3: Scroll-up-at-top returns to the carousel showing the same gallery (Item 6)** - `3967f47` (feat)
4. **Task 4: e2e coverage for the polish + title-consistency (Items 1-5)** - `2906ea7` (test)
5. **Task 5: e2e coverage for the scroll-up-to-return feature (Item 6)** - `a767ac6` (test)

_No plan-metadata commit — per instructions, docs artifacts (SUMMARY.md, STATE.md, PLAN.md) are committed by the orchestrator, not this executor._

## Files Created/Modified

- `src/components/HomeCarousel.astro` - Byline removal (markup/script/CSS), custom cursor, narrower accent panel + retuned wordmark clamp, resized/repositioned intro, `data-slug` + `?carousel=` init read
- `src/components/DetailHero.astro` - Overlay-title end-state match; new optional `carouselReturnHref` prop, `data-carousel-return-href` attribute, and an independent scroll-up-to-return script
- `src/pages/galleries/[slug].astro` - Computes and passes `carouselReturnHref` (FR)
- `src/pages/en/galleries/[slug].astro` - Computes and passes `carouselReturnHref` (EN)
- `tests/e2e/homepage.spec.ts` - Fixed 2 byline-dependent tests, added cursor/panel-width/intro coverage
- `tests/e2e/gallery.spec.ts` - Added overlay-title-consistency coverage (Item 1) and the full Item 6 describe block (positive path, accidental-trigger regression guards, below-threshold guard, edition-scoping guard, `?carousel=` init proof)

## Decisions Made

- Item 1: deliberately did NOT add a shared cross-document `view-transition-name` between the two titles — the existing root crossfade plus an end-state-matched title already reads as continuous in place, and a dedicated name would introduce a new always-on name on a 100svh element (the same risk class documented for `.detail-hero__img`'s own desktop-gated naming) for only marginal benefit.
- Item 6: implemented as a fully independent top-level `<script>` block in `DetailHero.astro`, not nested inside the existing reveal-driver guard — this keeps the gesture working on mobile, where the scroll-reveal driver is inactive by design.
- Item 6 safety design followed the plan's spec exactly: `hasEngaged` + `atTop()` + threshold + idle-reset + reset-on-leave-top, mirroring the quick-260725-sj4 post-mortem in reverse (an accumulator armed from a fresh scrollY-0 load would otherwise misfire on small upward corrections, the same class of bug as sj4's vacuously-true `atBottom()` at load).
- Item 4's numeric wordmark-clip claim was verified independent of Sanity content via a standalone Playwright geometry harness (real self-hosted `@fontsource/unbounded` 600-weight font, exact shipped CSS clamp/panel values) rather than relying solely on the e2e suite, since a live browser check was possible without needing a full build. The harness files were written to a temp location, run, and deleted — not committed.

## Deviations from Plan

None — plan executed exactly as written across all 5 tasks (Items 1-6). No Rule 1/2/3 auto-fixes were needed; no architectural changes (Rule 4) were required.

### Environment limitation (not a code deviation, documented per constraints)

This worktree has no `.env` (Sanity credentials are never provisioned to per-agent worktrees), with two consequences:

1. `npm run build` fails with `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars` (confirmed directly by running it).
2. `npm run test:e2e` could not validate this task's actual code. Checked for the exact stale-server failure mode documented in prior tasks' summaries (quick-260725-sj4): `lsof -i :4321` shows an unrelated `node` process already listening on port 4321, with `cwd` = the MAIN repo (`/Users/florian/Projects/ajs-website`), not this worktree. Since Playwright's `webServer` config uses `reuseExistingServer: !process.env.CI` (true locally), running `npm run test:e2e` here would silently reuse that unrelated, pre-fix server and produce a false result — exactly the failure mode flagged in the task instructions. **`npm run test:e2e` was deliberately NOT run** to avoid reporting a false pass.

`npx astro check` (typecheck) passes with 0 errors across all 6 modified files (both `.astro` components, both gallery detail routes, both spec files) — confirms every new/updated test is well-formed and type-correct, and confirms no `home-hero__byline`/`gallery-statement`/`statementEl`/`fallbackByline` references remain. `npm run test:unit` passes 147/147 (after running `npm ci` inside `sanity/` to resolve a pre-existing, unrelated `@sanity/icons` module-resolution gap in `tests/unit/dashboard-logic.test.ts`, per the task's own noted known limitation).

**The orchestrator must run the full `npm run test:e2e` suite with real Sanity credentials on an isolated port during independent verification** to confirm:
- Item 6's positive path AND all 4 accidental-trigger/below-threshold regression guards (the highest-risk item in this plan)
- Items 1-5's new/updated coverage
- The full pre-existing suite stays green (no regression from the byline removal or the panel/title/hero changes)

### Item 4 wordmark-clip verification (per constraints, flagged explicitly)

Verified live via computed geometry (not just the e2e assertion, which itself could not be executed in this environment) using a standalone Playwright harness that loaded the real self-hosted `@fontsource/unbounded` 600-weight font and the exact shipped CSS values (`clamp(38px, 5.2vw, 70px)` wordmark, `min(700px, 52%)` panel, `var(--space-xl)` padding) at 14 viewport widths spanning 768-1920px. Result: zero clipping at any checked width — "JACQUELINE" (the widest line) stays 38-91px clear of the panel's right inner edge across the full range. This is a genuine, independent confirmation of the no-clip claim, not merely trusting the e2e assertion that also asserts it. The harness was not committed (temp files, deleted after the run).

## Issues Encountered

- `node_modules` was absent in this worktree at task start; resolved via `npm ci` at the repo root (431 packages).
- `tests/unit/dashboard-logic.test.ts` failed with a missing `@sanity/icons` module error; resolved via `npm ci` inside `sanity/` (pre-existing, unrelated environment gap per the task's own noted limitation, not caused by this task).
- Confirmed (via `lsof`) that a stale/unrelated preview server from a different process/cwd is listening on port 4321 in this environment — the exact issue documented in quick-260725-sj4's own summary. Deliberately did not run `npm run test:e2e` to avoid a false result from that stale server.

---

**Total deviations:** 0 code deviations. 1 documented environment limitation (pre-existing, not caused by this task) preventing full local e2e validation; 1 independent (non-e2e) geometry verification performed in its place for the Item 4 no-clip claim specifically.
**Impact on plan:** None on the code delivered — all 5 tasks executed exactly as specified, each verified via `npx astro check` (0 errors) immediately before its commit. The e2e-suite verification gap is purely a worktree/credentials limitation and is flagged above for orchestrator follow-up, with Item 6 (the scroll-up-to-return feature) called out as the highest-priority item to re-verify given its accidental-navigation risk profile.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 items (Items 1-6) are implemented, committed, typecheck-clean, and independently re-verified: `npm run build` succeeds, `npm run test:unit` (147/147) and the full `npm run test:e2e` suite (212/212) pass with real Sanity credentials on an isolated port.
- Item 6 (the highest-risk item) was additionally replayed live end-to-end in a real browser: the positive path, the `?carousel=` init read, and the edition-exclusion scoping all confirmed correct.
- No blockers for other in-flight work; this task touched only `HomeCarousel.astro`, `DetailHero.astro`, the two gallery detail routes, and their spec files — edition detail pages, the édition hero, and all other site sections are untouched.

---
*Phase: quick-260725-tqs*
*Completed: 2026-07-26*

## Self-Check: PASSED

All 6 modified/verified files found on disk; all 5 task commit hashes (`eb3dff2`, `135b831`, `3967f47`, `2906ea7`, `a767ac6`) confirmed present in `git log`.
