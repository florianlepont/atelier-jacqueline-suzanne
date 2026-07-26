---
phase: quick-260726-ltr
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/layouts/BaseLayout.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - src/components/DetailHero.astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/components/HomeCarousel.astro
  - tests/e2e/gallery.spec.ts
  - tests/e2e/edition.spec.ts
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements:
  - ITEM-1-hide-footer-gallery-detail
  - ITEM-2-widen-homepage-intro
  - ITEM-3-remove-detail-scroll-hint
must_haves:
  truths:
    - "On a gallery detail page (/galleries/<slug>/ and /en/galleries/<slug>/) the site footer (mentions légales / copyright) is NOT rendered."
    - "On an édition detail page the site footer IS still rendered (scoping proof — gallery-only, mirrors carouselReturnHref opt-in)."
    - "With the footer hidden, a gallery detail page still exposes >= 300px (ENGAGE_DISTANCE) of scroll track on desktop, so quick-260725-tqs's scroll-up-to-return hasEngaged gate stays reachable and its positive-path + accidental-trigger guards still pass."
    - "The homepage .home-hero__intro paragraph is confined to roughly two-thirds (66.67%) of the accent panel on desktop, wider than the previous 50%; mobile stays max-width:none; font-size stays 15px."
    - "The .detail-hero__scroll-hint affordance (label + chevron + bounce + fade listener) is fully removed from gallery AND édition detail heroes, in both FR and EN, with no dangling scrollHintLabel prop."
  artifacts:
    - src/layouts/BaseLayout.astro
    - src/components/DetailHero.astro
    - src/components/HomeCarousel.astro
  key_links:
    - "BaseLayout hideFooter prop -> conditional <footer> render -> gallery detail pages pass hideFooter (editions do not)"
    - "DetailHero scrollHintLabel removal must be mirrored across all 4 detail-page twins or astro check (typecheck) fails"
    - ".detail-hero own calc(100svh + 900px) desktop height is the footer/grid-independent source of the tqs hasEngaged 300px scroll track"
---

<objective>
Three independent follow-up fixes to the carousel-to-collection transition, all from live-testing feedback:

1. Hide the site footer on GALLERY detail pages only (not éditions), matching the existing gallery-only opt-in scoping.
2. Widen the homepage `.home-hero__intro` paragraph from max-width 50% to ~66.67% of the accent panel (desktop only).
3. Remove the now-useless "Faire défiler"/"Scroll" scroll-hint from the shared detail hero entirely.

Purpose: Polish the collection-transition UX per direct user requests; item 1 carries a real prior-incident safety burden (quick-260725-sj4 footer-hide misfire) that has been investigated and cleared below.
Output: Modified layout/component/page files + updated e2e coverage; both FR and EN correct for all three items.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/layouts/BaseLayout.astro
@src/components/DetailHero.astro
@src/components/HomeCarousel.astro
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro
@tests/e2e/gallery.spec.ts
@tests/e2e/edition.spec.ts
@tests/e2e/homepage.spec.ts
</context>

<safety_investigation>
## Item 1 footer-hide safety verification (REQUIRED — done against the real current code, not assumptions)

Prior incident: quick-260725-sj4 reverted a homepage footer-hide because the homepage carousel's `atBottom()` OPEN gesture became vacuously true at scrollY 0 (hero was the only content, footer hidden → `innerHeight + scrollY >= scrollHeight` true immediately → misfire on first downscroll).

**Does hiding the footer on gallery detail pages reproduce that class of bug? NO. Verified below.**

1. **The sj4-affected `atBottom()` gate does not exist on gallery detail pages.** It lives in `HomeCarousel.astro` (`atBottom()`, `registerDownwardIntent`), which renders ONLY on the homepage. Gallery detail pages render `DetailHero.astro`, whose return gesture (quick-260725-tqs) is gated on `hasEngaged && atTop()` — the mirror image, and specifically hardened against exactly this failure mode.

