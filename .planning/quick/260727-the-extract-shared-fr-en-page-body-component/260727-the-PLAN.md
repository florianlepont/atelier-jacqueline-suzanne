---
phase: quick-260727-the
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/AboutPageBody.astro
  - src/components/ContactPageBody.astro
  - src/components/EditionDetailBody.astro
  - src/components/GalleryDetailBody.astro
  - src/components/EditionsOverviewBody.astro
  - src/pages/about.astro
  - src/pages/en/about.astro
  - src/pages/contact.astro
  - src/pages/en/contact.astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - src/pages/editions/index.astro
  - src/pages/en/editions/index.astro
autonomous: true
requirements:
  - "REFACTOR-DEDUP: extract shared fr/en page-body components (audit remediation, largest item)"
user_setup: []

must_haves:
  truths:
    - "About FR (/) and EN (/en/about/) render byte-identical DOM + CSS to before extraction (same classes, headings, portrait/exhibition figures, section numbers, structured data)."
    - "Contact FR/EN render identically; the ContactForm island still mounts with the correct locale and publicEmail, and email/Instagram/other-link rows plus sr-only new-tab hints are unchanged."
    - "Édition detail FR/EN render identically: DetailHero, in-flow back-link, format line, optional related link, image grid, and Lightbox (leadPhoto + images) all behave as before."
    - "Gallery detail FR/EN render identically: DetailHero (landscape-preferred hero index), masonry grid excluding the hero, Lightbox over the full image array, transparent header, hidden footer."
    - "Éditions overview FR/EN render identically: poster grid grouped-by-3 with alternating side + hero/small tiles, or the EmptyState when there are no éditions."
    - "The full test suite matches the current baseline (252 tests) with identical pass/skip outcomes; no test file changes."
    - "npm run typecheck and npm run build both succeed, generating both locale routes for every extracted pair."
    - "mentions-legales, confidentialite, and index route files (both locales) are byte-unchanged — not touched at all."
  artifacts:
    - src/components/AboutPageBody.astro
    - src/components/ContactPageBody.astro
    - src/components/EditionDetailBody.astro
    - src/components/GalleryDetailBody.astro
    - src/components/EditionsOverviewBody.astro
  key_links:
    - "Each of the 10 route files imports its new body component and renders it inside <BaseLayout> with already-locale-resolved props; frontmatter keeps its own data-fetch + .fr/.en field resolution + fallback strings."
    - "The entire byte-identical <style> block for each pair now lives ONCE inside its shared component; neither route file of a pair keeps a page <style> block."
    - "Locale-specific visible UI strings (headings, labels, captions, back-link text, sr-only hints, empty-state copy) are passed as explicit props from each route — NO new i18n dictionary is introduced inside any component."
    - "BaseLayout-consumed props (title/description/socialImage/noIndex/structuredData/headerVariant/hideFooter) remain in the route-level <BaseLayout> call, not delegated to the body component."
    - "getStaticPaths stays in the four [slug] route files (editions + galleries, both locales); Astro.props typing continues to come from getStaticPaths inference — no Props interface reintroduced."
---

<objective>
Eliminate the duplicated markup + byte-identical `<style>` blocks across 5 bilingual (fr/en) page-body pairs by extracting one shared Astro component per pair under `src/components/`, then reducing each of the 10 route files to thin data-resolution frontmatter plus a single `<BaseLayout><…Body {...resolvedProps} /></BaseLayout>` template call.

This is a ZERO visual/behavioral-change structural refactor. Every class name, CSS rule, conditional, locale string, and SEO/structured-data value must render identically before and after. The two per-locale route files keep doing their own Sanity fetch, `.fr`/`.en` field resolution, and fallback-string defaulting, then pass the resolved results as props to the shared body. Locale-specific visible text is passed as explicit props (no new i18n abstraction). `getStaticPaths` stays in the route files.

Purpose: Remove a real maintenance liability (~1,400 lines of near-byte-identical page code where any structural change must be applied twice, caught only by e2e, not the type system).
Output: 5 new shared components + 10 thinned route files, verified against the current 252-test baseline.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

# Shared layout — defines the BaseLayout Props consumed at route level (NOT delegated to body components)
@src/layouts/BaseLayout.astro

# Convention reference — existing shared components that take pre-localized primitives as typed Props
@src/components/EmptyState.astro
@src/components/DetailHero.astro

