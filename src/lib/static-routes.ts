export interface SitemapEntry {
  path: string
  noIndex?: boolean
}

export function normalizeBase(base: string): string {
  const withLeadingSlash = base.startsWith('/') ? base : `/${base}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export function siteUrl(origin: URL, base: string, path: string): string {
  const normalizedPath = `${normalizeBase(base)}${path}`.replace(/\/+/g, '/')
  return new URL(normalizedPath, origin).toString()
}

export function escapeXml(value: string): string {
  const entities: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }
  return value.replace(/[<>&'"]/g, (character) => entities[character])
}

export function buildRobotsText(origin: URL, base: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl(origin, base, 'sitemap.xml')}\n`
}

export function localizedSitemapPaths(entries: SitemapEntry[]): string[] {
  return entries
    .filter((entry) => !entry.noIndex)
    .flatMap((entry) => [entry.path, `en/${entry.path}`])
}

export function buildSitemapXml(origin: URL, base: string, paths: string[]): string {
  const urls = paths.map((path) => siteUrl(origin, base, path))
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}
</urlset>`
}
