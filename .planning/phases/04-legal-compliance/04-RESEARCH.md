# Phase 4: Legal & Compliance - Research

**Researched:** 2026-07-08
**Domain:** French/EU website legal compliance (LCEN site-identification notice, GDPR/RGPD privacy notice, CNIL cookie-consent guidance) for a bilingual FR/EN static Astro site
**Confidence:** MEDIUM-HIGH (legal framework verified against Légifrance/CNIL official sources; two content-level decisions still require explicit user input before the plan can lock final copy)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Locale Cookie Treatment
- **D-01:** The `ajs_locale` cookie (language-switcher preference, introduced in Phase 1 — see `01-CONTEXT.md` D-03) is treated as **exempt / strictly functional** — no accept/reject consent gate. It is documented in the privacy policy, not gated behind a banner.
- **D-02:** **No cookie banner UI at all.** A footer link to the privacy/cookie policy page is sufficient disclosure — there is nothing to accept or reject since the only cookie on the site is this one exempt functional cookie and there is no analytics/tracking anywhere in the codebase (confirmed via grep — zero hits for GA/gtag/Plausible/Matomo/Clarity/Hotjar).
- **D-03 (research gate):** The phase researcher MUST explicitly verify current CNIL guidance on language-preference cookies specifically before this "exempt" treatment is finalized in the plan. Do not just assume — confirm.
  - **RESOLVED by this research — see "CNIL Cookie Guidance" below.** Confirmed compliant.