# The 5 pairs being extracted (read BOTH files of a pair fully before extracting it)
@src/pages/about.astro
@src/pages/en/about.astro
@src/pages/contact.astro
@src/pages/en/contact.astro
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro
@src/pages/editions/index.astro
@src/pages/en/editions/index.astro
</context>

<conventions>
- Component style: `interface Props { … }` then `const { … } = Astro.props;` — mirror `EmptyState.astro` / `DetailHero.astro`. PascalCase filenames in `src/components/`.
- Components render at BUILD time (no `client:*` directive), so importing `../lib/image` inside a body component is fine — it is build-time only, exactly as the current route frontmatter already does; no read token reaches the browser.
- Rule for deciding prop vs literal: any string that DIFFERS between the fr and en source files MUST become a prop. Any string that is byte-identical in both files (brand eyebrow "Atelier Jacqueline Suzanne", the "01"/"02"/"03" section numbers, the "Contact" h1, the "Instagram" label, the responsive `sizes` literals, image width arrays) stays as a literal inside the shared component.
- Import depth from `src/components/`: sibling components are `./Name.astro`; libs are `../lib/…`.
- Preserve SEO exactly: `structuredData`, `seoTitle`/`seoDescription`/`socialImage`/`noIndex`, `headerVariant`, `hideFooter` are all consumed by `<BaseLayout>` — keep them in the route-level `<BaseLayout>` call; do NOT pass them into the body component.
- DO NOT touch `src/pages/mentions-legales.astro`, `src/pages/confidentialite.astro`, or `src/pages/index.astro` (either locale) — out of scope, explicitly excluded.
</conventions>

<tasks>

<task type="auto">
  <name>Task 1: Extract AboutPageBody from the about.astro fr/en pair</name>
  <files>src/components/AboutPageBody.astro, src/pages/about.astro, src/pages/en/about.astro</files>
  <action>
Create `src/components/AboutPageBody.astro` containing the entire `<article class="about-page">…</article>` markup and the ENTIRE byte-identical `<style>` block from the current about pages. Import `fullSizeUrl` and `responsiveImageSrcSet` from `../lib/image`, and `import type { SanityImage } from '../lib/sanity'`.

Define Props (all already-locale-resolved): `heading: string`, `studioPracticeHeading: string`, `mediumTechniqueHeading: string`, `biography: string`, `practice: string`, `medium: string`, `portraitImage?: SanityImage`, `portraitAlt: string`, `exhibitionImage?: SanityImage`, `exhibitionAlt: string`.

Wire the markup to props: `<h1>{heading}</h1>`; the two section `<h2>` elements render `{studioPracticeHeading}` and `{mediumTechniqueHeading}`; lead paragraph and section bodies render `{biography}` / `{practice}` / `{medium}`. Keep the portrait/exhibition figures exactly as-is (including `class:list` truthiness on `portraitImage`, the `fullSizeUrl(portraitImage, 480)` / `responsiveImageSrcSet(portraitImage, [160,240,320,480])` calls, the `sizes` literal, the `fullSizeUrl(exhibitionImage, 1600)` / `responsiveImageSrcSet(exhibitionImage, [480,768,1200,1600])` calls) but replace the alt expressions with `{portraitAlt}` and `{exhibitionAlt}`. Keep the eyebrow "Atelier Jacqueline Suzanne" and the aria-hidden "01"/"02" numbers as literals.

AMPERSAND (load-bearing): the current headings are `<h2>Atelier &amp; pratique</h2>` and `<h2>Médium &amp; technique</h2>`. Pass these from the route as JS-expression props with a SINGLE literal ampersand — `studioPracticeHeading={"Atelier & pratique"}` (FR), `mediumTechniqueHeading={"Médium & technique"}` (FR) — because rendering `{expr}` auto-escapes `&` back to `&amp;`, reproducing the exact source HTML. Do NOT put the HTML entity `&amp;` in the prop value (that would double-escape and render a visible "&amp;").

