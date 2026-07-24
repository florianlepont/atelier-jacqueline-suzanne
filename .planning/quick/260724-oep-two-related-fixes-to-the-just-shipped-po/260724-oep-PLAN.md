---
phase: quick-260724-oep
plan: 1
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [QUICK-260724-oep]
files_modified:
  - src/lib/sanity.ts
  - src/lib/image-orientation.ts
  - tests/unit/image-orientation.test.ts
  - tests/unit/gallery-query.test.ts
  - src/components/DetailHero.astro
  - src/components/GalleryGrid.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - tests/e2e/gallery.spec.ts

must_haves:
  truths:
    - "On a gallery whose first image is portrait but which contains a landscape image, the DetailHero shows the first landscape image (not images[0])."
    - "Clicking the gallery hero opens the Lightbox at the hero image's real 1-based position, the counter reads that same number, and the hero aria-label states that same position."
    - "Every gallery image is reachable exactly once across hero + grid; each grid thumbnail opens the Lightbox at its own real (unreshuffled) array index."
    - "Gallery grid thumbnails render at native aspect ratio with no cropping (masonry: object-fit is not cover, each img has a real aspect-ratio, multi-column flow)."
    - "Both edition detail pages (clickable index-0 hero + bento grid) are byte-identical — their call sites pass no heroIndex and no layout prop."
    - "The landscape-hero-selection helper is a pure, fixture-unit-tested function; both gallery GROQ queries project per-image asset dimensions."
  artifacts:
    - src/lib/image-orientation.ts
    - tests/unit/image-orientation.test.ts
    - src/lib/sanity.ts
    - src/components/DetailHero.astro
    - src/components/GalleryGrid.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - tests/e2e/gallery.spec.ts
  key_links:
    - "heroIndex to DetailHero button data-index to Lightbox open(index): the chosen hero must point the Lightbox at the SAME image the hero shows."
    - "gallery.images is passed to Lightbox UNREORDERED — the hero selection only changes which index the hero UI points at, never the array order."
    - "Each grid item.index is its OWN real array position (from filter, not a recomputed i+1) so grid clicks open the correct Lightbox slide."
    - "aria-label position number equals heroIndex + 1 equals the Lightbox counter the user lands on."
    - "GalleryGrid layout defaults to bento and DetailHero heroIndex defaults to 0 so editions inherit current behavior with zero call-site changes."
    - "Masonry grid src MUST be the uncropped image URL (fullSizeUrl / responsiveImageSrcSet) so each tile's intrinsic ratio equals its --ar and no distortion/crop occurs."
---

<objective>
Two related fixes to the just-shipped Portfolio gallery detail page, both driven by real Sanity image-dimension metadata that no query currently projects.

FIX 1 — Prefer a landscape photo as the gallery hero (instead of the hardcoded images[0]), because the hero now renders object-fit: contain (never-crop, shipped in quick-260724-mjp) and a portrait photo looks small/heavily letterboxed in the wide hero box. This requires projecting per-image dimensions in both gallery GROQ queries, a pure unit-tested orientation helper, a new heroIndex prop on DetailHero, and a careful Lightbox index remapping so the hero button, the grid thumbnails, the aria-label, and the Lightbox counter all agree on real image positions.

FIX 2 — Show the gallery thumbnail grid in native, uncropped aspect ratios via a masonry layout (CSS multi-column), added as an opt-in layout mode on the EXISTING shared GalleryGrid.astro. Editions keep the bento layout (may keep cropping — explicit user statement) and are provably unaffected.

Purpose: The gallery hero should present a photo that actually fills the wide hero frame, and secondary thumbnails should show the photographer's real framing rather than square/bento crops — without regressing editions, which deliberately keep the bold bento treatment.

Output: Extended Sanity data layer + a pure orientation helper (unit-tested), a heroIndex prop on DetailHero, a layout (bento | masonry) mode + aspectRatio item field on GalleryGrid, both gallery twins fully rewired, and updated/added e2e + unit coverage.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

