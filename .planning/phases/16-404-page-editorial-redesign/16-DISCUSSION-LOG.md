# Phase 16: 404 Page Editorial Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-29
**Phase:** 16-404 Page Editorial Redesign
**Areas discussed:** Bilingual header structure (superseded), Eyebrow label (superseded), Custom animated 404 concept, Home-link styling

---

## Bilingual header structure (superseded mid-discussion)

| Option | Description | Selected |
|--------|-------------|----------|
| Two stacked full headers | Two full PageTitleHeader instances, FR then EN | |
| One shared header, FR+EN split below | One giant title, FR/EN body split underneath | ✓ (initial answer) |
| FR primary, EN secondary | FR gets full treatment, EN smaller/secondary | |

**User's choice:** "One shared header, FR+EN split below" — then, when asked for the exact title text: "Combined 'Page introuvable / Not found'"; then, for body layout: "Side-by-side two columns".

**Notes:** All of this was superseded a few turns later when the user rejected the `PageTitleHeader`-reuse approach entirely (see "Custom animated 404 concept" below). Recorded here for the audit trail, not as a live decision.

---

## Eyebrow label (superseded mid-discussion)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep default brand eyebrow | "Atelier Jacqueline Suzanne", matches all 3 other PageTitleHeader usages | |
| Custom "404" error label | Override the eyebrow with a "404"/"Erreur 404" style label | ✓ (initial answer) |

**User's choice:** "Custom '404' error label" — then, asked to clarify what the "eyebrow" even was (user wasn't familiar with the term), this was explained as the small pulsing-dot label above the giant title.

**Notes:** Immediately after clarifying what an eyebrow was, the user said: *"Oh but I don't want any eyebro. I want a really specific design for the 404 error page."* — This is the pivot point into the fully custom concept below. The "small 404 marker" idea survived, just relocated out of the (now-dropped) `PageTitleHeader` eyebrow slot into the new centered composition.

---

## Custom animated 404 concept

This area wasn't part of the original 3 selected areas — it emerged when the user rejected the `PageTitleHeader`-reuse direction mid-discussion and described a fully custom concept instead, in their own words:

> "I want a 404 page with picture of the website defiling really quickly. In the center of the page the AJS logo. The more you're close from the robot the more the defilement is fast (slow when you're far)"

Clarified over several follow-ups:
- "Close from the robot" → clarified as pointer/touch distance from the center of the screen, not a separate "robot" element.
- "Defiling"/"scrolling" → clarified as **popping** (hard-cut photo changes), not a continuous scroll/marquee.

| Question | Options presented | User's answer |
|---|---|---|
| Background image source | Romane's photography / Literal site screenshots | Romane's photography |
| Layout | One full-screen photo at a time / Grid-mosaic | One full-screen photo at a time |
| Transition style | Hard instant cut / Quick flash-crossfade | Hard instant cut |
| Mobile/touch behavior | Fixed gentle speed / Touch position drives speed | Touch position drives speed |
| Reduced-motion fallback | Static single frame / Slow constant drift | Slow constant drift |
| Speed cap (flagged as a photosensitive-safety concern, WCAG flash-rate guideline) | Yes, cap it (recommended) / No cap | Yes, cap it |
| Center content legibility over the busy background | Solid backing panel / Floating over a dimming scrim | Floating over a dimming scrim |
| Small phrase text near the logo | "Page introuvable / Not found" / Something shorter-different | "Page introuvable / Not found" |
| Separate "404" numeric marker | No, drop it / Yes, keep a small "404" | Yes, keep a small "404" |

**Notes:** Claude flagged the flash-rate/photosensitive-seizure risk proactively before asking about the speed cap — this wasn't a user-raised concern, it was surfaced as a safety consideration given the concept (rapid, high-contrast, full-screen hard cuts, speed scaling with cursor proximity). The user agreed to cap it. Claude also flagged the conflict with the ERR-01/Phase 16 requirement text (which explicitly locked `PageTitleHeader` reuse) — the user responded "Don't hesitate to update the requirements," authorizing a rewrite of `ROADMAP.md`'s Phase 16 section and `REQUIREMENTS.md`'s ERR-01 line, which was done via `/gsd-phase --edit 16` (ROADMAP.md) and a direct edit (REQUIREMENTS.md, no dedicated CRUD handler exists for that file's requirement text) immediately after this discussion, with the user's explicit confirmation on the proposed diff.

---

## Home-link styling

| Option | Description | Selected |
|--------|-------------|----------|
| Side by side | Both "Retourner à l'accueil" / "Return home" links on one line | ✓ |
| Stacked | One link per line, FR above EN | |

**User's choice:** Side by side.

**Notes:** Resolved as part of the custom concept's centered panel, not as a standalone layout decision on a full-width page.

---

## Claude's Discretion

- Exact size/pool of photos cycled through for the popping background.
- Precise scrim opacity/gradient and logo color variant (black vs. white) for legibility across the whole photo pool.
- Concrete reduced-motion drift interval/speed.
- Exact placement of the "404" marker relative to the logo/phrase block.
- Final byte-for-byte copy strings (kept the same meaning as today's copy, not necessarily identical wording, given the much more compact layout).

## Deferred Ideas

None — the discussion's scope stayed on the 404 page throughout, even though the visual approach changed dramatically.
