---
phase: 10-unified-header-simplified-language-switcher
verified: 2026-07-17T18:30:00Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Load /about/ and /contact/ (both locales) at 373px, 393px, and 428px viewports and visually confirm the header (logo, About, Contact, Instagram, switcher) reads cleanly on one row without cramping or an ugly wrap — not just 'doesn't overflow.'"
    expected: "Header items sit comfortably on one row with reasonable spacing at all three widths; no visually cramped/overlapping elements."
    why_human: "10-VALIDATION.md flags this as Manual-Only — an automated scrollWidth check (already passing at 393px for /about/, /contact/, and /galleries/silos/ in tests/e2e/site-header.spec.ts) catches hard overflow but not awkward wrapping or visual cramping, which needs a live look. Not independently re-verified visually in this pass beyond the automated non-overflow check and the SUMMARY's claimed screenshot review."
    result: "PASSED — user confirmed live against localhost:4323 (dev server serving current code): 'Looks clean' at 373px/393px/428px on /about/ and /contact/, no cramping or overlap."
  - test: "View the language-switcher globe icon on at least one page in both locales at its rendered ~16px size and confirm the glyph reads as a recognizable globe (not a blob)."
    expected: "The globe SVG (circle + vertical ellipse + horizontal meridian line, currentColor, 16x16) is legible/recognizable at header size."
    why_human: "10-VALIDATION.md flags icon legibility as a subjective visual judgment, same precedent as Phase 7's Instagram icon. Verified the SVG markup exists and renders (confirmed via e2e assertion and code read), but legibility at rendered size is not something a bounding-box/DOM check can certify."
    result: "PASSED — user confirmed live: globe icon is legible at header size."
---

# Phase 10: Unified Header & Simplified Language Switcher Verification Report

