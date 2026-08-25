import type {AboutPage, ContactPage, Edition, EditionsPage, Gallery, SiteSettings} from './sanity';
import {fullSizeUrl, previewPanelUrl, responsiveImageSrcSet, responsiveThumbnailSrcSet} from './image';
import {pickHeroIndex} from './image-orientation';
import {
  getHeroTextColor,
  normalizeHeroColor,
  resolveAutomaticAccent,
  resolveEditionsIntro,
  resolveSiteCopy,
} from './site-config';
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
  // 260825-hl7 (bug 2): widened from the '#1A1A1A' | '#FFFFFF' union — the
  // automatic-accent path (D-2) now supplies a CSS custom-property
  // reference string (e.g. 'var(--color-ink)'), not always one of those two
  // resolved hex literals. The explicit-heroColor path still only ever
  // produces those two exact values via getHeroTextColor().
  accentText: string;
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
  homeIndex,
}: {
  gallery: Gallery;
  locale: Locale;
  pageUrl: string;
  // 260825-hl7 (bug 2, D-3): REQUIRED, not optional-with-default. A default
  // would let a missing locale-route wiring silently degrade to palette
  // entry 0 with no signal; required makes `npm run typecheck` fail loudly
  // if either galleries/[slug].astro twin is not updated to supply it. Pass
  // the gallery's 0-based homepage-visible position (getHomeGalleryIndex),
  // or -1 if the gallery isn't homepage-visible.
  homeIndex: number;
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
  // 260825-hl7 (bug 2, D-2): an explicit heroColor wins and keeps
  // getHeroTextColor() for its paired text color (unchanged behavior). A
  // gallery left on "Palette automatique" (heroColor unset) now resolves
  // from the SAME shared AUTOMATIC_ACCENTS palette the homepage carousel
  // uses, indexed by this gallery's own homepage position — the automatic
  // path deliberately does NOT route through getHeroTextColor(), since its
  // input can be an unresolvable var(...) reference string; each palette
  // entry already carries its own correct paired text color.
  const explicitAccent = normalizeHeroColor(gallery.heroColor);
  const accent: string = explicitAccent ?? resolveAutomaticAccent(homeIndex >= 0 ? homeIndex : 0).bg;
  const accentText: string = explicitAccent
    ? getHeroTextColor(explicitAccent)
    : resolveAutomaticAccent(homeIndex >= 0 ? homeIndex : 0).text;

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

export interface AboutPageStructuredData {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle: string;
  description: string;
  url: string;
  sameAs: string[];
}

export interface AboutPageModel {
  heading: string;
  studioPracticeHeading: string;
  mediumTechniqueHeading: string;
  biography: string;
  practice: string;
  medium: string;
  portraitImage: AboutPage['image'];
  portraitAlt: string;
  exhibitionImage: AboutPage['exhibitionImage'];
  exhibitionAlt: string;
  seoTitle: string;
  seoDescription: string;
  socialImage: string | undefined;
  noIndex: boolean | undefined;
  structuredData: AboutPageStructuredData;
}

const ABOUT_LABELS: Record<
  Locale,
  {heading: string; studioPracticeHeading: string; mediumTechniqueHeading: string; jobTitle: string}
> = {
  fr: {
    heading: 'À propos',
    studioPracticeHeading: 'Atelier & pratique',
    mediumTechniqueHeading: 'Médium & technique',
    jobTitle: 'Photographe',
  },
  en: {
    heading: 'About',
    studioPracticeHeading: 'Studio & practice',
    mediumTechniqueHeading: 'Medium & technique',
    jobTitle: 'Photographer',
  },
};

const ABOUT_FALLBACKS: Record<Locale, {biography: string; practice: string; medium: string; seoTitle: string}> = {
  fr: {
    biography: 'Le texte de présentation de Romane sera bientôt disponible ici.',
    practice: "Informations sur l'atelier et la pratique de Romane à venir prochainement.",
    medium: 'Précisions sur le médium et la technique à venir.',
    seoTitle: 'À propos — Atelier Jacqueline Suzanne',
  },
  en: {
    biography: "Romane's biography will be available here soon.",
    practice: "Information about Romane's studio and practice is coming soon.",
    medium: 'Details on medium and technique are coming soon.',
    seoTitle: 'About — Atelier Jacqueline Suzanne',
  },
};

/**
 * Pure fr/en → render-model transform for the About page. Same no-fetch/
 * no-browser-import contract as buildHomePageModel(): `pageUrl` is passed in
 * rather than computed here. Mirrors the fallbacks/labels previously
 * duplicated in src/pages/about.astro and src/pages/en/about.astro.
 */
export function buildAboutPageModel({
  about,
  siteSettings,
  locale,
  pageUrl,
}: {
  about: AboutPage | null;
  siteSettings: SiteSettings | null;
  locale: Locale;
  pageUrl: string;
}): AboutPageModel {
  const labels = ABOUT_LABELS[locale];
  const fallback = ABOUT_FALLBACKS[locale];
  const biography = about?.biography?.[locale] ?? fallback.biography;
  const practice = about?.practice?.[locale] ?? fallback.practice;
  const medium = about?.medium?.[locale] ?? fallback.medium;
  const seoTitle = about?.seo?.title?.[locale] ?? fallback.seoTitle;
  const seoDescription = about?.seo?.description?.[locale] ?? biography;
  const socialImage = about?.seo?.image ? fullSizeUrl(about.seo.image, 1200) : undefined;
  const portraitImage = about?.image;
  const exhibitionImage = about?.exhibitionImage;
  const siteCopy = resolveSiteCopy(siteSettings, locale);

  return {
    heading: labels.heading,
    studioPracticeHeading: labels.studioPracticeHeading,
    mediumTechniqueHeading: labels.mediumTechniqueHeading,
    biography,
    practice,
    medium,
    portraitImage,
    portraitAlt: portraitImage?.alt?.[locale] ?? '',
    exhibitionImage,
    exhibitionAlt: exhibitionImage?.alt?.[locale] ?? '',
    seoTitle,
    seoDescription,
    socialImage,
    noIndex: about?.seo?.noIndex,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Romane Lepont',
      jobTitle: labels.jobTitle,
      description: biography,
      url: pageUrl,
      sameAs: [siteCopy.instagramUrl],
    },
  };
}

