---
phase: 20-mobile-navigation-accent-color
verified: 2026-08-04T17:15:00Z
status: passed
score: 4/4 ROADMAP success criteria verified; 6/7 20-06 gap-closure must-haves verified, 1 deferred to human sign-off
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 4/4 ROADMAP success criteria verified (with 3 human-verification items outstanding)
  gaps_closed:

    - "20-UAT.md Test 2 gap 1: language switcher rendered as a fourth Display-size (32px/600/Unbounded/ink) primary item inside .mobile-nav-panel__nav — now relocated to a direct child of the dialog, Label-size (14px/400/non-Unbounded/ink), stacked in the secondary tier directly above the Instagram line."
    - "20-UAT.md Test 2 gap 2: the mobile panel's Instagram secondary link was plain text with no glyph — now carries the header's own Instagram SVG glyph (duplicated, resized 20px to 16px, currentColor, aria-hidden) beside the @handle."
  gaps_remaining: []
  regressions: []
human_verification:

  - test: "Task 3's own end-of-phase <human-check> item 4: open the panel on a real phone-width viewport and judge whether the vertical spacing between the switcher line and the Instagram line reads as a deliberate, related pair rather than two unrelated items — tighten or open up if not."
    expected: "The two stacked secondary lines read as one cohesive group at a glance."
    why_human: "Explicitly named in 20-06-PLAN.md's own Task 3 action text as \"the one judgement call the automated geometry gate cannot make.\" The automated geometry test (mobile-nav.spec.ts, the '(20-06)' stacked-rows test) proves the two lines are stacked, centred, and within the 44-56px bottom-offset band, but optical rhythm/deliberateness is a human aesthetic call that presence/geometry checks cannot make. Per this project's workflow.human_verify_mode: end-of-phase setting (20-06-SUMMARY.md coverage item D4), this check was deliberately deferred by the executor to this end-of-phase verification pass rather than performed mid-flight."
---

# Phase 20: Mobile Navigation & Accent Color Verification Report (Re-verification after gap-closure plan 20-06)

