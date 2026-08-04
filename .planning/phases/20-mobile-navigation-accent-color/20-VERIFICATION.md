---
phase: 20-mobile-navigation-accent-color
verified: 2026-08-04T12:55:00Z
status: human_needed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open and close the mobile nav panel on a real phone-width viewport in both Chromium and Safari/WebKit and judge whether the 220ms open/close transition reads as deliberate rather than instant in both engines, and confirm it is instant (no rotation/fade) under prefers-reduced-motion: reduce."
    expected: "The panel fades/slides in and the hamburger morphs to an X at matching timing in both engines; under reduced motion it opens/closes instantly with no animation."
    why_human: "Subjective motion-feel judgment. Automated coverage (tests/e2e/mobile-nav.spec.ts's 11-test behaviour block plus the cross-engine tests/e2e/critical.smoke.spec.ts test, independently re-run during this verification and green under both chromium and webkit-mobile) proves the mechanism fires correctly and CSS/timing values are present, but cannot judge whether the motion 'reads as deliberate' the way a human eye would. 20-VALIDATION.md scopes this explicitly as Manual-Only."
  - test: "Compare the open panel on a real device against .planning/phases/20-mobile-navigation-accent-color/20-mobile-menu-reference.png for logo position, hamburger-to-X placement, big stacked list style, the small secondary bottom line, and the corner halftone accent."
    expected: "Visual layout matches the reference's intent (not pixel-identical, since the reference is a different site's mockup)."
    why_human: "Subjective visual-fidelity judgment against a design reference image. This verifier captured screenshots of the closed (hamburger, logo, mode-toggle) and open (logo top-left, X top-right, centered stacked Éditions/À propos/Contact/EN list, Instagram secondary line bottom-center, halftone dot texture top-right) states at 393x852 and confirmed a close structural match to the reference's composition, but final aesthetic sign-off is a human call."
  - test: "Reload the homepage several times on a phone-width viewport and confirm the starting accent colour visibly differs across reloads."
    expected: "Different reloads show visibly different accent colours, each drawn from the site's existing 5-value HERO_COLORS palette."
    why_human: "20-VALIDATION.md's Manual-Only table scopes the visible/subjective version of this check as human-only, even though this verifier independently re-ran tests/e2e/homepage-accent-random.spec.ts (forced-lowest/forced-highest Math.random stubs proving both palette endpoints are reachable, plus an unstubbed multi-reload membership check) and it passed, deterministically proving the underlying mechanism without relying on human visual sampling."
---

# Phase 20: Mobile Navigation & Accent Color Verification Report

