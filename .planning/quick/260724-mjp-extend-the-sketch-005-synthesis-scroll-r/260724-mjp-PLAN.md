---
phase: quick-260724-mjp
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/DetailHero.astro
  - src/components/EditionHero.astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - tests/e2e/edition.spec.ts
  - tests/e2e/gallery.spec.ts
autonomous: true
requirements: [QUICK-260724-mjp]

must_haves:
  truths:
    - "On a desktop gallery detail page (/galleries/{slug}/ and /en/galleries/{slug}/), scrolling pins the cover photo and shrinks it full-bleed -> ~55% width while the gallery title crystallizes on the right — the same Synthesis motion shipped on éditions."
    - "Clicking the gallery cover photo opens the Lightbox at image 1 of N (data-index=0 -> gallery.images[0])."
    - "With prefers-reduced-motion or on mobile, the gallery hero shows a settled/full-bleed end-state with the real <h1> title and zero scroll-linked motion (JS sets no inline styles in that branch)."
    - "Gallery pages render NO format-details line; the reveal panel reaches full opacity once the title finishes revealing, never waiting on a format stage that will never fire."
    - "Gallery hero photos are NEVER cropped — unlike the édition hero (which uses object-fit: cover), the gallery hero renders its cover photo with object-fit: contain (letterboxed within the fixed-height pin box on a solid ink background) so the photographer's actual framing/aspect ratio is preserved at every scroll position and every breakpoint. Édition heroes keep object-fit: cover unchanged (zero regression)."
    - "Édition detail pages keep the identical Synthesis hero after the component rename — no visual or behavioral regression."
    - "GalleryGrid still receives gallery.images.slice(1), the Lightbox still receives the full gallery.images array, and SEO title/description/structuredData are unchanged."
  artifacts:
    - src/components/DetailHero.astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - tests/e2e/gallery.spec.ts
    - tests/e2e/edition.spec.ts
  key_links:
    - "DetailHero optional objectFit prop ('cover' default | 'contain' for galleries) -> .detail-hero__img--contain modifier class -> galleries never crop the photographer's actual framing; éditions keep object-fit: cover unchanged."
    - "DetailHero optional formatText prop -> conditional render of .detail-hero__format AND a null-safe revealFormat guard in the scroll script (galleries break here if the guard still requires the format element)."
    - "Gallery hero <button data-gallery-thumb data-index=\"0\"> -> Lightbox index 0 -> gallery.images[0] (no Lightbox prop change)."
    - "Class rename edition-detail__hero* -> detail-hero* -> both e2e spec files must track the rename or their hero locators go stale."
---

<objective>
Generalize the just-shipped `EditionHero.astro` (sketch-005 "Synthesis — Bold + Facts" scroll-reveal hero) into a neutral, reusable `DetailHero.astro` and extend it to the Portfolio gallery detail pages, which still carry the OLD static 70vh full-bleed hero. Galleries gain the same sticky-pin scroll-scrubbed shrink (100% -> 55% width) + large-title reveal, and — for the first time — a clickable cover photo that opens the Lightbox at index 0.

Three structural differences from the édition case (decided with the user):
1. Galleries have NO format-details line — the component must make `formatText` genuinely optional (render nothing when absent; the reveal panel reaches full opacity once the title finishes, not on a second stage).
2. The gallery hero becomes clickable (data-gallery-thumb + data-index="0" + aria-label + expand-icon), mirroring the édition hero.
3. Gallery hero photos must NEVER be cropped (unlike éditions, which crop via object-fit: cover) — the photographer's actual framing/aspect ratio must be preserved at every scroll position. The component needs an `objectFit` prop ('cover' default, 'contain' for galleries) so the hero photo letterboxes on a solid background instead of cropping.