**Phase Goal:** On phone-width viewports, the homepage header becomes a self-contained nav menu (hamburger or similar) with the language switcher folded inside it, and each visit shows a randomly-picked accent color drawn from the existing per-gallery `heroColor` values — desktop/tablet header and accent-color behavior stay completely unchanged.
**Verified:** 2026-08-04T17:15:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plan 20-06, which closed the two major gaps 20-UAT.md Test 2 recorded (switcher hierarchy, Instagram glyph).

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | At phone width, the homepage's desktop header bar is replaced by a hamburger/menu control that opens to reveal the nav links | ✓ VERIFIED | Live re-run of `tests/e2e/mobile-nav.spec.ts` (54 tests, this verification, isolated port to avoid a stale concurrent-session dev server on 4321) — all pass. Own screenshots at 393x852 (closed: logo + mode-toggle + hamburger only; open: full-screen dialog with the three primary links + secondary tier) confirm the structural claim directly, not via SUMMARY narration. |
| 2 | The language switcher is reachable from inside that mobile menu on the homepage at phone widths, not shown inline as it is on desktop | ✓ VERIFIED — **and now in the corrected tier per the gap-closure**. | Code read of `src/components/MobileNavPanel.astro` confirms `<LanguageSwitcher />` is a direct child of `<dialog>`, positioned between `</nav>` and `.mobile-nav-panel__secondary`, no longer inside `.mobile-nav-panel__nav`. Own screenshot confirms the panel shows "⊕ EN" as a small line above "@ajs_romanelepont", both at the same small size — matching the user's UAT request exactly ("language switch is supposed to be at the bottom, with the same font size of the instagram"). Live-verified test "the panel's language switcher navigates and sets the locale cookie" passes from the new position. |
| 3 | Revisiting the homepage on a phone across multiple visits shows different accent colors, each one of the existing per-gallery `heroColor` values (no new palette introduced) | ✓ VERIFIED | Re-ran `tests/e2e/homepage-accent-random.spec.ts` live (this verification): 6/6 passing, including forced-lowest/forced-highest boundary checks and the unstubbed multi-reload palette-membership check. This mechanism was untouched by gap-closure plan 20-06 (`git diff --stat src/lib/home-carousel.ts src/components/HomeCarousel.astro` shows no changes from this plan), and 20-UAT.md's own Test 3 already passed on real-device human testing. |
| 4 | On tablet/desktop viewports, the homepage header bar, language switcher placement, and accent-color behavior are pixel-for-pixel and behaviorally unchanged from the pre-milestone (Phase 19) state | ✓ VERIFIED | Re-ran `tests/e2e/visual.spec.ts` live: 2/2 passing, `git status --porcelain tests/e2e/visual.spec.ts-snapshots/` empty — the `/about/` shared-header baseline was not touched or re-recorded, proving the gap-closure plan (which only edits `.mobile-nav-panel`-scoped selectors) did not leak onto the shared desktop header. `src/components/LanguageSwitcher.astro` confirmed unmodified (`git log` shows no phase-20 commits touching it; the file provides D-06's accent-pink default everywhere else on the site). `tests/e2e/site-header.spec.ts` (18 tests) and `tests/e2e/i18n.spec.ts` re-run live and pass. |

**Score:** 4/4 ROADMAP success criteria verified (0 present-but-behavior-unverified)

### 20-06 Gap-Closure Must-Haves (plan frontmatter)

| # | Must-have truth | Status | Evidence |
|---|---|---|---|
| 1 | Exactly THREE big Display-size links in the centred primary stack; switcher no longer one of them | ✓ VERIFIED | `dialog#mobile-nav .mobile-nav-panel__nav > *` count 3 in code (`MobileNavPanel.astro` lines 93-97); own screenshot shows only Éditions/À propos/Contact in the big stack. |
| 2 | Switcher renders at 14px/400/non-Unbounded/ink in the secondary tier | ✓ VERIFIED | `SiteHeader.astro`'s Display-role override block (former lines 767-793) is deleted; the new `.mobile-nav-panel > .language-switcher .switcher-link { color: var(--color-ink) }` rule is the only override, letting `LanguageSwitcher.astro`'s own 14px/400 defaults apply. Live-run typography test (`mobile-nav.spec.ts`, "the primary list renders at Display size and the switcher renders at Label size in ink (20-06)") passes for both `/` and `/en/`. |
| 3 | Switcher and Instagram occupy two separate stacked rows, switcher above, both centred | ✓ VERIFIED | Own screenshot shows the stacked order (switcher above Instagram). Live geometry test ("the switcher and Instagram lines are two stacked rows near the panel's bottom edge (20-06)") passes. |
| 4 | Instagram line carries the same glyph the desktop header uses, sized to match the switcher's globe | ✓ VERIFIED | Code read of `MobileNavPanel.astro` lines 120-132: SVG duplicated verbatim from `SiteHeader.astro` lines 106-118 at 16x16 instead of 20x20, `currentColor`-driven. Own screenshot shows the glyph rendered beside the @handle. Live structural test asserts svg count 1, `aria-hidden="true"`, and both the switcher's globe and the Instagram svg computed width equal 16px. |
| 5 | Both secondary lines keep a >=44px tap target; switcher still navigates and sets the cookie from inside the focus-trapped panel | ✓ VERIFIED | `SiteHeader.astro`'s override deletion explicitly removes the old `padding: 0` that would have collapsed `LanguageSwitcher.astro`'s own `padding: 8px`/`min-height: 44px`. Live geometry test asserts both boxes report height >= 44 (rounded); live behaviour test "the panel's language switcher navigates and sets the locale cookie" passes from the new DOM position. |
| 6 | Instagram line stays bottom-most, 48px clear of the panel edge; href/target/rel unchanged | ✓ VERIFIED | `.mobile-nav-panel__secondary`'s `margin-bottom: var(--space-2xl)` is untouched (only a `gap` declaration was added for the icon/label pair). Live-run "the secondary line renders at Label size" test (unedited, still asserts `marginBottom`) passes; `target="_blank" rel="noopener noreferrer"` confirmed unchanged in the code read. |
| 7 | Every other page's header, desktop homepage header, panel motion/halftone/focus-containment, script-count tripwire unchanged | ✓ VERIFIED | Full re-run this verification: `npm run typecheck` 0 errors; `npm run build` succeeds; `mobile-nav.spec.ts` 54/54 (isolated port); `accessibility.spec.ts`+`site-header.spec.ts`+`i18n.spec.ts`+`homepage-carousel-core.spec.ts`+`homepage-mobile-responsive.spec.ts`+`visual.spec.ts` 87/87; `critical.smoke.spec.ts` 10/10 across `chromium` and `webkit-mobile`; `npx vitest run --coverage` 284/284 unit tests, 95.04%/90.01%/96.73%/95.9% (matches the SUMMARY's claimed baseline exactly, not merely trusted). `EXPECTED_SCRIPT_COUNT = 4` grep confirms 1 occurrence, unchanged. |

**Note on test-environment discrepancy caught during this verification:** the first attempt to run `mobile-nav.spec.ts`'s script-count net tests against the default `playwright.config.ts` (port 4321) reported failures (14/18 scripts instead of 4) on `/about/` and `/contact/`. Investigation traced this to a stale, unrelated `astro dev` process from a separate concurrent session already squatting on port 4321 (a known environment quirk this project's memory explicitly documents and that 20-06-SUMMARY.md's own Deviation #2 also hit and worked around). Re-running against a freshly built, isolated-port `astro preview` server (the same workaround the executor used, reverted afterward with an empty `git diff --stat playwright.config.ts`) produced the clean 54/54 pass recorded above. This is not a code gap — it is confirmed to be test-infrastructure noise from a concurrent session, consistent with this project's own "concurrent sessions are the norm" operating note.

