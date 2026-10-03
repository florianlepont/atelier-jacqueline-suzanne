---
phase: quick-261003-idz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  # Task A: CI workflows, retire GitHub Pages
  - .github/workflows/deploy.yml                      # DELETED
  - .github/workflows/ci.yml                          # NEW
  - .github/workflows/deploy-ovh.yml
  - .github/actions/lint-typecheck-and-install/action.yml
  - .github/actions/e2e-and-unit-tests/action.yml
  - tests/unit/deploy-ovh-workflow.test.ts
  - tests/unit/ci-gates.test.ts                       # NEW (moved out of deployment.test.ts)
  - public/contact.php
  # Task B: Studio native publish + dashboard removal
  - sanity/sanity.config.ts
  - sanity/schemas/index.ts
  - sanity/schemas/structure.ts
  - sanity/schemas/gallery.ts
  - sanity/schemas/edition.ts
  - sanity/schemas/PublishedPageLinks.tsx
  - sanity/schemas/siteDeployment.ts                  # DELETED
  - sanity/schemas/siteProductionRelease.ts           # DELETED
  - sanity/editorial/siteUrl.ts                       # NEW
  - sanity/editorial/workflow.tsx
  - sanity/editorial/workflowLogic.ts
  - sanity/editorial/OpenSitePage.tsx
  - sanity/editorial/CreditsManager.tsx
  - sanity/editorial/EditorialDashboard.tsx           # DELETED
  - sanity/editorial/EditorialDashboard.css           # DELETED
  - sanity/editorial/dashboardLogic.ts                # DELETED
  - sanity/editorial/deployment.ts                    # DELETED
  - sanity/editorial/pipelineView.ts                  # DELETED
  - sanity/editorial/releaseGate.ts                   # DELETED
  - sanity/editorial/useDeploymentPolling.ts          # DELETED
  - sanity/editorial/checks.ts                        # DELETED
  - sanity/editorial/DocumentChecklist.tsx            # DELETED
  - sanity/editorial/__tests__/EditorialDashboard.test.tsx      # DELETED
  - sanity/editorial/__tests__/DocumentChecklist.test.tsx       # DELETED
  - sanity/editorial/__tests__/useDeploymentPolling.test.tsx    # DELETED
  - sanity/editorial/__tests__/EditorialShells.test.tsx
  - sanity/editorial/test/mocks.tsx
  - sanity/editorial/test/setup.ts
  - sanity/scripts/check-tsx-coverage.mjs
  - sanity/.env.example                               # DELETED
  - .planning/quick/260811-kog-corriger-les-constats-du-diagnostic-qual/260811-kog-TSX-COVERAGE.md
  - vitest.config.ts
  - tests/unit/workflow-logic.test.ts
  - tests/unit/document-completeness-contracts.test.ts
  - tests/unit/studio-site-url.test.ts                # NEW
  - tests/unit/deployment.test.ts                     # trimmed in A, DELETED in B
  - tests/unit/dashboard-logic.test.ts                # DELETED
  - tests/unit/pipeline-view.test.ts                  # DELETED
  - tests/unit/release-gate.test.ts                   # DELETED
  - tests/unit/editorial-checks.test.ts               # DELETED
  - tests/unit/editorial-dashboard-css.test.ts        # DELETED
  - tests/unit/editorial-dashboard-markup.test.ts     # DELETED
  # Task C: documentation + stale comments
  - README.md
  - sanity/README.md
  - CLAUDE.md
  - AGENTS.md
  - .planning/PROJECT.md
  - tests/unit/publishing-docs.test.ts                # NEW
  - astro.config.mjs
  - .env.example
  - src/components/ContactForm.astro
  - src/lib/contact-form.ts
  - src/components/HomeCarousel.astro
autonomous: true
requirements: [PUB-01, PUB-02, PUB-03, PUB-04]
user_setup:
  - service: sanity
    why: "Sanity webhooks live in Sanity Manage, not in this repo. The plan allows only 2 webhooks and both are in use, so one must be edited and the other deleted. Claude cannot do this."
    dashboard_config:
      - task: "Edit the webhook 'Production deploy requested': filter on the public document types, triggers Create/Update/Delete, drafts and versions off. Keep its URL, headers (PAT) and projection. Exact values are in README.md > Deployments > Sanity webhook."
        location: "https://www.sanity.io/manage -> project gwz8iug4 -> API -> Webhooks"
      - task: "Delete the webhook 'GitHub Actions rebuild' (it fed the retired GitHub Pages staging)."
        location: "https://www.sanity.io/manage -> project gwz8iug4 -> API -> Webhooks"
  - service: github
    why: "Taking the old staging site offline is a repository setting. Claude must not change GitHub settings."
    dashboard_config:
      - task: "Unpublish the GitHub Pages site (Settings -> Pages), and optionally delete the github-pages environment."
        location: "https://github.com/florianlepont/atelier-jacqueline-suzanne/settings/pages"

must_haves:
  truths:
    - "PUB-01: In the hosted Studio, every public document (gallery, edition, homePage, editionsPage, aboutPage, contactPage, siteSettings, exhibition) shows Sanity's native Publish action again. The five singletons still cannot be unpublished, deleted or duplicated."
    - "PUB-01: Native schema validation (rule.required() in sanity/schemas/*) is what blocks an incomplete publish. No custom checklist or dashboard gate remains."
    - "PUB-02: Publishing a public document triggers exactly one deploy path: the single Sanity webhook sends repository_dispatch `production-deploy-requested`. deploy-ovh.yml runs every blocking gate (Studio lint/test:coverage/build/typecheck, root lint/typecheck, test:artifact, Playwright e2e, Vitest coverage) and pushes to OVH through `production-ovh-auto` with no approval pause."
    - "PUB-02: deploy-ovh.yml can still be dispatched manually, and that path still uses the reviewer-gated `production-ovh` environment."
    - "PUB-02: No GitHub Pages workflow exists. A push to `main` runs ci.yml: all the same gates, then the hosted Sanity Studio publish. It never deploys the site."
    - "PUB-02: The OVH build uses SITE_URL=https://atelierjacquelinesuzanne.fr at the root base. It has no base-path override, no un-prefixed-link guard, no contact.php stripping and no cross-origin contact endpoint."
    - "PUB-03: The Studio has no 'Tableau de bord' tool, no Checklist inspector, and no siteDeployment or siteProductionRelease schema/structure entries. The dashboard's code, CSS, tests, coverage-matrix rows and SANITY_STUDIO_PREVIEW_URL env var are all gone. Studio 'open site' links point at https://atelierjacquelinesuzanne.fr."
    - "PUB-04: README.md has the exact Sanity webhook configuration, the 2-webhook constraint (edit one, delete the other) and the GitHub Pages shutdown steps. sanity/README.md tells Romane, in French, to use the native Publier button. CLAUDE.md and AGENTS.md describe the real two-workflow pipeline without GitHub Pages staging."
    - "Every local gate passes: npm run lint, npm run typecheck, root test:coverage, and sanity lint/typecheck/test:coverage/build."
  artifacts:
    - path: .github/workflows/ci.yml
      provides: "push-to-main/manual gates plus hosted Studio publish; never deploys the site"
    - path: .github/workflows/deploy-ovh.yml
      provides: "the only site deploy: Sanity webhook (auto) or manual dispatch (reviewer)"
    - path: sanity/editorial/siteUrl.ts
      provides: "PUBLIC_SITE_URL + publicSiteUrl(path), the single source for Studio links to the live site"
    - path: sanity/editorial/workflowLogic.ts
      provides: "filterDocumentActions: native actions for all types; singletons lose only unpublish/delete/duplicate"
    - path: tests/unit/ci-gates.test.ts
      provides: "CI gate-ordering + Sanity pin invariants (moved from deployment.test.ts)"
    - path: tests/unit/publishing-docs.test.ts
      provides: "README webhook filter/projection stay in lockstep with sanity/schemas and deploy-ovh.yml"
  key_links:
    - from: "Sanity webhook projection (README)"
      to: ".github/workflows/deploy-ovh.yml `repository_dispatch.types`"
      via: "event_type `production-deploy-requested`; publishing-docs.test.ts asserts the two are equal"
    - from: "README webhook GROQ filter"
      to: "document types declared in sanity/schemas/*.ts"
      via: "publishing-docs.test.ts derives the type list from schema files, so a new document type fails CI until the filter is updated"
    - from: "sanity/sanity.config.ts document.actions"
      to: "sanity/editorial/workflowLogic.ts filterDocumentActions"
      via: "resolveActions in workflow.tsx; must no longer strip `publish`"
    - from: "sanity/scripts/check-tsx-coverage.mjs"
      to: ".planning/quick/260811-kog-.../260811-kog-TSX-COVERAGE.md"
      via: "on-disk TSX set == coverage set == matrix set; deleted TSX files must leave the matrix in the same task or Studio test:coverage fails"
    - from: "ci.yml Studio publish step"
      to: "hosted Studio at atelier-jacqueline-suzanne.sanity.studio"
      via: "this very change only reaches Romane after ci.yml republishes the Studio on merge to main"
