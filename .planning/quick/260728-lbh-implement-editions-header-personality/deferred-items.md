# Deferred Items — quick-260728-lbh

## Pre-existing flaky test (out of scope, not caused by this task)

**Test:** `tests/e2e/homepage-wordmark-peek.spec.ts:240` — "carousel wordmark mirrored-peek commit (quick-260727-iao) › FR: right-edge commit — seam slides continuously to the incoming extreme, has-wordmark-photo never drops"

**Observed:** Failed 1/1 on a full-suite run, then 3/6 on a targeted `--repeat-each=3` rerun (chromium project only). Failure is a timing-sensitive assertion on carousel drag-seam interpolation values (`samples.some((s) => s.seam > 0 && s.seam < 1)` / monotonic-trend checks), unrelated to any Éditions/header code.

**Why out of scope:** This task touches only `src/components/EditionsOverviewBody.astro` (the Éditions overview header). `homepage-wordmark-peek.spec.ts` exercises the homepage hero carousel (a completely different component, `HomeCarousel.astro`), which this task did not modify. The flakiness pattern (passes and fails across repeated identical runs with no code change in between) indicates a pre-existing timing race in that test/component, not a regression introduced here.

**Action taken:** None — per scope boundary rules, out-of-scope failures in unrelated files are logged here, not fixed, to avoid unrelated changes/rebuilds hunting for unrelated bugs.

**Recommendation:** Track separately as its own quick task / bug report if it continues to flake in CI.
