---
phase: quick-260724-mjp
plan: 1
subsystem: ui
tags: [astro, scroll-reveal, gallery-detail, edition-detail, lightbox, playwright]

requires:
  - phase: quick-260724-l5i
    provides: EditionHero.astro sketch-005 Synthesis scroll-reveal hero (now generalized by this plan)
provides:
  - Shared DetailHero.astro component (renamed/generalized from EditionHero.astro) with optional formatText/caption/total props and an objectFit prop
  - Gallery detail pages (FR/EN) upgraded from a static full-bleed hero to the Synthesis scroll-reveal hero, with a clickable cover photo (Lightbox index 0) and no-crop object-fit: contain
  - e2e coverage for the rename (locator tracking) plus new gallery hero-clickable and reduced-motion tests
affects: [portfolio gallery detail pages, edition detail pages, Lightbox integration]

tech-stack:
  added: []
  patterns:
    - "Shared détail-page hero component with optional per-surface props (formatText/caption/total) and an objectFit escape hatch ('cover' default | 'contain') so callers with different crop requirements can share one component without duplicating markup/script/CSS."

key-files:
  created: []
  modified:
    - src/components/DetailHero.astro (renamed from EditionHero.astro, generalized)
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - tests/e2e/edition.spec.ts
    - tests/e2e/gallery.spec.ts

key-decisions:
  - "Made formatText/caption/total genuinely optional (not empty-string hacks) so DetailHero can serve gallery pages, which have no format-details line, without reserving layout space for it."
  - "Added an objectFit prop ('cover' default | 'contain') so galleries can letterbox instead of crop the hero photo — a hard requirement from the user (gallery hero photos must never be cropped, unlike the édition hero which crops via object-fit: cover)."
  - "Dropped the mandatory revealFormat element guard in the scroll script and individually null-guarded its two write sites, so pages with no format element (galleries) still get the scroll driver attached; the reveal-panel opacity now derives from titleT alone, which is mathematically identical to the previous Math.max(titleT, formatT) since formatT never exceeds titleT."
  - "Re-scoped gallery.spec.ts's grid-thumbnail assertions to .gallery-grid, since the hero is now itself a [data-gallery-thumb] trigger and would otherwise shadow the first real grid thumbnail in unscoped locators."

patterns-established:
  - "objectFit?: 'cover' | 'contain' prop pattern for shared hero/media components where different callers need different crop behavior without touching the default caller's output."

requirements-completed: [QUICK-260724-mjp]

coverage:
  - id: D1
    description: "EditionHero.astro renamed to DetailHero.astro with neutral detail-hero* classes; formatText/caption/total are genuinely optional with conditional rendering; scroll script is null-safe when no format element is present."
    verification:
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
      - kind: other
        ref: "grep -rn EditionHero src/ returns no matches; grep -c detail-hero__pin DetailHero.astro >= 1; grep -c edition-detail__hero DetailHero.astro == 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both édition détail twins (FR/EN) re-wired to import/render DetailHero with unchanged props — byte-identical behavior/output (no objectFit passed, defaults to cover)."
    verification:
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both gallery détail twins (FR/EN) render DetailHero with objectFit=\"contain\" (no-crop), no formatText/caption; gallery.images.slice(1) grid skip, full-array Lightbox, and SEO/structuredData preserved unchanged; old .gallery-detail__hero* CSS removed."
    verification:
      - kind: unit
        ref: "npm run typecheck (astro check) — 0 errors"
        status: pass
      - kind: other
        ref: "grep -c objectFit=\"contain\" on both gallery twins == 1; grep -c gallery.images.slice(1) == 1; grep -c 'Lightbox images={gallery.images}' == 1; grep -c gallery-detail__hero == 0"
        status: pass
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts — full suite"
        status: pass
    human_judgment: false
    rationale: "Orchestrator independently re-verified: supplied .env, ran npm ci in sanity/, built (27/27 pages), and confirmed via computed-style inspection on the live preview that .detail-hero__img has object-fit: contain (via the detail-hero__img--contain class) on gallery pages while édition pages have plain object-fit: cover — the no-crop requirement is provably satisfied by CSS, not just by test assertions. Ran the full e2e suite on an isolated port-4399 preview (bypassing the stale port-4321 process): 175/175 passing, chromium + webkit-mobile."
  - id: D4
    description: "e2e locators in both suites track the detail-hero* rename; gallery.spec.ts gains hero-clickable (FR+EN) coverage and a reduced-motion block mirroring edition.spec.ts's."
    verification:
      - kind: e2e
        ref: "tests/e2e/gallery.spec.ts#gallery hero is clickable (sketch 005); tests/e2e/gallery.spec.ts#gallery hero reduced-motion (sketch 005); tests/e2e/edition.spec.ts (renamed locators only, no new tests)"
        status: pass
    human_judgment: false
    rationale: "Orchestrator re-ran against the isolated port-4399 preview: both new gallery describe blocks pass (4/4 new tests: hero-clickable FR+EN, reduced-motion x2), and all édition tests pass with the renamed locators. 22/22 in the targeted gallery+edition run, 175/175 in the full suite."

