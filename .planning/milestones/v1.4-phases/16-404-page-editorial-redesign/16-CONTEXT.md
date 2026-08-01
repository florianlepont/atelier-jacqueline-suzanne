# Phase 16: 404 Page Editorial Redesign - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Phase Boundary

The 404 fallback page (`src/pages/404.astro`) gets a fully custom, interactive redesign — **not** the shared `PageTitleHeader` treatment (giant title/halftone/hairline-divider) used on Contact/Éditions/About. This supersedes the phase as originally drafted; see "Requirement Override" below.

New concept: a full-bleed background of Romane's own photography, one photo at a time, hard-cutting to the next photo at a rate driven by how close the visitor's pointer (or touch position, on touch devices) is to the center of the screen — closer to center, faster the cutting; farther away, slower. Centered on top, floating over a dimming scrim: the AJS logo, a small "404" marker, the bilingual phrase "Page introuvable / Not found", and the existing "Retourner à l'accueil" / "Return home" links side by side.

The page still has no locale routing — Apache serves this one static file for every 404 across the whole site (`public/.htaccess`: `ErrorDocument 404 /404.html`), so FR and EN content must both appear together on every load, exactly as today. That structural constraint is unchanged by the redesign.

</domain>

<decisions>
## Implementation Decisions

### Requirement Override — read this first
- **D-01:** This phase does **not** implement ERR-01/Phase 16 as currently worded in `ROADMAP.md`/`REQUIREMENTS.md` ("404 page uses the same editorial visual identity (`PageTitleHeader`: giant title, halftone texture, hairline divider) as Contact/Éditions/About"). Mid-discussion, the user rejected that direction entirely in favor of the fully custom animated concept described below, and explicitly said: *"Don't hesitate to update the requirements."* `ROADMAP.md`'s Phase 16 section and `REQUIREMENTS.md`'s ERR-01 line should be updated to describe the new concept (goal/success criteria) rather than the `PageTitleHeader`-reuse framing — do this via `/gsd-phase --edit 16`, not a raw edit, per project convention. If those files still describe the old `PageTitleHeader` approach when planning starts, this CONTEXT.md is the authoritative source — the ROADMAP/REQUIREMENTS text is stale, not this document.
- **D-02:** The "no design exploration needed" note attached to Phase 16 in `ROADMAP.md`/`STATE.md` no longer holds — this concept has real interaction/motion/accessibility design surface. Treat it as needing the same design rigor as Phase 15's sketch-based process would have, even though no formal sketch round happened here (the concept was locked directly through this discussion instead).

