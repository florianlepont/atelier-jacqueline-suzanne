---
phase: 15-about-page-editorial-redesign
verified: 2026-07-29T12:15:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 15: About Page Editorial Redesign Verification Report

**Phase Goal:** The About page adopts the same giant-title editorial identity as Contact/Éditions — both in its title treatment and its broader supporting layout — closing the visual gap this milestone targets.
**Verified:** 2026-07-29T12:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (merged from ROADMAP Phase 15 success criteria + PLAN frontmatter must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | About's title renders via the shared `PageTitleHeader` — same font, size, halftone, hairline divider as Contact/Éditions | ✓ VERIFIED | `AboutPageBody.astro:39` calls `<PageTitleHeader heading={heading} headingId="about-title" intro="" />`; `PageTitleHeader.astro` unmodified (byte-identical component used by Contact); e2e assertions confirm `.page-title-header__eyebrow`, `.page-title-header__halftone`, `.page-title-header__divider` all render on About and `.about-page__eyebrow` count is 0. |
| 2 | Title lands at the **same position** as Contact/Éditions (criterion 1's "position" clause, the specific defect UAT caught) | ✓ VERIFIED | Both `.about-page` and `.contact-page` now use `padding-top: clamp(48px, 7vw, 56px)` (identical value) with the larger `--editorial-page-padding-block` reserved for bottom only (commit `22df1b8`). Independently re-measured with a standalone Playwright script at 1400×900: `#about-title` boundingBox `y = 241.90625` vs `#contact-title` boundingBox `y = 241.90625` — pixel-identical. |
| 3 | The resting composition (lead bio, circular portrait accent, hero photo, numbered sections) reads as one coherent editorial composition per the sketch-014 Variant A winner | ✓ VERIFIED | `AboutPageBody.astro` markup order matches sketch-014 winner: `PageTitleHeader` → `.about-page__bio-row` (lead + circular portrait) → `.about-page__exhibition-*` band → `.about-page__sections` (two-column). Portrait is circular (`border-radius: 50%`), 112px desktop / 72px mobile (confirmed by e2e boundingBox assertions). Human UAT (15-04-SUMMARY) confirmed this reads as coherent, after the padding fix. |
| 4 | The implemented layout was chosen from multiple sketched proposals, not a single guess (ABOUT-04 process contract) | ✓ VERIFIED | `.planning/sketches/014-about-page-composition/index.html` (37KB, 3 labeled variants A/B/C) and `README.md` (`sketch: 014`, `winner: "A — Settle & Restyled Two-Column Grid"`) exist; `MANIFEST.md` has the appended `014` row. User picked the winner via the Task 2 `checkpoint:decision` ("On valide le A"). |
| 5 | All existing bio/practice/medium copy is preserved verbatim, in both French and English | ✓ VERIFIED | e2e: "French/English About page renders non-empty CMS bio, practice, and medium copy" — both pass; `.about-page__lead`/`.about-page__section > div > p` count = 3 with >20 chars each, both locales; "copy differs between FR/EN" test passes. |
| 6 | About renders correctly in both French and English | ✓ VERIFIED | All 12 `about.spec.ts` tests pass on `chromium` (re-run live, see below); `critical.smoke.spec.ts` passes on `webkit-mobile`; `accessibility.spec.ts` passes for both `/about/` and `/en/about/` with zero serious/critical violations. |
| 7 | Desktop, motion enabled: exhibition photo pins (`position: sticky`) and **actually shrinks** to ~86% width on scroll (D-04/D-05) — the specific defect code review CR-01 caught | ✓ VERIFIED | Live Playwright re-run of `about.spec.ts` (not just SUMMARY narrative): "desktop pin is sticky by default" tests (FR+EN) pass, including the bounding-box width assertion that the animated `.about-page__exhibition-photo-track` narrows to 80-92% of pin width after scrolling past `REVEAL_DISTANCE`. Current file (`AboutPageBody.astro:126,295-299`) confirms the two-layer fix: the script animates `.about-page__exhibition-photo-track` (no explicit width), not the `<img>` itself (which keeps a static `width:100%` rule) — matching the CR-01 fix in commit `3656623`. |
| 8 | Reduced-motion desktop shows the settled end-state immediately (no sticky, already ~86%); mobile shows a static band with no scroll listener | ✓ VERIFIED | Live re-run: both reduced-motion tests (FR+EN) pass, asserting `position !== 'sticky'` AND the photo-track width is already 80-92% with zero scroll. Mobile test passes: `position: relative`, photo visible. CSS blocks at `AboutPageBody.astro:415-428` (reduced-motion) and `:352-399` (mobile) confirm this in the source. |

**Score:** 8/8 truths verified (0 present-but-behavior-unverified — all behavior-dependent truths (7, 8) were confirmed with a live, freshly-run Playwright pass in this verification session, not SUMMARY narrative alone)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/sketches/014-about-page-composition/index.html` | 3 labeled variants, real copy | ✓ VERIFIED | Exists, 37KB. |
| `.planning/sketches/014-about-page-composition/README.md` | Named winner + D-05/D-07 resolution | ✓ VERIFIED | `winner: "A — Settle & Restyled Two-Column Grid"` present. |
| `.planning/sketches/MANIFEST.md` (row 014) | Appended row | ✓ VERIFIED | `| 014 | about-page-composition | ... |` present. |
| `src/components/AboutPageBody.astro` | PageTitleHeader wired, old eyebrow/h1/hero-grid removed, pin+shrink working, padding parity | ✓ VERIFIED | All confirmed by direct file read + live test run (see truths above). |
| `src/components/PageTitleHeader.astro` | Unmodified, shared component | ✓ VERIFIED | Reused byte-identical by both About and Contact; no About-specific edits found. |
| `src/pages/about.astro` / `src/pages/en/about.astro` | Call sites synced (no new Props added, so unchanged) | ✓ VERIFIED | Both still call `<AboutPageBody ... />` with the original Props signature — consistent with 15-02-SUMMARY's decision that no new Props field was needed. |
| `tests/e2e/about.spec.ts` | Re-pointed assertions + motion-state + width-shrink coverage | ✓ VERIFIED | 12/12 tests pass live; includes the WR-01 width-assertion regression coverage added in `3656623`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `AboutPageBody.astro` | `PageTitleHeader.astro` | `import` + `<PageTitleHeader heading={heading} headingId="about-title" intro="" />` | ✓ WIRED | Confirmed in source; component unmodified. |
| `.about-page` container padding | Contact's `.contact-page` container padding | Same `padding-top: clamp(48px, 7vw, 56px)` literal | ✓ WIRED | Byte-identical value in both files; independently re-measured pixel-identical title y-position. |
| Scroll-driver `<script>` | `.about-page__exhibition-photo-track` (animated wrapper) | `document.querySelector('.about-page__exhibition-photo-track')`, `onProgress()` writes `left`/`right` to it, not the `<img>` | ✓ WIRED | Confirmed in source (line 126) and empirically via live Playwright width measurement (80-92% band achieved). |
| `about.spec.ts` width assertions | Actual rendered photo-track width | `boundingBox()` comparison against pin width | ✓ WIRED | Live test run: all width-based assertions pass on both locales. |

### Behavioral Spot-Checks (live re-run, not SUMMARY narrative)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npm run typecheck` | `astro check` | 0 errors, 0 warnings, 2 hints | ✓ PASS |
| About e2e suite | `npx playwright test tests/e2e/about.spec.ts --project=chromium` | 12/12 passed | ✓ PASS |
| Cross-browser smoke | `npx playwright test tests/e2e/critical.smoke.spec.ts --project=webkit-mobile` | 4/4 passed | ✓ PASS |
| Unit tests | `npm run test:unit` | 210/210 passed (14 files) | ✓ PASS |
| Accessibility | `npx playwright test tests/e2e/accessibility.spec.ts -g about` | 2/2 passed (0 serious/critical violations) | ✓ PASS |
| Independent title-position parity check (ad-hoc script, not part of the committed suite) | Playwright script comparing `#about-title`/`#contact-title` boundingBox `y` at 1400×900 | `about y: 241.90625`, `contact y: 241.90625` (identical) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| ABOUT-03 | 15-02 | Title uses shared `PageTitleHeader` — same font/size/position, halftone, divider as Contact/Éditions | ✓ SATISFIED | Verified above (truths 1-2). |
| ABOUT-04 | 15-01, 15-02, 15-03 | Supporting layout redesigned via multiple sketched proposals, coherent editorial composition | ✓ SATISFIED | Verified above (truths 3-4, 7-8). |

No orphaned requirements: `.planning/REQUIREMENTS.md` maps exactly ABOUT-03 and ABOUT-04 to Phase 15, both accounted for above. **Note (non-blocking doc-sync gap):** `.planning/REQUIREMENTS.md` still shows both rows as `Pending` status (line 111-112) even though ROADMAP.md marks Phase 15 `[x]` completed 2026-07-29 — this is stale bookkeeping in REQUIREMENTS.md's own status column, not a gap in the actual implementation. Recommend updating REQUIREMENTS.md's status column in a follow-up docs pass; does not block this phase's goal achievement.

### Anti-Patterns Found

None. Scanned `src/components/AboutPageBody.astro` and `tests/e2e/about.spec.ts` for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and placeholder/not-yet-implemented language — zero matches. No stale selector references (`.about-page__eyebrow`, `.about-page__hero`, `.about-page__identity`, `--text-label-size`) remain in the component.

### Post-UAT Fix Verification (the specific focus of this re-check)

Per the task brief, this verification specifically re-confirmed both post-UAT fixes against the **current** codebase state rather than trusting the SUMMARY/REVIEW narrative:

1. **Padding/title-position fix (commit `22df1b8`):** Confirmed present in `AboutPageBody.astro:205-211` (`padding-top: clamp(48px, 7vw, 56px)`, `padding-bottom: var(--editorial-page-padding-block)`), matching `ContactPageBody.astro:118-119` exactly. Independently re-measured (not reusing the committed test) — pixel-identical y-position confirmed.
2. **Scroll-shrink CSS-over-constraint fix (commit `3656623`, CR-01/WR-01):** Confirmed present — the two-layer wrapper split (`.about-page__exhibition-photo-track` as the sole animated element, `<img class="about-page__exhibition-photo">` kept static) exists in the current markup and CSS. Live-executed the exact width-assertion e2e tests added in this fix (not just checking they exist) — both the desktop-scroll assertion (80-92% width post-scroll) and the reduced-motion assertion (80-92% width with zero scroll) pass against the current build.

Both fixes are real, present, and behaviorally verified — not just claimed.

### Human Verification Required

None. All truths were verified either by direct code inspection or by live-executed automated tests in this verification session. The one visual/compositional judgment (criterion 2, "reads as coherent") was already captured by human UAT in 15-04-SUMMARY.md (approved after the padding-fix round-trip), and this verification independently re-confirmed the underlying technical facts (pixel-identical position, actual width shrink) that UAT's approval depended on.

### Gaps Summary

No gaps. All 8 merged truths (ROADMAP's 5 success criteria plus the 3 plan-level must-haves layered on top) are verified against the current codebase, not the SUMMARY narrative. Both post-UAT fixes (title-position parity, scroll-shrink CSS-over-constraint) were independently re-confirmed with live test execution and an ad-hoc measurement script, matching what SUMMARY/REVIEW claimed. One non-blocking documentation-sync item was found (REQUIREMENTS.md status column not yet updated to reflect Phase 15 completion) — recommended as a follow-up, not a phase gap.

---

*Verified: 2026-07-29T12:15:00Z*
*Verifier: Claude (gsd-verifier)*