duration: ~30min
completed: 2026-07-24
status: complete
---

# Quick Task 260724-mjp: Extend the Synthesis Scroll-Reveal Hero to Galleries (No-Crop) Summary

**Generalized `EditionHero.astro` into a shared `DetailHero.astro` and extended the sketch-005 Synthesis scroll-reveal hero to both gallery detail pages, adding a clickable cover photo (Lightbox index 0) with `object-fit: contain` so gallery hero photos are never cropped — unlike the unchanged édition hero, which still crops via `object-fit: cover`.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-07-24
- **Tasks:** 3/3
- **Files modified:** 7 (1 renamed component, 4 detail-page twins, 2 e2e spec files)

## Accomplishments

- Renamed `EditionHero.astro` → `DetailHero.astro` (git mv, history preserved), with every `edition-detail__hero*` class renamed to neutral `detail-hero*` classes across markup, script querySelectors, and both CSS media-query branches
- Made `formatText`/`caption`/`total` genuinely optional props (conditional rendering, no empty-string layout-reservation hacks) so the component serves détail pages with no format-details line
- Added an `objectFit?: 'cover' | 'contain'` prop (default `'cover'`) driving a `.detail-hero__img--contain` modifier class — the no-crop escape hatch galleries need; éditions are unaffected (no prop passed, byte-identical `cover` default)
- Made the scroll script null-safe for the now-optional format element: dropped the mandatory `revealFormat` guard, individually wrapped its two write sites, and confirmed the reveal-panel opacity math (`titleT` alone) is mathematically identical to the prior `Math.max(titleT, formatT)`
- Re-wired both édition détail twins (FR/EN) to `<DetailHero>` with unchanged props — zero behavioral change
- Replaced both gallery détail twins' (FR/EN) old static 70vh full-bleed hero with `<DetailHero objectFit="contain">` — galleries now get the sticky-pin scroll-scrubbed shrink (100%→55%), a clickable cover photo opening the Lightbox at index 0, and letterboxed (never-cropped) hero photos, while preserving `gallery.images.slice(1)` grid skip, the full-array Lightbox, and SEO/structuredData
- Removed the now-dead `.gallery-detail__hero*` CSS from both gallery twins
- Updated `edition.spec.ts`'s four hero locators to track the rename (no behavioral change)
- Updated `gallery.spec.ts`'s "responsive hero/thumbnail/lightbox" test to re-scope grid-thumbnail assertions to `.gallery-grid` (the hero is now itself a `[data-gallery-thumb]` and would otherwise shadow the first real grid thumbnail)
- Added a new "gallery hero is clickable (sketch 005)" e2e block (FR+EN) proving `data-index="0"` opens the Lightbox at 1/N with focus return
- Added a new "gallery hero reduced-motion (sketch 005)" e2e block mirroring `edition.spec.ts`'s pattern (pin not sticky in reduced motion, reveal `<h1>` visible, overlay hidden, lightbox still opens; sticky by default otherwise)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename EditionHero -> DetailHero, make formatText/caption optional, re-wire both édition twins** - `fe86708` (refactor)
2. **Task 2: Wire DetailHero into both gallery twins as a clickable hero (no format, no caption)** - `3c10f40` (feat)
3. **Task 3: Track e2e locators through the rename + add gallery hero-clickable and reduced-motion coverage** - `5cc6a7e` (test)

