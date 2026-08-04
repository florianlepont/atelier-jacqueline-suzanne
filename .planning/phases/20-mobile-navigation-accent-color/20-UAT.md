---
status: complete
phase: 20-mobile-navigation-accent-color
source: [20-VERIFICATION.md]
started: 2026-08-04T12:56:00Z
updated: 2026-08-04T14:28:00Z
---

## Current Test

[testing complete]

## Tests

### 1. D-03 motion feel across engines
expected: Open and close the mobile nav panel on a real phone-width viewport in both Chromium and Safari/WebKit and judge whether the 220ms open/close transition reads as deliberate rather than instant in both engines, and confirm it is instant (no rotation/fade) under prefers-reduced-motion: reduce.
result: pass

### 2. Visual fidelity against the reference image
expected: Compare the open panel on a real device against 20-mobile-menu-reference.png for logo position, hamburger-to-X placement, big stacked list style, the small secondary bottom line, and the corner halftone accent. Visual layout should match the reference's intent (not pixel-identical, since the reference is a different site's mockup).
result: issue
reported: "langage switch is supposed to be at the bottom, with the same font size of the instagram. for the instagram, can you put the instagram logo instead?"
severity: major

### 3. Visibly different accent colours across reloads
expected: Reload the homepage several times on a phone-width viewport and confirm the starting accent colour visibly differs across reloads, each drawn from the site's existing 5-value HERO_COLORS palette.
result: pass

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Within the full-screen menu, the language switcher renders as a big, equal-weight stacked primary item alongside Éditions/About/Contact (D-04 as originally decided)."
  status: failed
  reason: "User reported (live phone test): the language switcher is supposed to be at the bottom, at the same (small) font size as the Instagram link — i.e. grouped with Instagram as a secondary element, not as a fourth big primary item. This reverses D-04's original hierarchy decision for the switcher now that it's been seen live."
  severity: major
  test: 2
  artifacts: []
  missing: []
- truth: "The panel's secondary Instagram element is a plain text link (`{instagramLabel}`), per D-04/20-03's SUMMARY — no icon."
  status: failed
  reason: "User reported (live phone test): wants the Instagram logo/icon shown instead of (or alongside) the text. The desktop SiteHeader.astro already has a reusable inline SVG Instagram glyph (rounded-square outline + circle + dot, ~SiteHeader.astro line 106-118) that MobileNavPanel.astro currently does not reuse."
  severity: major
  test: 2
  artifacts:
    - path: "src/components/SiteHeader.astro"
      issue: "Contains the existing Instagram SVG icon markup (lines ~106-118) that should be reused, not reinvented"
    - path: "src/components/MobileNavPanel.astro"
      issue: "Secondary Instagram link (lines ~96-105) renders instagramLabel as plain text only, no icon"
  missing:
    - "Add the existing Instagram SVG icon to MobileNavPanel.astro's secondary link"
