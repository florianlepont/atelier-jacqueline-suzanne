# Phase 6: Homepage View-Mode Toggle, Grid Hero & Wordmark Cutout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 06-homepage-view-mode-toggle-grid-hero-wordmark-cutout
**Areas discussed:** Hero tile size, Hero tile photo, CTA button fate, Toggle mechanic

---

## Hero tile size

| Option | Description | Selected |
|--------|-------------|----------|
| Same size as other tiles | 1x1 square, identical treatment to gallery tiles — simplest, most literal reading of "becomes the first tile of the grid." | ✓ |
| Emphasized / larger | Hero tile spans 2 columns (or otherwise stands out) so it still reads as a distinct "header" moment within the grid. | |

**User's choice:** Same size as other tiles.
**Notes:** Matches the literal wording of the milestone request ("Hero becomes the first tile of the grid").

---

## Hero tile photo

| Option | Description | Selected |
|--------|-------------|----------|
| Same photo as the carousel hero | Reuses the first/current gallery's photo — consistent with carousel mode, no new asset needed, and the cutout effect can apply here too. | |
| Solid color background, no cutout here | Grid hero-tile keeps a plain accent-color background (like today) — the transparent cutout wordmark effect stays exclusive to carousel mode. | ✓ |

**User's choice:** Solid color background, no cutout here.
**Notes:** Consistent with the user's own reasoning during milestone scoping ("It can only work on the carrousel effect as the font and the hero are on top of the picture") — the cutout effect is tied to the wordmark sitting directly over a photo, which is true of carousel mode but not necessary to replicate in the grid tile.

---

## CTA button fate

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it | Redundant now that there's one unified toggle in the header — delete the CTA button entirely, keep the wordmark + intro paragraph in the accent panel. | ✓ |
| Keep it as-is | Leave the CTA button; a second, more prominent in-content way to reach grid mode is fine even with the header toggle. | |
| Something else | (not selected) | |

**User's choice:** Remove it.
**Notes:** The CTA already triggers `data-action="show-grid"`, identical to what the new single toggle button does — keeping both would be redundant.

---

## Toggle mechanic

| Option | Description | Selected |
|--------|-------------|----------|
| One icon that flips | One button showing an icon for "switch to grid" while in carousel mode, and "switch to carousel" while in grid mode — icon and accessible name change based on current state. | ✓ |
| Segmented two-state switch | Visually shows both options side-by-side as one connected control (like today's two buttons, but styled/grouped as a single unit) with the active one highlighted. | |

**User's choice:** One icon that flips.
**Notes:** Closest to a literal single "unique button," as opposed to a restyled pair.

---

## Claude's Discretion

- Exact icon glyphs for the single toggle button's two states (likely adapting the existing carousel/grid SVG icons already in the component).
- Exact `background-clip: text` alignment technique for the cutout wordmark.
- Exact enlarged font-size value for the cutout wordmark (direction: larger than the current 44px).
- Accent panel layout rebalancing once the CTA button is removed and the wordmark grows.

## Deferred Ideas

None — discussion stayed within the three HOME-01/02/03 requirements scoped into this phase.
