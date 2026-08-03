---
phase: quick-260803-jwl
plan: 01
subsystem: ui
tags: [astro, css, playwright, e2e, detail-hero, view-transitions]

requires:
  - phase: quick-260803-bvu
    provides: "The édition-only hero treatment flag (`editionVariant`) and its Item 4 view-transition-shake fix, and the Item 7 uncropped-hero override this task reverts"
provides:
  - "Édition detail-page hero photo restored to the site-wide cropped, fill-the-box object-fit: cover treatment, identical to gallery detail heroes"
  - "quick-260803-bvu Item 4's view-transition-name: none shake fix preserved verbatim, confirmed live to still hold"
  - "edition.spec.ts hero-crop test rewritten to assert édition/gallery hero parity instead of divergence"
  - "Stale comments in DetailHero.astro, edition.spec.ts, and image-orientation.ts corrected to no longer claim the édition (or gallery) hero renders uncropped"
affects: [detail-hero, edition-detail-page, gallery-detail-page]

tech-stack:
  added: []
  patterns:
    - "Single opt-in boolean prop (`editionVariant`) now scopes exactly one behavior (view-transition-name suppression) rather than bundling two unrelated concerns (crop + transition naming) behind one flag"

key-files:
  created: []
  modified:
    - src/components/DetailHero.astro
    - tests/e2e/edition.spec.ts
    - src/lib/image-orientation.ts

key-decisions:
  - "Deleted the `.detail-hero--edition .detail-hero__img { object-fit: contain; }` override entirely (not commented out), so édition heroes fall back to the base `.detail-hero__img { object-fit: cover; }` rule already shared by gallery heroes — zero page-level changes needed since both callers already feed the hero the same uncropped full-size source."
  - "Kept `editionVariant` as the prop name and kept the desktop-only `.detail-hero--edition .detail-hero__img { view-transition-name: none; }` rule completely untouched — it is Item 4's independent shake fix, not part of this revert."
  - "Rewrote (not deleted) the hero-crop e2e describe block to assert positive parity (édition hero object-fit === gallery hero object-fit === 'cover') rather than removing the guard — a real regression-prevention test, now describing the correct contract."

requirements-completed: [260803-jwl]

coverage:
  - id: D1
    description: "Édition hero photo fills its hero box edge-to-edge with a crop (object-fit: cover), identical to a gallery detail hero, at desktop and mobile, fr and en"
    verification:
      - kind: unit
        ref: "grep -cE '^[[:space:]]*object-fit: [a-z-]+;$' src/components/DetailHero.astro => 1"
        status: pass
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts:224 'editions hero crops identically to a gallery hero (quick-260803-jwl)'"
        status: pass
      - kind: automated_ui
        ref: "live Playwright script screenshots: edition-hero-desktop.png, gallery-hero-desktop.png, edition-hero-mobile.png, gallery-hero-mobile.png — both crop edge-to-edge, no ink letterbox band, at 1280x900 and 390x844"
        status: pass
    human_judgment: false
  - id: D2
    description: "quick-260803-bvu Item 4's édition-to-édition desktop navigation shake fix survives intact — no hero shake/jump/morph after scrolling to the settled reveal panel, repeated 3+ times in both directions, at desktop and mobile"
    verification:
      - kind: e2e
        ref: "tests/e2e/edition.spec.ts:469 'editions hero cross-document transition scoping (Item 4, quick-260803-bvu)' — full suite passed (287/287, chromium + webkit-mobile)"
        status: pass
      - kind: automated_ui
        ref: "live Playwright script (STEP 8): 9 desktop édition->édition navigations (3 rounds x 3 pairs) after scrollTo(1200) — every incoming hero measured full-bleed at 1280px width (no shrunk-morph residue); 9 mobile navigations after scrollTo(800) — every incoming hero at 390px, view-transition-name: none throughout"
        status: pass
    human_judgment: false
  - id: D3
    description: "No test deleted/skipped/weakened; no stale comment left anywhere claiming an édition or gallery hero renders uncropped; gallery.spec.ts and all grid/masonry files untouched; exactly 3 files in the diff"
    verification:
      - kind: unit
        ref: "grep -c \"toBe('contain')\" tests/e2e/edition.spec.ts => 0"
        status: pass
      - kind: unit
        ref: "git diff --name-only => src/components/DetailHero.astro, src/lib/image-orientation.ts, tests/e2e/edition.spec.ts (exactly 3, gallery.spec.ts absent)"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-08-03
status: complete
---

# Quick Task 260803-jwl: Revert Édition Hero Photo to Cropped Fill Summary

**Deleted the édition-only `object-fit: contain` CSS override in `DetailHero.astro` (reverting quick-260803-bvu Item 7 only) so édition and gallery detail-page heroes crop identically again, while keeping Item 4's view-transition-shake fix and every affected test/comment honest about the final state.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-08-03T13:03:54Z
- **Tasks:** 1 (single atomic task per plan)
- **Files modified:** 3

## Accomplishments