Purpose: one shared hero component instead of ~400 duplicated lines; a consistent Synthesis motion across both détail surfaces; galleries' cover photo joins the Lightbox flow it already had data for.
Output: renamed+generalized `DetailHero.astro`, all four détail-page twins wired to it, both e2e suites updated (locators tracked to the rename, plus new gallery hero-clickable + reduced-motion coverage).
</objective>

<execution_context>
@.claude/gsd-core/workflows/execute-plan.md
@.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# The component being generalized (read in full — this is what you evolve/rename):
@src/components/EditionHero.astro

# The proven call-site pattern to mirror (note leadPhoto vs images[0] data-model difference):
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro

# The files to modify (OLD static hero + slice(1) grid + full-array Lightbox to preserve):
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro

# Test references to track through the rename + the reduced-motion pattern to mirror:
@tests/e2e/edition.spec.ts
@tests/e2e/gallery.spec.ts

# The immediately-preceding quick task this one extends (key-decisions + patterns):
@.planning/quick/260724-l5i-build-sketch-005-s-winning-variant-synth/260724-l5i-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename EditionHero -> DetailHero, make formatText/caption optional, re-wire both édition twins</name>
  <files>src/components/DetailHero.astro, src/components/EditionHero.astro, src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro</files>
  <action>
Rename the component file and generalize it so it serves both détail surfaces with zero behavioral change to éditions.

1. Rename the file: `git mv src/components/EditionHero.astro src/components/DetailHero.astro` (preserves history), then edit the renamed file.

2. Neutralize the BEM block. Rename EVERY `edition-detail__hero*` class to `detail-hero*` (block `detail-hero`) — in the markup, in the `<script>` querySelectors, and in the `<style>` (base rules AND both media-query branches). The full 1:1 map: `edition-detail__hero` -> `detail-hero`, `edition-detail__hero-pin` -> `detail-hero__pin`, `-photo` -> `detail-hero__photo`, `-trigger` -> `detail-hero__trigger`, `-img` -> `detail-hero__img`, `-scrim` -> `detail-hero__scrim`, `-overlay-title` -> `detail-hero__overlay-title`, `-expand-icon` -> `detail-hero__expand-icon`, `-reveal` -> `detail-hero__reveal`, `-caption` -> `detail-hero__caption`, `-reveal-title` -> `detail-hero__reveal-title`, `-format` -> `detail-hero__format`. Do not miss the two compound selectors (`.detail-hero__trigger:hover .detail-hero__img`, `...:focus-visible .detail-hero__img`).

3. Make `formatText` and `caption` genuinely optional (not empty-string hacks). Change the Props interface so `formatText?: string`, `caption?: string`, and `total?: number` are optional; keep `leadPhotoSrc`, `leadPhotoSrcSet`, `leadPhotoAlt`, `title`, `heroAriaLabel` required. In the markup, wrap the caption `<p class="detail-hero__caption">` in `{caption && (...)}` and the format `<span class="detail-hero__format">` in `{formatText && (...)}` so neither element renders (nor reserves layout space) when the prop is absent. The `<h1 class="detail-hero__reveal-title">` always renders.

