import { getRelativeLocaleUrl } from 'astro:i18n';

/**
 * EDN-12: pure, locale-aware helper that turns a gallery's optional
 * `relatedEdition` dereference into a renderable cross-link, or `null` when
 * there is nothing to show.
 *
 * This is the reverse direction of `src/lib/related-gallery.ts`'s EDN-08
 * helper (édition -> gallery). It ships as a NEW, parallel file rather than
 * a generalization of `related-gallery.ts` -- the shipped forward helper and
 * its exported `RelatedGalleryLink` type stay byte-identical, since any
 * change to that already-shipped, already-tested code is explicitly out of
 * scope (see `.planning/REQUIREMENTS.md` "Out of Scope" and this plan's
 * `<discretion_resolutions>`).
 *
 * Mirrors the style of src/lib/i18n-paths.ts — a pure function importing
 * `getRelativeLocaleUrl` from `astro:i18n` so Astro's configured `base`
 * (e.g. `/atelier-jacqueline-suzanne/` on GitHub Pages) is applied automatically, which is
 * what keeps this href passing CI's un-prefixed-link grep guard.
 *
 * Defensive-null contract (D-02): a reference to an unpublished or archived
 * édition can dereference to partial data under Sanity's published
 * perspective — rendering nothing in that case is correct, never a
 * broken/dead-end link.
 */

export interface RelatedEditionLink {
  href: string;
  text: string;
}

type RelatedEdition = { title: string; slug: string } | null | undefined;

/**
 * Returns `null` when `relatedEdition` is null/undefined, or when its
 * `title`/`slug` is missing or empty.
 */
export function getRelatedEditionLink(
  relatedEdition: RelatedEdition,
  locale: 'fr' | 'en',
): RelatedEditionLink | null {
  if (!relatedEdition) return null;

  const { title, slug } = relatedEdition;
  if (!title?.trim() || !slug?.trim()) return null;

  const href = getRelativeLocaleUrl(locale, `editions/${slug}`);
  const text =
    locale === 'fr'
      ? `Voir l'édition « ${title} »`
      : `View the “${title}” edition`;

  return { href, text };
}
