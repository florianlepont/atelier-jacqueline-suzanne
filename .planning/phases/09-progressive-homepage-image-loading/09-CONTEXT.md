# Phase 9: Progressive Homepage Image Loading - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the homepage's photos load progressively instead of popping in abruptly, with no blocking full-screen loader:

1. Page shell (header, nav, toggle) renders immediately regardless of photo load state.
2. The hero photo loads with priority and transitions visibly from a blurred placeholder to sharp — on first paint AND on every later swap (auto-advance, prev/next, carousel/grid toggle).
3. Grid-mode tiles get the same blur-to-sharp treatment as they lazy-load into view.
4. Below-the-fold gallery tile images continue to load lazily and never delay initial render.

Touches only `src/components/HomeCarousel.astro` (hero `<img>`, grid tile `<img>`s, the client `render()` swap logic) and `src/lib/image.ts` (URL builder, for the new blurred-variant helper). Does not touch checkout/shop/exhibitions (v2, out of milestone scope), Phase 5's OVH domain cutover, gallery-detail page images (`src/pages/galleries/[slug].astro`, `Lightbox.astro` — unaffected, no blur-up there), or Phase 10's header consolidation.

</domain>

<decisions>
## Implementation Decisions

### Blur placeholder source
- **D-01:** Use a Sanity CDN low-res blurred URL (via the existing `@sanity/image-url` builder already used in `src/lib/image.ts`) — e.g. `builder.image(img).width(24).blur(50).auto('format').url()`. A real, tiny (few-KB) blurred preview of the actual photo, not a solid color or build-time-encoded base64. No new build-time plumbing needed; reuses the same builder singleton already in place for `thumbnailUrl`/`fullSizeUrl`.
- Rejected: solid dominant-color placeholder (no "emerging photo" feel) and base64 LQIP inlined at build time (extra build-time fetch/encode plumbing not justified for this near-zero-maintenance site).

### Scope: which photos get the treatment
- **D-02:** The hero photo gets the blur-to-sharp treatment on **every** swap — first page load AND every later auto-advance/prev/next/toggle transition, not just the initial paint.
- **D-03:** Grid-mode tiles (`.home-grid__tile-img`) get the same blur-up treatment as they come into view (their existing `loading="lazy"` stays; add the blurred-placeholder swap on top of it) — matches HOME-09's "each homepage photo" success-criteria wording and the user's explicit choice to keep grid and hero visually consistent.
- Rejected: hero-only-on-first-load (too narrow — would leave every subsequent carousel swap looking abrupt) and hero-blur-with-plain-grid-lazy-load (grid tiles get the treatment too, per D-03).

### Hero priority + next-photo prefetch
- **D-04:** Add `fetchpriority="high"` (and keep/verify eager loading — no `loading="lazy"`) on the hero `<img>` for whichever photo is currently displayed.
- **D-05:** Prefetch the next gallery's hero photo in the background while the current one is showing (e.g. an in-memory `Image()` object or `<link rel="prefetch">`) so that by the time auto-advance (6s interval) or a manual prev/next/toggle fires, the sharp photo is already warm in the browser cache — the blur-up moment becomes the exception rather than something visible on every single swap. Applies to whichever gallery is next in sequence from the current index.

### Transition feel
- **D-06:** Quick, subtle dissolve — target ~200-300ms, matching the timing convention already established for the carousel/grid toggle's view-transition morph (Phase 7 / `260713-jfz`/`260713-kit` quick-task work). Not a slow/cinematic reveal — should read as "the photo just finished loading," consistent with the site's existing snappy interaction feel.

