---
phase: 21-homepage-scroll-experience
plan: 10
subsystem: ui
tags: [astro, css, playwright, css-grid, scroll-driven, mobile-safari]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience
    provides: "plan 21-07's per-frame deck driver (computeZoomProgress keyed off the track's own live getBoundingClientRect().top) and plan 21-09's ink paint floor/svh convention this plan's intro beats reuse"
provides:
  - "Two full-viewport pre-zoom intro sections (a centred logomark + scroll cue, then the same logomark + the site's intro tagline) inside .home-scroll-deck, before .home-scroll-deck__track"
  - "data-intro-active attribute extending D-12's header hide to cover both new beats"
  - "The intro tagline registered as an arrival target of the existing per-frame loop, reusing D-13's reveal values verbatim"
  - "A getIntroOffset() e2e helper plus rebased scroll targets across every describe block in homepage-scroll-deck.spec.ts that lands inside the zoom scrub or on a slide"
  - "A 3-row CSS Grid intro layout (minmax(0,1fr) auto minmax(0,1fr)) that keeps the logomark pixel-identical between beats regardless of the secondary element's height"
affects: ["21-UAT.md gap 1 closure; the phase's consolidated real-device human-verify gate"]

tech-stack:
  added: []
  patterns:
    - "minmax(0, 1fr) auto minmax(0, 1fr) grid-template-rows: the idiom for centring a fixed-size element independently of a variable-height sibling — overriding the flexible tracks' content-based automatic minimum to 0 forces them exactly equal regardless of what renders in the sibling's row"
    - "Scroll-target test helpers fold in document-flow offsets internally (getIntroOffset() called once inside getSlideScrollTargets()/getArrivalScrollTarget()) rather than repeating the arithmetic at every call site"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "Both intro beats render byte-for-byte identical logo markup/classes (assumption A4), with a CSS Grid layout fix (not the originally-committed flex justify-content:center) to make that markup-level identity actually produce pixel-identical rendered geometry"
  - "No scroll-snap-align/scroll-snap-stop on the intro sections (assumption A3), to avoid the page-wide proximity snap pulling the visitor back into the intro mid-scrub"
  - "Intro sections dismissed purely by scrolling past — no tap/timer dismissal (assumption A2)"
  - "Ink background + white logomark + a locale-conditional scroll cue with a gentle vertical drift (assumption A5), continuous with plan 21-09's own paint floor and phone theme colour"
  - "Under reduced motion, both beats render statically with no driver attaching at all — the header stays visible, falling out of D-15's existing convention rather than a new rule (assumption A1)"
  - "Every e2e scroll target that lands inside the zoom scrub or on a slide is derived from the track's own rendered document offset (getIntroOffset()) rather than a hardcoded 'two viewport heights' literal, so the tests stay correct if assumption A4 is ever revised"

requirements-completed: [HOME-15]

coverage:
  - id: D1
    description: "Both pre-zoom intro beats exist, are styled, and render byte-for-byte identical logomark geometry so the tagline reads as arriving beneath a logo that stays put"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#beat 1 on first load: full-viewport, logomark and cue visible, wordmark present but off-screen below (A4/A5)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#beat 2: after one viewport height of scroll its tagline reveals (opacity 0 -> 1), reading as arriving beneath the logo (D-13)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#both beats render byte-for-byte identical logomark geometry — same width, height and viewport-relative vertical centre (assumption A4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The header stays hidden through both intro beats (D-12 extension) and the intro beats carry no scroll-snap point (assumption A3)"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the header is hidden through both intro beats, and returns once the zoom fully completes (D-12 extension)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the intro beats carry no scroll-snap point, unlike a slide (assumption A3, 21-RESEARCH.md Pitfall 6)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A reduced-motion phone visitor sees both beats as static content with the tagline already visible and the header reachable; desktop/tablet is fully inert"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#reduced motion: both beats render statically, the tagline is already visible, the header stays visible, and no intro-active attribute is written (assumption A1)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#desktop inert: neither intro beat is visible (success criterion 5, UI-02)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Nothing about the intro exists at 768px and above, and exactly one level-1 heading still exists at phone width; the full suite (existing plus rebased cases) is green on both Playwright projects"
    requirement: "HOME-15"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#structural guards still hold with the intro beats present: exactly one level-1 heading, no horizontal overflow (D-16)"
        status: pass
      - kind: e2e
        ref: "full suite: npx playwright test --project=chromium (429 passed) and --project=webkit-mobile (5 passed, smoke-only project)"
        status: pass
      - kind: other
        ref: "npm run typecheck && npm run lint && npm run test:coverage (318 unit tests) && npm run test:artifact"
        status: pass
    human_judgment: false
  - id: D5
    description: "Real-device pass closing all four 21-UAT.md gaps at once, and confirming or correcting assumptions A1 through A5"
    verification: []
    human_judgment: true
    rationale: "Neither Playwright project can reproduce real Mobile Safari touch-momentum/scroll-snap physics, toolbar-collapse animation, or genuine network latency — the exact reason 396+ passing e2e tests coexisted with all four 21-UAT.md defects before this gap-closure set. This plan's own Task 3 human-check carries the consolidated real-device gate; the design assumptions A1-A5 (restated below) additionally need a human judgement call no test can make."

