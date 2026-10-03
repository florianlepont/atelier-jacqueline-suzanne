// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs, hreflang links, robots.txt and the sitemap.
  // The OVH production workflow (deploy-ovh.yml) always sets SITE_URL to
  // https://atelierjacquelinesuzanne.fr explicitly; this fallback only applies
  // to local and CI test builds.
  site: process.env.SITE_URL || 'https://florianlepont.github.io',
  // Static output (framework default) — no server-rendering integration is
  // installed. OVH Web Hosting is a plain Apache file server with zero
  // request-time compute, so this project never needs @astrojs/cloudflare,
  // @astrojs/node, or any other SSR-enabling package.
  output: 'static',
  // Optional base-path override (D-12/D-13): defaults to "/" for local dev and
  // the OVH production root. No workflow sets it any more; it is kept because
  // the e2e helpers and the artifact verifier support base-prefixed builds.
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
