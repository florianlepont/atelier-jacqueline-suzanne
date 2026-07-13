# Deferred Items — Phase 07 Plan 01

Out-of-scope issues discovered while running the full e2e suite during 07-01
execution (Instagram nav link + square mode-toggle box). None of these are
caused by this plan's changes — confirmed via `git stash` re-run against the
pre-change `HomeCarousel.astro` (homepage.spec.ts) and by inspection (the
about/i18n/legal specs touch files this plan never modifies).

## 1. Astro Dev Toolbar causes strict-mode `locator('header')`/`locator('h1')` violations

- **Where:** `tests/e2e/i18n.spec.ts`, `tests/e2e/about.spec.ts`,
  `tests/e2e/legal.spec.ts`, and one test in `tests/e2e/homepage.spec.ts`
  (`i18n non-regression guard`).
- **Symptom:** `locator('header')` / `locator('h1')` resolve to 5-7 elements
  instead of 1 — the extra matches are all Astro Dev Toolbar overlay markup
  ("Featured integrations", "No islands detected.", "Audit", "Settings").
- **Likely cause:** Astro's dev toolbar client script is present in the
  `npm run preview` server used by the Playwright `webServer` config in this
  local environment, injecting its own `<header>`/`<h1>` elements into every
  page.
- **Not fixed here:** unrelated to HOME-04/HOME-05; scoped to shared
  layout/tooling config, not `HomeCarousel.astro`.

## 2. Content-migration drift in homepage carousel/grid order assertions

- **Where:** `tests/e2e/homepage.spec.ts` — "carousel root renders and shows
  the first migrated gallery" and "unmigrated galleries never appear".
- **Symptom:** Test expects `/silos/i` as the first carousel slide and
  expects "victorian tea room" to be absent from the grid; live Sanity
  content now has more migrated galleries (including "The Victorian Tea
  room") and a different gallery order ("Paysage" first).
- **Likely cause:** Real content changes made directly in Sanity Studio
  since these tests were written (content migration is ongoing,
  independent of this phase).
- **Not fixed here:** test data/content assertions, not a HOME-04/HOME-05
  code defect; confirmed present before this plan's changes via
  `git stash`.

Both categories were confirmed pre-existing (present with `HomeCarousel.astro`
stashed back to its pre-Plan-07-01 state) and are out of this plan's scope
per the executor's scope-boundary rule.