# Metrics
duration: ~35min (across two agent sessions; interrupted mid-Task-3 by a provider quota error, resumed by a fresh continuation agent)
completed: 2026-08-08
status: complete
---

# Phase 21 Plan 10: Pre-Zoom Intro Beats (Gap-Closure) Summary

**Two pre-zoom intro beats — a centred logomark with a scroll-down cue, then the site's intro tagline arriving beneath the same logomark — inserted before the homepage's phone-width wordmark zoom, closing `21-UAT.md` gap 1, with every downstream e2e scroll target rebased against the track's own live document offset.**

## Performance

- **Duration:** ~35 min total across two agent sessions (session 1: Tasks 1-2 plus a partial Task 3 draft, interrupted by a provider quota error, not a code failure; session 2, this continuation: verified Tasks 1-2, finished and committed Task 3)
- **Tasks:** 3/3 completed
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`)

## Accomplishments
- Two full-viewport intro sections added as the first children of `.home-scroll-deck`, before `.home-scroll-deck__track`: beat 1 (logomark + scroll cue), beat 2 (logomark + the site's intro tagline, rendered only when `introBody` is non-empty)
- `data-intro-active` attribute extends D-12's existing header-hide rule to cover both beats, written from the same per-frame measurement `computeProgress()` already takes (no second rect read)
- The intro tagline joined the existing per-frame `applyArrival()`/`arrivalTargets` loop, reusing D-13's locked reveal values (opacity 0→1, `translateY(8px)→0`, 180ms ease) verbatim — guarded so an intro section's arrival never writes HOME-16's accent custom properties or calls `warmNextSlide`
- `homepage-scroll-deck.spec.ts` rebased: a new `getIntroOffset()` module-scope helper derives the pre-zoom distance from the track's own rendered document offset (not a hardcoded "two viewport heights"), folded into `getSlideScrollTargets()` and `getArrivalScrollTarget()` so every dependent case gets the correct target automatically; the `21-04-PLAN.md` "wordmark fills viewport before any scrolling" case is deliberately rewritten (renamed, same coverage thresholds, now scrolled to the track's offset first) per `21-UAT.md` gap 1's own instruction
- A new `pre-zoom intro beats` describe block (9 cases) covers: beat 1 full-viewport geometry, beat 2's tagline reveal, identical logo geometry between beats (assumption A4), header hidden through both beats, no scroll-snap point (assumption A3), non-empty Sanity-sourced tagline copy, reduced motion (assumption A1), desktop inertness, and the D-16 structural guards restated for the new markup
- **Auto-fixed a real geometry bug** the new identical-logo-geometry case caught (see Deviations below): the committed flex `justify-content: center` layout shifted the logomark's vertical position between beats depending on the secondary element's height; fixed with a 3-row CSS Grid

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the two intro beats — markup and CSS (D-13 reveal values, D-16 heading rule, A3/A4/A5)** - `94d4c40` (feat)
2. **Task 2: Wire the intro beats into the driver — header hide and tagline reveal (D-12, D-13, D-14, D-15)** - `849545d` (feat)
3. **Task 3: Rebase the spec on the new scroll geometry, cover the intro beats, and close the phase gate** - `ed3e7e5` (test)

**Plan metadata:** this commit (docs: complete plan) — see final commit below.

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Two intro `<section>`s (markup) before the zoom track; CSS for `.home-scroll-deck__intro`/`-logo`/`-cue`/`-body` (Task 1, then re-laid-out as a 3-row grid in Task 3's bug fix); `data-intro-active` header-hide selectors; deck-script `introSections`/`arrivalTargets`/`applyIntroActive()` additions (Task 2)
- `tests/e2e/homepage-scroll-deck.spec.ts` - `getIntroOffset()` module helper; rebased scroll targets across the zoom-driver, arrival, per-frame-driver, and progressive-loading describe blocks; rewritten "wordmark on first load" case; new `pre-zoom intro beats` describe block (9 cases)

## Decisions Made
- See `key-decisions` in frontmatter above for the design choices (A1-A5) carried into the implementation
- CSS Grid (`minmax(0,1fr) auto minmax(0,1fr)`) chosen over an absolute-positioning alternative for the A4 geometry fix — it keeps the intro sections in normal flow (unlike absolute positioning, which would need every child manually repositioned) while still fully decoupling the logo row's size from the secondary row's content height
- Scroll-target helpers (`getSlideScrollTargets()`, `getArrivalScrollTarget()`) fold `getIntroOffset()` in internally rather than repeating the addition at each of their several call sites, so the fix applies uniformly and can't be missed at a new call site later

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Logomark drifted vertically between the two intro beats, violating assumption A4**
- **Found during:** Task 3, via the new "both beats render byte-for-byte identical logomark geometry" e2e case
- **Issue:** Task 1's committed CSS laid the intro sections out as `display: flex; flex-direction: column; justify-content: center`, which centres the WHOLE stack (logo + secondary element) as a unit. Beat 1's secondary element (the short scroll cue) and beat 2's secondary element (the tagline paragraph, whose height varies with copy length/locale) have different natural heights, so the logomark itself rendered at different vertical positions between the two beats — measured at ~35.7px of drift in the failing run. This directly violates assumption A4 ("both beats render the logomark at identical size and position... so scrolling reads as the tagline arriving beneath a logo that appears to stay put"), which is the plan's own explicit acceptance criterion (Task 3 item 7).
- **Fix:** Changed `.home-scroll-deck__intro` from flex to a 3-row CSS Grid (`grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr)`), with the logomark pinned to the fixed middle (`auto`) row and the cue/tagline placed in the third row (`align-self: start`). `minmax(0, 1fr)` (not a bare `1fr`) is load-bearing: it overrides each spacer row's content-based automatic minimum to 0, forcing the two spacer rows to stay exactly equal regardless of what renders in row 3 — so the logo's own row, and therefore the logo itself, is always precisely centred in the viewport in both beats, independent of the secondary element's height.
- **Files modified:** `src/components/HomeCarousel.astro` (CSS only — no markup or driver script changes)
- **Verification:** The identical-logo-geometry case passes (width/height/vertical-centre all within 2px between beats); full `homepage-scroll-deck` spec (63 cases) and the full e2e suite (429 chromium, 5 webkit-mobile) re-run clean after the fix
- **Committed in:** `ed3e7e5` (Task 3 commit — the fix landed alongside the test that caught it, since Task 1's commit was already made in the prior session)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correctness against the plan's own explicit A4 acceptance criterion. No scope creep — CSS-only change to the already-committed intro layout, no markup or driver script touched.

## Assumptions, not decisions (restated verbatim from 21-10-PLAN.md, per its own requirement)

`21-UAT.md` gap 1's `missing` list explicitly recorded that fresh discuss-phase-style decisions were needed and named several unresolved questions. No locked `21-CONTEXT.md` decision covers them. Each is stated below with its reasoning, exactly as the plan states it, so it can still be overridden by the developer — confirming or correcting each of these by name is part of Task 3's real-device human-check.

- **A1 — Reduced motion gets the intro beats, as static content.** Both beats render; the tagline is permanently visible (no reveal); the scroll cue's motion is suppressed; and the header is NOT hidden during the beats. Reasoning: the beats are *content*, not motion, so excluding a reduced-motion visitor from them would hide real information; but D-15's established convention is that no scroll-linked JS attaches at all under that query, and the header hide is JS-attribute-driven, so the header staying visible falls out of that convention rather than being a new choice. This also keeps the suite's existing reduced-motion route to an interactive header intact — `mobile-nav.spec.ts`, `accessibility.spec.ts` and `critical.smoke.spec.ts` all rely on it. *Alternative if corrected: hide the header under reduced motion too, which would require a CSS-only (non-JS) hide condition and a coordinated update to those three specs.*

- **A2 — The beats are dismissed by scrolling past them, and nothing else.** No tap-to-dismiss, no skip button, no timed auto-advance. Reasoning: every other state in this deck is a pure function of scroll position (D-04's reversibility depends on exactly that), so a tap or timer dismissal would introduce a second, one-way interaction model and a piece of state the rest of the deck does not have — including the question of what happens when the visitor scrolls back up. Scroll-past keeps the whole opening reversible, which is consistent with D-04. *Alternative if corrected: a tap-to-dismiss would need a decision about whether scrolling back up restores the beats.*

- **A3 — The intro beats get NO scroll-snap point of their own.** Reasoning: each beat is exactly one viewport tall, so an ordinary scroll already lands cleanly on it without help. Adding `scroll-snap-align` immediately before the deliberately snap-free 900px zoom scrub would put a snap target right where the scrub begins, and the page-wide `proximity` snap could then pull the visitor backwards into the intro mid-scrub — the same conflict class `21-RESEARCH.md` Pitfall 6 made the track itself snap-free to avoid. The slides keep their own `scroll-snap-align: start` plus `scroll-snap-stop: always` unchanged. *Alternative if corrected: giving the beats snap points requires re-testing the scrub against proximity snap on a real device.*

- **A4 — Two stacked full-viewport sections in normal flow; no new pinned or scrubbed machinery.** The pre-zoom distance is therefore two viewport heights. Both beats render the logomark at identical size and position, so scrolling from beat 1 to beat 2 reads as the tagline arriving beneath a logo that appears to stay put — which is what the developer's wording describes ("then the site's intro tagline appears below the logo, then that disappears"), achieved without a second sticky/scrub driver. Reasoning: adding another pinned scroll-scrubbed stage would add a second handoff boundary, and handoff desynchronisation is precisely the defect plan 21-07 just fixed. *Alternative if corrected: one pinned intro section whose tagline scrubs in, which is a materially larger change.* **Note:** the "identical size and position" half of this assumption required a CSS fix beyond what was originally committed — see Deviations above; the requirement itself is unchanged, only its implementation.

- **A5 — Visual treatment: ink background, white logomark, a short localised scroll cue with a gentle vertical drift.** Reasoning: the deck's own paint floor is the ink token (plan 21-09) and its phone theme colour is the same value, so an ink intro screen is continuous with everything that follows and avoids reintroducing the white-strip problem plan 21-09 just closed; a white logomark is required for contrast on ink, and `logoWhiteSrc` already exists for exactly that. The cue label uses the existing hardcoded locale-conditional string idiom this component already uses elsewhere, so no new CMS field is introduced. *Alternative if corrected: a white intro screen with the black logomark, which matches the site's dominant identity but reintroduces the white-strip exposure at the top of the screen and diverges from the theme colour.*

## Every existing e2e case whose scroll target was rebased (offset arithmetic only; no assertion weakened)

- `wordmark-to-photo zoom driver` describe block: `mid-scrub scale is strictly between 1 and 8.5 (D-04)`, `completion: wordmark fully faded...`, `header fades in once the zoom completes (D-12)`, `reversibility: scrolling back to the top restores the rest state (D-04)` (forward target only — the return-to-0 target is unchanged)
- `arrival reveal and accent liveness` describe block, via the `getSlideScrollTargets()` helper: `arrival reveals: scrolling to the first slide...`, `accent tracks the arrived gallery (D-09)`, `second slide: arrival and accent move to the second gallery...`, `reversal: scrolling back to the top hides every description again` (forward target only)
- `per-frame deck driver — scroll-event independence and atomic handoff` describe block: `scroll-event independence — mid-scrub`, `scroll-event independence — completion` (manual arithmetic); `scroll-event independence — arrival`, `atomic handoff`, and `detach on gate change releases everything` (via the `getArrivalScrollTarget()` helper)
- `deck-slide progressive loading` describe block: `arriving at a slide promotes the NEXT slide's sharp image out of native-lazy (the runtime warm, D-14 rising edge)`
- `full-screen wordmark once the pre-zoom intro beats are scrolled past` — the one case whose assertion itself (not just its scroll target) was deliberately rewritten and renamed, per `21-UAT.md` gap 1's explicit instruction, superseding `21-04-PLAN.md` Task 1 case 3

