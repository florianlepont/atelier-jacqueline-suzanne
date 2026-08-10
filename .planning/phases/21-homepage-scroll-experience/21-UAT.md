---
status: superseded
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-10T14:35:00Z
updated: 2026-08-10T20:30:00Z
---

## Current Test

[superseded — see note below, not executed]

## Tests

### 1. Real-device pass closing phase 21's ROUND-2 gap-closure set (round 3 — confirms all 5 round-2 gaps fixed plus assumptions A6-A9)

expected: |
  1) Exactly ONE AJS logomark on screen, centred on an ink background with a scroll-down cue, and the
     navigation hamburger visible in the header from the very first paint (gap 1 + gap 5).
  2) The hamburger actually opens the nav panel at scroll 0 (gap 5) — per A7 the header's own small
     logo is deliberately hidden while the intro is on screen, but the hamburger and language switcher
     are not.
  3) That single logomark shrinks continuously as you scroll, with the tagline arriving beneath it as
     one continuous movement — never a second logo (gap 1).
  4) The tagline stays fully visible and stationary long enough to read comfortably (gap 2, intro half).
  5) The zoom stays clean and the first gallery photo is already full-screen the instant it finishes —
     at no scroll position does the same photo appear twice, one above the other (gap 3).
  6) Each gallery's description appears as its slide settles and STAYS on screen while reading it — no
     flash-on-flash-off, and this holds at both a slow and a brisker/flicking pace (gap 2, gallery half).
  7) Scrolling back up smoothly reverses the whole sequence including the intro scrub; a fast fling does
     not skip a gallery or produce a broken frame at the zoom boundary.
  8) No white bar/edge near the status bar at the top, and no white gap near Safari's toolbar at the
     bottom, at any point including during toolbar animation (gap 4).
  9) Tapping a photo opens that gallery; the header is reachable while scrolling the slides.
  10) Nothing on the tablet/desktop homepage differs from pre-milestone behaviour.
  11) A1/A2/A3/A5 confirmed; A4 recorded superseded; A6/A7/A8/A9 each confirmed or corrected, with any
      correction recorded.
result: superseded

note: |
  Never executed. Before this round-3 pass could run, the phone-width mobile homepage was rebuilt from
  scratch outside this plan/execute cycle: `MobileHomePrototype.astro` now owns the entire phone
  experience (wordmark scale/fade -> description reveal -> contemplation beat -> horizontal photo pan
  through the series), replacing the HomeCarousel scroll-deck this checklist describes. HomeCarousel's
  scroll-deck code (all 15 phase-21 plans, rounds 1-2's fixes, the code review) remains in the codebase,
  correct and passing its own tests, but is CSS-hidden and unreachable at <=767px as of commit `6c51695`
  ("feat: refine mobile gallery journey", 2026-08-10). Every item above describes a mechanism that no
  longer renders on phone, so none of it can be meaningfully tested. See STATE.md's [Phase 21]
  Accumulated Context entry (2026-08-10) for the full reconciliation. Phase 21 was closed mechanically
  on commit 6c51695 as the authoritative final state, per explicit user direction, without re-running
  this checklist against the new implementation.

## Summary

total: 1
passed: 0
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps
