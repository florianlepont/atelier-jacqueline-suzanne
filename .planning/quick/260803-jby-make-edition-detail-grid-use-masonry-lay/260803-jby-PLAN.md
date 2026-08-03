---
phase: quick-260803-jby
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260803-jby]
files_modified:
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/components/EditionDetailBody.astro
  - src/components/GalleryGrid.astro
  - tests/e2e/edition.spec.ts
  - tests/e2e/gallery.spec.ts
must_haves:
  truths:
    - "On every published édition detail page, in fr and en, each secondary photo below the hero is displayed in its entirety at its own natural aspect ratio: nothing is cropped, and no background colour is visible on any edge of any photo."
    - "The édition secondary-photo grid flows as a multi-column masonry, mechanically identical to the one gallery detail pages already render — no grouped/asymmetric composition remains on the page."
    - "Both locale twins are actually changed: the fr and the en édition detail routes render the same masonry contract, with no drift between the two files."
    - "Gallery detail pages are entirely unchanged: same masonry flow, same natural-ratio tiles, same absence of any dark strip below a tile."
    - "Clicking any édition grid tile still opens the Lightbox at that photo's own real position, and the hover/focus zoom still plays on the grid tiles."
    - "The édition hero photo is untouched — it still shows the whole photo exactly as shipped in quick task 260803-bvu (Item 7)."
    - "GalleryGrid.astro's bento code path is still present in the file (nothing deleted), and every comment in the touched files that claims éditions render bento has been corrected."
    - "The full CI gate is green: npm run typecheck, npm run lint, npm run build, npm run test:artifact, npm run test:unit, npm run test:e2e — with no test skipped, deleted, or weakened to make it pass."
  artifacts:
    - path: "src/pages/editions/[slug].astro"
      provides: "FR édition grid items built exactly like the gallery detail page's: a real per-photo aspectRatio derived from the Sanity image dimensions, and the uncropped full-size URL/srcset helpers instead of the square-crop thumbnail helpers"
    - path: "src/pages/en/editions/[slug].astro"
      provides: "The EN twin of the same grid-item derivation, kept symmetric with the FR file"
    - path: "src/components/EditionDetailBody.astro"
      provides: "The GalleryGrid call site now selects the masonry layout explicitly, the same way GalleryDetailBody.astro already does"
    - path: "src/components/GalleryGrid.astro"
      provides: "Comment-only correction: the component's own prose no longer claims éditions render bento, and records that the bento branch now has no caller while the shared `.tile img` base rule still supplies the hover transition to masonry"
    - path: "tests/e2e/edition.spec.ts"
      provides: "The superseded bento describe block rewritten to assert the NEW édition masonry contract — no crop, no exposed background on any edge, no groups, multi-column flow, fr and en, plus the preserved hover-zoom proof"
    - path: "tests/e2e/gallery.spec.ts"
      provides: "PORT-05's édition sub-test and both stale describe-block header comments rewritten to the masonry contract, with every gallery-side assertion left byte-unchanged"
  key_links:
    - "`src/pages/galleries/[slug].astro:71-85` is the exact pattern to mirror: `const { width, height } = img.dimensions ?? {}; const aspectRatio = width && height && height > 0 ? width / height : 1;` plus `fullSizeUrl(img, 600)` / `responsiveImageSrcSet(img, [320, 480, 600, 900])`. The édition twins must reproduce this shape, differing ONLY in their `alt` (localized on éditions, empty on galleries — see the GalleryGridItem interface comment) and their locale-specific ariaLabel string."
    - "`src/lib/sanity.ts:147-150` — `IMAGES_WITH_DIMENSIONS_PROJECTION` is interpolated into BOTH edition queries (lines 200 and 204), so `img.dimensions` is genuinely populated on édition images. This is what makes the per-photo aspectRatio real rather than a silent fallback to 1. A tile whose `--ar` fell back to 1 would reintroduce exactly the exposed background this task removes, which is why the e2e proof compares each rendered tile against its image's own natural dimensions."
    - "`src/components/GalleryGrid.astro:107-146` is the masonry markup branch and `:361-397` its CSS: `column-count: 3` (2 below 800px) with `.gallery-grid--masonry .tile img { position: static; display: block; width: 100%; height: auto; aspect-ratio: var(--ar, 1); object-fit: contain; }`. The tile box IS the photo's shape, which is the mechanism that guarantees no leftover space and therefore no exposed `--color-ink` background."
    - "`src/components/GalleryGrid.astro:244-251` — the shared `.tile img` base rule is NOT fully dead after this change: masonry overrides its position/inset/height/object-fit but still inherits its `transition: transform 0.3s ease`, which is what makes the hover zoom work. Do not delete or gut this rule; only its comment is wrong."
    - "`tests/e2e/edition.spec.ts:271-381` (`'editions bento grid photos uncropped (quick-260803-ira)'`) asserts bento-specific structure — `.gallery-grid__group`, `data-size`/`data-side`, `.tile--hero`/`.tile--small`, `position: absolute` imgs — none of which will exist on an édition page any more. This block MUST be rewritten to the masonry contract, never deleted or skipped."
    - "`tests/e2e/gallery.spec.ts:1017-1046` (`'édition detail (bento): …'`) and the two describe-block header comments at `:171-175` and `:933-945` all document éditions as the bento caller. All three become false in the same commit and must be corrected together, or the file enshrines the superseded design in prose."
    - "`tests/e2e/edition.spec.ts:577-587` resolves grid thumbs via `.gallery-grid [data-gallery-thumb]` and asserts the Lightbox counter matches the tile's own `data-index`. Both GalleryGrid branches emit identical button attributes (`data-gallery-thumb`, `data-index`, `aria-label`), so this guard must keep passing with its assertions unedited — it is the proof the layout swap did not disturb the Lightbox contract."
