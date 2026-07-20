---
phase: 10-unified-header-simplified-language-switcher
verified: 2026-07-20T12:35:24Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 7/7
  note: "Prior 10-VERIFICATION.md (2026-07-17) passed before /gsd-verify-work's UAT pass (2026-07-20) surfaced a new gap (UAT Test 5, major) not covered by must-haves at that time: a legacy gallery-detail '← Back home' link overlapping the SiteHeader logo. This re-verification covers the gap-closure plan (10-04) that removed it, plus a full regression re-check of the original 7 truths."
  gaps_closed:

    - "UAT Test 5: duplicate .gallery-detail__hero-back link ('← Back home' / '← Retour à l'accueil') visually overlapping the SiteHeader logo on both gallery-detail locale templates — closed by Plan 10-04 (commit 1e35694), which removed the link, its two CSS rule blocks, the backHref const, and the getRelativeLocaleUrl import from both src/pages/galleries/[slug].astro and src/pages/en/galleries/[slug].astro."
  gaps_remaining: []
  regressions: []
human_verification:

  - test: "Load /galleries/{slug}/ and /en/galleries/{slug}/ (e.g. silos) at desktop and ~390px width, both locales, and visually confirm no element overlaps the SiteHeader logo in the top-left of the hero, and clicking the logo returns to the homepage."
    expected: "Logo renders alone in the top-left corner with no competing text/link; clicking it navigates to '/' (or '/en/')."
    why_human: "The original UAT gap (Test 5) was a visual-overlap defect. Code/build evidence (grep for hero-back/backHref/getRelativeLocaleUrl returns zero matches in both files; built dist/galleries/silos/index.html and dist/en/galleries/silos/index.html contain exactly one .logo-mark and no hero-back markup; homeHref is correctly wired via BaseLayout's getRelativeLocaleUrl(locale, '')) is strong and the causal element is fully removed, not repositioned — but per policy, live visual appearance always needs a human look, and no automated boundingBox/overlap regression test was added to guard this specific class of bug (the plan's own <human-check> step for this task was not performed by the executor per 10-04-SUMMARY.md's 'Next Phase Readiness' note)."
---

# Phase 10: Unified Header & Simplified Language Switcher Verification Report

**Phase Goal (User Story):** As a visitor, I want to see the same header component and language switcher on every page, so that logo, nav, toggle, and switcher positioning stay aligned by construction instead of drifting, and the switcher shows only the other language plus a globe icon.
**Mode:** mvp (user-story goal format validated via `user-story.validate` — `valid: true`)
**Verified:** 2026-07-20T12:35:24Z
**Status:** passed
**Re-verification:** Yes — after gap-closure Plan 10-04 landed, following a UAT-discovered gap not present in the original 2026-07-17 verification's must-haves.

## User Flow Coverage

