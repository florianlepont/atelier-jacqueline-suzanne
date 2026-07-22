# Improve homepage wordmark legibility — Summary

## Outcome

The homepage wordmark keeps its photographic cutout while gaining stronger,
adaptive contrast. The Safari-safe treatment uses one photo background, no
blend layer, and no outline. A brightness/contrast filter is applied only
after the clipped glyph pixels are rasterized: it darkens the photo on light
panels and lifts it on dark panels, including during carousel transitions.

## Files changed

- `src/components/HomeCarousel.astro`
- `tests/e2e/homepage.spec.ts`

## Verification

- `npm run build` — passed, 21 pages
- `npm run typecheck` — 0 errors, 0 warnings, 5 pre-existing hints
- Homepage Playwright suite — 41/41 passed
- Live desktop review at 1280x800 — Paysage uses the darker treatment on its
  lime panel; Brume uses the lighter treatment on its purple panel. Both keep
  visible photographic texture without extra geometric paint layers.