---

<objective>
Make the secondary-photo grid on édition detail pages use the masonry layout that gallery detail pages already use, so each photo's box is the photo's own shape and no background is ever exposed around it.

Purpose: quick task 260803-ira stopped the cropping by switching the shared bento tile image to a contain fit, but bento cells have a fixed size independent of each photo's real ratio, so the photo now letterboxes against the tile's ink background. The site owner reviewed that live and was explicit: "you just had to display the picture entirely the same way as it's done in Galleries pages." This replaces the mechanism instead of patching it.
Output: one atomic commit switching both édition detail routes and their shared body component onto the existing masonry path, with the superseded bento assertions rewritten to the new contract and a green full CI gate.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/quick/260803-ira-fix-dition-detail-pages-bento-grid-photo/260803-ira-SUMMARY.md
@src/pages/galleries/[slug].astro
@src/components/GalleryGrid.astro
</context>

<diagnosis>
Confirmed by direct code inspection during planning. Verify it still holds with one `grep -rn "<GalleryGrid" src/` and one read of each file you are about to edit, then proceed — do NOT re-diagnose from scratch.

1. `src/components/EditionDetailBody.astro:96` renders `<GalleryGrid items={gridItems} />` with no `layout` prop; `GalleryGrid.astro:51` defaults to bento. `src/components/GalleryDetailBody.astro:63` renders `<GalleryGrid items={gridItems} layout="masonry" />`. These are the only two call sites in `src/`.
2. Bento composes photos into CSS-Grid cells whose size is fixed by the grid, not by the photo: `.gallery-grid__group { grid-auto-rows: 16vw }` plus per-`[data-size]`/`[data-side]` column/row spans, and `aspect-ratio: 3 / 4` on every tile below 800px. Because the cell's shape is independent of the photo's shape, ANY fit choice is wrong for some photo: `cover` crops it (the original complaint), `contain` (quick-260803-ira) fits it whole but leaves `--color-ink` visible in the leftover space (the current complaint).
3. Masonry has no leftover space by construction: each tile carries `style="--ar: {aspectRatio}"` and `.gallery-grid--masonry .tile img` sets `aspect-ratio: var(--ar, 1)` with `width: 100%; height: auto`. The box is the photo's shape, so `object-fit: contain` fits exactly, edge to edge. This is why gallery detail pages never showed either symptom.
4. Galleries feed that mechanism from real data: `src/pages/galleries/[slug].astro:75-76` reads `img.dimensions` and computes `width / height`, and uses the uncropped `fullSizeUrl` / `responsiveImageSrcSet` helpers so each tile's intrinsic ratio equals its declared `--ar`. Éditions currently use the square-crop helpers and pass no `aspectRatio` at all.
5. `src/lib/sanity.ts:200,204` confirm the édition queries already project `dimensions` from the asset metadata, so no data-layer change is needed — the field éditions need is already there and already typed optional on `GalleryImage` (`src/lib/sanity.ts:120`).