**Phase Goal:** The homepage renders from the same shared header component as About/Contact — so logo, nav, toggle, and switcher positioning stay aligned by construction instead of drifting — and the site-wide language switcher shows only the other language plus a globe icon.
**Verified:** 2026-07-17T18:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The homepage header and the About/Contact header are rendered from a single shared header component, not two independently-styled implementations | ✓ VERIFIED | `src/components/SiteHeader.astro` is the only header component; both `src/layouts/BaseLayout.astro:186` and `src/components/HomeCarousel.astro:104` render `<SiteHeader>`. `grep -rn "home-header\|home-nav\|home-logo"` across `src/` and `tests/` returns zero matches (only a historical comment in a test file). `tests/e2e/site-header.spec.ts`'s "cross-page structural identity" test (line 96) asserts `/` and `/about/` render the identical `.site-nav .nav-link` href set/order — ran and PASSED live. |
| 2 | A header-level change made once in the shared component is reflected identically on the homepage and About/Contact without a second edit | ✓ VERIFIED | Structural consequence of #1 (single component, single CSS `is:global` block in `SiteHeader.astro`) plus the tap-target fix (f669ab1) itself is proof: a one-file 4-line change to `SiteHeader.astro`'s `.nav-link` rule fixed the Instagram tap-target on *every* page (homepage + About + Contact + gallery-detail) with no per-page edit. Confirmed live via `boundingBox()`: About Instagram link `{width:36, height:44}`, Homepage Instagram link `{width:36, height:44}` — identical treatment, one source. |
| 3 | The homepage-only carousel/grid mode toggle still renders and functions correctly, and does not appear on About/Contact | ✓ VERIFIED | `HomeCarousel.astro:122-142` renders the toggle `<button data-role="mode-toggle" slot="extra">` as an immediate child of `<SiteHeader>`; click handler wired at `HomeCarousel.astro:563,587`. `tests/e2e/homepage.spec.ts` "carousel/grid display mode toggle" and "single unified mode toggle" tests PASSED live (toggle functions, swaps carousel↔grid). `tests/e2e/site-header.spec.ts` "mode-toggle scoping" test (added by f669ab1) asserts zero `[data-role="mode-toggle"]` on `/about/` and `/contact/` — PASSED live. |
| 4 | The language switcher shows only a link to the OTHER language plus a small globe icon, on every page site-wide | ✓ VERIFIED | `src/components/LanguageSwitcher.astro` renders exactly one `<a class="switcher-link">` with one `aria-hidden` inline globe `<svg>` + visible `{targetLabel}` text + `sr-only` hint; no `.is-current`/`.switcher-separator` markup exists in the file. `tests/e2e/i18n.spec.ts` and `tests/e2e/homepage.spec.ts` assert `.switcher-link` count === 1, `.switcher-separator` count === 0 — PASSED live on both locales. |
| 5 | Clicking the language switcher navigates to the translated version of the current page (same destination as before) | ✓ VERIFIED | `LanguageSwitcher.astro`'s cookie-write `<script>` (lines 69-93) is unchanged from D-10's byte-for-byte preservation requirement; `getSwitcherHref` still drives `href`. `tests/e2e/i18n.spec.ts` "switcher" click/cookie tests (4 tests) and `tests/e2e/legal.spec.ts` "switcher" click tests (4 tests, `getByRole('link', {name: 'EN'|'FR'})`, untouched file per plan) all PASSED live. |
| 6 | Full existing regression suite is unaffected (no divergence introduced by the refactor) | ✓ VERIFIED | Ran `npm run test:e2e` and `npm run test:unit` independently: **87/87 e2e passed, 40/40 unit passed** — matches the claimed count exactly, verified via direct execution, not trusted from SUMMARY. `npm run build` succeeded (21 pages built, no errors). |
| 7 | The 44px tap-target regression (CR-01 in 10-REVIEW.md) is actually fixed in shipped code, not just documented | ✓ VERIFIED | `git show f669ab1 -- src/components/SiteHeader.astro` shows the exact fix (`display:inline-flex; align-items:center; min-height:var(--tap-target-min); padding:var(--space-xs) var(--space-sm);` added to `.nav-link`). Live `boundingBox()` measurement against the running built site (not just static grep) confirms `height: 44` on both the About-page and Homepage Instagram links — the review's originally-measured `20×25` regression is gone. |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/SiteHeader.astro` | Single canonical header component | ✓ VERIFIED | Exists, substantive (285 lines incl. full CSS), imported and rendered by both `BaseLayout.astro` and `HomeCarousel.astro` |
| `src/components/LanguageSwitcher.astro` | One-link + globe switcher | ✓ VERIFIED | 94 lines, renders exactly one link, cookie-write script intact |
| `src/layouts/BaseLayout.astro` | Renders `<SiteHeader>`, no inline header markup left | ✓ VERIFIED | Inline `<header>` removed; `<SiteHeader variant={headerVariant}>` at line 186 behind `headerVariant !== 'none'` |
| `src/components/HomeCarousel.astro` | Renders `<SiteHeader variant="transparent">` with toggle in `extra` slot | ✓ VERIFIED | Lines 104-143; no `.home-header`/`.home-nav`/`.home-logo` remain |
| `tests/e2e/site-header.spec.ts` | Wave-0 contract + cross-page identity + mode-toggle scoping + mobile-fit-incl-gallery-detail | ✓ VERIFIED | 115 lines, 12 tests, all passing live, covers both REVIEW warnings (WR-01, WR-02) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `BaseLayout.astro` | `SiteHeader.astro` | `import` + `<SiteHeader variant={headerVariant} .../>` | ✓ WIRED | Confirmed by grep + successful build render of About/Contact/gallery-detail pages |
| `HomeCarousel.astro` | `SiteHeader.astro` | `import` + `<SiteHeader variant="transparent">` with `slot="extra"` toggle | ✓ WIRED | Confirmed by grep + e2e cross-page-identity test passing |
| `SiteHeader.astro` | `LanguageSwitcher.astro` | `import` + `<LanguageSwitcher />` (no props) | ✓ WIRED | Line 12/86 of `SiteHeader.astro`; renders on every page including homepage |
| Mode-toggle `<button>` | `HomeCarousel`'s display-mode click handler | `root.querySelector('[data-role="mode-toggle"]')` + `addEventListener('click', ...)` | ✓ WIRED | Confirmed present at `HomeCarousel.astro:563,587`; e2e toggle-function test passed live |
| `LanguageSwitcher.astro`'s `<a class="switcher-link">` | cookie-write + navigation | inline `<script>` `querySelectorAll('.language-switcher .switcher-link')` + `href={targetHref}` | ✓ WIRED | e2e switcher click/cookie tests passed live (i18n.spec.ts + legal.spec.ts, 8 tests) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full build succeeds | `npm run build` | 21 pages built, 0 errors | ✓ PASS |
| Full e2e suite | `npm run test:e2e` | 87 passed, 0 failed | ✓ PASS |
| Full unit suite | `npm run test:unit` | 40 passed, 0 failed | ✓ PASS |
| Instagram link tap-target height on About page | Playwright `boundingBox()` against live built preview server | `{width:36, height:44}` | ✓ PASS |
| Instagram link tap-target height on Homepage | Playwright `boundingBox()` against live built preview server | `{width:36, height:44}` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HOME-10 | 10-01, 10-02 | Homepage header visually identical to About/Contact by construction | ✓ SATISFIED (code) / ⚠️ DOC GAP | Code fully delivers this (see truths #1-3, #6-7). **However**, `.planning/REQUIREMENTS.md` line 67 still shows `- [ ] **HOME-10**` (unchecked) and line 173's traceability table still shows `HOME-10 \| Phase 10 \| Pending`; `.planning/ROADMAP.md` line 32 still shows the phase checkbox unchecked and its progress table (line ~355) shows "10. Unified Header... \| 1/3 \| In Progress" despite all 3 plans being merged. This is a documentation-sync gap, not a code gap — flagged for the orchestrator to correct post-verification. |
| I18N-04 | 10-03 | Switcher shows only other language + globe icon | ✓ SATISFIED | REQUIREMENTS.md correctly marks this `[x]` complete and "Phase 10 \| Complete" in the traceability table — consistent with code. |

### Anti-Patterns Found

None found in the phase's modified files (`SiteHeader.astro`, `LanguageSwitcher.astro`, `HomeCarousel.astro`, `BaseLayout.astro`, `site-header.spec.ts`). No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers. `IN-01` from 10-REVIEW.md (a stale comment in `HomeCarousel.astro:790-793` about `.nav-link`'s removed `display:inline-flex`) was superseded by f669ab1's fix — `.nav-link` now *does* declare `display:inline-flex` again, so the comment is arguably accurate again; low-value, not a blocker either way.

