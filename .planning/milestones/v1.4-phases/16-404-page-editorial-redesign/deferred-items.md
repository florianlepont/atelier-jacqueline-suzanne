# Deferred Items — Phase 16

## Cross-phase regression discovered during Wave 1 post-merge gate (2026-07-29) — RESOLVED 2026-07-29

- `tests/e2e/site-header.spec.ts` — 4 failures, all on `/about/` at narrow/mid viewports (320px, 360px, 767px): page `scrollWidth` exceeds `innerWidth` (370px / 1436px received vs the viewport width expected), tripping the shared header's "single row, no horizontal overflow" assertion.
- **Confirmed unrelated to Phase 16**: neither 16-01 (`src/lib/pop-rate.ts`) nor 16-02 (`src/pages/404.astro`) touches the About page or `SiteHeader.astro`. `git log` confirms `site-header.spec.ts` was last modified in Phase 13/quick-task work, and `AboutPageBody.astro` was last modified by Phase 15 commits — this predates Phase 16 entirely.
- **Root cause (found post-merge, once CI ran on `main`): a shared `PageTitleHeader.astro` bug, not About-specific.** Two independent overflow sources, both in the component used by About/Contact/Éditions alike:
  1. `.page-title-header h1` had `white-space: nowrap` with a 64px font-size floor that doesn't shrink further on narrow phones — any heading longer than roughly "Contact" (About's "À propos"/"About") overflowed horizontally below ~370-400px. Confirmed all three consumer pages overflowed at 320px, just by different margins; About and Contact both still overflowed at 360px.
  2. `.page-title-header__halftone`'s intentional `-700px` bleed (meant to fade edgelessly) was never actually contained horizontally on any page — the top-of-file comment claiming "Contact has its own scoped containment fix" was stale/never-implemented (confirmed via `grep` — no such rule exists in `ContactPageBody.astro`). All three pages overflowed identically (1436px) at >=760px viewports.
- **Fixed**: removed `white-space: nowrap` from `.page-title-header h1` (titles now wrap to 2 lines on narrow viewports instead of overflowing); added a site-wide `overflow-x: hidden` to `html, body` in `BaseLayout.astro` (clips any element's horizontal bleed past the viewport, without touching Éditions' intentional *vertical* halftone bleed or any component's normal layout). Verified zero overflow across About/Contact/Éditions/homepage/404 at 320/360/767px, both locales. Full e2e suite green (255-256/261, remaining failures reproduced as flaky/unrelated to this fix on re-run).
- Triggered by a live CI failure on `main` after the v1.4 PR merged (GitHub Actions run `30467173706`) — this was previously invisible because no test exercised `/about/`'s full-page `scrollWidth` before Phase 13's gap-closure test, and no test ever checked `/contact/`/`/editions/` this way at all.

## 16-02

- `tests/unit/dashboard-logic.test.ts` fails with `Cannot find package '@sanity/icons/BulbOutline'`
  when running `npm run test:unit` in this worktree. Pre-existing, out of scope for this plan
  (touches `sanity/editorial/dashboardLogic.ts`, not `src/pages/404.astro` or either e2e spec
  this plan modifies). Root cause appears to be the `sanity/` subproject's own dependencies
  (`npm ci --prefix sanity`) not being installed in this worktree, not a regression introduced
  by this plan's changes. Not fixed per the executor's scope-boundary rule (only auto-fix issues
  directly caused by the current task's changes).