export interface ContactLinkModel {
  url: string;
  label: string;
}

export interface ContactPageStructuredData {
  '@context': 'https://schema.org';
  '@type': 'ContactPage';
  name: 'Contact';
  description: string;
  mainEntity: {'@type': 'Person'; name: string; email: string};
}

export interface ContactPageModel {
  intro: string;
  publicEmail: string;
  location: string | undefined;
  availability: string | undefined;
  instagramLink: ContactLinkModel | null;
  otherLinks: ContactLinkModel[];
  seoTitle: string;
  seoDescription: string;
  socialImage: string | undefined;
  noIndex: boolean | undefined;
  emailLabel: string;
  formHeading: string;
  formSubheading: string;
  newTabHint: string;
  structuredData: ContactPageStructuredData;
}

const DEFAULT_PUBLIC_EMAIL = 'contact@atelierjacquelinesuzanne.fr';

const CONTACT_LABELS: Record<
  Locale,
  {intro: string; seoTitle: string; emailLabel: string; formHeading: string; formSubheading: string; newTabHint: string}
> = {
  fr: {
    intro: 'Une question, une envie de collaboration ? Écrivez-moi.',
    seoTitle: 'Contact — Atelier Jacqueline Suzanne',
    emailLabel: 'E-mail',
    formHeading: 'Écrivez-moi',
    formSubheading: 'Je vous répondrai dès que possible.',
    newTabHint: ' (nouvelle fenêtre)',
  },
  en: {
    intro: 'A question, or an idea for a collaboration? Get in touch.',
    seoTitle: 'Contact — Atelier Jacqueline Suzanne',
    emailLabel: 'Email',
    formHeading: 'Send a message',
    formSubheading: 'I’ll get back to you as soon as possible.',
    newTabHint: ' (opens in new tab)',
  },
};

/**
 * Pure fr/en → render-model transform for the Contact page. Same no-fetch
 * contract as the other builders here. Mirrors src/pages/contact.astro and
 * src/pages/en/contact.astro's previously-duplicated professional-link
 * filtering (Instagram pulled out as its own slot) and fallbacks.
 */
