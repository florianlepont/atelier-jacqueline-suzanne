---
status: resolved
trigger: "Investigate issue: mobile-nav-switcher-hierarchy — Language switcher in the mobile nav panel renders as a big equal-weight primary stacked item; user wants it moved to the bottom, at the same small font size as the Instagram link."
created: 2026-08-04T00:00:00Z
updated: 2026-08-04T17:15:00Z
---

## Current Focus

hypothesis: N/A — this is a design-decision reversal (D-04), not a code defect. The current implementation correctly follows D-04 as written; the fix is to change the markup/CSS to reflect the new, reversed hierarchy decision.
test: Located exact files/selectors implementing D-04's current (soon-to-be-reversed) hierarchy.
expecting: N/A
next_action: Hand off to planner/fixer with exact locations below. No further investigation needed — this is find_root_cause_only mode.

## Symptoms

expected: Within the full-screen menu, the language switcher renders as a big, equal-weight stacked primary item alongside Éditions/About/Contact (D-04 as originally decided in .planning/phases/20-mobile-navigation-accent-color/20-CONTEXT.md).
actual: User reported (live phone test, 20-UAT.md Test 2): "langage switch is supposed to be at the bottom, with the same font size of the instagram. for the instagram, can you put the instagram logo instead?" — the switcher should be grouped with Instagram as a secondary element, same small font size, not as a fourth big primary item.
errors: None reported — not a runtime error, a design-hierarchy reversal request.
reproduction: Open dialog#mobile-nav at 393x852 on the homepage; observe LanguageSwitcher rendered inside `<nav class="mobile-nav-panel__nav">` at 32px Unbounded/weight 600/ink color, same size as Éditions/About/Contact — not near the bottom at 14px like the Instagram link.
started: Always been this way since Phase 20 Plan 03/04 implemented D-04 literally; discovered as unwanted during Phase 20 UAT (live on-phone test), 2026-08-04.

## Eliminated

(none — this is a diagnosis of existing, working-as-designed code, not a bug hunt)

## Evidence

- timestamp: 2026-08-04T00:00:00Z
  checked: .planning/phases/20-mobile-navigation-accent-color/20-CONTEXT.md D-04
  found: "Primary (big stacked list, equal weight): Éditions, About, Contact, and the language switcher (EN⇄FR) — the language switcher becomes one more full-size stacked item... Secondary (small, near the bottom): the Instagram link."
  implication: Current code is a faithful, intentional implementation of D-04. The user has now reversed this decision after seeing it live — confirmed via 20-UAT.md Test 2 / Gaps section (severity: major, status: failed).

- timestamp: 2026-08-04T00:00:00Z
  checked: src/components/MobileNavPanel.astro lines 86-105
  found: |
    Line 86-95: `<nav class="mobile-nav-panel__nav" aria-label={menuLabel}>` contains three `<a class="mobile-nav-panel__link">` (Éditions/About/Contact, lines 87-89) followed directly by `<LanguageSwitcher />` (line 94) as the 4th primary child — no wrapper class distinguishes it, it renders with its own internal `<nav class="language-switcher"><a class="switcher-link">`.
    Line 96-105: `<a class="mobile-nav-panel__secondary" href={instagramUrl} ...>{instagramLabel}<span class="sr-only">...</span></a>` is a SIBLING of `.mobile-nav-panel__nav`, not inside it — this is the existing secondary-tier element the switcher needs to move alongside.
  implication: To move the switcher out of the primary list, `<LanguageSwitcher />` must be relocated out of `<nav class="mobile-nav-panel__nav">` (delete line 94) to somewhere near/adjacent to the `.mobile-nav-panel__secondary` Instagram anchor (lines 96-105) — either as a second sibling element or combined into the same row/wrapper as Instagram.

- timestamp: 2026-08-04T00:00:00Z
  checked: src/components/SiteHeader.astro is:global style block, lines 736-793
  found: |
    Lines 736-748: `.mobile-nav-panel__nav` is the flex-column container (`gap: var(--space-xl)`) that stacks all 4 primary items centered — comment at 736-738 explicitly says "all four items (three links + the language switcher) read as equal weight."
    Lines 750-765: `.mobile-nav-panel__link` sets the primary Display styling: `font-family: var(--text-display-family)` (Unbounded), `font-size: var(--text-display-size)` (32px), `font-weight: var(--text-display-weight)` (600/semibold), `line-height: var(--text-display-leading)` (1.2), `color: var(--color-ink)`.
    Lines 767-793 (THE KEY OVERRIDE BLOCK, explicitly commented "D-04 'equal weight' requirement — a deliberate, scoped reversal of LanguageSwitcher.astro's own accent-pink default"):
      - `.mobile-nav-panel .language-switcher { font-size: inherit; }` (777-779)
      - `.mobile-nav-panel .switcher-link { font-family: var(--text-display-family); font-size: var(--text-display-size); font-weight: var(--text-display-weight); line-height: var(--text-display-leading); color: var(--color-ink); padding: 0; }` (781-788)
      - `.mobile-nav-panel .switcher-link svg { width: 22px; height: 22px; }` (790-793)
  implication: This override block is EXACTLY what forces LanguageSwitcher.astro's default small pink Label-styled link up to big Display-sized ink text matching Éditions/About/Contact. Reversing D-04 for the switcher means removing (or replacing) this override block so the switcher instead matches `.mobile-nav-panel__secondary`'s styling (see next entry), and moving its DOM position (previous entry).

