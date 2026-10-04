# Atelier Jacqueline Suzanne — Website

## About the project

This is the custom-built bilingual (French/English) website for Atelier Jacqueline Suzanne, the practice of photographer Romane Lepont. It presents her photographic galleries, her Éditions, an about/contact page, and her exhibition agenda.

Content — galleries, Éditions, agenda entries, page copy — is authored and published by the photographer herself through a headless CMS, without touching the codebase. The site replaces a paid, hosted SaaS portfolio builder (Myportfolio) with a custom build designed to run at near-zero recurring cost. A shop with real checkout is planned as a future milestone; it is not part of the current build.

## Technical highlights

- **Static output, no server runtime** — Astro 7 builds to static HTML (`output: 'static'`, no SSR adapter) because the production host (OVH shared hosting, already owned) offers zero request-time compute. The architecture is deliberately shaped to need none, and ships zero JS by default.
- **Headless CMS, build-time content** — Sanity powers galleries, Éditions, About, and agenda content, fetched at build time rather than queried at runtime. The non-technical site owner publishes content through the Studio; a publish triggers a rebuild rather than a live database call.
- **Built-in i18n routing** — French served at the root, English under `/en/`, via Astro's native `astro:i18n`, keeping the bilingual requirement out of custom routing code.
- **Blocking CI gates before every deploy** — GitHub Actions runs lint, typecheck, unit tests (with coverage thresholds), and end-to-end browser tests across both the site and the separate Sanity Studio subproject before anything ships.
- **One production target, deployed by publishing** — OVH serves the real domain and is updated automatically when the photographer clicks Sanity's native Publish button (one Sanity webhook triggers the deploy workflow). CI gates every push, and a push to `main` never deploys the site.
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

### Getting the Sanity values (new developer)

The content lives in a Sanity project you must be invited to (ask Florian or Romane). Once invited:

1. `SANITY_PROJECT_ID` is `gwz8iug4` and `SANITY_DATASET` is `production` (identifiers, not secrets).
2. Create your own **read** token: https://www.sanity.io/manage → project `gwz8iug4` → API → Tokens → Add API token, permission **Viewer**. Put it in your local `.env` as `SANITY_API_READ_TOKEN`. Never reuse the CI token and never commit it.
3. Run `npm run dev`. If the build says a Sanity variable is missing or invalid, the first two lines above are the usual cause.

The unit tests also read `SANITY_PROJECT_ID` and `SANITY_DATASET` (any valid project id works, no token needed): export them before `npm run test:unit` or two test files fail on client creation.

## Environment variables

Names only — never commit real values, tokens, or keys. `.env` is gitignored; `.env.example` is the template.

| Name | Required? | Purpose |
|------|-----------|---------|
| `SANITY_PROJECT_ID` | required (build) | Sanity project id for build-time content fetch. |
| `SANITY_DATASET` | required (build) | Sanity dataset name (e.g. `production`). |
| `SANITY_API_READ_TOKEN` | required (build) | Sanity read token used at build time. |
| `SANITY_WRITE_TOKEN` | optional (maintenance) | Temporary Sanity write token, read only by `npm run sanity:downsize-images -- --apply`. Never needed for builds; export it for one session, never put it in `.env`. |
| `SITE_URL` | optional (build) | Canonical site origin; `astro.config.mjs` provides a fallback for local builds. The OVH production workflow always sets `https://atelierjacquelinesuzanne.fr` explicitly. |
| `ASTRO_BASE` | optional (build) | Base path; defaults to `/`. No workflow sets it. |
| `PUBLIC_CONTACT_ENDPOINT` | optional (build) | Contact form POST target; defaults to the same-origin path `/contact.php`. Leave it unset: `public/contact.php` sends no CORS headers, so a build served from another origin could not read the endpoint's response. |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Astro dev server. |
| `npm run build` | Build the static site (`astro build`). |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | ESLint over the whole repository. |
| `npm run typecheck` | Type-check the site (`astro check`). The Studio has its own: `npm --prefix sanity run typecheck`. |
| `npm run test:unit` | Run unit tests (Vitest). |
| `npm run test:coverage` | Unit tests with the coverage thresholds CI enforces. |
| `npm run test:e2e` | Run e2e tests (Playwright). Needs the Playwright browsers; CI runs chromium and webkit. |
| `npm run test:artifact` | Verify the built `dist/` (needs `npm run build` first): 404 wiring, `.htaccess` and its security headers, `contact.php`, robots, sitemap. |
| `npm run test:smoke` | `scripts/launch-smoke-check.sh`: probes a live origin (pass it as an argument, e.g. `npm run test:smoke -- https://atelierjacquelinesuzanne.fr`): page responses, 404 handling, the contact endpoint and, with `MX_BASELINE`, that the e-mail MX records did not change. It does not check security headers: use `curl -I` for that. |
| `npm run sanity:downsize-images` | Maintenance script that shrinks oversized Sanity images. A read-only dry-run by default; follow the runbook (in French): [`docs/reduction-images-sanity.md`](docs/reduction-images-sanity.md). |

