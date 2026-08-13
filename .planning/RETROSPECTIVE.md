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

## Milestone: v1.5 — Global Improvements & Bug Fixes

**Shipped:** 2026-08-03 (all 3 phases executed 2026-08-02 to 2026-08-03)
**Phases:** 3 (17-19) | **Plans:** 5 | **Tasks:** 13

### What Was Built
- Homepage carousel no longer pauses auto-advance on mere pointer hover (keyboard-focus pause and the manual toggle untouched), and the grid-mode intro paragraph shows in full with no substitute clamp (Phase 17, HOME-11/HOME-12)
- Gallery/Éditions thumbnail tiles lost their black border frame while keeping the loading-state background fallback, the site footer returned to gallery pages, and the detail-hero description clamp was replaced by an empirically-derived 700-character Sanity Studio limit locked against schema drift by a new unit test (Phase 18, PORT-04/05/06)
- A genuine, silently-shipped Astro `:global()` scoping bug that prevented Éditions row-hover from ever recoloring the shared header was root-caused and fixed, Contact's link rows gained breathing room without shrinking their hover-fill, and the halftone texture's true edge-to-edge bleed was restored via geometry-based containment instead of clipping — proven safe against Phase 16's prior `position: sticky` regression by an 18-test regression net written and proven green *before* the risky CSS was touched (Phase 19, EDN-09/UI-01/CONT-03)

