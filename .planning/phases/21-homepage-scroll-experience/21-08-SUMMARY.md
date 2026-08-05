---
phase: 21-homepage-scroll-experience
plan: 08
subsystem: ui
tags: [astro, playwright, image-loading, blur-up, sanity-image-url]

# Dependency graph
requires:
  - phase: 21-homepage-scroll-experience
    provides: "plan 21-04's deck slide markup/driver, plan 21-07's per-frame arrival loop"
provides:
  - "HOME-09 blur-up placeholder/sharp pair applied to every .home-slide"
  - "Two-slide eager/priority split (high then low fetch-priority) with everything else native-lazy"
  - "Idempotent runtime next-slide warm hooked to the deck driver's D-14 rising edge"
  - "10 new e2e cases in homepage-scroll-deck.spec.ts covering the two-layer stack, priority hints, crossfade, failure path, warm, reduced-motion parity, and the desktop/grid regression guard"
affects: ["21-09 (deck background-colour safety net)", "21-10 (real-device UAT pass covering all four 21-UAT.md gaps)"]

tech-stack:
  added: []
  patterns:
    - "HOME-09 two-image stack (blurred placeholder + sharp crossfade) reused verbatim on a third call site (.home-slide) after .home-hero and .home-grid"
    - "Idempotent per-frame-driver side effects: guard on the deferral attribute's presence so a warm fires at most once per image despite running inside a 60fps loop"

key-files:
  created: []
  modified:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage-scroll-deck.spec.ts

key-decisions:
  - "Priority eagerness bounded to exactly two slides (index 0 high, index 1 low fetch-priority) — going wider was rejected as trading perceived-latency for a real phone-bandwidth problem (T-21-08-A)"
  - "Runtime warm lives only in applyArrival()'s rising-edge branch, never the per-frame path outside it, and is not reversed in clearInlineStyles() — starting a fetch is not a reversible inline style"
  - "Load-listener broadening kept in the un-gated (first) carousel script, not the phone-width driver, so reduced-motion visitors (D-15) still get the crossfade"

requirements-completed: [HOME-14]

coverage:
  - id: D1
    description: "Every deck slide renders a stacked 24px blurred placeholder plus a sharp crossfading photo (HOME-09 pattern), never showing an empty box while loading"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#every slide renders exactly one placeholder and one sharp image, at genuinely different resolutions"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the placeholder image never carries a lazy loading attribute"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the first slide's crossfade reaches its loaded state, with the placeholder still present underneath"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly two slides ship eager (high then low fetch-priority); every later slide stays native-lazy with no fetch-priority hint (T-21-08-A bound)"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the first slide's sharp image is eager with high fetch priority"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#the second slide's sharp image is also eager"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#every slide from the third onward stays native-lazy with no fetch-priority hint"
        status: pass
    human_judgment: false
  - id: D3
    description: "A slide whose sharp photo fails outright still shows its placeholder rather than a blank area"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#when every sharp rendition fails outright, the first slide still shows its placeholder rather than a blank area"
        status: pass
    human_judgment: false
  - id: D4
    description: "Arriving at gallery N starts gallery N+1's photo download once, idempotently, from the deck driver's rising edge"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#arriving at a slide promotes the NEXT slide's sharp image out of native-lazy (the runtime warm, D-14 rising edge)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Reduced-motion visitors still get both image layers and the crossfade; desktop/tablet and the grid tiles' own HOME-09 pair are unaffected"
    requirement: "HOME-14"
    verification:
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#reduced motion: every slide still gets both layers, and the first slide's crossfade still reaches its loaded state"
        status: pass
      - kind: e2e
        ref: "tests/e2e/homepage-scroll-deck.spec.ts#desktop: the deck is absent and the grid tiles' own HOME-09 placeholder/sharp pair is untouched"
        status: pass
    human_judgment: false
  - id: D6
    description: "Real-device confirmation that a normal unhurried scroll finds each gallery already sharp"
    verification: []
    human_judgment: true
    rationale: "Perceived-latency/jank on a real phone network cannot be proven by an automated harness; the plan itself defers this to 21-10's combined real-device pass covering all four 21-UAT.md gaps."

