---
phase: 18-gallery-ditions-display-fixes
verified: 2026-08-03T08:00:00Z
status: human_needed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Run `npm run build && npm run preview`, open a gallery detail page in FR and in EN, scroll to the bottom, and confirm the footer (site text plus the two legal nav links) is visible and correctly styled against the page background."
    expected: "The footer renders with correct visual styling (spacing, color, legal links) on both locales."
    why_human: "Playwright proves the footer element exists and is counted once, and proves the desktop scroll track is >= 300px, but not its subjective visual styling/appearance."
  - test: "On the same pages, confirm the thumbnail photos below the hero show no dark outline at their edges, on both a gallery page and an edition page, at desktop width and at a phone width."
    expected: "No visible border/frame around any thumbnail, at desktop and phone widths."
    why_human: "Playwright proves computed border-width is 0px and background-color/object-fit are correct at 1280x900, but full cross-viewport (including phone-width rendering) visual confirmation was deferred to this project's `workflow.human_verify_mode: end-of-phase` checkpoint."
  - test: "Run `npm --prefix sanity run dev`, open a gallery or édition's Texte de présentation field, paste text longer than 700 characters, and confirm the French error message appears naming the character limit, and that Publier is blocked."
    expected: "Studio blocks publish and shows a French error message stating the 700-character limit."
    why_human: "Requires typing into the live interactive Studio UI — not observable via source/grep. `npm --prefix sanity run build` (verified below) proves the schema compiles correctly, but not the interactive validation UX."
  - test: "In the same Studio session, open the longest currently-published document (édition `entasse`, 453 fr chars) and confirm it opens with NO validation error."
    expected: "No validation error on the longest existing published statement (453 chars, well under the 700 cap)."
    why_human: "Interactive Studio confirmation, not visible to static analysis."
  - test: "Run `npm run build && npm run preview`, open the gallery with the longest description (`the-victorian-tea-room`) at desktop width and at a phone width, and confirm the whole description reads to its end with no cut-off and no text spilling outside the hero panel."
    expected: "Full statement text visible, no clipping, no overflow past the hero panel, at both widths."
    why_human: "Playwright already proves this via computed CSS (clamp=none, scrollHeight<=clientHeight, reveal-inside-pin) for every published gallery at 1280x900 and 390x844 — this item is the final subjective visual read-through, explicitly deferred per `workflow.human_verify_mode: end-of-phase`."
---

# Phase 18: Gallery & Éditions Display Fixes Verification Report

