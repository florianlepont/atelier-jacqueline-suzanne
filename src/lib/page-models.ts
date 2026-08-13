import type {Gallery, Edition} from './sanity';
import {fullSizeUrl, responsiveImageSrcSet} from './image';
import {pickHeroIndex} from './image-orientation';
import {getHeroTextColor, normalizeHeroColor} from './site-config';
import {getRelatedGalleryLink} from './related-gallery';
import type {RelatedGalleryLink} from './related-gallery';
import {getRelativeLocaleUrl} from 'astro:i18n';
import type {GalleryGridItem} from '../components/GalleryGrid.astro';

type Locale = 'fr' | 'en';

const HERO_LABEL: Record<Locale, (position: number, total: number) => string> = {
  fr: (position, total) => `Voir en taille réelle, image ${position} sur ${total}`,
  en: (position, total) => `View full size, image ${position} of ${total}`,
};

const SCROLL_HINT_LABEL: Record<Locale, string> = {
  fr: 'Faire défiler',
  en: 'Scroll',
};

function buildGridItems(
  images: Gallery['images'],
  heroIndex: number,
  total: number,
  locale: Locale,
  localizedAlt: boolean,
): GalleryGridItem[] {
  return images
    .map((img, index) => ({img, index}))
    .filter((pair) => pair.index !== heroIndex)
    .map(({img, index}) => {
      const {width, height} = img.dimensions ?? {};
      const aspectRatio = width && height && height > 0 ? width / height : 1;
      return {
        index,
        src: fullSizeUrl(img, 600),
        srcset: responsiveImageSrcSet(img, [320, 480, 600, 900]),
        // Empty for galleries (decorative — the real alt lives on the
        // separate hero); localized for éditions (these thumbs are not
        // decorative there) — mirrors GalleryGridItem's own doc comment.
        alt: localizedAlt ? img.alt?.[locale] ?? '' : '',
        ariaLabel: HERO_LABEL[locale](index + 1, total),
        aspectRatio,
      };
    });
}

export interface GalleryDetailStructuredData {
  '@context': 'https://schema.org';
  '@type': 'ImageGallery';
  name: string;
  description: string;
  url: string;
  inLanguage: Locale;
  creator: {'@type': 'Person'; name: string};
  image: Array<{
    '@type': 'ImageObject';
    contentUrl: string;
    caption: string;
    creditText: string;
    copyrightNotice: string;
  }>;
}

export interface GalleryDetailModel {
  heroIndex: number;
  heroSrc: string;
  leadPhotoSrcSet: string;
  heroAlt: string;
  heroAriaLabel: string;
  scrollHintLabel: string;
  carouselReturnHref: string;
  statement: string;
  seoTitle: string;
  seoDescription: string;
  socialImage: string;
  noIndex: boolean | undefined;
  accent: string;
  accentText: '#1A1A1A' | '#FFFFFF';
  gridItems: GalleryGridItem[];
  structuredData: GalleryDetailStructuredData;
  total: number;
}

/**
 * Pure gallery-document + locale -> render-model transform. No fetch, no
 * browser import: `pageUrl` (Astro.url.toString(), request-derived) is
 * passed in rather than computed here. `getRelativeLocaleUrl` is Astro's
 * own build-time-only virtual module (already used this way in
 * src/lib/related-gallery.ts), not a browser API, so it stays safe to call
 * from a plain, unit-testable function. Mirrors the fallbacks previously
 * duplicated in src/pages/galleries/[slug].astro and
 * src/pages/en/galleries/[slug].astro (quick-260811-kog-04).
 */
export function buildGalleryDetailModel({
  gallery,
  locale,
  pageUrl,
}: {
  gallery: Gallery;
  locale: Locale;
  pageUrl: string;
}): GalleryDetailModel {
  // WR-03: statement is Studio-required (fr/en) per 02-01's schema
  // validation, but a document written outside the Studio's publish-time
  // validation could still be partially populated mid-edit.
  const statement = gallery.statement?.[locale] ?? '';
  const total = gallery.images.length;

  // quick-260724-oep: prefer the first LANDSCAPE image as the hero (a
  // landscape source photo crops less aggressively than a portrait one in
  // a wide object-fit: cover hero box), falling back to images[0] when no
  // image is landscape.
  const heroIndex = pickHeroIndex(gallery.images);
  const heroImage = gallery.images[heroIndex];
  const heroSrc = fullSizeUrl(heroImage, 2000);
  const leadPhotoSrcSet = responsiveImageSrcSet(heroImage);
  const heroAlt = heroImage.alt?.[locale] ?? '';
  const heroAriaLabel = HERO_LABEL[locale](heroIndex + 1, total);
  const scrollHintLabel = SCROLL_HINT_LABEL[locale];
  const carouselReturnHref = `${getRelativeLocaleUrl(locale, '')}?carousel=${gallery.slug}`;

  const seoTitle = gallery.seo?.title?.[locale] ?? `${gallery.title} — Atelier Jacqueline Suzanne`;
  const seoDescription = gallery.seo?.description?.[locale] ?? statement;
  const socialImage = fullSizeUrl(gallery.seo?.image ?? heroImage, 1200);
  const accent = normalizeHeroColor(gallery.heroColor) ?? '#A6FD29';
  const accentText = getHeroTextColor(accent);

  const gridItems = buildGridItems(gallery.images, heroIndex, total, locale, false);

  const structuredData: GalleryDetailStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: gallery.title,
    description: seoDescription,
    url: pageUrl,
    inLanguage: locale,
    creator: {'@type': 'Person', name: 'Romane Lepont'},
    image: gallery.images.map((image) => ({
      '@type': 'ImageObject',
      contentUrl: fullSizeUrl(image, 2000),
      caption: image.alt?.[locale] ?? '',
      creditText: image.rights?.credit ?? 'Romane Lepont',
      copyrightNotice: image.rights?.copyrightNotice ?? '© Romane Lepont — Tous droits réservés',
    })),
  };

  return {
    heroIndex,
    heroSrc,
    leadPhotoSrcSet,
    heroAlt,
    heroAriaLabel,
    scrollHintLabel,
    carouselReturnHref,
    statement,
    seoTitle,
    seoDescription,
    socialImage,
    noIndex: gallery.seo?.noIndex,
    accent,
    accentText,
    gridItems,
    structuredData,
    total,
  };
}