### What Worked
- **Live empirical browser investigation during discuss-phase, before planning even started**: EDN-09's original CONTEXT-gathering assumption ("eyebrow/divider already work, only h1/intro don't") was wrong. Rather than plan around a guess, live Playwright MCP testing against a running preview server found the real root cause (a partial `:global()` wrap leaving a trailing selector permanently unmatchable) and confirmed the fix direction live before the planner ever ran — this is the single biggest de-risking move of the milestone, applied to the phase carrying the most regression history (UI-01/PageTitleHeader).
- **Regression-net-first for the highest-risk change**: Plan 19-02 wrote the full D-05 overflow/sticky-pin regression suite and proved it green on the *unmodified* tree first, then made the risky `overflow-x: clip` → geometry-containment swap, then proved the same suite green again including the previously-failing bleed-geometry block. This directly answered Phase 16's documented production-breaking history rather than hoping the same mistake wouldn't repeat.
- **Course-correction caught at discuss-phase, not execution**: the initial milestone-scoping read of the HOME-11 bug report ("pause on hover") was inverted from the user's actual intent; a single clarifying question during `/gsd-discuss-phase 17` caught it before CONTEXT.md was written, avoiding a wasted planning/execution cycle.
- **Proactively applying the v1.4 postmortem's own lesson**: the missing-`### v{X.Y}` ROADMAP heading bug (documented as a 2-milestones-in-a-row gap in v1.4's retrospective) was fixed *before* running `milestone.complete` this time, by inserting the heading pre-emptively based on the known pattern — `milestone.complete` succeeded on the first attempt, no digit-prefix or missing-heading failure at all (none of Phases 17/18/19 have digit-leading name segments either, so that half of the prior bug class didn't apply here).

### What Was Inefficient
- **Two transient infrastructure failures mid-execution**: a `gsd-verifier` agent hit a session/API rate limit during Phase 17, and a Wave 1 executor for Phase 19 (plan 19-01) hit the same "session limit" error on its first dispatch with zero commits made. Both were correctly identified as transient (not real task failures) and resolved by waiting/retrying, but cost real wall-clock time across the session.
- **The pre-close audit's 7 open items are, for the THIRD consecutive milestone, the exact same unresolved items** (the `knowledge-base.md` debug-index false positive, and 6 unexecuted 2026-07-22 Contact/Sanity-form quick-task plans) — first surfaced at the v1.3 close (2026-07-23), re-acknowledged at v1.4 (2026-08-01), and now re-acknowledged again at v1.5 (2026-08-03) with no change in status. Acknowledging without ever resolving has now visibly stopped working as a strategy — see Key Lessons.

### Patterns Established
- When a phase's own CONTEXT-gathering investigation contradicts its starting assumption about a bug's root cause, use live browser tooling (Playwright MCP against a running dev/preview server) to empirically confirm the real mechanism *before* handing off to the planner — a confirmed root cause and confirmed fix direction going into planning is worth the extra discuss-phase time, especially on a component with prior production-breaking history.
- For any plan touching a component/CSS area that has already caused a production regression once, write the regression-net test file FIRST, prove it passes on the pre-change tree (validating the net is real, not a tautology), and only then make the risky change — do not skip the "prove it was green before" step even under time pressure.

### Key Lessons
1. **Proactive tool-bug mitigation works and should become the default first move at milestone close**: checking for and inserting the `### v{X.Y} ... — SHIPPED {date}` ROADMAP heading *before* invoking `milestone.complete` (rather than waiting for the tool to fail and fixing it reactively) avoided the exact failure both v1.3 and v1.4 hit. Do this preemptively at every future milestone close, not just after seeing the error.
2. **A pre-close audit item acknowledged three milestones running without ever being executed or deleted is not being "deferred" — it is dead weight that should be resolved or removed.** The `knowledge-base.md` false positive and the 6 stale 2026-07-22 quick-task plans should be addressed directly (delete the superseded quick-task plan files; investigate whether `knowledge-base.md`'s debug-index format can be made auditor-recognizable) rather than acknowledged a fourth time at the next close.

### Cost Observations
- Model mix / session count: not tracked for this milestone (no telemetry captured in this context).
- Notable: all 3 phases (17-19, 5 plans, 13 tasks) executed within roughly 24 hours (2026-08-02 to 2026-08-03) in a single continuous session — 69 commits, 47 files changed, +5437/-132 lines — with same-day milestone close, the shortest phase-ship-to-milestone-close lag of any milestone to date.

---

## Milestone: v1.6 — Mobile Experience Redesign

**Shipped:** 2026-08-11 (Phases 20-21 executed 2026-08-03 to 2026-08-10 via the plan/execute cycle; Phases 22-23 resolved 2026-08-10/11 outside it)
**Phases:** 4 (20-23) | **Plans:** 21 (Phase 20: 6, Phase 21: 15, Phase 22: 0, Phase 23: 0) | **Tasks:** 56

### What Was Built
- Phase 20: a mobile-only nav menu (hamburger + `MobileNavPanel` dialog) replacing the desktop header bar, plus a per-visit random accent color, both via 6 plans and one live-UAT gap-closure round (HOME-13, HOME-16)
- Phase 21: a scroll-driven homepage journey (full-screen wordmark zooming into the first gallery's photo, per-gallery scroll-snap slides with on-arrival description reveal) built in `HomeCarousel.astro` across 15 plans, three full real-device UAT rounds, and a scoped code review — closing 9 confirmed root-caused defects across two gap-closure rounds (HOME-14, HOME-15)
- Outside that cycle: a direct commit (`6c51695`, 2026-08-10) introduced `MobileHomePrototype.astro` and made it the actual phone-width homepage renderer, superseding Phase 21's own `HomeCarousel` scroll-deck before its planned third UAT round could run, and delivered Phase 23 (About portrait placement, ABOUT-05/UI-02) in the same commit
- Phase 22 (Gallery/Édition Lightbox retirement) was cancelled before any planning began
- A milestone-close audit (`/gsd-audit-milestone`, run for the first time by explicit user choice rather than proceeding directly) found HOME-16's randomization silently orphaned by the same direct commit — confirmed live (three forced `Math.random` seeds, identical phone background every time) and independently re-confirmed via source read before being written up, then cancelled by the user rather than fixed

### What Worked
- **Real-device UAT rounds kept finding what the automated suite couldn't**: round 1 (4 gaps) and round 2 (5 more gaps, including an explicit correction of a labelled planning assumption) both shipped on top of a fully green Playwright suite. The pattern of labelling open design questions as named, correctable assumptions (A1-A9 by the end) rather than silently deciding them let real-device feedback correct exactly one (A4) without destabilizing the rest.
- **Worktree-isolated, wave-by-wave execution with independent post-merge gates** scaled cleanly to Phase 21's 15 plans across two gap-closure rounds, each wave independently verified (base commit checked via `merge-base`, never trusted from agent self-reports) before the next could fork.
- **The milestone audit earned its cost on the first real run.** A thorough manual reconciliation (STATE.md/ROADMAP.md/REQUIREMENTS.md all made internally consistent, git diffs read, claims spot-checked) still missed a live regression that only a cross-phase runtime integration check caught. This is the concrete case that justifies running `/gsd-audit-milestone` even when a milestone already looks fully reconciled on paper.
- **Proactively inserting the `### v1.6 ... — SHIPPED` ROADMAP heading before calling `milestone.complete`** (continuing v1.5's own fix) avoided that specific failure again — the tool still needed `--force` for the unstarted-phase guard, which is exactly the sanctioned override for a deliberately-cancelled phase, not a workaround.

### What Was Inefficient
- **A large share of Phase 21's own rigor now documents dead code.** 15 plans, 3 UAT rounds, and a code review went into `HomeCarousel`'s scroll-deck; the phone-width visitor never sees any of it today. The work wasn't wasted (the code is correct, tested, and still runs at desktop/tablet width), but the milestone's actual mobile-homepage outcome was decided and implemented entirely outside the process that was supposed to produce it — by a different tool (a Codex `/gsd:quick` session) and then a direct manual commit, neither going through discuss-phase, plan-phase, or verify.
- **The 6 stale 2026-07-22 Contact/Sanity quick-task plans were acknowledged as deferred for the FOURTH consecutive milestone close** (v1.3, v1.4, v1.5, now v1.6), with the identical "superseded, never executed" note each time. v1.5's own retrospective already flagged this as "dead weight that should be resolved or removed" rather than re-acknowledged — it got re-acknowledged again anyway. This paragraph will need writing a fifth time unless the 6 `PLAN.md` files are actually deleted before the next close.
- **`milestone.complete --force`'s automated STATE.md update produced wrong values** (`current_phase: 6` — no such phase in this milestone; a stale `stopped_at` from before Phase 21 even started executing) when the milestone had cancelled/no-directory phases mixed with normally-shipped ones. Caught and hand-corrected before commit, not silently left wrong.
- Repeated provider session-limit interruptions across the whole milestone (planning, execution, code review, verification all hit this at least once) — each recovered via the same pattern (inspect the worktree/main-checkout for partial progress, dispatch a fresh continuation agent with explicit context of what's already done, never restart from scratch) but real wall-clock cost across a milestone this long.

### Patterns Established
- When a phase's shipped implementation is later replaced by work done outside the plan/execute cycle, closing the original phase on the new authoritative commit via explicit "mechanical sync" (not a full retroactive re-verification) is a legitimate, fast path — but only when followed by a genuine cross-phase runtime integration audit before declaring the milestone done. Documentation-level reconciliation alone cannot catch a regression like HOME-16's; only checking actual runtime behavior can.
- Cancelling a requirement that was previously shipped and later found broken (HOME-16) is handled identically to cancelling one that was never built (Phase 22, PORT-07/EDN-10/EDN-11): update the traceability table, the ROADMAP line, STATE.md, and the audit's own resolution block — without erasing the original finding that justified the cancellation.

### Key Lessons
1. **A milestone that looks internally consistent at the documentation level can still ship a live regression.** This milestone's own HOME-16 finding is the concrete proof: STATE.md, ROADMAP.md, and REQUIREMENTS.md were all made mutually consistent through careful manual reconciliation, and the regression was still there, invisible to that process, until a runtime cross-phase check looked for it directly.
2. **"Acknowledge and defer" stops being an acceptable disposition after about three repeats.** The 6 stale quick-task plans are now a 4-milestone-running unresolved item. If they're genuinely superseded (three retrospectives in a row now say so), delete the `PLAN.md` files; if they're not, actually execute them. Do this before v1.7's close, not as a fifth acknowledgment.

### Cost Observations
- Model mix / session count: not tracked for this milestone (no telemetry captured in this context). Notably heterogeneous across tooling: Phases 20-21 and the milestone-close/audit work ran in this session; the `MobileHomePrototype` refinement quick task (`260810-qmm`) ran in a separate Codex `/gsd:quick` session; the component's initial introduction and Phase 23's delivery came from a direct manual commit with no recorded agent session at all.
- Git range: 8 days (2026-08-03 → 2026-08-11), 209+ commits, 130+ files changed, +21195/-407 lines — the longest and highest-churn milestone to date, driven almost entirely by Phase 21's two real-device UAT rounds and their gap-closure cycles.

---

## Milestone: v1.7 — Launch & Domain Cutover

**Shipped:** 2026-08-13 (Phase 5 executed 2026-08-11 to 2026-08-13, across 28 commits — the requirement itself deliberately deferred since v1.0's close on 2026-07-27, six milestone closes earlier)
**Phases:** 1 (Phase 5) | **Plans:** 6 | **Tasks:** 18

### What Was Built
- A PHP `mail()` contact endpoint (CORS-allowlisted, honeypot-gated, CRLF-hardened) replacing the never-provisioned Web3Forms integration, finally closing CONT-01's delivery gap open since Phase 3
- A manual-dispatch-only, environment-gated `deploy-ovh.yml` GitHub Actions workflow (13 locked CI assertions) and a rehearsed DNS cutover runbook with a named rollback trigger
- The actual production cutover: apex/`www` `A` records repointed to OVH hosting, MX/SPF/NS provably byte-identical before and after, TTLs lowered to 60s in advance and restored to 3600s two days after
- Full post-cutover verification: an automated smoke check (15/15 pass) plus human-verified real mail delivery (landed in the inbox), cross-origin submission from the permanently-alive GitHub Pages staging site, and a confirmed browser sweep that the old Myportfolio site is gone
- Given its own milestone (v1.7) rather than folded retroactively into v1.0, since v1.0 through v1.6 were all already fully shipped and tagged by the time this phase finally executed

### What Worked
- **The deliberately-deferred-requirement pattern held for six consecutive milestone closes without drifting into ambiguity.** Every one of v1.0 through v1.6's PROJECT.md/STATE.md entries explicitly re-stated "Phase 5 remains open, deliberately deferred, not part of this milestone" rather than letting it go quiet — when the maintainer was finally ready, there was no reconstruction work needed to figure out what was left or why.
- **The DNS runbook's rollback-trigger design (immediate for MX/mail, bounded-troubleshooting-window for everything else) never had to be exercised**, but having it pre-written meant the cutover proceeded without any live triage-under-pressure decision-making — every failure class was already pre-classified as fix-forward or rollback before the edit happened.
- **A targeted follow-up question (which mail folder) before writing the human-verify evidence into the record**, rather than accepting a terse "pass" at face value, closed the one gap (inbox vs. spam) the plan's own threat model specifically flagged as needing a real answer, not an assumption.

### What Was Inefficient
- **The 6 stale 2026-07-22 Contact/Sanity quick-task plans were acknowledged as deferred for the SIXTH consecutive milestone close** (v1.3, v1.4, v1.5, v1.6-initial, v1.6-finalization, now v1.7), still with the same "superseded, never executed" note. v1.6's own retrospective explicitly predicted this needed resolving "before v1.7's close, not as a fifth acknowledgment" — it happened anyway, for a sixth time. The `PLAN.md` files were still not deleted.
- **`milestone.complete`'s automated STATE.md update again produced wrong values** (`current_phase: 7` — no such active phase; `total_phases`/`total_plans` recomputed from every un-archived phase directory still on disk, including v1.6's Phase 20/21, not just this milestone's Phase 5) — the same class of bug v1.6's retrospective already flagged. Caught and hand-corrected before commit.
- **`milestone.complete "v1.7"` initially failed with "no phases found"** because Phase 5 had never had ANY milestone-versioned ROADMAP heading in its 6-milestone-long life as a standalone, deliberately-deferred entry — unlike prior instances of this same class of bug (v1.3, v1.4), this wasn't a heading omitted at close time, it was a phase that had simply never been assigned to a milestone at all until this session decided (with the user's input) what to call it.
- **The version number itself required a mid-task correction.** The initial plan was to "finish v1.6's closure," based on an incomplete read of the state — v1.6 turned out to already be fully shipped and tagged. Only after digging into git tags, `MILESTONES.md`, and the archived `ROADMAP.md`'s own phase-detail headings did it become clear Phase 5 needed its own new version (v1.7), not a reopened v1.6. Cost real turns; a git-tag/MILESTONES.md check at the very start of the "what's next" investigation would have caught this immediately.

### Patterns Established
- A requirement can be deliberately deferred out of every milestone close in a project's history and still close cleanly, as long as each close explicitly re-states its deferred status (not just its absence) — this is what made a 6-close-later resumption possible with zero ambiguity about what was left or why.
- When resuming a long-deferred phase, check `git tag -l` and `MILESTONES.md` before assuming which milestone version it belongs to — a phase's number does not tell you whether the milestones around it are still open or already shipped.

### Key Lessons
1. **A prediction repeated five times without the underlying action being taken stops being a prediction and becomes a known, accepted steady state.** The 6 stale quick-task plans have now survived six consecutive close cycles specifically because "acknowledge and defer" is cheaper than "delete or execute," every single time, for both the tool and the user. If this project starts a v1.x milestone next, this is the moment to actually delete the 6 files — carrying the same acknowledgment into a seventh cycle would be the tool actively encoding "we know this is dead weight and choose not to clean it up" as a permanent, repeated cost.
2. **`milestone.complete`'s STATE.md auto-update needs a "scope to this milestone's own phases only" fix**, not another hand-correction. This is the second consecutive milestone where its computed `total_phases`/`current_phase` values were wrong and had to be manually fixed before commit — a tooling gap, not neglect, but one that's now shown up twice.

### Cost Observations
- Git range: 2026-08-11 → 2026-08-13 (Phase 5's own commits), though the requirement itself spans 2026-07-27 → 2026-08-13 (18 days deliberately deferred, spanning 6 other milestone closes) — by far the longest deferred-to-shipped gap of any requirement in this project's history.
- Smallest milestone by phase/plan count to date (1 phase, 6 plans) but with unusually high human-in-the-loop wall-clock cost relative to its size: two blocking `checkpoint:human-verify` gates (DNS go-ahead, launch acceptance), each requiring real-world waiting (DNS propagation, an actual email round-trip) that no amount of automation could shorten.

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
| v1.5 | — | 3 | First milestone to proactively fix the missing-ROADMAP-heading bug *before* running `milestone.complete` (based on v1.4's own postmortem) instead of hitting it and recovering — zero tool failures at close. Also the first milestone where a discuss-phase used live Playwright MCP browser investigation to empirically confirm a bug's root cause before planning began. Third consecutive milestone with the same 7 unresolved pre-close audit items — see Key Lessons above. |
| v1.6 | — | 4 | First milestone where `/gsd-audit-milestone` was actually run (by explicit user choice) rather than proceeding straight to close — and the first time it caught something a careful manual reconciliation had missed (HOME-16, silently broken by out-of-band work). First milestone where a shipped, verified phase (21) was later superseded by work done entirely outside the plan/execute/verify cycle before its own close. First milestone to cancel a previously-shipped, previously-verified requirement (HOME-16) rather than only ever cancelling unbuilt ones. Fourth consecutive milestone with the same 6 unresolved stale quick-task items (7 at v1.3/v1.4/v1.5, now 6 since the `knowledge-base.md` false positive stopped being separately counted) — v1.5's own retrospective predicted this would keep happening unless actually resolved; it did. |
| v1.7 | — | 1 | First milestone consisting of a single requirement deliberately deferred out of every prior milestone close (six of them) since v1.0 — resumed cleanly because each close explicitly re-stated its deferred status rather than letting it go quiet. First milestone whose version number itself required mid-task correction (initially assumed it would close v1.6, which turned out to already be shipped and tagged). Sixth consecutive close with the same 6 unresolved stale quick-task items — the fifth-time prediction that this "needs resolving before v1.7's close" did not hold. Second consecutive milestone where `milestone.complete`'s automated STATE.md update produced wrong values, requiring manual correction. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|--------------------|
| v1.0 | not separately measured (pre-dates per-milestone test tracking) | not separately measured | not tracked |
| v1.1 | not separately measured | not separately measured | not tracked |
| v1.2 | not separately measured | not separately measured | not tracked |
| v1.3 | 163 e2e + 126 unit (whole-suite, not v1.3-only) | not separately measured for v1.3 alone | 0 (no new dependencies added across Phases 11-14) |
| v1.4 | 9/9 `pop-rate.test.ts` (new) + 13/13 targeted 404/a11y e2e green at Phase 16 verification; full-suite counts not separately isolated for v1.4 | not separately measured for v1.4 alone | 0 (no new dependencies — pure Astro component/CSS/vanilla-JS work) |
| v1.5 | 289 e2e + 276 unit (full whole-suite, post-Phase-19 merge) — up from 267 e2e at Phase 18; 18 new regression tests in `page-title-header-bleed.spec.ts` alone (Phase 19) | not separately measured for v1.5 alone | 0 (no new dependencies across Phases 17-19 — pure Astro/CSS/vanilla-JS + Sanity schema validation work) |
| v1.6 | 334 e2e + 349 unit (full whole-suite, at milestone close) across Phases 20-21; Phase 21 alone added 21 new pure-function unit tests (`computeIntroProgress`/`computeIntroScrubState`/`computeArrivalRevealed` etc.) and dozens of e2e cases across two gap-closure rounds — but a real regression (HOME-16) still shipped past all of it, since no case in the suite ever ran at phone width for that specific assertion | not separately measured for v1.6 alone | 0 (no new dependencies across Phases 20-21 or the `MobileHomePrototype` direct commit — pure Astro/CSS/vanilla-JS work throughout) |
| v1.7 | 559 unit tests passing (full whole-suite, at milestone close); `contact-php.test.ts`'s 10 source-invariant assertions and `deploy-ovh-workflow.test.ts` cover the new production surface; `launch-smoke-check.sh` (15 probes) is this milestone's own dedicated live-verification tool, run against production itself rather than a mocked/staged environment | not separately measured for v1.7 alone | 0 (no new npm dependencies — PHP `mail()` is OVH's built-in runtime, the deploy workflow uses one existing commit-pinned third-party GitHub Action already evaluated in RESEARCH.md) |

### Top Lessons (Verified Across Milestones)

1. Direct-evidence re-verification (re-running commands, reading live data) over trusting prior written claims — first established in Phase 1's post-completion review, reconfirmed repeatedly through v1.3, reconfirmed again in v1.5 via live Playwright MCP root-causing of EDN-09 before planning, and reconfirmed once more in v1.6 when a milestone audit's own live-verified regression claim was independently re-checked via source read before being trusted.
2. Add the milestone's versioned ROADMAP heading at phase-creation time, not close time, and avoid digit-leading phase-name segments — both v1.3 and v1.4 lost time to the same class of phase-locator tooling gap; v1.5 and v1.6 both broke the streak by fixing the heading proactively at close time instead, based on the documented lesson — see each milestone's retrospective above.
3. **A prediction that a stale item will "keep recurring unless actually resolved" needs to be acted on, not just repeated.** v1.5's retrospective explicitly predicted the 7 pre-close audit items would resurface at v1.6 unless resolved — they did (6 of them; the 7th, `knowledge-base.md`, is a permanent structural false positive, not a real item). Writing the same prediction a third time (this entry) without deleting the 6 stale `PLAN.md` files would make the exercise pointless — either resolve them at v1.7's close or stop predicting it will happen and accept it as permanent, intentional debt.
4. **Automated cross-phase/runtime auditing catches what careful manual documentation reconciliation cannot.** v1.6 is the first milestone where `/gsd-audit-milestone` was actually run rather than skipped in favor of proceeding directly to close, and it found a real, live regression (HOME-16) that a thorough manual STATE.md/ROADMAP.md/REQUIREMENTS.md reconciliation had already made internally consistent without ever surfacing. Run the audit even — especially — when the milestone already looks done.
5. **Before assuming which milestone version a resumed phase belongs to, check `git tag -l` and `MILESTONES.md`, not just ROADMAP.md's phase list.** v1.7 almost closed as "finishing v1.6" purely because Phase 5 sat physically near v1.6's phases in ROADMAP.md — only checking existing git tags and the archived `MILESTONES.md`/`ROADMAP.md` snapshots revealed v1.6 was already fully shipped and tagged, and Phase 5 needed its own new version instead. A phase's position in the file tells you nothing about which milestones around it are still open.