---

<objective>
Switch Romane to native Sanity publishing with direct OVH production deploys, and remove the in-house publishing system.

Today the public document types have no Publish button: `filterDocumentActions` strips it, and `sanity.config.ts` applies that through `document.actions`. Publishing goes through a custom "Tableau de bord" that batch-publishes, writes marker documents, and drives a two-stage pipeline: GitHub Pages staging first, then a second « Publier sur le site en ligne » click. The pipeline uses two webhooks, a checklist, and polling of the GitHub API. It is too complex and it has broken in use.

After this plan:
1. Romane clicks Sanity's own **Publier**.
2. One Sanity webhook fires `production-deploy-requested`.
3. deploy-ovh.yml runs every blocking gate and deploys to atelierjacquelinesuzanne.fr with no approval.
4. GitHub Pages is gone.
5. A push to `main` still never deploys the site. It runs ci.yml (gates plus the hosted Studio publish) and nothing more.

This keeps the existing behaviour: a code commit to main never deploys production. This plan does not change that. Task D must flag it to the user as a conscious choice.

Purpose: a publishing flow Romane can't get lost in, with less surface left to break.

Output:
- ci.yml (replacing deploy.yml), plus deploy-ovh.yml cleaned of staging narration
- the Studio with native actions and no dashboard, markers or checklist
- updated tests and coverage gates
- README / sanity/README / CLAUDE.md / AGENTS.md / PROJECT.md rewritten
- a lockstep test tying the documented webhook config to the code
- a list of the manual Sanity/GitHub steps for the user
</objective>

<execution_context>
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/workflows/execute-plan.md
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

## Ground rules (read before any task)

- Branch: the work targets `claude/tender-pasteur-nazw94`. Do not create or switch branches yourself. If the orchestrator runs you in a worktree, its branch is merged back by the orchestrator. Commands below use paths relative to the repo/worktree root; run them from there. Make one atomic commit per task (A, B, C), each leaving the repo green. Task D commits only if it fixes something.
- Do NOT touch secrets, GitHub settings or Sanity settings. Write instructions only (Task C, README).
- Dependencies are installed in the main checkout (`node_modules` and `sanity/node_modules`). A worktree will NOT have them: run `npm ci` and `npm ci --prefix sanity` first whenever either directory is missing.
- **Root Vitest needs Sanity env vars.** `tests/unit/page-models.test.ts` and `home-page-model.test.ts` import `src/lib/sanity.ts`, which calls `createClient` at import time and throws without a projectId. Always run root tests as `SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run test:coverage` (or `... npx vitest run <files>`). CI injects these from secrets.
- Baseline measured while planning: every gate is green. Root has 33 files and 719 tests, coverage 97.2/89.5/98.4/98.0 against thresholds 80/75/80/80. With only `src/lib` + `src/client` left, coverage is still about 98/87, so deleting the dashboard modules cannot breach the root threshold. Studio has 64 tests and global coverage 87.6/71.2/84.0/90.2 against thresholds 75/65/75/75. The Studio build takes about 7s. Root typecheck takes about 10s.
- **Do not Read files you are deleting.** Use `git rm` on them directly. Reading them only wastes context.
- `.env.example` and `sanity/.env.example` cannot be opened with the Read tool, because project settings deny `Read(.env.*)`. View them with `git show HEAD:<path>`. Delete them with `git rm`, or `rm` and then re-create with Write (see Task C).
- Playwright e2e is NOT run locally (CI runs it). Do not install browsers.
- Native validation already covers what the deleted checklist used to block. gallery.ts and edition.ts require publicationStatus, title, slug and images (`assetRequired`) plus the per-image rights. `localeTextField`/`localeStringField` default to `required = true`. So no new schema validation is needed. Do not add any.

## Decisions made while planning (Claude's discretion; record them in the SUMMARY)

- **One event_type, reused:** `production-deploy-requested`. deploy-ovh.yml's trigger is unchanged, and the user only edits the existing "Production deploy requested" webhook's filter and triggers. The URL, PAT header and projection stay as they are. The "GitHub Actions rebuild" webhook gets deleted.
- **Webhook filter = every Studio document type:** `_type in ["siteSettings", "homePage", "editionsPage", "aboutPage", "contactPage", "gallery", "edition", "exhibition"]`. `exhibition` is included per the brief. It isn't rendered yet, so for now a publish only triggers a harmless rebuild. `seo` and `imageRights` are object types and never fire.
- **ci.yml replaces deploy.yml.** It keeps all the gates and the hosted-Studio auto-publish (quick 260826-wx6). Dropping it would mean the Studio never receives this very change. Triggers: `push` to main plus `workflow_dispatch`. No `repository_dispatch`, no Pages, no SFTP.
- **Singletons keep their integrity guard (WR-01):** `publish` is restored, but `unpublish`, `delete` and `duplicate` stay stripped for siteSettings, homePage, editionsPage, aboutPage and contactPage. All other types, including gallery, edition and exhibition, get Sanity's actions untouched.
- **CollectionStatusBadge is kept.** It is independent of the dashboard: it only reads publicationStatus and draft/published. CompletenessBadge and the auto-open-checklist badge go with the checklist.
- **The manual-dispatch reviewer gate (`production-ovh`) is kept unchanged.** It only affects the developer's own manual runs.
- **public/contact.php CORS allowlist is removed.** It existed only so the GitHub Pages origin could POST cross-origin. Production is same-origin. The conditional assertion in contact-php.test.ts still passes.
- **Left as-is and flagged as follow-ups, not done here:** the github.io fallback for SITE_URL in astro.config.mjs and robots/sitemap. The OVH workflow sets SITE_URL explicitly, so only local/CI test builds use the fallback. Also left: scripts/launch-smoke-check.sh's Pages usage example.

