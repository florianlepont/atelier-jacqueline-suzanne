// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs, hreflang links, robots.txt and the sitemap.
  // Override SITE_URL when the final OVH domain replaces GitHub Pages.
  site: process.env.SITE_URL || 'https://florianlepont.github.io',
  // Static output (framework default) — no server-rendering integration is
  // installed. OVH Web Hosting is a plain Apache file server with zero
  // request-time compute, so this project never needs @astrojs/cloudflare,
  // @astrojs/node, or any other SSR-enabling package.
  output: 'static',
  // Conditional base path (D-12/D-13): defaults to "/" for local dev and the
  // eventual OVH production root. Set ASTRO_BASE=/ajs-website/ at build time
  // to target GitHub Pages' project-page subpath for Phase 1 staging.
  base: process.env.ASTRO_BASE || '/',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      // French is served at "/" (no "/fr/" prefix); English lives under "/en/".
      // D-01 / D-02 — no Accept-Language auto-redirect.
      prefixDefaultLocale: false,
    },
  },
});