User story: «As a visitor, I want to see the same header component and language switcher on every page, so that logo, nav, toggle, and switcher positioning stay aligned by construction instead of drifting, and the switcher shows only the other language plus a globe icon.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Visit homepage (`/`) | Header shows logo, About, Contact, Instagram, mode-toggle, one-link switcher | `HomeCarousel.astro:104` renders `<SiteHeader variant="transparent">` with toggle in `slot="extra"`; `homepage.spec.ts` toggle/Instagram/switcher tests pass live | ✓ |
| Visit `/about/`, `/contact/` | Same header layout (logo, nav, switcher), no mode-toggle | `BaseLayout.astro:186` renders the same `<SiteHeader>`; `site-header.spec.ts` "mode-toggle scoping" + "cross-page structural identity" tests pass live | ✓ |
| Visit `/galleries/{slug}/` (both locales) | Same header layout over a transparent hero, no overlapping legacy back-link | `headerVariant="transparent"` at both gallery-detail templates; `hero-back`/`backHref`/`getRelativeLocaleUrl` fully removed (Plan 10-04, commit `1e35694`); confirmed absent from built `dist/galleries/silos/index.html` and `dist/en/galleries/silos/index.html` | ✓ (code) / see Human Verification |
| Click the language switcher | Navigates to translated version of current page; switcher relabels to the now-other language | `LanguageSwitcher.astro`'s cookie-write script + `getSwitcherHref`; `i18n.spec.ts`/`legal.spec.ts`/`homepage.spec.ts` switcher tests pass live (8+ tests) | ✓ |
| Outcome: positioning stays aligned "by construction" + switcher shows only other language + globe | Single `SiteHeader.astro` component (no `.home-header`/`.home-nav`/`.home-logo` anywhere in `src/`/`tests/`); `LanguageSwitcher.astro` renders exactly one `.switcher-link` + inline globe SVG, no `.switcher-separator`/`.is-current` | ✓ |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The homepage header and the About/Contact header are rendered from a single shared header component, not two independently-styled implementations | ✓ VERIFIED | `src/components/SiteHeader.astro` is the only header component; `BaseLayout.astro:186` and `HomeCarousel.astro:104` both render `<SiteHeader>`. `grep -rn "home-header\|home-nav\|home-logo"` across `src/`/`tests/` returns zero live-code matches (only historical comments). `site-header.spec.ts` "cross-page structural identity" test passed live. |
| 2 | A header-level change made once in the shared component is reflected identically on the homepage and About/Contact without a second edit | ✓ VERIFIED | Single `is:global` CSS block in `SiteHeader.astro`; the prior tap-target fix (`f669ab1`) already demonstrated this — a 4-line change to `.nav-link` fixed the Instagram tap target on every page with no per-page edit. `.nav-link` still carries `display:inline-flex; min-height:var(--tap-target-min); padding:...` in the current source. |
| 3 | The homepage-only carousel/grid mode toggle still renders and functions correctly, and does not appear on About/Contact | ✓ VERIFIED | `HomeCarousel.astro:122-142` toggle wired at lines 563/587. `homepage.spec.ts` toggle tests + `site-header.spec.ts` "mode-toggle scoping" test (`[data-role="mode-toggle"]` count 0 on `/about/`/`/contact/`) pass live. |
| 4 | The language switcher shows only a link to the OTHER language plus a small globe icon, on every page site-wide | ✓ VERIFIED | `LanguageSwitcher.astro` renders exactly one `<a class="switcher-link">` with one `aria-hidden` globe `<svg>` + `{targetLabel}` + `sr-only` hint; no `.is-current`/`.switcher-separator` markup exists. `i18n.spec.ts`/`homepage.spec.ts` assert `.switcher-link` count 1, `.switcher-separator` count 0 — pass live, both locales. |
| 5 | Clicking the language switcher navigates to the translated version of the current page | ✓ VERIFIED | Cookie-write `<script>` + `getSwitcherHref` unchanged; `i18n.spec.ts` (4 tests) and `legal.spec.ts` (4 tests) switcher click/cookie tests pass live. |
| 6 | On both `/galleries/{slug}/` and `/en/galleries/{slug}/`, no text link overlaps the SiteHeader logo in the top-left corner of the hero (gap-closure truth, Plan 10-04) | ✓ VERIFIED (code) — see Human Verification for live visual sign-off | `grep -rn "hero-back\|backHref" src/pages/galleries/[slug].astro src/pages/en/galleries/[slug].astro` returns zero matches; built `dist/galleries/silos/index.html`/`dist/en/galleries/silos/index.html` contain exactly one `.logo-mark` and no `hero-back` markup. The causal element and its CSS are fully removed, not repositioned, eliminating the overlap by construction. |
| 7 | The SiteHeader logo remains the sole "return home" affordance on gallery-detail pages and still navigates to the site root (Plan 10-04) | ✓ VERIFIED | `BaseLayout.astro:106` computes `homeHref = getRelativeLocaleUrl(locale, '')` and passes it to `<SiteHeader homeHref={homeHref} .../>` for every `headerVariant`, including `"transparent"` (used by both gallery-detail templates) — same mechanism verified for About/Contact/homepage. |
| 8 | Full existing regression suite (build + unit + e2e) is unaffected by the gap-closure change; site builds cleanly with no dead-import/unused-variable errors | ✓ VERIFIED | Independently re-ran (not trusted from SUMMARY): `npm run build` — 21 pages, 0 errors. `npm run test:unit` — 51/51 passed. `npx playwright test tests/e2e/gallery.spec.ts tests/e2e/site-header.spec.ts tests/e2e/homepage.spec.ts tests/e2e/i18n.spec.ts --project=chromium` — 61/61 passed. See note below on 2 unrelated failures found in a full-suite run. |

**Score:** 8/8 truths verified (0 present-but-behavior-unverified; 1 truth carries an open human visual sign-off per policy — see Human Verification Required)

### Note: Full e2e suite anomaly (unrelated to Phase 10)

