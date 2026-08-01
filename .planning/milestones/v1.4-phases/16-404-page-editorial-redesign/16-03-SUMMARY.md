---
phase: 16-404-page-editorial-redesign
plan: 03
subsystem: ui
tags: [404, error-page, pointer-events, raf, prefers-reduced-motion, accessibility, wcag, wcag-override]

# Dependency graph
requires:
  - phase: 16-404-page-editorial-redesign (plan 01)
    provides: "src/lib/pop-rate.ts: pure proximityToInterval(proximity) plus MIN_INTERVAL_MS/MAX_INTERVAL_MS/DRIFT_INTERVAL_MS constants"
  - phase: 16-404-page-editorial-redesign (plan 02)
    provides: "Static 404 shell DOM/class contract (.not-found container, .pop-photo/.pop-photo.is-active background images)"
provides:
  - "Client-side pointer/touch-proximity pop-rate engine appended to src/pages/404.astro (rAF accumulator, idle-reset handlers, prefers-reduced-motion drift branch)"
  - "Reduced-motion e2e case in tests/e2e/not-found.spec.ts proving the drift is alive-not-frozen and pointer-independent"
  - "D-10 cap override: MIN_INTERVAL_MS raised from 350ms (~2.86/sec) to 150ms (~6.7/sec) per an explicit, knowing user decision at this plan's human-verify checkpoint, reconciled back into plan 16-01's PLAN/SUMMARY docs"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plain module <script> page-level engine (no client:* directive) mirroring DetailHero.astro's matchMedia + setup()/teardown() wiring shape, with the branch bodies deliberately inverted (drift, not freeze, per D-11)"
    - "Single unified pointermove listener (Pointer Events) drives proximity for both mouse and touch, with explicit pointerleave/pointerup/pointercancel/blur idle-reset handlers"
    - "rAF accumulator recomputing the target interval every frame from the imported proximityToInterval curve -- no local interval-floor literal anywhere in 404.astro"

key-files:
  created: []
  modified:
    - src/pages/404.astro
    - tests/e2e/not-found.spec.ts
    - src/lib/pop-rate.ts
    - tests/unit/pop-rate.test.ts
    - .planning/phases/16-404-page-editorial-redesign/16-01-PLAN.md
    - .planning/phases/16-404-page-editorial-redesign/16-01-SUMMARY.md

key-decisions:
  - "Pointer Events (single pointermove listener) used for both mouse and touch, per RESEARCH Open Question 1 -- satisfies D-09's intent (touch position drives the same curve) without duplicating mouse/touch listener logic"
  - "A local non-null const (containerEl) captures the narrowed .not-found element for closures, mirroring DetailHero.astro's own narrowing workaround (there done via `!` assertions) instead of relying on TS narrowing surviving across nested function boundaries"
  - "Dev-only console.assert regression guard added (import.meta.env.DEV gated) confirming proximityToInterval's own output stays within the imported MIN/MAX bounds -- not a second D-10 enforcement point, purely a defensive dev-time check"
  - "D-10 OVERRIDE (2026-07-29, live at this plan's human-verify checkpoint): the user tested the original ~2.86/sec-capped build and explicitly asked for it to go faster, knowingly accepting the WCAG 2.3.1 flash-rate tradeoff (\"tant pis pour les flash effect\"). Presented with the risk and three options (keep WCAG-safe cap / raise significantly with a finite ceiling / remove the cap entirely), the user chose to raise the cap: MIN_INTERVAL_MS 350ms -> 150ms (~6.7/sec at dead-center). MAX_INTERVAL_MS/DRIFT_INTERVAL_MS unchanged. Recorded in 16-CONTEXT.md (commit 4049bdb) and reconciled into plan 16-01's PLAN.md/SUMMARY.md as a dated post-completion amendment, mirroring this project's Phase 6 06-01-SUMMARY.md precedent for live post-checkpoint follow-ons."