2. **The tqs gate fails SAFE under reduced scroll track.** `atTop()` (scrollY <= 4) is trivially true at load, but the gesture stays DISARMED until `hasEngaged` flips true, which requires a genuine `window.scrollY >= ENGAGE_DISTANCE` (300px, DetailHero.astro:322/341). Hiding the footer only REMOVES scroll height — it can only make `hasEngaged` HARDER to reach (→ stays false → gesture never fires = safe), never vacuously armed. This is structurally the opposite of the sj4 bug (which was "always fires"; the worst case here is "never fires").

3. **Desktop worst case is comfortably safe — real numbers.** `.detail-hero` has `height: calc(100svh + 900px)` (DetailHero.astro:419); `.detail-hero__pin` is `position: sticky; height: 100svh` (423-429). So the hero element ALONE contributes a 900px scroll track BEYOND the first viewport, entirely independent of the footer and of the gallery grid below. `REVEAL_DISTANCE = 900` (line 197), `ENGAGE_DISTANCE = 300` (line 322). 900px available >> 300px required. Even the absolute worst case — a single-image gallery (grid omitted: `{gallery.images.length > 1 && <GalleryGrid .../>}` in both gallery twins) with the footer hidden — still gives `100svh + 900px` of document height, so `scrollY` reaches up to ~900px and `hasEngaged` arms. The existing positive-path tqs tests (gallery.spec.ts:588-628, viewport 1280x900) do `window.scrollTo(0, 500)`; document height on desktop is >= 1800px regardless of footer/grid, so those tests keep passing after the footer is removed.

4. **Mobile is unchanged-in-kind and still safe.** On mobile (`@media (max-width: 767px)`) the reveal driver is inactive and `.detail-hero { height: auto }` / `.detail-hero__pin { height: 70svh; min-height: 420px }` (DetailHero.astro:696-705) — there is NO 900px track. On a single-image gallery (no grid) the page may be shorter than the viewport and never scroll 300px, so the gesture simply never arms. This is PRE-EXISTING, already-documented graceful degradation (DetailHero.astro:313-318), and it is the safe direction (never-arms, no misfire). The footer alone (~one text line + legal nav) was never enough to push a sub-viewport mobile page past 300px, so removing it is not a regression of an otherwise-working case.

5. **No existing test asserts the footer is present on gallery pages.** legal.spec.ts footer-reachability tests (legal.spec.ts:158-171) navigate to `/` (homepage) first and click the footer there — unaffected. The gallery.spec.ts lightbox regression test (124-168) comment mentions "below the footer" but its assertions only check `dialog#lightbox` display/boundingBox, never the footer — still passes with the footer gone. Legal pages stay reachable from every non-gallery page's footer, so mentions-légales accessibility is preserved site-wide.

**CONCLUSION: SAFE — not a blocking concern.** Proceed with the footer-hide. The tqs hasEngaged gate's reachability rides entirely on `.detail-hero`'s own `calc(100svh + 900px)` desktop height (footer- and grid-independent), and the failure direction under any shortened page is "gesture never arms" (safe), never "gesture misfires."
</safety_investigation>

<tasks>

<task type="auto">
  <name>Task 1: Hide the site footer on gallery detail pages only (Item 1)</name>
  <files>src/layouts/BaseLayout.astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro</files>
  <action>
Add an opt-in `hideFooter` control to BaseLayout, then turn it on for the two gallery detail twins ONLY (édition twins keep the footer — this mirrors the gallery-only carouselReturnHref opt-in scoping from quick-260725-tqs).