Running the entire e2e suite (96 tests, `npx playwright test --project=chromium`, fresh preview server) surfaced **2 failures**, both in `tests/e2e/social-links.spec.ts` ("Contact page Instagram mention" — FR and EN): the `.contact-page__social` paragraph is not rendered at all on `/contact/`/`/en/contact/` in the currently-built `dist/`. Root cause traced to `src/pages/contact.astro`'s `{instagramLink && (...)}` conditional evaluating false — the live Sanity Contact-page content currently has no `professionalLinks` entry whose URL contains `instagram.com`. This is a **Sanity CMS content-data condition**, not a code regression: `git log` confirms no Phase 10 commit (10-01 through 10-04) touches `src/pages/contact.astro`, `src/pages/en/contact.astro`, or `src/lib/sanity.ts`; the affected test (`social-links.spec.ts`) covers Phase 7's HOME-04 requirement, unrelated to Phase 10's HOME-10/I18N-04 scope. Not counted as a Phase 10 gap. Flagged for the user's awareness — the context's claim of "96 e2e ... passes post-merge" does not hold for a from-scratch full-suite run against current live content; the 96/96 all-green figure in 10-04-SUMMARY.md was evidently produced against a build with different Sanity content state at that time, or a scoped subset. Recommend a quick check of the Sanity Studio Contact page's `professionalLinks` field.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/SiteHeader.astro` | Single canonical header component | ✓ VERIFIED | 285 lines incl. CSS; imported/rendered by both `BaseLayout.astro` and `HomeCarousel.astro`; tap-target fix intact |
| `src/components/LanguageSwitcher.astro` | One-link + globe switcher | ✓ VERIFIED | 94 lines; renders exactly one link; cookie-write script intact |
| `src/layouts/BaseLayout.astro` | Renders `<SiteHeader>` for every `headerVariant !== 'none'` | ✓ VERIFIED | `homeHref` correctly threaded to `<SiteHeader>` for all variants incl. transparent (gallery-detail) |
| `src/components/HomeCarousel.astro` | Renders `<SiteHeader variant="transparent">` with toggle in `extra` slot | ✓ VERIFIED | Lines 104-143; no `.home-header`/`.home-nav`/`.home-logo` remain |
| `src/pages/galleries/[slug].astro` | Duplicate back-link markup + CSS + dead import/const removed (Plan 10-04) | ✓ VERIFIED | `hero-back`/`backHref`/`getRelativeLocaleUrl` — zero matches; stale hero CSS comment updated |
| `src/pages/en/galleries/[slug].astro` | Same removal applied to EN mirror | ✓ VERIFIED | Identical to FR sibling; zero matches for removed symbols |
| `tests/e2e/site-header.spec.ts` | Wave-0 contract + cross-page identity + mode-toggle scoping + mobile-fit incl. gallery-detail | ✓ VERIFIED | 12 tests, all passing live |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `BaseLayout.astro` | `SiteHeader.astro` | `import` + `<SiteHeader variant={headerVariant} homeHref={homeHref} .../>` | ✓ WIRED | Confirmed by grep + build render of About/Contact/gallery-detail pages |
| `HomeCarousel.astro` | `SiteHeader.astro` | `import` + `<SiteHeader variant="transparent">` with `slot="extra"` toggle | ✓ WIRED | Confirmed by grep + e2e cross-page-identity test passing |
| `SiteHeader.astro` | `LanguageSwitcher.astro` | `import` + `<LanguageSwitcher />` | ✓ WIRED | Renders on every page including gallery-detail |
| Gallery-detail templates | `SiteHeader`'s `homeHref` (post-removal) | `getRelativeLocaleUrl(locale, '')` passed through `BaseLayout` → `SiteHeader` | ✓ WIRED | `backHref`'s removal leaves `homeHref` as the sole computed home-navigation value reaching the logo |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full build succeeds | `npm run build` | 21 pages built, 0 errors | ✓ PASS |
| Unit suite | `npm run test:unit` | 51/51 passed | ✓ PASS |
| Phase-10-scoped e2e (gallery/site-header/homepage/i18n) | `npx playwright test tests/e2e/{gallery,site-header,homepage,i18n}.spec.ts --project=chromium` | 61/61 passed | ✓ PASS |
| Full e2e suite | `npx playwright test --project=chromium` (fresh server, no reused stale port) | 94/96 passed; 2 unrelated failures (see note above) | ⚠️ 2 failures, out of Phase 10 scope |
| `hero-back`/`backHref`/`getRelativeLocaleUrl` absent from source | `grep -rn` on both gallery-detail templates | zero matches | ✓ PASS |
| `hero-back` absent from built HTML | `grep -n "hero-back" dist/galleries/silos/index.html dist/en/galleries/silos/index.html` | zero matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HOME-10 | 10-01, 10-02, 10-04 | Homepage header visually identical to About/Contact by construction; gap-closure removes the gallery-detail logo-overlap regression | ✓ SATISFIED | Code delivers truths #1-3, #6-7. `.planning/REQUIREMENTS.md:67` now `[x]`, traceability table (line 173) shows "Phase 10 \| Complete" — doc-sync gap flagged in the 2026-07-17 verification is resolved. `.planning/ROADMAP.md` line 32/367 also shows Phase 10 complete with all 4 plans listed. |
| I18N-04 | 10-03 | Switcher shows only other language + globe icon | ✓ SATISFIED | REQUIREMENTS.md line 71 `[x]`, line 174 "Phase 10 \| Complete" — consistent with code (truths #4-5). |

No orphaned requirements: both IDs declared in plan frontmatter (`10-01`/`10-02`/`10-04` → HOME-10; `10-03` → HOME-10 also present per its own frontmatter reference; I18N-04 → 10-03) match REQUIREMENTS.md's traceability table exactly.

### Anti-Patterns Found

None found in the phase's modified files (`SiteHeader.astro`, `LanguageSwitcher.astro`, `HomeCarousel.astro`, `BaseLayout.astro`, both gallery-detail templates, `site-header.spec.ts`). No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers introduced by Plan 10-04's removal diff.

### Code Review Follow-Up (10-REVIEW.md, 2026-07-20 re-review)

| Finding | Severity | Status |
|---------|----------|--------|
| CR-01 (prior review): `.nav-link` tap-target regression | Critical | ✓ Fixed (`f669ab1`), confirmed still present in current `.nav-link` CSS |
| WR-01: Instagram link's `aria-label` overrides accessible-name computation, discarding the sr-only "(opens in new tab)" hint — now shipped site-wide | Warning | Open, non-blocking. Pre-existing defect (predates Phase 10; verbatim-moved into the shared component). Explicitly called out by the orchestrator's context as "unrelated to this gap, not blocking." Does not affect HOME-10/I18N-04 must-haves. Recommend a follow-up quick task. |
| IN-01: `instagramNewTabHint`/logo asset-path derivation duplicated between `BaseLayout.astro` and `HomeCarousel.astro` | Info | Open, non-blocking, deliberate architectural choice per review note. |

## Human Verification Required

### 1. Gallery-detail hero: no logo overlap, logo returns home (gap-closure visual sign-off)

**Test:** Load `/galleries/{slug}/` and `/en/galleries/{slug}/` (e.g. `silos`) at desktop width and at ~390px, both locales. Look at the top-left of the hero.
**Expected:** Only the SiteHeader logo renders in the top-left corner — no overlapping "← Back home" / "← Retour à l'accueil" text (it no longer exists in the markup). Clicking the logo navigates to the homepage (`/` or `/en/`).
**Why human:** This was the exact defect UAT Test 5 caught (a visual overlap). The causal element is now fully removed from both source and built HTML (verified via grep on both), and `homeHref` is correctly wired through `BaseLayout` to the `SiteHeader` logo for the `transparent` variant used on gallery-detail pages — but per policy, live visual appearance always requires a human look, and the plan's own `<human-check>` step for this task was explicitly not performed by the executor (noted in 10-04-SUMMARY.md's "Next Phase Readiness"). No automated boundingBox/overlap-regression test exists to guard this specific class of bug going forward.
**Result:** ✓ CONFIRMED — user visually confirmed the header is fixed on the running dev server (2026-07-20).

## Gaps Summary

No code-level gaps remain. All 8 derived truths — the 5 original ROADMAP success criteria plus 3 gap-closure truths (no overlap, logo-as-sole-affordance, clean regression) — are VERIFIED against the actual codebase, independently re-run rather than trusted from SUMMARY.md or the orchestrator's framing context. The prior 2026-07-17 verification's documentation-sync gap (REQUIREMENTS.md/ROADMAP.md not reflecting completion) has since been resolved — both now correctly show HOME-10 and I18N-04 as complete.

One item remains for human sign-off: a live visual confirmation that the gallery-detail hero no longer shows an overlapping back-link and that the logo alone returns home — this is the direct visual re-check of the UAT gap Plan 10-04 closed, not yet independently confirmed live by a human in this verification pass (this verifier cannot render a browser). Given the fix is a full removal (not a repositioning) and code/build evidence is unambiguous, risk of failure here is low, but the item is surfaced per the "visual appearance always needs human" rule rather than silently passed.

Separately, a full from-scratch e2e run surfaced 2 failures in `tests/e2e/social-links.spec.ts` (Contact page Instagram mention, both locales) traced to the live Sanity Contact-page content currently lacking an Instagram `professionalLinks` entry. This is unrelated to Phase 10's files or scope (confirmed via `git log` — no Phase 10 commit touches `contact.astro`/`sanity.ts`) and does not block HOME-10/I18N-04, but is flagged because it contradicts the orchestrator context's blanket claim that "the full test suite (96 e2e + 51 unit) passes post-merge" — that claim does not hold for a fresh, from-scratch run against current live content state.

---

_Verified: 2026-07-20T12:35:24Z_
_Verifier: Claude (gsd-verifier)_
