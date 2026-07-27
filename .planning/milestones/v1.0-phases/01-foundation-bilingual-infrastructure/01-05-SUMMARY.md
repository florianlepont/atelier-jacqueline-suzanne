---
phase: 01-foundation-bilingual-infrastructure
plan: 05
subsystem: infra
tags: [github-actions, ci-cd, github-pages, sanity, webhook, deploy]

# Dependency graph
requires:
  - phase: 01-foundation-bilingual-infrastructure (Plan 02)
    provides: Conditional ASTRO_BASE base path in astro.config.mjs, GitHub Pages enabled (Source=GitHub Actions)
  - phase: 01-foundation-bilingual-infrastructure (Plan 04)
    provides: Full bilingual walking skeleton (BaseLayout, LanguageSwitcher, homepages, 404) with a GREEN Playwright+Vitest suite
provides:
  - .github/workflows/deploy.yml — build+test+deploy CI pipeline to GitHub Pages, triggered by push to main AND repository_dispatch (Sanity content publish)
  - Three GitHub Actions secrets (SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_READ_TOKEN) configured non-interactively via gh secret set
  - A live public staging site at https://florianlepont.github.io/ajs-website/ serving the real bilingual, Sanity-backed site over HTTPS
  - A working Sanity → GitHub repository_dispatch rebuild webhook (configured by Florian in the Sanity dashboard, confirmed live by triggering a real dispatch event and watching it deploy)
  - Bug fix: base-path-aware getSwitcherHref and locale-cookie redirect script, required for the switcher/redirect to work correctly under GitHub Pages' non-root base path
affects: ["Phase 2+ (all future content phases build/deploy through this same CI pipeline)", "Phase 5 (Launch & Domain Cutover, production OVH deploy is a separate future workflow)"]

# Tech tracking
tech-stack:
  added: ["GitHub Actions (actions/checkout@v4, actions/setup-node@v4, actions/upload-pages-artifact@v3, actions/deploy-pages@v4)"]
  patterns:
    - "Two-build CI pattern: build once with the default root base to run the existing Playwright+Vitest suite unmodified as a hard gate, then rebuild with ASTRO_BASE set to the deploy target's base path for the actual published artifact — avoids coupling the test suite's hardcoded root-relative assertions to the deploy target's URL structure"
    - "getSwitcherHref/redirect scripts strip the configured base path (import.meta.env.BASE_URL) before computing locale-relative slugs/paths, so switcher/cookie-redirect behavior is correct under any base path (root for OVH production, /ajs-website/ for GitHub Pages staging)"
    - "GitHub Pages deploy uses the job's ephemeral, OIDC-scoped GITHUB_TOKEN (via id-token: write) — no long-lived deploy credential exists for this staging target"
    - "Sanity webhook → repository_dispatch(event_type: sanity-content-published) → GitHub Actions, authenticated via a fine-grained, repo-scoped PAT (Contents:Read-only + Actions:Read-write) stored only in Sanity's webhook config, never in the repo"

key-files:
  created:
    - .github/workflows/deploy.yml
  modified:
    - src/lib/i18n-paths.ts
    - src/layouts/BaseLayout.astro

key-decisions:
  - "Rescoped per 01-CONTEXT.md D-12: this plan deploys to GitHub Pages, not an OVH staging subdomain (OVH's Free hosting tier cannot attach any subdomain). OVH remains the Phase 5 production target."
  - "CI builds twice: once with the default root base to run the existing (unmodified) Playwright+Vitest suite as the hard gate, once with ASTRO_BASE=/ajs-website/ for the artifact that actually gets deployed — avoids touching the locked e2e test file while still testing genuinely equivalent app behavior."
  - "Fixed a real bug (not anticipated by the plan) where a non-root base path broke both the language switcher's href computation and the locale-cookie redirect script — both assumed Astro.url.pathname/location.pathname were already base-relative, which only holds when base='/'. Fixed by stripping the configured base before computing slugs/paths in both places."
  - "GitHub Pages deploy itself needs no manual secret (uses the job's automatic, OIDC-scoped GITHUB_TOKEN via actions/deploy-pages); only the three Sanity build-time credentials needed to be added as repo secrets."
  - "The GitHub PAT for the Sanity→GitHub webhook and the Sanity webhook itself were both configured directly by Florian in their respective dashboards (GitHub fine-grained token creation has no API/CLI equivalent by design; Sanity's webhook UI was used directly rather than routing the PAT value through chat) — Florian confirmed the PAT is scoped to this repo only, Contents:Read-only + Actions:Read-write, and chose to keep reusing a value that had briefly been visible in chat earlier rather than rotate it (his informed decision given the narrow scope)."

