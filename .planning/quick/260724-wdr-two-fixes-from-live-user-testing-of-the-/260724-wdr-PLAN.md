---
phase: quick-260724-wdr
plan: 1
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [QUICK-260724-wdr]
files_modified:
  - src/pages/index.astro
  - src/pages/en/index.astro
  - src/components/DetailHero.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - tests/e2e/homepage.spec.ts
  - tests/e2e/gallery.spec.ts
  - tests/e2e/edition.spec.ts

must_haves:
  truths:
    - "For every homepage gallery, the homepage carousel/grid-tile photo is the SAME underlying Sanity asset as that gallery's detail-page hero photo (byte-identical asset path, only transform query params differ)."
    - "For a portrait-first gallery (Paysage: images[0] portrait, images[1] landscape), the homepage now displays the landscape image pickHeroIndex selects — identical to the detail hero — instead of the portrait images[0]."
    - "For a gallery whose images[0] is already landscape or is the only image, the homepage photo is unchanged (pickHeroIndex returns 0 — no-op), and all pre-existing homepage/gallery e2e tests still pass."
    - "Both édition and gallery detail heroes show a locale-aware TEXT label ('Faire défiler' in FR, 'Scroll' in EN) alongside a scroll-down chevron that reads as clearly more prominent than the previous bare small chevron."
    - "The scroll-hint's fade-over-~150px behavior, prefers-reduced-motion disabling, mobile + reduced-motion-desktop hiding, and bounce mechanics are all unchanged; the desktop-gated cross-document hero-photo/ajs-header view-transition-names still resolve as before."
  artifacts:
    - src/pages/index.astro
    - src/pages/en/index.astro
    - src/components/DetailHero.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
  key_links:
    - "pickHeroIndex is imported at the correct relative depth per file: '../lib/image-orientation' in src/pages/index.astro, '../../lib/image-orientation' in src/pages/en/index.astro."
    - "The new required scrollHintLabel prop on DetailHero is passed by ALL FOUR detail-page twins (2 galleries + 2 éditions); a missing one is a compile error, so `astro check` passing proves every consumer is wired."
    - "The scroll-fade opacity listener still writes to `.detail-hero__scroll-hint` (the label is a child that inherits the fade); the bounce keyframe stays on the `.detail-hero__scroll-hint` container element."
---

<objective>
Two fixes from live user testing of the just-shipped cross-page hero transition (quick-260724-uf5).

