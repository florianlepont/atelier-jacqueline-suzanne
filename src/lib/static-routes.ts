export interface SitemapEntry {
  path: string;
  noIndex?: boolean;
}

export function normalizeBase(base: string): string {
  const withLeadingSlash = base.startsWith('/') ? base : `/${base}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function siteUrl(origin: URL, base: string, path: string): string {
  const normalizedPath = `${normalizeBase(base)}${path}`.replace(/\/+/g, '/');
  return new URL(normalizedPath, origin).toString();
}

export function escapeXml(value: string): string {
  const entities: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  };
  return value.replace(/[<>&'"]/g, (character) => entities[character]);
}

// AI-training / AI-assistant crawlers asked to stay out of the whole site.
// This is an opt-out SIGNAL honoured by well-behaved crawlers: a deterrent,
// not an enforcement (it cannot technically stop a scraper that ignores
// robots.txt). Google-Extended and Applebot-Extended are training opt-out
// tokens only: they do not affect Google Search or Applebot indexing. These
// groups do NOT inherit from the generic `*` group, which is why each one
// states its own rule (and why each gets its own group: some simple parsers
// only honour the last agent line of a shared group).
export const AI_CRAWLER_USER_AGENTS: readonly string[] = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'CCBot',
  'Google-Extended',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'Bytespider',
  'PerplexityBot',
  'Applebot-Extended',
];

export function buildRobotsText(origin: URL, base: string): string {
  const aiGroups = AI_CRAWLER_USER_AGENTS.map(
    (agent) => `User-agent: ${agent}\nDisallow: /\n`,
  ).join('\n');
  return `User-agent: *\nAllow: /\n\n${aiGroups}\nSitemap: ${siteUrl(origin, base, 'sitemap.xml')}\n`;
}

export function localizedSitemapPaths(entries: SitemapEntry[]): string[] {
  return entries
    .filter((entry) => !entry.noIndex)
    .flatMap((entry) => [entry.path, `en/${entry.path}`]);
}

export function buildSitemapXml(origin: URL, base: string, paths: string[]): string {
  const urls = paths.map((path) => siteUrl(origin, base, path));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}
</urlset>`;
}
