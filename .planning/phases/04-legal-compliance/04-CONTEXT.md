# Phase 4: Legal & Compliance - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Three bilingual, static, informational deliverables that let the content-only v1 site meet baseline French/EU legal requirements before public launch:
1. A mentions légales page (site owner identity, hosting provider, business status).
2. A privacy policy / GDPR notice (what data is collected, e.g. via the contact form, and how it's used).
3. A cookie/consent treatment — either an actual banner, or a documented basis for why none is needed.

No e-commerce-specific legal pages here (CGV, droit de rétractation) — those are correctly out of scope until v1.x ships a real checkout (LEGAL-02, LEGAL-04).

</domain>

<decisions>
## Implementation Decisions

### Locale Cookie Treatment
- **D-01:** The `ajs_locale` cookie (language-switcher preference, introduced in Phase 1 — see `01-CONTEXT.md` D-03) is treated as **exempt / strictly functional** — no accept/reject consent gate. It is documented in the privacy policy, not gated behind a banner.
- **D-02:** **No cookie banner UI at all.** A footer link to the privacy/cookie policy page is sufficient disclosure — there is nothing to accept or reject since the only cookie on the site is this one exempt functional cookie and there is no analytics/tracking anywhere in the codebase (confirmed via grep — zero hits for GA/gtag/Plausible/Matomo/Clarity/Hotjar).
- **D-03 (research gate):** The phase researcher MUST explicitly verify current CNIL guidance on language-preference cookies specifically before this "exempt" treatment is finalized in the plan. Do not just assume — confirm.

### Privacy Policy Depth
- **D-04:** Lightweight, plain-language notice — not a full formal GDPR Article 13 legal document. Appropriate for a small personal/artist site, not an enterprise-scale processor list.
- **D-05:** Explicit data flows to disclose:
  - Contact form → email → Romane's own OVH inbox. **Important:** the real target delivery mechanism is **OVH's own PHP `mail()`**, not Web3Forms — Web3Forms was Phase 3's interim/deferred choice (see `03-HUMAN-UAT.md` gap `CONT-DELIVERY-01` and `PROJECT.md` Key Decisions), but the user has now confirmed OVH mail() is the actual intended end-state, not just one option under reconsideration. Write the privacy policy around a **direct send to Romane's own mailbox** — there is no third-party processor in this flow (OVH is Romane's own infrastructure, not an external data processor in the GDPR sense).
  - Sanity CMS — one-line mention that gallery/site content is fetched at build time only; no visitor data ever reaches Sanity.
  - Hosting logs — brief disclosure that the web host (GitHub Pages currently, OVH after Phase 5) automatically logs visitor IP/user-agent just by serving pages, which is technically personal data under GDPR even though the site's own code never touches it.

### Page Placement & Identity
- **D-06:** Add "Mentions légales" / "Privacy" links to the existing footer band (`src/layouts/BaseLayout.astro`'s `<footer class="chrome-band">`) on every page — not scoped to just About/Contact.
- **D-07:** Mentions légales should reference **OVH** as the host (the confirmed Phase-5 end-state), even though the site is still actually live on GitHub Pages today. This intentionally describes the target/final state rather than today's staging reality, to avoid rewriting this page again at the Phase 5 cutover.
- **D-08 (RESOLVED 2026-07-08, post-research):** Research verified (Légifrance, LCEN Article 1-1, current text effective 2024-05-23 — supersedes the old "Article 6-III" citation) that a professional/commercial editorial site (which this is, per its purpose of showcasing and, in v1.x, selling Romane's work) must disclose the publisher's real legal name — brand-name-only is not compliant. **Decision: disclose the legal name alongside the brand name** — "Romane Lepont, exerçant sous le nom commercial « Atelier Jacqueline Suzanne »" in the "Éditeur du site" section. The brand name remains the dominant visual identity everywhere else on the site; this only affects the mentions-légales disclosure block. User confirmed this resolution (over keeping brand-only and accepting non-compliance) on 2026-07-08.
- **D-09 (RESOLVED 2026-07-08):** LCEN Article 1-1 also requires a professional address and phone number for a professional publisher (not just email), and Romane currently has neither a professional address nor phone line on file. **Decision: ship with a clearly-marked placeholder for address/phone and follow up separately** — do not fabricate a real value, do not silently omit the field. The mentions légales page should show the field with explicit placeholder styling/text (consistent with `04-UI-SPEC.md`'s existing placeholder treatment for pending SIRET-style fields) so it's visibly incomplete rather than silently missing, and this gap should be tracked as a known follow-up (not a blocker for phase completion, per user's explicit choice).

### Business Status Disclosure
- **D-10 (RESOLVED 2026-07-08):** Romane has **not filed** any business registration (guichet unique) — her stated reason is that her activity doesn't currently require it, since it falls below the revenue threshold that would trigger a registration obligation. This is **not** the "SIRET en cours d'attribution" (filed, pending issuance) case the research's default phrasing assumed — that phrasing would overstate her actual status. **Decision: the mentions légales "Statut" section must reflect "not registered / no business registration filed" phrasing** (e.g. FR: "Statut : activité individuelle, non immatriculée — activité occasionnelle en dessous du seuil imposant l'immatriculation." / EN: "Status: individual activity, not registered — occasional activity below the threshold requiring business registration."), not "SIRET en cours d'attribution." The planner should treat the exact legal accuracy of this specific phrasing (whether "below the registration threshold" is the legally correct framing for her situation vs. e.g. an "artiste-auteur"/URSSAF regime) as worth a final gut-check against a French micro-entrepreneur/business-formation source at execution time — this is a nuanced area the research pass did not specifically verify for the "not yet required to register" case (it only verified the "filed, pending" phrasing).

### Claude's Discretion
- Exact visual layout/typography of the three legal pages (should follow the same "single flowing page" pattern established in Phase 3's About page — no boxed panels, no portrait, per `03-CONTEXT.md` D-02/D-03 precedent).
- Exact footer link ordering/wording between the two (or three, if cookie policy is split out) legal page links.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions Directly Relevant to This Phase
- `.planning/phases/01-foundation-bilingual-infrastructure/01-CONTEXT.md` D-03 — original flag: "assess whether this locale-preference cookie counts as essential/functional... flag this when Phase 4 is planned." This phase resolves that flag (see D-01/D-02/D-03 above).
- `.planning/phases/03-about-contact/03-CONTEXT.md` D-02/D-03 — About page visual pattern (single flowing page, no boxed panels, no portrait) to replicate for legal pages' layout.
- `.planning/phases/03-about-contact/03-HUMAN-UAT.md` — gap `CONT-DELIVERY-01`: contact form has no working delivery mechanism yet (Web3Forms key never provisioned); this phase's privacy policy should describe the OVH mail()-based target state per D-05 above, not the current broken Web3Forms wiring.

### Project-Level Context
- `.planning/PROJECT.md` Key Decisions table — SIRET/business-registration tracking (still pending); OVH hosting override rationale; near-zero-budget constraint; contact-form delivery deferral decision (2026-07-08 entry).
- `.planning/REQUIREMENTS.md` lines ~37-39 (LEGAL-01, LEGAL-03, LEGAL-05 — this phase's scope) and lines ~77-78 (LEGAL-02, LEGAL-04 — explicitly OUT of scope, v1.x/checkout-gated).
- `.planning/ROADMAP.md` §"Phase 4: Legal & Compliance" — goal and the 3 literal success criteria this phase must satisfy.

### Legal Framework (for researcher to verify specifics against)
- LCEN Article 6-III (French "Loi pour la confiance dans l'économie numérique") — site-publisher identification requirements; researcher must verify current text/interpretation for an individual, non-SIRET site owner (see D-08).
- CNIL cookie/consent guidance — researcher must verify current guidance specifically covering language-preference/functional cookies (see D-03).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/BaseLayout.astro` — shared footer (`<footer class="chrome-band">`, currently just a Sanity-sourced `footerText` paragraph) is where the new legal-page links get added (D-06). Same file already handles bilingual nav/footer chrome via `siteSettings` singleton and locale-aware URL helpers.
- `src/pages/about.astro` / `src/pages/en/about.astro` (Phase 3) — the closest existing analog for a single-flowing-page, bilingual static content page. Reuse the same `.about-page`-style wrapper/typography pattern (scoped `<style>`, Body/Heading/Display role classes) for the three new legal pages rather than inventing new visual patterns.
- `src/components/LanguageSwitcher.astro` — owns the `ajs_locale` cookie's actual `document.cookie` write (path scoping, `SameSite=Lax; Secure`, 1-year `max-age`). This is the ONE cookie this phase's privacy/consent content needs to describe accurately.

### Established Patterns
- Bilingual routing: French at root paths, English under `/en/` (Astro i18n, `prefixDefaultLocale: false`) — the three new legal pages need FR + EN pairs following this same convention (e.g. `src/pages/mentions-legales.astro` + `src/pages/en/legal-notice.astro`, or equivalent naming — planner to decide exact slugs).
- No analytics/tracking scripts exist anywhere in `src/` (confirmed via grep for common providers) — the only client-side data mechanism on the entire site is the `ajs_locale` cookie itself.

### Integration Points
- Footer band in `BaseLayout.astro` is the single integration point for all three new page links (D-06) — no new nav structure needed beyond that.

</code_context>

<specifics>
## Specific Ideas

- Privacy policy must plainly state the contact form sends directly to Romane's own OVH mailbox via `mail()` — explicitly NOT framed as involving a third-party data processor, since that's no longer the intended architecture (superseding Phase 3's Web3Forms-based interim wiring).
- No cookie banner UI should be built at all — this is a deliberate simplification given zero tracking/analytics and one exempt functional cookie.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Business Status Disclosure was consciously left unresolved (not deferred to another phase) — it's still in-scope for Phase 4, just not discussed in this session; see the `<decisions>` section above for the context the researcher/planner needs to handle it.

</deferred>

---

*Phase: 4-Legal & Compliance*
*Context gathered: 2026-07-08*