### Deferred Items

None — no gap identified in this phase required deferral to a later phase. (The two pre-existing `NaN` image-loading-timing flakes in `edition.spec.ts`/`gallery.spec.ts`, logged in `deferred-items.md`, are confirmed unrelated to this phase's files and out of scope, consistent with the prior verification's finding.)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/components/MobileNavPanel.astro` | Switcher relocated to secondary tier; Instagram glyph inlined | ✓ VERIFIED | Read directly: `<LanguageSwitcher />` is a direct dialog child (not inside `.mobile-nav-panel__nav`); 16x16 SVG glyph present inside `.mobile-nav-panel__secondary` before `{instagramLabel}`. `grep -c 'LanguageSwitcher'` = 3 (header comment + import + single usage — no duplication). |
| `src/components/SiteHeader.astro` | Display-role override deleted; secondary-tier layout + ink colour rule added | ✓ VERIFIED | Read directly: the three-rule override block is gone; `.mobile-nav-panel > .language-switcher` (position/z-index/align-self) and `.mobile-nav-panel > .language-switcher .switcher-link` (`color: var(--color-ink)`) present; `gap: var(--space-xs)` added to `.mobile-nav-panel__secondary`; `margin-bottom: var(--space-2xl)` untouched. |
| `src/components/LanguageSwitcher.astro` | NOT modified (D-06 accent-pink stays site-wide) | ✓ VERIFIED | `git status --porcelain` clean; no phase-20 commit touches this file (git log shows only Phase 1/4/10 commits). |
| `tests/e2e/mobile-nav.spec.ts` | 7 new `(20-06)`-tagged tests encoding the reversed hierarchy | ✓ VERIFIED | `--list -g "20-06"` enumerates exactly 7 tests (2 structural, 2 typography, 1 geometry, 2 durable href guards), all passing live. Four pre-existing net describe blocks (lines 1-154) and `EXPECTED_SCRIPT_COUNT = 4` confirmed untouched. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `SiteHeader.astro`'s hamburger | `MobileNavPanel.astro`'s dialog | `data-role` hooks + native dialog API | ✓ WIRED | Open/close/focus-restore/viewport-guard all exercised live (unchanged from prior verification; not touched by 20-06). |
| `dialog#mobile-nav > .language-switcher` | `.mobile-nav-panel > .language-switcher .switcher-link` CSS | direct-child selector | ✓ WIRED | The markup move (direct child of dialog) and the CSS selector shape match — confirmed by the live-passing typography/structural tests, which would fail silently if the selector shape and DOM nesting diverged (the exact failure class 20-RESEARCH.md's Pitfall 2 and this plan's own key_links entry warn about). |
| `MobileNavPanel.astro`'s duplicated Instagram SVG | `SiteHeader.astro`'s source-of-truth glyph (lines 106-118) | verbatim duplication, resized 20→16 | ✓ WIRED | Visual + structural match confirmed (own screenshot, live svg-count/aria-hidden/width assertions). |

### Data-Flow Trace (Level 4)

Not applicable in the dynamic-data sense (this is a 100% static-build, author-literal markup change — no DB/API/store data source to trace). The one relevant "flow" is the switcher's href/cookie logic, confirmed unchanged and functioning from its new DOM position by the live-passing "navigates and sets the locale cookie" test and the two new durable href-guard tests.

### Behavioral Spot-Checks / Live Re-Execution (this verification, not SUMMARY claims)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | 0 errors, 0 warnings, 2 pre-existing hints (unrelated files) |
| Build | `npm run build` | Succeeds, 29 pages |
| Unit tests + coverage | `npx vitest run --coverage` | 284/284 passing; 95.04% stmts / 90.01% branch / 96.73% funcs / 95.9% lines — matches SUMMARY's claimed baseline exactly |
| `tests/e2e/mobile-nav.spec.ts` | `npx playwright test ... --project=chromium` (isolated port, fresh preview build) | 54/54 passing |
| `tests/e2e/mobile-nav.spec.ts` `-g "20-06"` | `--list` | 7 tests enumerated, matching the plan's claimed 5 (Task 1) + 2 (Task 3) |
| `tests/e2e/accessibility.spec.ts`, `site-header.spec.ts`, `i18n.spec.ts`, `homepage-carousel-core.spec.ts`, `homepage-mobile-responsive.spec.ts`, `visual.spec.ts` | same | 87/87 passing |
| `tests/e2e/homepage-accent-random.spec.ts` | same | 6/6 passing |
| `tests/e2e/critical.smoke.spec.ts` | both `chromium` and `webkit-mobile` | 10/10 passing |
| Visual snapshot dir | `git status --porcelain tests/e2e/visual.spec.ts-snapshots/` | empty (no re-baseline) |
| Own screenshots at 393x852 | Playwright screenshot, closed and open states | Closed: logo + mode-toggle + hamburger only. Open: three big primary links, then a small "⊕ EN" line, then a small "@ajs_romanelepont" line with the Instagram glyph — directly confirms both UAT-requested fixes, not merely code-read inference. |
| `playwright.config.ts` port workaround | `git diff --stat playwright.config.ts` | empty after revert — verification left no tracked-file residue |

