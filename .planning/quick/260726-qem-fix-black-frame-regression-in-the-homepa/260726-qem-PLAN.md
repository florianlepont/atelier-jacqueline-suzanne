---
phase: quick-260726-qem
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: false
requirements: [quick-260726-qem]
must_haves:
  truths:
    - "At the minimum pull scale (0.94, from `1 - 1*0.06` in setPullFeedback), the hero photo shows ZERO black band on any of its four edges — desktop (1400x900) and mobile (393px)."
    - "At rest (--pull-scale = 1), the hero photo is full-bleed, centered, no black, no directional shift; framing is visually preserved (the small inherent center-zoom from the overhang is subtle, measured, and documented — NOT a directional reframe)."
    - "The wordmark photo-cutout still pixel-aligns to the visible hero photo after heroImg's rendered box changes (syncWordmarkAlignment reads heroImg.getBoundingClientRect())."
    - "The .home-hero__pull-overlay radial-darken still renders correctly (darkening PHOTO edges, not exposed black), unchanged at inset:0."
    - "A new regression test FAILS if .home-hero__img inset is reverted to 0 — proven by actual rendered pixels, not a computed --pull-scale / transform-matrix read."
    - "The full existing e2e suite (both Playwright projects) still passes; FR and EN homepages spot-confirmed."
  artifacts:
    - src/components/HomeCarousel.astro
    - tests/e2e/homepage.spec.ts
  key_links:
    - ".home-hero__img negative inset overhang <-> .home-hero__photo overflow:hidden (clips the bleed at rest)."
    - "overhang value <-> shipped minimum scale 0.94: box must inflate to >= 1/0.94 = 106.38% for no-black at the floor."
    - "heroImg.getBoundingClientRect() <-> syncWordmarkAlignment() wordmark-cutout crop math (heroImg's box grows with the overhang)."
---

<objective>
Fix the black-frame regression in the homepage carousel's overscroll pull feedback (shipped in quick-260726-obg). During an overscroll pull the hero photo (`.home-hero__img`) scales down from `transform-origin: center` (to a floor of 0.94 at the 150px threshold), but the image sits at `inset: 0` with zero overhang, so shrinking it exposes `.home-hero__photo`'s `background-color: #000` as a solid black border on all four edges. The approved sketch (007 Variant C) avoided this with `.demo-photo { inset: -3% }` — that overhang was never ported. Fix: give `.home-hero__img` a negative inset overhang so the scale-down consumes bleed (clipped at rest by the pre-existing `overflow: hidden`) instead of revealing black.

Purpose: Restore the intended clean photo-pull feedback and — the real point of this task — verify the fix against ACTUAL RENDERED PIXELS at rest and at the exact minimum scale, closing the exact verification gap (computed-value reads that never looked at a frame) that let the original bug ship.

Output: A one-property-family CSS fix to `.home-hero__img`, a corrected stale code comment, a rendered-pixel regression test that fails if the overhang is reverted, and full-suite + human visual confirmation.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/quick/260726-obg-implement-sketch-007-variant-c-overscrol/260726-obg-SUMMARY.md
@.planning/sketches/007-carousel-overscroll-feedback/README.md
@src/components/HomeCarousel.astro
@tests/e2e/homepage.spec.ts
@tests/e2e/visual.spec.ts
@playwright.config.ts
</context>

<critical_geometry_finding>
READ THIS BEFORE TOUCHING CODE. Re-derive it yourself against the CURRENT file — do not trust these line numbers.

The current `.home-hero__img` rule is `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(var(--pull-scale, 1))`. Both photo layers (`--sharp` and the blur placeholder) share this base rule. `.home-hero__photo` is `position: relative; width: 100%; aspect-ratio: 16/9; min-height: 100svh; max-height: 100vh; overflow: hidden; background-color: #000`. The mobile `@media (max-width: 767px)` block does NOT override `.home-hero__img` or `.home-hero__photo` sizing (it only touches `.home-hero__caption`/`__accent`/`__wordmark`/`__intro`), so desktop and mobile share the identical base image box; only the container's aspect (landscape vs portrait-tall) differs.

