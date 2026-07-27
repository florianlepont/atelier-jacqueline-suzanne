# Phase 10: Unified Header & Simplified Language Switcher - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 10-unified-header-simplified-language-switcher
**Areas discussed:** Header consolidation architecture, Carousel/grid → existing solid/transparent variants, Language switcher redesign (I18N-04), Class-name/test-contract unification scope, Instagram scope (surfaced during discussion)

---

## Header consolidation architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Extract a standalone `<SiteHeader>` component | Pull header markup/CSS into its own component with a slot for extras; both BaseLayout and the homepage render it directly. | ✓ |
| Extend BaseLayout's header with a homepage-aware prop | Add a new variant/slot directly on BaseLayout itself. | |

**User's choice:** Extract a standalone `<SiteHeader>` component (recommended option).
**Notes:** One real shared component, not BaseLayout picking up homepage-specific concerns.

---

## Carousel/grid → existing solid/transparent variants

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse solid/transparent directly | Grid mode = solid, carousel mode = transparent, no new variant values. | ✓ |
| New dedicated variants for the homepage | Keep carousel/grid as their own variant values even though visually similar today. | |

**User's choice:** Reuse solid/transparent directly (recommended option).

---

## Language switcher label content

| Option | Description | Selected |
|--------|-------------|----------|
| Globe icon + language code | 🌐 EN / 🌐 FR — compact, terse. | ✓ |
| Globe icon + full language name | 🌐 English / 🌐 Français — more explicit. | |

**User's choice:** Globe icon + language code (recommended option).

## Icon placement

| Option | Description | Selected |
|--------|-------------|----------|
| Icon before the text | 🌐 EN | ✓ |
| Icon after the text | EN 🌐 | |

**User's choice:** Icon before the text (recommended option).

---

## Class-name / test-contract unification scope

First attempt at this question was malformed (label and description contradicted each other) — re-asked cleanly.

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to one unified class set | `.site-header`/`.logo-mark`/`.nav-link` everywhere; `.home-*` retired; Phase 7 e2e tests updated. | ✓ |
| Keep old selectors as stable aliases | `.home-*` selectors kept working so existing tests don't need touching. | |

**User's choice:** Rename to one unified class set (recommended option).
**Notes:** Confirmed as the intended, expected outcome — updating the Phase 7 tests that key off old names is not a regression.

---

## Instagram scope (surfaced during discussion, not a pre-planned area)

| Option | Description | Selected |
|--------|-------------|----------|
| Add Instagram to the shared header everywhere | About/Contact/homepage all show it identically in the nav. | ✓ |
| Keep Instagram homepage-only | Stays exclusive via the same optional-extras slot mechanism as the toggle. | |

**User's choice:** Add it to the shared header everywhere (recommended option).
**Notes:** Discovered mid-discussion that BaseLayout's header/footer never had Instagram at all (only in-content About/Contact body-copy mentions existed) — this was a real gap in the phase's original scope framing, not a pre-answered question.

---

## Claude's Discretion

- Exact SVG path data for the globe icon.
- Exact new selector names for retired `.home-*` classes beyond "use BaseLayout's existing names."
- Whether `<SiteHeader>`'s extras slot needs a specific name.
- Exact mobile pixel-budget re-measurement once Instagram (header-wide) and the toggle (homepage-only slot) combine.

## Deferred Ideas

None — discussion stayed within HOME-10/I18N-04's scope.