# The just-shipped precedent this plan extends (per-caller optional-prop pattern):
@.planning/quick/260724-mjp-extend-the-sketch-005-synthesis-scroll-r/260724-mjp-SUMMARY.md

# Data layer + types to extend (GROQ queries, SanityImage/GalleryImage):
@src/lib/sanity.ts
# Existing @sanity/image-url helpers to reuse (fullSizeUrl / responsiveImageSrcSet uncropped; thumbnailUrl square-crop):
@src/lib/image.ts
# Pure-helper + fixture-test precedent to mirror (style, null-safety, export shape):
@src/lib/related-gallery.ts

# Components to change:
@src/components/DetailHero.astro
@src/components/GalleryGrid.astro
# The Lightbox hook contract (data-gallery-thumb + numeric 0-based data-index; counter = current+1 / slides.length):
@src/components/Lightbox.astro

# Files to rewire (FR + EN gallery twins):
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro

# Reference implementation for the masonry layout — read Variant B (#variant-b) markup + CSS:
@.planning/sketches/004-thumbnail-grid-poster-treatment/index.html

# Tests to update/extend:
@tests/e2e/gallery.spec.ts
@tests/unit/gallery-query.test.ts
@tests/unit/related-gallery.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Project image dimensions in gallery GROQ + pure landscape-hero-selection helper (unit-tested)</name>
  <files>src/lib/sanity.ts, src/lib/image-orientation.ts, tests/unit/image-orientation.test.ts, tests/unit/gallery-query.test.ts</files>
  <behavior>
    Helper pickHeroIndex(images) in src/lib/image-orientation.ts (pure, imports only the GalleryImage type):
    - Empty or undefined array returns 0.
    - First element is landscape (dimensions.width greater than dimensions.height) returns 0.
    - First is portrait, a later element is landscape returns the index of the FIRST landscape element.
    - Multiple landscape elements returns the FIRST (lowest) landscape index.
    - All portrait returns 0 (fallback).
    - Square images (width equal to height) are NOT landscape (strict greater-than) so they fall through to the fallback of 0.
    - Any element missing dimensions (or width/height) is treated as not-landscape (skipped), never throws.
    gallery-query.test.ts: getGalleries/getGallery still call fetch with the existing tokens (order(orderRank), publicationStatus, showOnHomePage) AND now additionally project per-image asset dimensions.
  </behavior>
  <action>
    Extend the Sanity data layer and add the orientation helper.

    1. In src/lib/sanity.ts: add an exported ImageDimensions interface with numeric width, numeric height, and optional numeric aspectRatio. Add an optional dimensions field of that type to the GalleryImage interface (keep it on GalleryImage, NOT on SanityImage — only gallery queries project it; EditionImage aliases GalleryImage so the field stays optional/absent for editions, which is correct since edition queries are not changed by this plan). Do NOT alter the asset reference shape — keep the existing asset ref so builder.image(img) in src/lib/image.ts keeps working unchanged.

    2. In src/lib/sanity.ts: in BOTH GALLERIES_QUERY and GALLERY_BY_SLUG_QUERY, replace the bare trailing images projection with a per-image projection that spreads all existing fields and adds a sibling dimensions field dereferenced from the asset metadata (project each image as spread-all-fields plus a computed dimensions sourced from the asset-dereferenced metadata.dimensions). Use the GROQ spread so alt/rights/hotspot and the asset reference are all preserved exactly; only the new dimensions object (width/height/aspectRatio) is added. Leave the edition queries (EDITIONS_QUERY, EDITION_BY_SLUG_QUERY) untouched.

    3. Create src/lib/image-orientation.ts: an exported pure function pickHeroIndex(images: GalleryImage[]): number implementing the behavior block. Mirror src/lib/related-gallery.ts's style (pure, defensive null-safety, doc comment). Use findIndex with a strict landscape test (width greater than height) guarded by a null-check on the image's dimensions; return 0 when the array is empty/undefined or when findIndex returns -1.

    4. Create tests/unit/image-orientation.test.ts: fixture-based Vitest cases covering every bullet in the behavior block (no live Sanity — build plain GalleryImage-shaped fixtures with a dimensions field, mirroring tests/unit/related-gallery.test.ts's fixture approach). Do not stub the function under test.

    5. In tests/unit/gallery-query.test.ts: add one assertion in the getGalleries describe that the GROQ string projects the dereferenced dimensions (assert the fetched query string contains the asset-dereferenced metadata dimensions projection). Do not weaken any existing assertion.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/image-orientation.test.ts tests/unit/gallery-query.test.ts && npm run typecheck</automated>
  </verify>
  <done>image-orientation.test.ts and gallery-query.test.ts pass; astro check reports 0 errors; both gallery GROQ queries project asset dimensions; edition queries unchanged; GalleryImage has an optional dimensions field; the asset reference shape is preserved.</done>
</task>

<task type="auto">
  <name>Task 2: Add opt-in masonry layout mode + aspectRatio item field to the shared GalleryGrid.astro (bento stays default, editions byte-identical)</name>
  <files>src/components/GalleryGrid.astro</files>
  <action>
    Generalize the shared GalleryGrid.astro to support a second layout without touching its default (bento) output — mirrors the objectFit-prop precedent from quick-260724-mjp's DetailHero (per-caller behavior via an optional prop with a safe default).

    1. Add an optional numeric aspectRatio field to the exported GalleryGridItem interface, documented as required-in-practice for masonry and unused in bento (each value is the image's real width/height, computed by the caller).

    2. Add a layout prop typed as bento | masonry (optional) to Props, destructured with a default of bento. Guard the existing chunk-by-3 groups computation so it only runs in bento mode.

    3. Wrap the rendered markup in a bento-vs-masonry conditional. The BENTO branch must be the CURRENT markup verbatim (same .gallery-grid wrapper, .gallery-grid__group groups with data-size/data-side, .tile--hero/.tile--small, expand-icon SVG, data-gallery-thumb / data-index / aria-label) so editions render identical DOM. The MASONRY branch renders a flat list (NO .gallery-grid__group wrapper): a .gallery-grid.gallery-grid--masonry container whose direct children are the same tile-classed button elements (keep the class tile, keep data-gallery-thumb + numeric data-index + aria-label + the expand-icon SVG so the shared Lightbox hook and the IntersectionObserver reveal script keep working with NO JS change), each carrying an inline style that sets a --ar custom property to the item's aspectRatio (fall back to 1), and containing an img with src/srcset/alt, lazy loading, async decoding, and a sizes attribute of (max-width: 800px) 50vw, 33vw. Do NOT add the hero/small modifier classes in masonry (there are no groups).

    4. Add masonry CSS scoped under .gallery-grid--masonry, porting sketch 004 Variant B (#variant-b in .planning/sketches/004-thumbnail-grid-poster-treatment/index.html): three columns on desktop / two columns at max-width 800px, a column gap of var(--space-md); masonry tiles are display: inline-block, width: 100%, margin: 0 0 var(--space-md), break-inside: avoid; and override the shared tile-img rule for masonry so the img is position: static, width: 100%, height: auto, aspect-ratio: var(--ar, 1), object-fit: contain. The contain here is the never-crop guarantee (the caller supplies an uncropped src whose intrinsic ratio equals --ar, so contain fits exactly and can never crop). Leave every existing bento rule unchanged (bento still legitimately fills fixed-shape cells) — the base tile reveal rules (opacity/transform transition) are shared and must keep applying to masonry tiles.
  </action>
  <verify>
    <automated>npm run typecheck && test $(grep -c 'gallery-grid--masonry' src/components/GalleryGrid.astro) -ge 1 && test $(grep -c 'column-count' src/components/GalleryGrid.astro) -ge 1 && test $(grep -c 'aspectRatio' src/components/GalleryGrid.astro) -ge 1</automated>
  </verify>
  <done>astro check 0 errors; GalleryGrid exposes an optional layout prop defaulting to bento and an optional aspectRatio item field; a masonry branch + .gallery-grid--masonry column-count CSS exist; the bento branch markup and CSS are unchanged so editions (which pass no layout prop) render identical DOM.</done>
</task>

<task type="auto">
  <name>Task 3: Add heroIndex prop to DetailHero + rewire both gallery twins (landscape hero, index remapping, masonry grid)</name>
  <files>src/components/DetailHero.astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro</files>
  <action>
    Consume Task 1's helper/dimensions and Task 2's masonry mode to deliver both fixes on the gallery twins, while keeping editions untouched.

    1. In src/components/DetailHero.astro: add an optional numeric heroIndex prop to the Props interface, destructured with a default of 0. Change the hero trigger button so its data-index attribute binds to the heroIndex expression instead of the current hardcoded zero literal. Because the default is 0, editions (which pass no heroIndex) keep emitting the same index-0 trigger — byte-identical output. Change nothing else in this component.

    2. In src/pages/galleries/[slug].astro (FR) and src/pages/en/galleries/[slug].astro (EN), make the SAME edits (only the locale key and import depth differ):
       a. Import pickHeroIndex from ../../lib/image-orientation (FR) / ../../../lib/image-orientation (EN). Compute const heroIndex = pickHeroIndex(gallery.images) and set heroImage = gallery.images[heroIndex] (replacing the hardcoded gallery.images[0]). heroSrc/heroAlt derive from that heroImage as before.
       b. Fix the hero aria-label to state the REAL 1-based position of the chosen hero: use heroIndex + 1 as the position number (keep the existing FR wording "Voir en taille reelle, image {N} sur {total}" / EN wording "View full size, image {N} of {total}"). This is a hard requirement — a screen-reader user must not be told image 1 and then land on a different Lightbox counter.
       c. Pass heroIndex to the DetailHero call (add heroIndex={heroIndex} alongside the existing props; keep objectFit="contain").
       d. Rebuild gridItems from the FULL images array EXCLUDING the hero, preserving each image's OWN real array index: map gallery.images to {img, index} pairs, filter out the pair whose index === heroIndex (do NOT use slice(1)), then map each surviving pair to a GalleryGridItem whose index is that real array position (NOT a recomputed i+1). For each grid item compute aspectRatio from the image's dimensions (dimensions.width / dimensions.height, guarding height greater than 0, else 1). For the grid src/srcset use the UNCROPPED helpers — fullSizeUrl(img, 600) for src and responsiveImageSrcSet(img, [320, 480, 600, 900]) for srcset — so the tile's intrinsic ratio equals its aspectRatio and masonry never distorts/crops (do NOT keep thumbnailUrl/responsiveThumbnailSrcSet, which square-crop). Keep alt as empty string (decorative — the real alt is on the hero) and set the grid aria-label using that same real index + 1.
       e. Update the imports from ../../lib/image (FR) / ../../../lib/image (EN): remove thumbnailUrl and responsiveThumbnailSrcSet if they become unused (eslint is a blocking CI gate), keeping fullSizeUrl and responsiveImageSrcSet.
       f. Pass layout="masonry" to the GalleryGrid call.
       g. Keep the Lightbox receiving gallery.images UNCHANGED and UNREORDERED (never move the hero image to a different position — only the hero UI's data-index changes). Leave structuredData and SEO exactly as-is.

    3. Do NOT touch src/pages/editions/[slug].astro or src/pages/en/editions/[slug].astro — they must keep passing no heroIndex and no layout prop.
  </action>
  <verify>
    <automated>npm run typecheck && npm run lint && test $(grep -c 'data-index={heroIndex}' src/components/DetailHero.astro) -ge 1 && test $(grep -c 'pickHeroIndex' src/pages/galleries/[slug].astro src/pages/en/galleries/[slug].astro | grep -c ':1') -eq 2 && test $(grep -c 'layout="masonry"' src/pages/galleries/[slug].astro) -ge 1 && test $(grep -c 'layout="masonry"' src/pages/en/galleries/[slug].astro) -ge 1 && git diff --quiet -- 'src/pages/editions/[slug].astro' 'src/pages/en/editions/[slug].astro'</automated>
  </verify>
  <done>astro check + eslint pass; DetailHero binds the hero trigger data-index to heroIndex (default 0); both gallery twins select a landscape-preferred hero, state its real position in the aria-label, exclude it from the grid while preserving every other image's real index, compute per-tile aspectRatio, use uncropped grid src/srcset, and pass layout="masonry"; the Lightbox still receives the unreordered gallery.images; both edition twins are unchanged (git diff clean).</done>
</task>

<task type="auto">
  <name>Task 4: Update gallery e2e — masonry assertions, structural hero locators, and index-remapping correctness</name>
  <files>tests/e2e/gallery.spec.ts</files>
  <action>
    Adapt the gallery e2e suite to the new hero selection and masonry grid. Editions coverage (edition.spec.ts) is untouched and must keep passing.

    1. Replace the existing "gallery grid bento layout" describe block (which asserts .gallery-grid__group bento geometry — galleries no longer use bento) with a "gallery grid masonry layout" describe block at viewport 1280x900. For the first discovered gallery with more than one image (discover via the homepage grid the same way the file already does: goto /, click the Grille toggle, read a.home-grid__tile hrefs), assert: the grid container has class gallery-grid--masonry; there are zero .gallery-grid__group elements; the container's computed column-count is a numeric value greater than 1 (multi-column active on desktop); and for the grid imgs (.gallery-grid [data-gallery-thumb] img), each has a computed object-fit that is not "cover" and a computed aspect-ratio that is not "auto" (a real ratio is set). This is the masonry-appropriate replacement for the old bento geometry assertion.

    2. Fix the "gallery hero is clickable (sketch 005)" tests (FR + EN): stop locating the hero by the index-0 attribute selector (the hero may now be any index, and a grid tile may carry index 0). Instead locate the hero via the structural selector .detail-hero [data-gallery-thumb]. Read its data-index attribute (heroIndex) and its aria-label. Click it, assert the dialog opens, and assert the counter reads exactly the hero's real 1-based position (heroIndex + 1) over N — i.e. build the expected "{heroIndex+1} / {N}" string from the read data-index and the counter's own denominator. Assert the aria-label contains that same position number. Keep the Escape-closes + focus-returns-to-hero assertions (FR test).

    3. Fix the "gallery hero reduced-motion (sketch 005)" test the same way: replace the index-0 hero locator with .detail-hero [data-gallery-thumb], and assert the counter matches a generic "{digits} / {digits}" pattern (reduced-motion behavior is otherwise unchanged).

    4. Add a new "gallery hero landscape-preference + lightbox index remapping" describe block (viewport 1280x900) that is the definitive correctness proof for FIX 1: on the first discovered gallery, read the hero's data-index (from .detail-hero [data-gallery-thumb]) and ALL grid data-index values (from .gallery-grid [data-gallery-thumb]); assert the union of {heroIndex} and the grid indices, sorted numerically, equals the complete contiguous set 0..N-1 with no duplicates and no gaps (proving every image is reachable exactly once at its real index and the array was never reshuffled), where N equals the total trigger count (hero + grid); assert clicking the hero opens the Lightbox counter at heroIndex + 1 over N; and assert clicking the first grid tile opens the counter at that tile's own data-index + 1 over N.

    5. Do not change the "serves responsive hero, thumbnail, and lightbox image candidates" test — the grid srcset it checks (/320w.*900w/) is still satisfied by responsiveImageSrcSet([320,480,600,900]); confirm it still passes.
  </action>
  <verify>
    <automated>npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts</automated>
  </verify>
  <done>The full gallery.spec.ts passes with masonry assertions, structural hero locators, and the new index-remapping correctness block; edition.spec.ts still passes unchanged (editions unaffected). Note: if the executor lacks a .env / node_modules to run a preview build, run npm run typecheck as the always-available gate and hand the e2e run to the orchestrator, which has Sanity credentials (mirrors the quick-260724-mjp verification handoff).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time Sanity fetch to shipped static HTML | Sanity content (including new image dimension metadata) is fetched at BUILD time with a read token and baked into static HTML; no request-time compute exists. |
| shipped client JS to DOM | The Lightbox/reveal islands read only pre-computed data attributes (data-index, --ar, src/srcset) already rendered into the page; they import nothing from src/lib. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-oep-01 | Information Disclosure | src/lib/sanity.ts read token | low | mitigate | No change to the token boundary: DetailHero/GalleryGrid still import nothing from src/lib; all data (dimensions, aspectRatio, src/srcset) is computed in build-time frontmatter and passed down as primitives, exactly as the existing pattern. The new asset->metadata.dimensions projection returns only public image geometry, no secrets. |
| T-oep-02 | Tampering | GROQ query with $slug | low | accept | GALLERY_BY_SLUG_QUERY continues to bind slug as a GROQ parameter (never string-interpolated); this plan does not alter the parameterization. The new dimensions projection is a static literal, not user-influenced. |
| T-oep-03 | Denial of Service | masonry aspect-ratio from Sanity dimensions | low | mitigate | aspectRatio is derived defensively (height greater than 0 else fallback 1) and pickHeroIndex null-guards missing dimensions, so malformed/partial published documents cannot throw during the static build (mirrors the existing WR-03 null-safety posture). |

No package-manager installs occur in this plan (no npm/pip/cargo add), so no package-legitimacy checkpoint (T-*-SC) is required.
</threat_model>

<verification>
- npm run typecheck (astro check) passes with 0 errors across all tasks.
- npm run lint (eslint) passes — no unused imports left after swapping the gallery grid image helpers.
- npm run test:unit passes, including the new tests/unit/image-orientation.test.ts and the extended tests/unit/gallery-query.test.ts.
- npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts passes: gallery masonry + hero + index-remapping assertions all green; every edition test unchanged and green (editions provably unaffected).
- Both edition detail twins show a clean git diff (not modified).
- Independent (orchestrator) spot-check with real Sanity credentials: on a gallery whose images[0] is portrait and which contains a landscape photo, the rendered hero is the landscape photo; the hero button data-index equals that photo's real array index; the Lightbox counter and the hero aria-label both state that same position; grid thumbnails render uncropped at native ratios in a multi-column masonry; an edition detail page is visually identical to before.
</verification>

<success_criteria>
- FIX 1: gallery hero prefers the first landscape image (falls back to images[0] when none are landscape), and the hero button, grid thumbnails, aria-label, and Lightbox counter all agree on real, unreshuffled image indices.
- FIX 2: gallery grid renders as an uncropped native-aspect-ratio masonry (multi-column, object-fit not cover), driven by real per-image dimensions.
- The orientation helper is pure and fully unit-tested; both gallery GROQ queries project asset dimensions.
- Editions are byte-identical: no edition call site changed, bento + index-0 hero preserved by the bento/heroIndex defaults.
- All existing gallery/edition/unit tests pass; new coverage added for the helper, masonry, and the index-remapping correctness invariant.
</success_criteria>

<output>
Create `.planning/quick/260724-oep-two-related-fixes-to-the-just-shipped-po/260724-oep-SUMMARY.md` when done.
</output>