### Visual Concept
- **D-03:** Full-bleed single photo fills the background, one at a time — not a grid/mosaic of multiple simultaneous tiles.
- **D-04:** Photos are drawn from Romane's existing gallery photography (real images already in the site/Sanity) — not literal screenshots of site pages, and not new/placeholder imagery.
- **D-05:** Photo changes are a **hard instant cut** — no crossfade or flash transition between photos.
- **D-06:** Centered content: AJS logo (reuse the existing `logoBlackSrc`/`logoWhiteSrc` asset pair from `SiteHeader.astro`, at a much larger size than the header's 56px), a small "404" marker, the phrase "Page introuvable / Not found", and the "Retourner à l'accueil" / "Return home" links — laid out side by side, not stacked.
- **D-07:** The centered content floats over a **dimming scrim** (not a solid/hairline-bordered backing panel) for legibility against the busy, constantly-changing photo background — reuses the existing scrim convention from `DetailHero.astro` (`.detail-hero__scrim` + `.detail-hero__overlay-title`, used today on gallery/édition detail hero photos), rather than inventing a new overlay pattern.

### Interaction / Speed Mechanic
- **D-08:** Pop rate is driven by pointer distance from the screen's center: closer to center = faster cutting; farther from center = slower.
- **D-09:** On touch devices (no mouse pointer), touch position drives the same speed curve via `touchmove` — not a fixed constant rate. This is a deliberate choice to keep the effect consistent across input types, even though it's more implementation work than a static mobile fallback.
- **D-10 — accessibility-critical (SUPERSEDED 2026-07-29, see override below):** Maximum pop rate **must be capped** at roughly 3 photo-changes per second or under, even with the pointer/touch held at dead-center. This was raised during discussion as a genuine photosensitive-seizure-risk concern (WCAG's general guidance against content flashing faster than ~3×/second for large, high-contrast screen areas), not a style preference — the user agreed to cap it. Do not implement an uncapped version "for feel" and cap it later; the cap is load-bearing from the start.
  - **D-10 override (2026-07-29, at the Plan 16-03 human-verify checkpoint):** After seeing the built ~2.86/sec-capped effect live, the user said it should go "vraiment plus vite" (really faster) and explicitly accepted the flash-rate tradeoff ("tant pis pour les flash effect"). Presented with the WCAG risk restated plainly and three concrete options (keep the WCAG-safe cap / raise it significantly but keep a finite ceiling / remove the cap entirely), the user chose **"raise it significantly, keep a finite ceiling"**: `MIN_INTERVAL_MS` moves from 350ms (~2.86/sec) to 150ms (~6.7/sec) at absolute dead-center. This is a knowing, explicit departure from WCAG 2.3.1 general-flash guidance for this one page — do not "correct" it back down to the WCAG-safe value without the user raising it again. `MAX_INTERVAL_MS`/`DRIFT_INTERVAL_MS` (far-from-center speed, reduced-motion drift) are unchanged.

### Reduced Motion
- **D-11 — deliberate divergence from site convention:** `prefers-reduced-motion` shows a **slow, constant, non-pointer-driven drift** (photos still change, just slowly and steadily, ignoring pointer/touch position) — **not** the hard-freeze-to-settled-end-state pattern used elsewhere on the site (About's pinned hero, Éditions' sticky reveal, HomeCarousel/Lightbox view transitions all freeze instead of drift). This was an explicit choice for this specific effect, confirmed by the user — do not "correct" it back to a hard freeze to match those other components' convention. Planner/researcher: pick a concrete slow interval (e.g., one photo every 3-5 seconds) that stays well under any flash-rate concern regardless of reduced-motion state.

### Copy
- **D-12:** Exact final string content (precise wording/formatting of the "404" marker, the "Page introuvable / Not found" phrase, and the home-link labels) can be finalized during implementation — the constraint is that the meaning stays the same as today's copy ("this page doesn't exist, here's how to get home," in both French and English), not that every byte of the current two-sentence-per-language copy survives verbatim. The layout is far more compact than today's page (logo + short phrase + links vs. full paragraphs), so some condensing of the existing sentences is expected and fine.

### Claude's Discretion
- Exact size/pool of photos cycled through (e.g., a curated subset across galleries vs. pulling from all galleries) — pick something that preloads cleanly and doesn't create a network stall at the capped ~3/sec rate.
- Precise scrim opacity/gradient and logo size/color (black vs. white variant, or swapping based on the current background photo's dominant tone) needed for legibility across all photos in the pool.
- Concrete reduced-motion drift interval (D-11) — pick a specific, well-under-flash-threshold cadence.
- Whether the "404" marker sits above, beside, or below the logo/phrase block — purely a layout-polish decision.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements (STALE — see D-01)
- `.planning/ROADMAP.md` (Phase 16 section) — currently describes the superseded `PageTitleHeader`-reuse approach; needs updating via `/gsd-phase --edit 16` to match this CONTEXT.md
- `.planning/REQUIREMENTS.md` (ERR-01) — currently describes the superseded approach; needs updating to match
- `.planning/PROJECT.md` — v1.4 milestone goal and Key Decisions (the milestone's editorial-consistency framing predates this pivot for Phase 16 specifically; About/Éditions/Contact are unaffected)

### Structural constraint (unchanged by this pivot)
- `public/.htaccess` — `ErrorDocument 404 /404.html`; confirms one static file serves every 404 across the whole site, no per-locale routing possible, so FR+EN must both appear on every load
- `src/pages/404.astro` — current implementation; the CR-01 lesson from Phase 1's code review (`01-REVIEW.md`) still applies: home links MUST go through `getRelativeLocaleUrl()`, never a literal `href` string, or they break under GitHub Pages' non-root base path

### Existing components/patterns this phase reuses
- `src/components/SiteHeader.astro` — source of the `logoBlackSrc`/`logoWhiteSrc` asset paths (`/logos/AJS_Brutalist_{Black,White}_Transparent.png`) and the base-aware asset-path pattern (`assetBase` derived from `import.meta.env.BASE_URL`) needed to reuse the logo safely under both GitHub Pages and OVH base paths
- `src/components/DetailHero.astro` — source of the dimming-scrim-over-photo pattern (`.detail-hero__scrim`, `.detail-hero__overlay-title`) this phase adapts for legible centered content over the popping photo background
- `.planning/sketches/005-edition-hero-scroll-reveal/README.md` — not directly reused (that's a scroll-position-driven reveal, this is pointer-position-driven), but is the closest prior art for "driving visual state from a continuously-sampled input via vanilla JS, no animation library" — same implementation philosophy applies here (pointer/touch coordinates in, inline style/CSS custom property out)

### Explicitly NOT used (superseded)
- `src/components/PageTitleHeader.astro` — the shared giant-title/halftone/divider component originally scoped for this phase; dropped per D-01/D-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `logoBlackSrc` / `logoWhiteSrc` (from `SiteHeader.astro`, `/logos/AJS_Brutalist_*_Transparent.png`) — the actual AJS logo image files; reuse directly rather than sourcing a new asset.
- `.detail-hero__scrim` / `.detail-hero__overlay-title` (from `DetailHero.astro`) — existing dimming-scrim-over-photo CSS pattern; adapt rather than invent a new overlay treatment.
- Existing gallery photography already in Sanity/the site — the photo pool for the popping background.

### Established Patterns
- Base-aware asset paths: `assetBase = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')`, then `${assetBase}/logos/...` — required for the logo image to resolve under GitHub Pages' `/ajs-website/` base, not just OVH's root base.
- `getRelativeLocaleUrl()` for both home links — every other base-aware link in the codebase goes through this helper; a literal `href` string will 404 under a non-root base (this exact bug was CR-01 in Phase 1's review, found via live curl testing against the deployed site).
- Vanilla-JS, no-library pattern for continuously-sampled-input-driven visual state (sketch 005's scroll listener is the closest precedent, adapted here for pointer/touch position instead of scroll position).
- `prefers-reduced-motion` is always handled site-wide, but this phase's fallback (slow drift, D-11) deliberately diverges from the usual hard-freeze convention — don't let that convention override the user's explicit choice here.

### Integration Points
- `src/pages/404.astro` is the only file that needs to change structurally (still rendered through `BaseLayout` — `noIndex` and the `<title>` should stay as-is, only the body content changes).
- No other page/component depends on 404.astro's current markup — this is a fully isolated, single-file blast radius (no `Props` interface, no other call sites to check).

</code_context>

<specifics>
## Specific Ideas

- The core visual pitch, in the user's own words: "full screen picture which are scrolling... it's not a scroll it's popping... In the center of the page the AJS logo. The more your pointer goes in the center of the webpage, the more the picture are scrolling fast."
- This should feel high-impact and distinctive — a deliberate departure from the quiet, minimal treatment every other page in this milestone got, since a 404 page is allowed to have a different personality (visitor already knows something went "wrong," the tone can be more playful/energetic).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (an ambitious pivot in visual direction, but still squarely the 404 page, no new capability outside this phase's boundary).

</deferred>

---

*Phase: 16-404 Page Editorial Redesign*
*Context gathered: 2026-07-29*
