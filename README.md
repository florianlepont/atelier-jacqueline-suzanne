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
| `SITE_URL` | optional (build) | Canonical site origin; defaults to `https://florianlepont.github.io`. |
| `ASTRO_BASE` | optional (build) | Base path; defaults to `/`; set `/ajs-website/` for the GitHub Pages staging build. |
| `PUBLIC_CONTACT_ENDPOINT` | optional (build) | Contact form POST target; defaults to the same-origin path `/contact.php`. Must be set to the absolute production URL (`https://atelierjacquelinesuzanne.fr/contact.php`) for the GitHub Pages staging build, since that host cannot execute PHP. |

Note: the `sanity/` Studio has its own env (`SANITY_STUDIO_PREVIEW_URL`) documented in `sanity/README.md`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Astro dev server. |
| `npm run build` | Build the static site (`astro build`). |
| `npm run preview` | Preview the production build locally. |
| `npm run test:unit` | Run unit tests (Vitest). |
| `npm run test:e2e` | Run e2e tests (Playwright). |

## Deployments

This project has two deploy targets. Do not confuse them.

| | Staging — GitHub Pages | Production — OVH |
|---|---|---|
| Trigger | Automatic on push to `main`, and on the Sanity `sanity-content-published` webhook | Automatic on the dedicated `production-deploy-requested` event fired by the editor's `Mettre en production` click in Sanity Studio (no approval); manual dispatch otherwise (Required-reviewer approval) — a code commit to `main` never deploys here |
| Workflow | `.github/workflows/deploy.yml` | `.github/workflows/deploy-ovh.yml` |
| Base path | `/ajs-website/` | Root (`/`) |
| URL | https://florianlepont.github.io/ajs-website/ | https://atelierjacquelinesuzanne.fr |

Per D-03, GitHub Pages stays alive permanently as a pre-production environment after the domain cutover — it is not retired. It is useful for previewing future changes before they reach the real domain, at no extra cost.

### Production deploy: the two paths

- **Content path (editor-gated).** Romane publishes in Studio → the content webhook fires and rebuilds GitHub Pages staging only → the dashboard's pipeline bar shows staging going green → she opens staging and checks it herself → she clicks `Mettre en production` → that publishes an internal release-marker document → a second Sanity webhook fires the production-release event → deploy-ovh.yml runs every blocking gate and deploys to the real domain with no GitHub approval pause, because her click already was the human checkpoint and she has no GitHub access to give a second one.
- **Code path (manual, unchanged).** A commit landing on `main` deploys only to GitHub Pages staging. Shipping code to production is still an explicit `gh workflow run deploy-ovh.yml` that pauses on the `production-ovh` Required reviewer.
- **The caveat, restated:** because the release event always builds the default branch, a production release also ships whatever code is currently on `main`. Keep `main` production-ready. Note that this is now materially safer than before, because the release is a deliberate, separately-timed act rather than a side effect of every content publish.

### Production deploy: one-time setup

Before `deploy-ovh.yml` can be run, these six things must be configured once:

1. **Repository secret `OVH_SFTP_PASSWORD`** — the SFTP password for user `atelihu`, found in the OVH Control Panel under Web Cloud → Hosting plans → `atelihu` → FTP - SSH. Set it scoped to the environment:
   ```
   gh secret set OVH_SFTP_PASSWORD --env production-ovh
   ```
2. **Repository Environment `production-ovh`** — create it under Settings → Environments, with at least one Required reviewer. This is what makes the workflow pause for approval; without it the run proceeds straight to the SFTP push and D-02's approval gate does not exist.
3. **Confirm the webroot path** under `/home/atelihu` (the workflow assumes `www`) — OVH Control Panel → Web Cloud → Hosting plans → `atelihu` → Multisite.
4. **Confirm `atelierjacquelinesuzanne.fr` is attached to the `atelihu` hosting plan** via Multisite, since the DNS cutover in the launch runbook points the domain at that hosting.
5. **Repository Environment `production-ovh-auto`** — create it under Settings → Environments with NO required reviewer (leave Deployment protection rules empty). This is what lets the content path skip the approval pause. Then copy the SFTP secret onto it, since GitHub environment secrets do not carry across environments:
   ```
   gh secret set OVH_SFTP_PASSWORD --env production-ovh-auto
   ```
   If this step is skipped, automatic runs fail fast at the workflow's `Guard: SFTP credentials are present` step with an explicit error, rather than silently attempting an unauthenticated upload.
6. **Sanity Project Webhook (`production-deploy-requested`)** — configured in **Sanity's own dashboard** (`https://www.sanity.io/manage` → project → API → Webhooks), **NOT** in this repository. Until it exists, the Studio `Mettre en production` button will publish its marker and report success, and nothing will happen: no production run will ever start. Configuration:
   - Trigger on **Create** and **Update**.
   - Dataset: `production`.
   - Filter on the release-marker document type: `_type == "siteProductionRelease"`.
   - HTTP method: `POST` to `https://api.github.com/repos/florianlepont/ajs-website/dispatches`.
   - Body (projection) producing the event this repo's workflow now listens for: `{"event_type": "production-deploy-requested"}`.
   - Headers: `Accept: application/vnd.github+json`, `Content-Type: application/json`, and a bearer `Authorization` header.
   - The token is a **fine-grained GitHub PAT** scoped to this single repo (`florianlepont/ajs-website`) with `Contents: Read and write` and an expiry date. It lives **ONLY** in this webhook's header configuration in Sanity's dashboard — it must never be committed to this repository, written into any workflow file, or pasted anywhere else.
   - Verification note: the **existing** webhook driving the staging event (`sanity-content-published`) almost certainly filters on the *other* marker document type (`siteDeployment`). Open it, confirm its shape, and mirror it for the new webhook rather than editing it — staging must keep its own trigger untouched.

### Production deploy: how to run one

1. Dispatch the workflow — from the Actions tab, or `gh workflow run deploy-ovh.yml`.
2. The `build` job runs every blocking gate (Sanity Studio lint/build, typecheck, static-artifact verification, Playwright e2e, Vitest coverage) and writes a recap to the run summary: commit, target host/path, resolved `SITE_URL`, file count/size, and confirmation that `contact.php` and `.htaccess` are both present.
3. The run pauses on the `production-ovh` environment. Read the recap, then Approve.
4. The `deploy` job pushes `dist/` over SFTP to OVH.

This workflow only changes files on the server — it never touches DNS.

## Sanity Studio

Run it from the subproject:

```bash
cd sanity
npm install
npm run dev
```

Studio runs at http://localhost:3333. See [`sanity/README.md`](sanity/README.md) for the editor workflow (in French, for Romane).

## Deployment

Push to `main` → GitHub Actions builds, runs Playwright + Vitest as a blocking gate, and deploys to GitHub Pages. A Sanity publish fires a webhook that triggers a rebuild. See the `## Deployments` section above for current production deploy behavior.
