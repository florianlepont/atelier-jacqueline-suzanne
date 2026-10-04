---
status: complete
---
# 261004-v9g — Fragile e2e waits

- New `tests/e2e/helpers/settle.ts`: `settleFrames(page, n)` (wait for n animation frames) and `settleTransitions(page)` (wait until every finite CSS transition/animation has finished; infinite ones ignored).
- 20 of the 42 fixed `waitForTimeout` pauses replaced: 17 pauses after `window.scrollTo` (80/150 ms) in gallery, edition and detail-hero specs now wait for animation frames; 3 hover colour-transition pauses (400 ms, edition and accessibility specs) now wait for the transitions to finish. Fixed waits that stay: 22.
- Deliberately left as fixed waits (their duration is part of what is tested): time between wheel ticks (accumulator window), the 300 ms "nothing must navigate" negative checks, the 700 ms edge-commit settle, the not-found drift/pointer-rate windows (5 s / 1.5 s), and the 200 ms JS-eased `--wm-seam` reads in the wordmark-peek spec.
- The 20 `test.skip` calls are kept on purpose: e2e runs on live Sanity content before every deploy, and a content change in the Studio (unpublishing a gallery) must not block that deploy. A fixed test dataset would be the real fix and is a separate piece of work.
- Verified: gallery, edition, detail-hero and accessibility specs run 3x in a row on chromium: 267 passed, 3 skipped, 12 failed. The 12 failures are 4 masonry tests x3, and the same 4 fail on unmodified `main` in this sandbox (probably no access to the Sanity image CDN here), so they are unrelated to this change. Lint, typecheck and 725 unit tests pass.