requirements-completed: [I18N-01]

# Metrics
duration: ~35min
completed: 2026-07-06
---

# Phase 1 Plan 05: GitHub Pages CI/CD — Build, Test-Gate, Deploy, Sanity Rebuild Webhook Summary

**A two-build GitHub Actions pipeline (root-base test build → Playwright+Vitest hard gate → GitHub-Pages-base deploy build) publishing to a live `https://florianlepont.github.io/ajs-website/` staging site, wired to rebuild automatically on Sanity content publish via a `repository_dispatch` webhook — plus a real base-path bug fix in the language switcher and locale-redirect script that only surfaced once a non-root deploy base was actually exercised.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-06
- **Tasks:** 3/3 (Task 1 fully automated; Task 2 split between an automated part (secrets) and a genuine human-dashboard part (PAT + Sanity webhook) completed by Florian; Task 3 fully automated, including live verification)
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `.github/workflows/deploy.yml`: triggers on `push:[main]` and `repository_dispatch:[sanity-content-published]`; `permissions: {contents: read, pages: write, id-token: write}`; Node 22; `npm ci`; builds the Astro site twice (once at root base to run the existing Playwright+Vitest suite as a hard gate unmodified, once at `ASTRO_BASE=/ajs-website/` for the actual deploy artifact); `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`.
- Discovered and fixed a real bug (Rule 1): `getSwitcherHref` (src/lib/i18n-paths.ts) and the D-03 locale-cookie redirect script (src/layouts/BaseLayout.astro) both assumed `Astro.url.pathname`/`location.pathname` were already base-relative. Under GitHub Pages' non-root base, this produced a doubled path (`/ajs-website/ajs-website`) and a broken cookie-redirect target. Fixed by stripping the configured base (`import.meta.env.BASE_URL`) before computing slugs/paths in both places. Verified via manual build+href inspection before the fix (broken) and after (correct), then re-verified live in production.
- Set all three Sanity GitHub Actions secrets (`SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_READ_TOKEN`) non-interactively via `gh secret set`, reading values from the local gitignored `.env` (never echoed to terminal/logs). Confirmed present via `gh secret list`.
- Pushed to `origin/main` for the first time this phase (origin was 23 commits behind local `main` — no prior plan had been pushed). Watched the real Actions run go green through both builds, the test gate, and deploy (`gh run watch`).
- Verified the live staging site end-to-end:
  - `curl`: `/` and `/en/` both return 200 over enforced HTTPS; FR page has `lang="fr"`/"Accueil"/"Bienvenue", EN page has `lang="en"`/"Home"/"Welcome" — genuinely different copy; both pages' hrefs correctly read `/ajs-website/` and `/ajs-website/en/` (confirming the bug fix works in production); a nonexistent path returns Astro's custom bilingual 404 (not GitHub's generic one); `astro.config.mjs`/`package.json` are not publicly reachable.
  - A real headless-Chromium script (Playwright, run against the live URL, not localhost) confirmed: switcher click FR→EN navigates to `/ajs-website/en/` and sets `ajs_locale=en`; switcher click EN→FR navigates back; a pre-set `ajs_locale=en` cookie causes `/` to redirect to `/ajs-website/en/` on load. 7/7 live checks passed.
- Florian created the fine-grained GitHub PAT (scoped to this repo only, `Contents: Read-only` + `Actions: Read-write`) and configured the Sanity webhook (project `gwz8iug4`, dataset `production`, trigger on Create+Update, custom payload `{"event_type": "sanity-content-published"}`, `Authorization: Bearer <PAT>` + `Accept: application/vnd.github+json` headers, API version `v2025-02-19`) directly in the Sanity dashboard.
- Verified the GitHub-side half of the pipeline directly: fired a real `repository_dispatch` event (`gh api repos/florianlepont/ajs-website/dispatches -f event_type=sanity-content-published`) and confirmed it triggered a fresh Actions run (`28793319572`) that went green through the full build+test+deploy pipeline — proving the workflow correctly responds to exactly the payload shape Sanity's webhook sends. (The Sanity→GitHub leg itself — i.e., that Sanity's dashboard actually fires this webhook on a real content publish — is not independently observable by Claude; this rests on Florian's confirmation that the webhook is saved and enabled in the Sanity dashboard.)
- Re-ran the plan's exact secret-leak gate (`git grep -iE "SANITY_API_READ_TOKEN=|ghp_|github_pat_"`) after Florian's webhook setup: only a false-positive match against `.env.example`'s empty `SANITY_API_READ_TOKEN=` line and planning-doc mentions of the check pattern itself — no real secret value (Sanity token or GitHub PAT) is committed anywhere. Confirmed `.env` remains untracked and gitignored.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the build+test+deploy GitHub Actions workflow (+ base-path bug fix)** - `e7dce7f` (feat)
2. **Task 2: Configure Sanity GitHub secrets + rebuild webhook** - no code commit for the secrets themselves (repo-settings-only, via `gh secret set`); the fine-grained PAT + Sanity webhook were configured directly by Florian in the GitHub and Sanity dashboards (no local artifact to commit)
3. **Task 3: Verify live staging deploy end-to-end** - no additional code commit; verification performed against commit `e7dce7f` after pushing to `origin/main`

**Plan metadata:** committed separately after this SUMMARY (docs: complete plan)

## Files Created/Modified

- `.github/workflows/deploy.yml` - CI pipeline: two-build (root-base test / GitHub-Pages-base deploy) + Playwright+Vitest hard gate + `upload-pages-artifact`/`deploy-pages`, triggered by `push` and `repository_dispatch`
- `src/lib/i18n-paths.ts` - `getSwitcherHref` now strips the configured base path before computing the shared slug, so it works correctly under a non-root base (GitHub Pages) as well as root (local/OVH production)
- `src/layouts/BaseLayout.astro` - locale-cookie redirect script now receives `base` via `define:vars` and accounts for it when computing the redirect target

## Decisions Made

- Deploy target is GitHub Pages, per 01-CONTEXT.md D-12 (OVH Free hosting cannot host a staging subdomain); OVH remains Phase 5's production target using the SFTP facts recorded in Plan 02.
- CI builds the site twice (root base for testing, GitHub Pages base for deploying) rather than modifying the existing "locked" Playwright/Vitest suite to be base-aware — keeps the test contract stable while still testing genuinely equivalent behavior.
- GitHub Pages' own deploy step needs no manual secret (uses the job's automatic, OIDC-scoped `GITHUB_TOKEN`); only the three Sanity build-time credentials needed to be added as repo secrets, and those were set non-interactively via `gh secret set`.
- The fine-grained GitHub PAT and the Sanity webhook configuration were both done directly by Florian in their respective dashboards — GitHub provides no API/CLI path to create fine-grained PATs, and routing the PAT's value through chat was avoided in favor of Florian pasting it directly into Sanity's webhook UI himself.
- Florian chose to keep reusing a PAT value that had briefly been visible in chat earlier rather than rotate it, given its narrow scope (this repo only, Contents:Read-only + Actions:Read-write) — his informed decision, not re-flagged as an outstanding concern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Language switcher and locale-cookie redirect broke under a non-root base path**
- **Found during:** Task 1, while manually validating a build with `ASTRO_BASE=/ajs-website/` before committing the CI workflow
- **Issue:** `getSwitcherHref` computed the shared slug directly from `Astro.url.pathname`, and the D-03 redirect script computed the redirect target directly from `location.pathname` — both implicitly assumed these were already base-relative (true only when `base='/'`). With GitHub Pages' `/ajs-website/` base, this produced a doubled switcher href (`/ajs-website/ajs-website` instead of `/ajs-website/`) and a broken cookie-redirect target.
- **Fix:** `getSwitcherHref` now strips `import.meta.env.BASE_URL` from the current path before computing the slug. The redirect script now receives `base` via Astro's `define:vars` and accounts for it before building the redirect URL.
- **Files modified:** `src/lib/i18n-paths.ts`, `src/layouts/BaseLayout.astro`
- **Verification:** Manual build with `ASTRO_BASE=/ajs-website/` before/after the fix (broken → correct hrefs); re-verified live in production via `curl` (correct hrefs) and a headless-Chromium script against the live URL (switcher navigation + cookie set/redirect all pass, 7/7).
- **Committed in:** `e7dce7f` (Task 1 commit)

