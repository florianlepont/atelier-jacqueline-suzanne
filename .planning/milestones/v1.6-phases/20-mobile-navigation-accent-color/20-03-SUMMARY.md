---
phase: 20-mobile-navigation-accent-color
plan: 03
subsystem: ui
tags: [astro, dialog, mobile-nav, site-header, home-13]

# Dependency graph
requires:
  - phase: 20-mobile-navigation-accent-color (plan 01)
    provides: "pickRandomGalleryIndex()/HOME-16 random starting accent, unaffected by this plan"
  - phase: 20-mobile-navigation-accent-color (plan 02)
    provides: "tests/e2e/mobile-nav.spec.ts regression net (inertness sweep, homepage-desktop-unchanged net, client-bundle-leakage tripwire) — proven green before and after this plan's markup/CSS landed"
provides:
  - "SiteHeader.astro's opt-in `mobileNav` prop (default false): data-mobile-nav attribute, last-child hamburger toggle, locale-derived open/close/menu copy — inert for every caller that omits it"
  - "New MobileNavPanel.astro: the full-screen <dialog id=\"mobile-nav\"> markup (duplicated logo + close button, D-04 primary list of Éditions/About/Contact/LanguageSwitcher, Instagram secondary line), rendered as a sibling of <header>, never a descendant"
  - "HomeCarousel.astro's single <SiteHeader> call site opts in (mobileNav={true}); BaseLayout.astro's call site is untouched"
  - "Structural CSS in SiteHeader.astro's existing is:global block: hamburger/3-bar glyph, phone-only nav-row/switcher hide + toggle reveal gated on [data-mobile-nav='true'], Lightbox-style full-viewport dialog shell, Display-role primary list in ink, Label-role secondary line, a plain (non-:global()) LanguageSwitcher override proving the block's own is:global status already suffices"
  - "17 new e2e tests in tests/e2e/mobile-nav.spec.ts asserting the homepage's positive mobile-nav structural contract (hamburger a11y attrs/tap target, sibling dialog placement, D-04 contents, zero selector collisions, Display/Label typography+color, mode-toggle still ships, no overflow) plus a positive desktop-inert test"
affects: [20-04-mobile-nav-open-close-behavior, 20-05-mobile-nav-halftone-accent]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Opt-in boolean prop on a shared per-page-regression-hotspot component (SiteHeader.astro), gated end-to-end: no prop -> no attribute -> no CSS match -> no extra markup rendered — the established D-01 inertness contract"
    - "Duplicated toggle/logo affordance inside a <dialog>'s own markup (Pattern 3) to survive top-layer stacking once plan 20-04 calls showModal() — one shared 3-bar glyph class drives both the header hamburger and the in-panel close button"
    - "Cross-component style override inside an ALREADY is:global <style> block uses a PLAIN selector, not :global(...) — the wrapper is a no-op once the whole block is unscoped; the two pre-existing .switcher-link overrides already proved this before this plan touched the file"

key-files:
  created:
    - src/components/MobileNavPanel.astro
  modified:
    - src/components/SiteHeader.astro
    - src/components/HomeCarousel.astro
    - tests/e2e/mobile-nav.spec.ts

key-decisions:
  - "menuLabel resolves to the single literal string 'Menu' for both locales (no FR translation), and openMenuLabel/closeMenuLabel are locale-derived directly in SiteHeader.astro via Astro.currentLocale, per the plan's explicit copy contract and LanguageSwitcher.astro's own in-repo precedent for a component deriving its own locale copy rather than receiving it as a prop"
  - "Removed :global() wrappers from the new .mobile-nav-panel .switcher-link/.language-switcher override rules after first drafting them per 20-UI-SPEC.md's illustrative code example — the PLAN's own Task 2 action text explicitly forbids the wrapper inside an already-is:global block (redundant no-op); the plan is authoritative over the UI-SPEC's illustrative example for implementation mechanics"
  - "Reworded two comments (in SiteHeader.astro and MobileNavPanel.astro) that quoted the literal substrings '<style' and 'nav-link' inside prose explaining why those exact patterns must be avoided — the literal quoting caused this plan's own acceptance-criteria grep checks to false-positive; reworded to describe the constraint without quoting the forbidden string, mirroring plan 20-02's own documented self-correction for the identical class of issue"
  - "No motion/transition/@starting-style/transform/halftone rule was added in this plan, per its own explicit instruction — open/close behavior lands in plan 20-04, the halftone accent in plan 20-05"

