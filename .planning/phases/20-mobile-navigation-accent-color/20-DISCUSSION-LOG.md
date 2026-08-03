# Phase 20: Mobile Navigation & Accent Color - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-03
**Phase:** 20-Mobile Navigation & Accent Color
**Areas discussed:** Header architecture, Mobile menu visual style, Open/close mechanics, Accent-color scope, Menu content hierarchy (language switcher + Instagram placement)

---

## Header Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Extend SiteHeader with an opt-in prop | Single source of truth for header markup; only the homepage passes the new prop | ✓ |
| Build it homepage-only, inside HomeCarousel.astro | Zero risk to SiteHeader.astro/other pages, but duplicates nav-link CSS | |

**User's choice:** Extend SiteHeader with an opt-in prop.
**Notes:** Accepted the trade-off knowingly — `SiteHeader.astro` has broken other pages twice before (Phase 16, Phase 19), but the user preferred one shared component over duplicated markup.

---

## Mobile Menu Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Off-canvas drawer sliding in from the side | Classic hamburger pattern, panel over dimming scrim | |
| Full-screen takeover panel | Menu covers the entire viewport, matches the site's bold editorial language | (superseded) |
| Simple dropdown beneath the header | Lighter-weight, less committal | |

**User's choice:** Provided a concrete visual reference instead of picking from the options — a Dribbble mobile-portfolio mockup (saved as `20-mobile-menu-reference.png`), which is a full-screen takeover: persistent top-left logo, hamburger↔X icon swap, large centered stacked nav list, small secondary line near the bottom, corner halftone-dot texture. Effectively confirms "Full-screen takeover panel," with a specific look attached.
**Notes:** User explicitly asked for "a nice transition opening/closing and animation."

---

## Open/Close Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — reuse native `<dialog>`/`showModal()` | Consistent with the Lightbox.astro precedent | |
| No — a plain toggled `<nav>` element instead | Avoids fighting `<dialog>`'s default modal centering | |
| Let Claude decide during planning | Research the concrete trade-off first | ✓ |

**User's choice:** Let Claude decide during planning.
**Notes:** Flagged for the planner: verify `<dialog>` can be styled edge-to-edge (full-screen, not centered) before committing to it, given the D-02 full-screen requirement.

---

## Accent-Color Scope (HOME-16)

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed for the whole visit (replaces per-gallery cycling) | One random color for the entire mobile visit, ignoring carousel position | |
| Randomize only the starting color, keep per-gallery cycling | First-load color is random; swipe-driven per-gallery changes continue as today | ✓ |

**User's choice:** Randomize only the starting color, keep per-gallery cycling.
**Notes:** This is a deliberate narrowing of PROJECT.md's original "fixed for the whole visit" framing — the user chose the less-disruptive interpretation once the trade-off was made explicit.

---

## Menu Content Hierarchy

| Question | Option | Description | Selected |
|---|--------|-------------|----------|
| Language switcher placement | Secondary element, near the bottom | Small, echoes today's compact treatment | |
| Language switcher placement | Same big list item as the others | Equal visual weight with Éditions/About/Contact | ✓ |
| Instagram placement | Grouped with the language switcher (secondary/bottom) | Small icon+text near the bottom | ✓ |
| Instagram placement | Same big list item as the others | Equal visual weight | |

**User's choice:** Language switcher joins the big stacked list (equal weight with Éditions/About/Contact); Instagram moves to the small secondary/bottom position alone.
**Notes:** Since the language switcher moved up to the primary list, Instagram ends up alone in the bottom-secondary slot (reconciled in CONTEXT.md D-04).

---

## Claude's Discretion

- Whether to reuse `Lightbox.astro`'s native `<dialog>`/`showModal()` pattern or a plain toggled element for open/close.
- Exact transition/animation technique and timing for menu open/close.
- Whether the open-menu panel reuses the site's existing halftone-dot texture mechanism verbatim or a new decorative treatment.
- Hamburger↔X icon treatment — simple two-state swap vs. a morph animation (precedent: `HomeCarousel.astro`'s `.home-toggle__morph` carousel/grid toggle).

## Deferred Ideas

None — discussion stayed within phase scope. The carousel/grid toggle removal and full scroll-driven view remain correctly scoped to Phase 21, not pulled forward here.