FUNDAMENTAL TENSION you must confront and NOT waste cycles fighting:
- A negative inset creates overhang by inflating the `object-fit: cover` box to `(100 + 2X)%`. `object-fit: cover` fills the bigger box by scaling the raster UP, so the center-clipped rest view is zoomed by exactly the overhang fraction (a `-4%` inset => ~8% rest zoom; `-5%` => ~10%). This is unavoidable: overhang (image larger than container) IS zoom-at-rest. There is NO transform/inset trick that yields a scale-DOWN pull with no black AND a byte-identical rest frame — you can have any two of {exact rest framing, scale-down pull, no black}, and this feature needs the last two.
- Therefore requirement #1's "pixel-identical at rest" is physically relaxed to: full-bleed, centered, no black, no DIRECTIONAL shift, with a subtle uniform center-zoom that is measured and documented. Precedent: a former `inset: -6%` "zoom fix" shipped fine on this exact element (see the now-stale comment near `syncWordmarkAlignment()`), so a zoom of this magnitude is known-acceptable — but you must CONFIRM acceptability from real screenshots, not assume it.
- Minimum overhang for no-black at the 0.94 floor: `(100 + 2X) * 0.94 >= 100` => `X >= 3.19%`. The sketch's `-3%` is therefore insufficient (leaves a sub-1% sliver). Stay within `-4%` to `-5%`.
- Per-axis inset resolution: top/bottom % resolve against container HEIGHT, left/right % against WIDTH. The fractional safety margin at min scale is identical on desktop and mobile, but mobile's NARROW horizontal axis (~393px) yields the smallest ABSOLUTE margin — that axis is the binding no-black constraint against sub-pixel rounding. At `-4%` mobile horizontal margin at 0.94 is only ~3px/side; at `-5%` ~6.7px/side. This is why the value must be picked from real min-scale mobile screenshots, not arithmetic alone.
- RIPPLE: `syncWordmarkAlignment()` feeds `heroImg.getBoundingClientRect()` into `computeWordmarkBackgroundPosition()` so the wordmark cutout aligns to the photo's crop. Growing heroImg's box changes that rect — the wordmark alignment MUST be re-verified (real screenshot), it is a live consumer of this geometry.
</critical_geometry_finding>

<tasks>

<task type="auto">
  <name>Task 1: Apply the negative-inset overhang to .home-hero__img and correct the stale zoom-fix comment</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
Re-locate the CURRENT `.home-hero__img` base rule (grep for `.home-hero__img {` — do NOT trust a line number). Change its sizing from `inset: 0; width: 100%; height: 100%;` to `inset: -4%;` and REMOVE the `width: 100%;` and `height: 100%;` declarations. Removing width/height is MANDATORY: an absolutely-positioned element with all four insets AND explicit width/height is over-constrained (width/height win, right/bottom insets are dropped), which would offset the box up-left by the inset and expose black on the opposite two edges instead of centering the overhang. With width/height removed, the four insets alone size the box to `(100 + 2X)%` centered — matching the sketch's `.demo-photo { position: absolute; inset: -3% }` pattern (which likewise carried no width/height). Keep `object-fit: cover`, `transform: scale(var(--pull-scale, 1))`, `transform-origin: center`, and the transition untouched. Both photo layers inherit this base rule, so the blur placeholder and the sharp image get identical overhang — do NOT add a per-layer inset.

Start at `-4%` (minimizes the inherent rest zoom while clearing the 3.19% no-black floor). Task 3's real min-scale mobile screenshots decide the final value: keep `-4%` if the mobile edges are clean with margin; step toward `-5%` (never beyond) only if any black sliver survives on the narrow mobile axis. Record the math for the chosen value in a code comment on the rule: `inset -X%` inflates the box to `(100 + 2X)%`, and `(100 + 2X) * 0.94 >= 100` is the no-black condition at the shipped `1 - 1*0.06` floor.

Update the base rule's comment to explain the overhang is the overscroll-pull bleed reserve (quick-260726-qem), clipped invisibly at rest by `.home-hero__photo`'s `overflow: hidden`, consumed by the scale-down so no `background-color: #000` is ever revealed.

Correct the STALE comment near `syncWordmarkAlignment()` (grep for `inset: -6%` and `zoom fix`). It currently claims heroImg has `inset: -6%` from a removed wordmark-cutout "zoom fix" — false against the shipped `inset: 0`, and now doubly misleading once we set `inset: -4%` for a DIFFERENT reason. Rewrite it to state heroImg now carries `inset: -X%` as the overscroll-pull overhang (quick-260726-qem), and that reading `heroImg.getBoundingClientRect()` here automatically reflects that expanded box in the wordmark crop math (no separate inset term needed) — preserving the true, still-load-bearing point of the comment while removing the defunct provenance.