**Phase Goal:** On phone-width viewports, the homepage header becomes a self-contained nav menu (hamburger or similar) with the language switcher folded inside it, and each visit shows a randomly-picked accent color drawn from the existing per-gallery `heroColor` values — desktop/tablet header and accent-color behavior stay completely unchanged.
**Verified:** 2026-08-04T12:55:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | At phone width, the homepage's desktop header bar is replaced by a hamburger/menu control that opens to reveal the nav links | ✓ VERIFIED | Re-ran `tests/e2e/mobile-nav.spec.ts` (49 tests) live against a fresh build on an isolated port — all pass. Code-read confirms `SiteHeader.astro`'s `mobileNav` prop renders a `>=44x44` hamburger (`data-role="mobile-nav-toggle"`) that hides `.site-nav`/inline switcher and reveals only the toggle below 768px. Captured screenshots at 393x852: closed state shows logo + mode-toggle + hamburger only; clicking the hamburger opens a full-screen `dialog#mobile-nav` with the 3 primary links, switcher, and Instagram line — visually matching the reference composition. Behaviour (open, focus containment, Escape/X/dialog-click close, viewport-crossing auto-close, glyph morph) independently re-verified live: 11/11 behaviour tests + the dedicated cross-engine smoke test pass under both `chromium` and `webkit-mobile`. |
| 2 | The language switcher is reachable from inside that mobile menu on the homepage at phone widths, not shown inline as it is on desktop | ✓ VERIFIED | `SiteHeader.astro`'s `@media (max-width: 767px) { .site-header[data-mobile-nav='true'] > .language-switcher { display: none; } }` hides the inline instance; `MobileNavPanel.astro` renders a second `<LanguageSwitcher />` as the 4th equal-weight primary item, restyled to Display role (32px/600/Unbounded/ink) per D-04. Live-verified: `.mobile-nav-panel .switcher-link` count 1, navigates and sets the `ajs_locale` cookie (test "the panel's language switcher navigates and sets the locale cookie", passing). Screenshot of the open panel confirms the switcher (`⊕ EN`) renders as a full-size stacked item below Contact. |
| 3 | Revisiting the homepage on a phone across multiple visits shows different accent colors, each one of the existing per-gallery `heroColor` values (no new palette introduced) | ✓ VERIFIED | `pickRandomGalleryIndex()` (pure, DOM-free, unit-tested at both boundaries and `count<=0`/`count=1`) drives a one-time post-`render()` override in `HomeCarousel.astro` of `--current-accent`/`--current-accent-text`/`accentPanel.style.color`, sourced only from `galleries[randomIndex].heroColor`/`heroTextColor` (already-normalised via `normalizeHeroColor()`) with an `ACCENTS[]` fallback — no second, unvalidated colour path. Re-ran `tests/e2e/homepage-accent-random.spec.ts` live: forced-lowest (`Math.random=0`) starts on gallery 0's own colour, forced-highest (`Math.random=0.999`) starts on the last gallery's colour and differs from gallery 0's, an unstubbed reload proves every observed `--current-accent` is a member of the page's own `data-hero-color` set, gallery 0's photo/title/index/dashes still lead regardless of the random pick (D-05), and per-gallery accent tracking after the first carousel advance is unchanged. Built `dist/index.html` confirms the SSR value matches gallery 0's own `heroColor` (`#A6FD29`), i.e. the random pick is client-side only, never baked at build time. |
| 4 | On tablet/desktop viewports, the homepage header bar, language switcher placement, and accent-color behavior are pixel-for-pixel and behaviorally unchanged from the pre-milestone (Phase 19) state | ✓ VERIFIED | `src/layouts/BaseLayout.astro`'s `<SiteHeader>` call site never passes `mobileNav` (`grep -c 'mobileNav' src/layouts/BaseLayout.astro` = 0); the prop resolves `false` and `data-mobile-nav` is entirely omitted from the DOM (Astro drops `undefined` attributes) on every non-homepage page and at every homepage width >=768px. Re-ran the plan-02 regression net (17 tests: inertness sweep across About/Contact both locales, a gallery detail page, Éditions overview, a dynamically-discovered édition detail page, plus a homepage-desktop-unchanged block using `toBeHidden()`) — all pass. `tests/e2e/visual.spec.ts`'s `shared-site-header.png` snapshot (taken on `/about/`) re-ran and passed with `git status --porcelain tests/e2e/visual.spec.ts-snapshots/` empty — the shared header is pixel-identical, not merely structurally similar. `site-header.spec.ts`'s realigned single-row-fit sweep (phone widths scoped to `/about/`, `>=768px` scoped to the homepage, with non-zero-height guards closing a prior vacuous-pass hole) also passes. |

**Score:** 4/4 ROADMAP success criteria verified (0 present-but-behavior-unverified)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| HOME-13 | 20-02, 20-03, 20-04, 20-05 | Visitor sees a mobile nav menu (hamburger or similar) on the homepage instead of the desktop header bar, with the language switcher inside it, on phone-width viewports only | ✓ SATISFIED | REQUIREMENTS.md marks HOME-13 complete under Phase 20. SC #1/#2 evidence above; markup+behaviour+halftone+mobile-viewport axe coverage (4 new tests in `accessibility.spec.ts`, re-run live: closed header and open panel both axe-clean, serious/critical severity, both locales, no rule exclusions). |
| HOME-16 | 20-01, 20-05 | Visitor on a phone sees a different accent color each visit, randomly picked from the existing per-gallery `heroColor` values | ✓ SATISFIED | REQUIREMENTS.md marks HOME-16 complete under Phase 20. SC #3 evidence above; a combined cross-check test ties HOME-13 (hamburger visible) and HOME-16 (`--current-accent` is a real hero colour) together in one homepage state (re-run live, passing). |

