# Phase 17: Homepage Carousel & Intro Fixes - Context

**Gathered:** 2026-08-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The homepage hero carousel (`src/components/HomeCarousel.astro`) stops pausing its auto-advance when the visitor merely hovers the page with a mouse (HOME-11), and the grid-mode intro paragraph (`.home-grid__intro-body`) displays its full text instead of being truncated after 2 lines (HOME-12). Both are fixes to already-shipped homepage behavior — no new capability, no new content model, single component (`HomeCarousel.astro`).

</domain>

<decisions>
## Implementation Decisions

### Hover-Pause Removal Scope (HOME-11)
- **D-01:** Remove ONLY the mouse-hover pause (`hero.addEventListener('mouseenter', stopAutoAdvance)` / `mouseleave` → `startAutoAdvance`, currently at `HomeCarousel.astro` ~line 823-824). The carousel must keep auto-advancing while the pointer merely hovers the page.
- **D-02:** KEEP the keyboard-focus pause (`focusin` → `stopAutoAdvance` / `focusout` → `startAutoAdvance`, ~line 825-826) — explicit user decision, recommended and accepted, to avoid regressing keyboard accessibility: a keyboard user tabbing into the carousel (e.g. onto the pause/play toggle button) should not see the slide change out from under them mid-navigation. This is a deliberate divergence between mouse and keyboard behavior — do not "simplify" by removing both, and do not add mouse-hover-pause back later without the user asking again.
- **D-03:** The explicit pause/play toggle button (`data-role="autoplay-toggle"`, click handler ~line 787-796) is completely unaffected by this change — it must keep working exactly as today (`autoAdvancePausedByUser` state, `syncAutoplayControl()`).
- **Context (not a decision, background for downstream agents):** The existing code comment at ~line 762 ("D-09: auto-advance every 6000ms, paused on hover/focus, resumed on mouseleave/focusout — never paused permanently") refers to a prior phase's own internal decision label ("D-09"), unrelated to this phase's D-01/D-02/D-03 numbering — don't confuse the two when reading the code.
- **Verified mechanism (informs implementation, not a decision):** `startAutoAdvance()` already internally checks `autoAdvancePausedByUser` before restarting the timer (~line 766: `if (autoAdvancePausedByUser || ...) return`), so removing the `mouseenter`/`mouseleave` listeners is a clean, self-contained deletion — it does not require touching `startAutoAdvance()`/`stopAutoAdvance()` themselves, `goToPrev()`/`goToNext()`'s timer-resync logic, or the manual-toggle state machine.
- **Associated nav (from the original bug report "the associated nav" pausing too):** The progress-dash fill animation's pause/resume (`setFillPaused()`) is driven by the same `stopAutoAdvance()`/`startAutoAdvance()` calls — removing the hover listeners automatically stops the dash from freezing on hover too. No separate fix needed for the nav; it's the same call chain.

### Grid Intro Text Length (HOME-12)
- **D-04:** Remove the `-webkit-line-clamp: 2` / `overflow: hidden` truncation on `.home-grid__intro-body` entirely — the intro paragraph shows its full text, however long, with no line cap. Explicit user choice over a defensive higher cap (e.g. 4-5 lines) — simplicity and fidelity to the real Sanity content won over defending against hypothetical future long content.

### Claude's Discretion
- Any minor spacing/line-height adjustment needed if the now-unclamped intro text runs to more lines than before, so it doesn't visually collide with adjacent grid-tile elements (title above it, tile edges) — purely a polish detail, not a decision the user needs to weigh in on.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` (Phase 17 section) — goal, success criteria, dependencies
- `.planning/REQUIREMENTS.md` (HOME-11, HOME-12) — locked requirement text
- `.planning/PROJECT.md` — v1.5 milestone goal and current Key Decisions

### File this phase touches
- `src/components/HomeCarousel.astro` — the only file both requirements touch: hover/focus pause listeners (~line 762-834) and `.home-grid__intro-body` CSS (~line 2436-2445)

No external specs beyond the above — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- N/A — this phase removes/loosens existing constraints, it doesn't add new components or assets.

### Established Patterns
- `hoverCapable` check already used elsewhere in `HomeCarousel.astro` (e.g. `resetPeek()` gating in `showGrid()`) to distinguish mouse-capable devices from touch — confirms the hover-pause being removed was always a desktop-mouse-only behavior; touch users never experienced it, so HOME-11 has no touch-specific behavior to preserve or change.
- `startAutoAdvance()`/`stopAutoAdvance()` already form a clean, idempotent pair respecting `autoAdvancePausedByUser` — the manual-toggle state machine doesn't need to know or care that the hover listeners were removed.

### Integration Points
- `hero.addEventListener('mouseenter', stopAutoAdvance)` and `hero.addEventListener('mouseleave', startAutoAdvance)` (~line 823-824) are the two lines to remove.
- `hero.addEventListener('focusin', stopAutoAdvance)` and `hero.addEventListener('focusout', startAutoAdvance)` (~line 825-826) must remain untouched.
- `.home-grid__intro-body` CSS block (~line 2436-2445): remove `display: -webkit-box`, `-webkit-line-clamp: 2`, `-webkit-box-orient: vertical`, `overflow: hidden`.
- Existing Playwright e2e coverage for the carousel's hover-pause behavior (if any exists under `tests/e2e/homepage.spec.ts`) will need updating to assert the NEW behavior (no pause on hover, still pauses on focus) rather than the old one — check for and update/remove any test asserting mouse-hover pause.

</code_context>

<specifics>
## Specific Ideas

- User's own framing of the bug (verbatim intent): "je ne veux plus que ça se mette en pause" (survol souris) — confirmed this is a reversal request, not a request to fix broken pause behavior; the hover-pause code already worked as designed, the user just doesn't want that design anymore.
- Grid intro text screenshot showed the real Sanity paragraph ("Découvrez un univers photographique sensible et singulier, façonné par l'attention portée aux détails, aux matières et aux instants…") cut off by the browser's automatic line-clamp ellipsis — confirmed as a CSS truncation artifact, not intentional content.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (both requirements are narrow, single-component CSS/JS fixes).

</deferred>

---

*Phase: 17-Homepage Carousel & Intro Fixes*
*Context gathered: 2026-08-02*
