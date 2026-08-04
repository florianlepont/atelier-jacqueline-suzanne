# Phase 21: Homepage Scroll Experience - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-04
**Phase:** 21-Homepage Scroll Experience
**Areas discussed:** Wordmark→photo transition, Scroll structure, Scroll interactions, Description reveal style

---

## Wordmark→Photo Transition

| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing cutout (recommended) | Reuses the proven, Safari-hardened mechanism already in HomeCarousel.astro — scroll drives the photo-through-letters zoom until the photo takes over full-screen. | ✓ |
| Something else — let me describe it | User has a specific reference in mind that doesn't reuse the existing cutout mechanism. | |
| You decide | Leave the exact mechanism to research/planning discretion. | |

**User's choice:** Extend existing cutout (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Pinned/sticky (recommended) | Matches the site's existing DetailHero.astro precedent — gives control over pacing so the zoom feels deliberate. | ✓ |
| Natural scroll speed, no pinning | Wordmark scrolls away like normal content; zoom progress tied directly to raw scroll distance. | |
| You decide | Leave pinning vs. natural scroll to research/planning discretion. | |

**User's choice:** Pinned/sticky (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Purely wordmark + photo (recommended) | Cleanest, most dramatic — no competing text until the zoom settles. | ✓ |
| Gallery title fades in partway through | The first gallery's name starts appearing as the photo takes over. | |
| You decide | Leave this timing detail to research/planning discretion. | |

**User's choice:** Purely wordmark + photo (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Fully reversible/scrubbable (recommended) | True scroll-scrubbed animation — scrolling up smoothly zooms back out. | ✓ |
| One-time intro, doesn't reverse | Once past, scrolling back up shows a static/settled state instead. | |
| You decide | Leave reversibility to research/planning discretion. | |

**User's choice:** Fully reversible/scrubbable (recommended)
**Notes:** No specific external reference (image/site) was provided for the transition's exact feel — user confirmed extending the existing built mechanism. The precise easing/scroll-distance is flagged as open ground for `/gsd-sketch` exploration before implementation.

---

## Scroll Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen snap per gallery (recommended) | Each gallery's photo fills the viewport like a slide; scroll-snap moves cleanly from one to the next. | ✓ |
| Continuous free-flowing scroll | Photos/descriptions flow past at natural size, editorial-feed-like, no snapping. | |
| You decide | Leave exact scroll mechanics to research/planning discretion. | |

**User's choice:** Full-screen snap per gallery (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Existing bottom accent panel (recommended) | Reuses the already-built accent-color panel tied to per-gallery heroColor. | ✓ |
| Overlaid on the photo with a scrim | Text sits directly over the photo, darkened/gradiented for legibility. | |
| You decide | Leave text placement to research/planning discretion. | |

**User's choice:** Existing bottom accent panel (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| One photo per gallery (recommended) | Matches roadmap wording, mirrors current carousel/grid model. | ✓ |
| Multiple photos per gallery (mini-preview) | Each gallery gets a short 2-3 photo teaser. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** One photo per gallery (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Site footer / end-of-page (recommended) | Standard end-of-scroll pattern. | ✓ |
| Loop back to first gallery | Scrolling past the last gallery wraps back around. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** Site footer / end-of-page (recommended)

---

## Scroll Interactions

| Option | Description | Selected |
|--------|-------------|----------|
| Updates live per gallery (recommended) | Mirrors the carousel's existing behavior. | ✓ |
| Fixed at the per-visit starting color | The Phase 20 random color stays constant for the entire scroll. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** Updates live per gallery (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Tap photo opens gallery (recommended) | Matches today's grid-mode behavior. | ✓ |
| Separate explicit 'view gallery' CTA | The photo itself isn't tappable — a distinct button/link is the only way in. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** Tap photo opens gallery (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, fold it in (recommended) | Avoids letting a known Critical bug (Phase 20 touch-handler misfire) linger, since the surrounding code is being rewritten anyway. | ✓ |
| No, keep it tracked separately | Leave the Phase 20 bug where it is. | |

**User's choice:** Yes, fold it in (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden during zoom, fades in after (recommended) | Keeps the opening moment clean, consistent with the "purely wordmark + photo" decision. | ✓ |
| Stays visible throughout | Persistent chrome, matching every other page's header. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** Hidden during zoom, fades in after (recommended)

---

## Description Reveal Style

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse exact grid-hover values (recommended) | Same opacity+translateY, 180ms ease already used and approved elsewhere. | ✓ |
| Something different — let me describe it | User pictures a different feel for this specific moment. | |
| You decide | Leave exact reveal values to research/planning discretion. | |

**User's choice:** Reuse exact grid-hover values (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Fires once fully snapped/settled (recommended) | Matches "arrives on screen" wording precisely — a deliberate arrival moment. | ✓ |
| Fires early as slide starts entering viewport | Reveal begins before scrolling fully settles. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** Fires once fully snapped/settled (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Static end-state, site convention (recommended) | Matches how DetailHero.astro/AboutPageBody.astro already handle reduced-motion. | ✓ |
| Something else — let me describe it | User wants a different specific fallback behavior. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** Static end-state, site convention (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Intro only (recommended) | The wordmark's job is the one-time opening moment; regular slides show just title + description. | ✓ |
| Persists on every gallery slide | Matches today's exact carousel treatment unchanged. | |
| You decide | Leave this to research/planning discretion. | |

**User's choice:** Intro only (recommended)

---

## Claude's Discretion

None outside the decisions above — every gray area reached an explicit user decision. Implementation-level specifics not covered (exact scroll-track distance in px, exact snap-scroll CSS technique, exact scroll-event wiring) are left to research/planning per the phase's standard division of labor.

## Deferred Ideas

None — discussion stayed within phase scope. Multi-photo-per-gallery previews and continuous free-scroll layouts were surfaced as options during discussion but explicitly rejected in favor of the chosen decisions, not deferred as future scope creep.