## Reference: target shape of .github/workflows/ci.yml (Task A)

```yaml
name: CI and Sanity Studio publish
# (header comment: why this exists, that it NEVER deploys the site, how code reaches production)
on:
  push:
    branches: [main]
  workflow_dispatch: {}
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: false
jobs:
  verify-and-publish-studio:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Install dependencies, lint, and type-check
        uses: ./.github/actions/lint-typecheck-and-install
      - name: Build (test artifact, root base)
        run: npm run build
        env:
          SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
          SANITY_API_READ_TOKEN: ${{ secrets.SANITY_API_READ_TOKEN }}
      - name: Verify static artifact
        run: npm run test:artifact
      - name: Playwright e2e and Vitest coverage
        uses: ./.github/actions/e2e-and-unit-tests
      - name: Publish the hosted Sanity Studio
        env:
          SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}
        run: |
          (same missing-secret ::warning:: + exit 0, else `npm --prefix sanity run deploy`, as the step it replaces)
```

## Reference: Sanity webhook values README.md must state verbatim (Task C)

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
| PAT | fine-grained, repository `florianlepont/atelier-jacqueline-suzanne` only, permission `Contents: Read and write`, with an expiry date. Lives ONLY in this webhook's Authorization header, never in the repo or a workflow file. |

## Reference: root .env.example target content (Task C; overwrite the whole file)

