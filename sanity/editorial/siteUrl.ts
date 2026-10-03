// The live production site. GitHub Pages staging was retired (quick
// 261003-idz), so every Studio "open the site" link points here. This must
// match SITE_URL in .github/workflows/deploy-ovh.yml (a unit test enforces it).
export const PUBLIC_SITE_URL = 'https://atelierjacquelinesuzanne.fr'

// Joins the origin and a site path with exactly one slash.
export function publicSiteUrl(path: string): string {
  return `${PUBLIC_SITE_URL}/${path.replace(/^\/+/, '')}`
}
