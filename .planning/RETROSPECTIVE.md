# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-07-12 (formally closed retroactively 2026-07-27)
**Phases:** 7 (1, 2, 3, 4, 04.1, 04.2, 04.3) | **Plans:** 25 | **Tasks:** ~60

*This entry was written retroactively on 2026-07-27, reconstructed from git history, ROADMAP.md, and phase SUMMARY files rather than captured live — so "What Worked"/"What Was Inefficient" are lighter-touch than a live-session entry would be.*

### What Was Built
- Astro 7 static-site foundation (no SSR adapter — OVH-hosting-compatible from day one), built-in fr/en i18n routing, Playwright/Vitest harness, GitHub Actions CI/CD to GitHub Pages staging, Sanity CMS with a locale-aware `siteSettings` singleton (Phase 1)
- Self-serve-editable portfolio galleries with full-size lightbox viewing and per-project artist statements (Phase 2)
- Bilingual About page and a spam-protected contact form (Phase 3)
- Mentions légales, privacy/GDPR notice, CNIL-compliant cookie consent (Phase 4)
- A full rebrand + real hero-carousel/grid-toggle homepage replacing the placeholder page (04.1), site-wide Instagram link (04.2), and a homepage refinement pass — logo hover crossfade, single gallery entry point, icon toggle, mobile hero fix, three-line wordmark (04.3)

### What Worked
- Discovering early (Phase 1) that OVH's free tier can't attach a staging subdomain, and pivoting to GitHub Pages for staging without blocking on the production host decision, kept the whole rest of the project unblocked for seven more phases.
- Treating the mid-stream design-system import (04.1) as an explicit inserted phase rather than quietly reworking Phase 2's shipped identity kept the rebrand decision traceable in Key Decisions instead of silently overwriting prior work.

### What Was Inefficient
- The five shipped v1 requirements (PORT-01..03, ABOUT-01/02, I18N-01/02, CMS-01, CONT-01/02, LEGAL-01/03/05) sat in PROJECT.md's `### Active` section, unchecked, for the entire project's life until this retroactive close caught and fixed it — `/gsd-transition`'s Validated-section move was never run after Phase 1-4 shipped, since milestone/phase-transition tooling matured later in the project.
- Same root cause as the v1.3 retrospective already documents: this milestone had no formal `/gsd-complete-milestone` close at ship time, so it carried no MILESTONES.md entry, no phase archive, and no tag for over two weeks.

### Key Lessons
1. Run `/gsd-transition`'s Validated-section move as soon as a phase ships, not just at milestone close — a gap here can persist for the entire life of the project undetected, since nothing breaks when it's skipped.
2. When closing a milestone with one deliberately-unfinished phase (Phase 5 here), the tooling's incomplete-phase gate is the right place to record that decision explicitly (override_closeout + Known Gaps), not a reason to route around the close entirely.

### Cost Observations
- Not tracked (no telemetry captured for this milestone's original sessions).
- Retroactive closure effort: reconstructed scope/stats from git log (`grep`-based phase-tag boundaries) and phase SUMMARY files rather than live tracking.

## Milestone: v1.1 — Homepage Refinements

**Shipped:** 2026-07-13 (formally closed retroactively 2026-07-27)
**Phases:** 1 (6) | **Plans:** 1 | **Tasks:** 6

*Retroactively reconstructed — see the v1.0 entry above for why.*

### What Was Built
- Single unified carousel/grid toggle button (HOME-01), grid view's hero as the first grid tile itself (HOME-02), and the wordmark's transparent photo-cutout effect (HOME-03) — the foundation this same project's later, much more elaborate wordmark-tracking work (mirrored-peek seam, clamp-freeze fixes) built directly on top of.
- A live post-checkpoint follow-on folded into the same plan: mobile full-bleed hero fix, dashed swipe/keyboard progress nav.

### What Worked
- Reconciling a live-verification follow-on directly into the existing plan's SUMMARY.md (rather than spinning up a separate phase for what was found during the Phase 6 legibility checkpoint) kept the milestone's scope coherent without process overhead disproportionate to the fix size.

### What Was Inefficient
- Same milestone-archival lag as v1.0 and v1.2 — see those entries.

### Key Lessons
1. A single-plan, single-phase milestone (like this one) is still worth its own MILESTONES.md entry — scope size doesn't correlate with whether formal closure matters, especially when later work (this session's wordmark bug chain) directly builds on what shipped here.