Rewrite `src/pages/about.astro`: keep ALL existing frontmatter unchanged (siteCopy via `resolveSiteCopy(await getSiteSettings(), 'fr')`, `getAboutPage()`, biography/practice/medium/seoTitle/seoDescription/socialImage fallbacks, portraitImage, exhibitionImage, structuredData with `jobTitle: 'Photographe'`). Import `AboutPageBody from '../components/AboutPageBody.astro'`. Replace the template body: keep the `<BaseLayout title={seoTitle} description={seoDescription} socialImage={socialImage} noIndex={about?.seo?.noIndex} structuredData={structuredData}>` wrapper, and inside it render `<AboutPageBody heading={"À propos"} studioPracticeHeading={"Atelier & pratique"} mediumTechniqueHeading={"Médium & technique"} biography={biography} practice={practice} medium={medium} portraitImage={portraitImage} portraitAlt={portraitImage?.alt?.fr ?? ''} exhibitionImage={exhibitionImage} exhibitionAlt={exhibitionImage?.alt?.fr ?? ''} />`. Delete the page `<style>` block from the route (it now lives in the component).

Rewrite `src/pages/en/about.astro` identically but with EN values: `resolveSiteCopy(..., 'en')` (unchanged), `.en` field access + EN fallback strings + `jobTitle: 'Photographer'` all unchanged in frontmatter; import depth `../../components/AboutPageBody.astro`; props `heading={"About"}`, `studioPracticeHeading={"Studio & practice"}`, `mediumTechniqueHeading={"Medium & technique"}`, `portraitAlt={portraitImage?.alt?.en ?? ''}`, `exhibitionAlt={exhibitionImage?.alt?.en ?? ''}`, and the resolved `biography`/`practice`/`medium`. Delete the route `<style>` block.

Do NOT alter the structuredData object shape, the BaseLayout prop set, or any fallback strings.
  </action>
  <verify>
    <automated>npm run typecheck && npm run build</automated>
  </verify>
  <done>Both `/` (about) and `/en/about/` build successfully; `AboutPageBody.astro` holds the full markup + the single copy of the style block; both route files contain no page `<style>` block; the two `<h2>` headings render as `Atelier &amp; pratique` / `Studio &amp; practice` and `Médium &amp; technique` / `Medium &amp; technique` in the built HTML (single-ampersand rendering, no double-escape). Targeted coverage `tests/e2e/about.spec.ts` is exercised (with seo/accessibility/i18n) in Task 6.</done>
</task>

<task type="auto">
  <name>Task 2: Extract ContactPageBody from the contact.astro fr/en pair</name>
  <files>src/components/ContactPageBody.astro, src/pages/contact.astro, src/pages/en/contact.astro</files>
  <action>
Create `src/components/ContactPageBody.astro` containing the entire `<div class="contact-page">…</div>` markup and the ENTIRE byte-identical `<style>` block. Import `ContactForm from './ContactForm.astro'`.

Define Props: `locale: 'fr' | 'en'`, `intro: string`, `publicEmail: string`, `location?: string`, `availability?: string`, `instagramLink?: { url: string; label: string } | null`, `otherLinks: { url: string; label: string }[]`, `emailLabel: string`, `formHeading: string`, `formSubheading: string`, `newTabHint: string`.

Wire the markup: lead renders `{intro}`; the email row renders `{emailLabel}` in `.contact-page__label` and `{publicEmail}` in `.contact-page__value` with `href={`mailto:${publicEmail}`}`; the Instagram block stays gated on `{instagramLink && (…)}` and renders `href={instagramLink.url}`, value `{instagramLink.label}`, and the sr-only `{newTabHint}`; the meta block stays gated on `{(location || availability) && (…)}`; the other-links list stays gated on `{otherLinks.length > 0 && (…)}` and maps `otherLinks` rendering `{link.label}<span class="sr-only">{newTabHint}</span>` with `href={link.url}`; the form panel heading renders `<h2 id="contact-form-title">{formHeading}</h2>` and `<p>{formSubheading}</p>`; the form island is `<ContactForm locale={locale} publicEmail={publicEmail} />`. Keep as literals: eyebrow "Atelier Jacqueline Suzanne", `<h1 id="contact-title">Contact</h1>`, the "Instagram" `.contact-page__label`, and the aria-hidden "01"/"02"/"03" numbers.

