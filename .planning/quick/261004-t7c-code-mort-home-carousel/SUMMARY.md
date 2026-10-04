---
status: complete
---
# 261004-t7c — Remove dead scroll-zoom code from home-carousel.ts

- Removed from `src/lib/home-carousel.ts` (368 lines): `clamp01`, `ZOOM_REVEAL_DISTANCE`, `computeZoomProgress`, `WordmarkZoomState`, `computeWordmarkZoomState`, `INTRO_REVEAL_DISTANCE`, `computeIntroProgress`, `IntroScrubState`, `computeIntroScrubState`, `computeSlideVisibleRatio`, `ARRIVAL_*_THRESHOLD`, `computeArrivalRevealed`, `FocusOrigin`, `computeFocusOrigin`. They belonged to an older mobile scroll-zoom design; a repo-wide search found them referenced only by their own unit tests (not by the runtime, components or e2e). Their 414 lines of tests went with them.
- Kept: everything the runtime imports (`computeHoverZone`, `computeWordmarkBackgroundPosition`, `computeWordmarkSeamFraction`, `detectSwipeDirection`, `pickRandomGalleryIndex`, `wordmarkPhotoFilter`).
- Verified: lint, typecheck, unit tests (724, were 785 before the 61 dead-code tests went), coverage thresholds, build, artifact check.
- Deliberately left: `getGallery` / `getEdition` in `src/lib/sanity.ts` (only tests call them today, but they are tied to queries, sanitizers and cache tests; remove only if single-slug fetches are not wanted), the `exhibition` Studio schema (open product decision), giant files and fragile e2e tests (next PRs).
