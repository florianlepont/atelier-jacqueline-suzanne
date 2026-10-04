/**
 * Appends the visitor's current query string and fragment to the language
 * switcher link. The link itself is generated at build time, so it only knows
 * the path; the browser knows the rest. Empty parts leave the href untouched,
 * and a link that already carries its own query or fragment is never altered.
 */
export function carryOverLocation(href: string, search: string, hash: string): string {
  if (!href || href.includes('?') || href.includes('#')) {
    return href;
  }
  const query = search.startsWith('?') && search.length > 1 ? search : '';
  const fragment = hash.startsWith('#') && hash.length > 1 ? hash : '';
  return `${href}${query}${fragment}`;
}