- timestamp: 2026-08-04T00:00:00Z
  checked: src/components/SiteHeader.astro is:global style block, lines 795-816 (`.mobile-nav-panel__secondary`)
  found: |
    ```
    .mobile-nav-panel__secondary {
      position: relative;
      z-index: 1;
      align-self: center;
      margin-bottom: var(--space-2xl);   /* 48px */
      display: inline-flex;
      align-items: center;
      min-height: var(--tap-target-min); /* 44px */
      font-family: var(--font-sans);
      font-size: var(--text-label-size); /* 14px */
      font-weight: var(--text-label-weight); /* 400/regular */
      line-height: var(--text-label-leading); /* 1.5 */
      color: var(--color-ink);
      text-decoration: none;
    }
    .mobile-nav-panel__secondary:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
    ```
    Confirmed exact token values via src/layouts/BaseLayout.astro: `--text-label-size: 14px`, `--text-label-weight: var(--weight-regular)`, `--text-label-leading: 1.5`, `--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`, `--space-2xl: 48px`.
  implication: This is the exact target styling the switcher needs to match ("same font size of the instagram"). Note `.mobile-nav-panel__secondary` is positioned via `align-self: center` as a flex child of the `<dialog>` itself (the dialog's own `display: flex; flex-direction: column` from `.mobile-nav-panel[open]`, line 546-550) — it is NOT inside `.mobile-nav-panel__nav`. Any fix must decide whether the switcher becomes a second `align-self: center` sibling below/above `.mobile-nav-panel__secondary`, or whether both are merged into one row inside a new shared wrapper.

- timestamp: 2026-08-04T00:00:00Z
  checked: src/components/LanguageSwitcher.astro lines 38-67 (scoped `<style>`, the component's OWN default styling, still live/unmodified on desktop)
  found: |
    `.language-switcher { font-size: 14px; font-weight: 400; line-height: 1.5; }` and `.switcher-link { color: var(--color-accent); padding: 8px; gap: var(--space-xs); min-height: 44px; ... }` (D-06 comment: "switcher links render pink"). This is the exact styling currently used verbatim in SiteHeader.astro's desktop inline nav (unaffected by this phase) and is ALSO what governs the mobile panel switcher whenever SiteHeader.astro's `.mobile-nav-panel .switcher-link` override (see two entries above) is absent — i.e. this is the natural "un-overridden" appearance.
  implication: The component's default 14px/pink styling already almost matches `.mobile-nav-panel__secondary`'s target (14px/400) except for color (pink accent vs. ink) and no `margin-bottom`/`align-self`. Depending on planner intent, either (a) delete SiteHeader.astro's override block entirely and let the switcher fall back to its own default pink styling near the bottom, or (b) keep a lighter override that forces `color: var(--color-ink)` to match Instagram exactly (a plain-text/ink treatment rather than pink), whichever direction the planner/user prefers. This is Claude's-discretion-equivalent ambiguity, not resolved by evidence alone.

- timestamp: 2026-08-04T00:00:00Z
  checked: tests/e2e/mobile-nav.spec.ts, full file
  found: |
    Line 216: `.mobile-nav-panel__link` count assertion is exactly 3 (Éditions/About/Contact only) — switcher never carries this class, so this assertion is UNAFFECTED by moving the switcher.
    Line 223 / 405 / 519: `.switcher-link` existence/visibility/click assertions — position-agnostic, UNAFFECTED.
    Lines 252-303, test `"the primary list and switcher render at Display size in ink"`: THIS is the test that will BREAK. It explicitly asserts `.switcher-link`'s computed style equals `.mobile-nav-panel__link`'s (fontSize 32px, fontWeight 600, fontFamily contains 'Unbounded', color rgb(26,26,26)) — i.e. it encodes the CURRENT D-04 "equal weight" contract for the switcher specifically. Must be rewritten (or split) to instead assert the switcher matches `.mobile-nav-panel__secondary`'s styling once the fix lands.
    Lines 305-332, test `"the secondary line renders at Label size"`: asserts `.mobile-nav-panel__secondary` fontSize 14px, fontWeight 400, marginBottom 48px — this is the TARGET the switcher should be changed to match; this test itself likely stays correct but may need a sibling assertion added for the switcher's new matching style, or expansion if switcher+Instagram get merged into one shared wrapper element.
    Lines 636-648 (phase-gate cross-check test): compares `.switcher-link` href against header's switcher href — position/style-agnostic, UNAFFECTED.
    No test anywhere asserts DOM order/position of the switcher relative to the primary list, so relocating it in the DOM will not itself break any existing assertion — only the explicit style-equality test at lines 252-303 is a hard blocker requiring an update.
  implication: Exactly one existing e2e test (the Display-size/ink equality assertion, lines 252-303) directly encodes the hierarchy this fix reverses and must be updated. The Label-size test (lines 305-332) is the reference the updated switcher assertion should be aligned with.

## Resolution

root_cause: N/A (not a defect — this is a documented design decision, D-04, that the user wants reversed after seeing the live implementation). The two things that currently make the switcher a "big equal-weight primary item" are: (1) its DOM position — inside `<nav class="mobile-nav-panel__nav">` as the 4th child, MobileNavPanel.astro line 94; and (2) its CSS override — SiteHeader.astro's `is:global` block, lines 767-793 (`.mobile-nav-panel .language-switcher`/`.switcher-link`/`.switcher-link svg` rules), which force Display-role typography (32px/600/Unbounded/ink) onto LanguageSwitcher.astro's otherwise-Label-sized, pink-accent default styling (LanguageSwitcher.astro lines 38-67).
fix: (not applied — find_root_cause_only mode; deferred to planner/fixer)
verification: (not applicable)
files_changed: []
