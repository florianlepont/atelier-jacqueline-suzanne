---
phase: 07-homepage-quick-fixes-mobile-hero-correctness
verified: 2026-07-14T01:10:38Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 7: Homepage Quick Fixes & Mobile Hero Correctness Verification Report

**Phase Goal:** The homepage's header nav and mode toggle read correctly, and the mobile hero is genuinely full-bleed on first load with no visual regressions — the small, contained fixes that don't touch shared components or content models, done first so their groundwork carries forward cleanly into Phase 10's header consolidation.
**Verified:** 2026-07-14T01:10:38Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Merged from ROADMAP Success Criteria (3) and both plans' `must_haves.truths` (7, deduplicated).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor sees an Instagram icon (not text) in the homepage header nav that opens `https://www.instagram.com/ajs_romanelepont/` in a new tab with reverse-tabnabbing protection (HOME-04, roadmap SC1) | VERIFIED | `HomeCarousel.astro:111-137` renders `<a href="https://www.instagram.com/ajs_romanelepont/" target="_blank" rel="noopener noreferrer" aria-label="Instagram @ajs_romanelepont">` with an inline `<svg>` glyph and no visible text, after the Contact link. `DEFAULT_INSTAGRAM_URL` in `src/lib/site-config.ts:5` confirms the exact profile URL. Live-ran `homepage.spec.ts:395-462` ("Instagram nav link (HOME-04)", 5 tests) — all pass. |
| 2 | The mode-toggle button's visible border traces a square (equal width/height) in BOTH carousel and grid modes (HOME-05, roadmap SC2) | VERIFIED | `HomeCarousel.astro:862-869` — `.home-toggle__box { width: 28px; height: 28px; border: 1.5px solid currentColor; }`, mode-agnostic (no `[data-display-mode]` override on dimensions). Live-ran `homepage.spec.ts:466-501` ("square mode-toggle box (HOME-05)", 3 tests covering carousel mode, grid mode, and border/single-toggle-contract) — all pass. |
| 3 | The toggle's clickable/tappable area stays ≥44px in both dimensions even though its visible square box is smaller (D-08) | VERIFIED | `HomeCarousel.astro:845-851` — outer `.home-toggle` button has `min-height`/`min-width: var(--tap-target-min)` (`--tap-target-min: 44px` per `BaseLayout.astro:269`), border/padding removed from the outer box. Test `homepage.spec.ts:466` explicitly asserts `.home-toggle` clears the 44px floor. Pass. |
| 4 | At a 393px mobile viewport the header (logo, About, Contact, Instagram, toggle, FR\|EN) fits without horizontal page overflow (D-03) | VERIFIED | `HomeCarousel.astro:1458-1474` re-measured mobile pixel budget (gap trims documented inline). Test `homepage.spec.ts:431-445` asserts `document.documentElement.scrollWidth <= window.innerWidth` at 393px and Instagram link visibility. Pass. |
| 5 | At an iPhone mobile-emulation viewport, on first load the hero photo starts flush at the top with no white gap above the header (HOME-06, roadmap SC3) | VERIFIED | `homepage.spec.ts:556-601` ("mobile full-bleed hero regression (HOME-06)") asserts `Math.abs(headerBox.y) <= 1` and `Math.abs(photoBox.y) <= 1` under `devices['iPhone 14 Pro']` emulation, plus `photoBox.height >= viewport.height - 2`. Test passes. Code fix: `HomeCarousel.astro:1013-1016` removed the permanent, unconditional `view-transition-name: ajs-hero-morph`/`ajs-accent-panel` from `.home-hero__photo`/`.home-hero__accent`'s base CSS rules (confirmed via grep — no static `view-transition-name` declaration remains on either selector), moving the name assignment to the toggle click handler (`HomeCarousel.astro:598-599`, JS, click-time-only). |
| 6 | The site footer is not visible / does not bleed through within the initial mobile viewport before any scrolling (HOME-06) | VERIFIED | Same test (`homepage.spec.ts:584-588`) asserts `footer` count === 1 and `footerBox.y >= viewportSize.height - 1`. Pass. |
| 7 | The carousel↔grid morph (View Transitions) still functions on mobile — NOT gated to desktop/pointer:fine (D-12) | VERIFIED | Same test (`homepage.spec.ts:592-600`) asserts `document.startViewTransition` is a function AND actually clicks the toggle and confirms the grid becomes visible / carousel hidden, under mobile (`isMobile:true`, `hasTouch:true`) emulation. Code inspection: `document.startViewTransition()` call in the click handler carries no `pointer:fine`/desktop guard. Pass. |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/HomeCarousel.astro` — Instagram `<a class="home-nav-link">` | New nav link, inline SVG, after Contact | VERIFIED | Present at lines 111-138, correct position, correct attributes. |
| `src/components/HomeCarousel.astro` — `instagramNewTabHint` const | Locale-conditional const | VERIFIED | Line 68: `isEn ? ' (opens in new tab)' : ' (nouvelle fenêtre)'` — matches `BaseLayout.astro:76` semantics. |
| `src/components/HomeCarousel.astro` — `.home-toggle__box` | 28px square wrapper + CSS | VERIFIED | Markup at line 149, CSS at lines 862-869 (28px, border, no mode-specific override). |
| `tests/e2e/homepage.spec.ts` — Instagram + square-toggle assertions | New Playwright tests | VERIFIED | `test.describe('Instagram nav link (HOME-04)')` (5 tests) and `test.describe('square mode-toggle box (HOME-05)')` (3 tests) both present and passing. |
| `tests/e2e/homepage.spec.ts` — mobile-emulation full-bleed regression test | iPhone-profile regression guard | VERIFIED | `test.describe('mobile full-bleed hero regression (HOME-06)')` at line 547, using `devices['iPhone 14 Pro']`, present and passing. |
| `src/components/HomeCarousel.astro` — mobile-hero/view-transition CSS fix | Targeted fix, morph stays on mobile | VERIFIED | Static `view-transition-name` removed from `.home-hero__photo`/`.home-hero__accent` base rules; dynamic JS assignment added to the toggle click handler (lines 598-599). No `pointer:fine`/desktop gating introduced. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Instagram `<a>` | instagram.com | `target="_blank"` + `rel="noopener noreferrer"` | WIRED | Both attributes present verbatim (`HomeCarousel.astro:112-114`). |
| `.home-toggle` (hit box) | `.home-toggle__box` (visible box) | nested-span tap-target split | WIRED | Outer button: `min-width`/`min-height: var(--tap-target-min)`, no border/padding; inner span: `width/height: 28px`, border. Hover-invert (`:hover .home-toggle__box`) and attention-pulse (`.home-toggle:not(.home-toggle--used) .home-toggle__box`) both correctly retargeted to the inner box, not the outer hit box. |
| `view-transition-name: ajs-hero-morph`/`ajs-accent-panel` | `.home-hero__photo`/`.home-hero__accent` | dynamic JS assignment at click time | WIRED | No static CSS declaration remains (grep-confirmed); `heroPhoto.style.viewTransitionName`/`accentPanel.style.viewTransitionName` set in the click handler immediately before `startViewTransition()` (lines 598-599). |
| `document.startViewTransition()` | toggle click handler | unconditional call, no pointer/media gating | WIRED | No `pointer:fine`/`matchMedia` guard found around the `startViewTransition()` call; mobile-emulation test confirms the toggle functionally swaps modes. |

### Behavioral Spot-Checks (live-executed by verifier, not trusted from SUMMARY)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| HOME-04/HOME-05/HOME-06 new tests (9 tests) | `npx playwright test homepage.spec.ts -g "Instagram nav link\|square mode-toggle box\|mobile full-bleed hero regression"` | 9 passed (2.0s) | PASS |
| Full homepage regression suite (no weakened/broken pre-existing tests) | `npx playwright test homepage.spec.ts` | 24 passed (2.9s) | PASS |
| Unit test suite | `npm run test:unit` | 40 passed (5 files) | PASS |
| Static build | `npm run build` | 21 pages built, no errors | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|------------|--------------|--------|----------|
| HOME-04 | 07-01 | Instagram icon link in header nav | SATISFIED | Truth 1, 4; artifact + test verified above. |
| HOME-05 | 07-01 | Square mode-toggle border, ≥44px tap target | SATISFIED | Truth 2, 3; artifact + test verified above. |
| HOME-06 | 07-02 | Mobile full-bleed hero, no gap/footer bleed, morph stays on mobile | SATISFIED | Truth 5, 6, 7; artifact + test verified above. |

No orphaned requirements — REQUIREMENTS.md maps only HOME-04, HOME-05, HOME-06 to Phase 7, and all three appear in a plan's `requirements` frontmatter field and are marked `[x]` complete in both REQUIREMENTS.md and ROADMAP.md.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/HomeCarousel.astro` | 1296 | `text-shadow: none; /* temporarily removed for comparison, per user request */` — wordmark cutout legibility fix disabled | INFO (out of scope) | Pre-existing from commit `dbebd6f` (2026-07-12, Phase 6/HOME-03 work), predates Phase 7's first commit (`2591979`, 2026-07-13). Confirmed via `git blame` that Phase 7's commits (`2591979`, `61bf668`, `3b25d46`, `9f61219`, `67f763e`) never touched this line. Already flagged as a critical finding in `07-REVIEW.md` (code review, not goal verification) — tracked there as a candidate follow-up, not a Phase 7 regression or must-have gap. Does not affect HOME-04/HOME-05/HOME-06. |

