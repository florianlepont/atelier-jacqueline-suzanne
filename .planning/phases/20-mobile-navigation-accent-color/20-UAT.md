---
status: testing
phase: 20-mobile-navigation-accent-color
source: [20-VERIFICATION.md]
started: 2026-08-04T12:56:00Z
updated: 2026-08-04T12:56:00Z
---

## Current Test

number: 1
name: D-03 motion feel across engines
expected: |
  The panel fades/slides in and the hamburger morphs to an X at matching timing in both Chromium and Safari/WebKit; under prefers-reduced-motion: reduce it opens/closes instantly with no animation.
awaiting: user response

## Tests

### 1. D-03 motion feel across engines
expected: Open and close the mobile nav panel on a real phone-width viewport in both Chromium and Safari/WebKit and judge whether the 220ms open/close transition reads as deliberate rather than instant in both engines, and confirm it is instant (no rotation/fade) under prefers-reduced-motion: reduce.
result: [pending]

### 2. Visual fidelity against the reference image
expected: Compare the open panel on a real device against 20-mobile-menu-reference.png for logo position, hamburger-to-X placement, big stacked list style, the small secondary bottom line, and the corner halftone accent. Visual layout should match the reference's intent (not pixel-identical, since the reference is a different site's mockup).
result: [pending]

### 3. Visibly different accent colours across reloads
expected: Reload the homepage several times on a phone-width viewport and confirm the starting accent colour visibly differs across reloads, each drawn from the site's existing 5-value HERO_COLORS palette.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