- Deleted the `.detail-hero--edition .detail-hero__img { object-fit: contain; }` rule and its preceding Item 7 comment block from `DetailHero.astro`. Édition heroes now inherit the base `.detail-hero__img { object-fit: cover; }` rule, exactly matching gallery heroes. Verified the file now contains exactly one `object-fit` declaration.
- Preserved the desktop-only `.detail-hero--edition .detail-hero__img { view-transition-name: none; }` rule (Item 4's shake fix) completely untouched — same selector, independent concern.
- Corrected the one stale clause inside the Item 4 comment that blamed Item 7's letterboxing divergence for worsening the shake; it now records that Item 7 was reverted by quick-260803-jwl and that the size-delta morph is the sole remaining cause.
- Rewrote the file-header `quick-260803-bvu (Items 4 & 7)` paragraph and the `editionVariant` Props doc so `editionVariant` is documented as scoping ONLY the view-transition-name suppression — crop is no longer a per-caller behavior.
- Rewrote `edition.spec.ts`'s hero-crop describe block (renamed to `editions hero crops identically to a gallery hero (quick-260803-jwl)`) to assert both heroes report `object-fit: cover`, instead of asserting the reverted `contain` divergence. Kept both discovery patterns byte-identical.
- Corrected the stale attribution sentence above the masonry helpers in `edition.spec.ts` — it wrongly credited quick-260803-ira with fixing "the édition hero photo"; rewritten to describe only the grid/masonry history, with no claim about the hero.
- Corrected `image-orientation.ts`'s `pickHeroIndex` doc comment, which claimed the hero "renders `object-fit: contain`, never cropping" — now correctly describes the crop-to-fill behavior that is precisely why a landscape-preferred hero image matters. Function logic and contract bullets are byte-identical.
- Ran the mandatory live empirical check (STEP 8) against a real running `astro preview` server: 9 desktop édition-to-édition navigations (3 full rounds through all 3 published éditions, in both directions) after scrolling to the settled reveal panel — every incoming hero measured full-bleed (1280px width), no shrunk-morph residue detected. Repeated at mobile width (390px) — every incoming hero correctly sized, `view-transition-name: none` held throughout. Side-by-side screenshots of an édition hero and a gallery hero at both desktop (1280x900) and mobile (390x844) confirm both crop edge-to-edge with no letterboxing, visually the same treatment.

## Task Commits

Single atomic task per plan:

1. **Task 1: Restore the édition hero photo's crop and correct every stale claim about it** - `5deb5a2` (fix)

_Note: no TDD gate applies to this plan (`type="auto"`, no `tdd="true"`)._

## Files Created/Modified

- `src/components/DetailHero.astro` - Deleted the édition-only `object-fit: contain` override and its Item 7 comment; corrected the header comment, the `editionVariant` Props doc, and one stale clause in the Item 4 comment. Item 4's `view-transition-name: none` rule is untouched.
- `tests/e2e/edition.spec.ts` - Rewrote the hero-crop describe/test to assert édition/gallery hero object-fit parity (`cover` both); corrected the stale ira/hero attribution sentence above the masonry helpers to describe only grid history.
- `src/lib/image-orientation.ts` - Corrected the `pickHeroIndex` doc comment's false claim that the hero renders uncropped; logic and contract bullets unchanged.

## Decisions Made

- Deleted the crop override outright rather than commenting it out, per plan instruction — no placeholder left behind.
- Verified via planning-time cross-reference (not re-verified with new code) that both édition and gallery detail pages already feed the hero the same uncropped full-size image source (`fullSizeUrl(heroImage, 2000)` + `responsiveImageSrcSet`), so deleting the one CSS override was sufficient with no page-level changes required.
- Used a temporary local-only `playwright.config.ts` port override (4321 -> 4325) to run `npm run test:e2e` and the live STEP 8 check, because an unrelated `astro dev` process (owned by a different checkout, PID 12470, orphaned/PPID 1) was already bound to port 4321 in this shared-host environment and `reuseExistingServer: !process.env.CI` would otherwise have silently attached Playwright to that stale, unrelated server instead of a fresh build of this worktree — the earlier symptom was 9 failing tests whose assertions had nothing to do with this task's changes (masonry class missing, wrong object-fit values, timeouts), all of which passed once tests ran against this worktree's own preview server. The config was reverted to its checked-in state (`git checkout -- playwright.config.ts`) before the final commit; `playwright.config.ts` is not in the diff.

## Deviations from Plan

None - plan executed exactly as written. The temporary local port workaround above was environment-only (not a code deviation) and was fully reverted before committing.

## Issues Encountered

- **Stray unrelated process on port 4321:** an orphaned `astro dev --json` process from a different checkout (`/Users/florian/Projects/ajs-website`, not this worktree) was bound to port 4321. Because `playwright.config.ts` sets `reuseExistingServer: !process.env.CI`, the first `npm run test:e2e` run silently attached to that stale server and reported 9 unrelated failures. Diagnosed via `lsof -i :4321` + `ps -p <pid>`, resolved by temporarily pointing the local Playwright config at port 4325 (leaving the stray process alone, since it wasn't mine to kill), re-running the full suite (287/287 passed across chromium + webkit-mobile), then reverting the config change before the commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Édition and gallery detail-page heroes are now visually and behaviorally identical in crop treatment; no known regressions.
- No blockers. This closes out the third live-feedback correction in the Phase 18 gallery/éditions display-fixes session (following quick-260803-ira and quick-260803-jby).

---
*Phase: quick-260803-jwl*
*Completed: 2026-08-03*

## Self-Check: PASSED

- FOUND: src/components/DetailHero.astro
- FOUND: src/lib/image-orientation.ts
- FOUND: tests/e2e/edition.spec.ts
- FOUND commit 5deb5a2 in `git log --oneline --all`