patterns-established:
  - "prefers-reduced-motion branches on this site can deliberately diverge from the freeze-to-settled-state convention when the user explicitly confirms a different behavior is wanted (D-11 drift, not freeze) -- a documented, not accidental, divergence"
  - "A checkpoint-time WCAG/accessibility tradeoff can be knowingly accepted by the user and reconciled back into an already-completed prior plan's documentation via a dated addendum, rather than silently drifting out of sync with the shipped code"

requirements-completed: [ERR-01]

coverage:
  - id: D1
    description: "Pointer/touch-proximity-driven pop-rate engine hard-cuts the .pop-photo pool faster near screen center and slower near the edges, clamped by the imported proximityToInterval floor (originally ~2.86/sec, raised to ~6.7/sec by an explicit, knowing user override at the checkpoint), and resets to idle when the pointer leaves the window/a touch lifts/the tab loses focus"
    requirement: "ERR-01"
    verification:
      - kind: unit
        ref: "tests/unit/pop-rate.test.ts (9 cases, incl. the hard-floor invariant across all inputs, re-verified post D-10 override)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/not-found.spec.ts#an unknown URL serves the bilingual noindex 404 page"
        status: pass
    human_judgment: true
    rationale: "Subjective feel, cap legibility, and pointer-leave slowdown are the VALIDATION.md manual-only verifications -- confirmed live via this plan's human-verify checkpoint (approved, including a re-verification pass after the D-10 cap override)."
  - id: D2
    description: "prefers-reduced-motion branch ignores the pointer entirely and drifts the .pop-photo pool on a fixed DRIFT_INTERVAL_MS (~4s) cadence, re-branching live on an OS-level toggle with no leaked timers/listeners"
    requirement: "ERR-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/not-found.spec.ts#under reduced motion the pool drifts slowly and ignores pointer position"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-10 cap override: MIN_INTERVAL_MS raised from 350ms to 150ms per an explicit, informed user decision at the human-verify checkpoint -- a knowing departure from WCAG 2.3.1 general-flash guidance for this one page, not an oversight"
    requirement: "ERR-01"
    verification:
      - kind: unit
        ref: "tests/unit/pop-rate.test.ts#pop-rate constants (hard-floor-exists invariant, re-authored to drop the now-superseded <3/sec assertion)"
        status: pass
    human_judgment: true
    rationale: "Accepting a photosensitive-flash-rate risk tradeoff is an accessibility/product decision only the user can make -- confirmed live at the checkpoint after being presented with the risk and alternatives."

duration: ~20min (active work across two human-verify checkpoint round-trips; checkpoint wait time excluded)
completed: 2026-07-29
status: complete
---

# Phase 16 Plan 03: Interactive Pop-Rate Engine + Reduced-Motion Drift Summary

**Pointer/touch-proximity-driven pop-rate engine layered onto the static 404 shell, hard-capped at a finite floor that the user explicitly raised live at the checkpoint from ~2.86/sec to ~6.7/sec (a knowing WCAG 2.3.1 tradeoff), with a reduced-motion branch that deliberately drifts instead of freezing.**

## Performance