3b. Add an `objectFit?: 'cover' | 'contain'` prop, defaulting to `'cover'` (`const { ..., objectFit = 'cover' } = Astro.props;`) — this is the no-crop escape hatch galleries need. On the `<img class="detail-hero__img">`, add a conditional modifier class: `class={`detail-hero__img${objectFit === 'contain' ? ' detail-hero__img--contain' : ''}`}`. Add the CSS rule `.detail-hero__img--contain { object-fit: contain; }` (overrides the base rule's `object-fit: cover`). The pin's existing `background: var(--color-ink)` already fills the letterboxed negative space around a contained photo — no new background rule needed. Do not touch the hover/focus `scale(1.02)` transform rule; it applies equally to both modes. Leave the default (no prop passed) producing byte-identical output to today's `object-fit: cover` — this is what keeps éditions unchanged.

4. Make the scroll script null-safe for the now-optional format element. The current mandatory guard requires `revealFormat`, so a page with no format element would never attach the driver — fix that. Drop `revealFormat` from the guard so it reads `if (track && photo && scrim && overlayTitle && reveal)`. Inside `onProgress`, set the reveal-panel opacity to `titleT` alone (this is mathematically identical to the previous `Math.max(titleT, formatT)` because titleT ramps t=0.3->0.6 and formatT ramps t=0.6->1.0, so formatT never exceeds titleT — the panel already reached full opacity when the title finished). Wrap the two `revealFormat` writes (opacity + transform, using the existing formatT ramp) in `if (revealFormat) { ... }`. In `clearInlineStyles`, wrap the two `revealFormat.removeProperty(...)` calls in `if (revealFormat) { ... }` as well. Leave every other constant and the photo/scrim/overlay/reveal math byte-for-byte unchanged (revealDistance=900, width lerp 100->55, scrim 1 - t*3.3, overlay 1 - t*4, titleT (t-0.3)/0.3, formatT (t-0.6)/0.4).

5. Update the file-header comment block so it describes a shared detail-page hero (used by both édition and gallery détail pages) with optional formatText/caption, instead of an édition-only component. Preserve the threat-model note that this island imports neither src/lib/sanity nor src/lib/image (no read token reaches the browser).

6. Re-wire both édition twins with NO behavioral change. In src/pages/editions/[slug].astro: change the import to `import DetailHero from '../../components/DetailHero.astro';`, rename the `<EditionHero ... />` element to `<DetailHero ... />` (props unchanged — éditions still pass formatText + caption + total), and update the frontmatter comment that mentions "the shared EditionHero component" to say DetailHero. In src/pages/en/editions/[slug].astro: same, with the EN import depth `import DetailHero from '../../../components/DetailHero.astro';`. After this task the identifier `EditionHero` must not appear anywhere in src/.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    Also confirm the rename is complete and consistent:
    `test ! -f src/components/EditionHero.astro` (old file gone);
    `grep -rn "EditionHero" src/` returns no matches (identifier fully retired, comments included);
    `grep -c "detail-hero__pin" src/components/DetailHero.astro` is >= 1;
    `grep -c "edition-detail__hero" src/components/DetailHero.astro` is 0;
    `grep -c "detail-hero__img--contain" src/components/DetailHero.astro` is >= 1 (the no-crop modifier class and its CSS rule both exist).
  </verify>
  <done>`DetailHero.astro` exists (EditionHero.astro deleted), uses only `detail-hero*` classes, has optional `formatText?`/`caption?`/`total?` props with conditional rendering, an `objectFit?: 'cover' | 'contain'` prop (default `'cover'`) driving a `detail-hero__img--contain` modifier class, and a scroll script whose guard no longer requires the format element and whose revealFormat writes are individually guarded. Both édition twins import and render `<DetailHero>` with unchanged props (no `objectFit` passed, so behavior/output is byte-identical to before). `npm run typecheck` passes with no new errors; `EditionHero` is absent from src/.</done>
</task>

<task type="auto">
  <name>Task 2: Wire DetailHero into both gallery twins as a clickable hero (no format, no caption)</name>
  <files>src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro</files>
  <action>
Replace the OLD static `.gallery-detail__hero` block in both gallery détail twins with the shared `<DetailHero>`, giving galleries the Synthesis scroll-reveal and a clickable cover photo — while preserving every existing gallery contract.

For src/pages/galleries/[slug].astro (FR):
1. Add `import DetailHero from '../../components/DetailHero.astro';` to the frontmatter imports.
2. Keep the existing hero locals as-is: `heroImage = gallery.images[0]`, `heroSrc = fullSizeUrl(heroImage, 2000)`, `heroAlt = heroImage.alt?.[locale] ?? ''`. Add one new local: `const heroAriaLabel = ` + a template string reading `Voir en taille réelle, image 1 sur ${gallery.images.length}` (mirrors the édition FR hero aria-label and the gallery grid's own FR aria-label wording).
3. In the template, replace the entire `<div class="gallery-detail__hero"> ... </div>` block (the img + scrim + h1) with a single element: `<DetailHero leadPhotoSrc={heroSrc} leadPhotoSrcSet={responsiveImageSrcSet(heroImage)} leadPhotoAlt={heroAlt} title={gallery.title} total={gallery.images.length} heroAriaLabel={heroAriaLabel} objectFit="contain" />`. Do NOT pass `formatText` or `caption` — galleries have neither, so the component renders no format line and no caption kicker. `objectFit="contain"` is REQUIRED here — it is what stops the photographer's actual composition from being cropped as the hero shrinks (galleries must never use the édition default of `cover`). The hero photo is now the clickable `data-gallery-thumb data-index="0"` trigger provided by DetailHero.
4. Remove the migrated hero CSS from the page `<style>`: delete the `.gallery-detail__hero`, `.gallery-detail__hero-img`, `.gallery-detail__hero-scrim`, and `.gallery-detail__hero-title` rules (that styling now lives in DetailHero). KEEP `.gallery-detail`, `.gallery-detail__content`, and `.gallery-detail__statement` untouched.
5. Do NOT touch anything else: `gridItems` must keep `gallery.images.slice(1)` with `index = i + 1` (the cover-photo skip that avoids duplicating the hero in the grid — this is already correct); `<Lightbox images={gallery.images} locale={locale} />` must keep receiving the FULL array (index 0 now correctly resolves to the clickable hero — no Lightbox prop change); `seoTitle`/`seoDescription`/`socialImage`/`structuredData` and the `<BaseLayout headerVariant="transparent">` wrapper stay exactly as they are.

For src/pages/en/galleries/[slug].astro (EN twin): apply the identical change with EN specifics — import depth `import DetailHero from '../../../components/DetailHero.astro';`, `heroAriaLabel` reading `View full size, image 1 of ${gallery.images.length}` (matches the édition EN hero and the gallery grid's EN aria-label wording), and the same `objectFit="contain"` (required, same reason as FR). Everything else (slice(1) grid, full-array Lightbox, SEO, structuredData) identical to FR apart from the `locale = 'en'` copy already present.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    Confirm the wiring and preserved contracts on both twins:
    `grep -c "DetailHero" src/pages/galleries/[slug].astro` is >= 2 (import + element) and same for the EN twin;
    `grep -c "gallery-detail__hero" src/pages/galleries/[slug].astro` is 0 and 0 for the EN twin (old static hero markup + CSS gone);
    `grep -c "gallery.images.slice(1)" src/pages/galleries/[slug].astro` is 1 and 1 for the EN twin (grid skip preserved);
    `grep -c "Lightbox images={gallery.images}" src/pages/galleries/[slug].astro` is 1 and 1 for the EN twin (full-array Lightbox preserved);
    `grep -c 'objectFit="contain"' src/pages/galleries/[slug].astro` is 1 and 1 for the EN twin (no-crop mode wired — this is the fix for the photographer's explicit "do not crop the photos" requirement).
  </verify>
  <done>Both gallery twins import `DetailHero` and render it in place of the removed static `.gallery-detail__hero` block, passing no `formatText`/`caption` but passing `objectFit="contain"`; the hero photo is clickable via DetailHero's `data-index="0"` trigger AND never cropped (letterboxed on the pin's ink background instead); `.gallery-detail__hero*` CSS is removed while `.gallery-detail`/`.gallery-detail__content`/`.gallery-detail__statement` remain; `gallery.images.slice(1)` grid, full-array Lightbox, and SEO/structuredData are unchanged; `npm run typecheck` passes.</done>
</task>

<task type="auto">
  <name>Task 3: Track e2e locators through the rename + add gallery hero-clickable and reduced-motion coverage</name>
  <files>tests/e2e/gallery.spec.ts, tests/e2e/edition.spec.ts</files>
  <action>
Update both suites so existing assertions keep passing against the new shared markup, then add the new gallery coverage the user asked for. Mirror the reduced-motion pattern already in edition.spec.ts.

edition.spec.ts (locator rename only — no behavioral change): the four hero locators reference the renamed block. Change `.edition-detail__hero-pin` -> `.detail-hero__pin` (both occurrences), `h1.edition-detail__hero-reveal-title` -> `h1.detail-hero__reveal-title`, and `.edition-detail__hero-overlay-title` -> `.detail-hero__overlay-title`. Update the describe-block comment that names `EditionHero.astro` to `DetailHero.astro`. Do NOT touch `.edition-detail__format`, `.edition-detail__statement`, or `.edition-detail__back-link` — those are page-level classes in .edition-detail__content, not the hero, and are unchanged.

gallery.spec.ts (rename + de-alias the hero from grid-thumbnail assertions + new coverage):
1. In the "serves responsive hero, thumbnail, and lightbox image candidates" test: change the hero locator `.gallery-detail__hero-img` -> `.detail-hero__img` (its srcset/sizes assertions stay: `/480w.*2000w/`, `100vw`). CRITICAL: the hero is now itself a `[data-gallery-thumb]`, so any `[data-gallery-thumb]`.first() now resolves the HERO, not the first grid thumb. Re-scope the grid-thumbnail assertions in this test to the grid: use `.gallery-grid [data-gallery-thumb] img` for the thumbnail srcset check (must stay `/320w.*900w/`, the grid's thumbnail candidates) and `.gallery-grid [data-gallery-thumb]` for the click that opens the lightbox to check the lightbox srcset. This mirrors edition.spec.ts, which already scopes grid lookups with `.gallery-grid [data-gallery-thumb]`.
2. Leave the other existing lightbox/morph/bento tests as-is: they click `[data-gallery-thumb]`/role-button `.first()` (now the hero) purely to open the dialog and assert counter/Escape/focus-return/backdrop/morph behavior, none of which depends on which thumb opened it — they remain valid. (The bento test already scopes its count to `.gallery-grid [data-gallery-thumb]`, so it is unaffected.)
3. Add a new describe block "gallery hero is clickable (sketch 005)" proving the hero-clickable behavior that did NOT exist before: navigate from the homepage grid to the first gallery detail (reuse the existing discovery pattern — goto "/", click the 'Grille' button, read the first `a.home-grid__tile` href); assert `[data-gallery-thumb][data-index="0"]` is visible and has a non-empty aria-label; click it; assert `dialog[open]` is visible and `[data-role="counter"]` matches `/^1 \/ \d+$/`; press Escape and assert focus returns to the hero trigger. Add the EN counterpart by navigating to `/en/galleries/${slug}/` for the same slug and asserting the hero trigger opens the lightbox at `1 / N` there too.
4. Add a reduced-motion describe block mirroring edition.spec.ts's "editions hero reduced-motion (sketch 005)" exactly, adapted to gallery routes and classes. Use `test.use({ viewport: { width: 1280, height: 900 } })` (desktop, required — the sticky pin only exists in the min-width:768px branch). Test A: `page.emulateMedia({ reducedMotion: 'reduce' })`, navigate to a gallery detail, assert `.detail-hero__pin` computed `position` is NOT `sticky`, `h1.detail-hero__reveal-title` is visible without scrolling, the `.detail-hero__overlay-title` is hidden or opacity 0, and the hero trigger click still opens the lightbox at `/^1 \/ \d+$/`. Test B (companion, no reduced motion): `.detail-hero__pin` computed `position` IS `sticky` by default. Discover the gallery URL via the same homepage-grid pattern used elsewhere in this file — never hardcode a slug.
  </action>
  <verify>
    <automated>npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts</automated>
    (Requires the Sanity `.env` the orchestrator supplies for verification; `npm run typecheck` is the always-runnable gate if credentials are absent in the executor's environment.)
    Also confirm no stale hero locators remain: `grep -c "gallery-detail__hero-img" tests/e2e/gallery.spec.ts` is 0; `grep -c "edition-detail__hero" tests/e2e/edition.spec.ts` is 0.
  </verify>
  <done>Both suites reference the renamed `detail-hero*` block; the "responsive hero/thumbnail/lightbox" gallery test scopes its grid-thumbnail assertions to `.gallery-grid` so the now-clickable hero doesn't shadow them; a new gallery hero-clickable block (FR + EN) proves `data-index="0"` opens the Lightbox at 1/N with focus return; a new gallery reduced-motion block mirrors the édition one (pin not sticky, reveal h1 visible, overlay hidden, lightbox still opens; sticky by default without reduced motion). `npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` passes; no stale hero locators remain.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time Sanity fetch -> static HTML | Content is fetched at build time (published perspective) and baked into static files; nothing reaches the browser at request time. |
| static HTML -> browser (client JS island) | `DetailHero.astro` runs a dependency-free vanilla-JS island in the browser. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-mjp-01 | Information Disclosure | DetailHero.astro client island | low | mitigate | Component receives only pre-computed, already-localized primitive props; it imports neither src/lib/sanity nor src/lib/image, so no Sanity read token or client is bundled into the browser payload (existing EditionHero boundary, preserved through the rename). |
| T-mjp-02 | Tampering (supply chain) | npm dependencies | low | accept | This plan installs NO packages — it edits existing .astro/.ts files only. No new dependency enters the tree, so the package-legitimacy gate does not apply. |
| T-mjp-03 | Denial of Service | scroll rAF driver | low | accept | The scroll handler is rAF-throttled (single pending frame) and detaches entirely in the reduced-motion/mobile branch; unchanged from the shipped édition hero. |
</threat_model>

<verification>
- `npm run typecheck` (astro check) passes with no new errors after each task (the always-runnable gate; matches the l5i precedent where this was the one step the executor's environment could run end-to-end).
- `npm run test:e2e -- tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts` passes (requires the Sanity `.env` the orchestrator supplies during verification).
- Recommended non-blocking human spot-check (mirrors l5i): on desktop, scroll a `/galleries/{slug}/` page and confirm the Synthesis pin/shrink/title-reveal; click the cover photo and confirm the Lightbox opens at 1/N; toggle OS "Reduce motion" and confirm the settled end-state with the real title; check the EN twin and a mobile width; confirm an édition détail page is visually unchanged.
</verification>

<success_criteria>
- `EditionHero.astro` is renamed to `DetailHero.astro` with neutral `detail-hero*` classes and optional `formatText?`/`caption?` props (conditional rendering, null-safe scroll guard).
- All four détail-page twins (2 édition + 2 gallery) import and render `<DetailHero>`; `EditionHero` no longer appears in src/.
- Gallery détail pages show the Synthesis scroll-reveal on desktop, a clickable cover photo (data-index="0") opening the Lightbox at index 0, and the genuine reduced-motion/mobile CSS-first fallback (JS sets no inline styles in that branch).
- Galleries render no format line; the reveal panel reaches full opacity when the title finishes.
- Gallery hero photos use `objectFit="contain"` (never cropped, letterboxed on the ink background) at every scroll position and breakpoint; éditions keep the unchanged `cover` default.
- Preserved without regression: `gallery.images.slice(1)` grid skip, full-array Lightbox, SEO/structuredData, and the unchanged édition hero.
- Both e2e suites pass; gallery.spec.ts gains hero-clickable (FR+EN) and reduced-motion coverage.
</success_criteria>

<output>
Create `.planning/quick/260724-mjp-extend-the-sketch-005-synthesis-scroll-r/260724-mjp-SUMMARY.md` when done.
</output>
