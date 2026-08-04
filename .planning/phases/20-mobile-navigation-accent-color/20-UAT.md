---
status: testing
phase: 20-mobile-navigation-accent-color
source: [20-VERIFICATION.md]
started: 2026-08-04T12:56:00Z
updated: 2026-08-04T17:15:00Z
---

## Current Test

number: 4
name: Gap-closure inter-line spacing judgement (post 20-06)
expected: |
  Open the mobile nav panel on a real phone-width viewport and judge whether the vertical gap
  between the switcher line and the Instagram line reads as a deliberate, related pair (rather
  than two arbitrarily-spaced items). The automated geometry test proves the two lines are
  stacked, centred, and within the 44-56px bottom-offset band; this check is the one remaining
  aesthetic judgement automation cannot make (per 20-06-PLAN.md Task 3 and 20-VERIFICATION.md).
awaiting: user response

## Tests

### 1. D-03 motion feel across engines
expected: Open and close the mobile nav panel on a real phone-width viewport in both Chromium and Safari/WebKit and judge whether the 220ms open/close transition reads as deliberate rather than instant in both engines, and confirm it is instant (no rotation/fade) under prefers-reduced-motion: reduce.
result: pass

### 2. Visual fidelity against the reference image
expected: Compare the open panel on a real device against 20-mobile-menu-reference.png for logo position, hamburger-to-X placement, big stacked list style, the small secondary bottom line, and the corner halftone accent. Visual layout should match the reference's intent (not pixel-identical, since the reference is a different site's mockup).
result: issue
reported: "langage switch is supposed to be at the bottom, with the same font size of the instagram. for the instagram, can you put the instagram logo instead?"
severity: major
resolved_by: "20-06 (gap-closure plan) — both defects independently confirmed closed in 20-VERIFICATION.md's 2026-08-04T17:15:00Z re-verification pass. See Gaps section below."

### 3. Visibly different accent colours across reloads
expected: Reload the homepage several times on a phone-width viewport and confirm the starting accent colour visibly differs across reloads, each drawn from the site's existing 5-value HERO_COLORS palette.
result: pass

### 4. Gap-closure inter-line spacing judgement (post 20-06)
expected: |
  Open the mobile nav panel on a real phone-width viewport and judge whether the vertical gap
  between the switcher line and the Instagram line reads as a deliberate, related pair (rather
  than two arbitrarily-spaced items). Tighten or open up the gap if it does not.
result: [pending]

## Summary

total: 4
passed: 2
issues: 1
pending: 1
skipped: 0
blocked: 0

## Gaps