**Phase Goal:** Visitors see complete gallery descriptions, clean thumbnail images with no border frame, and the site footer on every gallery page.
**Verified:** 2026-08-03T08:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Sourced from ROADMAP.md Phase 18 Success Criteria (the contract) plus the two plans' `must_haves.truths`.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A gallery detail page shows its full description/statement text, not cut off mid-sentence (PORT-04). | ✓ VERIFIED | `.detail-hero__statement` rule in `src/components/DetailHero.astro` contains only `margin-top`/`font-size`/`line-height`/`color` — the 5 clamp declarations (`display: -webkit-box`, `-webkit-line-clamp`, `line-clamp`, `-webkit-box-orient`, `overflow`) are gone, confirmed by direct file read. Re-ran `tests/e2e/gallery.spec.ts` — both new PORT-04 tests (desktop 1280x900, mobile 390x844), looping every published gallery, PASS live (see `npx playwright test gallery.spec.ts --project=chromium`, 37/37 passed including tests #36/#37 for this truth). |
| 2 | Gallery thumbnail tiles display their photos without a visible black border/letterbox frame (PORT-05). | ✓ VERIFIED | `.tile` rule in `src/components/GalleryGrid.astro` — the frame shorthand is deleted and replaced with `border: none;` (a UA-stylesheet-neutralizing zero, not a substitute frame — the `.tile` element renders as a native `<button>`). `background: var(--color-ink)` (D-05 loading fallback) is retained. Live Playwright test "gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes" PASSES. |
| 3 | Éditions thumbnail tiles (sharing the same grid component) also display their photos without a visible black border/letterbox frame (PORT-05). | ✓ VERIFIED | Same shared `.tile` rule as truth #2 — one fix, both content types. Live Playwright test "édition detail (bento): every tile has 0px borders and object-fit: cover" PASSES. |
| 4 | Gallery detail pages show the site footer at the bottom of the page, in both French and English (PORT-06). | ✓ VERIFIED | `hideFooter` prop removed from both `<BaseLayout>` calls in `src/pages/galleries/[slug].astro` and `src/pages/en/galleries/[slug].astro` (confirmed by direct read — 0 matches for `hideFooter` in either file). `src/layouts/BaseLayout.astro` itself is untouched — its `hideFooter` prop, `= false` default, and negated-prop conditional wrapping `<footer class="chrome-band">` all remain intact, confirmed by direct read. Live Playwright tests "fr: footer is present ... scroll track is still >= 300px" and "en: footer is present" both PASS. |
| 5 | Édition detail pages still render exactly one `footer.chrome-band` (no regression from the PORT-06 change). | ✓ VERIFIED | Live Playwright test "no regression: footer is still present on an édition detail page" PASSES. |
| 6 | Both `sanity/schemas/gallery.ts` and `sanity/schemas/edition.ts` cap `statement.fr`/`statement.en` at the same character limit N, chained after the existing `required()` constraint (D-02/D-03). | ✓ VERIFIED | Direct file read confirms `.max(700)` on both `fr` and `en` subfields in both files, each chained between `.required()` and the terminal `.error(...)` call. Ran `npx vitest run tests/unit/statement-length-limit.test.ts` live: 5/5 assertions pass (2-per-file constraint count, cross-file identical value, sane-band check 300-800, `siteSettings.ts` untouched). `npm --prefix sanity run lint` and `npm --prefix sanity run build` both exit 0, run live. |
| 7 | N is at least as large as the longest published statement (no existing content invalidated). | ✓ VERIFIED | N=700 vs. the re-measured `N_floor`=453 (édition `entasse`, French) recorded in 18-02-SUMMARY.md's calibration table — a 247-character margin. `sanity build` succeeds (schema compiles), and the unit test's sane-band assertion (300-800) independently guards against a fat-fingered digit. |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/GalleryGrid.astro` | Frame declaration deleted from `.tile`, background retained | ✓ VERIFIED | Confirmed by direct read; `border: none;` added (documented deviation, necessary — see below) in place of the deleted frame, `background: var(--color-ink)` unchanged. |
| `src/pages/galleries/[slug].astro` | `hideFooter` prop removed from `<BaseLayout>` call | ✓ VERIFIED | Confirmed — 0 matches for `hideFooter`; all other props intact. |
| `src/pages/en/galleries/[slug].astro` | Same removal, EN twin | ✓ VERIFIED | Confirmed — 0 matches for `hideFooter`. |
| `src/components/DetailHero.astro` | 5 truncation declarations deleted from `.detail-hero__statement` | ✓ VERIFIED | Confirmed — rule now contains exactly `margin-top`, `font-size`, `line-height`, `color`. |
| `sanity/schemas/gallery.ts` | Max-length validation added to `statement.fr`/`statement.en` | ✓ VERIFIED | `.max(700)` present on both subfields; `assetRequired()` also present on `images` (CR-01 follow-up fix, unrelated to PORT-04/05/06 but confirmed present and correct). |
| `sanity/schemas/edition.ts` | Identical max-length validation, same N | ✓ VERIFIED | `.max(700)` present on both subfields, matches gallery.ts. |
| `tests/unit/statement-length-limit.test.ts` | Unit test proving lockstep N across both schema files | ✓ VERIFIED | File exists, 5 assertions, ran live and passes. |
| `tests/e2e/gallery.spec.ts` | New PORT-05 tile-border block; PORT-04 statement block; PORT-06 footer block inverted to assert presence | ✓ VERIFIED | All three describe blocks present (line 924, 1017, 773); ran live, all pass. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `GalleryGrid.astro` `.tile` rule | Both grid modes (masonry + bento) | Shared base CSS rule | WIRED | One rule deletion fixes both `/galleries/{slug}/` (masonry, `object-fit: contain`) and `/editions/{slug}/` (bento, `object-fit: cover`) — confirmed both live Playwright tests targeting each mode pass. |
| `BaseLayout.astro`'s negated-prop conditional (`{!hideFooter && <footer .../>}`) | Footer rendering | Prop omission | WIRED | Confirmed `hideFooter` prop, its `false` default, and the conditional all remain unmodified in `BaseLayout.astro`; omission on the gallery routes is sufficient — footer renders, proven live. |
| `.detail-hero__pin`'s `overflow: hidden` | Un-clamped statement containment | Sanity `.max(700)` source-side bound | WIRED | The CSS clamp was removed with no substitute, and the schema-level cap (700) is the sole overflow defence, empirically calibrated against the real rendered panel (calibration table in 18-02-SUMMARY.md) and locked by e2e pin-containment assertions across every published gallery, both tested viewports. |
| Two duplicated `localeTextField` helpers (`gallery.ts`, `edition.ts`) | Lockstep N | `tests/unit/statement-length-limit.test.ts` | WIRED | No shared module exists between the two files; the unit test is the sole automated guard against divergence and passes live. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit lockstep test passes | `npx vitest run tests/unit/statement-length-limit.test.ts` | 5/5 tests passed | ✓ PASS |
| Astro typecheck clean | `npm run typecheck` | 0 errors, 0 warnings (2 unrelated pre-existing hints in an unrelated spec file) | ✓ PASS |
| Static build succeeds | `npm run build` | 29 pages built, includes all 5 gallery + 3 édition detail pages FR/EN | ✓ PASS |
| gallery.spec.ts full file (chromium) | `npx playwright test gallery.spec.ts --project=chromium` | 37/37 passed, including PORT-04 (2), PORT-05 (2), PORT-06 (3) blocks | ✓ PASS |
| edition.spec.ts full file (chromium), regression check | `npx playwright test edition.spec.ts --project=chromium` | 12/12 passed | ✓ PASS |
| Sanity Studio lint | `npm --prefix sanity run lint` | exit 0 | ✓ PASS |
| Sanity Studio build (schema compiles) | `npm --prefix sanity run build` | exit 0 ("Build Sanity Studio" succeeded) | ✓ PASS |

Full workspace test suites (`npm run test:unit` all files, `npm run test:e2e` both projects) were not re-run in full during this verification — the SUMMARYs report them passing (170/170 and 276/276 respectively) and the targeted re-runs above (the specific new/changed test files, plus the full `gallery.spec.ts`/`edition.spec.ts` regression check) provide direct, independently-executed evidence for every must-have truth without re-running the entire suite twice.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PORT-04 | 18-02 | Visitor sees a gallery's full description/statement, not cut off mid-sentence | ✓ SATISFIED | Truths #1, #6, #7 above. REQUIREMENTS.md still shows this unchecked (`[ ]`) — per the task note, this is because the 18-02 executor deliberately deferred the checkbox update to the orchestrator's standard phase-complete step, not because the requirement is unmet. Actual code (CSS clamp removed, Sanity cap added) and live test runs prove it is met. |
| PORT-05 | 18-01 | Visitor sees gallery/Éditions thumbnails without a black border frame | ✓ SATISFIED | Truths #2, #3 above. REQUIREMENTS.md already shows `[x]`. |
| PORT-06 | 18-01 | Visitor sees the site footer on gallery pages | ✓ SATISFIED | Truths #4, #5 above. REQUIREMENTS.md already shows `[x]`. |

No orphaned requirement IDs found — REQUIREMENTS.md's Phase 18 mapping (PORT-04, PORT-05, PORT-06) exactly matches the union of both plans' `requirements:` frontmatter fields.

### Anti-Patterns Found

None. Scanned all 8 files touched by this phase (`GalleryGrid.astro`, both gallery route files, `DetailHero.astro`, `gallery.ts`, `edition.ts`, `gallery.spec.ts`, `statement-length-limit.test.ts`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers — zero matches. No stub patterns, no hardcoded empty data feeding a render path.

**Note on a documented deviation (not an anti-pattern):** 18-01's plan literally specified "pure deletion, no substitute" for the `.tile` border rule, and its own automated verify-gate grep (`0 declarations starting with border`) and acceptance criteria (`git diff --stat` shows exactly 1 deleted/0 added lines) technically fail against the shipped diff, because the executor discovered mid-task that `.tile` renders as a native `<button>` and Chromium's UA stylesheet applies its own default 2px border absent an explicit author `border` declaration. `border: none;` was added to neutralize that default — this is a UA-stylesheet reset, not a reintroduced frame, and matches an established codebase-wide convention (`DetailHero.astro`, `HomeCarousel.astro`, `BaseLayout.astro`, `Lightbox.astro` all do the same). The SUMMARY documents this transparently as an auto-fixed Rule 1 bug. Verified live: computed border-width is `0px` on all four sides in both grid modes, which is the actual functional oracle (PORT-05's real intent) — the plan's literal mechanical grep gate was written under an incorrect assumption and is superseded by the passing Playwright behavioral assertions. Not treated as a gap.

**Note on a post-SUMMARY follow-up fix (CR-01):** commit `2ec4816` ("fix(18): add missing assetRequired() validation to gallery images (CR-01)") was applied after both SUMMARYs were written, closing a code-review BLOCKER finding in `sanity/schemas/gallery.ts`'s `images` array validation. Confirmed present in the current codebase (`sanity/schemas/gallery.ts:164`, mirrors `edition.ts:140`). This is a different field (`images`, not `statement`) and a different concern (asset-presence validation, not border/footer/clamp display fixes) from PORT-04/05/06 — it does not affect any of the 7 truths verified above, and Studio build/lint still pass with it in place.

### Human Verification Required

5 items — all visual/interactive checks this project's `workflow.human_verify_mode: end-of-phase` config deliberately defers from inline plan execution to a single end-of-phase pass, harvested from the `<human-check>` blocks in 18-01-PLAN.md Task 2 and 18-02-PLAN.md Task 3. Every automated (CSS-computed-value / DOM-structural) proxy for each of these has already been verified above and passes live; only the final subjective/interactive confirmation remains.

1. **Footer visual styling on gallery detail pages (FR + EN)**
   **Test:** `npm run build && npm run preview`, open a gallery detail page in FR and EN, scroll to the bottom.
   **Expected:** Footer renders with correct spacing/color/legal links against the page background.
   **Why human:** Playwright proves structural presence + scroll-track safety, not subjective visual styling.

2. **No visible thumbnail border, desktop + phone widths, gallery + édition pages**
   **Test:** On the same pages, confirm thumbnails show no dark edge outline, at desktop and phone widths.
   **Expected:** Clean borderless thumbnails at both widths.
   **Why human:** Playwright proves `0px` computed border at 1280x900 for both content types; full-viewport visual confirmation deferred per project config.

3. **Sanity Studio blocks over-length statement input**
   **Test:** `npm --prefix sanity run dev`, paste >700 chars into a `statement` field.
   **Expected:** French error naming the 700-char limit; Publier blocked.
   **Why human:** Interactive Studio UX, not visible to static analysis (though `sanity build` already proves the schema compiles).

4. **Longest published document opens with no validation error**
   **Test:** In the same Studio session, open édition `entasse` (453 fr chars).
   **Expected:** No validation error.
   **Why human:** Interactive Studio confirmation.

5. **Full statement reads to the end with no clipping, longest gallery, desktop + phone**
   **Test:** `npm run build && npm run preview`, open `the-victorian-tea-room` at desktop and phone widths.
   **Expected:** Complete text, no cut-off, no spill outside the hero panel.
   **Why human:** Playwright already proves this via computed CSS for every gallery at both tested viewports (1280x900, 390x844) — this is the final subjective read-through, explicitly deferred per project config.

### Gaps Summary

No gaps found. All 7 observable truths derived from ROADMAP.md's Phase 18 Success Criteria and both plans' `must_haves.truths` are independently re-verified against the current codebase (not merely trusted from SUMMARY claims) via direct file reads, a live unit-test run, live targeted Playwright runs covering every new/changed assertion in this phase (`gallery.spec.ts` full file, 37/37; `edition.spec.ts` regression check, 12/12), and live Sanity Studio lint/build gates. The one requirement checkbox discrepancy (PORT-04 shown unchecked in REQUIREMENTS.md) is explained by a deliberately deferred bookkeeping step, not a missing implementation, and does not block this verification per the task's explicit guidance. The phase goal — complete gallery descriptions, borderless thumbnails, and a restored footer — is achieved in the codebase. Status is `human_needed` solely because this project's `workflow.human_verify_mode: end-of-phase` config defers 5 visual/interactive confirmations (all with passing automated proxies) to a single end-of-phase human pass, not because of any failed or uncertain automated check.

---

*Verified: 2026-08-03T08:00:00Z*
*Verifier: Claude (gsd-verifier)*
