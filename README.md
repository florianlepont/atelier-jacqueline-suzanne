# Atelier Jacqueline Suzanne — Website

Bilingual (fr/en) static Astro site with a Sanity CMS, for Romane Lepont's photography.

For full project context, decisions, and constraints, see [`.planning/PROJECT.md`](.planning/PROJECT.md) and [`CLAUDE.md`](CLAUDE.md).

## Stack

Astro 7 static output (no SSR adapter), content from Sanity fetched at build time, bilingual fr/en. Deployed to GitHub Pages (staging) and OVH (production, Phase 5).

## Repo layout

- `src/` — the Astro site: pages, components, layouts, and `lib/` helpers.
- `sanity/` — a **separate** Sanity Studio subproject with its own `package.json` / `node_modules` / scripts. See [`sanity/README.md`](sanity/README.md) (French editor guide) for Studio and content-editing docs.
- `.planning/` — GSD planning artifacts (roadmap, phases, state).

## Prerequisites

Node 22 (matches CI).

## Setup

```bash
npm install
cp .env.example .env
# then fill in the required vars below
```

## Environment variables

Names only — never commit real values, tokens, or keys. `.env` is gitignored; `.env.example` is the template.

| Name | Required? | Purpose |
|------|-----------|---------|
| `SANITY_PROJECT_ID` | required (build) | Sanity project id for build-time content fetch. |
| `SANITY_DATASET` | required (build) | Sanity dataset name (e.g. `production`). |
| `SANITY_API_READ_TOKEN` | required (build) | Sanity read token used at build time. |
| `PUBLIC_WEB3FORMS_ACCESS_KEY` | contact form | Currently unprovisioned / deferred to the Phase 5 OVH cutover — the contact form is non-functional until it is set. |
| `SITE_URL` | optional (build) | Canonical site origin; defaults to `https://florianlepont.github.io`. |
| `ASTRO_BASE` | optional (build) | Base path; defaults to `/`; set `/ajs-website/` for the GitHub Pages staging build. |

Note: the `sanity/` Studio has its own env (`SANITY_STUDIO_PREVIEW_URL`) documented in `sanity/README.md`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Astro dev server. |
| `npm run build` | Build the static site (`astro build`). |
| `npm run preview` | Preview the production build locally. |
| `npm run test:unit` | Run unit tests (Vitest). |
| `npm run test:e2e` | Run e2e tests (Playwright). |

## Sanity Studio

Run it from the subproject:

```bash
cd sanity
npm install
npm run dev
```

Studio runs at http://localhost:3333. See [`sanity/README.md`](sanity/README.md) for the editor workflow (in French, for Romane).

## Deployment

Push to `main` → GitHub Actions builds, runs Playwright + Vitest as a blocking gate, and deploys to GitHub Pages. A Sanity publish fires a webhook that triggers a rebuild. Production cutover to OVH (the real domain) is Phase 5.