In `src/layouts/BaseLayout.astro`:
- Add `hideFooter?: boolean;` to the `Props` interface (place it after `headerVariant?: ...`). Add a one-line comment noting it is opt-in per-page and defaults false, and that it exists to suppress the footer on gallery detail pages so the collection-transition UX is not broken by scrolling into mentions-légales/copyright (cross-reference the safety note that the tqs return gesture stays reachable via the hero's own 900px desktop scroll track).
- Destructure it with a default in the frontmatter const block: `hideFooter = false`.
- Wrap the existing `<footer class="chrome-band"> ... </footer>` element (the whole element, footer-text + legal nav included) in a conditional so it only renders when NOT hidden: `{!hideFooter && ( <footer class="chrome-band"> ... </footer> )}`. Do not otherwise change the footer markup, the legal-nav consts, or the `<style>` for `footer.chrome-band` (leaving the CSS is harmless — it just never matches on gallery pages).

In `src/pages/galleries/[slug].astro` and `src/pages/en/galleries/[slug].astro`:
- Add the `hideFooter` prop to the `<BaseLayout ...>` opening tag (alongside the existing `headerVariant="transparent"`). A bare `hideFooter` (shorthand for `hideFooter={true}`) is fine. Add a short inline comment: gallery-only footer hide (Item 1) — édition detail pages deliberately keep the footer.

Do NOT touch `src/pages/editions/[slug].astro` or `src/pages/en/editions/[slug].astro` — editions must keep their footer (scoping proof).
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>BaseLayout accepts `hideFooter` (default false) and conditionally renders `<footer class="chrome-band">`; both gallery twins pass `hideFooter`; both édition twins are untouched. `astro check` passes.</done>
</task>

<task type="auto">
  <name>Task 2: Remove the scroll-hint affordance from the detail hero (Item 3)</name>
  <files>src/components/DetailHero.astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro, src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro</files>
  <action>
Fully remove the `.detail-hero__scroll-hint` feature (label span + bouncing chevron shipped in quick-260724-uf5/wdr) — it is now useless per direct feedback. Remove ALL of the following, in `src/components/DetailHero.astro`:
- The `scrollHintLabel` prop: its JSDoc comment block AND the `scrollHintLabel: string;` line in the `Props` interface; and the `scrollHintLabel,` entry in the `Astro.props` destructure.
- The markup: the entire `<div class="detail-hero__scroll-hint" aria-hidden="true"> ... </div>` block (label span + chevron `<svg>`), inside `.detail-hero__pin`.
- The script: the `const scrollHint = document.querySelector<HTMLElement>('.detail-hero__scroll-hint');` declaration AND the self-contained hint-fade block that follows it (its explanatory comment + the `if (scrollHint) { window.addEventListener('scroll', ...) }` listener). CONFIRMED hint-only: that listener's body only writes `scrollHint.style.opacity`; it is NOT the reveal driver's `onScroll` (which lives inside the `if (track && photo && scrim && overlayTitle && reveal)` guard) nor the tqs return-gesture's engagement scroll listener (in the separate `if (returnHref)` script). Remove the whole listener.
- The CSS, all scroll-hint rules: the base `.detail-hero__scroll-hint` rule (with its `animation: sketch-bounce ...`) and its preceding comment; `.detail-hero__scroll-hint-label`; `.detail-hero__scroll-hint-icon`; the `@keyframes sketch-bounce { ... }` block; the `@media (prefers-reduced-motion: reduce) { .detail-hero__scroll-hint { animation: none; } }` block; the `.detail-hero__scroll-hint { display: none; }` rule (and its comment) nested inside `@media (prefers-reduced-motion: reduce) and (min-width: 768px)`; and the `.detail-hero__scroll-hint { display: none; }` rule (and its comment) nested inside `@media (max-width: 767px)`. When removing the two nested rules, KEEP the enclosing `@media` blocks and their other rules intact — delete only the `.detail-hero__scroll-hint` rule within each.
- Tidy (optional but preferred): in the tqs return-gesture SAFETY DESIGN comment, drop the now-stale "the scroll-hint above," clause so the comment no longer references a removed element. Do NOT touch the scroll-reveal pin/shrink driver or the tqs return-gesture logic itself.

In all FOUR detail-page twins — `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro` — remove BOTH the `const scrollHintLabel = '...'` declaration (and its quick-260724-wdr comment) AND the `scrollHintLabel={scrollHintLabel}` prop pass on `<DetailHero ... />`. (FR consts are 'Faire défiler', EN consts are 'Scroll'.) After this, `scrollHintLabel` is referenced nowhere; `astro check` proves no twin was missed (a leftover prop pass or a leftover unused const surfaces as a type/lint error).
  </action>
  <verify>
    <automated>npm run typecheck && grep -rn "scrollHintLabel\|scroll-hint\|sketch-bounce" src | grep -v node_modules; test $(grep -rn "scrollHintLabel\|scroll-hint\|sketch-bounce" src | grep -v node_modules | wc -l) -eq 0</automated>
  </verify>
  <done>No `scrollHintLabel`, `.detail-hero__scroll-hint`, or `sketch-bounce` reference remains anywhere under `src/`; the reveal driver and tqs return gesture are untouched; `astro check` passes.</done>
</task>

<task type="auto">
  <name>Task 3: Widen the homepage intro paragraph to ~2/3 of the accent panel (Item 2)</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
In `src/components/HomeCarousel.astro`, in the DESKTOP `.home-hero__intro` rule (the base rule in the main `<style>` block, the one whose comment says "confine the intro to roughly the left half of the panel" and currently declares `max-width: 50%;`), change `max-width: 50%;` to `max-width: 66.67%;`. Update that rule's comment to say "roughly two-thirds of the panel" instead of "roughly the left half".

Leave everything else in this element untouched:
- Do NOT change `font-size: 15px;` (that stays — Item 5 from quick-260725-tqs).
- Do NOT change the mobile `@media (max-width: 767px)` override `.home-hero__intro { ... max-width: none; }` — mobile stays full-width.

Geometry note for the executor (so the test bounds in Task 4 make sense): the accent panel `.home-hero__accent` is `width: min(700px, 52%); padding: var(--space-xl)` (32px) with global `box-sizing: border-box`, so at a 1600px-wide viewport its border-box is 700px and its content box is 636px. The intro's `max-width: 66.67%` resolves against that 636px content box → ~424px, i.e. ~0.606 of the 700px measured panel width (up from ~0.454 at the old 50%).
  </action>
  <verify>
    <automated>grep -q "max-width: 66.67%" src/components/HomeCarousel.astro && npm run typecheck</automated>
  </verify>
  <done>Desktop `.home-hero__intro` uses `max-width: 66.67%`; font-size 15px and mobile `max-width: none` are unchanged; build/type check passes.</done>
</task>

<task type="auto">
  <name>Task 4: Update e2e coverage for all three items and run the suite</name>
  <files>tests/e2e/gallery.spec.ts, tests/e2e/edition.spec.ts, tests/e2e/homepage.spec.ts</files>
  <action>
Update the Playwright e2e coverage to match the three changes (both FR and EN), remove obsolete coverage, and add the Item 1 scoping + safety proofs.

**Item 3 — remove obsolete scroll-hint coverage:**
- In `tests/e2e/gallery.spec.ts`: remove the two scroll-hint tests — 'the scroll-down hint is visible at rest on desktop, and its bounce is disabled/hidden under reduced motion' AND 'the scroll-down hint label reads "Scroll" on the matching EN route' — together with the shared quick-260724-uf5/wdr comment block that precedes them. KEEP the enclosing `describe` block and its OTHER tests (e.g. the `object-fit: cover` hero test) intact.
- In `tests/e2e/edition.spec.ts`: remove the ENTIRE `describe('editions scroll-down hint label (quick-260724-wdr)', ...)` block (it is exclusively about the hint), including its leading comment. Leave the other édition describes (e.g. the sticky-pin test) untouched.

**Item 2 — update the intro-width test:**
- In `tests/e2e/homepage.spec.ts`, in `describe('carousel intro paragraph resize + reposition (Item 5)')`, update the desktop test (currently named "...confined to roughly the left half of the panel"):
  - Rename it to reflect two-thirds (e.g. "desktop: 15px font-size, confined to roughly two-thirds of the panel").
  - Keep the `font-size` assertion (`toBe('15px')`) unchanged.
  - Change the width assertion from `expect(layout.introWidth).toBeLessThanOrEqual(layout.accentInnerWidth * 0.6);` to an upper bound of `* 0.7` AND add a lower bound proving it genuinely widened past the old half-width: `expect(layout.introWidth).toBeGreaterThan(layout.accentInnerWidth * 0.55);`. (At the test's 1600x900 viewport the measured ratio is ~0.606 — comfortably inside (0.55, 0.70]; the old 50% rule produced ~0.454, which fails the new lower bound, so this asserts the change rather than merely loosening it.)
  - Leave the mobile `max-width: none` test unchanged.

**Item 1 — add footer-hidden scoping + scroll-track safety coverage (new `describe` in `tests/e2e/gallery.spec.ts`):**
Add a describe block (place it near the existing tqs scoping tests) that uses a desktop viewport `{ width: 1280, height: 900 }` and, reusing the existing gallery-discovery pattern (open `/`, click Grille, read the first `a.home-grid__tile` href/slug):
- fr: navigate to the gallery detail href; assert `await expect(page.locator('footer.chrome-band')).toHaveCount(0)` (footer not rendered); then assert the hero still provides the engagement track independent of the footer: `const track = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight); expect(track).toBeGreaterThanOrEqual(300);` (>= ENGAGE_DISTANCE — encodes the safety_investigation conclusion as an executable assertion).
- en: navigate to `/en/galleries/<slug>/`; assert `footer.chrome-band` has count 0.
- scoping: navigate to `/editions/`, read the first `.tile` href, go to that édition detail page, and assert `await expect(page.locator('footer.chrome-band')).toHaveCount(1)` (footer STILL present on éditions — proves gallery-only scoping).

Do NOT modify the existing tqs scroll-up-to-return tests (positive path + accidental-trigger + below-threshold + touch guards) — they must continue to pass AS-IS with the footer now hidden; running them is the regression proof that hasEngaged stays reachable.

After editing: build the static site and run the three affected specs across both projects (Desktop Chrome + iPhone 15 Pro, per playwright.config.ts). Confirm the previously-existing tqs positive-path and accidental-trigger guards in gallery.spec.ts pass green alongside the new footer tests.
  </action>
  <verify>
    <automated>npm run build && npx playwright test tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts tests/e2e/homepage.spec.ts</automated>
  </verify>
  <done>Obsolete scroll-hint tests removed (gallery + edition specs); homepage intro-width test asserts the new ~2/3 bound and a lower bound proving the widen; new gallery tests prove footer hidden on FR+EN gallery pages, footer present on éditions, and >= 300px desktop scroll track; the full gallery/edition/homepage e2e suite passes green including the untouched tqs return-gesture guards.</done>
</task>

</tasks>

<verification>
- `npm run typecheck` (astro check) passes — this is the cross-cutting gate proving the `scrollHintLabel` prop removal was mirrored across the component + all 4 twins.
- `npm run build` succeeds (static build of all gallery/edition/homepage routes, FR + EN).
- `npx playwright test tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts tests/e2e/homepage.spec.ts` passes on both Desktop Chrome and iPhone 15 Pro projects, including:
  - footer absent on FR + EN gallery detail pages; footer present on éditions (scoping);
  - gallery desktop scroll track >= 300px with footer hidden;
  - the pre-existing quick-260725-tqs return-gesture positive-path AND accidental-trigger guards still green;
  - homepage intro width in (0.55, 0.70] of the accent panel;
  - no remaining `.detail-hero__scroll-hint` references.
- `grep -rn "scrollHintLabel\|scroll-hint\|sketch-bounce" src` returns nothing.
</verification>

<success_criteria>
- Item 1: Footer hidden on gallery detail pages (FR + EN), still visible on édition detail pages; quick-260725-tqs scroll-up-to-return feature verified still reachable and non-misfiring with the footer hidden (safety_investigation confirmed SAFE, encoded as tests).
- Item 2: Homepage `.home-hero__intro` widened to `max-width: 66.67%` on desktop; 15px font-size and mobile `max-width: none` unchanged; test updated to the new ~2/3 bound.
- Item 3: `.detail-hero__scroll-hint` (markup, CSS, keyframes, media overrides, fade listener, `scrollHintLabel` prop across component + 4 twins) fully removed; reveal driver and tqs return gesture untouched; obsolete tests removed.
- All three items correct in both FR and EN; typecheck, build, and targeted e2e suite pass.
</success_criteria>

<output>
Create `.planning/quick/260726-ltr-three-follow-up-fixes-hide-the-site-foot/260726-ltr-SUMMARY.md` when done.
</output>
