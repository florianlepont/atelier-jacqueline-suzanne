# Phase 9: Progressive Homepage Image Loading - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 09-progressive-homepage-image-loading
**Areas discussed:** Blur placeholder source, Scope (which photos get the treatment), Hero priority + next-photo prefetch, Transition feel

---

## Blur placeholder source

| Option | Description | Selected |
|--------|-------------|----------|
| Sanity low-res blur URL | Tiny (~20-40px wide) blurred version of the same photo via Sanity's CDN `?blur=` param, one extra tiny request per photo, reuses the existing `@sanity/image-url` builder. | ✓ |
| Solid dominant/accent color | The gallery's existing `heroColor` as a flat placeholder, then a plain fade to the sharp photo. No photo detail, zero extra requests. | |
| Base64 LQIP inlined at build time | A tiny blurred image encoded directly into page HTML at build time. Zero extra request but needs new build-time fetch/encode plumbing. | |

**User's choice:** Sanity low-res blur URL (recommended option).
**Notes:** Keeps the same builder singleton already used for `thumbnailUrl`/`fullSizeUrl` — no new build-time plumbing.

---

## Scope: which photos get the treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Hero only, first paint only | Only the very first hero photo on page load gets blur-up; later swaps show the new photo directly. | |
| Hero on every swap, grid tiles too | Blur-up on the hero every time it changes (first load + auto-advance/prev/next/toggle), plus grid-mode tiles get the same treatment as they lazy-load into view. | ✓ |
| Hero on every swap, grid tiles stay plain lazy-load | Hero gets blur-up on every swap; grid tiles keep current plain `loading="lazy"` with no blur transition. | |

**User's choice:** Hero on every swap, grid tiles too (recommended option).
**Notes:** Matches HOME-09's "each homepage photo" success-criteria wording; user prioritized a uniformly polished feel across hero and grid.

---

## Hero priority + next-photo prefetch

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, prefetch the next photo | Quietly preload the next gallery's photo in the background while the current one shows, so auto-advance/prev/next/toggle rarely shows a visible blur-up moment. | ✓ |
| No, just fetchpriority="high" on the current hero | Only prioritize the currently-showing photo; every swap shows the full blur-to-sharp transition. | |

**User's choice:** Yes, prefetch the next photo (recommended option).
**Notes:** Makes the blur-up moment the exception rather than something visible on every single carousel swap.

---

## Transition feel (duration/intensity)

| Option | Description | Selected |
|--------|-------------|----------|
| Quick & subtle | ~200-300ms fade, matching the timing already used for the carousel/grid toggle's view-transition morph (Phase 7 / quick-task work). | ✓ |
| Slower & cinematic | A longer (~600-800ms+), more noticeable dissolve — a deliberate reveal effect rather than an incidental loading detail. | |

**User's choice:** Quick & subtle (recommended option).
**Notes:** Consistent with the site's existing snappy interaction feel and established timing convention.

---

## Claude's Discretion

- Exact CSS mechanism for the blur-to-sharp swap (stacked-image crossfade vs. animated `filter: blur()` vs. `src` swap with load-triggered transition) — must coexist with the existing `view-transition-name` wiring on `.home-hero__photo`/`.home-hero__accent`.
- Exact blur radius/thumbnail width for the low-res placeholder URL — verify live for a recognizable-but-cheap preview.
- Exact prefetch trigger point in the auto-advance/prev/next/toggle cycle.

## Deferred Ideas

None — discussion stayed within HOME-09's scope. Gallery-detail page images (lightbox, detail grid) confirmed out of scope for this phase.