Rewrite `src/pages/contact.astro`: keep ALL frontmatter unchanged (`locale = 'fr'`, `getContactPage()`, `intro`/`publicEmail`/`location`/`availability` with FR fallbacks, `professionalLinks` filter, `instagramLink`, `otherProfessionalLinks`, seo vars, structuredData). Then resolve link labels for the props: `const instagramLinkResolved = instagramLink ? { url: instagramLink.url, label: instagramLink.label?.fr ?? '' } : null;` and `const otherLinks = otherProfessionalLinks.map((l) => ({ url: l.url, label: l.label?.fr ?? '' }));`. Import `ContactPageBody from '../components/ContactPageBody.astro'`. Keep the `<BaseLayout title={seoTitle} description={seoDescription} socialImage={socialImage} noIndex={contact?.seo?.noIndex} structuredData={structuredData}>` wrapper and render `<ContactPageBody locale={locale} intro={intro} publicEmail={publicEmail} location={location} availability={availability} instagramLink={instagramLinkResolved} otherLinks={otherLinks} emailLabel={"E-mail"} formHeading={"Écrivez-moi"} formSubheading={"Je vous répondrai dès que possible."} newTabHint={" (nouvelle fenêtre)"} />`. Delete the route `<style>` block. Remove the now-unused `ContactForm` import from the route (it moved into the body component).

Rewrite `src/pages/en/contact.astro` identically with EN values: `locale = 'en'`, `.en` field access + EN fallbacks unchanged in frontmatter; resolve `instagramLinkResolved`/`otherLinks` using `.en`; import depth `../../components/ContactPageBody.astro`; props `emailLabel={"Email"}`, `formHeading={"Send a message"}`, `formSubheading={"I’ll get back to you as soon as possible."}` (keep the exact curly apostrophe), `newTabHint={" (opens in new tab)"}`. Delete the route `<style>` block; remove the unused `ContactForm` import from the route.

Preserve exactly: the leading space inside the new-tab hint strings, the structuredData object, and the BaseLayout prop set.
  </action>
  <verify>
    <automated>npm run typecheck && npm run build</automated>
  </verify>
  <done>`/contact/` and `/en/contact/` build successfully; ContactForm mounts from inside `ContactPageBody` with the correct `locale` + `publicEmail`; email/Instagram/other-link rows and both sr-only new-tab hints render identically per locale; neither route keeps a `ContactForm` import or a page `<style>` block. Targeted `tests/e2e/contact.spec.ts` is exercised in Task 6.</done>
</task>

<task type="auto">
  <name>Task 3: Extract EditionDetailBody from the editions/[slug].astro fr/en pair</name>
  <files>src/components/EditionDetailBody.astro, src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro</files>
  <action>
Create `src/components/EditionDetailBody.astro` containing the entire `<div class="edition-detail">…</div>` markup PLUS the `<Lightbox images={lightboxImages} locale={locale} />` element (both are siblings inside `<BaseLayout>` today), and the ENTIRE byte-identical `<style>` block. Import `DetailHero from './DetailHero.astro'`, `GalleryGrid, { type GalleryGridItem } from './GalleryGrid.astro'` (match the existing `import type { GalleryGridItem }` form used by the routes), and `Lightbox from './Lightbox.astro'`. Import `type { GalleryImage } from '../lib/sanity'` for the lightbox image array typing — this MUST be `GalleryImage`, not `SanityImage`, because `Lightbox.astro`'s `interface Props` requires `images: GalleryImage[]` (with the required `alt: LocaleString` field) and `edition.leadPhoto` / `edition.images` are already typed `EditionImage`, which is a type alias of `GalleryImage`. Using `SanityImage[]` would fail `npm run typecheck`.

Define Props (all pre-localized in the route): `leadPhotoSrc: string`, `leadPhotoSrcSet: string`, `leadPhotoAlt: string`, `title: string`, `formatText: string`, `total: number`, `heroAriaLabel: string`, `caption: string`, `statement: string`, `scrollHintLabel: string`, `overviewHref: string`, `backLinkLabel: string`, `relatedLink: { href: string; text: string } | null`, `gridItems: GalleryGridItem[]`, `lightboxImages: GalleryImage[]`, `locale: 'fr' | 'en'`.

Wire the markup exactly as today: the `<DetailHero … />` call passes through `leadPhotoSrc`, `leadPhotoSrcSet`, `leadPhotoAlt`, `title`, `formatText`, `total`, `heroAriaLabel`, `caption`, `statement`, `scrollHintLabel`. The back-link renders `<a class="edition-detail__back-link" href={overviewHref}><span aria-hidden="true">←</span> {backLinkLabel}</a>` (preserve the leading `←` span + space). The format paragraph renders `{formatText}`. The related link stays gated on `{relatedLink && (…)}` rendering `href={relatedLink.href}` and `{relatedLink.text}`. The grid renders on `{gridItems.length > 0 && <GalleryGrid items={gridItems} />}` — this is behaviorally identical to the current `(edition.images?.length ?? 0) > 0` guard because `gridItems` maps every `edition.images` entry 1:1. The Lightbox renders `<Lightbox images={lightboxImages} locale={locale} />`.

