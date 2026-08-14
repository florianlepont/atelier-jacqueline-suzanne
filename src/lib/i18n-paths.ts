import { getRelativeLocaleUrl } from 'astro:i18n';

/**
 * Shared-slug switcher utility (D-04).
 *
 * Astro's built-in i18n routing does not know how to find "the equivalent
 * page in the other locale" for you — it only builds a URL for a locale +
 * path string you supply (RESEARCH.md Pattern 2 / Pitfall 1). This function
 * recovers the shared slug from the current pathname (stripping any locale
 * prefix) and re-applies it under the target locale via
 * `getRelativeLocaleUrl()`.
 */
/**
 * Strips Astro's configured `base` (e.g. "/ajs-website/" on GitHub Pages)
 * from a pathname. Extracted as a pure, standalone function (WR-04) so it
 * can be unit-tested directly under a non-root base without needing to
 * fight Vite's static replacement of `import.meta.env.BASE_URL` inside a
 * test run — this is the exact logic missing before CR-01/the base-path
 * fixes, isolated so that class of bug has a real regression test.
 */
export function stripBasePath(path: string, base: string): string {
  return base !== '/' && path.startsWith(base) ? path.slice(base.length - 1) : path;
}

/**
 * Astro's configured base with any trailing slash removed (e.g.
 * "/ajs-website" on GitHub Pages, "" at the real domain root) — the shape
 * every asset/link path prefix on this site needs, since they all start
 * their own leading "/". Extracted here (rather than each call site
 * re-deriving it) after this exact one-line expression had been copied
 * identically into HomeCarousel.astro, BaseLayout.astro, HomePage.astro, and
 * 404.astro.
 */
export function getAssetBase(): string {
  return (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
}

export function getSwitcherHref(currentPath: string, targetLocale: 'fr' | 'en'): string {
  // Strip Astro's configured `base` before computing the slug:
  // `Astro.url.pathname` reflects the deployed base-prefixed path, but
  // `getRelativeLocaleUrl()` below re-applies the base itself — without
  // stripping it first, a non-root base produces a doubled path (e.g.
  // "/ajs-website/ajs-website"). No-op when base is "/".
  const base = import.meta.env.BASE_URL ?? '/';
  const baseRelativePath = stripBasePath(currentPath, base);

  // Strip the current locale prefix (if any) and any trailing slash to
  // recover the shared slug.
  const slug = baseRelativePath.replace(/^\/en\//, '/').replace(/^\//, '').replace(/\/$/, '');

  // Missing-counterpart fallback (D-04): if the current page has no
  // published translation in the target locale, send the visitor to that
  // locale's homepage instead of emitting a broken/404 link. Every real
  // content page has both locales today (see hasTranslatedCounterpart's own
  // doc comment) — this fallback exists for the 404 page and for any future
  // content type that's deliberately allowed to ship in a single locale.
  const targetSlug = hasTranslatedCounterpart(slug, targetLocale) ? slug : '';
  const relative = getRelativeLocaleUrl(targetLocale, targetSlug);

  // Normalize the trailing slash independent of the project's configured
  // `trailingSlash`/`build.format` settings: the locale homepage always ends
  // in "/", every other page never does.
  if (targetSlug === '') {
    return relative.endsWith('/') ? relative : `${relative}/`;
  }
  const normalized = relative.replace(/\/$/, '');
  return normalized === '' ? '/' : normalized;
}

/**
 * Existence check for the language switcher. Always `true` for real content:
 * every Sanity document type (gallery, edition, about/contact/editions-page,
 * siteSettings) requires both `fr` and `en` for its localized fields — the
 * content model itself makes a page existing in only one locale impossible,
 * not a phase-specific placeholder. Revisit only if a future content type
 * is deliberately allowed to ship in a single locale.
 *
 * WR-06 exception: the 404 page is not real content with a per-locale
 * counterpart route — naively swapping its "404" slug produces a nonsensical
 * dead-end link (e.g. "/en/404"). Falling back to `false` here routes the
 * switcher to each locale's homepage instead, via the existing
 * missing-counterpart fallback above.
 */
function hasTranslatedCounterpart(slug: string, _targetLocale: 'fr' | 'en'): boolean {
  if (slug === '404') return false;
  return true;
}