Consequence: the fix is to move éditions onto the existing, already-proven masonry path — three small source edits, no new CSS, no new prop, no data-layer change.
</diagnosis>

<scope_boundaries>
IN scope:
- The grid-item derivation in both édition detail routes (per-photo aspect ratio + uncropped URL helpers) and the `layout` prop at the shared édition call site.
- Comment-only corrections wherever a touched file's prose now misdescribes reality.
- Rewriting the e2e assertions that the layout swap supersedes.

OUT of scope — do NOT touch:
- **Deleting the bento code path.** `GalleryGrid.astro`'s `groups` chunking, its bento markup branch, and every `.gallery-grid__group` / `[data-size]` / `[data-side]` / `.tile--hero` / `.tile--small` / `<800px` bento rule stay exactly where they are. They lose their last caller in this commit, which is worth recording in the SUMMARY as separately-cleanable, but removing a whole subsystem inside a live-feedback correction is not this task's job.
- **Any CSS declaration in `GalleryGrid.astro`.** Not the masonry rules, not the shared `.tile img` base rule (its object-fit stays as quick-260803-ira left it — the rule is shadowed for masonry on that property, and its `transition` is still live for masonry's hover zoom), not the bento geometry. This file's diff must be comments only.
- **`GalleryGrid.astro`'s props/interface**, including the `layout` default. Éditions become an explicit masonry caller; the default is not the mechanism any more and does not need changing.
- **The `alt` value on édition grid items.** Éditions pass a localized alt because those thumbs are not decorative there (see the `GalleryGridItem` interface comment); galleries pass an empty string because their real alt lives on the hero. Mirror the gallery page's *aspectRatio and URL helpers*, NOT its alt.
- **`src/components/DetailHero.astro`** and everything about the hero photo. It was explicitly approved by the owner in quick-260803-bvu.
- **`src/components/GalleryDetailBody.astro`**, `src/pages/galleries/**`, `src/pages/index.astro`, `src/pages/editions/index.astro` and their EN twins. The square-crop helpers stay in use by the homepage grid and the éditions overview preview panel — do not remove or alter `thumbnailUrl` / `responsiveThumbnailSrcSet` in `src/lib/image.ts`.
- **`.planning/phases/18-gallery-ditions-display-fixes/18-UAT.md`** — never read, never write. An unrelated UAT session may be live in another worktree of this repo.
- **Git branches.** Work on the already-checked-out `fix/homepage-editions-contact-ux`. Do not create, switch, rebase or merge branches.
- Every gallery-side assertion in `tests/e2e/gallery.spec.ts` — the masonry sub-test at ~944-1015 and the `'gallery grid masonry layout'` tests at ~176-220 keep their assertions byte-unchanged (their header comments are a separate, required correction, see below).

Anticipated, REQUIRED edits (not scope creep): the entire `'editions bento grid photos uncropped (quick-260803-ira)'` describe block in `tests/e2e/edition.spec.ts` and the `'édition detail (bento)'` sub-test in `tests/e2e/gallery.spec.ts` assert structure that will cease to exist. Rewrite both to the new contract — never delete, never weaken, never skip.
</scope_boundaries>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Move the édition detail grid onto the gallery masonry mechanism</name>
  <files>src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro, src/components/EditionDetailBody.astro, src/components/GalleryGrid.astro, tests/e2e/edition.spec.ts, tests/e2e/gallery.spec.ts</files>
  <behavior>
    Write these assertions FIRST and watch the édition-side ones go red against the current build before touching any source file. Both spec files run under the `chromium` project only (`playwright.config.ts` restricts `webkit-mobile` to `**/*.smoke.spec.ts`), so desktop hover is reliable.

    Rewrite the `'editions bento grid photos uncropped (quick-260803-ira)'` describe block in `tests/e2e/edition.spec.ts` in place — same location (next to the hero guard block), same `test.use({ viewport: { width: 1280, height: 900 } })`, same `pollHoverZoomScale` helper, new name and new header comment naming quick-260803-jby and stating that éditions now render the same masonry grid as galleries, with the photo's own ratio driving each tile's box.

    - Test 1 — every published édition, fr: reach each édition by reading every `.editions-index__row` href on `/editions/` (never hardcode a slug), navigate, scroll to `document.body.scrollHeight`, and assert the first tile carries the `revealed` class before measuring (Playwright treats an `opacity: 0` element as visible, so `toBeVisible()` alone does not prove the scroll-reveal ran). Then assert, per page: `.gallery-grid` carries the masonry modifier class; zero `.gallery-grid__group` elements exist; the grid's computed `column-count` is greater than 1. Before measuring images, poll until every `.gallery-grid .tile img` reports `complete === true` and a non-zero `naturalWidth` (the tiles are lazily loaded — measuring earlier yields a NaN ratio and a flaky test), and assert that count matches the tile count. Then, for EVERY tile: the img computes `position: static`, an uncropped `object-fit`, and an `aspect-ratio` that is not `auto`; its `clientWidth / clientHeight` matches its `naturalWidth / naturalHeight` within 1%; and — the assertion that literally encodes the owner's complaint — the img's bounding box matches its `.tile` button's bounding box on all four edges within 0.5px, so no tile background can be visible around any photo. Track that at least one édition with at least one tile was actually measured and assert that at the end, so the loop can never pass vacuously.
    - Test 2 — the EN twin: derive the slug from the first fr row's href, navigate to the matching `/en/editions/{slug}/` route, and repeat the masonry-class / no-groups / all-four-edges-flush assertions for that page. This is what proves both locale files were edited, not just one; the two routes are separate source files and silent drift between them is the realistic failure mode here.
    - Test 3 — galleries unaffected: keep the existing gallery-side test, updating only its name/comment so it reads as a scoping guard proving the gallery path still behaves identically now that éditions share it (rather than "untouched by a bento-only change"). Discover a gallery via the homepage grid (`page.goto('/')`, click the `Grille` button, read the first `a.home-grid__tile` href — there is no galleries overview page). Its assertions — masonry class, `position: static`, natural-ratio within 1% — stay as they are; the exhaustive masonry proof stays referenced in gallery.spec.ts's PORT-05 block rather than duplicated.
    - Test 4 — the hover zoom survives the layout swap: on a real édition page after scrolling, assert the first revealed `.gallery-grid .tile`'s img transform computes to `none` at rest, hover the tile, then `pollHoverZoomScale` it (never a fixed sleep — the transition is 0.3s ease). Repeat on a second tile when the édition renders more than one, skipping only that half otherwise. Read the transform from the IMG, never from the `.tile` button whose own transform is the scroll-reveal translate. The `.tile--hero`/`.tile--small` locators this test used are gone; the tiles are now uniform.

    In `tests/e2e/gallery.spec.ts`, rewrite the `'édition detail (bento): …'` sub-test inside the PORT-05 describe block: keep its 0px-border assertions exactly as they are (they are PORT-05's actual subject), keep its uncropped `object-fit` assertion, rename it to state the masonry contract, and strengthen it with the same img-vs-tile bounding-box gap check the gallery masonry sub-test above it already carries — that guarantee now applies to éditions too and is precisely what the owner reported. Then correct BOTH stale describe-block header comments in that file: the one above `'gallery grid masonry layout'` (~171-175), which says éditions still use bento and are unaffected, and the PORT-05 one (~933-945), which explains the bento/masonry split across the two callers. Both must state that gallery AND édition detail pages now render the same masonry mode, that this is why each is still verified independently (two different pages, one shared component), and that the bento branch retains no caller.
  </behavior>
  <action>
    In `src/pages/editions/[slug].astro`, rebuild the `gridItems` derivation to mirror `src/pages/galleries/[slug].astro:71-85` exactly: inside the existing `.map()`, destructure `width` and `height` off `img.dimensions ?? {}`, compute `aspectRatio` as `width / height` guarded so a missing or zero-height dimensions object yields `1`, and return that `aspectRatio` alongside the existing fields. Switch `src` and `srcset` from the square-crop helpers to the uncropped ones — `fullSizeUrl(img, 600)` and `responsiveImageSrcSet(img, [320, 480, 600, 900])`, the same call shapes and the same width list the gallery page uses — and update the import statement at the top of the file so it pulls only the helpers the file still uses. Keep `index`, the localized `alt`, and the locale-specific `ariaLabel` string exactly as they are.

    Apply the identical change to `src/pages/en/editions/[slug].astro`, keeping the two files structurally symmetric (same import shape, same derivation, same relative import depth, only the locale key and the visible English ariaLabel string differ).

    Replace the now-false comment above each of those two derivations. It currently states that the édition grid keeps a square thumbnail treatment with no masonry aspect ratio and points at a superseded plan's scope boundaries. Record instead: the grid now mirrors the gallery detail page's derivation completely — real per-photo ratio from the Sanity image dimensions plus uncropped sources — so each masonry tile's box is the photo's own shape and no tile background is ever exposed around a photo; note quick-260803-jby and the owner's instruction that éditions display photos the same way galleries do. Describe the superseded square-crop treatment by concept rather than naming the helpers it used, so the comment records intent instead of fossilising the old call.

    In `src/components/EditionDetailBody.astro`, pass `layout="masonry"` on the `GalleryGrid` element, matching `src/components/GalleryDetailBody.astro:63`. Note briefly at that line why the prop is now explicit.

    In `src/components/GalleryGrid.astro`, change comments ONLY — no CSS declaration, no markup, no prop. Three passages are now false and must be corrected: the file header's claim that this component renders an asymmetric bento composition for éditions; the `layout` prop's Props-interface note that éditions omit the prop and keep rendering bento; and the quick-260803-ira comment above the shared `.tile img` base rule asserting that bento is reached only by éditions and that this base rule is therefore in practice the éditions' treatment. Rewrite them to record that both callers now select masonry explicitly, that the bento branch and its geometry rules are consequently retained but unreferenced (deliberately left in place, cleanable separately), and — importantly for anyone tempted to gut the base rule — that `.tile img` is still live for masonry because masonry shadows only its position/inset/height/fit declarations while inheriting its hover transition.

    Then apply the two test-file rewrites described in `<behavior>`. Run the targeted chromium command below and confirm the previously-red édition expectations are green, that the gallery-side assertions pass with no edit, and that `tests/e2e/edition.spec.ts`'s `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` block and its `'editions lightbox'` block both still pass untouched — those are the proofs the owner-approved hero and the Lightbox index contract did not regress.

    Finally, screenshot a real édition detail page at 1280x900 and at 390x844 against a live dev server, using an absolute `http://localhost:<port>/` URL pointing at the actual running `astro dev` daemon (quick-260803-bvu lost time to Playwright's own preview server on 4321 serving a stale `dist/`). Confirm visually what the assertions claim: photos edge to edge, no coloured band anywhere around them, and the mobile two-column flow reading as a deliberate grid. Éditions losing the asymmetric composition is the explicitly accepted outcome of this task — do not treat it as a regression and do not attempt to preserve it.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts --project=chromium</automated>
    <automated>test "$(grep -c 'layout="masonry"' src/components/EditionDetailBody.astro)" -eq 1 &amp;&amp; grep -q 'aspectRatio' 'src/pages/editions/[slug].astro' &amp;&amp; grep -q 'aspectRatio' 'src/pages/en/editions/[slug].astro'</automated>
    <automated>npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run build &amp;&amp; npm run test:artifact &amp;&amp; npm run test:unit &amp;&amp; npm run test:e2e</automated>
    <human-check>
      Open an édition detail page (fr and en) and scroll to the grid below the hero. The photos flow in columns, each one whole, each one filling its own box with no coloured band on any side — visually the same treatment as a gallery detail page's grid. Hovering a photo still produces the subtle zoom, and clicking one still opens the lightbox on that same photo. A gallery detail page looks exactly as it did.
    </human-check>
  </verify>
  <done>
    - Both édition detail routes build their grid items with a real per-photo aspect ratio derived from the Sanity image dimensions and with the uncropped URL/srcset helpers, structurally symmetric to each other and to `src/pages/galleries/[slug].astro`; each item's localized alt and locale-specific ariaLabel are unchanged.
    - `src/components/EditionDetailBody.astro` selects the masonry layout explicitly at its `GalleryGrid` call site.
    - `src/components/GalleryGrid.astro`'s diff contains comments only — no CSS declaration, markup, or prop changed — and its prose no longer claims éditions render bento, while recording that the bento branch is retained but unreferenced and that the shared `.tile img` base rule is still live for masonry's hover transition.
    - `tests/e2e/edition.spec.ts` carries a quick-260803-jby block proving, on every published édition (fr) and on the EN twin: masonry class present, zero bento groups, multi-column flow, and — for every tile — static-positioned uncropped imgs whose rendered ratio matches the photo's natural ratio within 1% and whose bounding box is flush with its tile on all four edges. The loop asserts it measured at least one real tile.
    - That same block proves the gallery masonry path still behaves identically, and that the hover zoom still settles to a ~1.03 scale on édition grid tiles.
    - `tests/e2e/gallery.spec.ts`'s édition sub-test states the masonry contract with its 0px-border assertions intact and a new img-vs-tile gap check; both stale describe-block header comments are corrected; every gallery-side assertion in the file is byte-unchanged; nothing anywhere is skipped, deleted or weakened.
    - `tests/e2e/edition.spec.ts`'s `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` and `'editions lightbox'` blocks pass with their assertions unedited.
    - All three `<automated>` commands pass, including the full gate (typecheck, lint, build, test:artifact, test:unit, test:e2e across chromium + webkit-mobile) with zero failures.
    - Desktop and mobile screenshots reviewed and reported; photos are edge to edge with no exposed background at either viewport.
    - The SUMMARY records (a) that GalleryGrid.astro's bento path — the groups chunking, the bento markup branch, and the `.gallery-grid__group` / `[data-size]` / `[data-side]` / `.tile--hero` / `.tile--small` CSS — now has no caller and could be removed as a separate cleanup, and (b) the reasoning behind how the superseded gallery.spec.ts bento sub-test was reframed rather than dropped.
    - Committed atomically on `fix/homepage-editions-contact-ux` as a `fix` commit; `18-UAT.md` never read or written; no branch created, switched, rebased or merged.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Sanity Content Lake → build-time render | Existing, unchanged: image URLs, dimensions and alt text are fetched at build time and baked into static HTML. This task changes which existing transform helper builds an already-fetched image's URL; it adds no new data flow and no new field. |
| Visitor browser → static Apache/Pages host | Existing, unchanged: zero request-time compute, so there is no server-side attack surface to extend. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260803-jby-01 | Information Disclosure | Édition grid `img` src/srcset | low | accept | The uncropped helper builds a URL to the SAME asset the square-crop helper already exposed, at a comparable width — the full-size variant of every one of these photos is already served by the Lightbox on the same page. No image becomes newly reachable. |
| T-260803-jby-02 | Denial of Service | Image bytes per édition detail page | low | accept | The srcset width list is unchanged (320/480/600/900); only the crop transform differs, so per-candidate byte size stays in the same range and the browser still picks one candidate per tile. `npm run build` + `npm run test:artifact` confirm the artifact shape is unchanged. |
| T-260803-jby-03 | Tampering | npm/pip/cargo installs | low | accept | No dependency is added, removed or upgraded; `package.json` and `package-lock.json` are outside `files_modified`. No install task exists in this plan, so no package legitimacy checkpoint applies. |
| T-260803-jby-04 | Tampering | e2e CI gate (`edition.spec.ts`, `gallery.spec.ts`) | medium | mitigate | Two describe blocks assert structure this change removes; deleting or skipping them to get green would silently retire coverage for the exact surface being changed. Mitigated by `<scope_boundaries>` requiring rewrite-never-delete, by `<behavior>` specifying the replacement assertions concretely (including the vacuous-loop guard), and by `<done>` requiring the untouched hero/lightbox guards to pass. |
| T-260803-jby-05 | Spoofing | Rendered `alt` text on édition grid tiles | low | mitigate | Éditions intentionally carry localized alt text where galleries carry an empty string; blindly copying the gallery derivation would strip the accessible name from every édition thumbnail. Mitigated by an explicit `<scope_boundaries>` exclusion and by the `<done>` criterion requiring alt/ariaLabel to be unchanged. |
</threat_model>

<verification>
Cross-scope guards — these must pass with NO edits to their assertions:

1. `tests/e2e/gallery.spec.ts`'s masonry sub-test (`'gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes'`) — proves gallery detail pages are behaviourally identical, including the natural-ratio and no-baseline-gap checks.
2. `tests/e2e/gallery.spec.ts`'s `'gallery grid masonry layout'` describe block — proves the multi-column flow and uncropped tiles are unchanged for galleries.
3. `tests/e2e/edition.spec.ts`'s `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` block — proves the owner-approved primary hero photo did not regress.
4. `tests/e2e/edition.spec.ts`'s `'editions lightbox'` block — proves the grid tiles are still Lightbox triggers whose `data-index` maps to the right slide after the markup branch changed.
5. `tests/e2e/edition.spec.ts`'s `'no commerce affordances (detail)'` and `'editions detail'` blocks — prove the rest of the page (statement, format line, EDN-06 boundary) is untouched.
6. `npm run test:unit` — `tests/unit/image.test.ts` still covers the square-crop helpers, which remain in use by the homepage grid and the éditions overview preview panel.

Full CI-equivalent gate, in order: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:artifact`, `npm run test:unit`, `npm run test:e2e` (chromium + webkit-mobile).

`git diff --stat` must show exactly six files changed: the two édition routes, `EditionDetailBody.astro`, `GalleryGrid.astro` (comments only), and the two spec files.
</verification>

<success_criteria>
- Every secondary photo on every published édition detail page displays whole, edge to edge in its own tile, with no exposed background on any edge — in fr and en.
- The édition grid is a multi-column masonry with no grouped/asymmetric composition remaining; this is the accepted, instructed outcome, not a regression.
- Gallery detail pages are provably unchanged (guards 1 and 2 pass unedited).
- The hover/focus zoom and the Lightbox `data-index` contract both survive the layout swap (guard 4 plus the new hover test).
- The hero photo is untouched (guard 3 passes unedited).
- GalleryGrid.astro's bento path is still present in the file, with its now-inaccurate prose corrected and its dead status recorded in the SUMMARY.
- The full CI gate is green with no test skipped, deleted or weakened.
- One atomic `fix` commit on `fix/homepage-editions-contact-ux`.
</success_criteria>

<output>
Create `.planning/quick/260803-jby-make-edition-detail-grid-use-masonry-lay/260803-jby-SUMMARY.md` when done.
</output>
