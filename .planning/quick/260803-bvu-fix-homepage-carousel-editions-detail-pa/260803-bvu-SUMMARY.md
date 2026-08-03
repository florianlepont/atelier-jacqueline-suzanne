---
phase: quick-260803-bvu
plan: 01
subsystem: ui
tags: [astro, playwright, css, vanilla-js, homepage-carousel, view-transitions, contact-page]

requires:
  - phase: 17-homepage-carousel-intro-fixes
    provides: "HomeCarousel.astro's HOME-11 hover-no-longer-pauses change, which is what routinely put the pointer inside an edge zone at the exact moment the 6000ms auto-advance timer fires"
  - phase: 18-gallery-ditions-display-fixes
    provides: "DetailHero.astro's scroll-reveal hero (shared by gallery and édition detail pages) and its existing scroll-up-to-return gesture, both extended here"
provides:
  - "HomeCarousel.astro auto-advance that always crossfades (never slides) regardless of hover state, via a new is-auto-snap class + render()'s forceCrossfade option"
  - "HomeCarousel.astro is-over-controls class hiding the custom cursor pill over the caption's pause/progress controls"
  - "HomeCarousel.astro .home-grid__tile-title two-line clamp with the 260718-rhv alignment invariant preserved"
  - "DetailHero.astro editionVariant prop: single opt-in scoping flag driving both the uncropped (object-fit: contain) édition hero photo and the suppressed cross-document view-transition-name for éditions"
  - "DetailHero.astro's scroll-up-to-return gesture activated for édition detail pages via carouselReturnHref={overviewHref}"
  - "EditionDetailBody.astro with the duplicate format-details paragraph and in-flow back-link removed"
  - "ContactPageBody.astro / BaseLayout.astro tightened footer spacing on the Contact page"
affects: [homepage-carousel, edition-detail-pages, gallery-detail-pages, contact-page]

tech-stack:
  added: []
  patterns:
    - "Deferred class-scoped transition override (is-auto-snap): when two competing classes with equal CSS specificity both target the same transition property, declare the override LATER in the stylesheet to win the cascade tie, and hold the class alive past any async-deferred style mutation it needs to protect (here: a 60ms setTimeout to genuinely retrigger a transition, not just a forced reflow)."
    - "Single opt-in boolean prop (editionVariant) reused across multiple unrelated fixes (crop behavior AND view-transition naming) for the same caller, instead of adding one prop per fix, when both fixes are conceptually 'this hero is an édition, not a gallery'."

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - src/components/DetailHero.astro
    - src/components/EditionDetailBody.astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/components/ContactPageBody.astro
    - src/layouts/BaseLayout.astro
    - tests/e2e/homepage-carousel-core.spec.ts
    - tests/e2e/homepage-content-display.spec.ts
    - tests/e2e/edition.spec.ts
    - tests/e2e/gallery.spec.ts
    - tests/e2e/contact.spec.ts

key-decisions:
  - "Item 1's real root cause was NOT the literal 'eased slide' the plan hypothesized -- reproduction (getComputedStyle sampling every 15-40ms across a real swap) showed the CURRENT code, while hovering an edge zone, actually produced an instant POP with NO crossfade at all (is-tracking's blanket transition:none also silences the sharp layer's opacity transition), and separately, even with the pointer off the carousel entirely, the crossfade never played because removing then synchronously re-adding is-loaded within the same script never gives the browser a real elapsed-time window to register the intermediate state. Fixed both: is-auto-snap forces instant transform while preserving the opacity transition (specificity-tied with is-tracking, wins via cascade order), and render()'s new forceCrossfade option defers the is-loaded re-add by a genuine 60ms (confirmed empirically: neither a forced reflow nor a double-rAF wait was sufficient, only real elapsed time retriggers a CSS transition)."
  - "Item 4's root cause was CONFIRMED via direct getBoundingClientRect measurement, not guessed: navigating away from an édition page after scrolling down (the ordinary way to read the reveal panel) leaves .detail-hero__photo shrunk to its 55%-width settled state at the exact moment the outgoing View Transition snapshot is captured (measured 960px), while the incoming page always starts fresh at full width (measured 1280px) -- a real, large geometry delta on the shared hero-photo view-transition name. Fixed by suppressing the name for éditions (view-transition-name: none), falling back to the site-wide root crossfade."
  - "Item 7: object-fit: contain reads as an intentional 'framed on the wall' presentation at both 55%-width desktop scroll-reveal and 70svh mobile pin (confirmed via screenshots) -- no need to adapt the photo box's own sizing as the plan's fallback path allowed for."
  - "editionVariant is a single reused prop (not two separate props) since both Item 4 and Item 7 are the same underlying concept: 'this hero belongs to an édition, not a gallery.'"
  - "carouselReturnHref intentionally NOT renamed despite becoming slightly inaccurate for the édition case, per <scope_boundaries> -- its doc comment was updated instead."
  - "Item 8: the entire form-panel-to-footer gap was traced to a single declaration (.contact-page's own padding-bottom: var(--editorial-page-padding-block)) via direct measurement, not the grid/column-imbalance red herrings the plan flagged as 'known contributors to check' -- neither contributed measurably.  Overrode padding-bottom directly on .contact-page (never the shared token) plus a footer-specific (not header-shared) vertical-padding reduction at desktop."
  - "[Deviation, Rule 1] Rewrote one pre-existing sub-test in tests/e2e/gallery.spec.ts ('feature scoping — inert on edition heroes') that asserted the OLD behavior Item 6 intentionally supersedes (édition heroes now DO carry a carousel-return attribute, just pointing at a different destination) -- not touching it would have left a permanently-red, meaningless assertion in the CI gate."

