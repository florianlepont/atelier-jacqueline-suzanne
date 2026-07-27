# Phase 3: About & Contact - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors can learn who Romane is and her artistic/atelier practice via an About page, and can reach her directly through a spam-protected contact form whose messages land in her inbox. This phase does not include exhibitions, shop/checkout, legal pages (Phase 4), or the production domain cutover (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### About Page Content
- **D-01:** Reuse Romane's existing bio/background text from the current Myportfolio site (atelierjacquelinesuzanne.fr) rather than writing fresh copy.
- **D-02:** Single page, flowing sections (bio, then atelier/practice info underneath) — no tabs, no sub-navigation, no visually-boxed panel separation. Matches the site's existing minimal static-page pattern.
- **D-03:** No portrait/photo of Romane on the About page — stay text/practice-focused, consistent with a photographer who lets the work speak.
- **D-04:** Nothing from the current site's About/bio content needs to be dropped — whatever exists there is still accurate and can carry over as-is.

### Atelier/Practice Details (ABOUT-02)
- **D-05:** The current live site only *partially* covers "where she works, medium, techniques" — some of it may need light gathering/expansion beyond a straight copy-paste, but existing content is the starting point.
- **D-06:** Do not guess at Romane's specific medium/technique (e.g. analog/film vs. digital, darkroom process). Use clearly-marked placeholder text for this section pending her direct input — do not infer from photo grain/style alone, even though the visible work (Silos, Brume) suggests analog/black-and-white.

### Contact Form Destination & Confirmation
- **D-07:** Submitted messages should land in Romane's existing OVH/Zimbra mailbox (the domain's active email service, confirmed in Phase 1 — see 01-CONTEXT.md D-14) — not a new/different address.
- **D-08:** The technical delivery mechanism (how a static-only OVH-hosted site actually sends the message, given no serverless/Node compute per CLAUDE.md's OVH override) is explicitly left open for the researcher to investigate and recommend — e.g. a free-tier form-backend service (Formspree/Web3Forms-style) vs. OVH shared hosting's typically-included PHP mail capability. This is a technical/infra decision, not a vision decision — user deferred it to research.
- **D-09:** On successful submit, show an inline confirmation ("message sent") on the same page — no redirect to a separate thank-you page.

### Form Fields & Spam Protection
- **D-10:** Form fields: name, email, message only — no subject/reason field, keep it minimal.
- **D-11:** All three fields (name, email, message) are required — no optional fields.
- **D-12:** Spam protection is honeypot only (per CONT-02, locked by roadmap) — no additional rate-limiting or CAPTCHA layer requested.

### Claude's Discretion
- Exact visual treatment of the About page's section breaks (spacing/typography within the "single flowing page" structure) — no specific preference stated beyond D-02.
- Wording of the inline confirmation message and any client-side validation error states.

### Post-Research Amendments (2026-07-07)
- **D-01/D-04 amendment:** Research (03-RESEARCH.md) found no existing bio/about content anywhere on the live Myportfolio site — the reuse premise does not hold. Resolution: ship the About page with clearly-marked placeholder bio/practice text (same treatment as D-06's medium/technique placeholder) for Romane to fill in before launch, rather than migrating nonexistent content.
- **D-07 clarification:** Research found the live site's Contact page displaying a destination address under the reversed-word-order domain `jacquelinesuzanneatelier.fr`, raising doubt about D-07. Confirmed: the new form delivers to the `atelierjacquelinesuzanne.fr` mailbox as D-07 originally states — the live site's other-domain address is treated as legacy/incidental, not a signal to change destination.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-Level Decisions
- `.planning/PROJECT.md` — Core value, v1 requirements list, near-zero budget constraint, OVH override rationale
- `.planning/REQUIREMENTS.md` — ABOUT-01, ABOUT-02, CONT-01, CONT-02 (this phase's mapped requirements)
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, dependency ordering (depends on Phase 1 only)
- `CLAUDE.md` (repo root) — OVH Web Hosting is a zero-compute Apache file server (no Node/serverless runtime) — directly shapes the contact-form backend research question (D-08)

### Prior Phase Context
- `.planning/phases/01-foundation-bilingual-infrastructure/01-CONTEXT.md` — D-14: domain has an active OVH/Zimbra mailbox (MX Plan) that Phase 5's DNS cutover must preserve; this phase's contact form should deliver here (D-07)
- `.planning/phases/01-foundation-bilingual-infrastructure/01-CONTEXT.md` — D-01/D-02/D-04: locale routing pattern (French at root, English under `/en/`, switcher navigates to the translated-URL counterpart) — the About and Contact pages must follow this existing i18n pattern, not invent a new one
- `.planning/phases/02-portfolio-galleries/02-CONTEXT.md` and `02-VERIFICATION.md` — established visual identity tokens (Dawn Pink `--color-dominant`, Woodsmoke `--color-ink`, Wild Strawberry `--color-accent`, Delight font shipping on system-font fallback) that the About/Contact pages should reuse via `src/layouts/BaseLayout.astro`, not redefine

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/BaseLayout.astro`: site-wide design tokens already defined — `--color-dominant` (#F0E7E4), `--color-secondary` (#E4D9D0), `--color-accent` (#F92D97), `--color-ink` (#141213), `--color-destructive` (#dc2626, reserved but unused until now — a natural fit for contact-form validation/error states), spacing scale (`--space-xs` through `--space-3xl`), focus-visible double-ring pattern, `.sr-only` utility.
- `src/lib/sanity.ts`: existing `sanityClient` (with `perspective: 'published'`) and `getSiteSettings()` pattern — an About-page content type (if editable by Romane) or static Astro content should follow the same locale-object shape (`LocaleString { fr, en }`) established here and in `gallery.ts`.
- `astro:i18n` helpers (`getRelativeLocaleUrl`) — already used throughout `src/pages/*` and `src/pages/en/*` for locale-aware links; About/Contact pages follow the same FR-root/`/en/`-prefix routing.

### Established Patterns
- Page pairs live at `src/pages/{slug}.astro` (FR) and `src/pages/en/{slug}.astro` (EN) — same structure, only import depth and locale key differ (see `src/pages/galleries/[slug].astro` / `src/pages/en/galleries/[slug].astro` for the exact mirrored-file precedent).
- No UI framework dependency anywhere in the codebase — islands (if the contact form needs client-side interactivity for the honeypot/submit-handling) should follow `src/components/LanguageSwitcher.astro`'s plain `<script>` pattern, not introduce React/Preact.
- Zero-compute OVH hosting constraint already shaped Phase 1 (no SSR adapter, `output: 'static'`) — the contact form's submission handling must work within this same constraint (static form + external endpoint, not an Astro API route).

### Integration Points
- If Romane needs to self-serve edits to About-page text (not explicitly requested this discussion, but ABOUT-01/02 phrasing implies static content is acceptable) — clarify during planning whether About content lives in Sanity (editable) or as hardcoded Astro page content (dev-only edits). Not decided in this discussion; default to hardcoded content unless research/planning surfaces a reason Romane needs to self-edit her bio (CMS-01 only covers galleries per Phase 2's ROADMAP scope).

</code_context>

<specifics>
## Specific Ideas

- Contact form messages should land in Romane's existing @atelierjacquelinesuzanne.fr Zimbra inbox — she already checks this, no new account/habit to form.
- Atelier/practice section (medium, technique, studio location) should ship with clearly-marked placeholder text rather than guessed/inferred details — Romane needs to confirm specifics before this copy is final.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
None — no pending todos existed to review (`todo_count: 0`).

</deferred>

---

*Phase: 3-About & Contact*
*Context gathered: 2026-07-07*
