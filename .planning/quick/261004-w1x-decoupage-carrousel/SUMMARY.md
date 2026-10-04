---
status: complete
---
# 261004-w1x — Split the homepage carousel runtime

`src/client/home-carousel-runtime.ts` was one 1,315-line file whose single `mountDesktopHomeCarousel` function held about 1,200 lines. It is now a 275-line composition file plus modules under `src/client/home-carousel/`:

| Module | Lines | Role |
|---|---|---|
| `types.ts` | 99 | shared state, element and function contracts |
| `runtime-scope.ts` | 57 | timers/listeners with one-shot cleanup |
| `cross-doc.ts` | 53 | View Transition naming of the clicked photo |
| `wordmark.ts` | 171 | wordmark photo cutout and seam sync |
| `render.ts` | 154 | paints the current gallery, preloads neighbours |
| `autoplay.ts` | 155 | auto-advance timer, progress fill, pause control |
| `display-mode.ts` | 66 | carousel/grid switch |
| `navigation.ts` | 178 | prev/next, dashes, arrow keys, swipe, tap-to-open |
| `peek.ts` | 309 | hover cursor, edge peek, edge-click commit |

Mechanical, behaviour-preserving move: code and comments were moved verbatim; only shared variables became `state.x` / `dom.x` and cross-module calls became `api.fn()`. Each module registers its functions on a shared `api` object while it is set up; they are only called afterwards.

Verification:
- Token-level comparison of the old file against the new files (comments stripped, `state.`/`api.`/`dom.` prefixes removed): the only token of the original that is missing is the 12 removed `let` state declarations; everything else is new boilerplate (imports, types, destructuring, `api.x = x`).
- lint, typecheck (0 errors), Prettier check, 725 unit tests, coverage thresholds, build, artifact check.
- Homepage Playwright suite (chromium, with the Sanity CDN reachable): 119 passed, 8 failed on the refactored tree vs 121 passed, 6 failed on the unmodified tree. The failures are the same tests in both: 3 `homepage-accent-random` tests fail on every run on both trees, and a varying subset of the `homepage-wordmark-peek` tests fails on both (repeat runs of 3 of those tests: 4 of 15 failed on the unmodified tree, 2 of 15 on the refactored tree), so they are unstable in this sandbox rather than broken by the move. CI is the reference.
- vitest coverage: `src/client/home-carousel/**` is excluded like the runtime file it came from (comment in `vitest.config.ts` updated).

Left alone: `HomeCarousel.astro` (1,886 lines, but 1,488 of them are one scoped `<style>` block: moving CSS out of an Astro component changes scoping/specificity), `SiteHeader.astro` and `DetailHero.astro` (same shape), `page-models.ts`, `BaseLayout.astro`, `sanity-validation.ts`.
