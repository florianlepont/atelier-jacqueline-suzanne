# Phase 10 — UI Review

**Audited:** 2026-07-20
**Baseline:** 10-UI-SPEC.md (design contract)
**Screenshots:** not captured (no dev server running on :3000/:4321/:5173/:8080; audit is code-only against `src/components/SiteHeader.astro`, `src/components/LanguageSwitcher.astro`, `src/components/HomeCarousel.astro`, `src/layouts/BaseLayout.astro`, and the three plan SUMMARYs/PLANs)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Visible "EN"/"FR" + current-language-phrased sr-only hint exactly matches the Copywriting Contract; no generic labels introduced. |
| 2. Visuals | 3/4 | Hierarchy/iconography is sound, but the globe icon's legibility at 16px and the toggle's currentColor-cascade fix were only "manually spot-checked," not captured as evidence in this audit — no visual proof on file. |
| 3. Color | 3/4 | Token discipline is good, but `.site-header--transparent .nav-link { color: #FFFFFF }` (SiteHeader.astro:133) and 6 more hardcoded `#FFFFFF` in HomeCarousel bypass `--color-dominant`/`--gray-0`, inconsistent with the rest of the token-driven system. |
| 4. Typography | 4/4 | `.switcher-link`/`.nav-link` both render at the Label role (14px/400/1.5) exactly as specified; no new type role introduced. |
| 5. Spacing | 4/4 | `var(--space-xs)` gap, `--tap-target-min` 44px floor (post-fix, commit f669ab1) — matches spec exactly, including the documented mobile `@media` port. |
| 6. Experience Design | 3/4 | Strong state/interaction coverage and a real self-caught regression (tap-target shrink) — but no automated visual/percy-style regression exists for the carousel↔grid re-skin, only "human-check" notes in the plans. |

**Overall: 21/24**

---

## Top 3 Priority Fixes

1. **Hardcoded `#FFFFFF` instead of `var(--color-dominant)`/`var(--gray-0)` in header chrome** (`src/components/SiteHeader.astro:133`, `src/components/HomeCarousel.astro:769,809,1077,1097,1114,1420`) — user impact: none today (value is identical to the token), but it's a latent bug: if `--color-dominant` is ever retuned (e.g. an off-white brand refresh), these 7 call sites will silently diverge from the rest of the white-on-white system that already uses the token everywhere else. Fix: replace all 7 with `var(--color-dominant)` (or `var(--gray-0)`) to restore single-source-of-truth token usage.
2. **No screenshot evidence exists for the carousel↔grid header re-skin or the 16px globe icon's legibility** — every visual claim in the three SUMMARYs is backed only by "human_judgment: true" / "manual_procedural" narrative, not a captured artifact. User impact: a future regression in the transparent/solid re-skin or an illegible icon at small viewports could ship undetected since there's no repeatable visual check. Fix: capture and store baseline screenshots (carousel mode, grid mode, mobile 393px, both locales) the next time a dev server is available, so future diffs have something to compare against instead of re-doing a live spot-check from scratch.
3. **Instagram icon and globe icon differ in stroke-width (1.8 vs 1.6) and viewBox padding conventions with no documented rationale** — both are "any standard glyph is acceptable" per Claude's Discretion, but the two icons now sit side-by-side in the same nav row on every page; a 0.2px stroke-width mismatch between two dependency-free SVGs in the same row is a minor but real visual-consistency gap the spec didn't explicitly forbid but also didn't reconcile. Fix: align both icons to the same `stroke-width` (pick 1.6 or 1.8 and apply to both) for pixel-level visual coherence in the shared header row.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- `LanguageSwitcher.astro:11` — visible label is exactly `'EN'`/`'FR'`, no separator, no verbose language name — matches D-07 and the Copywriting Contract table verbatim.
- `LanguageSwitcher.astro:15` — sr-only hint correctly phrased in the CURRENT page's language (`'Passer en anglais'` on FR, `'Switch to French'` on EN), matching the UI-SPEC's explicit final copy (this resolved a documented ambiguity between CONTEXT.md's illustrative example and the actual copy contract — the implementation followed the UI-SPEC, which is the correct source of truth per the phase's own design).
- `SiteHeader.astro:65` — Instagram `aria-label={`Instagram ${instagramLabel}`}` and sr-only new-tab hint reused verbatim from Phase 7, no copy drift introduced by this phase.
- No `"Submit"/"Click Here"/"OK"` generic-label patterns found in either changed component (`grep` clean).