### Cost Observations
- Not tracked (no telemetry captured for this milestone's original sessions).

## Milestone: v1.2 — Homepage Polish, Pre-Launch

**Shipped:** 2026-07-20 (formally closed retroactively 2026-07-27)
**Phases:** 4 (7, 8, 9, 10) | **Plans:** 9 | **Tasks:** ~15

*Retroactively reconstructed — see the v1.0 entry above for why.*

### What Was Built
- Instagram icon nav link, square mode-toggle border (Phase 7, HOME-04/05), plus a root-caused mobile full-bleed hero regression fix (HOME-06)
- Per-gallery description text replacing the generic byline, in both carousel and grid-hover form (Phase 8, HOME-07/08) — implemented directly on `main` ahead of the formal plan/execute cycle, then retroactively verified and closed via `/gsd-discuss-phase`
- Progressive image loading: priority hero load + blur-to-sharp transitions, lazy grid tiles, no blocking loader (Phase 9, HOME-09)
- A single shared `<SiteHeader>` component consolidating the homepage and About/Contact headers, plus a simplified one-link-plus-globe language switcher (Phase 10, HOME-10/I18N-04), including a UAT gap-closure for a duplicate back-home link overlapping the header logo

### What Worked
- Sequencing Phases 7→10 by blast radius (small contained fixes first, the higher-risk shared-header refactor last) meant Phase 7's toggle/header groundwork carried forward cleanly into Phase 10's consolidation instead of needing rework.
- Phase 8 shipping directly on `main` outside the plan/execute cycle, then getting retroactively verified via `/gsd-discuss-phase` rather than either ignored or force-fit into a plan it never had, kept the roadmap's completion record honest without discarding real, already-shipped work.

### What Was Inefficient
- Same milestone-archival lag as v1.0 and v1.1 — see the v1.0 entry above. This is the clearest case: four phases and 9 plans shipped over a full week (2026-07-13 → 2026-07-20) with zero formal milestone record until this retroactive close, seven days after v1.3 (which shipped *after* this milestone) already got one.

### Key Lessons
1. When a milestone ships out of order relative to when its formal close happens (as here — v1.3 closed before v1.2 did), reconstructing the correct chronological git range takes real effort (grep across multiple commit-tag conventions, cross-checking "start milestone"/"mark complete" marker commits) — closing at ship time avoids this entirely.

### Cost Observations
- Not tracked (no telemetry captured for this milestone's original sessions).

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

## Milestone: v1.4 — Editorial Design Consistency

**Shipped:** 2026-08-01 (both phases executed 2026-07-29)
**Phases:** 2 (15-16) | **Plans:** 7 | **Tasks:** 17

### What Was Built
- About page's title moved onto the shared `PageTitleHeader` component and its supporting layout was rebuilt around a sketch-chosen composition (sketch-014, Variant A): standalone lead paragraph, circular portrait bio-row, a pinned scroll-driven hero-photo reveal (shrinks to ~86% width), and a re-skinned two-column numbered-sections layout, with reduced-motion/mobile/no-JS fallbacks (Phase 15)
- 404 fallback page fully rebuilt as a custom, interactive concept: a pure `proximityToInterval` math module (unit-tested D-10 photosensitive-safety floor) driving a full-bleed photo pool that hard-cuts at a pointer/touch-proximity rate, AJS logo + "404" marker + bilingual message over a dimming scrim, with a constant-drift `prefers-reduced-motion` branch (Phase 16)
- A live, explicit user override at Phase 16's human-verify checkpoint raised the photo-pop rate cap from ≈3/sec to ≈6.7/sec — a knowing WCAG 2.3.1 tradeoff, reconciled back into the already-merged 16-01 plan/summary docs rather than left to drift silently out of sync with the shipped code
- A shared `PageTitleHeader.astro` overflow bug (affecting About, Contact, *and* Éditions, not just About) was caught by CI after the v1.4 PR merged to `main`, root-caused, and fixed site-wide

### What Worked
- **Sketch-first layout exploration, reused a second time**: the same process validated on the Contact redesign (sketch variants → user picks a named winner → implement) was applied to About with zero friction — the user picked Variant A on first review, no feedback rounds needed.
- **Pure-module extraction before wiring interactivity**: `pop-rate.ts`'s proximity→interval math was written and unit-tested as a standalone module *before* the pointer-driven engine was layered on top, which made the live D-10 cap override (350ms → 150ms) a one-constant change with instant test re-verification, not a risky live edit to entangled UI code.
- **CI as a real safety net, not just a formality**: the post-merge PageTitleHeader overflow regression was caught by GitHub Actions blocking `main`'s deploy, not by a human noticing a visual glitch — confirming the value of keeping e2e gates blocking even after a milestone's own phases report green.

### What Was Inefficient
- **v1.3's own retrospective lesson #1 ("add the milestone's versioned ROADMAP heading at creation time, not close time") was not applied to v1.4 either** — Phase 15/16 were added as bare `### Phase N` headings with no wrapping `### v1.4 ...` section, so `/gsd-complete-milestone`'s phase-scoping regex failed with "no phases found for milestone v1.4" until a heading was retrofitted manually at close time. Second consecutive milestone to hit this exact, already-documented gap.
- **New, more severe tooling gap**: even after adding the heading, `milestone.complete` still refused to close ("ROADMAP lists 1 unstarted phase(s), e.g. Phase 16") because `gsd-tools`' phase-number lookup mis-tokenizes directory `16-404-page-editorial-redesign` — the leading "404" reads as a digit-prefixed sub-phase segment, hiding the phase entirely from completion detection. This is a stronger case of the general phase-locator digit bug (previously known to affect single lookups) and required manual filesystem verification (reading `16-VERIFICATION.md` directly, which itself documents this exact tokenizer issue) plus `--force` to proceed. Phase 16's own `16-VERIFICATION.md` had already flagged this proactively — a good defensive pattern worth repeating for any future phase whose name starts with a digit.
- The pre-close audit's 7 open items (`knowledge-base.md` false positive + 6 stale, unexecuted 2026-07-22 quick-task plans) are the *exact same* items already acknowledged at the v1.3 close on 2026-07-23 — acknowledging without ever executing or deleting them means they will keep resurfacing at every future milestone close until someone actually resolves the underlying files.

### Patterns Established
- For any phase whose numeric directory prefix is followed by a string that itself starts with a digit (e.g. "16-404-page-..."), expect `gsd-tools` phase-lookup commands to misfire; verify phase completion via the filesystem (`*-VERIFICATION.md`, `*-SUMMARY.md` presence, ROADMAP.md checkbox) rather than trusting `init.manager`/`milestone.complete`'s JSON output, and be ready to pass `--force` at milestone close once that manual verification confirms the phase is genuinely done.
- Live, user-approved departures from a documented accessibility/safety constant (like the D-10 flash-rate cap) get written back into the *original* plan/summary docs as a dated addendum, not just mentioned in the newest plan — keeps the constant's history traceable from whichever doc a future reader opens first.

### Key Lessons
1. A versioned `## v{X.Y} ... — SHIPPED {date}` (or in-progress) ROADMAP heading needs to exist from the moment a milestone's phases are roadmapped, not retrofitted at close — this is the second milestone in a row to hit the same gap despite it being written up as a lesson after the first.
2. Phase directory names starting with a digit (dates, page names like "404", version numbers) break more than heading-matching — they break the phase-number lookup used by completion/verification tooling too. Either avoid digit-leading phase-name segments going forward, or budget for a manual-verify + `--force` close every time one occurs.
3. Acknowledging a stale pre-close audit item without ever acting on it just defers the same conversation to the next milestone close — if an item isn't going to be executed, consider deleting the dead plan file instead of re-acknowledging it indefinitely.

### Cost Observations
- Model mix / session count: not tracked for this milestone (no telemetry captured in this context).
- Notable: both phases (15 and 16, 7 plans total) were executed within a single day (2026-07-29) — 67 commits, 45 files changed, +6457/-158 lines — but the milestone wasn't formally closed/archived until 2026-08-01, a 3-day archival lag consistent with the pattern v1.3's retrospective already flagged for v1.1/v1.2.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | — | 7 | First milestone; established the Astro/Sanity/GitHub-Pages foundation and the phase-numbering convention (integer + INSERTED decimal phases) every later milestone reused |
| v1.1 | — | 1 | Smallest milestone to date (1 phase, 1 plan); first case of a live post-checkpoint follow-on folded directly into a plan's SUMMARY rather than spawning a new phase |
| v1.2 | — | 4 | First case of a phase (8) shipped directly on `main` outside the plan/execute cycle, then retroactively verified via `/gsd-discuss-phase` |
| v1.3 | — | 4 | First formal `/gsd-complete-milestone` run for this project; introduced explicit `## v{version}` ROADMAP headings and this RETROSPECTIVE.md |
| *(retroactive)* | — | — | v1.0/v1.1/v1.2 formally closed together on 2026-07-27, seven days after v1.3 — closing the archival-lag gap v1.3's own retrospective flagged |
| v1.4 | — | 2 | First milestone to hit the phase-locator digit-prefix bug hard enough to block automated close entirely (Phase 16 = "16-404-page-..."), requiring manual filesystem verification + `--force`; also the second consecutive milestone to skip the "add the versioned heading at creation time" lesson from v1.3 |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|--------------------|
| v1.0 | not separately measured (pre-dates per-milestone test tracking) | not separately measured | not tracked |
| v1.1 | not separately measured | not separately measured | not tracked |
| v1.2 | not separately measured | not separately measured | not tracked |
| v1.3 | 163 e2e + 126 unit (whole-suite, not v1.3-only) | not separately measured for v1.3 alone | 0 (no new dependencies added across Phases 11-14) |
| v1.4 | 9/9 `pop-rate.test.ts` (new) + 13/13 targeted 404/a11y e2e green at Phase 16 verification; full-suite counts not separately isolated for v1.4 | not separately measured for v1.4 alone | 0 (no new dependencies — pure Astro component/CSS/vanilla-JS work) |

### Top Lessons (Verified Across Milestones)

1. Direct-evidence re-verification (re-running commands, reading live data) over trusting prior written claims — first established in Phase 1's post-completion review, reconfirmed repeatedly through v1.3.
2. Add the milestone's versioned ROADMAP heading at phase-creation time, not close time, and avoid digit-leading phase-name segments — both v1.3 and v1.4 lost time to the same class of phase-locator tooling gap; see v1.4's retrospective above for the sharper digit-prefix variant.
