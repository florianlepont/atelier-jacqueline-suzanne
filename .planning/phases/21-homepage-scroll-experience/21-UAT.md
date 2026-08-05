---
status: testing
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-05T06:58:00Z
updated: 2026-08-05T06:58:00Z
---

## Current Test

number: 1
name: Real-device pass closing phase 21 (required by 21-VALIDATION.md before /gsd-verify-work)
expected: |
  1) The wordmark genuinely fills the screen on arrival, no header/title/description visible.
  2) Scrolling down reads as flying into the letterforms at a cinematic (unhurried) pace, focused on the leading letter, landing on the first gallery's photo filling the screen.
  3) Scrolling back up smoothly reverses the whole effect.
  4) The header fades in once the zoom completes and stays reachable while scrolling the slides.
  5) Slides settle one gallery at a time; a fast fling does not skip a gallery.
  6) Each description appears only once its slide has settled, and the accent band colour changes with the gallery.
  7) Tapping a photo opens that gallery.
  8) Scrolling past the last gallery reaches the site footer.
  9) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone.
awaiting: user response

## Tests

### 1. Real-device pass closing phase 21 (required by 21-VALIDATION.md before /gsd-verify-work)

**Test:** Run `npm run build && npm run preview -- --host`, open the printed local-network URL on a REAL phone (not an emulated viewport). On the device: (1) load the homepage fresh and look at it before scrolling; (2) scroll down slowly through the whole zoom, then through every gallery slide to the bottom; (3) scroll back up through the zoom to the top; (4) fling-scroll quickly through the slides; (5) tap a gallery photo; (6) reach for the header while mid-way through the slides. Then open the same build on a tablet and a desktop browser and compare against pre-milestone behaviour.

expected: 1) The wordmark genuinely fills the screen on arrival, no header/title/description visible. 2) Scrolling down reads as flying into the letterforms at a cinematic (unhurried) pace, focused on the leading letter, landing on the first gallery's photo filling the screen. 3) Scrolling back up smoothly reverses the whole effect. 4) The header fades in once the zoom completes and stays reachable while scrolling the slides. 5) Slides settle one gallery at a time; a fast fling does not skip a gallery. 6) Each description appears only once its slide has settled, and the accent band colour changes with the gallery. 7) Tapping a photo opens that gallery. 8) Scrolling past the last gallery reaches the site footer. 9) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone.

**Why human:** Playwright's `webkit-mobile` project runs the desktop WebKit engine behind an emulated iPhone viewport — not real Mobile Safari, and has historically lagged on newer scroll APIs (scroll-snap settle feel, scroll-linked rAF pacing). It validates logic and catches structural regressions, but cannot validate the pace/anchor/settle FEEL under a real finger on real iOS — exactly the quality this phase's own sketch process (sketch 015) required a real-phone pass to sign off originally.

result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