### Pillar 2: Visuals (3/4)
- Icon+label composition (globe → code → sr-only hint) is a clean, minimal hierarchy consistent with the site's existing terse-icon convention (Instagram, mode-toggle morph).
- `SiteHeader.astro`'s Instagram icon (`stroke-width="1.8"`, 20×20, `viewBox 0 0 24 24`) and `LanguageSwitcher.astro`'s globe icon (`stroke-width="1.6"`, 16×16, same viewBox) are two independently-authored dependency-free SVGs now rendering in the same nav row with slightly different stroke weights — a minor but real cross-icon consistency gap (see Priority Fix #3).
- The 44px tap-target regression on `.nav-link` (Instagram link shrank to 20×25px after the initial extraction) was caught by a code review mid-phase and fixed in commit `f669ab1` before this audit — good process, but it means the first cut of the shared header briefly violated its own spec, worth noting for score calibration (not perfect on the first pass).
- No screenshot evidence was available to verify the "globe legible at ~16px" claim independently; the SUMMARY marks this `human_judgment: true` with no artifact retained.

### Pillar 3: Color (3/4)
- Accent (`--color-accent`, pink) correctly stays scoped to `.switcher-link`'s default color and link/focus-ring usage only — not applied to nav links, Instagram icon, or the mode-toggle, matching the "Accent reserved for" contract.
- `.site-header--transparent .nav-link { color: #FFFFFF; }` (SiteHeader.astro:133) hardcodes white instead of referencing `var(--color-dominant)`/`var(--gray-0)`, both of which are already defined as `#FFFFFF` in `BaseLayout.astro`'s `:root`. Same issue recurs 6 more times in `HomeCarousel.astro` (lines 769, 809, 1077, 1097, 1114, 1420) for logo/toggle/outline colors in transparent/carousel mode.
- This is a pre-existing pattern this phase's UI-SPEC explicitly says is "unchanged from BaseLayout's current transparent header" (UI-SPEC Color section) — so it's not a new regression introduced by Phase 10, but the audit's adversarial stance requires flagging it since it directly contradicts the token-driven system elsewhere in the same file (`--color-accent`, `--color-ink`, `--color-border` are all used via var() a few lines away).
- No unscoped/overreaching accent usage found — 60/30/10 white/white/pink split is respected structurally.

### Pillar 4: Typography (4/4)
- `SiteHeader.astro` `.nav-link` — `font-size: 14px; font-weight: var(--weight-regular); line-height: 1.5;` — exactly the Label role.
- `LanguageSwitcher.astro` `.language-switcher` — `font-size: 14px; font-weight: 400; line-height: 1.5;` — same role, matches (the raw `400` literal instead of `var(--weight-regular)` is a very minor token-discipline nit but numerically identical, not a visible defect).
- No new type role or off-scale size introduced by this phase; site-wide grep shows the pre-existing spread of sizes (12–40px) is untouched by these two files.

### Pillar 5: Spacing (4/4)
- `.switcher-link { gap: var(--space-xs); ... padding: 8px; min-height: 44px; }` — matches the UI-SPEC's icon+label gap exception and the `--tap-target-min` floor exactly.
- `.nav-link { min-height: var(--tap-target-min); padding: var(--space-xs) var(--space-sm); }` (post-fix) — restores the 44px floor that briefly regressed mid-phase, now compliant.
- Mobile `@media (max-width: 767px)` block in `SiteHeader.astro` is a direct, verified port of `HomeCarousel.astro`'s live-tuned trims (flex-wrap, `var(--space-xs)` gaps) — matches the spec's explicit requirement to port this forward rather than leave About/Contact untested at phone widths.
- `LanguageSwitcher.astro`'s `padding: 8px` is a literal `8px` rather than `var(--space-sm)` — functionally identical value, minor token-discipline nit, not scored down given it's numerically correct.

### Pillar 6: Experience Design (3/4)
- Strong TDD discipline across all 3 plans (RED contract before GREEN implementation, verified in each SUMMARY).
- A real regression (tap-target shrink) was caught and fixed via code review before shipping — evidence of a working quality gate, not evidence of a flawless first pass.
- Cross-page structural-identity test (`/` vs `/about/` nav order) closes a previously-untested gap per RESEARCH.md — good coverage discipline.
- Accessible-name preservation (`getByRole('link', {name: 'EN'|'FR'})` in `legal.spec.ts` staying green with zero code changes) was explicitly engineered and verified — a genuinely careful a11y-preserving refactor.
- Gap: the carousel↔grid re-skin and icon-legibility checks rely entirely on manual/human-check verification with no retained visual artifact (screenshot, Percy snapshot, etc.) — acceptable given the stack has no visual regression tooling, but it means this audit cannot independently confirm those claims and neither can any future regression check without redoing the live spot-check from scratch.

---

## Registry Safety

No `components.json` found (shadcn not initialized) — registry audit skipped per gate.

---

## Files Audited
- `src/components/SiteHeader.astro`
- `src/components/LanguageSwitcher.astro`
- `src/components/HomeCarousel.astro` (header-relevant sections: lines 98–144, 671–930, 1420–1580)
- `src/layouts/BaseLayout.astro` (`:root` token block, header wiring)
- `.planning/phases/10-unified-header-simplified-language-switcher/10-UI-SPEC.md`
- `.planning/phases/10-unified-header-simplified-language-switcher/10-01-SUMMARY.md`, `10-02-SUMMARY.md`, `10-03-SUMMARY.md`
- `.planning/phases/10-unified-header-simplified-language-switcher/10-01-PLAN.md`, `10-02-PLAN.md`, `10-03-PLAN.md`
- `.planning/phases/10-unified-header-simplified-language-switcher/10-CONTEXT.md`
- `git show f669ab1` (post-summary code-review fix commit)
- `npm run build` (verified succeeds, 21 pages)