**Plan metadata:** committed separately by the orchestrator (this executor does not commit docs artifacts).

## Files Created/Modified

- `src/components/DetailHero.astro` - Renamed/generalized shared détail-page scroll-reveal hero (formerly `EditionHero.astro`); optional `formatText`/`caption`/`total`, new `objectFit` prop, null-safe scroll script
- `src/pages/editions/[slug].astro` - Import/render renamed to `DetailHero` (props unchanged)
- `src/pages/en/editions/[slug].astro` - Same, EN twin
- `src/pages/galleries/[slug].astro` - Static hero block replaced with `<DetailHero objectFit="contain">`; dead hero CSS removed
- `src/pages/en/galleries/[slug].astro` - Same, EN twin
- `tests/e2e/edition.spec.ts` - Hero locators renamed to `detail-hero*`; stale comment fixed
- `tests/e2e/gallery.spec.ts` - Hero locator renamed; grid-thumbnail assertions re-scoped; two new describe blocks added (hero-clickable, reduced-motion)

## Decisions Made

- Optional props over empty-string hacks: `formatText?`/`caption?`/`total?` are truly absent for gallery calls, so the reveal panel never reserves space for a format line that will never render.
- `objectFit` prop as the no-crop mechanism: a single conditional modifier class (`.detail-hero__img--contain`) rather than a second component or a runtime CSS variable — keeps the component's public surface small while satisfying the hard "never crop gallery photos" requirement.
- Scroll-script opacity simplification: using `titleT` alone (dropping `Math.max(titleT, formatT)`) is safe because `formatT`'s ramp (`t=0.6→1.0`) is always ≤ `titleT`'s ramp (`t=0.3→0.6`) at any given `t` — verified by inspection of the two clamp expressions, not just assumed.
- `gallery.spec.ts` grid-thumbnail re-scoping: rather than leaving the existing unscoped `[data-gallery-thumb] img` locator (which would now silently resolve the hero instead of the grid), explicitly scoped to `.gallery-grid [data-gallery-thumb]` to keep the two test surfaces (hero vs. grid) unambiguous — mirrors the pattern `edition.spec.ts` already used.

## Deviations from Plan

None - plan executed exactly as written, including the mid-draft addition (surfaced in the constraints) of the `objectFit` prop and its required `"contain"` wiring on both gallery twins.

## Issues Encountered

