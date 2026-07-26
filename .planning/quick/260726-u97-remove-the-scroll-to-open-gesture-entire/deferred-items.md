# Deferred Items — quick-260726-u97

Out-of-scope items observed during execution but not fixed here, per the
scope-boundary rule (only auto-fix issues directly caused by this task's own
changes).

## Pre-existing, unrelated `tests/unit/dashboard-logic.test.ts` failure

`npm run test:unit` fails to load `tests/unit/dashboard-logic.test.ts`:

```
Error: Cannot find package '@sanity/icons' imported from
sanity/editorial/dashboardLogic.ts
```

This is caused by a missing dependency in the separate `sanity/` subproject
(not installed in the root `node_modules`), unrelated to any file touched by
this task (`src/components/HomeCarousel.astro`, `src/lib/home-carousel.ts`,
`tests/unit/home-carousel.test.ts`, `tests/e2e/homepage.spec.ts`). The plan's
own `<verification>` section flagged this as an expected, pre-existing gap
that "may appear" and explicitly said not to fix it here.

All other unit tests pass: 119/119 (13/14 test files; only
`dashboard-logic.test.ts` fails to load).

**Update (during the mobile-cursor CSS fix follow-up, same session):** re-running
`npm run test:unit` after some background dependency resolution (not caused by
this task's own changes — `sanity/node_modules/@sanity/icons` is now present,
whereas it was missing during Task 1-5 verification) shows this file now
loads and passes: 154/154 tests across all 14 files. Leaving this note for
traceability rather than deleting it — the gap was real and pre-existing at
the time the plan's own `<verification>` section anticipated it, and its
resolution is unrelated to any file this task modified.