### Claude's Discretion
- Exact CSS mechanism for the blur-to-sharp swap (e.g. two stacked `<img>` layers with opacity crossfade, vs. a single `<img>` with a `filter: blur()` that animates to 0, vs. swapping `src` with a transition on load) — pick whichever integrates cleanest with the existing hero `<img data-role="hero-image">` and grid tile markup without conflicting with the already-shipped `view-transition-name` wiring on `.home-hero__photo`/`.home-hero__accent` (Phase 7/quick-task history — see Canonical References).
- Exact blur radius/thumbnail width for the low-res placeholder URL (D-01) — small enough to be cheap and load near-instantly, large enough to read as a recognizable color/shape preview, not a solid blob. Verify live.
- Exact prefetch trigger point in the auto-advance/prev/next/toggle cycle (D-05) — e.g. prefetch immediately after each swap completes, so there's a full ~6s window before the next transition.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Homepage component (entire surface being modified)
- `src/components/HomeCarousel.astro` — the hero `<img data-role="hero-image">` (line ~177, currently no `loading`/`fetchpriority`/blur handling at all), the grid tile `<img class="home-grid__tile-img">` (line ~237, currently `loading="lazy" decoding="async"` only), and the client `render()` function (`heroImg.src = gallery.heroSrc`, line ~383) that swaps the hero photo on auto-advance/prev/next/toggle — this is where the blur-up-on-every-swap logic (D-02) and prefetch (D-05) need to hook in.
- `src/lib/image.ts` — `thumbnailUrl()`/`fullSizeUrl()`, the existing `@sanity/image-url` builder pattern (D-01's blurred-URL helper should live alongside these, same builder singleton).
- `src/pages/index.astro` / `src/pages/en/index.astro` — where `heroSrc`/`gridSrc` are computed at build time via `fullSizeUrl(cover)`/`thumbnailUrl(cover, 600)` and passed into `HomeCarousel` as props; a new blurred-URL field will need threading through here too, following the same pattern as `heroSrc`/`gridSrc`.

### Prior phase decisions this phase must not conflict with
- `.planning/phases/07-homepage-quick-fixes-mobile-hero-correctness/07-CONTEXT.md` — HOME-06's mobile hero fix and the `view-transition-name: ajs-hero-morph` wiring on `.home-hero__photo`/`.home-hero__accent` (added by quick task `260713-jfz`, refined by `260713-kit`) sit on the exact same elements this phase's blur-up CSS will touch. The blur-to-sharp mechanism (Claude's Discretion above) must coexist with, not fight, the existing view-transition group naming/z-index stacking (`<style is:global>` block, `HomeCarousel.astro:1374+`).
- `.planning/phases/08-gallery-descriptions/08-CONTEXT.md` — HOME-07/08's carousel byline and grid-tile hover-description work touches the same `render()` function and grid tile markup this phase modifies; no functional conflict expected (different concerns — text vs. image loading) but both now live in the same hot paths of `HomeCarousel.astro`.

### Requirements
- `.planning/REQUIREMENTS.md` — HOME-09 definition and Phase 9 traceability.
- `.planning/ROADMAP.md` (Phase 9 section) — the four success criteria this phase must satisfy.

**No formal cross-project ADRs/specs** — this phase's requirements are fully captured in REQUIREMENTS.md/ROADMAP.md and the Decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@sanity/image-url` builder (`src/lib/image.ts`) — `thumbnailUrl()`/`fullSizeUrl()` are the direct pattern to follow for a new blurred-placeholder URL helper (D-01): same builder singleton, just `.width(24).blur(50)` instead of `.width(600).fit('crop')`.
- `firstGallery.heroSrc`/`gallery.gridSrc` prop-threading pattern (`index.astro` → `HomeCarousel` props → data island `<ul data-role="home-carousel-data">` → client `render()`) is the exact template for threading a new blurred-URL field through to the client script.

### Established Patterns
- No `astro:assets`/`sharp`/`<Image>` usage anywhere in this codebase — all gallery photos are served directly from Sanity's CDN via `@sanity/image-url` with `auto('format')` (WebP/AVIF content negotiation handled by Sanity, not Astro build-time processing). This phase should stay consistent with that — no need to introduce `astro:assets` for this.
- Client-side rendering in `HomeCarousel.astro` uses a hidden `<ul data-role="home-carousel-data">` data island read once into an in-memory `galleries` array, then `render()` mutates the DOM on prev/next/auto-advance/toggle (no framework, no `client:*` directive). Any new per-gallery field (like a blurred-placeholder URL) must be added to this data island, mirroring how `heroSrc`/`statement`/`slug` etc. are already threaded through.
- `view-transition-name` assignments live in a separate `<style is:global>` block (`HomeCarousel.astro:1374+`) because Astro's scoped styles can't target document-root pseudo-elements — relevant if the blur-up CSS mechanism needs its own transition/animation timing that must not clash with the existing view-transition group stacking.

### Integration Points
- `firstGallery.heroSrc` is also used server-side to set `--wordmark-photo` (the carousel wordmark's `background-clip: text` cutout effect, HOME-03/Phase 6) — any change to how the hero photo loads must keep this CSS custom property in sync (currently updated in `render()` alongside `heroImg.src`, line ~410).
- Grid tiles are rendered from the full `galleries` array server-side (`src/pages/index.astro` → `HomeCarousel` props), not re-rendered client-side — so the grid tile blur-up (D-03) is primarily a server-rendered markup + CSS concern, unlike the hero's client-script-driven swaps.

</code_context>

<specifics>
## Specific Ideas

- User confirmed the phase's own PROJECT.md framing as the north star: "page renders immediately, hero/gallery photos load with priority and a smooth blur-to-sharp transition — no blocking full-screen loader" — this session's discussion filled in the specific HOW (Sanity blur URLs, every-swap scope, prefetch, quick/subtle timing) on top of that already-agreed WHAT.
- User chose the more thorough, consistent option at every gray area (every-swap hero blur, grid tiles included, prefetch added) over the narrower/simpler alternatives — prioritizing a uniformly polished feel across the whole homepage over minimizing implementation surface.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within HOME-09's scope. Gallery-detail page images (lightbox, detail grid) were explicitly confirmed out of scope for this phase during codebase scouting (no existing loading-treatment gap raised by the user).

</deferred>

---

*Phase: 09-progressive-homepage-image-loading*
*Context gathered: 2026-07-14*