No orphaned requirements: REQUIREMENTS.md maps only HOME-13/HOME-16 to Phase 20, and both are claimed across the 5 plans' frontmatter.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/lib/home-carousel.ts` — `pickRandomGalleryIndex()` | Pure, DOM-free helper | ✓ VERIFIED | Present, exported, zero imports, unit-tested (8 cases, re-run live: 47/47 across both unit files). |
| `src/components/HomeCarousel.astro` — accent override | Post-`render()` override of `--current-accent`/text/panel colour only | ✓ VERIFIED | Present at the documented location; `carouselIndex`/`heroImg`/`titleEl`/`indexLabel`/`progressDashes` untouched (confirmed via the D-05 e2e assertion). |
| `src/components/MobileNavPanel.astro` | Full-screen `<dialog>` panel, sibling of `<header>` | ✓ VERIFIED | Present; zero `nav-link` class occurrences, zero nested `<header>`, zero own `<style>` block; client script owns open/close via native `showModal()`/`cancel` event, one filtered `transitionend` close funnel, a 400ms safety-net timer, a viewport-crossing auto-close guard (with the post-review `offsetParent` focus guard applied). |
| `src/components/SiteHeader.astro` — `mobileNav` prop + CSS | Opt-in, inert when omitted | ✓ VERIFIED | `mobileNav?: boolean` defaults `false`; `data-mobile-nav` omitted entirely when absent; all new CSS lives inside the pre-existing single `is:global` block (no second style block, no `:global()` wrapper); halftone/motion/structural CSS all present and wired. |
| `tests/e2e/mobile-nav.spec.ts` | Regression net + structural/behaviour/halftone/phase-gate blocks | ✓ VERIFIED | 49 tests, all re-run live and passing. |
| `tests/e2e/homepage-accent-random.spec.ts` | Deterministic accent e2e | ✓ VERIFIED | 6 tests, re-run live and passing (the flaky real-RNG distinctness assertion was removed per the post-merge WR-03 fix — the remaining membership/D-05/post-advance assertions are deterministic). |
| `tests/e2e/accessibility.spec.ts` | Mobile-viewport axe coverage | ✓ VERIFIED | 4 new tests (2 paths x 2 states) re-run live and passing, no rule exclusions. |
| `tests/e2e/critical.smoke.spec.ts` | Cross-engine close-path smoke test | ✓ VERIFIED | Re-run live under both `chromium` and `webkit-mobile` — 10/10 passing. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `HomeCarousel.astro`'s `<SiteHeader>` call site | `mobileNav={true}` | opt-in prop | ✓ WIRED | Confirmed by grep and live render. |
| `BaseLayout.astro`'s `<SiteHeader>` call site | (no `mobileNav`) | omission | ✓ WIRED (correctly inert) | `grep -c 'mobileNav' src/layouts/BaseLayout.astro` = 0. |
| Hidden `data-hero-color`/`data-hero-text-color` attributes | `pickRandomGalleryIndex()` → `style.setProperty('--current-accent', ...)` | the one accent-writing path | ✓ WIRED | No second/unvalidated colour source found in `HomeCarousel.astro` or `site-config.ts`. |
| `SiteHeader.astro`'s hamburger (`aria-controls="mobile-nav"`) | `MobileNavPanel.astro`'s `dialog#mobile-nav` | `data-role` hooks + native dialog API | ✓ WIRED | Open/close/focus-restore/viewport-guard all exercised live. |

### Post-Merge Fixes (independently re-verified, not merely trusted from SUMMARY/REVIEW claims)

| Fix | Verification performed | Result |
|---|---|---|
| WCAG contrast nudge, `HERO_COLORS.purple` `#AF3DFF` → `#A73AF4` (commit `e52765b`) | Independently recomputed WCAG relative-luminance contrast in Node for both hex values against white. Confirmed `#A73AF4` in `src/lib/site-config.ts`, `src/layouts/BaseLayout.astro`, `sanity/schemas/HeroColorInput.tsx`, and `tests/unit/site-config.test.ts`; no stray `#AF3DFF` in the source tree. | `#AF3DFF` vs white = 4.256:1 (fails 4.5:1 AA); `#A73AF4` vs white = 4.611:1 (passes). Fix is real and correctly propagated everywhere. |
| WR-01 — `normalizeHeroColor` `in` → `hasOwnProperty` (commit `424c071`) | Read `src/lib/site-config.ts:56` directly. | `Object.prototype.hasOwnProperty.call(HERO_COLORS, value)` confirmed in source — inherited-key false-positive class closed. |
| WR-02 — focus-on-hidden-toggle guard in `MobileNavPanel.astro`'s `close` handler | Read the `close` event handler directly; re-ran the "crossing to a desktop viewport closes an open panel" test live (passes). | `if (toggle!.offsetParent !== null) toggle!.focus();` confirmed present. |
| WR-03 — removed flaky real-RNG distinctness assertion from `homepage-accent-random.spec.ts` | Grepped the file for the removed assertion pattern; re-ran the spec live 1x (deterministic pass, no flake risk from the removed assertion). | Confirmed absent; remaining assertions are deterministic. |
| IN-01 — distinct `aria-label` on the dialog vs. its child `<nav>` | Read `MobileNavPanel.astro`'s markup directly. | Dialog now labeled `siteTitle`, `<nav>` still labeled `menuLabel` ("Menu") — no duplicate landmark name. |

