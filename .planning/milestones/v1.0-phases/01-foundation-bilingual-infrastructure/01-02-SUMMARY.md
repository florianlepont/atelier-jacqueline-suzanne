---
phase: 01-foundation-bilingual-infrastructure
plan: 02
subsystem: infra
tags: [astro, github-pages, ovh, sftp, ci-cd, staging]

# Dependency graph
requires:
  - phase: 01-foundation-bilingual-infrastructure (Plan 01)
    provides: Astro scaffold with i18n config (astro.config.mjs), Playwright/Vitest harness
provides:
  - Conditional base path in astro.config.mjs (ASTRO_BASE env var) supporting both GitHub Pages' /ajs-website/ subpath and an unprefixed OVH production root
  - GitHub Pages enabled (Source = GitHub Actions) as the Phase 1 staging deploy target
  - Confirmed OVH connection facts recorded for Phase 5's production cutover
affects: [01-05-PLAN.md (CI/CD wiring), Phase 5 (Launch & Domain Cutover)]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Conditional build-time base path via ASTRO_BASE env var, defaulting to root for local/OVH-prod builds"]

key-files:
  created: []
  modified:
    - astro.config.mjs

key-decisions:
  - "Phase 1 staging deploys to GitHub Pages (public repo, Source=GitHub Actions) instead of an OVH subdomain, because OVH's Free hosting tier cannot attach any additional domain/subdomain (multisite requires a paid tier) — see D-12."
  - "Repo was made public as a required precondition for free GitHub Pages hosting — intentional, approved by Florian, not a defect."
  - "OVH connection facts (SFTP, cluster129, atelihu) confirmed via the OVH control panel now and recorded here so Phase 5 doesn't need to re-derive them — see D-13."

requirements-completed: [I18N-01]

# Metrics
duration: ~15min (active work; excludes elapsed time waiting on the GitHub Pages checkpoint)
completed: 2026-07-06
---

# Phase 1 Plan 02: OVH Facts Recorded + GitHub Pages Staging Enabled Summary

**Astro's `base` now reads from an `ASTRO_BASE` env var (defaulting to `/`), and GitHub Pages is live as the Phase 1 staging target (Source=GitHub Actions, repo now public) — replacing the originally-planned OVH staging subdomain, which OVH's Free tier cannot support.**

## Performance