```
# Sanity Content Lake — build-time only. Never exposed to the browser.
# Copy this file to .env and fill in real values (never commit .env).

# Sanity project ID (sanity.io/manage → project → Project ID)
SANITY_PROJECT_ID=

# Dataset name (e.g. "production")
SANITY_DATASET=

# Read-only (Viewer) API token for build-time fetches.
# Create via: npx sanity tokens add "Build-time Viewer (read-only)" --role=viewer --yes
# (run from the sanity/ Studio directory, requires an authenticated `sanity login` session)
SANITY_API_READ_TOKEN=

# Public origin used to generate canonical URLs, hreflang links and the sitemap.
# Optional for local builds (astro.config.mjs provides a fallback). The OVH
# production workflow (.github/workflows/deploy-ovh.yml) always sets
# https://atelierjacquelinesuzanne.fr explicitly.
SITE_URL=

# Contact form POST target. Optional — defaults to the same-origin path
# /contact.php, which is what the OVH production build uses. Leave unset:
# public/contact.php sends no CORS headers, so a build served from another
# origin could not read the endpoint's response.
PUBLIC_CONTACT_ENDPOINT=
```
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task A: Retire GitHub Pages: replace deploy.yml with ci.yml, make deploy-ovh.yml the only site deploy, and update the workflow tests (PUB-02)</name>
  <files>.github/workflows/deploy.yml, .github/workflows/ci.yml, .github/workflows/deploy-ovh.yml, .github/actions/lint-typecheck-and-install/action.yml, .github/actions/e2e-and-unit-tests/action.yml, tests/unit/deploy-ovh-workflow.test.ts, tests/unit/ci-gates.test.ts, tests/unit/deployment.test.ts, public/contact.php</files>
  <read_first>
    - .github/workflows/deploy.yml (only to copy the Studio-publish step's shell body, then delete)
    - .github/workflows/deploy-ovh.yml
    - .github/actions/lint-typecheck-and-install/action.yml
    - .github/actions/e2e-and-unit-tests/action.yml
    - tests/unit/deploy-ovh-workflow.test.ts
    - tests/unit/deployment.test.ts lines 1-25 and 1123-1233 only (the final describe block, "Sanity version pin and CI gate ordering (DIAGNOSTIC-05/06)")
    - public/contact.php lines 1-40
  </read_first>
  <behavior>
    - deploy-ovh-workflow.test.ts: the directory .github/workflows contains exactly ci.yml and deploy-ovh.yml (readdirSync). The old Pages workflow file must not exist.
    - deploy-ovh.yml triggers on workflow_dispatch and `repository_dispatch` with `types: [production-deploy-requested]`, and on nothing else. It has no `push:` and no `pull_request`.
    - deploy-ovh.yml keeps the trigger-conditional environment expression (`production-ovh-auto` for repository_dispatch, `production-ovh` otherwise), the SFTP guard before the first SFTP step, both SHA-pinned SFTP refs, sftp_only and hidden-file upload. It keeps `SITE_URL: https://atelierjacquelinesuzanne.fr`. Its whole text, comments included, contains no `ASTRO_BASE`. Its comment-stripped text never sets `PUBLIC_CONTACT_ENDPOINT`.
    - ci.yml triggers on push to main and workflow_dispatch only. It has no repository_dispatch, no `environment:`, no `pages: write`, no `id-token`, no deploy-pages / upload-pages-artifact action and no SFTP action. Its permissions are `contents: read`.
    - ci.yml's last step runs `npm --prefix sanity run deploy` with `SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}`, after both composite-action steps. It keeps the warn-and-exit-0 path when the secret is missing.
    - No workflow file contains the retired staging event name, `ASTRO_BASE`, `actions/deploy-pages` or `upload-pages-artifact`. Check whole files, comments included.
    - ci-gates.test.ts, the block moved verbatim in spirit:
      - sanity is pinned to exactly 6.6.0 in package.json and in the lockfile, and sanity.cli.ts has autoUpdates false
      - BOTH workflows delegate to both composite actions
      - the shared action runs root lint before root typecheck, and Studio lint, then test:coverage, then build
      - `npm ci` runs before `npm ci --prefix sanity`, before any script
      - in BOTH workflows, the build step comes after the install/lint/typecheck step
      - ci.yml's Studio publish comes after its e2e/coverage step
      - deploy-ovh.yml's "Upload build artifact" comes after its e2e/coverage step
  </behavior>
  <action>
**1. Create ci.yml and delete deploy.yml.**
- Create `.github/workflows/ci.yml` following the "target shape" reference in context.
- Copy the existing Studio-publish shell body (the `SANITY_AUTH_TOKEN` empty check with its `::warning::`, then `npm --prefix sanity run deploy`) unchanged from deploy.yml, minus its `if: github.event_name == 'push'` line. ci.yml has no other trigger that should skip it.
- Write a header comment explaining:
  - the GitHub Pages staging site was retired (quick 261003-idz)
  - this workflow gates every push to main and republishes the hosted Studio
  - it NEVER deploys the website
  - code on main reaches production only through deploy-ovh.yml (the next Sanity publish, or a manual dispatch)
- Then `git rm .github/workflows/deploy.yml`.

**2. deploy-ovh.yml: leave triggers, jobs, environment expression, SFTP steps, SITE_URL and the dotfile guard functionally unchanged.** Rewrite only the narration:
- **Header:** this is the only path that writes the production site. It starts automatically when the single Sanity webhook (configured per README "Sanity webhook") fires `production-deploy-requested` on any publish, unpublish or delete of a public document. Those runs use the reviewer-free `production-ovh-auto` environment, because Romane's own Publier click is the deliberate act. Manual `workflow_dispatch` runs use the reviewer-gated `production-ovh` environment. A push to main never runs this workflow. repository_dispatch always builds the default branch, so keep main production-ready (ci.yml gates every push).
- **Concurrency comment:** a burst of publishes leaves at most one running and one pending run, and the most recent pending run wins.
- **Gates comment:** say "same gates as ci.yml" instead of "mirrors staging".
- **Build comment:** keep the warning that the base-path override must stay unset, without writing the env var's literal name.
- **"Deploy complete" summary:** replace the stale sentence that says DNS is not cut over yet. Say the files are live at https://atelierjacquelinesuzanne.fr, and that the workflow never touches DNS.
- **"Deploy recap" comment:** the recap is what a human reads before approving a manual run.
- Remove every reference to the dashboard, marker documents, the `Mettre en production` button and GitHub Pages staging.

**3. Composite actions (`.github/actions/*/action.yml`):** update `description` and comments from "both deploy workflows / staging and production" to "ci.yml and deploy-ovh.yml". No step changes.

**4. contact.php:** delete the whole CORS block in `public/contact.php`. That is the `// CORS:` comment paragraph, the `$allowedOrigins` and `$origin` assignments, and the `if (in_array(...)) { ...header... }` block. Leave the `header('Content-Type: ...')` line above it intact. Production is same-origin, and this allowlist existed only for the retired Pages origin. Run `php -l public/contact.php`.

**5. tests/unit/deploy-ovh-workflow.test.ts:** rewrite it to the behaviors above.
- Drop the pages-workflow constant and its describe block.
- Add a ci.yml describe block and a "repository-wide workflow invariants" describe block.
- Use `node:fs` `readdirSync` / `existsSync` with paths resolved from `import.meta.url`, the same way the file already resolves paths.

**6. Move the gate checks out of deployment.test.ts.**
- Create `tests/unit/ci-gates.test.ts` holding the "Sanity version pin and CI gate ordering" checks. Retarget every deploy.yml read to ci.yml, and extend the ordering checks to deploy-ovh.yml as described in behavior.
- Delete that final describe block from `tests/unit/deployment.test.ts`, plus its now-unused `readFileSync` import. The rest of that file still tests sanity/editorial/deployment.ts until Task B deletes both.

**Naming rule.** Name the deleted Pages workflow file only inside tests/unit/deploy-ovh-workflow.test.ts, where its absence is asserted. Do not name it in ci.yml, deploy-ovh.yml, the composite actions, ci-gates.test.ts or any comment. Task D's sweep flags any other mention. The same rule applies to the retired staging event name.

**7. Run the verify command, then commit:** `ci(quick-261003-idz): retire GitHub Pages staging, ci.yml gates + Studio publish, OVH deploy on Sanity publish`.
  </action>
  <verify>
    <automated>php -l public/contact.php && test ! -e .github/workflows/deploy.yml && test "$(ls .github/workflows | sort | tr '\n' ' ')" = "ci.yml deploy-ovh.yml " && SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npx vitest run tests/unit/deploy-ovh-workflow.test.ts tests/unit/ci-gates.test.ts tests/unit/contact-php.test.ts && npm run lint && npm run typecheck && SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run test:coverage</automated>
  </verify>
  <done>
- Exactly two workflows exist: ci.yml (gates plus Studio publish, never deploys the site) and deploy-ovh.yml (the only site deploy: webhook or manual).
- deploy-ovh.yml behaves exactly as before for `production-deploy-requested` and manual runs. Its comments describe the native-publish flow.
- contact.php has no CORS headers and passes `php -l`.
- The workflow tests and ci-gates.test.ts pass, along with root lint, typecheck and full coverage.
- One commit.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task B: Studio: restore native Publish and delete the editorial dashboard, marker documents, checklist and their tests (PUB-01, PUB-03)</name>
  <files>sanity/sanity.config.ts, sanity/schemas/index.ts, sanity/schemas/structure.ts, sanity/schemas/gallery.ts, sanity/schemas/edition.ts, sanity/schemas/PublishedPageLinks.tsx, sanity/editorial/siteUrl.ts, sanity/editorial/workflow.tsx, sanity/editorial/workflowLogic.ts, sanity/editorial/OpenSitePage.tsx, sanity/editorial/CreditsManager.tsx, sanity/editorial/__tests__/EditorialShells.test.tsx, sanity/editorial/test/mocks.tsx, sanity/editorial/test/setup.ts, sanity/scripts/check-tsx-coverage.mjs, .planning/quick/260811-kog-corriger-les-constats-du-diagnostic-qual/260811-kog-TSX-COVERAGE.md, vitest.config.ts, tests/unit/workflow-logic.test.ts, tests/unit/document-completeness-contracts.test.ts, tests/unit/studio-site-url.test.ts, plus the deletions listed in the action</files>
  <read_first>
    - sanity/sanity.config.ts
    - sanity/editorial/workflowLogic.ts
    - sanity/editorial/workflow.tsx
    - sanity/editorial/OpenSitePage.tsx
    - sanity/schemas/PublishedPageLinks.tsx
    - sanity/schemas/structure.ts
    - sanity/schemas/index.ts
    - sanity/editorial/__tests__/EditorialShells.test.tsx
    - sanity/editorial/test/mocks.tsx and sanity/editorial/test/setup.ts
    - tests/unit/workflow-logic.test.ts
    - tests/unit/document-completeness-contracts.test.ts
    - .planning/quick/260811-kog-corriger-les-constats-du-diagnostic-qual/260811-kog-TSX-COVERAGE.md
    - sanity/editorial/CreditsManager.tsx: only the import block (lines 1-25) and around line 85
    - sanity/schemas/gallery.ts lines 30-50, sanity/schemas/edition.ts lines 22-35
  </read_first>
  <behavior>
    - filterDocumentActions(actions, type):
      - For the five singletons (siteSettings, homePage, editionsPage, aboutPage, contactPage), it removes only unpublish, delete and duplicate. `publish`, discardChanges, restore and anything else are kept in order.
      - For every other type (gallery, edition, exhibition, unknown), it returns the same array reference untouched.
    - resolveBadges: for gallery it prepends exactly one badge, CollectionStatusBadge, before prev. For any other type it returns prev unchanged (same reference).
    - collectionStatusBadge: all existing cases are unchanged (Archivée, En préparation incl. legacy isVisible false, Jamais publiée, Modifications non publiées, Sur le site, null for non-gallery).
    - publicSiteUrl:
      - `publicSiteUrl('/')` → `https://atelierjacquelinesuzanne.fr/`
      - `publicSiteUrl('/galleries/paysages/')` → `https://atelierjacquelinesuzanne.fr/galleries/paysages/`
      - `publicSiteUrl('en/galleries/x/')` → `https://atelierjacquelinesuzanne.fr/en/galleries/x/`
      - PUBLIC_SITE_URL has no trailing slash and equals the `SITE_URL:` value in .github/workflows/deploy-ovh.yml (a lockstep check)
    - OpenSitePage: the homePage link href is `https://atelierjacquelinesuzanne.fr/`. The gallery with slug `paysages` links to `https://atelierjacquelinesuzanne.fr/galleries/paysages/`.
    - The publicationStatus lockstep: the option `value`s of the `publicationStatus` field in sanity/schemas/gallery.ts AND edition.ts equal, as a set, the values in PUBLICATION_STATUSES in src/lib/sanity-validation.ts.
  </behavior>
  <action>
Per brief items 1 and 3.

**1. Delete with `git rm` (do not read these files first).**

Studio sources:
- sanity/editorial/EditorialDashboard.tsx
- sanity/editorial/EditorialDashboard.css
- sanity/editorial/dashboardLogic.ts
- sanity/editorial/deployment.ts
- sanity/editorial/pipelineView.ts
- sanity/editorial/releaseGate.ts
- sanity/editorial/useDeploymentPolling.ts
- sanity/editorial/checks.ts
- sanity/editorial/DocumentChecklist.tsx

Studio tests:
- sanity/editorial/__tests__/EditorialDashboard.test.tsx
- sanity/editorial/__tests__/DocumentChecklist.test.tsx
- sanity/editorial/__tests__/useDeploymentPolling.test.tsx

Schemas: sanity/schemas/siteDeployment.ts and sanity/schemas/siteProductionRelease.ts.

Studio env: sanity/.env.example. Its only variable, SANITY_STUDIO_PREVIEW_URL, is no longer read anywhere.

Root tests:
- tests/unit/dashboard-logic.test.ts
- tests/unit/deployment.test.ts
- tests/unit/pipeline-view.test.ts
- tests/unit/release-gate.test.ts
- tests/unit/editorial-checks.test.ts
- tests/unit/editorial-dashboard-css.test.ts
- tests/unit/editorial-dashboard-markup.test.ts

**2. Create `sanity/editorial/siteUrl.ts`.** It is a pure module with no imports. It exports `PUBLIC_SITE_URL` (the literal production origin without a trailing slash) and `publicSiteUrl(path: string): string`. That function joins the origin and the path with exactly one slash, stripping any leading slashes from the path. Add a short comment: this is the live production site, since GitHub Pages staging was retired, and it must match deploy-ovh.yml's SITE_URL (a test enforces this).

**3. Point the Studio's site links at production.**
- OpenSitePage.tsx: replace its local `siteUrl()` and the deployment import with `publicSiteUrl(path)`.
- PublishedPageLinks.tsx: replace its import and `pageUrl` base logic with `publicSiteUrl`, building the path as an optional `en/` prefix, then `galleries/<slug>/`. Keep all UI copy.

**4. CreditsManager.tsx:** remove the `baseId` import from the deleted module. Add a module-local `baseId(id)` that strips the `drafts.` prefix, matching the one MediaLibrary.tsx already has. No other change.

**5. Rewrite workflowLogic.ts.** Keep:
- the `EditorialTone` and `EditorialBadge` types
- `PUBLIC_SINGLETON_TYPES`, used by sanity.config.ts newDocumentOptions
- `collectionStatusBadge`, unchanged
- `filterDocumentActions` per behavior. Its comment should say native publishing is restored (quick 261003-idz), and that singletons still lose unpublish, delete and duplicate. Removing or cloning a singleton breaks the fixed-ID fetches in src/lib/sanity.ts (WR-01).

Delete everything else that no longer has an importer:
- PUBLIC_SITE_DOCUMENT_TYPES and PublicSiteDocumentType
- INTERNAL_SYSTEM_DOCUMENT_TYPES and InternalSystemDocumentType
- CHECKLIST_ENABLED_TYPES and checklistEnabledTypeSet
- PUBLIC_DOCUMENT_LABELS
- protectedDocumentTypes and publicSiteDocumentTypes
- isPublicSiteDocumentType and isInternalSystemDocumentType
- completenessBadge

Confirm with grep across sanity/ and tests/ that nothing still imports them.

**6. Rewrite workflow.tsx.**
- `resolveBadges` gives gallery `[CollectionStatusBadge, ...prev]` and every other type `prev`.
- `resolveActions` delegates to filterDocumentActions.
- Remove the auto-open-checklist badge, the completeness badge, the `useDocumentPane`/`useEffect`/`useRef` imports and the checks import.
- Replace the old "publishing happens from the dashboard" comment with one describing native publish.

**7. Update sanity.config.ts.** Remove the imports of DashboardIcon, EditorialDashboard, checklistInspector, the checklist type set and INTERNAL_SYSTEM_DOCUMENT_TYPES. Then:
- `tools` becomes the previous tools plus the existing Médiathèque media tool. The dashboard tool entry goes.
- `document.inspectors` becomes `[openSitePageInspector, ...prev]` for every type.
- `newDocumentOptions` keeps filtering only the PUBLIC_SINGLETON_TYPES out of global creation.
- Keep `actions: resolveActions` and `badges: resolveBadges`. Update the WR-01 comment so it describes the singleton guard plus native publish.

**8. Clean up the schemas.**
- schemas/index.ts: drop the two marker types.
- schemas/structure.ts: drop the two marker IDs from the excluded-list. Fix its doc comment so it only mentions the "Voir sur le site" inspector, with no Checklist.
- gallery.ts and edition.ts: replace the `publicationStatus` description's dashboard sentence with French copy that says the choice takes effect once the document is published with the « Publier » button, after which the live site updates automatically within a few minutes. Keep the existing second sentence about « En préparation » / « Archivée » keeping the content offline, using la collection / l’édition respectively.

**9. Update the Studio tests (EditorialShells.test.tsx).**
- Retarget the OpenSitePage hrefs to the production URLs in behavior.
- Replace the resolveBadges tests and drop the AutoOpenChecklistBadge describe block and the CompletenessBadge cases.
- Keep the CollectionStatusBadge cases, now at badges[0].
- Rewrite the resolveActions tests:
  - gallery: identity, publish and unpublish kept
  - siteSettings: publish, discardChanges and restore kept; unpublish, delete and duplicate removed
  - unknown type: identity

**10. Prune the test harness (mocks.tsx, setup.ts).** Remove members that have zero remaining references after the deletions. Grep each one across sanity/editorial and sanity/schemas, excluding test/. Candidates:
- the marker-document branch in `defaultFetch`
- historyStore / userStore in the state and in the reset function
- the `IntentButton`, `useHistoryStore` and `useUserStore` entries of the `sanity` mock
- documentPane and openInspector, plus the `sanity/structure` mock, if nothing imports `useDocumentPane` anymore
- client `listen` / `action`, if no remaining component uses them

Keep everything CreditsManager, MediaLibrary, OpenSitePage, SeoPreviewInput, StudioLayout and workflow tests still need.

**11. Coverage gates.**
- sanity/scripts/check-tsx-coverage.mjs: only the header comment changes, from "the exact same eight" to wording that doesn't hard-code a count.
- In the TSX-COVERAGE.md matrix, delete the DocumentChecklist and EditorialDashboard rows from BOTH tables. Change "huit" to "six" where it counts files.
- Append a short dated note (2026-10-03, quick 261003-idz) saying those two components were removed with the dashboard. Name them only as bare file names, without the `editorial/` prefix inside backticks. The gate's regex harvests every backticked editorial-path `.tsx` string, so a mention in that form would re-add them to the expected set and fail `test:coverage`.
- Root vitest.config.ts: remove the useDeploymentPolling.ts entry from coverage.exclude and its comment paragraph. Keep the test/** and home-carousel-runtime exclusions and the 80/75/80/80 thresholds. Do not lower any threshold, root or Studio.

**12. Root tests.**
- Rewrite tests/unit/workflow-logic.test.ts to the new workflowLogic API: the singleton list, the action matrix in behavior, the collectionStatusBadge cases.
- Create tests/unit/studio-site-url.test.ts covering publicSiteUrl, PUBLIC_SITE_URL and the deploy-ovh.yml SITE_URL lockstep.
- Retarget tests/unit/document-completeness-contracts.test.ts from the deleted checks module to the schema option lists in gallery.ts and edition.ts, as source-text parsing. Slice from `name: 'publicationStatus'` to the end of its `list: [ ... ]` and harvest `value: '...'`. Rewrite its header comment to explain the new pair being kept in lockstep.

**13. Run all gates in the verify command, then commit:** `feat(quick-261003-idz): native Sanity publish; remove editorial dashboard, deploy markers and checklist`.
  </action>
  <verify>
    <automated>for f in sanity/editorial/EditorialDashboard.tsx sanity/editorial/EditorialDashboard.css sanity/editorial/dashboardLogic.ts sanity/editorial/deployment.ts sanity/editorial/pipelineView.ts sanity/editorial/releaseGate.ts sanity/editorial/useDeploymentPolling.ts sanity/editorial/checks.ts sanity/editorial/DocumentChecklist.tsx sanity/schemas/siteDeployment.ts sanity/schemas/siteProductionRelease.ts sanity/.env.example tests/unit/deployment.test.ts tests/unit/dashboard-logic.test.ts tests/unit/editorial-dashboard-markup.test.ts; do test ! -e "$f" || { echo "still present: $f"; exit 1; }; done && test -f sanity/editorial/siteUrl.ts && npm --prefix sanity run lint && npm --prefix sanity run typecheck && npm --prefix sanity run test:coverage && npm --prefix sanity run build && npm run lint && npm run typecheck && SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run test:coverage</automated>
    <automated>! grep -rnE "dashboardLogic|editorial/deployment|DocumentChecklist|checklistInspector|siteDeployment|siteProductionRelease|SANITY_STUDIO_PREVIEW_URL|useDeploymentPolling|EditorialDashboard" sanity tests/unit vitest.config.ts --include=*.ts --include=*.tsx --include=*.mjs --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage --exclude-dir=.sanity</automated>
  </verify>
  <done>
- The Studio config has no dashboard tool, no checklist inspector and no marker types.
- Public documents get Sanity's native Publish. Singletons still can't be unpublished, deleted or duplicated.
- Studio links open https://atelierjacquelinesuzanne.fr.
- All dashboard, marker and checklist code, CSS, tests and env vars are deleted, with no dangling imports.
- The coverage matrix lists exactly the six remaining TSX files.
- Studio lint, typecheck, test:coverage (per-file and global gates) and build pass. Root lint, typecheck and test:coverage pass.
- One commit.
  </done>
</task>

<task type="auto">
  <name>Task C: Documentation: README webhook/transition guide, Romane's French guide, CLAUDE.md/AGENTS.md/PROJECT.md, stale Pages comments, plus a docs-lockstep test (PUB-04)</name>
  <files>README.md, sanity/README.md, CLAUDE.md, AGENTS.md, .planning/PROJECT.md, tests/unit/publishing-docs.test.ts, astro.config.mjs, .env.example, src/components/ContactForm.astro, src/lib/contact-form.ts, src/components/HomeCarousel.astro</files>
  <read_first>
    - README.md
    - sanity/README.md
    - CLAUDE.md
    - AGENTS.md
    - .planning/PROJECT.md: only the "## Key Decisions" table header and its last 2 rows (grep for the line number first)
    - .github/workflows/ci.yml and .github/workflows/deploy-ovh.yml as written by Task A, so the docs describe the real files
    - astro.config.mjs; src/components/ContactForm.astro lines 30-37; src/lib/contact-form.ts lines 45-62; src/components/HomeCarousel.astro lines 105-112
    - `git show HEAD:.env.example` (Read on .env.* is denied by settings)
  </read_first>
  <action>
Per brief item 4. Docs are in English except sanity/README.md, which is French and written for Romane, a non-technical editor.

**1. README.md**

Technical highlights: replace the "two deploy targets" bullet. The site now has one production target, OVH, updated automatically when Romane publishes in Sanity. CI gates every push, and a push never deploys the site.

Environment variables table:
- `ASTRO_BASE`: optional base path, defaults to `/`; no workflow sets it.
- `PUBLIC_CONTACT_ENDPOINT`: defaults to same-origin `/contact.php`. Leave it unset. contact.php sends no CORS headers.
- Delete the note about the Studio's own env var.

Testing section:
- Root Vitest covers `sanity/editorial/**/*.ts`, which is now `workflowLogic.ts` and `siteUrl.ts`.
- Drop the deleted modules and the hook exclusion.
- Update the Studio-suite examples.
- Typecheck gates run in `ci.yml` and `deploy-ovh.yml`.

Rewrite `## Deployments` with these subsections:

(a) **Overview table:**
- `ci.yml`: push to main and manual. Runs all gates, then publishes the hosted Studio. Never deploys the site.
- `deploy-ovh.yml`: Sanity webhook `production-deploy-requested`, deployed automatically through `production-ovh-auto`. Also manual dispatch, which pauses on the `production-ovh` Required reviewer. Builds with SITE_URL https://atelierjacquelinesuzanne.fr at the root base.
- Add the explicit sentence: "A push to `main` never deploys the site." Then explain that code on main ships with the next content publish (repository_dispatch always builds the default branch), or right away via `gh workflow run deploy-ovh.yml`. Keep main production-ready.
- Bursts of publishes: at most one run in progress plus one pending, and the latest wins.

(b) **Sanity Studio: published automatically.** Retarget to ci.yml. Keep the SANITY_AUTH_TOKEN one-time setup.

(c) **Production deploy: one-time setup.** Keep items 1-5 (OVH secret, both environments, webroot, Multisite). Replace item 6 with a **Sanity webhook** subsection containing the reference table from context, verbatim:
- exact filter line
- exact projection
- dispatches URL
- Create/Update/Delete
- drafts and versions unchecked
- headers
- PAT scope `Contents: Read and write` with an expiry date, living only in Sanity

Add the PAT-expiry warning: deliveries start failing with 401 in the webhook's attempts log and the site silently stops updating, so rotate the PAT before it expires.

(d) **Switching over (one-time, after merging this change)**, as an ordered checklist:
1. Merge into main. ci.yml republishes the Studio, which now has native Publier and no Tableau de bord. Nothing is deployed to the site.
2. Sanity's plan allows 2 webhooks and both are in use: edit **Production deploy requested** with the table values. Only the filter, triggers and drafts/versions change.
3. Delete **GitHub Actions rebuild**. It fed the retired staging site, and no workflow listens to its event anymore.
4. Unpublish GitHub Pages:
   - Settings → Pages, or `gh api -X DELETE repos/florianlepont/atelier-jacqueline-suzanne/pages`
   - optionally delete the `github-pages` environment: `gh api -X DELETE repos/florianlepont/atelier-jacqueline-suzanne/environments/github-pages`
5. Optional: from `sanity/`, after `npx sanity login`, run `npx sanity documents delete siteDeployment siteProductionRelease`. This removes the two orphaned marker documents. Their types are in neither the schema nor the webhook filter, so deleting them triggers nothing.
6. Verify:
   - publish a harmless edit in Studio
   - the Sanity attempts log shows a 2xx delivery
   - a "Deploy to OVH production" run appears, triggered by `repository_dispatch`, and finishes green without an approval pause (about 6 minutes)
   - the change is visible on https://atelierjacquelinesuzanne.fr

Do not name the deleted Pages workflow file anywhere in README.

(e) **How to run a production deploy manually.** Keep the existing 4 steps.

**2. sanity/README.md** (French, for Romane). Rewrite it completely. Delete the sections on the Tableau de bord, the checklist, the lot de publication, the site de test status, the round button and "Vérification technique du déclenchement GitHub". New outline:
- **Publier une modification:** open the fiche → edit (drafts auto-save) → click **Publier**. The live site https://atelierjacquelinesuzanne.fr updates by itself, usually within 10 minutes. Until Publier is clicked, nothing changes on the site. Several publications in a row are fine; the site always ends up with the latest published versions.
- **Si le bouton Publier est grisé:** a required field is missing (shown in red in the fiche). Warnings don't block.
- **Vérifier sur le site:** the « Voir sur le site » button opens the live page; wait a few minutes and reload if needed.
- **Visibilité d’une collection ou d’une édition:** the three statuses take effect once published. « Dépublier » in the menu next to Publier also takes a collection or édition off the site, but prefer « En préparation » / « Archivée ». The five pages (Accueil, À propos, Contact, Éditions, Réglages du site) cannot be dépubliées, supprimées or dupliquées, on purpose.
- **Collections photo:** keep the steps, ending with « Publier ».
- **Pages et réglages communs:** keep.
- **Référencement, crédits et droits:** crédits are required and Publier stays grisé without them. After using the « Crédits et droits » tool, open each modified collection and click Publier.
- **Agenda / Expositions:** published like any fiche; not yet shown on the site.
- **Dépannage:**
  - Publier grisé
  - a fiche marked « Modifications non publiées » → Publier
  - site not updated after about 15 minutes → tell the maintainer (Florian), giving the fiche and the time of publication
- **Développement local:** npm install / npm run dev / localhost:3333, with no .env paragraph.

The words "Tableau de bord", "Checklist", "site de test" and "Mettre le site à jour" must not appear.

**3. CLAUDE.md and AGENTS.md, Technology Stack area only.** Leave the GSD markers and other sections untouched.
- Status note: add a 2026-10-03 update. GitHub Pages staging and the Studio editorial dashboard were retired; publishing is native Sanity → direct OVH deploy.
- Delete the GitHub Pages row.
- OVH row: production host, live at https://atelierjacquelinesuzanne.fr since the 2026-08-13 cutover, deployed by deploy-ovh.yml on every Sanity publish. Drop "not yet cut over".
- Sanity row: Studio `sanity` 6.6.0, the exact pin.
- GitHub Actions row, plus in CLAUDE.md the ordered pipeline paragraph: describe both workflows in actual step order. Take it from the real files: shared composite gates → build → test:artifact → shared e2e/coverage → (ci.yml) Studio publish | (deploy-ovh.yml) dotfile guard → recap → artifact upload → environment-gated SFTP deploy.
- "Deferred to v1.x" paragraph: "static-only OVH hosting", without GitHub Pages.
- Cost table: delete the GitHub Pages row; the OVH row becomes "(production)".

**4. .planning/PROJECT.md:** append one Key Decisions row. It records native Sanity publishing with direct OVH deploy, and the retirement of the Pages staging site and the custom dashboard (2026-10-03, quick 261003-idz). It supersedes D-03 and the two-step staging → release flow. Rationale: the old system was too complex and broke in use. Note that a push to main still never deploys. Outcome: implemented; webhook and Pages steps done manually per README.

**5. Stale code comments only, no behavior change:**
- astro.config.mjs: SITE_URL comment = set explicitly by the OVH workflow, fallback only for local/CI test builds. ASTRO_BASE comment = optional subpath override no workflow sets; kept because the e2e helpers and the artifact verifier support base-prefixed builds.
- ContactForm.astro and contact-form.ts: replace the D-03/Pages justification with "same-origin by default; override only for a build served elsewhere (contact.php sends no CORS headers)".
- HomeCarousel.astro (around line 110): describe base-prefixed builds generically, without naming the deleted workflow file.
- Root `.env.example`: Read is denied, so `rm .env.example`, then Write it with the exact "root .env.example target content" from context. Shell `cat`/`grep` on `.env.*` files may also be denied; inspect them with `git show` / `git diff` instead.

**6. Create tests/unit/publishing-docs.test.ts** (node:fs, source-text, no new deps):
- (i) Derive the Studio document types: every non-index, non-structure `sanity/schemas/*.ts` file (non-recursive) whose source contains `type: 'document'`, taking its first `name: '...'`. The README line containing `_type in [` must list exactly that set: harvest the double-quoted names, then compare sorted arrays.
- (ii) README contains `{"event_type": "<T>"}`, where T is parsed from deploy-ovh.yml's `types: [...]`.
- (iii) README contains the dispatches URL, `Contents: Read and write`, and both webhook names, "Production deploy requested" and "GitHub Actions rebuild".
- (iv) None of README.md, sanity/README.md, CLAUDE.md or AGENTS.md contains the retired staging event name or SANITY_STUDIO_PREVIEW_URL.
- (v) sanity/README.md contains « Publier », and contains none of: Tableau de bord, Checklist, site de test, Mettre le site à jour, siteDeployment, siteProductionRelease.
- (vi) CLAUDE.md and AGENTS.md mention both ci.yml and deploy-ovh.yml, and contain neither "Staging host" nor "GitHub Pages (staging)".

**7. Run the verify command, then commit:** `docs(quick-261003-idz): native publish + direct OVH deploy guide, Sanity webhook config, Pages retirement`.
  </action>
  <verify>
    <automated>grep -qF '_type in ["siteSettings", "homePage", "editionsPage", "aboutPage", "contactPage", "gallery", "edition", "exhibition"]' README.md && grep -qF '{"event_type": "production-deploy-requested"}' README.md && { git diff HEAD -- .env.example; git show HEAD:.env.example; } | grep -qE '^\+?SITE_URL=$' && SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npx vitest run tests/unit/publishing-docs.test.ts && npm run lint && npm run typecheck && SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run test:coverage</automated>
    <human-check>Read README.md "Switching over" and the sanity/README.md « Publier une modification » section. Both should be followable without opening any other file. The French should be plain enough for Romane.</human-check>
  </verify>
  <done>
- README has the exact webhook config, the 2-webhook edit-one/delete-the-other instruction, the Pages shutdown commands, the PAT guidance and the "push to main never deploys" caveat.
- sanity/README.md is a short French guide built around the native Publier button.
- CLAUDE.md and AGENTS.md describe ci.yml and deploy-ovh.yml as they actually are.
- PROJECT.md records the decision.
- The stale Pages comments are fixed.
- publishing-docs.test.ts and the full root suite pass.
- One commit.
  </done>
</task>

<task type="auto">
  <name>Task D: Final verification: full gate run, stale-reference sweep, user hand-off (PUB-01..PUB-04)</name>
  <files>none expected (fix-ups only, limited to files already touched by Tasks A-C)</files>
  <read_first>
    - this plan's must_haves
    - the three commits from Tasks A-C: `git log --oneline -4` and `git show --stat HEAD~2..HEAD`
  </read_first>
  <action>
1. Confirm the tree is clean. Confirm the work sits on `claude/tender-pasteur-nazw94`, or on the orchestrator's worktree branch that gets merged back into it. Never create or switch branches yourself.

2. Run every gate from scratch, in this order:
   - npm run lint
   - npm run typecheck
   - `SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run test:coverage`
   - npm --prefix sanity run lint
   - npm --prefix sanity run typecheck
   - npm --prefix sanity run test:coverage
   - npm --prefix sanity run build

3. If the sandbox can reach Sanity, also run `SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run build` followed by `npm run test:artifact`. If the build cannot fetch content (no token or no network), record that in the SUMMARY instead of failing; CI covers it.

4. Run the two stale-reference sweeps in verify. Each must print nothing. Fix any hit in the file that owns it and amend nothing; make a separate `fix(quick-261003-idz): ...` commit. The `.planning/` history is intentionally excluded, as are the test files that assert absence.

5. Write the SUMMARY (per the execution template). It must include:
   - (a) the "Decisions made while planning" list from context
   - (b) the explicit flag that a push to `main` still does NOT deploy production, kept per the brief, with the consequence that code merged to main ships on the next Sanity publish
   - (c) the user's manual post-merge checklist, copied from README "Switching over": edit the Production deploy requested webhook, delete GitHub Actions rebuild, unpublish GitHub Pages (plus the optional environment deletion), optionally delete the marker documents, then the verification publish
   - (d) follow-ups not done: the SITE_URL github.io fallback in astro.config.mjs and robots/sitemap, and the Pages usage example in scripts/launch-smoke-check.sh
   - (e) that the contact.php CORS allowlist was removed
  </action>
  <verify>
    <automated>npm run lint && npm run typecheck && SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run test:coverage && npm --prefix sanity run lint && npm --prefix sanity run typecheck && npm --prefix sanity run test:coverage && npm --prefix sanity run build</automated>
    <automated>! grep -rnE "sanity-content-published|deploy\.yml|EditorialDashboard|dashboardLogic|pipelineView|releaseGate|useDeploymentPolling|DocumentChecklist|SANITY_STUDIO_PREVIEW_URL|upload-pages-artifact|actions/deploy-pages" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.planning --exclude-dir=.claude --exclude-dir=.agents --exclude-dir=.codex --exclude-dir=dist --exclude-dir=coverage --exclude-dir=.sanity --exclude-dir=test-results --exclude-dir=playwright-report --exclude=deploy-ovh-workflow.test.ts --exclude=publishing-docs.test.ts</automated>
    <automated>! grep -rnE "siteDeployment|siteProductionRelease" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.planning --exclude-dir=.claude --exclude-dir=.agents --exclude-dir=.codex --exclude-dir=dist --exclude-dir=coverage --exclude-dir=.sanity --exclude=README.md --exclude=publishing-docs.test.ts</automated>
    <human-check>After merging to main, follow README "Switching over" steps 2-6 (Sanity webhook edit/delete, GitHub Pages unpublish, verification publish). Claude cannot perform these.</human-check>
  </verify>
  <done>
- All seven local gates pass.
- Both sweeps print nothing.
- The SUMMARY lists the decisions, the push-to-main caveat, the user's manual steps and the follow-ups.
- Branch unchanged.
  </done>
</task>

</tasks>

<!-- planner-discipline-allow: dashboardLogic|editorial/deployment|DocumentChecklist|checklistInspector|siteDeployment|siteProductionRelease|SANITY_STUDIO_PREVIEW_URL|useDeploymentPolling|EditorialDashboard -->
<!-- planner-discipline-allow: sanity-content-published|deploy\.yml|EditorialDashboard|dashboardLogic|pipelineView|releaseGate|useDeploymentPolling|DocumentChecklist|SANITY_STUDIO_PREVIEW_URL|upload-pages-artifact|actions/deploy-pages -->
<!-- planner-discipline-allow: siteDeployment|siteProductionRelease -->

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Sanity webhook → GitHub API | A Sanity publish sends an authenticated repository_dispatch, carrying a fine-grained PAT in a header that is stored only in Sanity |
| GitHub Actions → OVH SFTP | The deploy job holds OVH_SFTP_PASSWORD and writes the live site |
| Studio editor → production | Any publish by a Studio editor now reaches production with no human approval |
| Browser → public/contact.php | Anonymous POSTs to the only server-side endpoint |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-idz-01 | Elevation of privilege | Webhook PAT | high | mitigate | README requires a fine-grained PAT scoped to the single repo with `Contents: Read and write` and an expiry. It lives only in the Sanity webhook header and never in the repo or workflows. Task C documents rotation. The existing test asserts every workflow `password:` line references `secrets.` |
| T-idz-02 | Tampering | deploy-ovh.yml auto path | high | mitigate | Every blocking gate still runs in the build job before the reviewer-free `production-ovh-auto` deploy: Studio lint/coverage/build/typecheck, root lint/typecheck, test:artifact, Playwright, Vitest coverage. ci.yml gates every push to main, so the main that repository_dispatch builds has already passed. Asserted by deploy-ovh-workflow.test.ts and ci-gates.test.ts |
| T-idz-03 | Tampering | Studio singletons | medium | mitigate | filterDocumentActions keeps stripping unpublish/delete/duplicate for the five singletons, so a second or missing siteSettings cannot break the fixed-ID fetches (WR-01). Covered by workflow-logic.test.ts and EditorialShells.test.tsx |
| T-idz-04 | Denial of service | Publish bursts / concurrent SFTP | medium | mitigate | The `ovh-production` concurrency group with cancel-in-progress false is kept. Bursts leave at most one running and one pending run (latest wins), and two uploads never race on the same webroot |
| T-idz-05 | Information disclosure | public/contact.php CORS | low | mitigate | The cross-origin allowlist for the retired Pages origin is removed (least privilege). Production is same-origin. `php -l` plus contact-php.test.ts |
| T-idz-06 | Tampering | SFTP action supply chain | high | mitigate | Both SHA-pinned `wlixcc/SFTP-Deploy-Action` refs stay unchanged, and the existing 40-hex pin assertion is kept in the rewritten test |
| T-idz-07 | Repudiation | Who shipped what | low | accept | Each deploy run records commit, trigger (repository_dispatch vs manual) and recap in the GitHub run summary, and Sanity keeps document history. No extra audit trail is needed for a single-editor site |
| T-idz-SC | Tampering | npm installs | low | accept | No packages are added or upgraded. The plan only uses already-installed dependencies |
</threat_model>

<verification>
- Two workflows only: ci.yml (gates + Studio publish, never deploys the site) and deploy-ovh.yml (Sanity webhook auto-deploy plus manual reviewer-gated dispatch, SITE_URL production, root base).
- The Studio exposes native Publish on all public types, keeps the singleton integrity guard, and has no dashboard, checklist or marker types.
- Root lint, typecheck and test:coverage pass. Sanity lint, typecheck, test:coverage and build pass.
- Docs match the code; publishing-docs.test.ts enforces the webhook filter and event_type lockstep.
- The stale-reference sweeps are clean outside `.planning/` history.
</verification>

<success_criteria>
- Romane can publish any public fiche with Sanity's own Publier button, and the live site updates with no further action once the webhook is reconfigured.
- No GitHub Pages deploy remains in the repo, and a push to main does not deploy the site.
- The dashboard, markers, checklist and their tests and env vars are fully removed, with all coverage gates still meeting their unchanged thresholds.
- README contains the exact Sanity webhook configuration and the full switch-over procedure, including the 2-webhook constraint.
</success_criteria>

<output>
Create `.planning/quick/261003-idz-publication-native-sanity-deploiement-di/261003-idz-SUMMARY.md` when done.
</output>
