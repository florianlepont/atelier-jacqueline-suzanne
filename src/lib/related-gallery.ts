import { getRelativeLocaleUrl } from 'astro:i18n';

/**
 * EDN-08: pure, locale-aware helper that turns an édition's optional
 * `relatedGallery` dereference into a renderable cross-link, or `null` when
 * there is nothing to show.
 *
 * Mirrors the style of src/lib/i18n-paths.ts — a pure function importing
 * `getRelativeLocaleUrl` from `astro:i18n` so Astro's configured `base`
 * (e.g. `/ajs-website/` on GitHub Pages) is applied automatically, which is
 * what keeps this href passing CI's un-prefixed-link grep guard.
 */

export interface RelatedGalleryLink {
  href: string;
  text: string;
}

type RelatedGallery = { title: string; slug: string } | null | undefined;

/**
 * Returns `null` when `relatedGallery` is null/undefined, or when its
 * `title`/`slug` is missing or empty — this is deliberately defensive: a
 * reference to an unpublished/archived gallery can dereference to partial
 * data under the `published` perspective, and rendering nothing is correct
 * (never a broken link).
 */
export function getRelatedGalleryLink(
  relatedGallery: RelatedGallery,
  locale: 'fr' | 'en',
): RelatedGalleryLink | null {
  if (!relatedGallery) return null;

  const { title, slug } = relatedGallery;
  if (!title?.trim() || !slug?.trim()) return null;

  const href = getRelativeLocaleUrl(locale, `galleries/${slug}`);
  const text =
    locale === 'fr'
      ? `À voir aussi : la collection « ${title} »`
      : `Also see: the “${title}” collection`;

  return { href, text };
}