export interface EditionDetailModel {
  overviewHref: string;
  statement: string;
  heroIndex: number;
  leadPhotoSrc: string;
  leadPhotoSrcSet: string;
  leadPhotoAlt: string;
  seoTitle: string;
  seoDescription: string;
  socialImage: string;
  total: number;
  formatText: string;
  heroAriaLabel: string;
  heroCaption: string;
  scrollHintLabel: string;
  relatedLink: RelatedGalleryLink | null;
  gridItems: GalleryGridItem[];
}

const HERO_CAPTION: Record<Locale, string> = {
  fr: 'Édition imprimée',
  en: 'Printed edition',
};

const FORMAT_TEXT: Record<Locale, (pageCount: string, printRun: string, dimensionsText: string) => string> = {
  fr: (pageCount, printRun, dimensionsText) =>
    `Pages : ${pageCount} · Tirage : ${printRun} exemplaires · Dimensions : ${dimensionsText}`,
  en: (pageCount, printRun, dimensionsText) =>
    `Pages: ${pageCount} · Print run: ${printRun} copies · Dimensions: ${dimensionsText}`,
};

/**
 * Pure édition-document + locale -> render-model transform. Same no-fetch/
 * no-browser-import contract as buildGalleryDetailModel(). Édition has NO
 * `seo` field/group (confirmed absent from sanity/schemas/edition.ts) — SEO
 * is built directly from title/statement/the hero image, matching what
 * src/pages/editions/[slug].astro and src/pages/en/editions/[slug].astro
 * did inline before extraction. Do not add a `seo` read here.
 */
export function buildEditionDetailModel({
  edition,
  locale,
  pageUrl: _pageUrl,
}: {
  edition: Edition;
  locale: Locale;
  // Accepted for symmetry with buildGalleryDetailModel and future SEO
  // structured-data additions, but unused today: édition detail pages emit
  // no structuredData prop to BaseLayout (a pre-existing gap in both fr/en
  // route files, predating this extraction and out of this plan's scope).
  pageUrl?: string;
}): EditionDetailModel {
  const overviewHref = getRelativeLocaleUrl(locale, 'editions');
  const statement = edition.statement?.[locale] ?? '';

  // D-02: nullish-guarded so a partially-populated édition (images missing)
  // cannot throw during getStaticPaths SSG. In practice sanitizeEdition()
  // (src/lib/sanity-validation.ts, quick-260811-kog-03) already rejects any
  // document with images.length === 0 before it reaches getStaticPaths, so
  // heroImage is always defined for a real, validated édition today — but
  // this model must stay null-safe (quick-260811-kog-04's own requirement)
  // rather than depend on that upstream guarantee never changing.
  const images = edition.images ?? [];
  const heroIndex = pickHeroIndex(images);
  const heroImage = images[heroIndex];
  const leadPhotoSrc = heroImage ? fullSizeUrl(heroImage, 2000) : '';
  const leadPhotoSrcSet = heroImage ? responsiveImageSrcSet(heroImage) : '';
  const leadPhotoAlt = heroImage?.alt?.[locale] ?? '';

  const seoTitle = `${edition.title} — Atelier Jacqueline Suzanne`;
  const seoDescription = statement;
  const socialImage = heroImage ? fullSizeUrl(heroImage, 1200) : '';

  const total = images.length;

  const dimensionsText = `${edition.dimensions?.width ?? ''} × ${edition.dimensions?.height ?? ''} ${edition.dimensions?.unit ?? ''}`;
  const formatText = FORMAT_TEXT[locale](
    String(edition.pageCount ?? ''),
    String(edition.printRun ?? ''),
    dimensionsText,
  );

  const heroAriaLabel = HERO_LABEL[locale](heroIndex + 1, total);
  const heroCaption = HERO_CAPTION[locale];
  const scrollHintLabel = SCROLL_HINT_LABEL[locale];

  const relatedLink = getRelatedGalleryLink(edition.relatedGallery, locale);

  const gridItems = buildGridItems(images, heroIndex, total, locale, true);

  return {
    overviewHref,
    statement,
    heroIndex,
    leadPhotoSrc,
    leadPhotoSrcSet,
    leadPhotoAlt,
    seoTitle,
    seoDescription,
    socialImage,
    total,
    formatText,
    heroAriaLabel,
    heroCaption,
    scrollHintLabel,
    relatedLink,
    gridItems,
  };
}
