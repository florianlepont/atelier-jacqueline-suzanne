---
phase: quick-261003-idz
plan: 01
subsystem: publishing / CI-CD / Sanity Studio
tags: [sanity, github-actions, ovh, publishing, ci]
requires: []
provides:
  - "Native Sanity Publish on every public document type"
  - "ci.yml (gates + hosted Studio publish, never deploys the site)"
  - "deploy-ovh.yml as the only site deploy (Sanity webhook auto, manual reviewer-gated)"
affects: [README.md, sanity/README.md, CLAUDE.md, AGENTS.md, .planning/PROJECT.md]
tech-stack:
  added: []
  patterns:
    - "source-text lockstep tests tying docs to schemas/workflows (publishing-docs.test.ts)"
key-files:
  created:
    - .github/workflows/ci.yml
    - sanity/editorial/siteUrl.ts
    - tests/unit/ci-gates.test.ts
    - tests/unit/studio-site-url.test.ts
    - tests/unit/publishing-docs.test.ts
  modified:
    - .github/workflows/deploy-ovh.yml
    - .github/actions/lint-typecheck-and-install/action.yml
    - .github/actions/e2e-and-unit-tests/action.yml
    - sanity/sanity.config.ts
    - sanity/editorial/workflow.tsx
    - sanity/editorial/workflowLogic.ts
    - sanity/editorial/OpenSitePage.tsx
    - sanity/schemas/PublishedPageLinks.tsx
    - public/contact.php
    - README.md
    - sanity/README.md
    - CLAUDE.md
    - AGENTS.md
  deleted:
    - .github/workflows/deploy.yml
    - sanity/editorial/EditorialDashboard.tsx (+ .css, dashboardLogic, deployment, pipelineView, releaseGate, useDeploymentPolling, checks, DocumentChecklist)
    - sanity/schemas/siteDeployment.ts, sanity/schemas/siteProductionRelease.ts
    - sanity/.env.example
    - seven root dashboard/deployment unit test files and three Studio test files
decisions:
  - "One event_type reused: production-deploy-requested"
  - "Webhook filter covers every Studio document type, exhibition included"
  - "ci.yml replaces deploy.yml and keeps the hosted-Studio auto-publish"
  - "Singletons keep the WR-01 guard: publish restored, unpublish/delete/duplicate still stripped"
  - "CollectionStatusBadge kept; completeness and auto-open-checklist badges removed"
  - "Manual-dispatch reviewer gate (production-ovh) kept unchanged"
  - "contact.php CORS allowlist removed"
metrics:
  tasks: 4
  commits: 3
status: complete
---

# Quick 261003-idz: Native Sanity publishing with direct OVH deploys

Romane now publishes with Sanity's own **Publier** button. One Sanity webhook fires `production-deploy-requested`, and `deploy-ovh.yml` runs every blocking gate then deploys to https://atelierjacquelinesuzanne.fr with no approval pause. GitHub Pages staging, the Tableau de bord, the checklist and the two marker document types are gone.

## IMPORTANT: merged code on `main` ships to production with the next Sanity publish

A push to `main` still does **not** deploy the site (kept as before, per the brief). A push to `main` runs `ci.yml` only: all gates, then the hosted Studio publish. But `deploy-ovh.yml` is triggered by `repository_dispatch`, which always builds the default branch. So **whatever code is merged to `main` goes live to production on the next Sanity publish** (or immediately via `gh workflow run deploy-ovh.yml`). Keep `main` production-ready.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| A | `c8730e7` | Retire GitHub Pages: `ci.yml` replaces `deploy.yml`; `deploy-ovh.yml` narration updated; contact.php CORS removed; workflow tests rewritten; `ci-gates.test.ts` created |
| B | `4662e0f` | Native Publish restored; dashboard, checklist, marker types, tests, env var deleted; `siteUrl.ts` added; coverage matrix reduced to six TSX files |
| C | `d97d026` | README webhook/switch-over guide, French `sanity/README.md`, CLAUDE.md/AGENTS.md/PROJECT.md, stale comments, `publishing-docs.test.ts` |
| D | none | Verification only; nothing needed fixing |

## Decisions made

1. **One event_type, reused:** `production-deploy-requested`. `deploy-ovh.yml`'s trigger is unchanged, so only the existing "Production deploy requested" webhook's filter and triggers change. URL, PAT header and projection stay. "GitHub Actions rebuild" gets deleted.
2. **Webhook filter = every Studio document type:** `_type in ["siteSettings", "homePage", "editionsPage", "aboutPage", "contactPage", "gallery", "edition", "exhibition"]`. `exhibition` is included; it is not rendered yet so a publish is a harmless rebuild.
3. **`ci.yml` replaces `deploy.yml`**, keeping all gates and the hosted-Studio auto-publish (quick 260826-wx6). Triggers: push to `main` and `workflow_dispatch` only.
4. **Singletons keep their integrity guard (WR-01):** `publish` restored; `unpublish`, `delete`, `duplicate` still stripped for the five singleton pages. All other types get Sanity's actions untouched.
5. **`CollectionStatusBadge` kept** (independent of the dashboard); completeness and auto-open-checklist badges removed.
6. **Manual-dispatch reviewer gate (`production-ovh`) kept unchanged.**
7. **`public/contact.php` CORS allowlist removed.** It existed only so the GitHub Pages origin could POST cross-origin; production is same-origin. `php -l` passes and `contact-php.test.ts` still passes.

## Deviations from Plan

### Auto-fixed / environment issues