export function buildContactPageModel({
  contact,
  locale,
}: {
  contact: ContactPage | null;
  locale: Locale;
}): ContactPageModel {
  const fallback = CONTACT_LABELS[locale];
  const intro = contact?.intro?.[locale] ?? fallback.intro;
  const publicEmail = contact?.publicEmail ?? DEFAULT_PUBLIC_EMAIL;
  const location = contact?.location?.[locale];
  const availability = contact?.availability?.[locale];
  const professionalLinks = (contact?.professionalLinks ?? []).filter(
    (link) => link.url && link.label?.[locale],
  );
  const instagramLink = professionalLinks.find((link) => link.url?.includes('instagram.com'));
  const otherProfessionalLinks = professionalLinks.filter((link) => link !== instagramLink);
  const seoTitle = contact?.seo?.title?.[locale] ?? fallback.seoTitle;
  const seoDescription = contact?.seo?.description?.[locale] ?? intro;
  const socialImage = contact?.seo?.image ? fullSizeUrl(contact.seo.image, 1200) : undefined;

  return {
    intro,
    publicEmail,
    location,
    availability,
    instagramLink: instagramLink
      ? {url: instagramLink.url ?? '', label: instagramLink.label?.[locale] ?? ''}
      : null,
    otherLinks: otherProfessionalLinks.map((link) => ({
      url: link.url ?? '',
      label: link.label?.[locale] ?? '',
    })),
    seoTitle,
    seoDescription,
    socialImage,
    noIndex: contact?.seo?.noIndex,
    emailLabel: fallback.emailLabel,
    formHeading: fallback.formHeading,
    formSubheading: fallback.formSubheading,
    newTabHint: fallback.newTabHint,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact',
      description: intro,
      mainEntity: {'@type': 'Person', name: 'Romane Lepont', email: publicEmail},
    },
  };
}

export interface EditionsIndexTile {
  href: string;
  imgSrc: string;
  imgSrcset: string;
  alt: string;
  title: string;
  statement: string;
  format: string;
}

export interface EditionsIndexModel {
  heading: string;
  intro: string;
  tiles: EditionsIndexTile[];
  emptyHeading: string;
  emptyBody: string;
  viewEditionLabel: string;
  seoTitle: string;
  seoDescription: string;
}

const EDITIONS_INDEX_LABELS: Record<
  Locale,
  {
    heading: string;
    emptyHeading: string;
    emptyBody: string;
    viewEditionLabel: string;
    seoTitle: string;
    seoDescription: string;
    formatText: (pageCount: number, printRun: number) => string;
  }
> = {
  fr: {
    heading: 'Éditions',
    emptyHeading: 'Éditions à venir',
    emptyBody: 'De nouvelles éditions seront bientôt visibles ici. Revenez prochainement.',
    viewEditionLabel: " — Voir l'édition",
    seoTitle: 'Éditions — Atelier Jacqueline Suzanne',
    seoDescription:
      "Découvrez les éditions papier de Romane Lepont — zines et livres publiés par l'Atelier Jacqueline Suzanne.",
    formatText: (pageCount, printRun) => `Édition imprimée · ${pageCount} pages · Tirage ${printRun}`,
  },
  en: {
    heading: 'Editions',
    emptyHeading: 'Editions coming soon',
    emptyBody: 'New editions will appear here shortly. Check back soon.',
    viewEditionLabel: ' — View edition',
    seoTitle: 'Editions — Atelier Jacqueline Suzanne',
    seoDescription:
      "Discover Romane Lepont's paper editions — zines and books published by Atelier Jacqueline Suzanne.",
    formatText: (pageCount, printRun) => `Printed edition · ${pageCount} pages · Edition of ${printRun}`,
  },
};

/**
 * Pure fr/en → render-model transform for the Éditions overview page.
 * Mirrors src/pages/editions/index.astro and src/pages/en/editions/index.astro's
 * previously-duplicated tile derivation (quick-260801-kgh: filter out any
 * édition with no photo before deriving its cover via pickHeroIndex).
 */
export function buildEditionsIndexModel({
  editionsPage,
  editions,
  locale,
}: {
  editionsPage: EditionsPage | null;
  editions: Edition[];
  locale: Locale;
}): EditionsIndexModel {
  const labels = EDITIONS_INDEX_LABELS[locale];
  const intro = resolveEditionsIntro(editionsPage, locale);

  const tiles = editions
    .filter((edition) => (edition.images ?? []).length > 0)
    .map((edition) => {
      const cover = edition.images[pickHeroIndex(edition.images)];
      return {
        href: getRelativeLocaleUrl(locale, `editions/${edition.slug}`),
        imgSrc: previewPanelUrl(cover, 680),
        imgSrcset: responsiveThumbnailSrcSet(cover),
        alt: cover.alt?.[locale] ?? '',
        title: edition.title,
        statement: edition.statement?.[locale] ?? '',
        format: labels.formatText(edition.pageCount, edition.printRun),
      };
    });

  return {
    heading: labels.heading,
    intro,
    tiles,
    emptyHeading: labels.emptyHeading,
    emptyBody: labels.emptyBody,
    viewEditionLabel: labels.viewEditionLabel,
    seoTitle: labels.seoTitle,
    seoDescription: labels.seoDescription,
  };
}