requirements-completed: [260803-bvu]

coverage:
  - id: D1
    description: "Homepage auto-advance always shows a photo crossfade, never the manual peek/drag slide, even while the pointer rests in an edge zone (Item 1)"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-carousel-core.spec.ts#auto-advance + pause (D-09) > auto-advance never shows an eased slide even while the pointer rests in an edge zone"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-carousel-core.spec.ts#auto-advance + pause (D-09) > an edge-zone click still commits the full eased slide (commitEdge unaffected)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Custom cursor pill hides over the pause/progress caption controls, still shows in a plain edge zone (Item 2)"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-content-display.spec.ts#carousel pause-toggle cursor affordance (quick-260803-bvu, Item 2) > the custom cursor hides over the caption controls but still shows in a plain edge zone"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-content-display.spec.ts#carousel pause-toggle cursor affordance (quick-260803-bvu, Item 2) > the pause/play toggle is still reachable and clickable while the cursor is hidden over it"
        status: pass
    human_judgment: false
  - id: D3
    description: "Long grid titles wrap across whole words on up to two lines, no mid-word ellipsis cut, alignment invariant preserved (Item 3)"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-content-display.spec.ts#grid-tile title two-line clamp (quick-260803-bvu, Item 3) > the longest gallery title wraps across whole words on up to two lines, no mid-word ellipsis cut"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-content-display.spec.ts#grid-tile title two-line clamp (quick-260803-bvu, Item 3) > every tile title still starts at the same offset from its own tile bottom edge (260718-rhv invariant preserved)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Édition-to-édition hero navigation shows no shake/jitter; gallery hero view-transition behavior unchanged (Item 4)"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions hero cross-document transition scoping (Item 4, quick-260803-bvu) > the édition hero photo carries no shared view-transition-name at desktop, unlike a gallery hero which still does"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#cross-document view-transition name gating — desktop (sketch 006) > the hero photo carries hero-photo and the header carries ajs-header at desktop widths"
        status: pass
    human_judgment: false
  - id: D5
    description: "Format-details metadata line appears exactly once, in the hero reveal panel, accessible, visible on mobile, fr and en (Item 5)"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions detail > shows a bilingual statement and a format-details line that appears exactly once, in the hero reveal panel; no back-link"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions detail > the format-details line is visible on mobile"
        status: pass
    human_judgment: false
  - id: D6
    description: "Scroll-up-at-top on an édition detail page navigates to the éditions overview after genuine engagement; accidental triggers guarded; back-link removed (Item 6)"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#edition detail scroll-up-to-return (Item 6, quick-260803-bvu) > positive path (must navigate) > fr/en"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#edition detail scroll-up-to-return (Item 6, quick-260803-bvu) > accidental-trigger regression guard (must NOT navigate)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Édition hero photo shown whole, uncropped, at natural aspect ratio; gallery hero heroes keep their existing crop (Item 7)"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts#editions hero uncropped photo (Item 7, quick-260803-bvu) > an édition hero photo reports object-fit: contain, unlike a gallery hero which still crops"
        status: pass
    human_judgment: true
    rationale: "Whether the letterboxing 'reads as broken' at 55%-width desktop / 70svh mobile is a visual judgment call -- confirmed via screenshots taken during this session, but no automated test asserts aesthetic acceptability."
  - id: D8
    description: "Contact page has visibly less dead space between the form panel and the footer; footer not disproportionately tall (Item 8)"
    verification:
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts#contact page footer spacing (Item 8, quick-260803-bvu) > the form-panel-to-footer gap stays tight at a desktop viewport"
        status: pass
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts#contact page footer spacing (Item 8, quick-260803-bvu) > the footer is not disproportionately tall at a desktop viewport"
        status: pass
    human_judgment: false
  - id: D9
    description: "Full CI-equivalent gate green: typecheck, lint, build, test:artifact, test:e2e (chromium + webkit-mobile), test:unit"
    verification:
      - kind: other
        ref: "npm run typecheck && npm run lint && npm run build && npm run test:artifact"
        status: pass
      - kind: e2e
        ref: "npm run test:e2e (283/283, chromium + webkit-mobile)"
        status: pass
      - kind: unit
        ref: "npm run test:unit (276/276, 16 test files)"
        status: pass
    human_judgment: false