patterns-established:
  - "For a plan split across markup (Task 1) + CSS (Task 2) on the same opt-in prop, the plan's own regression net is expected to be red for the specific behavior the CSS half hasn't landed yet (here: the homepage-desktop-unchanged net, since the un-styled <button> defaults to visible) — the correct check is the net's SCOPED subset relevant to the completed task, not the whole net, until the sibling task lands"

requirements-completed: []  # HOME-13 is not complete after this plan alone — open/close interactivity (plan 20-04) is still required before the feature is usable; this plan delivers markup+structural CSS only.

coverage:
  - id: D1
    description: "SiteHeader.astro's mobileNav prop is fully inert for every existing caller (BaseLayout.astro) — no data-mobile-nav attribute, no dialog, no toggle, unchanged client-bundle script count on /about/ and /contact/"
    verification:
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts (pre-existing 20-02 net blocks) — chromium project, 15/15 relevant tests pass"
        status: pass
    human_judgment: false
  - id: D2
    description: "The homepage renders a >=44x44 hamburger toggle (replacing the inline nav row + inline language switcher) at phone width, and a closed dialog#mobile-nav that is a sibling of <header>, holding 3 primary links + LanguageSwitcher + 1 Instagram secondary line, with zero selector collisions against pre-existing header-scoped specs"
    verification:
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts 'Phase 20 — homepage mobile nav structure' describe block (17 tests) — chromium project, all pass"
        status: pass
    human_judgment: false
  - id: D3
    description: "Primary list + language switcher render at Display role (32px/600/Unbounded/ink); secondary Instagram line renders at Label role (14px/400) with a 48px bottom margin; every other page's header (About/Contact/gallery/édition/homepage desktop) is pixel-identical to before this plan"
    verification:
      - kind: e2e
        ref: "tests/e2e/mobile-nav.spec.ts (Display/Label typography tests) + tests/e2e/visual.spec.ts 'shared site header' snapshot — chromium project, all pass, snapshot not re-baselined"
        status: pass
    human_judgment: false

# Metrics
duration: ~25min
completed: 2026-08-04
status: complete
---

# Phase 20 Plan 03: Mobile Nav Markup & Structural CSS Summary

**Opt-in `mobileNav` prop on `SiteHeader.astro` plus a new `MobileNavPanel.astro` full-screen `<dialog>` — hamburger toggle, D-04 two-tier contents, Lightbox-style sizing, Display-role primary list — rendered only on the homepage, with the CSS wired inline into the existing `is:global` sheet (no `:global()` wrapper, no second style block).**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-04T10:05:00Z (approx., first read after wave-1 tracking commit)
- **Completed:** 2026-08-04T10:22:00Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- `SiteHeader.astro` gained an opt-in `mobileNav?: boolean` prop (default `false`), a `data-mobile-nav` attribute that Astro omits entirely when the prop is absent, and a last-child hamburger `<button>` — fully inert for every existing/future caller that doesn't pass the prop.
- New `src/components/MobileNavPanel.astro`: the full-screen `<dialog id="mobile-nav">` panel, always rendered as a sibling of `<header data-role="site-header">` (never a descendant), holding a duplicated logo + close button, the D-04 primary list (Éditions/About/Contact/LanguageSwitcher), and the Instagram secondary line — zero `nav-link`-class elements, zero nested `<header>`, zero styles or scripts of its own.
- `HomeCarousel.astro` passes `mobileNav={true}` at its single `<SiteHeader>` call site; `BaseLayout.astro`'s call site remains untouched.
- Structural CSS added entirely inside `SiteHeader.astro`'s existing `is:global` block: the hamburger + shared 3-bar glyph (unconditional `display: none` base state), a new phone-only `@media (max-width: 767px)` block gated on `[data-mobile-nav='true']` that hides `.site-nav`/the inline switcher and reveals the toggle, the Lightbox-style full-viewport `.mobile-nav-panel` shell, Display-role primary list styling in ink, and a Label-role secondary-line style. The `LanguageSwitcher` override uses a plain selector (no `:global()` wrapper) since the whole block is already unscoped.
- 17 new e2e tests appended to `tests/e2e/mobile-nav.spec.ts`, proving the homepage's positive structural contract for both `/` and `/en/` plus one positive desktop-inert test — full spec file now 34 tests, all green.
- Full local suite verified green: `npm run typecheck` (0 errors), `npx vitest run` (284/284), `npx playwright test` chromium (345/345) + webkit-mobile smoke (4/4) — 349 total.

