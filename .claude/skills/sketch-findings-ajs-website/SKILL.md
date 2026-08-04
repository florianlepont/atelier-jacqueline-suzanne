---
name: sketch-findings-ajs-website
description: Validated design decisions, CSS patterns, and visual direction from sketch experiments. Auto-loaded during UI implementation on ajs-website.
---

<context>
## Project: ajs-website

Bold & graphic editorial direction: Unbounded (weight 900) display font, monochrome (white/ink) + single pink accent, sharp corners, hairline borders, no new colors — the "fun/modern" ask lands in composition and motion, not a new visual identity. See `.planning/sketches/MANIFEST.md` for the full design-direction history across the project.

This skill currently covers only the Phase 21 homepage wordmark-zoom exploration (sketch 015) — sketches 001-014 (Éditions, About, 404, Contact redesigns) are already shipped/built but not yet folded into this skill. Re-run `/gsd-sketch --wrap-up` to add them.

Sketch sessions wrapped: 2026-08-04
</context>

<design_direction>
## Overall Direction

Phase 21's homepage scroll experience (phone-width only) opens on a full-screen wordmark that zooms into the first gallery's photo as the visitor scrolls, extending the site's existing photo-cutout wordmark mechanism rather than introducing a new visual device. Motion is scroll-scrubbed and fully reversible (mirrors the site's existing `DetailHero.astro` pinned-reveal pattern), not a one-shot intro animation.
</design_direction>

<findings_index>
## Design Areas

| Area | Reference | Key Decision |
|------|-----------|--------------|
| Homepage Motion (wordmark zoom) | references/homepage-motion.md | Scale Through, Cinematic pace, transform-origin measured live off the "A" glyph |

## Theme

The winning theme file is at `sources/themes/default.css`.

## Source Files

Original sketch HTML files are preserved in `sources/` for complete reference — `sources/015-homepage-wordmark-zoom/index.html` (desktop side-by-side variant comparison) and `mobile.html` (real full-screen device version used for the final decision).
</findings_index>

<metadata>
## Processed Sketches

- 015-homepage-wordmark-zoom
</metadata>