FIX 1 — The homepage hardcodes `gallery.images[0]` (the traditional cover) for the carousel hero, grid tile, and blur placeholder, while the gallery DETAIL page already uses `pickHeroIndex` to prefer the first landscape image. For a portrait-first gallery (Paysage), the homepage and detail page show TWO DIFFERENT photos of the same gallery, so the quick-260724-uf5 cross-document morph reads as a jarring "shift" (it swaps photos instead of morphing one photo's crop). Fix: select the homepage cover via `pickHeroIndex(gallery.images)` in both homepage locale twins, making homepage and detail hero the identical asset.

FIX 2 — The scroll-down hint chevron (quick-260724-uf5) is not registering as an invitation to scroll ("On ne comprend pas bien qu'on peut maintenant scroller"). Strengthen the affordance: add a locale-aware text label ("Faire défiler" / "Scroll") passed as a new required prop from all four detail-page twins, and increase the hint's visual weight — WITHOUT changing the fade-on-scroll timing, the reduced-motion/mobile hiding, or the bounce mechanics.

Purpose: Make the shipped cross-page morph read as a clean crop/size morph (not a photo swap), and make the "you can scroll now" affordance legible to non-technical visitors.
Output: Two homepage twins select the landscape-preferred cover; DetailHero gains a required locale-aware scroll-hint label + stronger visual presence, wired through all four detail-page twins; e2e coverage proves homepage↔detail photo identity and the new label per locale.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# The immediately-preceding quick task this one fixes (read key-decisions/patterns-established)
@.planning/quick/260724-uf5-three-related-changes-to-the-gallery-det/260724-uf5-SUMMARY.md

# FIX 1 sources
@src/pages/index.astro
@src/pages/en/index.astro
@src/lib/image-orientation.ts
@src/lib/image.ts

# FIX 2 sources (DetailHero + all four consuming twins) and the detail-side pickHeroIndex reference
@src/components/DetailHero.astro
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro

# Existing e2e coverage to extend (grid-discovery navigation pattern, uf5 scroll-hint + morph tests)
@tests/e2e/homepage.spec.ts
@tests/e2e/gallery.spec.ts
@tests/e2e/edition.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Homepage selects the landscape-preferred cover via pickHeroIndex (both locale twins) + prove homepage↔detail photo identity</name>
  <files>src/pages/index.astro, src/pages/en/index.astro, tests/e2e/homepage.spec.ts</files>
  <action>
In BOTH homepage twins, replace the hardcoded cover with the pickHeroIndex-selected one so the homepage matches the gallery detail hero exactly.

1. src/pages/index.astro:
   - Add an import for `pickHeroIndex` from `../lib/image-orientation` (mirror the existing `../lib/sanity` / `../lib/site-config` import depth — src/pages/index.astro is one level under src/pages, so the correct specifier is `../lib/image-orientation`).
   - Inside the `.map((gallery) => { ... })` gallery-entry construction, change the cover selection so `cover` is `gallery.images[pickHeroIndex(gallery.images)]` instead of the hardcoded first element. Everything else in the mapping (heroColor, heroSrc/heroSrcSet, gridSrc/gridSrcSet, blurSrc, alt, statement, slug, title, heroTextColor) stays exactly as-is — it just now derives from the pickHeroIndex-selected `cover`.

2. src/pages/en/index.astro:
   - Same change, but the import specifier is `../../lib/image-orientation` (this file is two levels under src/pages — mirror its existing `../../lib/sanity` imports).
   - Same one-line `cover` change inside its `.map((gallery) => { ... })`.

Do NOT modify src/lib/image-orientation.ts — reuse pickHeroIndex's existing logic and its fallback-to-0 behavior verbatim. `gallery.images[n].dimensions` is already projected by getGalleries()'s GROQ query, so no data-layer change is needed. This is a two-line change per file (import + the single `cover` assignment).

Why this is also a plain improvement: a landscape photo already fills the wide carousel/grid-tile boxes better than a portrait one, so for portrait-first galleries this is strictly better on the homepage's own terms, in addition to fixing the cross-document morph (source and destination are now genuinely the same photo, so the browser morphs a real crop/size change rather than swapping photos).

3. tests/e2e/homepage.spec.ts — add a new `test.describe` (e.g. "homepage hero photo matches the gallery detail hero (landscape-preference consistency)") that proves the fix generically over every homepage gallery, using the established grid-discovery navigation pattern already used throughout this file and gallery.spec.ts:
   - `await page.goto('/')`, click the 'Grille' toggle button to reveal the grid.
   - For each `a.home-grid__tile`, read its `href` (a `/galleries/{slug}` URL) and the `src` of its `.home-grid__tile-img--sharp` layer.
   - Navigate to that href and read the `src` of `.detail-hero__img`.
   - Assert `new URL(tileSrc).pathname === new URL(heroSrc).pathname`. This is the byte-identical-asset proof: the homepage tile uses a square-crop transform (thumbnailUrl) and the detail hero uses a max-fit transform (fullSizeUrl), so their query strings differ, but the Sanity CDN pathname (`/images/{project}/{dataset}/{assetId}-{w}x{h}.{ext}`) is derived from the asset ref alone and is identical iff both render the same underlying asset. Before this fix, a portrait-first gallery (Paysage) would fail (tile = portrait images[0], hero = landscape images[1]); after, they match. Galleries whose images[0] is already landscape were already consistent (pickHeroIndex returns 0), so this stays green for them.
   - Assert the loop actually ran over at least one tile (guard against a no-op zero-tile loop), mirroring the `expect(...).toBeGreaterThan(0)` guards already used in this file.
   - Because the carousel hero (heroSrc) and the grid tile (gridSrc) both derive from the SAME `cover` in the map, proving grid-tile↔detail identity transitively covers carousel↔detail — a short comment noting this is enough; no separate carousel assertion is required.

Do not weaken or delete any existing homepage test. All pre-existing assertions (cdn.sanity.io srcs, titles, statements, heroColor, wordmark cutout, prefetch, morph name-assignment) must keep passing unchanged — the cover swap only changes WHICH valid asset a portrait-first gallery shows, not the shape of any asserted attribute.
  </action>
  <verify>
    <automated>grep -c "images\[pickHeroIndex" src/pages/index.astro && grep -c "images\[pickHeroIndex" src/pages/en/index.astro && grep -c "image-orientation" src/pages/index.astro && grep -c "image-orientation" src/pages/en/index.astro && npm run typecheck</automated>
  </verify>
  <done>
Both homepage twins import pickHeroIndex (at their correct relative depths) and set `cover` to `gallery.images[pickHeroIndex(gallery.images)]`; src/lib/image-orientation.ts is unchanged; `npm run typecheck` (astro check) reports 0 errors; and `npm run test:e2e -- tests/e2e/homepage.spec.ts` passes including the new consistency describe that asserts homepage-tile and detail-hero photo pathnames are identical for every gallery (requires Sanity env — the orchestrator supplies `.env` for the full build/e2e run, per the quick-260724-uf5 worktree note; typecheck + greps are the always-runnable gates).
  </done>
</task>

<task type="auto">
  <name>Task 2: Strengthen the DetailHero scroll-down hint — add a required locale-aware label prop wired through all four detail twins + stronger visual weight, preserving all existing behavior</name>
  <files>src/components/DetailHero.astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro, src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro, tests/e2e/gallery.spec.ts, tests/e2e/edition.spec.ts</files>
  <action>
Make the scroll-down hint read clearly as "a collection just opened — scroll down", without touching its safe behavior.

1. src/components/DetailHero.astro:
   - Add a new REQUIRED prop `scrollHintLabel: string` to the `Props` interface and destructure it from `Astro.props` (mirror how `heroAriaLabel`/`caption` are already typed + destructured — this is a pre-computed, already-localized primitive, keeping all locale logic in the calling pages, consistent with this component's threat-model boundary of never importing src/lib/sanity or src/lib/image).
   - In the `.detail-hero__scroll-hint` markup, render the label text above the existing chevron `<svg>` — e.g. a `<span class="detail-hero__scroll-hint-label">{scrollHintLabel}</span>` placed before the svg. Keep the container's `aria-hidden="true"` (the hint is a decorative visual affordance; the label reinforces it visually and is intentionally not announced).
   - Increase the hint's visual presence so it reads as clearly MORE prominent than today's bare small chevron. Exact sizing/styling is your call, but it MUST stay tasteful and on-brand: monochrome (white) + the existing pink accent (`--color-accent`) ONLY, reusing the hero panel's established typography tokens (e.g. `--text-label-size`, `--font-display`/label styling, uppercase + letter-spacing like `.detail-hero__caption` / `.detail-hero__format`). Reasonable levers: a larger chevron (e.g. ~32–36px), higher base opacity/contrast, and/or a subtle rounded pill or accent underline behind/under the label. Lay the container out as a centered flex column (label on top, chevron below) so the two read as one affordance.
   - HARD CONSTRAINTS — do NOT change any of these:
     * The scroll-fade timing: the self-contained scroll listener that sets `scrollHint.style.opacity` from `Math.max(0, 1 - window.scrollY / 150) * 0.85` stays exactly as-is (still fades over the first ~150px). The label is a child of `.detail-hero__scroll-hint`, so it inherits that opacity fade — no script change and no second listener.
     * The `@keyframes sketch-bounce` animation stays on the `.detail-hero__scroll-hint` CONTAINER element (do NOT move the bounce onto the label or the chevron) — the existing reduced-motion test reads `animationName` off the container.
     * The `@media (prefers-reduced-motion: reduce)` rule that sets `animation: none`, and the reduced-motion-desktop + mobile rules that set `.detail-hero__scroll-hint { display: none }`, stay unchanged (the label, being a child, is hidden with the container in those states — do not add a separate visibility rule for the label).
     * Do NOT touch the reveal-driver script (onProgress/clearInlineStyles/computeProgress/setup), the desktop-gated `view-transition-name: hero-photo` block, or any other DetailHero markup/CSS.

2. Wire the required prop through ALL FOUR detail-page twins, mirroring the existing heroAriaLabel/caption prop-passing convention in each file:
   - src/pages/galleries/[slug].astro (FR): define `const scrollHintLabel = 'Faire défiler';` near the other localized hero constants and pass `scrollHintLabel={scrollHintLabel}` to `<DetailHero>`.
   - src/pages/en/galleries/[slug].astro (EN): `const scrollHintLabel = 'Scroll';` + pass it.
   - src/pages/editions/[slug].astro (FR): `const scrollHintLabel = 'Faire défiler';` + pass it.
   - src/pages/en/editions/[slug].astro (EN): `const scrollHintLabel = 'Scroll';` + pass it.
   Because the prop is required, `astro check` fails the build if any of the four is missed — that is the enforcement that all four twins are wired.

3. tests/e2e/gallery.spec.ts — extend the existing scroll-hint coverage (the "the scroll-down hint is visible at rest on desktop, and its bounce is disabled/hidden under reduced motion" test, or a new adjacent test in the same describe) so it also asserts the locale-aware label, without breaking the current visibility/reduced-motion assertions:
   - On the FR gallery detail route (discovered via the homepage grid, as the existing tests do), assert `.detail-hero__scroll-hint` contains the text "Faire défiler" and is visible at rest.
   - On the matching EN route (`/en/galleries/{slug}/`), assert it contains "Scroll".
   - Keep asserting the existing preserved behavior: at rest on desktop the container's computed `animationName` includes the bounce keyframe, and under `prefers-reduced-motion: reduce` the container's `animationName` is 'none' OR its `display` is 'none' (unchanged from the current test).

4. tests/e2e/edition.spec.ts — add a focused test proving the édition twins were wired: discover the first édition détail URL from `/editions/` (first `.tile` href, per this file's existing discovery convention), assert `.detail-hero__scroll-hint` contains "Faire défiler" on the FR route, and "Scroll" on the corresponding `/en/editions/{slug}/` route.

Do not alter unrelated édition/gallery assertions (statements, lightbox, masonry, view-transition names). The only new behavior is the label text and the hint's visual weight.
  </action>
  <verify>
    <automated>grep -c "scrollHintLabel" src/components/DetailHero.astro && grep -c "detail-hero__scroll-hint-label" src/components/DetailHero.astro && grep -c "scrollHintLabel" "src/pages/galleries/[slug].astro" && grep -c "scrollHintLabel" "src/pages/en/galleries/[slug].astro" && grep -c "scrollHintLabel" "src/pages/editions/[slug].astro" && grep -c "scrollHintLabel" "src/pages/en/editions/[slug].astro" && npm run typecheck</automated>
  </verify>
  <done>
DetailHero declares a REQUIRED `scrollHintLabel: string` prop, renders it as `.detail-hero__scroll-hint-label` above a visually-strengthened chevron (monochrome white + `--color-accent` only), and all four detail-page twins pass it ('Faire défiler' FR, 'Scroll' EN). The fade-over-~150px listener, the `sketch-bounce` keyframe on the container, and the reduced-motion/mobile hiding are byte-for-byte unchanged. `npm run typecheck` reports 0 errors (proving every one of the four consumers is wired), and `npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` passes including the new label assertions on gallery (FR+EN) and édition (FR+EN) routes and the preserved bounce/reduced-motion assertions.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Sanity Content Lake → build | Gallery image dimensions/asset refs are read at BUILD time only (published perspective); no request-time compute, no untrusted runtime input. |
| server-rendered HTML/CSS → browser | The scroll-hint label and chevron are static, already-localized text/markup; the only client-side JS (the existing opacity fade + bounce) is unchanged. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-wdr-01 | Information Disclosure | pickHeroIndex cover selection on the homepage | low | accept | No new data path: pickHeroIndex + dimensions were already projected by getGalleries() and consumed on the detail page; this only reuses an existing build-time helper at an additional call site. No secret/token reaches the client (DetailHero still never imports src/lib/sanity or src/lib/image). |
| T-wdr-02 | Tampering | New required scrollHintLabel prop | low | accept | The label is a hardcoded, non-user-supplied literal per locale; no injection surface. astro check enforces the prop is present on all four twins at build time. |

No package-manager installs in this plan (no npm/pip/cargo add) → no Package Legitimacy Gate required.
</threat_model>

<verification>
- `npm run typecheck` (astro check): 0 errors across the project — proves both FIX 1 imports resolve at their correct depths and FIX 2's required prop is satisfied by all four consumers.
- Positive greps (Task 1 + Task 2 verify blocks) confirm the pickHeroIndex-selected cover and the scrollHintLabel wiring are present in every file — always runnable, no Sanity env needed.
- Full e2e (Sanity env supplied by the orchestrator, per the quick-260724-uf5 worktree note): `npm run test:e2e -- tests/e2e/homepage.spec.ts tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` — homepage↔detail photo-identity for every gallery, the locale-aware scroll-hint label on gallery + édition routes, and every pre-existing uf5 assertion (cross-document name gating, scroll-hint bounce/reduced-motion, masonry, lightbox) still green.
- Recommended non-blocking human spot-check (visual, cannot be pixel-asserted): on desktop Chrome/Edge, click a portrait-first gallery (Paysage) from the homepage and confirm the morph now reads as a clean crop/zoom of the SAME photo (no photo swap); confirm the strengthened scroll hint (label + chevron) clearly reads as an invitation to scroll, fades on scroll, and disappears under OS "Reduce motion" and on a mobile width.
</verification>

<success_criteria>
- Both homepage twins select `gallery.images[pickHeroIndex(gallery.images)]`; src/lib/image-orientation.ts is untouched.
- Every homepage gallery tile's photo asset path equals its gallery detail hero's photo asset path (byte-identical asset; Paysage no longer mismatches).
- DetailHero shows a locale-aware text label + a clearly-more-prominent chevron on all four detail-page twins, using only white + `--color-accent` and existing typography tokens.
- The ~150px fade, reduced-motion/mobile hiding, bounce mechanics, and desktop-gated cross-document view-transition-names are all unchanged.
- `npm run typecheck` passes with 0 errors; the extended homepage/gallery/edition e2e specs pass.
</success_criteria>

<output>
Create `.planning/quick/260724-wdr-two-fixes-from-live-user-testing-of-the-/260724-wdr-SUMMARY.md` when done.
</output>