Do NOT touch `.home-hero__pull-overlay` (stays `inset: 0`, unscaled — not part of this bug) or the reduced-motion `transition-property` narrowing.
  </action>
  <verify>
    <automated>npx astro check 2>&1 | grep -E "^Result|error" ; npm run build >/dev/null 2>&1 && echo BUILD_OK</automated>
  </verify>
  <done>`.home-hero__img` uses `inset: -4%` (or the Task-3-confirmed `-4%`..`-5%`) with no `width`/`height`; both photo layers inherit it; the stale `-6% zoom fix` comment is corrected to describe the pull overhang; `astro check` reports 0 errors and the build succeeds.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add a rendered-pixel regression test that fails if the overhang is reverted, plus edge/rest coverage (desktop + mobile)</name>
  <files>tests/e2e/homepage.spec.ts</files>
  <behavior>
    - At forced min scale (`--pull-scale: 0.94`, `--pull-darken: 0`), a thin band sampled at the very edge of `.home-hero__photo` is NOT a uniform pure-black rectangle on any of the four edges — it contains real photo pixels (the overhang bleed). This is the regression proof: with `inset: 0` reverted, the identical band renders solid `#000` and the assertion fails.
    - The same edge check holds at a 393px mobile viewport (narrowest axis = binding constraint).
    - The image's rendered box covers `.home-hero__photo` on all four sides at min scale (heroImg rect left<=photo.left, top<=photo.top, right>=photo.right, bottom>=photo.bottom) — a fast geometric complement to the pixel proof, NOT its replacement.
    - The existing pull-feedback assertions (scale<0.99, darken>0.3 on wheel/touch, decay, commit-reset, reduced-motion) continue to pass unchanged.
  </behavior>
  <action>
Extend the existing `carousel overscroll pull feedback (quick-260726-obg, sketch 007 Variant C)` describe block in `tests/e2e/homepage.spec.ts` (grep for it) with a new rendered-pixel regression test. The existing block ONLY reads the `--pull-scale`/`--pull-darken` custom properties — that is exactly the verification gap that let the black frame ship, so the new test must inspect ACTUAL COMPOSITED PIXELS, never the transform matrix or a CSS var.

