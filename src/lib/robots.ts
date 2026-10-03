// Robots meta resolution for the shared layout.
//
// Staging detection is based on the build base path ONLY, on purpose:
// - The GitHub Pages deploy build is the only build with a non-root
//   ASTRO_BASE (/atelier-jacqueline-suzanne/). That mirror must stay out of
//   search results so it never competes with the real domain as duplicate
//   content.
// - Production always builds at the root base, even if SITE_URL were ever
//   omitted, so production can never be flipped to noindex by accident.
// - The CI test build, local preview and the SEO e2e spec use the root base
//   with the default github.io `site`, and tests/e2e/seo.spec.ts asserts
//   `index, follow` on that build. A rule keyed on the site URL would turn
//   that e2e gate red.

const NOINDEX_CONTENT = 'noindex, nofollow';
const INDEXABLE_CONTENT = 'index, follow, max-image-preview:large';

/** A base is "staging" when, after trimming slashes, it is non-empty. */
export function isStagingBase(base: string): boolean {
  return base.replace(/^\/+|\/+$/g, '') !== '';
}

export function resolveRobotsContent(options: { noIndex: boolean; base: string }): string {
  if (options.noIndex || isStagingBase(options.base)) {
    return NOINDEX_CONTENT;
  }
  return INDEXABLE_CONTENT;
}