### Code Review Follow-Up Verification (10-REVIEW.md)

| Finding | Severity | Claimed Fix | Verified Landed? |
|---------|----------|--------------|-------------------|
| CR-01: `.nav-link` tap-target regressed to 20×25px | Critical | f669ab1 restores `min-height`/`padding`/`display:inline-flex` on `.nav-link` | ✓ YES — diff confirmed + live `boundingBox()` shows 44px height on About and Homepage |
| WR-01: no regression guard for mode-toggle absence on About/Contact | Warning | f669ab1 adds test to `site-header.spec.ts` | ✓ YES — test present at line 61-68, passing live |
| WR-02: mobile 393px guard missing gallery-detail | Warning | f669ab1 extends loop to include `/galleries/silos/` | ✓ YES — test present at line 47 (`['/about/', '/contact/', '/galleries/silos/']`), passing live |

## Human Verification Required

### 1. Mobile header visual fit (373-428px, About/Contact, both locales)

**Test:** Load `/about/`, `/contact/` (and `/en/` equivalents) at 373px, 393px, and 428px viewports; look at the header row.
**Expected:** Logo, About, Contact, Instagram, switcher all sit on one row without cramped spacing or awkward wrapping.
**Why human:** 10-VALIDATION.md explicitly flags this as Manual-Only. The automated `scrollWidth <= innerWidth` check (in `tests/e2e/site-header.spec.ts`, now covering About/Contact/gallery-detail per the WR-02 fix) passed live and rules out hard overflow, but cannot judge "reads cleanly" vs. "technically fits but looks cramped."
**Result:** ✅ PASSED — user confirmed live against the running dev server: "Looks clean" at all three widths on /about/ and /contact/.

### 2. Globe icon legibility at rendered size (~16px)

**Test:** View the language switcher on at least one page in both locales; assess whether the globe SVG glyph is recognizable.
**Expected:** The circle+ellipse+line globe glyph reads as a globe, not an ambiguous blob, at its compact size.
**Why human:** 10-VALIDATION.md explicitly flags this as Manual-Only, following the Phase 7 Instagram-icon precedent. Confirmed the SVG markup exists, renders with `currentColor`/`16×16`/`viewBox="0 0 24 24"`, and passes its e2e presence assertion — but legibility is a subjective visual judgment no DOM/boundingBox check can certify.
**Result:** ✅ PASSED — user confirmed live: globe icon is legible at header size.

## Gaps Summary

No code-level gaps found. All 7 derived truths (from the 5 ROADMAP success criteria plus the task's own explicit checks #4 build/test and #5 tap-target-fix verification) are VERIFIED against the actual codebase — independently re-run, not trusted from SUMMARY.md. Both Manual-Only human sign-off items (mobile visual fit, globe legibility) have now been confirmed by the user.

One non-blocking documentation-sync gap: `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md` were not updated to reflect HOME-10's actual completion (both still show it as pending/in-progress despite all 3 plans merged and code delivering the requirement). Recommend a quick doc-sync pass before archiving this phase.

---

_Verified: 2026-07-17T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