**2. [Rule 3 - Blocking, resolved without a checkpoint] Two-build CI design to avoid coupling the test suite to the deploy target's base path**
- **Found during:** Task 1, while validating that `npx playwright test` would actually pass against a base-prefixed build
- **Issue:** The existing Playwright suite hardcodes root-relative navigation (`page.goto('/')`, `'/en/'`) and a fixed `baseURL`/`webServer` config. Astro's local preview server, when `base` is set to a non-root path, serves content only under that base (`http://localhost:4321/` 404s; `http://localhost:4321/ajs-website/` serves) — so running the test gate against a base-prefixed build would fail for reasons unrelated to actual app defects.
- **Fix:** The workflow builds the site twice: once with the default root base (to run the existing test suite unmodified, exactly as it runs locally) as the hard gate, then again with `ASTRO_BASE=/ajs-website/` for the artifact that's actually uploaded/deployed. The two builds are behaviorally identical aside from baked-in base-prefixed URLs.
- **Files modified:** `.github/workflows/deploy.yml` (design decision, not a fix to an existing file)
- **Verification:** Full CI run (`28792305432`) went green through both builds, the test gate, and deploy; live site verified separately to confirm the base-prefixed build works correctly in production.
- **Committed in:** `e7dce7f` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug/Rule 1, 1 blocking/Rule 3), 0 architectural (Rule 4), 0 unresolved checkpoints remaining.
**Impact on plan:** No scope creep — both changes were required for the plan's own must_haves ("the staging site... serves the built bilingual site... FR at the base path, EN at /en/") to actually hold true once deployed to a non-root base path, which had never been exercised until this plan.