Test setup (mirror the block's existing pattern): set viewport 1400x900, `page.goto('/')`, click `[data-role="autoplay-toggle"]` to pin the slide (so no autoplay swap calls render()/setPullFeedback(0) mid-test), and wait for the sharp hero to finish loading (`await expect(page.locator('[data-role="hero-image"]')).toHaveClass(/is-loaded/)`) so real photo content — not the blur placeholder alone — is present. Then force the exact floor state directly on `.home-hero__photo` via page.evaluate, setting `--pull-scale` to `0.94` (the shipped `1 - 1*0.06`) and `--pull-darken` to `0`. Forcing `--pull-darken` to 0 is deliberate: it isolates the GEOMETRY (scale/overhang) under test from the darken overlay, which near the corners darkens even correct photo bleed to near-black and would otherwise make "black band bug" indistinguishable from "darkened photo." Wait ~150ms for the 90ms transform transition to settle before capturing. Do not scroll after forcing the vars (a `scroll` handler resets the feedback when not atBottom).

Capture and decode pixels with NO new npm dependency and NO canvas CORS taint (the Sanity `<img>` has no `crossorigin`, so drawing it directly would taint the canvas — but a page-level screenshot is our own PNG bytes, untainted):
1. Read `.home-hero__photo`'s bounding box.
2. For each of the four edges compute a thin outermost band clip (full edge length x ~4px, flush to the container edge — squarely inside the bug's ~40px black gap at 0.94, and where the fixed overhang bleed lands). Guard clips to integer, in-viewport rects.
3. `const buf = await page.screenshot({ clip: band })` for each band.
4. Decode INSIDE the page: hand the buffer to page.evaluate as base64, `fetch('data:image/png;base64,'+b64)` -> `.blob()` -> `createImageBitmap(blob)` -> draw to an `OffscreenCanvas` -> `getContext('2d').getImageData(...)`. Compute the fraction of pixels whose max(r,g,b) exceeds a small threshold (e.g. 30). Return that stat.
5. Assert each edge band has a non-trivial fraction of non-near-black pixels (e.g. > 0.1) — photo bleed present. Under a reverted `inset: 0` this fraction collapses to ~0 (uniform #000) and the test fails, which is the required regression guarantee.

Add a `test.describe('mobile', () => { test.use({ viewport: { width: 393, height: 852 }, hasTouch: true }); ... })` variant running the same edge-band pixel check (the narrow horizontal axis is the binding no-black constraint). This runs under the chromium project (OffscreenCanvas/createImageBitmap available), like the block's existing mobile touch test.

Also add the fast geometric complement in the same block: at forced `--pull-scale: 0.94`, assert `[data-role="hero-image"]`'s `getBoundingClientRect()` covers `.home-hero__photo`'s rect on all four sides (with a ~0.5px tolerance for rounding). Label it clearly as a complement to — not a substitute for — the pixel proof.

Do not modify the other spec files; the obg-era tests there remain valid.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts -g "pull feedback" --project=chromium 2>&1 | tail -20</automated>
  </verify>
  <done>New rendered-pixel regression test (desktop + 393px mobile) passes with the overhang fix and provably fails if `.home-hero__img` inset is reverted to 0 (executor demonstrates the fail once by temporary revert, then restores); the rect-coverage complement passes; all pre-existing pull-feedback assertions still pass.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
The negative-inset overhang fix on `.home-hero__img` plus a rendered-pixel regression test. The executor has already run: `npm run build`; the full Playwright suite across BOTH projects (`chromium` + `webkit-mobile`) confirming no regression (the whole existing suite, not just the new tests); and captured real screenshots at rest AND at forced minimum scale (`--pull-scale: 0.94`) for desktop 1400x900 and mobile 393px, on BOTH the FR (`/`) and EN (`/en/`) homepages (spot check — the bug is pure CSS geometry, locale-independent).
  </what-built>
  <how-to-verify>
Review the executor-provided screenshots and the executor's written confirmations:
1. MIN-SCALE, NO BLACK: at `--pull-scale: 0.94`, inspect all four edges of the hero photo (the four cropped edge-band screenshots) on desktop AND mobile. Confirm ZERO black band anywhere — every edge shows photo content. This is the whole point of the task.
2. REST FRAMING: at rest (`--pull-scale` = 1), confirm the hero is full-bleed, centered, no black, no directional shift. Confirm the executor documented the measured inherent center-zoom (expected ~8% at `-4%`) and that it reads as subtle/acceptable, NOT a broken reframe. If the rest zoom looks objectionable, say so — do not approve.
3. WORDMARK CUTOUT: confirm the photo-cutout wordmark still aligns to the photo behind/around it (heroImg's box grew, and `syncWordmarkAlignment()` consumes its rect) — no visible drift versus before.
4. PULL-OVERLAY: at a mid pull (or the min-scale darken frame), confirm the radial darken now darkens PHOTO edges rather than exposing black, and looks correct.
5. FR + EN: confirm no locale-specific surprise in the above.
6. Confirm the executor reported the final overhang value used (`-4%`..`-5%`), the full-suite pass counts for both projects, and that the regression test was shown to fail on a temporary `inset: 0` revert.
  </how-to-verify>
  <resume-signal>Type "approved" to finalize, or describe the black band / framing / alignment issue to fix.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | This change is CSS geometry on an existing static component plus e2e tests. No new network endpoint, input parsing, auth path, or trust-boundary crossing is introduced. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qem-01 | Tampering | Test decodes a `page.screenshot` PNG in-page via createImageBitmap/OffscreenCanvas | low | accept | Buffer is the browser's own screenshot bytes handed back as a data URI (not a cross-origin fetch, not the tainted Sanity `<img>`); no untrusted input, test-only path. |
| T-qem-SC | Tampering | npm/pip/cargo installs | low | accept | No packages installed — pixel decode uses in-browser Web APIs specifically to avoid adding pngjs/sharp, honoring the near-zero-dependency constraint. |
</threat_model>

<verification>
- `npx astro check`: 0 errors (pre-existing unrelated warnings tolerated).
- `npm run build`: succeeds against real Sanity content.
- Full `npx playwright test` across BOTH projects (`chromium` + `webkit-mobile`) passes — this change touches shared CSS on a heavily-tested component, so the whole suite (not just the new tests) must be green, including the wordmark-cutout background-clip tests and the obg pull-feedback tests.
- The new rendered-pixel regression test passes with the fix and fails on a temporary `inset: 0` revert (demonstrated once, then restored).
- Human checkpoint confirms zero black band at min scale and acceptable rest framing on desktop + mobile, FR + EN.
</verification>

<success_criteria>
- No black band on any hero-photo edge at the 0.94 minimum pull scale (desktop + mobile), verified by ACTUAL rendered pixels.
- Rest framing preserved (full-bleed, centered, no shift; subtle documented inherent zoom only).
- Wordmark cutout alignment and the pull-overlay darken both still correct.
- A pixel-level regression test guards against reverting the overhang to `inset: 0`.
- Full e2e suite (both projects) green; FR + EN spot-confirmed.
- Stale `-6% zoom fix` comment corrected.
</success_criteria>

<output>
Create `.planning/quick/260726-qem-fix-black-frame-regression-in-the-homepa/260726-qem-SUMMARY.md` when done.
</output>
