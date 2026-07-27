# Deferred Items — quick-260727-kq8

Out-of-scope discoveries not fixed as part of this task (scope boundary: only
`src/lib/home-carousel.ts`, `tests/unit/home-carousel.test.ts`,
`src/components/HomeCarousel.astro`, `tests/e2e/homepage.spec.ts` were touched).

- `tests/unit/dashboard-logic.test.ts` fails in this worktree with `Cannot
  find package '@sanity/icons'` imported from
  `sanity/editorial/dashboardLogic.ts`. The `sanity/` subproject's own
  `node_modules` is not installed in this worktree (no
  `sanity/node_modules/.package-lock.json`). Pre-existing worktree
  environment gap, unrelated to the wordmark freeze fix — not touched here.
  All 130 non-Sanity unit tests pass; only this one suite fails to even
  import.