## Issues Encountered

- `origin/main` was 23 commits behind local `main` before this plan — no prior Phase 1 plan had been pushed to GitHub. This plan's push was the first, which is why the GitHub Actions workflow and GitHub Pages deploy had never actually run before this session. Not a blocker, just a fact worth recording: all of Plans 01-01 through 01-04's work reached GitHub for the first time as part of this plan's Task 3 push.

## User Setup Required

None remaining. Florian completed both genuinely manual dashboard steps:
- Created a fine-grained GitHub PAT scoped to `florianlepont/ajs-website` only (`Contents: Read-only`, `Actions: Read-write`)
- Configured the Sanity webhook (project `gwz8iug4`, dataset `production`) to POST to `https://api.github.com/repos/florianlepont/ajs-website/dispatches` with that PAT as a Bearer token, custom payload `{"event_type": "sanity-content-published"}`, on Create+Update triggers

## Threat Flags

None beyond what the plan's own threat model already covered (T-01-PAGES, T-01-PAT, T-01-SEC, T-01-SC, T-01-SPOOF). The Sanity webhook's "Secret" field was left blank per Florian's setup (GitHub's `/dispatches` endpoint doesn't verify an HMAC signature from Sanity, so this doesn't weaken the actual security boundary — the real access control is the fine-grained PAT's narrow scope, which is in place).

## Next Phase Readiness

- Phase 1 (foundation-bilingual-infrastructure) is now **fully complete**: all 5 plans done, the site is live at `https://florianlepont.github.io/ajs-website/`, bilingual routing + Sanity CMS + CI/CD are all wired end-to-end and verified in production.
- Phase 2+ (Portfolio, About/Contact, etc.) can build directly on this CI pipeline — any push to `main` automatically builds, test-gates, and deploys; any Sanity content publish automatically triggers a rebuild via the now-confirmed `repository_dispatch` webhook.
- Phase 5 (Launch & Domain Cutover) still needs its own separate workflow/plan for the real OVH production deploy — this plan's pipeline targets GitHub Pages staging only, by design.

---
*Phase: 01-foundation-bilingual-infrastructure*
*Completed: 2026-07-06*

## Self-Check: PASSED

- `.github/workflows/deploy.yml` — FOUND (`test -f`)
- Commit `e7dce7f` — FOUND (`git log --oneline --all | grep e7dce7f`)
- Live staging site — FOUND (`curl` 200 on `/` and `/en/`, HTTPS enforced per `gh api repos/florianlepont/ajs-website/pages`)
- CI run `28792305432` (push-triggered) — FOUND, conclusion: success
- CI run `28793319572` (repository_dispatch-triggered) — FOUND, conclusion: success
- `git grep -iE "SANITY_API_READ_TOKEN=|ghp_|github_pat_"` — only matches empty `.env.example` line and planning-doc mentions of the check itself; no real secret values committed
