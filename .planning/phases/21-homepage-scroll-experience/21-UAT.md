---
status: testing
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-08T14:20:00Z
updated: 2026-08-08T14:20:00Z
---

## Current Test

number: 1
name: Real-device pass closing phase 21's gap-closure set (round 2 — confirms all 4 original gaps fixed)
expected: |
  1) The first thing on screen is the centred AJS logomark with a scroll-down cue, on an ink background — no header chrome, no wordmark, no photo.
  2) The site's intro tagline appears beneath the logomark, with the logomark appearing to stay exactly where it was.
  3) The zoom-to-first-slide handoff is clean: no frame shows two different crops of the same photo overlapping, and the header, accent band and title all appear together once the zoom lands.
  4) Each gallery photo is already sharp by the time its slide settles at a normal unhurried pace — no prolonged grainy/blurry stretch.
  5) Scrolling back up smoothly reverses the whole sequence, including both intro beats.
  6) A fast fling does not skip a gallery, and does not produce a broken-looking frame at the zoom boundary.
  7) No white bar ever appears near the status bar/time row, at any point, including during Safari's toolbar animation.
  8) Tapping a photo opens that gallery.
  9) The header is reachable while scrolling the slides.
  10) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone.
  11) Assumptions A1 through A5 (21-10-PLAN.md) are each either confirmed or corrected, with any correction recorded.
awaiting: user response

## Tests

### 1. Real-device pass closing phase 21's gap-closure set (round 2 — confirms all 4 original gaps fixed)

**Test:** Run `npm run build && npm run preview -- --host`, then open the printed local-network URL on a REAL iPhone (not a desktop browser at a phone width). On the device: (1) load the homepage fresh and look at it before scrolling at all; (2) scroll down one screen, slowly; (3) keep scrolling slowly through the whole wordmark zoom, watching the exact moment the zoom finishes and the first gallery photo takes over; (4) continue slowly through every gallery slide to the bottom, watching each photo as its slide arrives; (5) scroll back up through everything, to the very top; (6) fling-scroll quickly down through the slides, then quickly back up; (7) watch the very top of the screen (status bar/time row) throughout every step, including while Safari's toolbar collapses and expands; (8) tap a gallery photo; (9) reach for the header while mid-way through the slides; (10) open the same build on a tablet and a desktop browser and compare against pre-milestone behaviour. Then confirm or correct each of assumptions A1 through A5 (21-10-PLAN.md) by name.

expected: All 11 points above — the new two-beat intro reads correctly, the zoom-to-slide handoff is clean (no overlapping-crop frame), photos are sharp on arrival at a normal pace, no white status-bar strip ever appears, scrolling fully reverses, tapping/header-reachability/tablet-desktop-parity all hold, and A1-A5 are confirmed or corrected.

**Why human:** All four original defects (handoff glitch, blur pop-in, white status-bar strip, missing intro) were real-device-only — Playwright's `webkit-mobile` project runs desktop WebKit behind an emulated viewport, with no real touch-momentum physics, scroll-snap-settle feel, or toolbar-collapse animation. The gap-closure plans (21-07 through 21-10) each added extensive automated mechanism-level coverage (all re-confirmed passing in this verification pass), but only a real phone can confirm the visitor-facing result.

result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