## Task Commits

1. **Task 1: Add the mobileNav prop, the hamburger, and the MobileNavPanel component** - `806541a` (feat)
2. **Task 2: Structural CSS — full-screen panel, phone-only nav swap, Display-role list, ink switcher override** - `bd75ce4` (feat)
3. **Task 3: Homepage structural e2e block** - `8c4eee9` (test)

**Plan metadata:** pending (this SUMMARY's own commit)

## Files Created/Modified

- `src/components/MobileNavPanel.astro` - New full-screen `<dialog>` panel: duplicated logo/close, D-04 primary list, Instagram secondary line
- `src/components/SiteHeader.astro` - `mobileNav` prop, `data-mobile-nav` attribute, hamburger button, `MobileNavPanel` render call, and all `.mobile-nav*`/`.mobile-nav-panel*` CSS inside the existing `is:global` block
- `src/components/HomeCarousel.astro` - `mobileNav={true}` at its single `<SiteHeader>` call site
- `tests/e2e/mobile-nav.spec.ts` - New "Phase 20 — homepage mobile nav structure" describe block (17 tests) + one positive desktop test

## Decisions Made

- `menuLabel` resolves to the literal string `'Menu'` for both locales (per the plan's explicit copy contract); `openMenuLabel`/`closeMenuLabel` are locale-derived in `SiteHeader.astro` via `Astro.currentLocale`, following `LanguageSwitcher.astro`'s own in-repo precedent for locale-derived component copy.
- Removed `:global()` wrappers from the new `.mobile-nav-panel .switcher-link`/`.language-switcher` override rules after first drafting them per 20-UI-SPEC.md's illustrative code example — the PLAN's own Task 2 text explicitly forbids the wrapper inside an already-`is:global` block (it would be a redundant no-op); the plan's implementation-mechanics instruction takes precedence over the UI-SPEC's illustrative snippet.
- Reworded two comments (in `SiteHeader.astro` and `MobileNavPanel.astro`) that quoted the literal substrings `<style` and `nav-link` while explaining why those exact patterns must be avoided — the literal quoting caused this plan's own acceptance-criteria `grep -c` checks to false-positive (counting the comment, not real usage). Reworded to describe the constraint without quoting the forbidden string, mirroring plan 20-02's own documented self-correction for the identical issue class.
- No motion/transition/`@starting-style`/`transform`/halftone rule was added, per the plan's explicit instruction — open/close interactivity is plan 20-04's job, the halftone accent is plan 20-05's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fresh worktree missing `.env` and installed dependencies**
- **Found during:** pre-Task-1 setup (build/typecheck would fail without it)
- **Issue:** This worktree had no `node_modules` (root or `sanity/`) and no `.env` — untracked/gitignored files aren't carried into new worktrees, matching the exact issue plan 20-02's SUMMARY already documented for this same worktree lineage.
- **Fix:** Copied the main checkout's git-ignored `.env` into the worktree; ran `npm ci` (root) and `npm ci --prefix sanity` — both materialize already-lockfile-pinned dependencies, not new/unverified packages, so this is routine worktree setup rather than a package-legitimacy concern.
- **Files modified:** none tracked (`.env` is gitignored; `node_modules` is gitignored)
- **Verification:** `npm run build`, `npm run typecheck`, and `npx vitest run` all succeed afterward.
- **Committed in:** n/a (no tracked files changed)

**2. [Rule 3 - Blocking] Port 4321 occupied by a concurrent session**
- **Found during:** Task 1 verification (first Playwright run)
- **Issue:** A concurrent session's `astro dev` process on the main checkout already held port 4321; Playwright's `reuseExistingServer` (true outside CI) would have silently served that stale/foreign process instead of this worktree's own build — the exact known pitfall flagged for this phase.
- **Fix:** Used a temporary, untracked, never-committed `playwright.local.config.ts` bound to port 4997 with `reuseExistingServer: false` for every verification run in this plan; deleted before each commit and confirmed absent via `git status --porcelain` before every commit.
- **Files modified:** none tracked (temp config never committed)
- **Verification:** `git status --porcelain` shows no `playwright.local.config.ts` at any commit point in this plan.
- **Committed in:** n/a (no tracked files changed)

**3. [Rule 1 - Bug/self-correction] Two comments' literal substrings tripped this plan's own acceptance-criteria grep checks**
- **Found during:** Task 1 and Task 2 acceptance-criteria verification
- **Issue:** A file-header comment in `MobileNavPanel.astro` quoting `nav-link` and `<style>` while explaining those exact patterns must be avoided caused `grep -c 'nav-link'`/`grep -c '<style'` to return 1 instead of the required 0; the same issue recurred in `SiteHeader.astro` for `:global()` and `<style>` inside explanatory comments.
- **Fix:** Reworded each comment to describe the constraint without quoting the literal forbidden substring (e.g. "carries no styles of its own" instead of "no `<style>` block").
- **Files modified:** `src/components/MobileNavPanel.astro`, `src/components/SiteHeader.astro`
- **Verification:** All four grep-based acceptance criteria (`nav-link` in MobileNavPanel.astro, `<style` in both files, `:global(` in SiteHeader.astro) now return the required counts.
- **Committed in:** `806541a` (Task 1), `bd75ce4` (Task 2)

---

**Total deviations:** 3 auto-fixed (2 blocking/environment, 1 self-correction on literal-string acceptance checks)
**Impact on plan:** None affect the shipped feature's behavior. The environment fixes (`.env`, `node_modules`, local Playwright port) are routine worktree setup, not code changes. The comment rewording only changes prose, not logic or CSS.

## Issues Encountered

- `npx vitest run` initially failed one unrelated suite (`tests/unit/dashboard-logic.test.ts`, missing `@sanity/icons/BulbOutline`) because the `sanity/` subproject's `node_modules` wasn't installed in this fresh worktree — resolved by `npm ci --prefix sanity` (see Deviation 1 above); all 284 unit tests pass afterward.
- The homepage-desktop-unchanged net in `tests/e2e/mobile-nav.spec.ts` (from plan 20-02) failed after Task 1 alone, since the un-styled `<button>` hamburger defaults to visible at every width — expected sequencing, since Task 2's `display: none` base-state CSS is what fixes it. Confirmed fixed after Task 2 (all 72 tests in the Task 2 verify command pass, including this net).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 20-04 can bind its open/close `<script>` to the exact hooks shipped here: `data-role="mobile-nav-toggle"` (header button), `#mobile-nav` (the `<dialog>`, referenced by `aria-controls`), `data-role="mobile-nav-close"` (in-panel close button), and the shared `.mobile-nav__bars`/`.mobile-nav__bar` 3-bar glyph structure (present identically in both the header toggle and the panel's close button) for the hamburger↔X morph.
- Plan 20-05 can add the halftone accent directly into the `.mobile-nav-panel` box without needing to touch this plan's shell/list/secondary-line rules.
- `mobile-nav.spec.ts` now has 34 tests (17 pre-existing nets + 17 new structural tests); its `EXPECTED_SCRIPT_COUNT` tripwire (4) held unchanged.
- No blockers for plan 20-04. Same local-environment note carried from plan 20-02: verify which process is bound to `localhost:4321` before trusting default `npm run test:e2e` output in this worktree tree, since concurrent sessions are the norm on this repo.

## Self-Check: PASSED

- FOUND: `src/components/MobileNavPanel.astro`
- FOUND: `src/components/SiteHeader.astro` (mobileNav prop, hamburger, MobileNavPanel render call, CSS)
- FOUND: `src/components/HomeCarousel.astro` (mobileNav={true})
- FOUND: `tests/e2e/mobile-nav.spec.ts` (34 tests)
- FOUND: commit `806541a`
- FOUND: commit `bd75ce4`
- FOUND: commit `8c4eee9`

---
*Phase: 20-mobile-navigation-accent-color*
*Completed: 2026-08-04*
