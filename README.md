# Atelier Jacqueline Suzanne — Website

## About the project

This is the custom-built bilingual (French/English) website for Atelier Jacqueline Suzanne, the practice of photographer Romane Lepont. It presents her photographic galleries, her Éditions, an about/contact page, and her exhibition agenda.

Content — galleries, Éditions, agenda entries, page copy — is authored and published by the photographer herself through a headless CMS, without touching the codebase. The site replaces a paid, hosted SaaS portfolio builder (Myportfolio) with a custom build designed to run at near-zero recurring cost. A shop with real checkout is planned as a future milestone; it is not part of the current build.

## Technical highlights

- **Static output, no server runtime** — Astro 7 builds to static HTML (`output: 'static'`, no SSR adapter) because the production host (OVH shared hosting, already owned) offers zero request-time compute. The architecture is deliberately shaped to need none, and ships zero JS by default.
- **Headless CMS, build-time content** — Sanity powers galleries, Éditions, About, and agenda content, fetched at build time rather than queried at runtime. The non-technical site owner publishes content through the Studio; a publish triggers a rebuild rather than a live database call.
- **Built-in i18n routing** — French served at the root, English under `/en/`, via Astro's native `astro:i18n`, keeping the bilingual requirement out of custom routing code.
- **Blocking CI gates before every deploy** — GitHub Actions runs lint, typecheck, unit tests (with coverage thresholds), and end-to-end browser tests across both the site and the separate Sanity Studio subproject before anything ships.
- **Two deploy targets, different roles** — GitHub Pages is a permanently-live staging/preview environment; OVH is the production host serving the real domain, with production releases triggered by the photographer's own publish action in Studio rather than by a code push.
- **Near-zero cost by design** — free hosting/CMS tiers plus an already-owned domain and host, targeting ~0-5€/month recurring cost as an explicit constraint, not an accident.

For full project context, decisions, and constraints, see [`.planning/PROJECT.md`](.planning/PROJECT.md) and [`CLAUDE.md`](CLAUDE.md).

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

## Testing: two separate Vitest projects, deliberately coupled

Root and `sanity/` each run their own Vitest, with a real but narrow overlap — knowing which one exercises what avoids duplicating tests or, worse, believing something is covered when it isn't.

- **Root Vitest** (`tests/unit/**`, this `package.json`'s `test:unit`/`test:coverage`) runs in a plain Node environment and instruments coverage for two directories: `src/lib/**/*.ts` (Astro-side render models and helpers) **and `sanity/editorial/**/*.ts`** — the Sanity Studio dashboard's pure-logic modules (`dashboardLogic.ts`, `deployment.ts`, `checks.ts`, `pipelineView.ts`, `releaseGate.ts`, `workflowLogic.ts`). These are plain functions with no React/DOM dependency, so a plain Node test can import and exercise them directly without needing Studio's own jsdom harness. `vitest.config.ts`'s `coverage.exclude` carves out two things that match that glob but aren't production logic: `sanity/editorial/test/**` (Studio's own jsdom/RTL test-support code) and `sanity/editorial/useDeploymentPolling.ts` (a React hook — `useState`/`useEffect` can't run outside a component render, so it's tested instead by Studio's own suite; see below).
- **Studio Vitest** (`sanity/vitest.config.ts`, run via `npm --prefix sanity run test`/`test:coverage`) runs in jsdom with React Testing Library, covering `.tsx` component files under `sanity/editorial/__tests__/` (`EditorialDashboard.tsx`, `CreditsManager.tsx`, etc.) plus `.ts`/`.tsx` files under `sanity/schemas/__tests__/` (schema-builder helpers like `sanity/schemas/lib/localeField.ts`, which need the real `defineField`/`defineType` from the `sanity` package — resolvable only from `sanity/node_modules`, not the root project). Its own coverage gate (`coverage.include: ['editorial/**/*.tsx']`, enforced by `scripts/check-tsx-coverage.mjs`'s 60/50/60/60 per-file floor) only measures `.tsx` files — the `.ts` logic modules it also runs (schemas/lib, or a hook test like `useDeploymentPolling.test.tsx`) execute and must pass, but aren't counted toward that specific gate.
- **Typechecking is likewise split**: root's `npm run typecheck` (`astro check`) covers `src/` and root-level `tests/`. `sanity/`'s own `npm run typecheck` (`tsc --noEmit -p tsconfig.typecheck.json`) covers Studio's source, scoped to exclude `__tests__/`/`test/`/`*.test.ts(x)` — those are excluded because of one pre-existing, narrow type-inference quirk in `CreditsManager.test.tsx` (a JSX `render()` overload colliding with an ambient Sanity structure-builder type when the whole `sanity/` TS program compiles together), unrelated to and not masking any production-code type error. Both typecheck scripts run as their own blocking CI gate in `.github/workflows/deploy.yml` and `deploy-ovh.yml`.

In short: if you add a new plain-logic `.ts` file under `sanity/editorial/` or `sanity/schemas/lib/`, root Vitest already covers it. If you add a new `.tsx` component or a React hook, it belongs in Studio's own suite (`sanity/editorial/__tests__/` or `sanity/schemas/__tests__/`) instead — and if it's a hook, add its filename to root `vitest.config.ts`'s `coverage.exclude` so root's coverage report doesn't count it as an untested `.ts` file.

## Deployments

This project has two deploy targets. Do not confuse them.

| | Staging — GitHub Pages | Production — OVH |
|---|---|---|
| Trigger | Automatic on push to `main`, and on the Sanity `sanity-content-published` webhook | Automatic on the dedicated `production-deploy-requested` event fired by the editor's `Publier sur le site en ligne` click in Sanity Studio (no approval); manual dispatch otherwise (Required-reviewer approval) — a code commit to `main` never deploys here |
| Workflow | `.github/workflows/deploy.yml` | `.github/workflows/deploy-ovh.yml` |
| Base path | `/ajs-website/` | Root (`/`) |
| URL | https://florianlepont.github.io/ajs-website/ | https://atelierjacquelinesuzanne.fr |

Per D-03, GitHub Pages stays alive permanently as a pre-production environment after the domain cutover — it is not retired. It is useful for previewing future changes before they reach the real domain, at no extra cost.

### Production deploy: the two paths

- **Content path (editor-gated).** Romane publishes in Studio → the content webhook fires and rebuilds GitHub Pages staging only → the dashboard's pipeline bar shows staging going green → she opens staging and checks it herself → she clicks `Publier sur le site en ligne` → that publishes an internal release-marker document → a second Sanity webhook fires the production-release event → deploy-ovh.yml runs every blocking gate and deploys to the real domain with no GitHub approval pause, because her click already was the human checkpoint and she has no GitHub access to give a second one.
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
6. **Sanity Project Webhook (`production-deploy-requested`)** — configured in **Sanity's own dashboard** (`https://www.sanity.io/manage` → project → API → Webhooks), **NOT** in this repository. Until it exists, the Studio `Publier sur le site en ligne` button will publish its marker and report success, and nothing will happen: no production run will ever start. Configuration:
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