Rewrite `src/pages/editions/[slug].astro`: keep `getStaticPaths` (unchanged — do NOT reintroduce a Props interface), `const { edition } = Astro.props`, `locale = 'fr'`, and ALL current frontmatter derivations (overviewHref, statement, leadPhotoSrc, leadPhotoAlt, seoTitle/seoDescription/socialImage, lightboxImages, total, formatText, heroAriaLabel, heroCaption, scrollHintLabel, relatedLink via `getRelatedGalleryLink(edition.relatedGallery, locale)`, gridItems). Add one derivation for the srcset the DetailHero currently receives inline: `const leadPhotoSrcSet = responsiveImageSrcSet(edition.leadPhoto);`. Import `EditionDetailBody from '../../components/EditionDetailBody.astro'`. Replace the template with `<BaseLayout title={seoTitle} description={seoDescription} socialImage={socialImage} headerVariant="transparent"><EditionDetailBody leadPhotoSrc={leadPhotoSrc} leadPhotoSrcSet={leadPhotoSrcSet} leadPhotoAlt={leadPhotoAlt} title={edition.title} formatText={formatText} total={total} heroAriaLabel={heroAriaLabel} caption={heroCaption} statement={statement} scrollHintLabel={scrollHintLabel} overviewHref={overviewHref} backLinkLabel={"Retour aux éditions"} relatedLink={relatedLink} gridItems={gridItems} lightboxImages={lightboxImages} locale={locale} /></BaseLayout>`. Delete the route `<style>` block. Prune any imports now used only by the moved markup (e.g. `Lightbox`, `DetailHero`, `GalleryGrid`) from the route, keeping imports still used by frontmatter (`fullSizeUrl`, `responsiveImageSrcSet`, `thumbnailUrl`, `responsiveThumbnailSrcSet`, `getEditions`, `getRelatedGalleryLink`, `getRelativeLocaleUrl`).

Rewrite `src/pages/en/editions/[slug].astro` identically with EN values: `locale = 'en'`, EN `formatText`/`heroAriaLabel`/`heroCaption`/`scrollHintLabel`/gridItems aria strings unchanged in frontmatter; import depth `../../../components/EditionDetailBody.astro`; `backLinkLabel={"Back to Editions"}`. Delete the route `<style>` block and prune the same now-moved imports.
  </action>
  <verify>
    <automated>npm run typecheck && npm run build</automated>
  </verify>
  <done>Every édition detail route (fr + en) builds; DetailHero, in-flow back-link (`Retour aux éditions` / `Back to Editions`), format line, optional related link, image grid, and Lightbox behave identically; `getStaticPaths` remains in both route files with no reintroduced Props interface; imports moved into the component are pruned from the routes. Targeted `tests/e2e/edition.spec.ts` is exercised in Task 6.</done>
</task>

<task type="auto">
  <name>Task 4: Extract GalleryDetailBody from the galleries/[slug].astro fr/en pair</name>
  <files>src/components/GalleryDetailBody.astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro</files>
  <action>