#### Privacy Policy Depth
- **D-04:** Lightweight, plain-language notice — not a full formal GDPR Article 13 legal document. Appropriate for a small personal/artist site, not an enterprise-scale processor list.
- **D-05:** Explicit data flows to disclose:
  - Contact form → email → Romane's own OVH inbox. **Important:** the real target delivery mechanism is **OVH's own PHP `mail()`**, not Web3Forms — Web3Forms was Phase 3's interim/deferred choice (see `03-HUMAN-UAT.md` gap `CONT-DELIVERY-01` and `PROJECT.md` Key Decisions), but the user has now confirmed OVH mail() is the actual intended end-state, not just one option under reconsideration. Write the privacy policy around a **direct send to Romane's own mailbox** — there is no third-party processor in this flow (OVH is Romane's own infrastructure, not an external data processor in the GDPR sense).
  - Sanity CMS — one-line mention that gallery/site content is fetched at build time only; no visitor data ever reaches Sanity.
  - Hosting logs — brief disclosure that the web host (GitHub Pages currently, OVH after Phase 5) automatically logs visitor IP/user-agent just by serving pages, which is technically personal data under GDPR even though the site's own code never touches it.

#### Page Placement & Identity
- **D-06:** Add "Mentions légales" / "Privacy" links to the existing footer band (`src/layouts/BaseLayout.astro`'s `<footer class="chrome-band">`) on every page — not scoped to just About/Contact.
- **D-07:** Mentions légales should reference **OVH** as the host (the confirmed Phase-5 end-state), even though the site is still actually live on GitHub Pages today. This intentionally describes the target/final state rather than today's staging reality, to avoid rewriting this page again at the Phase 5 cutover.
- **D-08 (research gate, NOT fully locked):** User's stated preference is to show **"Atelier Jacqueline Suzanne" only as the public identity — no personal name**. However, this is flagged, not locked: French mentions légales legal requirements (LCEN Article 6-III) around identifying the actual site publisher can differ for an individual not yet registered as a business (SIRET pending) versus a professional/commercial site. The phase researcher MUST verify what LCEN actually requires for Romane's specific situation before the planner finalizes the actual identity-disclosure content.
  - **RESOLVED by this research, in favor of compliance over the stated preference — see "LCEN Identity Disclosure" below.** Brand-name-only is NOT compliant; the planner must surface this conflict to the user rather than silently building the brand-only version.

#### Business Status Disclosure (not discussed — flagged for research/planning)
- Romane's SIRET/business registration is still **pending**. The mentions légales page's "business status" field must reflect her *actual current* status truthfully. See "Business Status Wording" below for the researched, ready-to-use interim phrasing.

### Claude's Discretion
- Exact visual layout/typography of the three legal pages (already resolved by `04-UI-SPEC.md` — reuses the About page's "single flowing page" pattern).
- Exact footer link ordering/wording between the two legal page links (already resolved by `04-UI-SPEC.md`).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Business Status Disclosure was consciously left unresolved (not deferred to another phase) — it's still in-scope for Phase 4.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEGAL-01 | Site displays a mentions légales page (site owner identity, hosting provider, business status) | "LCEN Identity Disclosure", "Business Status Wording", "Hosting Disclosure (OVH)" sections below give the exact required content and resolve the D-08 identity conflict. |
| LEGAL-03 | Site displays a privacy policy / GDPR notice | "GDPR/RGPD Minimum Notice Content" section gives the CNIL-sourced checklist of required elements, mapped to this site's actual data flows (contact form, Sanity, hosting logs, locale cookie). |
| LEGAL-05 | Site displays a cookie/consent banner compliant with CNIL guidance (if any non-essential cookies are used) | "CNIL Cookie Guidance" confirms zero non-essential cookies exist (grep-verified) and that the one functional cookie is exempt from consent — satisfied via disclosure-in-privacy-policy per D-01/D-02, no banner required. |
</phase_requirements>

## Summary

This phase ships two new static, hardcoded (non-CMS) content pages — mentions légales and a privacy policy (with cookie disclosure folded into it, per the UI-SPEC) — following the exact "Pattern 3" precedent already established by `src/pages/about.astro`: plain `.astro` files with hardcoded FR/EN copy, no Sanity schema, no client-side JS. No new npm packages, no new architecture. The two substantive open questions flagged in `04-CONTEXT.md` (D-03 cookie exemption, D-08 identity disclosure) are both now resolved by primary-source research: the locale cookie is confirmed CNIL-exempt (no banner needed, matching the locked decision), but the "brand name only, no personal name" identity preference is **not compliant** with LCEN — Romane's actual legal name is required. Her name is already known from project docs (CLAUDE.md: "Romane Lepont"), so this is not a blocking unknown, but the planner must present the conflict to the user rather than silently building the brand-only version, per D-08's own instruction.

The single highest-value pitfall this research uncovered that CONTEXT.md did not anticipate: the site's existing language-switcher (`getSwitcherHref` in `src/lib/i18n-paths.ts`) assumes **identical URL slugs** between the FR and EN version of every page (it just strips/re-adds the `/en/` prefix — it does not do slug translation). CONTEXT.md's own canonical-refs example slugs (`mentions-legales` FR / `legal-notice` EN) would silently break the switcher for these two pages unless the planner either (a) uses the same slug in both locales — the zero-risk option, matching the existing About/Contact precedent — or (b) explicitly scopes a slug-translation-map change to `getSwitcherHref`/`hasTranslatedCounterpart`, which is real, non-trivial, out-of-CONTEXT.md-scope work.

**Primary recommendation:** Build both pages as hardcoded Astro pages at identical FR/EN slugs (e.g. `/mentions-legales/` and `/en/mentions-legales/`), disclose Romane's real legal name ("Romane Lepont") alongside the "Atelier Jacqueline Suzanne" trade name in the mentions légales identity section, cite the current LCEN Article 1-1 (not the superseded Article 6-III referenced in CONTEXT.md's canonical refs — see "State of the Art"), and surface the address/phone-number disclosure requirement as an explicit open question for the user before the plan locks final copy.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mentions légales page render | Browser/Client (static HTML) | — | Fully prerendered at build time (`output: 'static'`), no runtime logic — identical tier to the existing About page. |
| Privacy policy page render (incl. cookie disclosure section) | Browser/Client (static HTML) | — | Same as above; the cookie section is plain static text, not an interactive consent widget. |
| Footer legal-links nav | Browser/Client (static HTML, in `BaseLayout.astro`) | — | Extends the existing shared layout component; no new tier introduced. |
| Legal page copy source-of-truth | Source code (hardcoded in `.astro` files) | — | Follows `about.astro`'s "Pattern 3" precedent (no Sanity schema) — legal text should not be freely editable by a non-technical user without review, unlike galleries (CMS-01 scope is galleries-only). |
| Cookie exemption compliance | Browser/Client (no script needed) | — | No consent-management JS is required; compliance is achieved entirely through disclosure copy, not code. |

## Standard Stack

No new libraries, frameworks, or services are introduced by this phase. This phase is pure content (two new `.astro` pages + a `BaseLayout.astro` footer edit) within the existing Astro 7 static-output architecture already locked in Phases 1–3.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 7.0.6 (already installed) | Renders the two new static pages | Same static-page pattern as `about.astro`/`contact.astro` — no new dependency. |

### Supporting
None new.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded `.astro` legal pages | A CNIL/consent-management-platform JS widget (e.g. Axeptio, Didomi, tarteaucitron.js) | Not needed and actively wrong here — D-02 already locked "no cookie banner UI at all" because there is nothing to accept/reject (zero non-essential cookies, confirmed by grep and by this research's CNIL findings below). Adding a CMP library would be over-engineering for a site with one exempt functional cookie and contradicts the locked decision. |
| Hardcoded legal copy in `.astro` files | New Sanity schema (`legalPage` document type) for CMS-editable legal text | Rejected: legal/compliance copy carries real liability if edited casually without review; CMS-01's self-service scope is explicitly galleries-only, and `about.astro`'s existing precedent (hardcoded, not Sanity-driven) already establishes this project's pattern for non-gallery static content. |

**Installation:** None — no new packages.

## Package Legitimacy Audit

Not applicable. This phase installs zero new npm packages (confirmed: no dependency changes needed, per Standard Stack above). Skip the Package Legitimacy Gate protocol.

## Architecture Patterns

### System Architecture Diagram

```
Build time (astro build, static output)
  ├─ src/pages/mentions-legales.astro  ──┐
  ├─ src/pages/en/mentions-legales.astro ─┤
  ├─ src/pages/confidentialite.astro  ────┼──► prerendered static HTML
  ├─ src/pages/en/confidentialite.astro ──┘      (no Sanity fetch, no API call)
  │
  └─ src/layouts/BaseLayout.astro (shared footer)
        └─ new <nav aria-label="Legal"> with 2 links, rendered on every page

Runtime (visitor's browser)
  Any page → footer → click "Mentions légales" / "Confidentialité"
     → static HTML page loads (zero JS, zero cookie set, zero network call)
  Contact page → LanguageSwitcher sets `ajs_locale` cookie (pre-existing, Phase 1)
     → now DISCLOSED (not gated) in the Cookies section of the privacy page
```

A visitor never triggers any new client-side script from this phase — both pages are pure static HTML, same as About. This matters for the "no cookie banner" claim: nothing on these pages sets a cookie, and the one cookie the *rest of the site* sets (`ajs_locale`) is set only by an explicit user action (clicking FR/EN), not automatically on page load.

### Recommended Project Structure
```
src/pages/
├── mentions-legales.astro       # FR (LEGAL-01)
├── confidentialite.astro        # FR (LEGAL-03, incl. cookie section, LEGAL-05)
├── en/
│   ├── mentions-legales.astro   # EN — SAME slug as FR (see Pitfall 1)
│   └── confidentialite.astro    # EN — SAME slug as FR (see Pitfall 1)
└── ...(existing pages unchanged)

src/layouts/
└── BaseLayout.astro             # footer gains a second <nav> row (D-06)
```

### Pattern 1: Hardcoded bilingual static page (reuse of `about.astro`)
**What:** A `.astro` page with no frontmatter data fetch, hardcoded FR or EN copy inline, wrapped in `<BaseLayout>`, using the locked `.about-page`-style CSS (`max-width: 640px; margin: 0 auto; padding: var(--space-2xl) var(--space-md);`).
**When to use:** Any content page that is not CMS-editable content (legal text qualifies — see Standard Stack rationale above).
**Example (structure, not final legal copy):**
```astro
---
// src/pages/mentions-legales.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Mentions légales — Atelier Jacqueline Suzanne">
  <div class="legal-page">
    <h1>Mentions légales</h1>
    <h2>Éditeur du site</h2>
    <p>...</p>
    <h2>Hébergement</h2>
    <p>...</p>
    <h2>Statut</h2>
    <p class="placeholder">...</p>
  </div>
</BaseLayout>
<style>
  .legal-page { max-width: 640px; margin: 0 auto; padding: var(--space-2xl) var(--space-md); }
  /* h1/h2/p rules identical to about.astro's <style> block */
</style>
```
Source: `src/pages/about.astro` (read directly from the codebase, this session).

### Pattern 2: Shared-slug i18n routing (existing constraint, not new)
**What:** `getSwitcherHref()` in `src/lib/i18n-paths.ts` recovers "the equivalent page in the other locale" by stripping the `/en/` prefix from the current path and re-adding it for the target locale — it does **not** perform any slug translation lookup. `hasTranslatedCounterpart()` currently returns `true` for every slug except the special-cased `'404'`.
**When to use:** Every new page pair added to this site, including this phase's two pages.
**Implication:** FR and EN legal pages MUST share the exact same URL slug (e.g. both `/mentions-legales/` and `/en/mentions-legales/`), or the language switcher will send visitors to the wrong URL (silently 404s, since `hasTranslatedCounterpart` would need a real per-slug lookup to catch a mismatch — it currently just assumes a match and produces a broken link). See Pitfall 1 below.
Source: `src/lib/i18n-paths.ts` lines 25-56 (read directly, this session).

### Anti-Patterns to Avoid
- **Building a cookie-consent banner/CMP widget:** Explicitly locked out by D-02 and unsupported by this research's findings — there is nothing to gate consent on. Do not add `tarteaucitron.js`, a custom banner component, or any accept/reject UI.
- **Translating the URL slug between FR and EN for these two pages** (e.g. `mentions-legales` vs `legal-notice`): breaks the existing shared-slug switcher assumption unless `i18n-paths.ts` is explicitly extended — a change with no locked decision authorizing it in this phase's scope.
- **Citing LCEN "Article 6-III"** in the actual page copy or in code comments: this article was abolished/renumbered on 2024-05-23 by the SREN law. See "State of the Art" below.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie consent gating | A custom accept/reject banner component, or a third-party CMP (Axeptio/Didomi/tarteaucitron) | Plain disclosure text inside the privacy policy's "Cookies" section (per D-01/D-02) | CNIL's own guidance (verified below) exempts UI-personalization cookies like a language preference from consent; there is no other tracker on the site to consent-gate. Building a CMP here would be solving a problem that doesn't exist for this site's actual cookie inventory. |
| Legal copy content-management | A new Sanity schema/document type for legal pages | Hardcoded `.astro` files, same as `about.astro` | Legal text needs developer review before any change (liability), unlike gallery content; CMS-01 was never scoped to include legal pages. |

**Key insight:** This phase's entire technical surface is "two static pages + a footer edit" — the actual work and risk is in getting the *legal content* right (identity disclosure, retention wording, exemption rationale), not in engineering. Resist the urge to add any interactive/consent-management code.

## Common Pitfalls

### Pitfall 1: Slug mismatch breaks the language switcher
**What goes wrong:** If the FR page is `src/pages/mentions-legales.astro` and the EN page is `src/pages/en/legal-notice.astro` (different slugs — as CONTEXT.md's own canonical-refs example casually suggested), clicking the language switcher from either page sends the visitor to a non-existent path (e.g. from `/mentions-legales/` clicking EN produces `/en/mentions-legales/`, which 404s because the real EN file lives at `/en/legal-notice/`).
**Why it happens:** `getSwitcherHref()` does simple prefix strip/re-add, not a slug-translation lookup (see Pattern 2 above) — this is a real, load-bearing constraint in the current codebase, not a hypothetical.
**How to avoid:** Use the identical slug in both locales for both new pages: `/mentions-legales/` + `/en/mentions-legales/`, `/confidentialite/` + `/en/confidentialite/` (or equivalent — the point is the string after any `/en/` prefix must match exactly, `<h1>` text and page content can still be fully translated).
**Warning signs:** A Playwright e2e test that clicks the language switcher from the new pages and asserts the resulting URL (mirroring the existing `about.spec.ts` pattern's nav-link test) will catch this immediately if it's wrong — this should be a required Wave 0 test, not an afterthought.

### Pitfall 2: Citing a superseded LCEN article number
**What goes wrong:** LCEN "Article 6-III" (the article CONTEXT.md's canonical refs point to) was split, renumbered, and substantially reorganized by the SREN law (Loi n° 2024-449 du 21 mai 2024) effective 2024-05-23. Article 6, III of the LCEN **no longer exists** in its old form; the identification obligations now live in **Article 1-1** (sections I and II). If the plan or the shipped page footer/source comments cite "Article 6-III," that citation is factually wrong as of the current law.
**Why it happens:** Article 6-III was the long-standing, widely-cited provision for years pre-2024; a lot of secondary sources (blog posts, templates) have not been updated and still reference it by the old number.
**How to avoid:** Reference "LCEN Article 1-1" in any code comments/plan documentation. The *substance* of the obligation is essentially unchanged (professional vs. non-professional identification split is preserved), so this does not change what content the page needs — only the citation.
**Warning signs:** Any legal-notice template found via a generic web search that says "Article 6-III" is citing outdated numbering; cross-check against Légifrance directly (verified in this research — see Sources).

### Pitfall 3: "Brand name only" identity disclosure does not satisfy LCEN for a professional site
**What goes wrong:** D-08 records the user's stated preference to show "Atelier Jacqueline Suzanne" only, with no personal name. LCEN Article 1-1, I requires **individuals whose activity is to publish the service** (i.e. professional/commercial editors) to disclose "nom, prénoms, domicile et numéro de téléphone" — first and last name, home/professional address, and phone number — publicly on the site. Only **non-professional** individual publishers (Article 1-1, II) may substitute the hosting provider's details and stay anonymous, and only if their activity is genuinely non-professional/non-monetized.
**Why it happens:** The distinction is not about whether SIRET registration is complete — it's about whether the editorial activity itself is professional in nature. A photographer's site built explicitly to showcase and (in v1.x) sell her work is a professional communication service, regardless of today's checkout status or SIRET pending-ness.
**How to avoid:** Disclose Romane's actual legal name — "Romane Lepont" (confirmed in `CLAUDE.md`'s Project description: "a bilingual...website for Romane Lepont's photography...") — alongside the "Atelier Jacqueline Suzanne" trade/brand name in the "Éditeur du site" section, e.g. "Romane Lepont, exerçant sous le nom commercial « Atelier Jacqueline Suzanne »." The brand name can and should still be the site's dominant visual identity everywhere else — this is only about the mentions légales disclosure block.
**Warning signs:** If the plan ships a mentions légales page naming only "Atelier Jacqueline Suzanne" with zero personal name, that page is very likely non-compliant with the current LCEN and should be flagged at plan-check/verify time.

### Pitfall 4: Omitting the phone number and address from the mentions légales page
**What goes wrong:** LCEN Article 1-1, I's text literally requires "domicile et numéro de téléphone" (home/professional address and phone number) for a professional individual publisher, not merely a name and email. A site that discloses only a name and an email address is technically under-disclosing.
**Why it happens:** Many small-business/freelancer mentions-légales templates online quietly drop the phone number (privacy discomfort, or simple oversight), which is itself a common real-world non-compliance pattern — do not copy that shortcut uncritically.
**How to avoid:** This is a genuine open question for the user (see Open Questions below) — not something the researcher or planner should silently resolve, since it trades off Romane's personal privacy against strict legal compliance. Options include: publishing a professional phone number (VOIP/secondary line) instead of a personal one, or accepting the disclosure as-is once she has one. Do not fabricate a placeholder phone number or skip the field silently.
**Warning signs:** Plan tasks that produce a mentions légales page with no phone number field at all (not even a placeholder) should be treated as an incomplete legal notice, not a stylistic choice.

### Pitfall 5: Treating "no banner" as "no disclosure obligation"
**What goes wrong:** Assuming that because the locale cookie is CNIL-exempt from consent, it needs no mention anywhere at all.
**Why it happens:** Conflating "exempt from consent" with "exempt from transparency" — these are different CNIL requirements.
**How to avoid:** CNIL's own guidance explicitly recommends still informing users about exempt trackers, even though no consent action is needed — this is exactly what D-01/D-02 already require (disclosed in the privacy policy's Cookies section). Just confirm the plan actually implements this disclosure, not just the "no banner" half.
**Warning signs:** A privacy policy page that never mentions `ajs_locale` at all would under-comply even though the "no banner" part is correct.

## Code Examples

### Footer nav extension pattern (D-06)
```astro
<!-- Source: src/layouts/BaseLayout.astro (existing footer, read this session) -->
<footer class="chrome-band">
  <p class="footer-text">{footerText}</p>
  <nav class="footer-legal-nav" aria-label="Legal">
    <a href={legalNoticeHref} class="nav-link">{legalNoticeLabel}</a>
    <a href={privacyHref} class="nav-link">{privacyLabel}</a>
  </nav>
</footer>
```
Uses the exact same `getRelativeLocaleUrl(locale, 'mentions-legales')` pattern already used for `homeHref`/`aboutHref`/`contactHref` in `BaseLayout.astro`'s frontmatter (lines 26-40, read this session) — no new URL-building mechanism needed.

### LCEN Article 1-1 identity block (content skeleton, not final legal copy)
```
Éditeur du site
Romane Lepont, exerçant sous le nom commercial « Atelier Jacqueline Suzanne »
[Adresse — OPEN QUESTION, see below]
[Téléphone — OPEN QUESTION, see below]
E-mail : contact@atelierjacquelinesuzanne.fr
Directeur de la publication : Romane Lepont
```
(`contact@atelierjacquelinesuzanne.fr` is the existing mailbox alias already referenced in `src/components/ContactForm.astro`'s error-message copy — reuse it here rather than inventing a new address.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| LCEN Article 6-III (identification obligations) | LCEN Article 1-1, sections I (professional) and II (non-professional) | 2024-05-23 (Loi SREN n° 2024-449 du 21 mai 2024) | Same substantive identification content, new article number. Also added a requirement (Article 1-1) for disclosing any separate data-storage sub-processor beyond the host — not applicable here since the site has no such separate sub-processor (Sanity never stores visitor data; see D-05). |

**Deprecated/outdated:** Do not cite "Article 6-III" in any shipped copy or code comments — it no longer exists in current law. Many web templates/blog posts (some found during this research) have not been updated and still reference the old number; do not copy their citation uncritically even if their *content* checklist is otherwise still accurate.

## LCEN Identity Disclosure (D-08 resolution)

**Confirmed via Légifrance (official source), current text (Article 1-1, effective 2024-05-23):**
- **Section I** (professional editors — persons "dont l'activité est d'éditer un service de communication au public en ligne"): individuals must publicly disclose "nom, prénoms, domicile et numéro de téléphone" (surname, first names, home/professional address, phone number), plus their trade/companies-register registration number if registered (SIREN/RCS), plus the name of the director of publication, plus the hosting provider's identity/address/phone.
- **Section II** (non-professional editors): may substitute the hosting provider's own name/denomination/address for their own identity, provided they've privately given their real identity to the host, who owes professional-secrecy confidentiality under Code pénal Art. 226-13/226-14 (disclosed only to judicial authorities on request).

**Application to this site:** A professional artist's site built to showcase and (in v1.x) sell her work is a professional editorial activity under Section I — this is not affected by whether SIRET registration has completed yet. **Verdict: the "brand name only" preference (D-08) is not compliant.** Recommend disclosing "Romane Lepont" (her name per `CLAUDE.md`'s project description) as the required personal identity, with "Atelier Jacqueline Suzanne" presented as her trade/commercial name in the same line — this satisfies the law while still keeping the brand front-and-center everywhere else on the site.

**Confidence: HIGH** — verified directly against Légifrance's current consolidated text (`LEGIARTI000049568614`), cross-checked against three independent French legal-practice sources (avocats-mathias.com, simonnetavocat.fr, effective-ip.fr) that all agree on the same substance and the SREN renumbering date.

## Business Status Wording

Standard, legally-recognized interim phrasing when a business registration application has been filed but the SIRET number has not yet been issued: **"SIRET en cours d'attribution"** (used on invoices/commercial documents during the guichet-unique processing window, typically 1-4 weeks after filing per multiple French business-formation sources).

Recommend the mentions légales "Statut" section read (final wording is the planner's/user's call, this is the researched building block):
- **FR:** "Statut : entreprise individuelle (micro-entrepreneur) — SIRET en cours d'attribution." *(only accurate if Romane has already filed her guichet unique registration; if she has not yet filed at all, use "immatriculation en cours de démarche" or equivalent non-committal phrasing instead — confirm her actual filing status before locking this line.)*
- **EN:** "Status: sole proprietorship (micro-entrepreneur) — SIRET registration pending."

This matches `04-UI-SPEC.md`'s existing italic-placeholder treatment and locked copy almost exactly — the only refinement is using the standard "en cours d'attribution" phrase over the more generic "en cours" if she has actually filed, since that phrase is the one auto-entrepreneurs conventionally use and recognize as accurate/non-misleading.

**Confidence: MEDIUM** — cross-referenced across multiple French business-formation guidance sources (legalplace.fr, superindep.fr, abby.fr), consistent phrasing, but this is guidance aggregation (not a Légifrance primary-source citation) since this specific phrase is a commercial/administrative convention rather than a codified legal term.

## GDPR/RGPD Minimum Notice Content

Per CNIL's own guidance on informing individuals (Article 13 RGPD, "two-level information" model), the minimum elements a privacy notice must cover, mapped to this site's actual (D-05-scoped) data flows:

| Required element (CNIL) | This site's content |
|---|---|
| Identity/contact of the data controller | Romane Lepont / Atelier Jacqueline Suzanne, contact@atelierjacquelinesuzanne.fr |
| Purpose(s) of processing | Responding to a visitor's contact-form enquiry |
| Legal basis | Consent (submitting the form is a voluntary, explicit act) — simplest framing for D-04's "plain-language, not formal" scope |
| Mandatory/optional nature of fields, consequence of non-completion | Name/email/message required to respond; honeypot field is a spam trap, not visitor data (CONT-02) |
| Recipients | Romane only — no third-party processor (per D-05: OVH is her own infrastructure, not an external processor) |
| Retention period | CNIL guidance treats ~12 months from the last exchange as proportionate for a one-off contact request — recommend stating something equivalent in plain language ("kept only as long as needed to respond to you, then deleted") rather than a formal duration if D-04's lightweight framing is preferred |
| Data subject rights | Access, rectification, erasure, objection — plus the right to lodge a complaint with the CNIL (a commonly-omitted element — must be included) |
| Cookies | `ajs_locale` disclosed as exempt/functional (see CNIL Cookie Guidance below); explicitly state no analytics/tracking cookie exists |
| Sanity | One-line disclosure per D-05: build-time-only content fetch, no visitor data reaches it |
| Hosting logs | Per D-05: host (GitHub Pages today, OVH after Phase 5) automatically logs visitor IP/user-agent as a normal function of serving pages; this is personal data under GDPR even though the site's own code never touches it |

**Best-practice note (not a blocking requirement):** CNIL recommends a "two-level" info structure — a short first-level notice directly under/near the contact form itself (identity, purpose, rights, link to full policy) plus the full policy page. `04-CONTEXT.md`/`04-UI-SPEC.md` only lock the footer-link approach (page-level disclosure); adding a one-line notice directly on the Contact page near the form (linking to the new privacy page) would more fully match CNIL's recommended pattern but is not currently a locked requirement. Flagging as a low-cost, low-risk enhancement the planner could include at its discretion, not a blocker.

**Confidence: HIGH** for the required-elements checklist (CNIL's own official guidance). **MEDIUM** for the specific 12-month retention benchmark (WebSearch-aggregated, not a hard CNIL-mandated number — CNIL explicitly does not fix one universal duration).

## CNIL Cookie Guidance (D-03 resolution)

Per CNIL's official guidance on cookies and trackers, the following categories are **exempt from consent** (no accept/reject banner required):
- Trackers preserving a user's choice about tracker deposits themselves
- Authentication trackers
- Shopping-cart-content trackers
- **User-interface personalization trackers — explicitly including language/locale choice** ("traceurs de personnalisation de l'interface utilisateur, par exemple pour le choix de la langue ou de la présentation d'un service"), when that personalization is "an intrinsic and expected element" of the service
- Load-balancing trackers
- Paywall-limiting trackers
- Audience-measurement trackers meeting strict anonymization/first-party conditions (not applicable — no analytics on this site)

**Application to this site:** `ajs_locale` (set only on an explicit user click of the FR/EN switcher, storing a single locale value, no cross-site use) squarely matches the "UI personalization / language choice" exemption. **Verdict: confirmed exempt, no consent banner required.** CNIL does still recommend disclosing exempt trackers for transparency, which is exactly what D-01/D-02 already scope (documented in the privacy policy, not gated). No code changes are needed to `LanguageSwitcher.astro`'s existing cookie-setting logic.

**Confidence: HIGH** — CNIL's official "Cookies et traceurs : que dit la loi ?" guidance page explicitly lists language-choice personalization as an exemption example, and this was independently corroborated by WebSearch aggregation of secondary sources describing the same CNIL recommendation.

## Hosting Disclosure (OVH)

Per D-07, name OVH as the host (target end-state). OVH's own publicly-listed corporate identification (for the "Hébergement" section):
- OVH SAS, 2 rue Kellermann, 59100 Roubaix, France
- RCS Lille Métropole 424 761 419
- Phone: 09 55 00 66 33

**Confidence: MEDIUM** — WebSearch-aggregated from OVH's own published legal-notices content and a French business registry lookup (annuaire-entreprises.data.gouv.fr), not fetched directly from ovhcloud.com's live legal-notices page in this session. **Recommend the planner/task verify these details directly against `https://www.ovh.com/manager/dedicated/index.html` or OVH's current published mentions légales page at execution time**, since a hosting provider's own corporate registration details can change and this is exactly the kind of factual claim that should be double-checked against the primary source immediately before publishing, not relied on from research alone.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Romane's full legal name is "Romane Lepont" | LCEN Identity Disclosure, Code Examples | If wrong/incomplete (e.g. a different legal surname, hyphenated name, married name used administratively), the mentions légales page would disclose an inaccurate legal identity — low likelihood since this is sourced from the project's own `CLAUDE.md`, but should be confirmed with Romane directly before publishing, not just inferred from a project brief. |
| A2 | OVH's current corporate mentions-légales details (address/RCS/phone quoted above) are accurate and current | Hosting Disclosure | If OVH has since updated its registered address/RCS number, the hosting-provider disclosure block would be stale; low-stakes (easy to fix) but should be verified against OVH's live legal-notices page at implementation time, not copied from this research without a final check. |
| A3 | Romane has already filed a guichet unique registration application (justifying "SIRET en cours d'attribution" phrasing rather than a less-committal "immatriculation en cours de démarche") | Business Status Wording | If she has not yet filed anything, "en cours d'attribution" would overstate her actual registration progress — a minor but real accuracy risk; must be confirmed with her directly, not assumed from PROJECT.md's "pending" note alone. |

## Open Questions

1. **Does Romane want to disclose a personal/professional address and phone number on the mentions légales page, as LCEN Article 1-1 requires for a professional individual publisher?**
   - What we know: the law requires "domicile et numéro de téléphone" for professional editors (see Pitfall 4); she has an existing business email (`contact@atelierjacquelinesuzanne.fr`) that can satisfy an email requirement, but there is no established professional address or phone line in any project doc reviewed.
   - What's unclear: whether she's willing to publish her home address/personal phone, or wants to source a low-cost professional alternative (a domiciliation address, a secondary VOIP number) before this phase ships.
   - Recommendation: surface this explicitly at plan time (likely a `checkpoint:human-verify` or a direct question back to the user) rather than fabricating placeholder contact details or silently omitting the field — omitting it silently would ship a non-compliant page without anyone noticing.

2. **Should the planner present the D-08 identity-disclosure conflict (brand-only vs. real-name-required) back to the user before locking final mentions-légales copy, or proceed directly with "Romane Lepont, exerçant sous le nom commercial « Atelier Jacqueline Suzanne »"?**
   - What we know: D-08 explicitly instructs "If research finds the brand-name-only approach is not compliant, the planner should surface that conflict rather than silently overriding the user's stated preference" — this research found exactly that.
   - What's unclear: whether the user, once shown the LCEN requirement, will accept the real-name disclosure, want to explore the non-professional-anonymity path (which this research assesses as very unlikely to be legitimately available to a commercial art site), or wants to delay this decision.
   - Recommendation: the planner should treat this as a required discuss/checkpoint moment before task execution, not resolve it unilaterally, per D-08's own instruction.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.61.1 (e2e) + Vitest 4.1.9 (unit) — both already configured |
| Config file | `playwright.config.ts` (testDir `./tests/e2e`, baseURL `http://localhost:4321`, `npm run preview` webServer) |
| Quick run command | `npx playwright test tests/e2e/legal.spec.ts` (once created) |
| Full suite command | `npm run test:e2e && npm run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|--------------|
| LEGAL-01 | FR/EN mentions légales pages render with identity/hosting/status sections, reachable from footer | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "mentions"` | ❌ Wave 0 |
| LEGAL-03 | FR/EN privacy policy pages render with all D-05 data-flow sections | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "privacy"` | ❌ Wave 0 |
| LEGAL-05 | No cookie is set by loading either legal page; no consent banner element exists anywhere on the site; `ajs_locale` cookie section text is present on the privacy page | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "cookie"` | ❌ Wave 0 |
| (regression) | Language switcher correctly navigates between FR/EN legal pages at matching slugs (Pitfall 1) | e2e | `npx playwright test tests/e2e/legal.spec.ts -g "switcher"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/e2e/legal.spec.ts`
- **Per wave merge:** `npm run test:e2e && npm run test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/e2e/legal.spec.ts` — new file, covers LEGAL-01/LEGAL-03/LEGAL-05 plus the switcher-slug regression check, mirroring the existing `tests/e2e/about.spec.ts` structure (RED-first pattern: pages don't exist yet, tests are expected to fail until the pages are built).
- [ ] No new unit-test file is anticipated — this phase has no new pure functions to unit-test (unlike `i18n-paths.ts`'s `stripBasePath`), since it reuses `getRelativeLocaleUrl` directly without new logic, provided Pitfall 1's same-slug guidance is followed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth surface introduced |
| V3 Session Management | No | No new session/cookie logic (reuses existing `ajs_locale` cookie unchanged) |
| V4 Access Control | No | Public static content, no access control needed |
| V5 Input Validation | No | No new forms or user input on either page |
| V6 Cryptography | No | No new cryptographic operations |

### Known Threat Patterns for this phase's stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Information disclosure of inaccurate/incomplete legal content (not a technical vulnerability, but the dominant real risk of this phase) | Information Disclosure (misuse) | Content accuracy review against primary legal sources before publishing (this research), plus the two Open Questions above resolved with the user before shipping final copy — a legal-compliance risk, not a code-security risk. |
| Over-disclosure of personal contact details (home address/phone) beyond what the user is comfortable publishing | Information Disclosure (privacy) | Resolve Open Question 1 explicitly with the user rather than defaulting to full disclosure or silent omission. |

This phase has effectively no technical attack surface (two static pages, no forms, no new client-side script, no new cookie logic) — its risk profile is entirely about legal-content accuracy, not application security. `security_enforcement`/ASVS gating is satisfied trivially; the real diligence for this phase is legal, not technical.

## Sources

### Primary (HIGH confidence)
- Légifrance, LCEN Article 1-1 current consolidated text (`LEGIARTI000049568614`) — identification obligations, sections I/II, fetched directly this session.
- CNIL, "Cookies et traceurs : que dit la loi ?" (cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi) — exempted-tracker categories including UI/language personalization, fetched directly this session.
- Codebase (read directly this session): `src/layouts/BaseLayout.astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/components/ContactForm.astro`, `src/components/LanguageSwitcher.astro`, `src/lib/i18n-paths.ts`, `astro.config.mjs`, `package.json`, `playwright.config.ts`, `tests/e2e/about.spec.ts`.
- `.planning/CLAUDE.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/phases/04-legal-compliance/04-CONTEXT.md`, `.planning/phases/04-legal-compliance/04-UI-SPEC.md` — all read directly this session.

### Secondary (MEDIUM confidence)
- CNIL, official guidance on informing individuals under RGPD (two-level information model, mandatory notice elements) — WebSearch-aggregated summary of CNIL's own published guidance (direct URL fetch 404'd; content cross-verified across the aggregated WebSearch result plus consistency with the well-established Article 13 checklist).
- Loi SREN (n° 2024-449 du 21 mai 2024) renumbering LCEN Article 6-III → Article 1-1, effective 2024-05-23 — cross-verified across three independent French legal-practice sources (avocats-mathias.com, simonnetavocat.fr, effective-ip.fr) plus confirmed against the Légifrance primary source above.
- OVH SAS corporate identification (address, RCS number, phone) for the hosting-provider disclosure block — WebSearch-aggregated from OVH's own published legal documents and a French business-registry lookup; **recommend re-verifying directly against OVH's live mentions-légales page before publishing** (see Hosting Disclosure section).
- "SIRET en cours d'attribution" as the standard interim phrasing for a filed-but-not-yet-issued registration — cross-referenced across multiple French business-formation guidance sites (legalplace.fr, superindep.fr, abby.fr/aide.abby.fr).
- 12-month contact-data retention benchmark — WebSearch-aggregated CNIL-adjacent guidance, not a fixed CNIL-mandated number.

### Tertiary (LOW confidence)
- None used as the basis for any stated recommendation — all findings above were cross-verified to at least MEDIUM confidence before inclusion.

## Metadata

**Confidence breakdown:**
- LCEN identity-disclosure requirements (D-08 resolution): HIGH — direct Légifrance primary-source fetch, cross-verified by three secondary sources.
- CNIL cookie exemption (D-03 resolution): HIGH — direct CNIL primary-source fetch.
- GDPR/RGPD minimum notice content: HIGH for the checklist itself, MEDIUM for the specific retention-duration benchmark.
- Business status wording convention: MEDIUM — commercial/administrative convention, not a codified legal citation.
- OVH hosting-provider disclosure details: MEDIUM — recommend re-verification against OVH's live page before shipping.
- Architecture/codebase findings (slug-switcher constraint, Pattern 3 precedent, existing footer structure): HIGH — read directly from the current codebase this session, not inferred.

**Research date:** 2026-07-08
**Valid until:** Legal-framework findings (LCEN/CNIL) are stable law/guidance — valid ~180 days absent a further legislative change. Codebase-pattern findings are valid until the next phase materially changes `BaseLayout.astro`, `i18n-paths.ts`, or the About-page pattern — recommend re-verifying at plan time if execution is delayed significantly past this research date.
