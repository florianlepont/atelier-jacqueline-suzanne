# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.3 — Éditions

**Shipped:** 2026-07-23
**Phases:** 4 (11-14) | **Plans:** 11 | **Tasks:** 23

### What Was Built
- A new `edition` Sanity document type (mirroring `gallery.ts`), seeded with real content, self-serve editable by Romane without code (Phase 11)
- Build-time GROQ data-fetch layer + bilingual `/editions/` overview and `/editions/{slug}/` detail routes, sitemap entries, and a build-blocking "no commerce affordance" guard (Phase 12)
- A bilingual "Éditions" nav link wired into both `<SiteHeader>` call sites, present on every page (Phase 13)
- Null-safety hardening against malformed content, a schema-source commerce-language guard extension, a full closure audit re-running every direct check, and Romane's own hands-on Studio create/edit/publish/drag-reorder pass — independently cross-checked against the live Sanity dataset rather than accepted as a self-report (Phase 14)

### What Worked
- **Reuse-not-fork**: the commerce-language guard's token arrays/helper were extended to also scan the Studio schema source, rather than duplicated — kept one source of truth for "what counts as commerce language."
- **Direct-evidence discipline**: re-running build/test/e2e/artifact commands (not citing prior SUMMARY prose) at every verification pass caught real things — a 360-390px header-wrap regression (Phase 13), and that the entire milestone branch had never been merged to `main` (Phase 14).
- **Independent corroboration of human-verify claims**: Romane's Studio UAT approval was cross-checked against the live public Sanity dataset (publicationStatus/orderRank deltas) instead of trusted on the strength of the relay alone — the same pattern Phase 13 used, now used twice successfully.
- Code review caught and fixed a real Critical bug (hardcoded root-relative Éditions links that would 404 under the GitHub Pages base path) before it reached this milestone's close.

### What Was Inefficient
- The whole milestone was built and fully verified on a feature branch that was never merged to `main` — only discovered during Phase 14's cross-check. "Code complete and verified" and "actually live" turned out to be two separate gates that weren't both being watched.
- `ROADMAP.md`/`REQUIREMENTS.md` had no explicit versioned-milestone headings (a flat phase list instead), so `/gsd-complete-milestone`'s phase-scoping tooling couldn't automatically isolate "v1.3" — it either would have silently scoped to *all* 14 phases or hit its own unstarted-phase guard (Phase 5 has no directory). Had to insert a `## v1.3 ... — SHIPPED` heading manually before the archival tool would scope correctly.
- This was the *first* `/gsd-complete-milestone` run for the whole project, even though v1.1 and v1.2 had already shipped weeks earlier — milestone archival lagged actual delivery, so those two milestones still have no formal archive/tag of their own.
- `REQUIREMENTS.md` had silently accumulated all of v1/v1.1/v1.2/v1.3 in one file with only one requirement (`LAUNCH-01`) still open — the standard "delete and start fresh" milestone-close step would have destroyed that requirement's tracking if applied literally; it had to be carried forward explicitly instead.

### Patterns Established
- Extend existing guard/scan infrastructure (token arrays, helper functions) rather than forking a parallel copy, when adding a new scan target for the same category of risk.
- Grep-depth (ASVS L1) security re-verification is sufficient to close a phase's threat register without spawning an auditor subagent, *only* when the register was authored at plan time and no threat is open at/above the block-on severity — otherwise spawn the auditor even if the count is zero.
- `ROADMAP.md` needs an explicit `## v{version} ... — SHIPPED {date}` heading (or `<details><summary>` containing the version string) as soon as a milestone is scoped, not retrofitted at close time — the milestone-completion tooling's phase filter depends on literal heading text to scope correctly.

### Key Lessons
1. Add the milestone's versioned heading to `ROADMAP.md` at roadmap-creation time, not at close time — retrofitting it correctly requires understanding the archival tool's heading-matching regex, which is easy to get wrong under time pressure.
2. When `REQUIREMENTS.md` accumulates multiple milestones in one file, closing a later one must never blindly wipe the file — check for requirements still open from an earlier, unfinished milestone first and carry them forward explicitly.
3. "Verified and code-complete" is not the same gate as "merged and live" — track both, and don't assume the former implies the latter.
4. Independent, direct-evidence re-verification (re-running the actual commands, reading the actual live dataset) keeps finding real gaps that a prior SUMMARY's self-report would miss. Worth applying at milestone-close pre-flight audits too, not just phase-close verification.

### Cost Observations
- Model mix / session count: not tracked for this milestone (no telemetry captured in this context) — worth instrumenting before the next milestone close if cost tracking matters going forward.
- Notable: retroactive milestone closure (v1.1, v1.2, v1.3 all done in one sitting rather than at each milestone's own ship date) meant reconstructing scope/stats from git history and SUMMARY files rather than live tracking — accurate, but more effortful than closing at ship time would have been.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.3 | — | 4 | First formal `/gsd-complete-milestone` run for this project; introduced explicit `## v{version}` ROADMAP headings and this RETROSPECTIVE.md |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|--------------------|
| v1.3 | 163 e2e + 126 unit (whole-suite, not v1.3-only) | not separately measured for v1.3 alone | 0 (no new dependencies added across Phases 11-14) |

### Top Lessons (Verified Across Milestones)

1. Direct-evidence re-verification (re-running commands, reading live data) over trusting prior written claims — first established in Phase 1's post-completion review, reconfirmed repeatedly through v1.3.