duration: ~3h
completed: 2026-08-03
status: complete
---

# Quick Task 260803-bvu: Homepage Carousel, Éditions Detail, Contact Footer Fixes Summary

**Fixed 8 client-reported UI/UX defects across three page areas: HomeCarousel.astro's auto-advance/cursor/grid-title bugs (Items 1-3), DetailHero.astro's édition-scoped hero transition/metadata/scroll-return/crop fixes (Items 4-7), and a Contact page footer-spacing tightening (Item 8) — three atomic commits, each with real regression coverage, full CI gate green.**

## Performance

- **Duration:** ~3h (including deep empirical root-cause investigation for Items 1 and 4)
- **Tasks:** 3 (all `type="auto"`, Tasks 1/2 `tdd="true"`)
- **Files modified:** 12 (7 source, 5 test)

## Accomplishments

- **Item 1 (root cause, confirmed by reproduction, NOT the literal hypothesis):** the plan's hypothesis was that auto-advance's `resetPeek()` produced a visible eased slide while hovering. Direct `getComputedStyle` sampling every 15-40ms across a real swap refuted that specific mechanism and found the ACTUAL bug: while hovering, `.is-tracking`'s blanket `transition: none` also silenced the sharp layer's own opacity crossfade (an instant, fade-less POP, not a slide); and — independently of hover — the crossfade never played at all because `render()` removes then synchronously re-adds `is-loaded` within the same script, which never gives the browser a real elapsed-time window to register the "unloaded" frame. Fixed both: a new `is-auto-snap` class (declared after `.is-tracking` in the cascade, same specificity, wins the tie) forces the transform half instant while keeping the opacity transition alive; `render()`'s new `forceCrossfade` option defers the `is-loaded` re-add by a genuine 60ms (empirically the minimum reliable delay — a forced reflow and even a double-`requestAnimationFrame` wait were both insufficient).
- **Item 2:** the accent cursor pill painted over the pause/progress controls inside `.home-hero__caption` because that region falls inside the left edge zone. The controls' own native `cursor: pointer` was ALREADY correctly set (confirmed live) — only the custom cursor overlay needed hiding, via a new `is-over-controls` class toggled from the `mousemove` handler.
- **Item 3:** `.home-grid__tile-title`'s single-line ellipsis clamp cut long titles ("The Victorian Tea room") mid-word. Replaced with a 2-line `-webkit-line-clamp` + `min-height` reservation mirroring the sibling `.home-grid__tile-description` pattern, preserving the 260718-rhv same-top-offset invariant across every tile.
- **Item 4 (root cause, confirmed by direct measurement):** navigating away from an édition page after scrolling down — the ordinary way to read the reveal panel — leaves `.detail-hero__photo` shrunk to its 55%-width settled state (measured: 960px) at the exact moment the outgoing page's View Transition snapshot is captured, while the freshly-loaded incoming page always starts full-bleed (measured: 1280px, scrollY 0). Two documents sharing the `hero-photo` view-transition name with that size delta forced a visible morph. Fixed by giving éditions `view-transition-name: none` at desktop (via the new `editionVariant` scoping), falling back to the site-wide root crossfade; galleries keep their shared name unchanged.
- **Item 5:** removed the duplicate `.edition-detail__format` paragraph; `DetailHero`'s own reveal-panel copy (aria-hidden removed) is now the single accessible instance, restored on mobile where it used to be `display: none`.
- **Item 6:** activated the existing scroll-up-to-return gesture for éditions by threading `overviewHref` through as `carouselReturnHref` (kept unrenamed per scope boundaries). Confirmed live that every published édition has well over 300px of scrollable height at mobile widths, so the gesture reliably arms. Removed the now-redundant in-flow "Retour aux éditions" back-link, its dead CSS, and the unused `backLinkLabel` prop.
- **Item 7:** added a single opt-in `editionVariant` prop (reused for both Item 4 and Item 7 — "this hero is an édition") that switches the hero photo to `object-fit: contain`, showing the whole photographer's framing letterboxed on the pin's own ink background. Confirmed via screenshots at both 55%-width desktop scroll-reveal and 70svh mobile pin that this reads as an intentional "framed on the wall" presentation, not broken — no need for the plan's fallback (adapting the photo box's own sizing).
- **Item 8:** measured live that the entire form-panel-to-footer gap on Contact was governed by a single declaration (`.contact-page`'s `padding-bottom: var(--editorial-page-padding-block)`) — 89.6px at 1280x900, 48px at 390x844 — with no other measurable contributor (the grid/column-imbalance candidates the plan flagged did not contribute). Overrode `.contact-page`'s own `padding-bottom` to a flat `var(--space-xl)` (32px) at both viewports, and separately reduced the footer's own (not the shared header/footer) vertical padding at desktop from 32px to 24px.

## Task Commits

Each task was committed atomically:

1. **Task 1: Homepage — autoplay transition, pause cursor affordance, grid title clamp (Items 1, 2, 3)** - `7053f8e` (fix)
2. **Task 2: Éditions — hero jitter, duplicate metadata, scroll-up return, uncropped photo (Items 4, 5, 6, 7)** - `2f89ec4` (fix)
3. **Task 3: Contact — tighten the excess vertical space before the footer (Item 8)** - `2bca438` (fix)

**Plan metadata:** committed separately by the orchestrator after wave completion (worktree mode — this agent does not commit SUMMARY.md/STATE.md/ROADMAP.md).

## Files Created/Modified

- `src/components/HomeCarousel.astro` - `is-auto-snap` class + `render(forceCrossfade)` (Item 1); `is-over-controls` class + mousemove handler branch (Item 2); `.home-grid__tile-title` 2-line clamp (Item 3)
- `src/components/DetailHero.astro` - `editionVariant` prop driving `.detail-hero--edition` (object-fit: contain for Item 7, `view-transition-name: none` for Item 4); `.detail-hero__format`'s `aria-hidden` removed + mobile `display: none` replaced with `opacity: 1` (Item 5); `carouselReturnHref` doc comment updated for its new édition consumer (Item 6)
- `src/components/EditionDetailBody.astro` - removed the duplicate `.edition-detail__format` paragraph and its CSS (Item 5); removed the `.edition-detail__back-link` anchor, its CSS, and the `backLinkLabel` prop (Item 6); passes `carouselReturnHref={overviewHref}` and `editionVariant` to `DetailHero`
- `src/pages/editions/[slug].astro` / `src/pages/en/editions/[slug].astro` - removed `backLinkLabel` prop from the `EditionDetailBody` call
- `src/components/ContactPageBody.astro` - `.contact-page`'s `padding-bottom` overridden to `var(--space-xl)` (Item 8)
- `src/layouts/BaseLayout.astro` - `footer.chrome-band`'s own vertical padding reduced at `>=768px` (Item 8)
- `tests/e2e/homepage-carousel-core.spec.ts` - Item 1 regression test (real-timer swap-moment transform check) + edge-click guard
- `tests/e2e/homepage-content-display.spec.ts` - Item 2 and Item 3 regression tests, placed next to (not replacing) the 260718-rhv alignment block
- `tests/e2e/edition.spec.ts` - rewrote the "editions detail" test for the new metadata/back-link contract; added Item 7 crop-scoping guard, Item 4 view-transition-name guard, and the Item 6 scroll-up-to-return describe block (positive path + accidental-trigger guard)
- `tests/e2e/gallery.spec.ts` - rewrote the one pre-existing sub-test that asserted the OLD "gesture stays inert on éditions" behavior (see Deviations)
- `tests/e2e/contact.spec.ts` - Item 8 gap/footer-height regression tests

## Decisions Made

See `key-decisions` in frontmatter for the full list, including the Item 1/4/8 root-cause diagnoses (all confirmed via direct live measurement, not assumed from the plan's hypotheses) and the Item 7 letterboxing acceptance decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rewrote a pre-existing gallery.spec.ts sub-test made obsolete by Item 6's intended behavior change**
- **Found during:** Task 2, full verification pass
- **Issue:** `tests/e2e/gallery.spec.ts`'s `'feature scoping — inert on edition heroes'` sub-test asserted that édition detail pages carry NO `data-carousel-return-href` attribute — exactly the behavior Item 6 intentionally supersedes (éditions now DO carry the attribute, pointing at the éditions overview instead of a gallery's `?carousel=` URL). Left as-is, this test would fail every run going forward, and `gallery.spec.ts` is explicitly outside Task 2's own `<files>` list.
- **Fix:** Rewrote the sub-test (not deleted, not weakened) to assert the NEW contract: the attribute is present and points at `/editions/` (or `/en/editions/`), never a `?carousel=` URL — proving galleries and éditions stay distinguishable by destination shape rather than by the attribute's mere presence. Every other assertion in `gallery.spec.ts` (hero-photo view-transition-name desktop/mobile, gallery's own scroll-up-to-return) is untouched.
- **Files modified:** `tests/e2e/gallery.spec.ts`
- **Verification:** `npx playwright test tests/e2e/gallery.spec.ts --project=chromium` — 57/57 pass
- **Committed in:** `2f89ec4` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug/obsolete-test fix)
**Impact on plan:** Necessary for CI-gate correctness; not scope creep — the plan's own `<scope_boundaries>` explicitly requires rewriting (never weakening) a test whose assertion "legitimately no longer describes desired behavior."

