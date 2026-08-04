---
status: resolved
trigger: "mobile-nav-instagram-icon: The mobile nav panel's secondary Instagram link renders as plain text only; user wants the Instagram logo/icon shown."
created: 2026-08-04T12:47:50Z
updated: 2026-08-04T17:15:00Z
---

## Current Focus

hypothesis: CONFIRMED — MobileNavPanel.astro's secondary Instagram anchor (lines 96-105) renders only `{instagramLabel}` text with no icon markup, while SiteHeader.astro's desktop Instagram anchor (lines 99-120) already contains a reusable inline SVG Instagram glyph that was never ported over when MobileNavPanel.astro was built as a separate .astro file in Phase 20 Plan 03.
test: Read both files completely; confirmed via direct source inspection (not inference).
expecting: N/A — root cause confirmed, goal is find_root_cause_only, stopping here per mode flag.
next_action: Return ROOT CAUSE FOUND to caller. No fix_and_verify (goal: find_root_cause_only).

## Symptoms

expected: The panel's secondary Instagram element could reasonably include a recognizable Instagram icon, consistent with how Instagram is represented elsewhere on this site (desktop header).
actual: User reported (live phone test): wants the Instagram logo/icon shown instead of (or alongside) the text label in the mobile nav panel.
errors: None reported
reproduction: Open the mobile nav panel (dialog#mobile-nav) at a phone-width viewport on the homepage and look at the bottom secondary Instagram element — it currently shows only {instagramLabel} as text, no icon.
started: Discovered during UAT (Test 2 of .planning/phases/20-mobile-navigation-accent-color/20-UAT.md), live on-phone testing after phase 20 was fully implemented and merged.

## Eliminated

(none — root cause confirmed on first hypothesis; matches the caller-supplied context exactly)

## Evidence

- timestamp: 2026-08-04T12:47:50Z
  checked: src/components/MobileNavPanel.astro lines 96-105 (secondary Instagram anchor)
  found: |
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="mobile-nav-panel__secondary"
      aria-label={`Instagram ${instagramLabel}`}
    >
      {instagramLabel}
      <span class="sr-only">{instagramNewTabHint}</span>
    </a>
    No SVG, no icon element — only the text node {instagramLabel} plus a visually-hidden sr-only span for the new-tab hint.
  implication: Confirms the reported symptom exactly — the mobile panel's secondary Instagram link is text-only.

- timestamp: 2026-08-04T12:47:50Z
  checked: src/components/SiteHeader.astro lines 99-120 (desktop nav Instagram anchor, used site-wide on every non-mobile-nav page)
  found: |
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="nav-link"
      aria-label={`Instagram ${instagramLabel}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.6" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
      <span class="sr-only">{instagramNewTabHint}</span>
    </a>
    This is the exact reusable glyph: a 20x20 viewBox="0 0 24 24" outline icon built from three primitives — a rounded-square outline (rect x=2.5 y=2.5 width=19 height=19 rx=5.5, stroke=currentColor, no fill), a circle outline (cx=12 cy=12 r=4.6, stroke=currentColor, no fill), and a small solid dot (circle cx=17.4 cy=6.6 r=1.1, fill=currentColor, stroke=none). Uses stroke-width 1.8 and aria-hidden="true" (decorative — the anchor's own aria-label carries the accessible name). Colored via `currentColor`/`color: inherit`, consistent with `.nav-link`'s inherited color pattern documented in the surrounding CSS (D-01/D-13).
  implication: This is the exact markup the mobile panel should reuse for visual consistency. It is entirely self-contained (no external asset, no sprite reference) and already keyed to `currentColor`, so dropping it into MobileNavPanel.astro's ink-colored (`--color-ink`) secondary link would render correctly with no extra color wiring.

- timestamp: 2026-08-04T12:47:50Z
  checked: |
    Whether MobileNavPanel.astro can import/reuse SiteHeader.astro's SVG directly (shared icon component check). MobileNavPanel.astro's own imports (only `LanguageSwitcher.astro`) and SiteHeader.astro's imports (`LanguageSwitcher.astro`, `MobileNavPanel.astro`). Searched repo for any shared Instagram/icon component.
  found: |
    No shared icon component exists anywhere in src/components/ — grepped for "InstagramIcon" and similar; none found. The SVG glyph is defined inline, directly inside SiteHeader.astro's JSX-like template, not extracted to its own .astro/component file. MobileNavPanel.astro and SiteHeader.astro are two separate, independently-rendered .astro files (MobileNavPanel is rendered as a sibling of <header>, per its own header comment, precisely to avoid nesting inside SiteHeader's <header> element for structural-identity test reasons).
  implication: There is no existing shared component to import — the fix must duplicate the SVG markup inline inside MobileNavPanel.astro's secondary anchor (matching the project's existing pattern of inlining this same icon per-component rather than extracting a shared Icon component). This is a deliberate, minimal duplication consistent with how the codebase already works, not a refactor gap that needs fixing first.

- timestamp: 2026-08-04T12:47:50Z
  checked: |
    tests/e2e/mobile-nav.spec.ts and tests/e2e/site-header.spec.ts for any assertion that depends on the CURRENT text-only rendering of `.mobile-nav-panel__secondary` (child-node count, innerText/textContent equality, absence-of-svg assertion) that would need updating once an icon is added.
  found: |
    mobile-nav.spec.ts's only assertions against `.mobile-nav-panel__secondary` are: toHaveCount(1), toHaveAttribute('href', INSTAGRAM_URL), toHaveAttribute('target', '_blank'), rel contains 'noopener'/'noreferrer' (lines 225-231); toBeVisible() during open-panel behavior test (line 406); getComputedStyle font-size/font-weight/margin-bottom checks (lines 305-332, unaffected by adding a child SVG since those are container styles, not text-metrics); and an href cross-check against the header's Instagram href (line 646-648). None of these read innerText/textContent, count child nodes, or assert the absence of an <svg> inside `.mobile-nav-panel__secondary`.
    site-header.spec.ts's Instagram-related assertions (lines 16-43, "the header Instagram link exposes an accessible name... and renders an inline svg") are scoped to `header a[href=...]` / `[data-role="site-header"]` only — they check for exactly one <svg> INSIDE THE HEADER's own Instagram link, not the mobile panel's. homepage-chrome-nav.spec.ts's parallel "Instagram nav link (HOME-04)" describe block is likewise scoped to `.site-nav`/`header`.
    No spec anywhere asserts `.mobile-nav-panel__secondary` is svg-free or text-only.
  implication: Adding the SVG icon to MobileNavPanel.astro's secondary link is a pure additive change with respect to the existing e2e test suite — no existing test needs to be updated or would break. This removes any test-update blast-radius concern from the fix.

## Resolution

root_cause: |
  MobileNavPanel.astro's secondary Instagram link (`.mobile-nav-panel__secondary`, lines 96-105) was built in Phase 20 Plan 03 as a plain-text link (`{instagramLabel}` + an `sr-only` new-tab hint span), with no icon markup — a straightforward omission, not a logic bug. SiteHeader.astro already contains, and has for longer, a fully self-contained, `currentColor`-based inline SVG Instagram glyph (20x20, viewBox 0 0 24 24: rounded-square outline `rect` rx=5.5, outline `circle` r=4.6, solid dot `circle` r=1.1, stroke-width 1.8, `aria-hidden="true"`) used on every non-mobile-nav page via `.nav-link`. Because MobileNavPanel.astro and SiteHeader.astro are two independent .astro files with no shared icon component in the codebase, this glyph was never carried over when the mobile panel's secondary link was authored — it needs to be duplicated inline into MobileNavPanel.astro, matching the codebase's existing per-component-inline-SVG convention (there is no Icon.astro or similar to import instead).
fix: (not applied — goal: find_root_cause_only)
verification: (not applicable — goal: find_root_cause_only)
files_changed: []