### Behavioral Spot-Checks / Live Re-Execution (this verification, not SUMMARY claims)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | 0 errors |
| Unit tests | `npx vitest run` | 284/284 passing |
| Coverage | `npx vitest run --coverage` | 95.04% stmts / 90.01% branch / 96.73% funcs / 95.9% lines — well above the 70/65/70/70 gate |
| Build | `npm run build` | Succeeds; SSR `--current-accent` in `dist/index.html` matches gallery 0's own `heroColor` (`#A6FD29`), confirming the random pick is client-side only |
| `tests/e2e/mobile-nav.spec.ts` | `npx playwright test ... --project=chromium` (isolated port, fresh worktree build) | 49/49 passing |
| `tests/e2e/homepage-accent-random.spec.ts` + `tests/e2e/accessibility.spec.ts` | same | 21/21 passing |
| `tests/e2e/visual.spec.ts` | same | 2/2 passing; snapshot directory git-clean (not re-baselined) |
| `tests/e2e/critical.smoke.spec.ts` | both `chromium` and `webkit-mobile` projects | 10/10 passing |
| Realigned/pre-existing specs (`site-header`, `homepage-chrome-nav`, `homepage-mobile-responsive`, `i18n`, `homepage-carousel-core`, `page-title-header-bleed`) | chromium | 97/97 passing |
| Full local e2e suite, both Playwright projects | `npx playwright test` (isolated port) | 370/370 passing in this run — the previously-documented pre-existing `tests/e2e/edition.spec.ts` image-loading-timing flake (unrelated file, out of this phase's scope, per `deferred-items.md`) did not reproduce in this run; consistent with its documented intermittent nature under concurrent-session load |
| Homepage screenshots at 393x852 | Playwright screenshot, closed and open states | Closed: logo + mode-toggle + hamburger only, no inline nav/switcher. Open: logo top-left, X top-right, halftone dot texture top-right, centered stacked Éditions/À propos/Contact/⊕EN list, Instagram handle secondary line near bottom — structurally matches `20-mobile-menu-reference.png`'s composition |

### Anti-Patterns Found

None found in the phase's modified files (`src/components/SiteHeader.astro`, `src/components/MobileNavPanel.astro`, `src/components/HomeCarousel.astro`, `src/lib/home-carousel.ts`, `src/lib/site-config.ts`) — no `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers, no stub returns, no hardcoded-empty props feeding user-visible output.

### Deferred Items

None — no gap identified in this phase required deferral to a later phase.

### Human Verification Required

Three items, all explicitly scoped as Manual-Only in `20-VALIDATION.md` and deferred to end-of-phase per this project's `workflow.human_verify_mode: end-of-phase` setting (visible in 20-05-PLAN.md's Task 3 `<human-check>` block). Automated re-execution during this verification independently confirms the underlying mechanisms are correct and wired; what remains is subjective human sign-off on feel/fidelity:

1. **D-03 motion feel across engines** — Open/close the mobile nav on a real phone-width viewport in both Chromium and Safari/WebKit; confirm the 220ms transition reads as deliberate (not instant/jarring) in both, and confirm it's instant under `prefers-reduced-motion: reduce`.
2. **Visual fidelity against the reference image** — Compare the open panel against `20-mobile-menu-reference.png` for logo position, hamburger-to-X placement, list style, secondary line, and halftone accent.
3. **Visibly different accent colours across reloads** — Reload the homepage several times on a phone-width viewport and confirm a human can see the starting accent colour differ.

### Gaps Summary

No gaps. All 4 ROADMAP success criteria are independently re-verified against the live codebase (not merely SUMMARY.md claims), both requirement IDs (HOME-13, HOME-16) are satisfied with supporting evidence, all 5 code-review findings from the post-merge review (the WCAG contrast fix plus WR-01/WR-02/WR-03/IN-01) are confirmed landed in source, the full local test suite (unit + e2e across both Playwright projects) passes, and coverage exceeds every threshold. The only open items are the three subjective, explicitly-deferred human-judgment checks the phase's own plans scoped as Manual-Only — these route to `human_needed` per the verification decision tree, not to any code gap.

---

_Verified: 2026-08-04T12:55:00Z_
_Verifier: Claude (gsd-verifier)_