## Testing: two separate Vitest projects, deliberately coupled

Root and `sanity/` each run their own Vitest, with a real but narrow overlap — knowing which one exercises what avoids duplicating tests or, worse, believing something is covered when it isn't.

- **Root Vitest** (`tests/unit/**`, this `package.json`'s `test:unit`/`test:coverage`) runs in a plain Node environment and instruments coverage for two directories: `src/lib/**/*.ts` (Astro-side render models and helpers) **and `sanity/editorial/**/*.ts`** — the Sanity Studio's pure-logic modules (`workflowLogic.ts` and `siteUrl.ts`). These are plain functions with no React/DOM dependency, so a plain Node test can import and exercise them directly without needing Studio's own jsdom harness. `vitest.config.ts`'s `coverage.exclude` carves out `sanity/editorial/test/**` (Studio's own jsdom/RTL test-support code), which matches that glob but isn't production logic.
- **Studio Vitest** (`sanity/vitest.config.ts`, run via `npm --prefix sanity run test`/`test:coverage`) runs in jsdom with React Testing Library, covering `.tsx` component files under `sanity/editorial/__tests__/` (`CreditsManager.tsx`, `MediaLibrary.tsx`, `OpenSitePage.tsx`, etc.) plus `.ts`/`.tsx` files under `sanity/schemas/__tests__/` (schema-builder helpers like `sanity/schemas/lib/localeField.ts`, which need the real `defineField`/`defineType` from the `sanity` package — resolvable only from `sanity/node_modules`, not the root project). Its own coverage gate (`coverage.include: ['editorial/**/*.tsx']`, enforced by `scripts/check-tsx-coverage.mjs`'s 60/50/60/60 per-file floor) only measures `.tsx` files — the `.ts` logic modules it also runs (such as schemas/lib) execute and must pass, but aren't counted toward that specific gate.
- **Typechecking is likewise split**: root's `npm run typecheck` (`astro check`) covers `src/` and root-level `tests/`. `sanity/`'s own `npm run typecheck` (`tsc --noEmit -p tsconfig.typecheck.json`) covers Studio's source, scoped to exclude `__tests__/`/`test/`/`*.test.ts(x)` — those are excluded because of one pre-existing, narrow type-inference quirk in `CreditsManager.test.tsx` (a JSX `render()` overload colliding with an ambient Sanity structure-builder type when the whole `sanity/` TS program compiles together), unrelated to and not masking any production-code type error. Both typecheck scripts run as their own blocking CI gate in `.github/workflows/ci.yml` and `deploy-ovh.yml`.

In short: if you add a new plain-logic `.ts` file under `sanity/editorial/` or `sanity/schemas/lib/`, root Vitest already covers it. If you add a new `.tsx` component or a React hook, it belongs in Studio's own suite (`sanity/editorial/__tests__/` or `sanity/schemas/__tests__/`) instead — and if it's a hook, add its filename to root `vitest.config.ts`'s `coverage.exclude` so root's coverage report doesn't count it as an untested `.ts` file.

## Deployments

The site has one production target, OVH, updated automatically when Romane clicks Sanity's native **Publier** button. CI gates every push, and a push never deploys the site.

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/ci.yml` | Push to `main`, and manual dispatch | Runs every blocking gate (Studio lint/coverage/build/typecheck, root lint/typecheck, static-artifact verification, Playwright e2e, Vitest coverage), then republishes the hosted Sanity Studio. **Never deploys the site.** |
| `.github/workflows/deploy-ovh.yml` | The Sanity webhook event `production-deploy-requested` (automatic, through the `production-ovh-auto` environment, no approval pause), and manual dispatch (pauses on the `production-ovh` Required reviewer) | Runs the same gates, builds with `SITE_URL=https://atelierjacquelinesuzanne.fr` at the root base path, and uploads `dist/` to OVH over SFTP. The live site is https://atelierjacquelinesuzanne.fr. |

A push to `main` never deploys the site. Code merged to `main` reaches production with the next content publish (a `repository_dispatch` run always builds the default branch), or right away with `gh workflow run deploy-ovh.yml`. Keep `main` production-ready.

Separately, `.github/workflows/pr-checks.yml` runs lint, typecheck and unit tests on every pull request, with a read-only token and no secrets.

A burst of publishes leaves at most one run in progress plus one pending run, and the latest pending run wins, so two uploads never race on the same webroot.

### Sanity Studio: published automatically

The hosted Studio at https://atelier-jacqueline-suzanne.sanity.studio/ is republished automatically by `.github/workflows/ci.yml`, as the final step of every push to `main`, after every blocking gate has passed.

It does **not** republish on a content publish, since a content publish can't change Studio source code.

It republishes on *every* push to `main`, not only pushes that touch `sanity/`: the Studio build already runs on every push anyway, and a paths filter would reintroduce the exact staleness risk this step exists to remove.

To force a republish without a code change, re-run the last `ci.yml` run from the Actions tab. Running `npm run deploy` from `sanity/` locally still works but is no longer the expected path.

If the repository secret below is missing, the run stays green but carries a warning annotation and the live Studio silently stays on its previous bundle.

**One-time setup — repository secret `SANITY_AUTH_TOKEN`:**

1. Create the token: https://www.sanity.io/manage → project `gwz8iug4` → API → Tokens → Add API token. Give it the **`Deploy Studio` permission only**. Do not add Editor, Developer or Administrator: this token sits in GitHub and must not be able to edit content or manage access.
2. Add it as a **repository-level** secret (not scoped to an environment): `gh secret set SANITY_AUTH_TOKEN`.
3. This must be a distinct token from the existing read-only `SANITY_API_READ_TOKEN` — reusing that read token will fail the publish.

### Production deploy: one-time setup

Before `deploy-ovh.yml` can run, these things must be configured once:

1. **Repository secret `OVH_SFTP_PASSWORD`** — the SFTP password for the `OVH_SFTP_USER` login (see item 7), found in the OVH Control Panel under Web Cloud → Hosting plans → your plan → FTP - SSH. Set it scoped to the environment:
   ```
   gh secret set OVH_SFTP_PASSWORD --env production-ovh
   ```
2. **Repository Environment `production-ovh`** — create it under Settings → Environments, with at least one Required reviewer. This is what makes manual runs pause for approval; without it a manual run proceeds straight to the SFTP push and D-02's approval gate does not exist.
3. **Confirm the webroot path** under `/home/<OVH_SFTP_USER>` (the workflow assumes `www`) — OVH Control Panel → Web Cloud → Hosting plans → your plan → Multisite.
4. **Confirm `atelierjacquelinesuzanne.fr` is attached to the hosting plan** via Multisite.
5. **Repository Environment `production-ovh-auto`** — create it under Settings → Environments with NO required reviewer (leave Deployment protection rules empty). This is what lets a Sanity publish deploy without an approval pause: Romane's own click on Publier is the deliberate act. Then copy the SFTP secret onto it, since GitHub environment secrets do not carry across environments:
   ```
   gh secret set OVH_SFTP_PASSWORD --env production-ovh-auto
   ```
   If this step is skipped, automatic runs fail fast at the workflow's `Guard: SFTP credentials are present` step with an explicit error, rather than silently attempting an unauthenticated upload.
6. **Sanity webhook** — see the next section.
7. **Repository Actions variables `OVH_SFTP_HOST` and `OVH_SFTP_USER`** — the SFTP server hostname and the FTP/SFTP login (which is also the hosting account name used in the remote path `/home/<login>/www`). Take both from the OVH Control Panel → Web Cloud → Hosting plans → your plan → FTP - SSH, and create them at **repository level** (not environment-scoped, so the build job and both environments see them):
   ```
   gh variable set OVH_SFTP_HOST --body '<ftp server hostname>'
   gh variable set OVH_SFTP_USER --body '<ftp login>'
   ```
   They are variables, not secrets, because they are identifiers rather than credentials; they only need to stay out of the tracked workflow file. Both must exist before the next production run: otherwise the `Guard: SFTP credentials are present` step fails the run before any upload is attempted.

### Sanity webhook

Webhooks live in **Sanity's own dashboard** (https://www.sanity.io/manage → project `gwz8iug4` → API → Webhooks), **not** in this repository. Until the webhook is configured as below, a click on Publier updates Sanity and nothing else: no production run starts.

Sanity's plan allows 2 webhooks and both are in use, so **edit one and delete the other**:

| Setting | Value |
|---|---|
| Webhook to edit | the existing **Production deploy requested** (optionally rename it to "Production deploy (OVH)") |
| Webhook to delete | **GitHub Actions rebuild** |
| Project / dataset | `gwz8iug4` / `production` |
| URL | `https://api.github.com/repos/florianlepont/atelier-jacqueline-suzanne/dispatches` (unchanged) |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["siteSettings", "homePage", "editionsPage", "aboutPage", "contactPage", "gallery", "edition", "exhibition"]` |
| Projection | `{"event_type": "production-deploy-requested"}` (unchanged) |
| Status | Enabled |
| Advanced: HTTP method | `POST` |
| Advanced: HTTP headers | `Authorization: Bearer <fine-grained PAT>` (unchanged), `Accept: application/vnd.github+json`, `Content-Type: application/json` |
| Advanced: API version | leave as is (the projection uses no version-specific GROQ) |
| Advanced: Drafts | unchecked (never trigger on draft edits) |
| Advanced: Versions | unchecked |
| Advanced: Secret | empty (GitHub does not verify Sanity signatures) |
| PAT | fine-grained, repository `florianlepont/atelier-jacqueline-suzanne` only, permission `Contents: Read and write`, with an expiry date. Lives **ONLY** in this webhook's Authorization header, never in the repo or a workflow file. |

`exhibition` is in the filter even though exhibitions are not rendered on the site yet: for now a publish of one just triggers a harmless rebuild. `seo` and `imageRights` are object types and never fire. A test (`tests/unit/publishing-docs.test.ts`) keeps this filter in lockstep with the document types in `sanity/schemas/`, so adding a document type fails CI until the filter line above is updated.

**PAT expiry warning:** when the PAT expires, deliveries start failing with 401 in the webhook's attempts log and the site silently stops updating. Rotate the PAT in the webhook header before it expires.

### Switching over (one-time, after merging this change)

1. Merge into `main`. `ci.yml` republishes the Studio, which now has the native Publier button and no Tableau de bord. Nothing is deployed to the site.
2. Edit **Production deploy requested** with the values from the table above. Only the filter, the triggers and the drafts/versions options change.
3. Delete **GitHub Actions rebuild**. It fed the retired GitHub Pages staging site, and no workflow listens to its event anymore.
4. Unpublish GitHub Pages: Settings → Pages, or
   ```
   gh api -X DELETE repos/florianlepont/atelier-jacqueline-suzanne/pages
   ```
   Optionally delete the `github-pages` environment:
   ```
   gh api -X DELETE repos/florianlepont/atelier-jacqueline-suzanne/environments/github-pages
   ```
5. Optional: from `sanity/`, after `npx sanity login`, run `npx sanity documents delete siteDeployment siteProductionRelease`. This removes the two orphaned marker documents left by the retired dashboard. Their types are in neither the schema nor the webhook filter, so deleting them triggers nothing.
6. Verify:
   - publish a harmless edit in Studio;
   - the webhook's attempts log in Sanity shows a 2xx delivery;
   - a "Deploy to OVH production" run appears, triggered by `repository_dispatch`, and finishes green without an approval pause (about 6 minutes);
   - the change is visible on https://atelierjacquelinesuzanne.fr.

### Production deploy: how to run one manually

1. Dispatch the workflow — from the Actions tab, or `gh workflow run deploy-ovh.yml`.
2. The `build` job runs every blocking gate (Sanity Studio lint/build, typecheck, static-artifact verification, Playwright e2e, Vitest coverage) and writes a recap to the run summary: commit, resolved `SITE_URL`, file count/size, and confirmation that `contact.php` and `.htaccess` are both present.
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

## Security

- **HTTP headers.** `public/.htaccess` sends nosniff, Referrer-Policy, Permissions-Policy, a Content-Security-Policy and HSTS. The CSP allows only the site itself, images from `cdn.sanity.io`, and the inline scripts and styles Astro emits. A feature that loads from another host must add it there; `npm run test:artifact` checks the headers are present.
- **Contact form.** `public/contact.php` has a honeypot, field validation, header-injection protection, and a rate limit (5 messages per hour per visitor, 40 per hour site-wide). The visitor address is kept only as a hash for an hour.
- **Supply chain.** Every GitHub Action is pinned to a commit SHA, and Dependabot proposes weekly grouped updates for the site, the Studio and the Actions.
- **Secrets.** No secret is committed; the SFTP host and login are repository variables, the passwords and tokens are GitHub secrets. Push protection is enabled on the repository.
- **Reporting.** See [`SECURITY.md`](SECURITY.md).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the branch and pull request workflow and the checks to run before opening a PR.

## Licence

The source code is released under the MIT licence (see [`LICENSE`](LICENSE)).

The photographs, texts, logos and brand (the Atelier Jacqueline Suzanne name and visual identity) are (c) Romane Lepont, all rights reserved, and are not covered by the MIT licence. This includes an explicit reservation against AI training and text-and-data-mining use; see [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).

To report a vulnerability, see [`SECURITY.md`](SECURITY.md).

## Author

**Florian Lepont**

[LinkedIn](https://www.linkedin.com/in/florianlepont/)