**1. [Blocked - permission] Root `.env.example` not updated**
- **Found during:** Task C
- **Issue:** The plan says to `rm .env.example` then Write the new content. The Bash `rm` was denied by the permission system, and `Write` on `.env.example` is blocked by the project's `Read(.env.*)` deny rule. I did not try to work around either block. I had run `git rm` on it first, so I restored the file with `git restore` (it is byte-identical to HEAD).
- **Consequence:** `.env.example` still has the stale GitHub Pages wording (`SITE_URL=https://florianlepont.github.io` and the Pages comment on `PUBLIC_CONTACT_ENDPOINT`). The Task C verify clause `grep -qE '^\+?SITE_URL=$'` against `.env.example` therefore could not pass; I ran the other verify clauses.
- **Action for the user:** replace `.env.example` with the target content in the plan (blank `SITE_URL=`, the same-origin `PUBLIC_CONTACT_ENDPOINT` comment). Nothing else depends on it; no test asserts it.

**2. [Rule 1 - Bug] Accidentally deleted a comment line in `vitest.config.ts`**
- **Found during:** Task B. A line-range delete removed the first line of the `home-carousel-runtime.ts` comment paragraph. Restored immediately with an Edit; the final diff only removes the `useDeploymentPolling` paragraph and exclude entry.

No other deviations. Task D required no fix-up commit.

## Verification results (all green, run from scratch in Task D)

- `npm run lint` (root), `npm run typecheck`: 0 errors.
- `SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run test:coverage`: 98.54 / 87.63 / 100 / 99.25 against unchanged thresholds 80/75/80/80.
- `npm --prefix sanity run lint`, `typecheck`, `build`: pass.
- `npm --prefix sanity run test:coverage`: 37 tests; global 95.14 / 80.31 / 93.24 / 96.62 against unchanged 75/65/75/75; per-file gate passed for all 6 production TSX files.
- Sandbox could reach Sanity: `npm run build` produced 31 pages and `npm run test:artifact` verified them (base `/`).
- Both stale-reference sweeps are clean outside `.planning/`; the only hits are the tests that deliberately assert absence (`deploy-ovh-workflow.test.ts`, `publishing-docs.test.ts`) and the README's optional marker-delete command.
- Playwright e2e was not run locally (CI runs it), as the plan specified.

## MANUAL STEPS the user must do (Claude cannot)

Do these after merging to `main` (full detail in README "Switching over"):

1. **Merge to `main`.** `ci.yml` republishes the hosted Studio (needs the `SANITY_AUTH_TOKEN` secret, already set up). Nothing is deployed to the site.
2. **Edit the Sanity webhook "Production deploy requested"** (https://www.sanity.io/manage -> project `gwz8iug4` -> API -> Webhooks). Sanity allows 2 webhooks, both in use, so edit one and delete the other:
   - Trigger on: Create, Update, Delete
   - Filter: `_type in ["siteSettings", "homePage", "editionsPage", "aboutPage", "contactPage", "gallery", "edition", "exhibition"]`
   - Drafts: unchecked. Versions: unchecked.
   - Keep the URL (`https://api.github.com/repos/florianlepont/atelier-jacqueline-suzanne/dispatches`), the `Authorization: Bearer <PAT>` header and the projection `{"event_type": "production-deploy-requested"}`.
3. **Delete the webhook "GitHub Actions rebuild"** (it fed the retired staging site).
4. **Unpublish GitHub Pages:** Settings -> Pages, or `gh api -X DELETE repos/florianlepont/atelier-jacqueline-suzanne/pages`. Optionally delete the `github-pages` environment: `gh api -X DELETE repos/florianlepont/atelier-jacqueline-suzanne/environments/github-pages`.
5. **Optional marker cleanup:** from `sanity/`, after `npx sanity login`, run `npx sanity documents delete siteDeployment siteProductionRelease`.
6. **Verify:** publish a harmless edit; the webhook attempts log shows a 2xx delivery; a "Deploy to OVH production" run (trigger `repository_dispatch`) finishes green without an approval pause (about 6 min); the change appears on https://atelierjacquelinesuzanne.fr.
7. **Replace `.env.example`** as described in Deviation 1.
8. Make sure the PAT in the webhook header has an expiry date and a rotation reminder: an expired PAT makes deliveries fail with 401 and the site silently stops updating.

## Follow-ups not done (deliberately out of scope)

- `astro.config.mjs` still falls back to `https://florianlepont.github.io` for `SITE_URL` when unset (and so does robots/sitemap generation in local/CI test builds). The OVH workflow always sets `SITE_URL` explicitly, so production is unaffected.
- `scripts/launch-smoke-check.sh` still has a GitHub Pages usage example.
- `.env.example` update (see Deviation 1).

## Threat surface

No new network endpoints or trust boundaries beyond the plan's threat model. The contact.php CORS allowlist was removed (T-idz-05). The SFTP action pins, secret-only password lines, concurrency group and all blocking gates before the reviewer-free auto deploy are asserted by `deploy-ovh-workflow.test.ts` and `ci-gates.test.ts`.

## Self-Check: PASSED

- Created files present: `.github/workflows/ci.yml`, `sanity/editorial/siteUrl.ts`, `tests/unit/ci-gates.test.ts`, `tests/unit/studio-site-url.test.ts`, `tests/unit/publishing-docs.test.ts`.
- Deleted: `.github/workflows/deploy.yml` and all dashboard/marker/checklist files (verified by the Task B grep sweep).
- Commits present: `c8730e7`, `4662e0f`, `d97d026`.