# Metrics
duration: ~3h45m (cumulative across three executor sessions; two prior attempts were terminated by provider session-limit/stall errors unrelated to the work, not code failures)
completed: 2026-08-05
status: complete
---

# Phase 21 Plan 08: Deck-Slide Blur-Up Placeholder and Next-Slide Warm Summary

**Applied the site's existing HOME-09 blur-up placeholder/crossfade pattern to homepage scroll-deck slides, split slide-load priority (eager-high, eager-low, then native-lazy), and added an idempotent runtime warm that starts fetching the next gallery's photo the moment the current one arrives.**

## Performance

- **Duration:** ~3h45m across three executor sessions (16:18-20:00 on 2026-08-05); this third attempt started from a clean, verified Task 1+2 baseline and finished Task 3 plus full verification
- **Tasks:** 3/3 completed
- **Files modified:** 2 (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`)

## Accomplishments
- Every `.home-slide` now renders a stacked `.home-slide__img-placeholder` (24px blurred `blurSrc`, never deferred) plus a `.home-slide__img--sharp` layer that crossfades in on load, reusing `.home-grid__tile-img--sharp`'s exact opacity/timing values (HOME-09)
- Slide-load priority split by index: slide 0 eager + `fetchpriority="high"`, slide 1 eager + `fetchpriority="low"`, slide 2+ native-lazy with no priority hint — bounded deliberately (T-21-08-A) so eagerness never trades perceived latency for a real phone-bandwidth cost
- `warmNextSlide(index)` added to the deck driver, called exactly once per arrival from `applyArrival()`'s existing rising-edge branch (`reached && !wasRevealed`), idempotently promoting the next slide's sharp image out of native-lazy
- 10 new Playwright cases across the plan's 8 required behaviors: two-layer stack, placeholder never deferred, the eager/eager/lazy split (3 cases), crossfade to loaded state, the failure-path (all renditions but 24px aborted), the runtime warm, reduced-motion parity, and the desktop/grid regression guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Render the blur-up pair per slide, style its crossfade, and wire the load listener** - `d2d4618` (feat)
2. **Task 1 follow-up:** small CSS-comment naming fix found during review - `0271aec` (fix)
3. **Task 2: Warm the next slide's photo on arrival (D-14 rising edge)** - `9b17c24` (feat)
4. **Task 3: Cover the placeholder, the priority hints and the warm** - `0a9d11a` (test)

**Plan metadata:** this commit (docs: complete plan) — see final commit below.

## Files Created/Modified
- `src/components/HomeCarousel.astro` - Deck slide markup gains a placeholder/sharp image pair; phone-width CSS gains the `.home-slide__img--sharp` crossfade rule; the carousel script's one-time load-listener loop broadens to include deck slides; the deck driver gains `warmNextSlide()` called from the arrival rising edge
- `tests/e2e/homepage-scroll-deck.spec.ts` - New `deck-slide progressive loading (HOME-14, HOME-09, 21-UAT.md gap 3)` describe block with 10 cases

## Decisions Made
- Priority eagerness bounded to exactly two slides (index 0 high, index 1 low `fetchpriority`) rather than more — eagerly fetching every gallery's full-resolution photo would replace this gap with a worse one on a phone connection (T-21-08-A, mitigated per the plan's threat register)
- The runtime warm is called only from `applyArrival()`'s rising-edge branch, never the unguarded per-frame path — `applyArrival` runs every painted frame, so an unguarded call would re-touch the same image 60 times a second
- `clearInlineStyles()` deliberately does NOT reverse the warm — starting a photo download is not a reversible inline style, and cancelling/re-deferring an in-flight fetch on detach would be strictly worse for the visitor
- The load-listener broadening stays in the un-gated (first) carousel script rather than the phone-width driver, so a reduced-motion visitor (D-15) still receives the placeholder-to-sharp crossfade

## Deviations from Plan

**1. [Rule 1 - Bug] Named the placeholder class in the crossfade CSS comment**
- **Found during:** review pass after Task 1's initial commit
- **Issue:** The Task 1 crossfade CSS comment (HOME-09/`21-UAT.md` gap reference) didn't name the placeholder class it was extending, making the comment ambiguous when read in isolation
- **Fix:** Named `.home-slide__img-placeholder` explicitly in the comment
- **Files modified:** `src/components/HomeCarousel.astro`
- **Verification:** Visual review of the comment; no behavior change, typecheck/lint/build all still pass
- **Committed in:** `0271aec`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 - Bug, comment clarity only, no behavioral change)
**Impact on plan:** Cosmetic only. No scope creep.

## Issues Encountered
- **Provider session-limit/stall interruptions (infrastructure, not code):** Two prior executor agent sessions on this plan were terminated mid-run by provider errors unrelated to the work itself. Real progress persisted in each case (verified independently before this session began: Tasks 1 and 2 committed with typecheck/lint passing clean). This third session verified prior work, found Task 3's test file already substantially drafted in the uncommitted working tree, reviewed it against all 8 required behaviors, found it complete and correct, and proceeded straight to full verification and commit.
- **Stale port occupation from a concurrent sibling session:** Port 4321 (the default Playwright preview port) was occupied by a stale `astro preview` process from a concurrent sibling session on this shared machine (per this project's documented "concurrent sessions are the norm" convention). A temporary, untracked `playwright.debug.config.ts` pointing at port 4399 was used for all local verification runs in this worktree and deleted before this SUMMARY was written — it never touched a commit.
- **Resource-contention test flakiness during full-suite runs:** A 5-worker full-chromium run surfaced 13 failures scattered across `edition.spec.ts`, `contact.spec.ts`, and `accessibility.spec.ts` (none touching `HomeCarousel.astro` or this plan's files). A 2-worker re-run reduced this to 1-2 failures, always in `edition.spec.ts`'s gallery-masonry-grid test at line 396, which reads `naturalWidth`/`naturalHeight` off an image without waiting for it to finish loading (a pre-existing race in a test file this plan never touched, on a page — gallery detail masonry grid — this plan never touched). Confirmed via a targeted `--repeat-each=3` run (failed 2/3 times in isolation too) that this is a genuine pre-existing test-timing bug, not something this plan's changes caused. Logged here per the SCOPE BOUNDARY rule rather than fixed, since it is out of scope for HOME-14/this plan's files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `21-UAT.md` gap 3 (blur-placeholder pop-in/jank on deck slides) is closed: every slide now paints a blurred stand-in immediately, the next slide gets a real network head start, and a failed fetch never leaves a blank area.
- Plan 21-09 can proceed to add the deck's background-colour safety net (21-UAT.md gap 4) without touching any declaration this plan added.
- Plan 21-10's combined real-device UAT pass should include: (1) an unhurried scroll finding each gallery already sharp, and (2) confirmation that the pre-existing `edition.spec.ts:396` flake (see Issues Encountered) is tracked separately and not conflated with this plan's scope.
- Full e2e suite is green on both Playwright projects modulo the one documented, out-of-scope, pre-existing flake; `npm run test:coverage`, `npm run typecheck`, `npm run lint`, and `npm run test:artifact` are all clean.

---
*Phase: 21-homepage-scroll-experience*
*Completed: 2026-08-05*

## Self-Check: PASSED

All claimed files exist (`src/components/HomeCarousel.astro`, `tests/e2e/homepage-scroll-deck.spec.ts`, this SUMMARY) and all claimed commit hashes (`d2d4618`, `9b17c24`, `0271aec`, `0a9d11a`) resolve in `git log`.
