# Sketch Wrap-Up Summary

**Date:** 2026-08-04
**Sketches processed:** 1 (015 only — 001-014 deliberately deferred, see below)
**Design areas:** Homepage Motion (wordmark zoom)
**Skill output:** `./.claude/skills/sketch-findings-ajs-website/`

## Included Sketches
| # | Name | Winner | Design Area |
|---|------|--------|-------------|
| 015 | homepage-wordmark-zoom | A — Scale Through, Cinematic pace, anchored on the "A" glyph | Homepage Motion |

## Excluded Sketches
| # | Name | Reason |
|---|------|--------|
| 001-014 | (Éditions, About, 404, Contact redesigns) | Already shipped/built into production before this wrap-up; deliberately scoped out to unblock Phase 21 planning quickly. Not rejected — re-run `/gsd-sketch --wrap-up` anytime to fold them into this skill. |

## Design Direction
Phase 21's homepage scroll experience (phone-width only) opens on a full-screen "Atelier Jacqueline Suzanne" wordmark that scales up ~8.5× into the first gallery's photo as the visitor scrolls, extending the site's existing photo-cutout wordmark mechanism (`background-clip: text`) rather than a new visual device. The zoom's `transform-origin` anchors precisely on the "A" of "Atelier," measured live from the rendered glyph rather than guessed. Motion is scroll-scrubbed and fully reversible, mirroring `DetailHero.astro`'s existing pinned-reveal pattern.

## Key Decisions
- **Motion:** accelerating (ease-in-cubic) scale from 1x to ~8.5x, crossfading to a plain photo in the last 15% of progress for a clean end state
- **Pace:** Cinematic (900px scroll distance) — confirmed on a real phone; a quicker pace read as abrupt
- **Anchor:** the "A" glyph, computed via `getBoundingClientRect()`, not a hardcoded percentage
- **Process learning:** a mobile-only scroll interaction needs a real-device test pass, not just a desktop-simulated phone-frame comparison — the winning pace and the anchor-on-"A" request both only surfaced once tested on an actual phone over the local network