## Issues Encountered

- **Playwright's `webServer` config target port (4321) is separate from `astro dev`'s own port** (which falls back to 4322 whenever 4321 is occupied by Playwright's own auto-launched `npm run preview` server serving a stale `dist/` build). Several early manual-verification Playwright runs against a relative `'/'` URL silently hit this STALE preview server instead of the live dev server on 4322, producing misleading "the fix isn't working" results. Corrected by using absolute `http://localhost:<port>/` URLs pointed at the actual running `astro dev` daemon for all manual verification, and by running `npm run build` once early to keep the fallback preview server non-broken for the later full e2e gate run. This was a test-methodology issue only — no source-code impact.
- **Item 1's true root cause required significant additional empirical investigation** beyond the plan's literal hypothesis (see Decisions) — `page.clock`-based virtual-time tests could not distinguish an eased transition from an instant snap (virtual time resolves any in-flight transition synchronously), so the real regression test uses real timers with a tight `waitForFunction`-based poll instead.
- This worktree was missing `.env` (gitignored) and both `node_modules` trees (root and `sanity/`); copied `.env` from the main checkout and ran `npm ci` / `npm ci --prefix sanity` before any verification — environment provisioning, not a source change, neither committed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 8 client-reported items fixed, individually demonstrable, and covered by real regression tests (not just the manual scratch scripts used during diagnosis, all of which were deleted before committing).
- Items 4, 6, and 7 are provably scoped to éditions only — every gallery.spec.ts assertion about gallery detail hero behavior (crop, view-transition name, scroll-up-to-return) passes byte-unchanged.
- No blockers. `.planning/phases/18-gallery-ditions-display-fixes/18-UAT.md` was never read or written.

## Full Verification Gate Results

1. `npm run typecheck` — 0 errors, 0 warnings, 2 pre-existing hints (unrelated `webkitBackgroundClip` deprecation notices in `tests/e2e/homepage-wordmark-peek.spec.ts`)
2. `npm run lint` — clean, no output
3. `npm run build` — 29 pages built successfully
4. `npm run test:artifact` — "Static artifact verified (29 HTML files, base /)"
5. `npm run test:e2e` (both configured projects: chromium + webkit-mobile) — **283/283 pass, 0 failures**
6. `npm run test:unit` — **276/276 pass, 16 test files**

Cross-scope guards (required green with NO edits to their spec files, per the plan's `<verification>` section):
- `tests/e2e/gallery.spec.ts`'s hero-photo view-transition-name (desktop present / mobile absent) and gallery scroll-up-to-return — all pass unchanged (one unrelated sub-test was rewritten per the Deviations section above, not these guard assertions).
- `tests/e2e/homepage-wordmark-peek.spec.ts` (peek/commit and dash/auto-advance interaction) — all 40 tests pass unchanged.
- The `grid-tile title alignment (260718-rhv)` block in `tests/e2e/homepage-content-display.spec.ts` — both tests pass unchanged.

---
*Phase: quick-260803-bvu*
*Completed: 2026-08-03*

## Self-Check: PASSED

All 13 claimed files verified present on disk (7 source files, 5 test files, plus this SUMMARY.md). All 3 task commit hashes (`7053f8e`, `2f89ec4`, `2bca438`) confirmed present in `git log --oneline --all`.
