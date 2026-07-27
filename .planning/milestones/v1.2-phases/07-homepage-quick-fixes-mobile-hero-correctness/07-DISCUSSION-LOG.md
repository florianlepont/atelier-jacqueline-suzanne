# Phase 7: Homepage Quick Fixes & Mobile Hero Correctness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 07-homepage-quick-fixes-mobile-hero-correctness
**Areas discussed:** Instagram icon (HOME-04), Toggle square border (HOME-05), Mobile hero regression (HOME-06)

---

## Instagram icon (HOME-04)

### What glyph should the Instagram icon use?

| Option | Description | Selected |
|--------|-------------|----------|
| Standard Instagram glyph | Widely-recognized rounded-square camera outline, simplified inline SVG, currentColor, matching the toggle icon's approach | ✓ |
| Custom brutalist glyph | Geometric reinterpretation matching the toggle's blocky grid language — more consistent, less recognizable | |
| Simple "@" or camera silhouette | Minimal placeholder, less recognizable | |

**User's choice:** Standard Instagram glyph.

### Where should the Instagram icon sit in the header nav order?

| Option | Description | Selected |
|--------|-------------|----------|
| After Contact, before the toggle | Logo — About — Contact — Instagram — [toggle] — FR\|EN, grouped with nav links | ✓ |
| After the mode toggle, before FR\|EN | Reads as last "utility" icon, closest to the switcher | |
| Right after the logo, before About/Contact | Primary billing as brand/social signal | |

**User's choice:** After Contact, before the toggle.

### How should the Instagram icon fit the tight mobile header row?

| Option | Description | Selected |
|--------|-------------|----------|
| Icon-only, same row, re-measure fit | Keep in the single-row flex layout, adjust gaps/padding live | ✓ |
| Allow wrap to a second row on narrow phones | Rely on existing flex-wrap safety net | |
| Move Instagram out of the main row on mobile | New mobile-only secondary-spot pattern | |

**User's choice:** Icon-only, same row, re-measure fit.
**Notes:** Original 04.3 mobile-fit measurement (346px used of 361px available at 393px width) predates this 5th nav item — will need re-measuring.

### Should the Instagram icon get a visible bordered box like the toggle, or sit bare like About/Contact?

| Option | Description | Selected |
|--------|-------------|----------|
| Bare icon, no box | Matches About/Contact's plain-text treatment | ✓ |
| Same bordered box as the toggle | Consistent "icon button" language across the header | |

**User's choice:** Bare icon, no box.

---

## Toggle square border (HOME-05)

### What does "square border" mean for the toggle button — what's wrong today?

| Option | Description | Selected |
|--------|-------------|----------|
| Bounding box isn't square | No explicit width/height; box shape follows the 20x14 icon + padding | ✓ |
| Corner radius reads as rounded | Possible inherited browser default border-radius | |
| Both | Fix both potential issues defensively | |

**User's choice:** Bounding box isn't square.

### How should the square box be achieved?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep icon at 20x14, square the button box | Preserves the intentional 2x3 carousel/grid glyph proportions | ✓ |
| Resize the icon to fit a square | Risks distorting the glyph's intentional proportions | |

**User's choice:** Keep icon at 20x14, square the button box.

### What should the toggle's square size be based on?

| Option | Description | Selected |
|--------|-------------|----------|
| 44px tap-target floor | Visible box itself meets WCAG 2.5.5 by construction | |
| Tighter, icon-hugging square | ~28-32px visible box, more compact | ✓ |

**User's choice:** Tighter, icon-hugging square.
**Notes:** Must still clear the 44px WCAG 2.5.5 tap-target floor via an explicit min-height/min-width override on top of the smaller visible box — same pattern as LanguageSwitcher.astro's `.switcher-link`.

---

## Mobile hero regression (HOME-06)

### How should Claude approach root-causing the mobile hero regression?

| Option | Description | Selected |
|--------|-------------|----------|
| Investigate view-transitions first | Test with view-transition wrapping/naming disabled on mobile first | ✓ |
| Re-verify the 100svh fix from scratch | Don't assume the view-transition hypothesis | |
| Claude's discretion | Let Claude choose once reproducing the bug | |

**User's choice:** Investigate view-transitions first.
**Notes:** Quick task 260713-jfz added `view-transition-name` to `.home-hero__photo` after Phase 6's 100svh fix was last verified working on a real device; jfz's own checkpoint was desktop-only.

### How should the mobile hero fix be verified before this phase is considered done?

| Option | Description | Selected |
|--------|-------------|----------|
| Live checkpoint on your actual iPhone 17 Pro | Most reliable, matches Phase 6's approach | |
| Playwright mobile-viewport emulation only | Automated, faster, no live checkpoint | ✓ |
| Both — emulation first, then a live confirm | Highest confidence, more overhead | |

**User's choice:** Playwright mobile-viewport emulation only.
**Notes:** Accepted the noted risk that this exact bug class (100vh vs 100svh Safari chrome behavior) already fooled devtools-only testing once before, per Phase 6's history.

### If the view-transition hypothesis is confirmed, how should it be resolved?

| Option | Description | Selected |
|--------|-------------|----------|
| Fix the interaction, keep transitions everywhere | Preserves the morph animation on mobile, no feature loss | ✓ |
| Disable view-transitions on mobile only | Simpler but removes a shipped, user-approved feature | |
| Claude's discretion, if root cause confirms this hypothesis | Choose based on actual risk/complexity found | |

**User's choice:** Fix the interaction, keep transitions everywhere.

---

## Claude's Discretion

- Exact SVG path data for the Instagram glyph, as long as it's recognizable at header-icon size.
- Exact gap/padding adjustments to fit the Instagram icon into the mobile header row — re-measure live.
- Exact pixel value for the toggle's tight square box, as long as it's visually square and the tappable area clears 44px.
- Exact CSS mechanism for fixing the view-transition/mobile-hero interaction, once root-caused.

## Deferred Ideas

None — discussion stayed within the three HOME-04/05/06 requirements scoped into this phase.