- **Duration:** ~15 min active work (plus a pause awaiting Florian's manual GitHub Pages toggle)
- **Completed:** 2026-07-06
- **Tasks:** 2 (1 auto, 1 checkpoint:human-action)
- **Files modified:** 1

## Accomplishments

- `astro.config.mjs` now sets `base: process.env.ASTRO_BASE || '/'`, so the same codebase builds correctly for GitHub Pages' project-page subpath (`/ajs-website/`) now, and for an unprefixed OVH production root later (Phase 5), controlled entirely by one env var at build time.
- Verified `npm run build` succeeds both with `ASTRO_BASE` unset (root base) and with `ASTRO_BASE=/ajs-website/` set (subpath base) — no other i18n config from Plan 01-01 was touched.
- GitHub Pages is enabled for `florianlepont/ajs-website` with Source = "GitHub Actions" (confirmed by Florian), ready for Plan 01-05's deploy workflow (`actions/deploy-pages`) to publish into.
- The repo was switched from private to public as part of enabling free GitHub Pages hosting — an intentional, approved change (public visibility is required for the free tier; no paid GitHub plan is in scope for this near-zero-budget project).
- Confirmed and recorded the OVH connection facts Phase 5 will need for the eventual production cutover (see below) — these are not used by this phase's CI, which targets GitHub Pages instead.

## OVH Connection Facts (for Phase 5 — D-13)

Confirmed via the OVH control panel during this plan's execution:

- **Plan tier:** OVH "Free hosting" (Hébergement Mutualisé), cluster `cluster129`, datacenter `eu-west-gra`, 100MB disk quota.
- **Deploy protocol:** SFTP enabled on port 22 (encrypted) — host `ftp.cluster129.hosting.ovh.net`, username `atelihu`, home directory `/home/atelihu`. Plain FTP (port 21) is also available, but SFTP is the preferred protocol for Phase 5's deploy wiring.
- **DNS:** The DNS zone for `atelierjacquelinesuzanne.fr` is managed at OVH itself — no external DNS provider involved.
- **Email:** The domain has an active email service (MX Plan + Zimbra mailbox). Phase 5's DNS cutover must preserve these MX/email records — no blanket DNS wipe.
- **Why this matters now:** OVH's Free hosting tier cannot attach any additional domain/subdomain (multisite requires a paid tier) — this is why Phase 1 staging moved to GitHub Pages (D-12) rather than an OVH `staging.` subdomain (originally D-07/D-08, now superseded). These facts are recorded here so Phase 5's production-cutover plan doesn't need to re-derive them from the OVH control panel again.

## GitHub Pages Staging Status (for Plan 01-05 — D-12)

- Settings → Pages → Source = **"GitHub Actions"** (confirmed by Florian; switched from the default "Deploy from a branch").
- The repository (`florianlepont/ajs-website`) is now **public** — a required precondition for GitHub Pages on the free plan. This was an intentional, approved decision made in the course of enabling Pages, not an accidental exposure.
- No branch or folder selection was needed; Plan 01-05's CI workflow will publish via the `actions/deploy-pages` action.
- Expected staging URL once Plan 01-05 wires the deploy workflow: `https://florianlepont.github.io/ajs-website/`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Record confirmed OVH connection facts (D-13) and add conditional base to astro.config.mjs** - `63c0675` (feat)
2. **Task 2: Enable GitHub Pages for this repo (D-12)** - No code commit (repo-settings-only change, performed directly by Florian in GitHub's UI; confirmed verbally, no local artifact to commit)

**Plan metadata:** (recorded in the following tracking commit)

## Files Created/Modified

- `astro.config.mjs` - Added `base: process.env.ASTRO_BASE || '/'` so builds can target either GitHub Pages' subpath or an unprefixed OVH production root

## Decisions Made

- Phase 1 staging target changed from an OVH subdomain to GitHub Pages (D-12), because OVH's Free hosting tier has no multisite/subdomain-attachment capability at all (confirmed via the control panel, not just a cert-provisioning delay as originally anticipated in research).
- The repo becoming public is accepted as a necessary side effect of using free GitHub Pages hosting — no sensitive data lives in the repo (no secrets committed; OVH credentials are documented as facts here, not as a password — the actual SFTP password is never pasted into chat, the repo, or any planning file, per the plan's threat model T-01-CRED).
- OVH SFTP (port 22) is the protocol Phase 5 should use for the production deploy, in preference to plain FTP (port 21), since it's already confirmed available on the current plan.

## Deviations from Plan

None - plan executed exactly as written (as rescoped by D-12/D-13 prior to this execution). Task 2 required a human-performed GitHub Settings change, which Florian completed and confirmed; no code changes were needed for Task 2 beyond the settings toggle itself.

## Issues Encountered

None. The one open item — OVH's Free tier being unable to host a staging subdomain — was discovered and resolved (via the D-12/D-13 rescope) before this execution began, not during it.

## User Setup Required

None further. GitHub Pages is already enabled (Source = GitHub Actions); the repo is public. No environment variables or dashboard configuration remain outstanding from this plan. Plan 01-05 will need to set `ASTRO_BASE=/ajs-website/` in its CI workflow when building for the GitHub Pages deploy step.

## Threat Flags

None beyond what the plan's threat model already covered (T-01-TLS, T-01-CRED, T-01-DNS) — the repo's move from private to public is a scope/visibility change, not a new attack surface, since no secrets or credentials are committed to the repo.

## Next Phase Readiness

- Plan 01-05 (CI/CD) can now target GitHub Pages as the Wave 4 deploy destination: build with `ASTRO_BASE=/ajs-website/`, then publish via `actions/deploy-pages`.
- Phase 5 (Launch & Domain Cutover) has the OVH SFTP connection details it needs (host, user, home dir, port) recorded here, plus the reminder to preserve existing MX/Zimbra email records during the eventual DNS cutover.
- No blockers for Plan 01-03 (Sanity CMS, running concurrently) or Plan 01-04 (bilingual UI slice) — this plan touched only `astro.config.mjs` and GitHub repo settings.

---
*Phase: 01-foundation-bilingual-infrastructure*
*Completed: 2026-07-06*
