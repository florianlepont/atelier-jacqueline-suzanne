import type { Page } from '@playwright/test';

// Quick task 260825-et3: a routine Sanity Studio publish (add, remove,
// rename, or reorder a gallery or an édition) must never fail CI. These
// helpers derive real content routes from the site's own rendered output
// instead of any spec embedding a slug literal.
//
// Fetched via `page.request.get()` against the listing page's raw HTML
// rather than `page.goto()` + locators, for three reasons that all matter
// to callers:
//   1. No side effect on the caller's page state — a helper call can sit
//      mid-test without disturbing whatever the test already navigated to.
//   2. Does not depend on which homepage runtime mounted, so it works
//      identically under both the `chromium` and `webkit-mobile` Playwright
//      projects (the gallery grid markup is always present in the
//      server-rendered HTML — HomeCarousel.astro renders it with a `hidden`
//      attribute when the carousel is the active display mode, not
//      conditionally omitted).
//   3. Does not require toggling the homepage into grid mode first.
//
// Hrefs are returned exactly as they appear in the markup (including any
// `ASTRO_BASE` prefix such as `/atelier-jacqueline-suzanne/`) so callers can hand them
// straight to `page.goto()`.

export type ContentLocale = 'fr' | 'en';

type ContentSegment = 'galleries' | 'editions';

function listingPath(segment: ContentSegment, locale: ContentLocale): string {
  if (segment === 'galleries') {
    return locale === 'en' ? '/en/' : '/';
  }
  return locale === 'en' ? '/en/editions/' : '/editions/';
}

// Anchors real slugs at the END of the href (never mid-path) so this can't
// accidentally match an unrelated link that merely mentions "galleries" or
// "editions" earlier in its path. The English variant requires an explicit
// `/en/` segment directly before the content segment; the French variant
// rejects anything with that same `/en` immediately before it, so a French
// call never returns an English route (and vice versa) regardless of
// whichever ASTRO_BASE prefix precedes it.
function localePattern(segment: ContentSegment, locale: ContentLocale): RegExp {
  return locale === 'en'
    ? new RegExp(`/en/${segment}/[^/"]+/?$`)
    : new RegExp(`(?<!/en)/${segment}/[^/"]+/?$`);
}

async function extractHrefs(page: Page, segment: ContentSegment, locale: ContentLocale): Promise<string[]> {
  const response = await page.request.get(listingPath(segment, locale));
  const html = await response.text();
  const pattern = localePattern(segment, locale);

  const seen = new Set<string>();
  const hrefs: string[] = [];
  const hrefAttrRegex = /href="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = hrefAttrRegex.exec(html)) !== null) {
    const href = match[1];
    if (!pattern.test(href)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    hrefs.push(href);
  }
  return hrefs;
}

/** Every gallery detail href rendered for the requested locale, in document order, deduped. */
export async function galleryHrefs(page: Page, locale: ContentLocale): Promise<string[]> {
  return extractHrefs(page, 'galleries', locale);
}

/** The first gallery detail href for the requested locale. Throws if none exist. */
export async function firstGalleryHref(page: Page, locale: ContentLocale): Promise<string> {
  const hrefs = await galleryHrefs(page, locale);
  if (hrefs.length === 0) {
    throw new Error(
      `No published gallery detail hrefs found for locale "${locale}" — is at least one gallery published?`,
    );
  }
  return hrefs[0];
}

/** Every édition detail href rendered for the requested locale, in document order, deduped. */
export async function editionHrefs(page: Page, locale: ContentLocale): Promise<string[]> {
  return extractHrefs(page, 'editions', locale);
}

/** The first édition detail href for the requested locale. Throws if none exist. */
export async function firstEditionHref(page: Page, locale: ContentLocale): Promise<string> {
  const hrefs = await editionHrefs(page, locale);
  if (hrefs.length === 0) {
    throw new Error(
      `No published édition detail hrefs found for locale "${locale}" — is at least one édition published?`,
    );
  }
  return hrefs[0];
}