- **Duration:** ~20 min active work (across two human-verify checkpoint round-trips)
- **Tasks:** 2 automated tasks + 1 human-verify checkpoint (re-verified once after a live cap override)
- **Files modified:** 6 (2 for the engine/test this plan owns, 4 more reconciling the D-10 override back into plan 16-01's docs and code)

## Accomplishments
- Appended a plain module `<script>` to `src/pages/404.astro` implementing the full pop-rate engine: a single unified `pointermove` listener (Pointer Events, covering mouse/touch/pen) computes proximity-to-center; an rAF accumulator recomputes the target interval every frame from the imported `proximityToInterval` curve and hard-cuts `.pop-photo.is-active` via class toggle only (no opacity/transition writes); `pointerleave`/`pointerup`/`pointercancel`/`blur` reset proximity to idle so the rate visibly slows back down instead of sticking at max speed
- Implemented the `prefers-reduced-motion` branch (D-11, deliberately inverted from this site's usual freeze convention): pointer ignored entirely, photos drift on a fixed `DRIFT_INTERVAL_MS` cadence, with live OS-toggle re-branching via `matchMedia('...').addEventListener('change', setup)` and idempotent teardown-then-setup (no leaked rAF/interval/listeners)
- Added a reduced-motion Playwright case using `page.emulateMedia({ reducedMotion: 'reduce' })` with a `MutationObserver`-based swap counter proving the drift is alive (>=1 swap in a 5s window) but bounded (<=3 swaps, ruling out the fast pointer-driven rate), and that moving the pointer to dead-center does not accelerate it
- **Live checkpoint override (D-10):** after visually confirming the original ~2.86/sec-capped build, the user asked for a faster feel and explicitly accepted the WCAG 2.3.1 flash-rate tradeoff. Raised `MIN_INTERVAL_MS` from 350ms to 150ms (~6.7/sec at dead-center) in `src/lib/pop-rate.ts`, updated `tests/unit/pop-rate.test.ts`'s now-superseded WCAG-framed assertion, rebuilt, and re-verified via a second checkpoint pass — approved at the new rate
- Reconciled the override back into plan 16-01's already-merged documentation (`16-01-PLAN.md` must_haves amendment, `16-01-SUMMARY.md` dated addendum) so the historical record doesn't silently drift out of sync with the shipped code, mirroring this project's own Phase 6 precedent for live post-checkpoint follow-ons

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement the pointer/touch pop-rate engine + reduced-motion drift** - `5639539` (feat)
2. **Task 2: Add the reduced-motion e2e case and run the full gate** - `8347dea` (test)
3. **D-10 override: raise pop-rate cap to ~6.7/sec (code + unit test)** - `0707207` (fix)
4. **D-10 override: reconcile plan/summary text across 16-01 and 16-03** - `181f7c2` (docs)

**Plan metadata:** committed together with this SUMMARY (see final commit below)

## Files Created/Modified
- `src/pages/404.astro` - Appended the client `<script>` pop-rate engine: pointer proximity sampler, rAF accumulator, idle-reset handlers, prefers-reduced-motion branch wiring
- `tests/e2e/not-found.spec.ts` - Added the reduced-motion drift/pointer-independence e2e case (MutationObserver swap counter)
- `src/lib/pop-rate.ts` - `MIN_INTERVAL_MS` raised from 350 to 150 per the D-10 override; doc comments updated to record the override and its rationale
- `tests/unit/pop-rate.test.ts` - Replaced the now-false `1000/MIN_INTERVAL_MS < 3` assertion with the invariant that still holds (hard floor exists, never violated for any input); recomputed the `proximity=0.5` exact-midpoint expectation from 1275 to 1175
- `.planning/phases/16-404-page-editorial-redesign/16-01-PLAN.md` - Amended the `must_haves.truths` bullet that hardcoded the superseded `<3/sec` framing
- `.planning/phases/16-404-page-editorial-redesign/16-01-SUMMARY.md` - Appended a dated post-completion addendum documenting the override in full

## Decisions Made
- Pointer Events (`pointermove`) unify mouse/touch/pen into a single listener rather than separate `mousemove`/`touchmove` handlers, per RESEARCH's Open Question 1 recommendation — satisfies D-09's behavioral intent without duplicated/desyncable logic
- A local non-null `containerEl` const captures the narrowed `.not-found` element for all nested closures (mirrors `DetailHero.astro`'s own narrowing workaround, there done via `!` assertions, here via a typed local)
- A dev-only (`import.meta.env.DEV`-gated) `console.assert` regression guard was added, confirming `proximityToInterval`'s output stays within the imported `MIN_INTERVAL_MS`/`MAX_INTERVAL_MS` bounds — not a second enforcement point, just a cheap defensive check that also gives real, non-decorative meaning to importing all four `pop-rate.ts` symbols as the plan required
- **D-10 cap override** (see key-decisions in frontmatter for full detail): `MIN_INTERVAL_MS` 350ms → 150ms, a knowing, user-confirmed departure from WCAG 2.3.1 general-flash guidance for this one page. Do not revert this without the user explicitly raising the cap again.

## Deviations from Plan

### User-Directed Mid-Plan Change (not a Rule 1-4 auto-fix)

**1. D-10 accessibility cap raised from ~2.86/sec to ~6.7/sec, live at the human-verify checkpoint**
- **Found during:** Task 3 (human-verify checkpoint), first pass
- **What happened:** The plan as written locked `MIN_INTERVAL_MS = 350` (via plan 16-01) as a WCAG-adjacent photosensitive-safety ceiling, explicitly load-bearing per `16-CONTEXT.md` D-10. At the checkpoint, the user tested the live build and asked for it to go faster, explicitly accepting the flash-rate risk. This is not a Rule 1-4 auto-fixable deviation (it's Rule 4 territory — an architectural/product-safety tradeoff) — it went through the coordinator, who presented the risk and three concrete options, and the user made an informed choice.
- **Change:** `src/lib/pop-rate.ts`'s `MIN_INTERVAL_MS` constant raised from 350 to 150; `tests/unit/pop-rate.test.ts` updated to match (dropped the now-false WCAG-threshold assertion, kept the "hard floor exists" invariant, recomputed the affected exact-value test).
- **Files modified:** `src/lib/pop-rate.ts`, `tests/unit/pop-rate.test.ts`, plus `.planning/phases/16-404-page-editorial-redesign/16-CONTEXT.md` (D-10 override entry, committed separately as `4049bdb` before this plan resumed), `16-01-PLAN.md`, `16-01-SUMMARY.md`, `16-03-PLAN.md` (all reconciled to reflect the new value and the accepted-risk framing).
- **Verification:** `npx vitest run tests/unit/pop-rate.test.ts` (9/9), `npm run typecheck`, `npm run build`, `npx playwright test not-found` (both cases) all green with the new constant; re-verified live via a second human-verify checkpoint pass at the new ~6.7/sec rate — approved.
- **Committed in:** `0707207` (code+test), `181f7c2` (docs)

---

**Total deviations:** 1 (user-directed accessibility-cap change, not an auto-fix)
**Impact on plan:** The engine mechanism, DOM contract, and reduced-motion behavior are unchanged from the original plan — only the numeric cap constant changed, and it changed via an explicit, informed, checkpoint-time user decision rather than an implementation shortcut. No scope creep beyond reconciling the already-merged plan 16-01's documentation so it doesn't silently contradict the shipped code.

## Issues Encountered

None beyond the D-10 override handled above. The pre-existing, unrelated `/about/` mobile-header overflow regression (logged in `deferred-items.md` during Wave 1) reappeared in this plan's `npm run test:e2e` full-gate run — confirmed still out of scope for Phase 16 (touches `SiteHeader.astro`/`AboutPageBody.astro`, neither modified by any plan in this phase) and not re-fixed here.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 16 (404 Page Editorial Redesign) is now complete: all three plans (16-01 pop-rate math, 16-02 static shell, 16-03 interactive engine) shipped, and the one live mid-flight change (D-10 cap override) is fully reconciled across code, tests, and documentation — no silent drift between what's recorded and what's deployed.
- The pre-existing `/about/` mobile-header overflow regression from Phase 15 remains open and out of scope — recommend a follow-up quick task or bug-fix phase (see `.planning/phases/16-404-page-editorial-redesign/deferred-items.md`).
- No blockers for milestone v1.4 completion.

---
*Phase: 16-404-page-editorial-redesign*
*Completed: 2026-07-29*

## Self-Check: PASSED
- FOUND: src/pages/404.astro
- FOUND: tests/e2e/not-found.spec.ts
- FOUND: src/lib/pop-rate.ts
- FOUND: tests/unit/pop-rate.test.ts
- FOUND: .planning/phases/16-404-page-editorial-redesign/16-01-PLAN.md
- FOUND: .planning/phases/16-404-page-editorial-redesign/16-01-SUMMARY.md
- FOUND: commit 5639539 (feat(16-03): pointer-driven capped pop-rate engine + reduced-motion drift)
- FOUND: commit 8347dea (test(16-03): assert reduced-motion drift is slow and pointer-independent)
- FOUND: commit 0707207 (fix(16-01): raise pop-rate cap to ~6.7/sec per live checkpoint override (D-10))
- FOUND: commit 181f7c2 (docs(16): reconcile D-10 cap override across plan/summary text)
