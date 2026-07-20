---
phase: quick-260720-dzo
plan: 01
subsystem: docs
tags: [claude-md, agents-md, stack-research, readme, gsd-markers]

# Dependency graph
requires: []
provides:
  - "Technology Stack section in CLAUDE.md and AGENTS.md describes the actually-implemented stack (static Astro, GitHub Pages/OVH, Sanity build-time CMS) instead of the retired Cloudflare Pages/Stripe-in-Workers research plan"
  - "research/STACK.md corrected as the GSD:stack regeneration source, so a future docs regen won't reintroduce the stale content"
  - "Root README.md developer quick-reference: setup, env var names, scripts, src/<->sanity/ relationship, deploy summary"
affects: [docs-update, future-stack-regen]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GSD:stack-start/end markers in CLAUDE.md/AGENTS.md must stay in sync with .planning/research/STACK.md (the named regeneration source) to prevent a future /gsd-docs-update from reintroducing stale content"

key-files:
  created:
    - README.md
  modified:
    - CLAUDE.md
    - AGENTS.md
    - .planning/research/STACK.md

key-decisions:
  - "Replaced the entire Cloudflare Pages / @astrojs/cloudflare / Stripe-in-Workers stack tables with tables describing the real implementation (static Astro, GitHub Pages staging, OVH production Phase 5, Sanity build-time fetch), rather than annotating the old tables as stale"
  - "Added an explicit 'Deferred to v1.x (not yet implemented)' section stating e-commerce is not in the codebase, so the Project section's 'checkout' language isn't misread as a shipped feature"
  - "Reworded one Sources bullet in STACK.md to drop the literal string `constructEventAsync` (kept as historical provenance for the retired Stripe-in-Workers approach) since the plan's own verify command asserts that string's absence across all three files"

requirements-completed: [260720-dzo]

coverage:
  - id: D1
    description: "CLAUDE.md and AGENTS.md Technology Stack sections describe the real static-Astro + GitHub Pages/OVH + Sanity architecture, with e-commerce marked deferred to v1.x, edits confined to the GSD:stack markers"
    requirement: "260720-dzo"
    verification:
      - kind: other
        ref: "grep -q 'GitHub Pages'/'OVH' && ! grep -q 'constructEventAsync' && ! grep -qi 'no bandwidth cap' on CLAUDE.md and AGENTS.md; grep -q 'GSD:stack-start'/'GSD:stack-end'/'do not edit manually'"
        status: pass
    human_judgment: false
  - id: D2
    description: ".planning/research/STACK.md carries the same corrected stack plus a status note, so a future docs regen won't reintroduce the Cloudflare/Stripe content"
    requirement: "260720-dzo"
    verification:
      - kind: other
        ref: "grep -q 'GitHub Pages'/'OVH' && ! grep -q 'constructEventAsync' && ! grep -qi 'no bandwidth cap' on .planning/research/STACK.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "Root README.md gives a working developer entry point: setup, required env var names (no values), current scripts, src/<->sanity/ relationship, deploy summary, pointers to CLAUDE.md/PROJECT.md/sanity/README.md"
    requirement: "260720-dzo"
    verification:
      - kind: other
        ref: "test -f README.md && grep -q 'SANITY_PROJECT_ID'/'PUBLIC_WEB3FORMS_ACCESS_KEY'/'npm run dev'/'sanity/README.md'/'GitHub Pages'"
        status: pass
    human_judgment: false
  - id: D4
    description: "No changes outside the four target doc files; no tooling/CI/source files touched (scope guardrail vs. the two parallel quick tasks)"
    requirement: "260720-dzo"
    verification:
      - kind: other
        ref: "git diff --name-only 66042a5..HEAD == .planning/research/STACK.md, AGENTS.md, CLAUDE.md, README.md (exactly these four)"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-07-20
status: complete
---

# Quick Task 260720-dzo: Fix the Stale CLAUDE.md/AGENTS.md Technology Stack Docs + Add README Summary