Not rebased (no manual scroll target measuring the track, or reduced-motion/desktop cases where position is irrelevant to the assertion): `rest state before any scrolling`, `header hidden during the zoom`, `the zoom anchors on the leading letter...`, all reduced-motion and desktop-inert cases across every describe block, `tap-to-open` (Playwright's `click()` auto-scrolls regardless of target position), and every case in the `deck viewport-height convention and phone theme colour` block (none of which scroll).

## Issues Encountered
- **Provider quota interruption, not a code failure:** the prior executor session was terminated mid-Task-3 by a provider quota error after committing Tasks 1 and 2 cleanly. This continuation agent verified the prior commits, read the uncommitted partial Task 3 draft already in the working tree, and built on it rather than restarting.
- **Pre-existing, out-of-scope flake reconfirmed:** `edition.spec.ts:396` ("galleries unaffected: the gallery masonry path renders identically now that éditions share it") failed once in a full chromium run with `NaN` in a `naturalWidth`/`naturalHeight` ratio comparison, then passed 3/3 on a targeted `--repeat-each=3` re-run. This is the same pre-existing image-load-race flake already documented in `21-08-SUMMARY.md` and `21-09-SUMMARY.md` — a file this plan never touches. Logged per the SCOPE BOUNDARY rule, not fixed.
- **Stale debug config, deleted before this commit:** the resumed session inherited an untracked `playwright.debug.config.ts` (port 4399) from the prior session, created because a stale sibling-worktree preview process might still occupy port 4321. Port 4321 was actually free in this session; the debug config was used for the first verification pass, then the exact Task 3 verify command was re-run in full against the real `playwright.config.ts` (port 4321) before committing, and the debug config was deleted. It never touched a commit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `21-UAT.md` gap 1 is closed: the phone-width homepage now opens on the centred logomark + scroll cue, then the tagline arrives beneath it, before the wordmark zoom begins.
- All three of that gap's `missing` items are delivered: the new pre-zoom beat, D-12's header-hide condition extended to cover it (`data-intro-active`), and `21-04-PLAN.md` Task 1's now-conflicting assertion deliberately rewritten.
- The gap's fourth `missing` item — the open design questions — is answered explicitly and correctably: assumptions A1 through A5 are restated above and are Task 3's real-device human-check's own subject.
- D-12, D-13, D-14, D-15, D-16 all still hold; HOME-16's random starting accent is provably intact against intro-section arrivals (guarded on `dataset.heroColor` presence).
- Full e2e suite green on both Playwright projects (429 chromium, 5 webkit-mobile smoke-only) modulo the one documented, pre-existing, out-of-scope `edition.spec.ts` flake; `npm run typecheck`, `npm run lint`, `npm run test:coverage` (318 unit tests), and `npm run test:artifact` are all clean.
- This is the last plan in the gap-closure set. Task 3's `<verify><human-check>` block carries the consolidated real-device gate for all four `21-UAT.md` gaps at once (missing intro beat, zoom-to-slide handoff, blur-placeholder pop-in, status-bar white bar), and asks the developer to confirm or correct assumptions A1-A5 by name — required before the phase can be considered fully re-verified.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-08*

## Self-Check: PASSED

All claimed files exist (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`, this SUMMARY) and all claimed commit hashes (`94d4c40`, `849545d`, `ed3e7e5`) resolve in `git log`.
