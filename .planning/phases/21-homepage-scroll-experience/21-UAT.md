---
status: testing
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-10T14:35:00Z
updated: 2026-08-10T14:35:00Z
---

## Current Test

number: 1
name: Real-device pass closing phase 21's ROUND-2 gap-closure set (round 3 — confirms all 5 round-2 gaps fixed plus assumptions A6-A9)
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
awaiting: user response

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
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