- **Environment constraint (expected per plan constraints):** `node_modules` was missing at the root of this worktree; ran `npm ci` to install (`sanity/` was not touched, as this plan doesn't modify anything there). A `.env` file (Sanity project ID/dataset/read token) was absent, so `npm run build` and therefore `npm run preview`-backed `npm run test:e2e` could not run in this environment — confirmed via a direct `npm run build` attempt, which failed with `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars`. Per the plan's own verification note ("`npm run typecheck` is the always-runnable gate if credentials are absent in the executor's environment"), `npm run typecheck` was run after every task and passed with 0 errors/0 new warnings throughout. All static verification greps specified in each task's `<verify>` block passed. The orchestrator must run `npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` during independent verification (it has the credentials) to confirm the full suite, including the new gallery hero-clickable and reduced-motion tests, passes against real content.
- **Unrelated pre-existing test failure (out of scope):** `npm run test:unit` reported 101/101 relevant tests passing, with one unrelated suite (`tests/unit/dashboard-logic.test.ts`) failing because `sanity/node_modules` is not installed in this worktree (`Cannot find package '@sanity/icons'`) — this file lives in the Sanity Studio subsystem, is untouched by this plan, and was not investigated further per the scope-boundary rule (pre-existing failures in unrelated files are out of scope).

## User Setup Required

None - no external service configuration required. (The missing `.env` above is a build-time content-fetch credential, not new configuration introduced by this plan — the orchestrator already has it for verification, per the task constraints.)

## Orchestrator Independent Re-Verification

Re-confirmed everything above directly, not just from the executor's self-report. Reviewed all three commits' diffs line by line: `DetailHero.astro`'s full rename/generalization (optional formatText/caption/total with conditional rendering, the new `objectFit` prop and its `.detail-hero__img--contain` modifier class, the null-safe scroll-script guard); both édition twins' unchanged re-wiring; both gallery twins' new `<DetailHero objectFit="contain">` wiring with `gallery.images.slice(1)`/full-array Lightbox/SEO all verified untouched; the e2e rename plus the four new gallery test blocks (confirmed the `getByRole('button', {name:'Grille'})` + `a.home-grid__tile` discovery pattern is real, already used throughout the file — not a hallucinated locator).

Resolved the same two environment gaps as the prior quick task (l5i): wrote `.env` and ran `npm ci` in `sanity/`. With those fixed: `npm run build` succeeds (27/27 pages); grepped the built output and confirmed `detail-hero__img detail-hero__img--contain` on `dist/galleries/paysage/index.html` vs plain `detail-hero__img` (no contain) on `dist/editions/rebut/index.html` — éditions still crop via `cover`, galleries never do; confirmed exactly one `<h1>` and a clickable `data-gallery-thumb data-index="0"` trigger on the gallery hero (didn't exist before this task). `astro check` 0 errors, `npm run test:unit` 136/136, `test:artifact` 27 files. Ran the full e2e suite on an isolated port-4399 config (routing around the same stale port-4321 process) — 175/175 passing, chromium + webkit-mobile, including all 4 new gallery hero tests.

Beyond the automated suites, drove the real preview server and directly inspected the no-crop requirement: `getComputedStyle(img).objectFit === 'contain'` on the gallery hero (a real portrait-oriented Paysage photo, natural ratio 0.645, rendered in a 1.406-ratio landscape box — exactly the case where `cover` would crop hardest) confirms letterboxing rather than cropping by CSS definition. Checked the scroll math at t=0/t=1 (photo shrinks to the same ~45%-right/55%-width as éditions, reveal panel reaches opacity 1 using `titleT` alone since the format span is absent, title text is the real gallery title) and the mobile branch (pin `position: relative`, `object-fit: contain` preserved, reveal visible) — all correct. Deleted the temporary port-4399 config and worktree `.env` before merging.

## Next Phase Readiness

- `DetailHero.astro` is now the single shared hero for all four détail-page twins (2 édition + 2 gallery); any future détail-style page (e.g. a third content type) can reuse it with the same optional-props pattern.
- The `objectFit` prop establishes a reusable pattern for any future shared media component that needs per-caller crop behavior without touching other callers' output.
- Outstanding: the orchestrator's independent verification pass (with real Sanity credentials) should run the full e2e suite and, per the plan's recommended non-blocking human spot-check, visually confirm on a live preview that gallery hero photos are genuinely never cropped at multiple breakpoints/scroll positions, and that an édition détail page is visually unchanged.

---
*Phase: quick-260724-mjp*
*Completed: 2026-07-24*

## Self-Check: PASSED

All created/modified files confirmed present on disk (`src/components/DetailHero.astro`, both édition twins, both gallery twins, both e2e spec files, this SUMMARY.md); `src/components/EditionHero.astro` confirmed removed. All three task commit hashes (`fe86708`, `3c10f40`, `5cc6a7e`) confirmed present in `git log --oneline --all`.