Create `src/components/GalleryDetailBody.astro` containing the entire `<div class="gallery-detail">…</div>` markup PLUS the `<Lightbox images={…} locale={locale} />` element, PLUS the leading `{/* quick-260726-ltr … */}` comment currently sitting inside `<BaseLayout>` (preserve it verbatim). Include the ENTIRE byte-identical `<style>` block. Import `DetailHero from './DetailHero.astro'`, `GalleryGrid, { type GalleryGridItem } from './GalleryGrid.astro'` (mirror the routes' `import type { GalleryGridItem }`), `Lightbox from './Lightbox.astro'`, and `type { GalleryImage } from '../lib/sanity'` for the lightbox array typing — this MUST be `GalleryImage`, not `SanityImage`, because `Lightbox.astro`'s `interface Props` requires `images: GalleryImage[]` (with the required `alt: LocaleString` field) and `gallery.images` is already typed `GalleryImage[]`. Using `SanityImage[]` would fail `npm run typecheck`.

Define Props (all pre-localized in the route): `leadPhotoSrc: string`, `leadPhotoSrcSet: string`, `leadPhotoAlt: string`, `title: string`, `total: number`, `heroAriaLabel: string`, `heroIndex: number`, `statement: string`, `scrollHintLabel: string`, `carouselReturnHref: string`, `gridItems: GalleryGridItem[]`, `lightboxImages: GalleryImage[]`, `locale: 'fr' | 'en'`. This body has NO hardcoded locale strings of its own — every visible/aria string arrives pre-resolved.

Wire the markup exactly as today: `<DetailHero leadPhotoSrc={leadPhotoSrc} leadPhotoSrcSet={leadPhotoSrcSet} leadPhotoAlt={leadPhotoAlt} title={title} total={total} heroAriaLabel={heroAriaLabel} heroIndex={heroIndex} statement={statement} scrollHintLabel={scrollHintLabel} carouselReturnHref={carouselReturnHref} />`. Render the grid on `{gridItems.length > 0 && <GalleryGrid items={gridItems} layout="masonry" />}` — behaviorally identical to the current `gallery.images.length > 1` guard because `gridItems` excludes the hero, so `gridItems.length > 0` ⟺ `images.length > 1`. The Lightbox renders `<Lightbox images={lightboxImages} locale={locale} />`.

Rewrite `src/pages/galleries/[slug].astro`: keep `getStaticPaths` (unchanged, no Props interface), `const { gallery } = Astro.props`, `locale = 'fr'`, and ALL current frontmatter derivations (statement, heroIndex via `pickHeroIndex`, heroImage, heroSrc, heroAlt, heroAriaLabel, scrollHintLabel, carouselReturnHref, seoTitle/seoDescription/socialImage, gridItems, structuredData). Add `const leadPhotoSrcSet = responsiveImageSrcSet(heroImage);` (currently passed inline to DetailHero). Import `GalleryDetailBody from '../../components/GalleryDetailBody.astro'`. Replace the template with `<BaseLayout title={seoTitle} description={seoDescription} socialImage={socialImage} noIndex={gallery.seo?.noIndex} structuredData={structuredData} headerVariant="transparent" hideFooter><GalleryDetailBody leadPhotoSrc={heroSrc} leadPhotoSrcSet={leadPhotoSrcSet} leadPhotoAlt={heroAlt} title={gallery.title} total={gallery.images.length} heroAriaLabel={heroAriaLabel} heroIndex={heroIndex} statement={statement} scrollHintLabel={scrollHintLabel} carouselReturnHref={carouselReturnHref} gridItems={gridItems} lightboxImages={gallery.images} locale={locale} /></BaseLayout>`. Preserve `headerVariant="transparent"` and `hideFooter` on the BaseLayout call. Delete the route `<style>` block. Prune imports now used only by the moved markup (`DetailHero`, `GalleryGrid`, `Lightbox`), keeping `fullSizeUrl`, `responsiveImageSrcSet`, `pickHeroIndex`, `getGalleries`, `getRelativeLocaleUrl`.

Rewrite `src/pages/en/galleries/[slug].astro` identically with EN values (`locale = 'en'`, EN aria/scroll strings unchanged in frontmatter, `inLanguage: 'en'` and `image[].caption` `.en` unchanged in structuredData); import depth `../../../components/GalleryDetailBody.astro`. Delete the route `<style>` block and prune the same moved imports.
  </action>
  <verify>
    <automated>npm run typecheck && npm run build</automated>
  </verify>
  <done>Every gallery detail route (fr + en) builds; DetailHero uses the landscape-preferred `heroIndex`, the masonry grid excludes the hero, the Lightbox receives the full unreordered image array, and `headerVariant="transparent"` + `hideFooter` are preserved on BaseLayout; `getStaticPaths` stays put with no Props interface. Targeted `tests/e2e/gallery.spec.ts` is exercised in Task 6.</done>
</task>

<task type="auto">
  <name>Task 5: Extract EditionsOverviewBody from the editions/index.astro fr/en pair</name>
  <files>src/components/EditionsOverviewBody.astro, src/pages/editions/index.astro, src/pages/en/editions/index.astro</files>
  <action>
Create `src/components/EditionsOverviewBody.astro` containing the entire `<article class="editions-list">…</article>` markup and the ENTIRE byte-identical `<style>` block. Import `EmptyState from './EmptyState.astro'`. This component takes fully pre-resolved tile data so it needs NO `astro:i18n`, `../lib/image`, or `../lib/sanity` import.

Define a local `interface EditionTile { href: string; imgSrc: string; imgSrcset: string; alt: string; title: string; statement: string; }` and Props: `heading: string`, `tiles: EditionTile[]`, `emptyHeading: string`, `emptyBody: string`, `viewEditionLabel: string`.

Move the grouping presentation logic INTO the component: chunk `tiles` into groups of 3 in existing order (`for (let i = 0; i < tiles.length; i += 3) groups.push(tiles.slice(i, i + 3))`) — identical to the current route chunking, just applied to the resolved tiles. Render `<h1>{heading}</h1>` (eyebrow "Atelier Jacqueline Suzanne" stays literal). Gate on `{tiles.length === 0 ? <EmptyState heading={emptyHeading} body={emptyBody} variant="bold" /> : (…grid…) }` — `tiles.length === 0` ⟺ `editions.length === 0`. For the grid, keep the exact `.editions-grid` / `.editions-grid__group` structure with `data-size={group.length}` and `data-side={g % 2 === 0 ? 'left' : 'right'}`; for each tile map with idx: `class:list={['tile', idx === 0 ? 'tile--hero' : 'tile--small']}`, `href={tile.href}`, `<img src={tile.imgSrc} srcset={tile.imgSrcset} sizes={idx === 0 ? '(max-width: 800px) 100vw, 58vw' : '(max-width: 800px) 100vw, 40vw'} alt={tile.alt} loading="lazy" decoding="async" />`, the `.tile__scrim`, `.tile__body` with `{tile.title}` and `{tile.statement}`, and the sr-only `{viewEditionLabel}`. Keep the `sizes` literals in the component (identical across locales).

Rewrite `src/pages/editions/index.astro`: keep `locale = 'fr'` and `const editions = await getEditions();`. Replace the `editionGroups` chunking with a per-edition resolve into tiles: `const tiles = editions.map((edition) => ({ href: getRelativeLocaleUrl(locale, `editions/${edition.slug}`), imgSrc: thumbnailUrl(edition.leadPhoto, 600), imgSrcset: responsiveThumbnailSrcSet(edition.leadPhoto), alt: edition.leadPhoto.alt?.[locale] ?? '', title: edition.title, statement: edition.statement?.[locale] ?? '' }));`. Keep the `seoTitle`/`seoDescription` consts unchanged. Import `EditionsOverviewBody from '../../components/EditionsOverviewBody.astro'`. Replace the template with `<BaseLayout title={seoTitle} description={seoDescription}><EditionsOverviewBody heading={"Éditions"} tiles={tiles} emptyHeading={"Éditions à venir"} emptyBody={"De nouvelles éditions seront bientôt visibles ici. Revenez prochainement."} viewEditionLabel={" — Voir l'édition"} /></BaseLayout>`. Delete the route `<style>` block. Remove now-unused imports (`EmptyState`, and the `import type { Edition }` used only for the old `Edition[][]` typing); keep `getRelativeLocaleUrl`, `thumbnailUrl`, `responsiveThumbnailSrcSet`, `getEditions`.

Rewrite `src/pages/en/editions/index.astro` identically with EN values: `locale = 'en'`, tiles resolved with `.en` (unchanged pattern), EN `seoTitle`/`seoDescription` unchanged; import depth `../../../components/EditionsOverviewBody.astro`; props `heading={"Editions"}`, `emptyHeading={"Editions coming soon"}`, `emptyBody={"New editions will appear here shortly. Check back soon."}`, `viewEditionLabel={" — View edition"}`. Delete the route `<style>` block; remove the unused `EmptyState` and `import type { Edition }`.

Preserve exactly: the leading spaces/em-dashes in the sr-only view labels, the empty-state variant="bold", and the group order (never re-sort/re-rank).
  </action>
  <verify>
    <automated>npm run typecheck && npm run build</automated>
  </verify>
  <done>`/editions/` and `/en/editions/` build; the poster grid (grouped-by-3, alternating side, hero/small tiles) and the empty-state fallback render identically per locale; grouping order is preserved; both routes drop the `EmptyState`/`Edition` imports and the page `<style>` block. Targeted `tests/e2e/edition.spec.ts` (overview coverage) is exercised in Task 6.</done>
</task>

<task type="auto">
  <name>Task 6: Full-suite regression verification against the 252-test baseline + untouched-files check</name>
  <files>(no source changes — verification only)</files>
  <action>
Run the complete verification gate proving zero behavior change across all 5 extracted pairs. Run `npm run typecheck && npm run test:coverage && npm run build && npx playwright test` (Playwright's webServer runs `npm run preview` over the freshly built `dist/`, so the build must precede it — the combined command orders this correctly). Confirm the full suite matches the current baseline of 252 tests with identical pass/skip outcomes; no test file is expected to have changed. The e2e run must include `about.spec.ts`, `contact.spec.ts`, `edition.spec.ts`, `gallery.spec.ts`, `seo.spec.ts`, `accessibility.spec.ts`, and `i18n.spec.ts` all green.

Also confirm the explicitly-excluded files are byte-unchanged: run `git status --short -- src/pages/mentions-legales.astro src/pages/en/mentions-legales.astro src/pages/confidentialite.astro src/pages/en/confidentialite.astro src/pages/index.astro src/pages/en/index.astro` and verify it prints NOTHING (no modifications to any legal or homepage route).

If any test count, pass/skip outcome, or excluded-file status deviates from baseline, do NOT paper over it — surface the specific diff and fix the responsible extraction task before completing.
  </action>
  <verify>
    <automated>npm run typecheck && npm run test:coverage && npm run build && npx playwright test</automated>
  </verify>
  <done>typecheck clean; vitest coverage green; build succeeds for all routes/both locales; `npx playwright test` reports the same 252-test baseline with identical pass/skip and all listed specs green; `git status --short` shows the six excluded route files unmodified.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Pure internal refactor: no new external input, no new network surface, no new dependency, no new request-time code. Components render at build time exactly like the current route frontmatter. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260727the-01 | Information disclosure | SEO/structured-data drift (seoTitle/description/socialImage/noIndex/structuredData, hreflang/canonical) | medium | mitigate | Keep every BaseLayout-consumed prop in the route-level `<BaseLayout>` call unchanged; `tests/e2e/seo.spec.ts` + `i18n.spec.ts` run in Task 6 to catch any regression. |
| T-260727the-02 | Tampering | Accidental behavioral drift during markup/style move (locale string swap, escaping, guard-condition change) | medium | mitigate | Byte-identical style-block move; explicit prop-vs-literal rule; ampersand escaping called out; guard-equivalence proven per task; full 252-test baseline gate in Task 6. |
| T-260727the-03 | Denial of service | Build breakage on a partially-populated Sanity doc | low | accept | No change to existing WR-03/D-02 nullish guards — they stay in route frontmatter exactly as today; `npm run build` per task confirms both locale routes still generate. |

No package-manager installs occur in this plan, so no supply-chain (T-…-SC) checkpoint is required.
</threat_model>

<verification>
Per-pair (Tasks 1–5): `npm run typecheck && npm run build` must pass — proves types are sound and BOTH locale routes for the pair still generate.

Full regression (Task 6): `npm run typecheck && npm run test:coverage && npm run build && npx playwright test` must match the current 252-test baseline with identical pass/skip, all of `about`/`contact`/`edition`/`gallery`/`seo`/`accessibility`/`i18n` specs green.

Structural: each pair's `<style>` block exists ONCE (in the new component); neither route file of a pair keeps a page `<style>` block; `getStaticPaths` remains in the 4 `[slug]` route files with no reintroduced Props interface; the 6 excluded route files (mentions-legales/confidentialite/index, both locales) are byte-unchanged per `git status --short`.
</verification>

<success_criteria>
- 5 shared body components exist under `src/components/` (AboutPageBody, ContactPageBody, EditionDetailBody, GalleryDetailBody, EditionsOverviewBody), each holding all shared markup + the single copy of its pair's style block.
- 10 route files reduced to thin frontmatter (own fetch + `.fr`/`.en` resolution + fallbacks) plus a single `<BaseLayout><…Body {...resolvedProps} /></BaseLayout>` template; locale-specific visible text passed as explicit props; no new i18n dictionary introduced.
- Zero visual/behavioral change: full suite matches the 252-test baseline with identical pass/skip.
- `mentions-legales`, `confidentialite`, and `index` (both locales) untouched.
- SEO/structured-data/hreflang behavior preserved (BaseLayout props unchanged at route level).
</success_criteria>

<output>
Create `.planning/quick/260727-the-extract-shared-fr-en-page-body-component/260727-the-SUMMARY.md` when done.
</output>
