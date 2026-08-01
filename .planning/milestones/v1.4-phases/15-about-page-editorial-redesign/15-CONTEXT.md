# Phase 15: About Page Editorial Redesign - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Phase Boundary

The About page (`AboutPageBody.astro`, rendered from `src/pages/about.astro` and `src/pages/en/about.astro`) adopts the shared `PageTitleHeader` editorial identity already live on Contact and Éditions (ABOUT-03), and its broader supporting layout — bio placement, portrait treatment, exhibition hero photo, and the two numbered sections — is redesigned into one coherent editorial composition (ABOUT-04). The layout direction must be chosen from multiple sketched proposals before implementation, mirroring the process used for the Contact page redesign (`.planning/sketches/013-contact-page-composition/`). Existing bio/practice/medium copy is preserved verbatim — this phase changes presentation only, never content. Romane's portrait photo itself is not replaced — only its treatment/placement is in scope.

</domain>

<decisions>
## Implementation Decisions

### Bio → Header Mapping
- **D-01:** The full biography paragraph does NOT get fed into `PageTitleHeader`'s `intro` prop. That slot is styled for a short 2-line/46ch teaser (as used on Contact/Éditions) and stays unused/empty on About. The biography renders as its own separate lead paragraph below the header, restyled to match the new spacing rhythm — structurally close to today's `.about-page__lead`, just re-skinned.

### Portrait Treatment
- **D-02:** Keep the portrait circular (not switching to a square/framed hairline-border treatment) — just resize/reposition it to fit wherever the new composition places it.
- **D-03:** Keep the portrait at roughly its current scale (~112px) as a small accent near the title/bio — it should not be sized up into a larger editorial-photo focal point. It must not compete with the giant display title.

### Hero/Exhibition Photo
- **D-04:** The full-bleed gallery-install photo becomes a pinned, scroll-scrubbed reveal — same mechanism as sketch 005 (Éditions detail hero): `position: sticky` + scroll-driven shrink, no new library (vanilla JS scroll listener driving inline styles), with a `prefers-reduced-motion` fallback showing the settled end-state immediately and no sticky pin at all (matching the existing site-wide convention).
- **D-05:** Unlike Éditions (where the shrink reveals the page's title), About's title already sits above in `PageTitleHeader` and the bio sits below it — there is no title left to reveal. **Claude's discretion** on what the shrink resolves into: a pure motion "settle" with no text reveal, or a reveal into the "01 Atelier & pratique" section using only existing markup/copy (never new text). Resolve this during sketching based on what reads as intentional vs. gratuitous.
- **D-06:** The pinned scroll effect is desktop-only. Mobile viewports keep a plain static photo band (today's treatment), independent of the separate `prefers-reduced-motion` fallback — avoids janky scroll-linked motion and excess vertical space on small screens.

### Numbered Sections Layout
- **D-07:** **Claude's discretion** on structure — two-column (restyled to match the new rhythm) vs. a stacked full-width row-list (Éditions-style) vs. another asymmetric structure. Resolve during sketching, informed by whichever hero-photo reveal-target (D-05) is chosen, since a "reveals into section 01" treatment may constrain which sections layout reads as a continuous composition.

### Claude's Discretion
- What the hero photo's shrink reveals into (D-05) — pure settle vs. reveal into section 01.
- Numbered sections' final structure (D-07) — two-column restyle vs. stacked row-list vs. other.
- Exact sizing/positioning of the circular portrait within whatever composition the sketches land on (D-02/D-03 set the shape and scale; placement is open).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` (Phase 15 section) — goal, success criteria, dependencies
- `.planning/REQUIREMENTS.md` (ABOUT-03, ABOUT-04) — locked requirement text and Out of Scope note on portrait photo replacement
- `.planning/PROJECT.md` — v1.4 milestone goal and current Key Decisions

### Design-exploration precedent (same process required for this phase)
- `.planning/sketches/013-contact-page-composition/README.md` — the sketch → winner → implement process this phase must replicate for the About layout
- `.planning/sketches/005-edition-hero-scroll-reveal/README.md` — the pinned scroll-reveal mechanism (D-04) this phase adapts; documents the vanilla-JS sticky+shrink approach and the `prefers-reduced-motion` fallback convention

### Existing components this phase builds on
- `src/components/PageTitleHeader.astro` — shared header (eyebrow, giant title, halftone, divider, `intro` slot); reused as-is per ABOUT-03, with `intro` left unused per D-01
- `src/components/ContactPageBody.astro` — reference for how another page integrates `PageTitleHeader` alongside its own body content
- `src/components/AboutPageBody.astro` — the file being redesigned; holds current hero/portrait/exhibition-photo/sections markup and styles
- `src/pages/about.astro` / `src/pages/en/about.astro` — locale entry points wiring Sanity-sourced content into `AboutPageBody`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PageTitleHeader.astro`: drop-in shared header component — already handles eyebrow/title/halftone/divider; About only needs to supply `heading` (and possibly a headingId), leaving `intro` empty per D-01.
- CSS custom properties (`--editorial-page-max`, `--editorial-page-padding-*`, `--border-hairline`, `--color-ink`, `--space-*`): already used consistently across Contact/Éditions/About — the redesign should keep using these tokens rather than introducing new ad hoc values.

### Established Patterns
- Sticky/scroll-driven reveal (sketch 005): vanilla JS scroll listener computing `progress = scrollTop / revealDistance`, driving width/opacity/transform via inline styles — no animation library. Reuse this exact approach for D-04 rather than reaching for a new dependency.
- `prefers-reduced-motion` convention: site-wide pattern (HomeCarousel/Lightbox View Transitions, sketch 005) is to disable scroll-linked/sticky motion entirely and show the settled end-state immediately — apply the same fallback here.
- Two-prop-driven locale split: `about.astro`/`en/about.astro` resolve Sanity content per-locale and pass fully-resolved strings/images into the shared `AboutPageBody` — no i18n logic lives in the body component. Preserve this boundary; redesign only touches `AboutPageBody.astro`'s markup/styles and its `Props` shape if new slots are needed (e.g., if D-05's section-reveal needs a new prop hook).

### Integration Points
- `src/pages/about.astro` and `src/pages/en/about.astro` are the only two call sites of `AboutPageBody` — both must be checked if the component's `Props` interface changes.
- Existing responsive breakpoints in `AboutPageBody.astro` (`767px`, `480px`) should be preserved/extended rather than introducing a new breakpoint scheme.

</code_context>

<specifics>
## Specific Ideas

- The pinned scroll-reveal hero (D-04) should feel like a direct adaptation of sketch 005's mechanism — same vanilla-JS sticky+shrink approach, same reduced-motion fallback behavior — not a new, independently-designed motion pattern.
- Portrait stays circular and small (D-02/D-03) — explicitly rejecting the option to redesign it into a square/framed editorial photo or scale it up into a focal point. The giant title and the new hero-photo reveal are the visual anchors; the portrait remains a modest accent, as it is today.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-About Page Editorial Redesign*
*Context gathered: 2026-07-29*