No debt markers (`TBD`/`FIXME`/`XXX`) were introduced by any of Phase 7's own commits (checked via `git show` diff on each of the 5 phase commits). No stub patterns (`return null`, empty handlers, hardcoded empty arrays feeding rendered output) found in the Instagram link, toggle-box, or view-transition-naming code added/changed by this phase.

### Human Verification Required

None required to close this phase. One accepted, pre-decided risk is worth restating for the record (not a new gap — it was explicitly decided during Phase 7's own discussion, D-11, before execution):

- **D-11 (pre-accepted, not blocking):** The phase's closing verification bar for HOME-06 is Playwright's `iPhone 14 Pro` **Chromium emulation** profile, not a live check on the real iPhone 17 Pro where the regression was originally observed. `07-CONTEXT.md:37` records the user's explicit decision that "no live on-device checkpoint... is required to close this phase," while also flagging that this exact bug class (`100vh`/`100svh` Safari-chrome timing) previously escaped emulation-only testing once already (Phase 6). Both the PLAN and SUMMARY carry this caveat, and the SUMMARY documents that the D-10 hypothesis (unconditional `view-transition-name` as the cause) could not be reproduced/confirmed under Chromium emulation (test was GREEN before and after the fix) — the fix was still applied as the mechanistically sound correction. Since this verification bar was a deliberate, informed, pre-phase user decision (not a gap discovered here), it is recorded as an accepted residual risk rather than a routed human-verification blocker. If the real-device symptom recurs live post-launch, it should be filed as a follow-up quick task, per the SUMMARY's own recommendation.

### Gaps Summary

No gaps. All 7 merged truths (3 from ROADMAP success criteria, plus plan-level detail truths) are verified against the actual codebase — not just SUMMARY claims. All required artifacts exist, are substantive, and are wired correctly. Key links (Instagram `rel`/`target`, tap-target/visible-box split, dynamic view-transition naming, unconditional `startViewTransition()`) are all confirmed in code. All 9 new Playwright assertions plus the full 24-test `homepage.spec.ts` suite were independently re-run by the verifier (not trusted from SUMMARY) and passed, along with the full unit suite and static build. Requirements HOME-04, HOME-05, HOME-06 are all satisfied with no orphans. One pre-existing, out-of-scope code-review finding (wordmark `text-shadow: none`) predates this phase and does not affect its goal. The phase's own accepted emulation-only verification bar for HOME-06 (D-11) is documented as a known, pre-decided residual risk, not a new gap.

---

_Verified: 2026-07-14T01:10:38Z_
_Verifier: Claude (gsd-verifier)_