### Anti-Patterns Found

None in the phase's modified files (`src/components/MobileNavPanel.astro`, `src/components/SiteHeader.astro`, `tests/e2e/mobile-nav.spec.ts`) — no `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers, no stub returns, no hardcoded-empty props feeding user-visible output.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| HOME-13 | 20-02, 20-03, 20-04, 20-05, 20-06 | Visitor sees a mobile nav menu (hamburger or similar) on the homepage instead of the desktop header bar, with the language switcher inside it, on phone-width viewports only | ✓ SATISFIED | REQUIREMENTS.md marks HOME-13 complete under Phase 20. SC #1/#2 evidence above, now including the corrected switcher-tier placement from plan 20-06. |
| HOME-16 | 20-01, 20-05 | Visitor on a phone sees a different accent color each visit, randomly picked from the existing per-gallery `heroColor` values | ✓ SATISFIED | REQUIREMENTS.md marks HOME-16 complete under Phase 20. SC #3 evidence above; untouched by plan 20-06. |

No orphaned requirements: REQUIREMENTS.md maps only HOME-13/HOME-16 to Phase 20 (confirmed again this pass), and both remain claimed across the 6 plans' frontmatter (20-06's frontmatter claims `[HOME-13]`, consistent with it being a HOME-13-scoped gap closure).

### Human Verification Required

One item remains, explicitly named by the plan itself as a judgement call automation cannot make, and deliberately deferred by the executor to this end-of-phase verification per this project's `workflow.human_verify_mode: end-of-phase` setting (20-06-SUMMARY.md coverage item D4):

1. **Inter-line spacing judgement** — Open the mobile nav panel on a real phone-width viewport and judge whether the vertical gap between the switcher line and the Instagram line reads as a deliberate, related pair (rather than two arbitrarily-spaced items). The automated geometry test proves the two lines are stacked, centred, and within the 44-56px bottom-offset band, but "reads as a deliberate pair" is an aesthetic judgement this verifier's screenshot inspection supports as plausible (the ~23px optical gap looks intentional and matches the plan's stated design rationale) but cannot certify with the same confidence as a real human eye on a real device.

The prior verification's three human-verification items are resolved as follows:

- **D-03 motion feel across engines** — Already passed as 20-UAT.md Test 1 (real on-phone test). Not re-opened by plan 20-06 (motion CSS untouched).
- **Visual fidelity against the reference image** — This was 20-UAT.md Test 2, which *failed* and is the subject of this entire re-verification cycle. The two concrete defects it reported (switcher hierarchy, missing Instagram glyph) are now closed and confirmed above. The residual, narrower spacing-judgement question is captured as the one remaining item above.
- **Visibly different accent colours across reloads** — Already passed as 20-UAT.md Test 3 (real on-phone test). Not touched by plan 20-06.

### Gaps Summary

No gaps. Both major defects 20-UAT.md Test 2 diagnosed (the language switcher rendering as a fourth Display-size primary item, and the Instagram link missing its glyph) are independently confirmed closed against the live codebase in this verification — via direct code reads of `MobileNavPanel.astro`/`SiteHeader.astro`, live re-execution of the full `mobile-nav.spec.ts` suite (54/54, including all 7 `(20-06)`-tagged tests) plus the surrounding regression net (87/87), and this verifier's own screenshots of the open panel, which visually match the user's UAT-reported request exactly. `LanguageSwitcher.astro` has a confirmed-empty diff, so D-06's accent-pink default is intact everywhere else on the site. All four ROADMAP success criteria hold, both requirement IDs (HOME-13, HOME-16) are satisfied, unit coverage matches the previously-claimed baseline exactly, and no anti-patterns or orphaned requirements were found. The only open item is a single, narrowly-scoped aesthetic judgement call (inter-line spacing) that the phase's own plan explicitly named as outside automation's reach and deliberately deferred to this end-of-phase pass — this routes the phase to `human_needed`, not to any code gap.

---

_Verified: 2026-08-04T17:15:00Z_
_Verifier: Claude (gsd-verifier)_