- truth: "Within the full-screen menu, the language switcher renders as a big, equal-weight stacked primary item alongside Éditions/About/Contact (D-04 as originally decided)."
  status: resolved
  resolution: "Closed by gap-closure plan 20-06: <LanguageSwitcher /> moved out of .mobile-nav-panel__nav to a direct child of the dialog, restyled to 14px/400/non-Unbounded/ink in the secondary tier. Independently confirmed against the live codebase (code read + own screenshots + live test re-run) in 20-VERIFICATION.md's 2026-08-04T17:15:00Z re-verification."
  reason: "User reported (live phone test): the language switcher is supposed to be at the bottom, at the same (small) font size as the Instagram link — i.e. grouped with Instagram as a secondary element, not as a fourth big primary item. This reverses D-04's original hierarchy decision for the switcher now that it's been seen live."
  severity: major
  test: 2
  root_cause: "Not a code defect — MobileNavPanel.astro/SiteHeader.astro faithfully implement D-04 as originally decided. The user has now seen it live and wants that decision reversed for the switcher only."
  artifacts:
    - path: "src/components/MobileNavPanel.astro"
      issue: "Line 94: <LanguageSwitcher /> is the 4th child inside <nav class=\"mobile-nav-panel__nav\"> (lines 86-95), alongside the three .mobile-nav-panel__link anchors. It needs to move out of that <nav> to sit alongside the existing .mobile-nav-panel__secondary Instagram anchor (lines 96-105), which is a sibling of <nav>, not inside it."
    - path: "src/components/SiteHeader.astro"
      issue: "is:global style block, lines 767-793 (commented \"D-04 'equal weight' requirement\"): forces .mobile-nav-panel .switcher-link to Display-role typography (32px/600/Unbounded/ink) matching the primary list. This override needs to be removed or replaced so the switcher instead matches .mobile-nav-panel__secondary's styling (lines 795-816: font-sans, 14px/400/1.5, color: var(--color-ink))."
    - path: "src/components/LanguageSwitcher.astro"
      issue: "Lines 38-67: its own untouched default is 14px/400 (already Label-sized) but color: var(--color-accent) (pink, D-06) — will need a color override to ink to visually match the Instagram secondary line once the Display-size override is removed."
    - path: "tests/e2e/mobile-nav.spec.ts"
      issue: "Lines 252-303, test \"the primary list and switcher render at Display size in ink\" directly encodes the current (soon-to-be-reversed) hierarchy and will break — must be rewritten to assert Label-size/ink instead of Display-size, mirroring the existing lines 305-332 \"the secondary line renders at Label size\" test."
  missing:
    - "Move <LanguageSwitcher /> out of .mobile-nav-panel__nav to a new secondary-tier wrapper near the bottom of the panel, stacked as its own line ABOVE or BELOW the Instagram link (user-confirmed: stacked two lines, not same-row) — same small (14px/400) font size and ink color as the Instagram secondary line"
    - "Remove/replace SiteHeader.astro's Display-size CSS override for .mobile-nav-panel .switcher-link (lines 767-793) so the switcher falls back to (or is styled to match) 14px/400/ink"
    - "Update tests/e2e/mobile-nav.spec.ts's Display-size assertion (lines 252-303) to assert Label-size/ink for the switcher instead"
  debug_session: ".planning/debug/mobile-nav-switcher-hierarchy.md"
  user_decision: "Stacked, two lines (not same row) — confirmed via follow-up question during diagnosis."
- truth: "The panel's secondary Instagram element is a plain text link (`{instagramLabel}`), per D-04/20-03's SUMMARY — no icon."
  status: resolved
  resolution: "Closed by gap-closure plan 20-06: the header's Instagram SVG glyph duplicated verbatim into MobileNavPanel.astro's secondary anchor, resized 20px to 16px, currentColor-driven. Independently confirmed against the live codebase (code read + own screenshots + live test re-run) in 20-VERIFICATION.md's 2026-08-04T17:15:00Z re-verification."
  reason: "User reported (live phone test): wants the Instagram logo/icon shown instead of (or alongside) the text. The desktop SiteHeader.astro already has a reusable inline SVG Instagram glyph (rounded-square outline + circle + dot, ~SiteHeader.astro line 106-118) that MobileNavPanel.astro currently does not reuse."
  severity: major
  test: 2
  root_cause: "The Instagram SVG glyph was simply never carried over when MobileNavPanel.astro was built in Phase 20 Plan 03 — no shared icon component exists in src/components/ (SiteHeader.astro inlines its own SVG), so the mobile panel's secondary link was authored text-only."
  artifacts:
    - path: "src/components/SiteHeader.astro"
      issue: "Lines 106-118 contain the source-of-truth SVG glyph to duplicate: <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" aria-hidden=\"true\"> with a rounded-square outline (<rect rx=\"5.5\">), a circle outline, and a solid dot (<circle fill=\"currentColor\" stroke=\"none\">) — colored entirely via currentColor, so it inherits ink correctly once duplicated."
    - path: "src/components/MobileNavPanel.astro"
      issue: "Secondary Instagram link (lines 96-105) renders instagramLabel as plain text only, no icon."
  missing:
    - "Duplicate the SVG block from SiteHeader.astro (lines 106-118) into MobileNavPanel.astro's .mobile-nav-panel__secondary anchor, alongside {instagramLabel} — likely icon + label given the secondary line's small (14px) context; may need a scoped svg{width/height} rule sized smaller than the header's 20px"
    - "No existing test needs updating — confirmed no test in mobile-nav.spec.ts or site-header.spec.ts asserts the mobile panel's Instagram link is text-only/svg-free; this is a pure additive change"
  debug_session: ".planning/debug/mobile-nav-instagram-icon.md"