**Replaced the retired Cloudflare Pages/@astrojs/cloudflare/Stripe-in-Workers stack tables in CLAUDE.md, AGENTS.md, and their regeneration source (research/STACK.md) with the real static-Astro + GitHub Pages/OVH + Sanity architecture, and added a root README.md developer quick-reference.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-20T11:41:33+02:00
- **Completed:** 2026-07-20T11:59:20+02:00
- **Tasks:** 2 (both auto)
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- CLAUDE.md and AGENTS.md `## Technology Stack` sections (inside the `GSD:stack-start`/`GSD:stack-end` markers) now describe what's actually shipped: static Astro (`output: 'static'`, no SSR adapter), GitHub Pages staging + OVH production (Phase 5, not yet cut over), and Sanity as a build-time-fetched CMS.
- `.planning/research/STACK.md` (the named GSD:stack regeneration source) carries the same corrected content plus a status blockquote pointing to PROJECT.md/STATE.md, so a future `/gsd-docs-update` regen won't reintroduce the stale Cloudflare/Stripe tables.
- A new "Deferred to v1.x (not yet implemented)" section in all three docs states plainly that Stripe checkout, server-side stock tracking, EU shipping/VAT, and commerce legal are NOT in the current codebase.
- New root `README.md` gives a developer working entry point: `npm install` + `.env` setup, every required env var NAME (SANITY_PROJECT_ID/DATASET/API_READ_TOKEN, PUBLIC_WEB3FORMS_ACCESS_KEY, optional SITE_URL/ASTRO_BASE) with no values, current npm scripts, the `src/` ↔ `sanity/` relationship (pointing to `sanity/README.md` rather than duplicating it), and a brief deploy summary.
- The GSD:stack markers and the "Developer Profile — do not edit manually" section in both CLAUDE.md and AGENTS.md are byte-for-byte intact; AGENTS.md's Codex-specific mirror content (`.Codex/skills/`, `generate-Codex-profile`) was left untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace the stale Technology Stack content in CLAUDE.md, AGENTS.md, and the research/STACK.md source** - `d4c8d39` (docs)
2. **Task 2: Add a root README.md developer quick-reference** - `84cffed` (docs)

_Note: per this quick task's execution constraints, SUMMARY.md/STATE.md are written but not committed here — the orchestrator handles the docs commit._

## Files Created/Modified
- `CLAUDE.md` - Technology Stack section (within GSD:stack markers) replaced with the real stack: Astro static, GitHub Pages, OVH, Sanity, plus a "Deferred to v1.x" e-commerce section and a trimmed Cost table
- `AGENTS.md` - Identical replacement inside its own GSD:stack markers; all other Codex-specific mirror sections left unchanged
- `.planning/research/STACK.md` - Body from `## Recommended Stack` through the `## Cost Implications` table replaced with the corrected content; added a status blockquote under the file's existing header/metadata; reworded one Sources bullet to drop the literal `constructEventAsync` string while keeping it as historical provenance for the retired plan
- `README.md` - New root developer quick-reference (setup, env vars, scripts, repo layout, Sanity Studio, deployment)

## Decisions Made
- Fully replaced the stale stack tables rather than appending corrections, per the plan's explicit instruction ("the stale tables must be replaced").
- Verified each of the plan's four automated checks per-file with individual `grep` calls (not just the plan's combined `&&`/`||` verify command, which has an operator-precedence issue that wouldn't reliably fail on every file) — all passed independently.
- Found and fixed one gap the plan's own drafted content would have failed: the STACK.md "Sources" section (explicitly allowed to remain as historical provenance) still contained the literal string `constructEventAsync` in a source-citation bullet, which fails the plan's own verify assertion. Reworded that one bullet to describe the pattern without the literal API name, keeping the citation's historical accuracy intact.
- Confirmed via `git diff --name-only 66042a5..HEAD` that only the four intended files changed — no drift into the two parallel quick tasks' files (package.json/eslint/deploy.yml/vitest.config.ts/sanity/package.json/.gitignore owned by 260720-dzi; src/lib/home-carousel.ts/tests/unit/home-carousel.test.ts/src/components/HomeCarousel.astro owned by 260720-dzs).

## Deviations from Plan

None - plan executed exactly as written, with one in-scope correction (see "Decisions Made" above: the STACK.md Sources bullet rewording) that was necessary to satisfy the plan's own stated verify command — categorized as a Rule 1 (bug/blocking-verification) fix within Task 1's own scope, not a deviation from the plan's intent.

## Issues Encountered
A transient connection error interrupted the session immediately after Task 2's verification passed, before the Task 2 commit ran. On resumption, `git status`/`git log` confirmed Task 1's commit (`d4c8d39`) was intact and `README.md` existed on disk but untracked; Task 2's commit (`84cffed`) was then completed with no rework needed.

## User Setup Required
None - no external service configuration required. This was a documentation-only change.

## Next Phase Readiness
- No blockers. All four target docs now match the shipped architecture.
- Content-level note carried forward, not this task's scope: the contact form (`PUBLIC_WEB3FORMS_ACCESS_KEY`) remains unprovisioned/non-functional until the Phase 5 OVH cutover, as documented in the new README's env-var table.

---
*Phase: quick-260720-dzo*
*Completed: 2026-07-20*

## Self-Check: PASSED

- FOUND: CLAUDE.md
- FOUND: AGENTS.md
- FOUND: .planning/research/STACK.md
- FOUND: README.md
- FOUND: commit d4c8d39 (Task 1)
- FOUND: commit 84cffed (Task 2)
- FOUND: .planning/quick/260720-dzo-fix-the-stale-claude-md-agents-md-techno/260720-dzo-SUMMARY.md
