# Phase 3: About & Contact - Research

**Researched:** 2026-07-07
**Domain:** Static-site contact form delivery on zero-compute hosting (OVH Web Hosting) + static bilingual content page
**Confidence:** MEDIUM-HIGH (backend mechanism verified live; content-source premise found broken — see Open Questions)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**About Page Content**
- D-01: Reuse Romane's existing bio/background text from the current Myportfolio site (atelierjacquelinesuzanne.fr) rather than writing fresh copy.
- D-02: Single page, flowing sections (bio, then atelier/practice info underneath) — no tabs, no sub-navigation, no visually-boxed panel separation. Matches the site's existing minimal static-page pattern.
- D-03: No portrait/photo of Romane on the About page — stay text/practice-focused, consistent with a photographer who lets the work speak.
- D-04: Nothing from the current site's About/bio content needs to be dropped — whatever exists there is still accurate and can carry over as-is.

**Atelier/Practice Details (ABOUT-02)**
- D-05: The current live site only *partially* covers "where she works, medium, techniques" — some of it may need light gathering/expansion beyond a straight copy-paste, but existing content is the starting point.
- D-06: Do not guess at Romane's specific medium/technique (e.g. analog/film vs. digital, darkroom process). Use clearly-marked placeholder text for this section pending her direct input — do not infer from photo grain/style alone.

**Contact Form Destination & Confirmation**
- D-07: Submitted messages should land in Romane's existing OVH/Zimbra mailbox (the domain's active email service, confirmed in Phase 1 — see 01-CONTEXT.md D-14) — not a new/different address.
- D-08: The technical delivery mechanism is explicitly left open for the researcher to investigate and recommend (this document's primary job).
- D-09: On successful submit, show an inline confirmation ("message sent") on the same page — no redirect to a separate thank-you page.

**Form Fields & Spam Protection**
- D-10: Form fields: name, email, message only — no subject/reason field, keep it minimal.
- D-11: All three fields (name, email, message) are required — no optional fields.
- D-12: Spam protection is honeypot only (per CONT-02, locked by roadmap) — no additional rate-limiting or CAPTCHA layer requested.

### Claude's Discretion
- Exact visual treatment of the About page's section breaks (spacing/typography within the "single flowing page" structure) — no specific preference stated beyond D-02.
- Wording of the inline confirmation message and any client-side validation error states.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ABOUT-01 | Visitor can read an About/bio page covering Romane's background and artistic approach | Content-source pattern confirmed (hardcode in `.astro` pages, matching existing `galleries/index.astro` precedent). **However:** the live-site bio text this requirement's copy is meant to come from (D-01) was not found anywhere on the current site during this research — see Open Questions. Planner must resolve this gap before an executor can "reuse existing text." |
| ABOUT-02 | About page includes atelier/practice information (where she works, medium, techniques) | Same hardcoding pattern; D-06's placeholder-copy approach is locked and its exact FR/EN text is already specified in `03-UI-SPEC.md` Layout Notes — plan can reference it directly, no further research needed for this part. |
| CONT-01 | Visitor can contact Romane via a contact form | Web3Forms recommended as the delivery backend (client-side `fetch()` to `https://api.web3forms.com/submit`, no server/PHP required) — verified live against the actual API. See Standard Stack and Code Examples. |
| CONT-02 | Contact form is protected against spam (e.g. honeypot) | Recommend a pure client-side honeypot short-circuit (matches `03-UI-SPEC.md`'s locked hidden-field contract) — decouples spam-gating entirely from the chosen backend vendor. See Architecture Patterns. |
</phase_requirements>

## Summary

This phase has one deceptively simple technical question (D-08) and one content-sourcing assumption (D-01/D-04) that turned out not to hold up under verification.

**The backend question (D-08) is resolved:** OVH Web Hosting's "Free hosting" tier (the plan this project actually uses, confirmed in `01-CONTEXT.md` D-12/D-13) has documented, unresolved ambiguity around whether PHP's `mail()` function is even available on entry-level/free OVH shared plans — community sources disagree, and OVHcloud's own docs don't state it plainly for this specific tier. More importantly, **a PHP-based solution cannot be tested or verified during this phase at all**, because the project's current live deploy target is GitHub Pages (a pure static file host with zero PHP execution — confirmed in `.github/workflows/deploy.yml` and `01-CONTEXT.md` D-12), and production OVH cutover doesn't happen until Phase 5. Any contact-form mechanism built and shipped in Phase 3 must work, unmodified, on both hosts. A third-party form-backend SaaS reached via client-side `fetch()` satisfies this immediately: it is entirely host-agnostic, since the browser — not the server — makes the network call. This research recommends **Web3Forms**, verified live via direct API calls (see Sources): 250 free submissions/month, a single-email signup (no account wall), and a documented AJAX/JSON submission pattern. The access key it issues is designed to be publicly embedded (it appears in Web3Forms' own plain-HTML form example), so there is no secret-handling problem. Because the relay email arrives at Romane's inbox as a normal external message sent *to* her address (not spoofed *from* her domain), this mechanism has **zero interaction with the domain's existing MX/SPF records** — no DNS risk to the active Zimbra mailbox (D-07, `01-CONTEXT.md` D-14).

**The content-sourcing assumption (D-01/D-04) needs the planner's attention:** live verification of the current site (`atelierjacquelinesuzanne.fr`) found **no About/bio page and no atelier/practice text anywhere** — not in the navigation, not on the gallery index, not on the contact page. D-01 ("reuse existing bio text") and D-04 ("nothing needs to be dropped, whatever exists is accurate") both presuppose bio content exists on the live site to copy from. It does not appear to, at least not anywhere a normal visitor (or this research) could reach. This doesn't block writing this document, but it is a load-bearing finding for planning — see Open Questions.

A second, smaller content-verification finding: the live site's Contact page currently displays the address `contact@jacquelinesuzanneatelier.fr` — a different domain (word order reversed) than `atelierjacquelinesuzanne.fr`, the domain whose Zimbra mailbox D-07 names as the delivery target. This needs explicit confirmation before an executor picks a destination address.

**Primary recommendation:** Build the contact form as a dependency-free vanilla-JS island (matching the existing `Lightbox.astro`/`LanguageSwitcher.astro` pattern — no framework), submitting via `fetch()` to Web3Forms with a fully client-side honeypot short-circuit, and hardcode About-page content directly in the `.astro` page pairs (no new Sanity schema). Flag the bio-content and destination-email gaps to the planner as blocking-before-execution items, not blocking-before-planning items.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| About page content rendering | Static Build (Astro prerender) | — | All content resolves to HTML at build time; OVH has zero request-time compute (`astro.config.mjs`: `output: 'static'`) |
| Contact form field validation (required, email format) | Browser/Client (vanilla-JS island) | — | No server exists to validate; must happen in the visitor's browser before any network call |
| Honeypot spam check (CONT-02) | Browser/Client (vanilla-JS island) | — | Must short-circuit *before* the network call fires — a purely client-side gate is the only option on static hosting, and it must not depend on any specific backend vendor's own anti-spam field |
| Contact message delivery to Romane's inbox | External SaaS (Web3Forms) | Browser/Client (initiates the API call) | Static hosting cannot itself send email; a third-party relay is the only tier capable of accepting the POST and emailing the destination inbox |
| Success/error UI feedback (D-09) | Browser/Client | — | Inline, no-redirect confirmation is only achievable via JS intercepting the submit and rendering a live region — a plain HTML form POST would navigate away or redirect |
| Locale routing for both pages | Static Build (`astro:i18n`) | — | Unchanged from Phase 1/2 pattern — no new routing mechanism needed |

## Standard Stack

### Core

| Service/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web3Forms (`https://api.web3forms.com/submit`) | REST API, no SDK/package to install | Receives the contact form POST and relays it as an email to Romane's configured inbox | [VERIFIED: own live API test, 2026-07-07] Confirmed reachable and functioning via a direct `curl` POST (see Sources) — free tier is 250 submissions/month [ASSUMED — figure from WebSearch aggregation, not an official pricing page fetch, since `web3forms.com/pricing` returned HTTP 403 to WebFetch]. No npm/PyPI package required — it is consumed via a plain browser `fetch()` call, so there is nothing to install, version-pin, or run through the Package Legitimacy Gate. |

**No `npm install` needed for this phase.** The one new external dependency (Web3Forms) is a client-side HTTP call, not a package.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None — reuse existing `astro:i18n`, `BaseLayout.astro`, plain `<script>` island pattern | n/a | No new supporting library needed | This phase adds zero new npm dependencies |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web3Forms | Formspree | Lower free tier (50 submissions/month vs. Web3Forms' 250 [ASSUMED, WebSearch-aggregated]); very similar mechanics (action URL + AJAX JSON response, honeypot support). Reasonable fallback if Web3Forms's access-key signup flow or delivery proves unreliable during Wave 0 verification. |
| Web3Forms | OVH PHP `mail()` endpoint | Ruled out for this phase: (1) unverified whether the OVH "Free hosting" tier even exposes `mail()` — community sources disagree and OVH's own docs don't confirm it for this specific tier [LOW confidence, contradictory WebSearch sources]; (2) even if available, it is **untestable until Phase 5** because current staging (GitHub Pages) has no PHP runtime at all — a hard blocker for verifying this phase's own success criteria before Phase 5 exists. Revisit only if Web3Forms/Formspree-style services become unacceptable for some reason discovered later (e.g. Romane needs webhook-based automation Sanity-side). |
| Web3Forms | EmailJS | Requires connecting/OAuth-linking an actual sending email account (Gmail/Outlook) to their service, rather than just naming a destination address — more setup friction, and awkward for delivering into a business Zimbra mailbox specifically. Not recommended. |
| Web3Forms | Stripe/Sanity-hosted form (n/a) | Not applicable — no server-side compute exists to host a custom form handler; would require reintroducing exactly the Cloudflare Pages Functions architecture the OVH override explicitly ruled out in Phase 1. |

**No installation step required** — the phase's implementation work is: get a Web3Forms access key (email signup, no code), then write a vanilla-JS `<form>` + `<script>` island that POSTs JSON to their endpoint.

## Package Legitimacy Audit

**Not applicable this phase.** No new npm, PyPI, or other registry packages are being installed. Web3Forms is consumed exclusively via a browser `fetch()` call to a public HTTPS endpoint — there is no SDK, client library, or dependency to vet through the Package Legitimacy Gate. If a future phase reconsiders this (e.g. swapping to a package-based form library), re-run the gate at that time.

## Architecture Patterns

### System Architecture Diagram

```
Visitor's Browser
  │
  ├─ GET /about (or /en/about) ─────► Static HTML (prerendered at build time,
  │                                    content hardcoded in .astro page)
  │
  └─ GET /contact (or /en/contact) ─► Static HTML + ContactForm island JS
        │
        │  visitor fills Name / Email / Message
        │  (honeypot field remains empty for real visitors)
        ▼
   [Client-side JS: on submit]
        │
        ├─ honeypot field non-empty? ──YES──► skip network call, show
        │                                      same success message
        │                                      (spam silently discarded)
        NO
        │
        ├─ required-field / email-format check fails? ──YES──► show
        │                                                        per-field
        │                                                        error text
        NO
        │
        ▼
   fetch("https://api.web3forms.com/submit", {
     method: POST, Content-Type: application/json,
     body: { access_key, name, email, message }
   })
        │
        ▼
   Web3Forms (external SaaS, US-hosted)
        │
        │  relays as a normal email FROM web3forms.com's own sending
        │  domain TO Romane's configured destination address
        │  (no interaction with atelierjacquelinesuzanne.fr's MX/SPF)
        ▼
   Romane's existing OVH/Zimbra mailbox
        │
        ▼
   JSON response ──► Browser shows inline aria-live success/error message
                      (D-09: no redirect, no page navigation)
```

### Recommended Project Structure

```
src/
├── components/
│   └── ContactForm.astro     # New: vanilla-JS island, mirrors Lightbox.astro's
│                              # pattern (typed <script>, no framework)
├── lib/
│   └── contact-form.ts       # New: pure, dependency-free functions —
│                              # isValidEmail(), isHoneypotTriggered(),
│                              # buildWeb3FormsPayload() — unit-testable
│                              # AND safe to import into the client <script>
│                              # (no Node/build-only APIs, unlike sanity.ts)
├── pages/
│   ├── about.astro            # FR — hardcoded bio + atelier/practice copy
│   ├── contact.astro          # FR — <ContactForm />
│   └── en/
│       ├── about.astro        # EN mirror
│       └── contact.astro      # EN mirror
```

### Pattern 1: Client-side-only honeypot short-circuit (decoupled from backend vendor)

**What:** The hidden `website` field (already fully specified visually/behaviorally in `03-UI-SPEC.md`) is checked in the submit handler *before* any network call is made. If non-empty, skip `fetch()` entirely and render the same success message shown to real senders.

**When to use:** Any static-only form where no server exists to enforce spam rules server-side.

**Example:**
```typescript
// src/lib/contact-form.ts — pure function, safe for both Vitest and the
// client <script> bundle (no Node-only APIs, no secrets).
export function isHoneypotTriggered(value: string): boolean {
  return value.trim().length > 0;
}
```
```typescript
// In ContactForm.astro's <script>, following Lightbox.astro's typed,
// framework-free DOM-query style:
import { isHoneypotTriggered, isValidEmail } from '../lib/contact-form';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const honeypot = (form.elements.namedItem('website') as HTMLInputElement).value;
  if (isHoneypotTriggered(honeypot)) {
    showSuccess(); // never reveal detection to whoever/whatever submitted it
    return;
  }
  // ...real validation + fetch() call below
});
```

**Why this matters:** This makes CONT-02 fully independent of which SaaS backend is chosen — the honeypot gate never touches Web3Forms at all, so switching providers later (e.g. to Formspree) requires zero change to the spam-protection logic.

### Pattern 2: AJAX JSON submission to Web3Forms (inline confirmation, no redirect)

**What:** POST JSON (not `FormData`/native form submission) to get a JSON response back instead of Web3Forms' default redirect behavior, satisfying D-09.

**Example:**
```javascript
// Source: https://docs.web3forms.com (llms-full.txt, fetched 2026-07-07)
fetch("https://api.web3forms.com/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    access_key: import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY,
    name: nameValue,
    email: emailValue,
    message: messageValue,
  }),
})
  .then(async (response) => {
    const json = await response.json();
    if (response.status === 200) {
      showSuccess(json.message);
    } else {
      showSubmissionError();
    }
  })
  .catch(() => showSubmissionError());
```

`import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY` follows the exact `PUBLIC_`-prefix convention Astro requires to inline an env var into client-shipped JS [CITED: docs.astro.build/en/guides/environment-variables/] — the same mechanism already used for `import.meta.env.BASE_URL` in `BaseLayout.astro`/`LanguageSwitcher.astro`. The key itself is not a secret (Web3Forms' own docs embed it in a plain `<input type="hidden">` in their canonical example), so committing it to `.env`/CI secrets is a convenience for rotation, not a security requirement.

### Pattern 3: Hardcoded bilingual static content (no new Sanity schema)

**What:** About-page bio/atelier copy lives as literal FR/EN strings directly inside `src/pages/about.astro` and `src/pages/en/about.astro`, matching the existing precedent in `src/pages/galleries/index.astro` (which already hardcodes its `<h1>Galeries</h1>` and empty-state copy rather than sourcing it from Sanity).

**When to use:** Content that (a) isn't part of `CMS-01`'s scope (galleries only), (b) changes rarely, and (c) is currently blocked on Romane supplying real text anyway (D-06's placeholder) — so a code-edit workflow is not meaningfully worse than a CMS-edit workflow for this content, and avoids standing up a new Sanity schema, token scope, and publish step for a single static page.

**Example:**
```astro
---
// src/pages/about.astro (FR)
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="À propos — Atelier Jacqueline Suzanne">
  <div class="about-page">
    <h1>À propos</h1>
    <p>{/* bio text — see Open Questions: source not found on live site */}</p>
    <h2>Atelier &amp; pratique</h2>
    <p>{/* migrated/expanded atelier text per D-05 */}</p>
    <p class="placeholder">
      Précisions sur le médium et la technique à venir — en attente de
      confirmation avec l'artiste.
    </p>
  </div>
</BaseLayout>
```

### Anti-Patterns to Avoid

- **Server-side validation or spam-filtering assumptions:** There is no server. Any validation not implemented in the browser (or delegated to Web3Forms) simply does not happen. Do not write code, comments, or tests that assume a server-side check exists "as a backstop."
- **Native (non-AJAX) form submission to Web3Forms:** Without the `fetch()`+JSON pattern, Web3Forms' default behavior is a redirect (or a `Thank You` page if `redirect` is configured) — this breaks D-09's inline, no-navigation requirement.
- **Reusing Web3Forms' own `botcheck` field name/mechanism as the sole spam gate:** Doing so would couple CONT-02's implementation to one vendor's API shape and bypass the UI-SPEC's already-locked hidden-field contract (`website`, `position: absolute; left: -9999px`). Keep the client-side check as the actual gate; Web3Forms' own protections are a bonus, not a dependency.
- **Testing the real Web3Forms endpoint from CI via `curl`/non-browser requests:** Verified directly (see Sources) — Web3Forms' free tier explicitly rejects non-browser-context requests ("Use our API in client side..."), so any CI smoke test that isn't a real browser (Playwright) will get a 403, not a meaningful pass/fail signal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sending an email from a static site with no server | A PHP mail script, an SMTP client in JS, or any custom relay | Web3Forms (client-side `fetch()` POST) | Static hosting fundamentally cannot send email itself; every viable path is "hand off to something that can," and a purpose-built free-tier SaaS is simpler and more portable across hosts (GitHub Pages now, OVH later) than a bespoke PHP endpoint tied to one host |
| Email-format validation | A full RFC 5322-compliant regex/parser | `<input type="email">` + a light client-side format check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` or the input's own `validity.valid`) | Real-world email validation edge cases are notoriously deep; a minimal client-side sanity check plus Web3Forms' own downstream handling is sufficient for a low-volume contact form — full RFC compliance buys nothing here |
| Spam detection beyond a honeypot | A custom bot-scoring system, IP rate-limiting, custom CAPTCHA | Honeypot only (locked by CONT-02/D-12) | Explicitly out of scope per roadmap — do not add complexity the user didn't ask for |

**Key insight:** Everything in this phase that looks like "backend work" is actually either (a) client-side JS, or (b) delegated to a third party. Resist the urge to build anything that assumes request-time server compute — it doesn't exist on this hosting plan, now or after Phase 5.

## Common Pitfalls

### Pitfall 1: Building/testing against a PHP mail() assumption that can't be verified until Phase 5
**What goes wrong:** A plan that wires up a PHP form-handler script now, intending to "verify it in production later," ships an untested code path and discovers at Phase 5 cutover that OVH's Free tier doesn't support `mail()`, or that deliverability/spam-scoring is poor.
**Why it happens:** CLAUDE.md's stack section and general web folklore treat "shared PHP hosting → PHP mail()" as a default assumption, but this project's specific tier (OVH Free hosting, not a paid Mutualisé plan) has unverified/contradictory support signals, and the current staging host (GitHub Pages) can't run PHP at all to prove it out early.
**How to avoid:** Use a backend mechanism (Web3Forms) that is host-agnostic and can be fully verified today, on the current staging deploy, with no dependency on Phase 5 having happened yet.
**Warning signs:** Any task description that says "test this after the Phase 5 domain cutover" for a Phase 3 success criterion.

### Pitfall 2: CORS/bot-detection blocking automated (non-browser) verification
**What goes wrong:** A CI script or `curl`-based smoke test against `api.web3forms.com/submit` returns `403 Forbidden` with `"This method is not allowed. Use our API in client side..."`, and gets misread as "the integration is broken" when it's actually working as designed for browser-only requests.
**Why it happens:** [VERIFIED: own live test, 2026-07-07] Web3Forms' free tier rejects non-browser-context POST requests server-side (confirmed by direct `curl` — see Sources). A Playwright test (real Chromium) should behave like a genuine browser, but this has not been separately verified in this research session — Cloudflare-fronted bot management (visible in the API's response headers) occasionally also flags headless browser traffic.
**How to avoid:** Do not gate CI on a real network call to Web3Forms. Instead: (a) unit-test the pure validation/honeypot functions directly, (b) in Playwright e2e tests, intercept/mock the `fetch()` call (`page.route()`) to assert the correct payload and that the inline success UI renders, and (c) reserve exactly one real, human-verified submission (checking Romane's actual inbox) as a manual checkpoint, not an automated gate.
**Warning signs:** A CI job that calls the live Web3Forms endpoint and treats a 403 as a hard failure.

### Pitfall 3: Assuming D-01's "existing bio text" exists somewhere reachable
**What goes wrong:** An executor starts Phase 3 assuming a bio/about page can simply be copy-pasted from the live site, discovers mid-task that no such page or text exists, and has no clear escalation path defined by the plan.
**Why it happens:** D-01/D-04 were written based on an assumption about the current site's content that this research's live verification did not confirm — see Open Questions.
**How to avoid:** Planner should treat the bio-text sourcing step as a checkpoint/gathering task (parallel to how D-06 already handles atelier/technique specifics with placeholder copy), not an assumed-available copy-paste step.
**Warning signs:** A task that says "copy the bio text from the live site" with no fallback if that text can't be located.

### Pitfall 4: Sending to the wrong destination mailbox
**What goes wrong:** The Web3Forms access key gets configured with the domain-mismatched address found on the live site (`contact@jacquelinesuzanneatelier.fr`) instead of an address on `atelierjacquelinesuzanne.fr`, silently missing D-07's actual intent.
**Why it happens:** The only "existing" contact address this research could find live is on a differently-spelled domain than the one whose Zimbra mailbox D-07 names.
**How to avoid:** Confirm the exact destination mailbox address with the user/Romane before configuring the Web3Forms access key — do not assume either address without confirmation.
**Warning signs:** Skipping this confirmation step because "an existing address was already found" during planning.

## Code Examples

### Minimal client-side email format check (no full RFC parser)
```typescript
// src/lib/contact-form.ts
export function isValidEmail(value: string): boolean {
  // Deliberately loose — matches the "Don't Hand-Roll" guidance: a full
  // RFC 5322 validator is not worth building for a 3-field contact form.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
```

### Full submit handler shape (combining Patterns 1 + 2)
```typescript
// src/components/ContactForm.astro <script>, TypeScript, no framework —
// mirrors Lightbox.astro's typed, DOM-query, addEventListener style.
import { isHoneypotTriggered, isValidEmail } from '../lib/contact-form';

const form = document.querySelector<HTMLFormElement>('#contact-form');
const liveRegion = document.querySelector<HTMLElement>('[data-role="form-status"]');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const honeypot = String(data.get('website') ?? '');

  if (isHoneypotTriggered(honeypot)) {
    renderSuccess(); // spam: discard silently, still show success (UI-SPEC)
    return;
  }

  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const message = String(data.get('message') ?? '').trim();

  const errors = validate({ name, email, message }); // per-field checks
  if (errors.length > 0) {
    renderFieldErrors(errors);
    return;
  }

  setSubmitting(true);
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY,
        name,
        email,
        message,
      }),
    });
    const json = await response.json();
    if (response.ok && json.success) {
      renderSuccess();
      form.reset();
    } else {
      renderSubmissionError();
    }
  } catch {
    renderSubmissionError();
  } finally {
    setSubmitting(false);
  }
});
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Web3Forms free tier is 250 submissions/month | Standard Stack | Low — WebSearch-aggregated from multiple comparison sites, not the official pricing page (which returned 403 to WebFetch). If actually lower, a low-traffic portfolio contact form is still very unlikely to exceed even a conservative free-tier cap; verify against the account dashboard once signed up. |
| A2 | Formspree free tier is 50 submissions/month | Alternatives Considered | Low — same WebSearch-aggregation caveat as A1; only relevant if the primary recommendation is rejected. |
| A3 | Playwright's headless Chromium will be treated as a legitimate "client-side" request by Web3Forms' bot protection (not blocked like the verified `curl` 403) | Common Pitfalls (Pitfall 2) | Medium — if wrong, e2e tests hitting the real endpoint will falsely fail; mitigated by the recommendation to mock/intercept the network call in automated tests regardless. |
| A4 | OVH "Free hosting" tier's PHP `mail()` availability is genuinely uncertain (not simply "yes" or "no") | Alternatives Considered | Low — this claim is used only to justify *not* choosing PHP mail(), and the chosen alternative (Web3Forms) sidesteps the question entirely; doesn't block execution either way. |
| A5 | Web3Forms relays via its own sending domain (not by spoofing `atelierjacquelinesuzanne.fr`), so there is no MX/SPF interaction | Summary | Medium — this is standard behavior for this class of service and consistent with how the API/docs describe delivery, but was not independently confirmed by inspecting actual email headers from a real test submission. Recommend a real test submission during execution to confirm the received message's `From:` domain and that it doesn't trigger any SPF/DMARC warnings in Romane's Zimbra inbox. |

## Open Questions (RESOLVED)

1. **Where does D-01's "existing bio/background text" actually live?**
   - What we know: Live verification (direct fetch of `atelierjacquelinesuzanne.fr`, its `/work`, `/contact`, `/test` pages, and its full nav-link list) found no About/bio page and no atelier/practice text anywhere on the crawlable site.
   - What's unclear: Whether this content exists somewhere not discoverable via a plain page fetch (e.g., a private doc Florian/Romane already have, an Instagram caption, a PDF press kit) — this research could not access those.
   - Recommendation: Planner should add an explicit content-gathering/confirmation step before the About-page copy task — likely a `checkpoint:human-verify` requesting Florian/Romane supply the actual bio text, rather than assuming an executor can "copy it from the live site."
   - **RESOLVED:** Resolved via 03-CONTEXT.md's Post-Research Amendments section (D-01/D-04 amendment) — the reuse premise does not hold, so the About page ships with clearly-marked italic placeholder bio/practice copy for Romane to fill in before launch. Implemented in plan 03-01 (Task 2 hardcodes the FR/EN bio-section placeholder strings; Task 1's e2e RED test asserts them). No `checkpoint:human-verify` needed at plan time — the placeholder-copy treatment replaces the content-gathering blocker.

2. **What is the correct destination mailbox address for the contact form?**
   - What we know: D-07 specifies "Romane's existing OVH/Zimbra mailbox" on `atelierjacquelinesuzanne.fr` (per `01-CONTEXT.md` D-14). The current live site's own Contact page displays `contact@jacquelinesuzanneatelier.fr` — a different domain (reversed word order).
   - What's unclear: Whether that's a typo-variant domain Romane also owns that forwards to the same Zimbra inbox, a genuinely separate mailbox, or simply stale/wrong copy on the old site.
   - Recommendation: Confirm the exact address with the user before wiring the Web3Forms access key to a destination inbox.
   - **RESOLVED:** Resolved via 03-CONTEXT.md's D-07 clarification — confirmed the form delivers to the `atelierjacquelinesuzanne.fr` mailbox as D-07 originally states; the live site's reversed-word-order `jacquelinesuzanneatelier.fr` address is treated as legacy/incidental, not a signal to change destination. Implemented via plan 03-02's `user_setup` (Web3Forms access key configured against the confirmed `atelierjacquelinesuzanne.fr` inbox).

3. **Does Web3Forms' bot/Cloudflare protection allow Playwright-driven (headless Chromium) submissions in CI, or only "real" human browser sessions?**
   - What we know: A raw `curl` POST to the live endpoint was explicitly rejected (403, "Use our API in client side"). This confirms the mechanism requires genuine browser-context requests, but this research did not run an actual Playwright test against the live endpoint to confirm headless Chromium clears that bar.
   - What's unclear: Whether CI-run Playwright tests can reliably hit the real endpoint, or whether they'll intermittently get flagged.
   - Recommendation: Don't depend on it either way — mock/intercept the network call for the automated e2e suite (Pitfall 2), and treat one manual, human-run submission as the actual proof of end-to-end delivery.
   - **RESOLVED (sidestepped by design):** The dependency is avoided entirely — plan 03-02 (Task 1) mocks the Web3Forms network call via Playwright's `page.route()` rather than hitting the live endpoint, matching this document's own recommendation (Pitfall 2). CI never depends on Web3Forms' bot-detection behavior; a single manual human-verified submission remains the proof of real end-to-end delivery, tracked as a checkpoint (not an automated gate).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Web3Forms API (`api.web3forms.com`) | CONT-01 delivery mechanism | ✓ [VERIFIED: live curl test returned a structured JSON response, not a network failure] | REST API, no version | Formspree (see Alternatives Considered) |
| GitHub Pages (current staging host) | Testing this phase's form before Phase 5 | ✓ (already live and deploying per `01-CONTEXT.md` D-12, unchanged this phase) | — | — |
| OVH Web Hosting PHP runtime | Not used this phase (ruled out — see Alternatives Considered) | Unverified/uncertain for the Free tier | Unknown | N/A — Web3Forms avoids needing this entirely |
| Node 22 / npm (existing CI toolchain) | Build + test pipeline, unchanged | ✓ (already configured in `.github/workflows/deploy.yml`) | Node 22 | — |

**Missing dependencies with no fallback:** None — the chosen path (Web3Forms) has no hard dependency on anything not already confirmed available.

**Missing dependencies with fallback:** OVH PHP mail() capability is unconfirmed, but this phase does not depend on it (Web3Forms is the primary path; Formspree is the fallback if Web3Forms itself proves unworkable).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already configured, unchanged this phase |
| Config file | `vitest.config.ts` (uses Astro's `getViteConfig` so `astro:i18n` resolves), `playwright.config.ts` |
| Quick run command | `npx vitest run tests/unit/contact-form.test.ts` |
| Full suite command | `npm run test:unit && npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ABOUT-01 | About page renders bio content in both FR and EN at their respective locale routes | e2e | `npx playwright test tests/e2e/about.spec.ts` | ❌ Wave 0 |
| ABOUT-02 | About page renders atelier/practice section, including the exact D-06 placeholder copy when real content isn't yet available | e2e | `npx playwright test tests/e2e/about.spec.ts` | ❌ Wave 0 (same file as above) |
| CONT-01 | Contact form accepts valid input and shows an inline success message without navigating away (D-09) | e2e (network call mocked via `page.route()` — see Pitfall 2) | `npx playwright test tests/e2e/contact.spec.ts` | ❌ Wave 0 |
| CONT-01 (real delivery) | A genuine submission actually reaches Romane's inbox | manual-only (justified: cannot be reliably automated against a bot-protected free-tier API — see Open Question 3) | `checkpoint:human-verify` — Florian or Romane submits the live form once post-deploy and confirms receipt | N/A |
| CONT-02 | Honeypot-filled submissions never trigger a real network call and still show success | unit (pure function) + e2e | `npx vitest run tests/unit/contact-form.test.ts` (unit for `isHoneypotTriggered`) + Playwright fill-and-assert-no-request test | ❌ Wave 0 (both files) |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/unit/contact-form.test.ts`
- **Per wave merge:** `npm run test:unit && npm run test:e2e`
- **Phase gate:** Full suite green, plus the one manual human-verify submission checkpoint, before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/contact-form.ts` — pure functions (`isValidEmail`, `isHoneypotTriggered`, field-required checks) — does not exist yet
- [ ] `tests/unit/contact-form.test.ts` — unit tests for the above, following `tests/unit/i18n-paths.test.ts`'s existing style
- [ ] `tests/e2e/about.spec.ts` — new file
- [ ] `tests/e2e/contact.spec.ts` — new file, including a `page.route()`-mocked submission test and a honeypot-fill test
- [ ] `PUBLIC_WEB3FORMS_ACCESS_KEY` — add to `.env.example`, local `.env`, and CI repo secrets (or plain repo var, since it's not sensitive) once a Web3Forms account/key is obtained

*(Framework itself: no install needed — Vitest and Playwright are already present in `package.json` devDependencies.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface exists in this phase |
| V3 Session Management | No | No sessions involved |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | Yes | Client-side required-field + email-format checks (Code Examples); message content is only ever relayed to email, never rendered back into any page, so stored/reflected XSS via the message field is not a realistic vector in this phase |
| V6 Cryptography | No | No cryptographic operations performed by this phase's code; Web3Forms' access key is a public/embeddable identifier by design, not a secret requiring cryptographic handling |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Automated/bot form spam | Denial of Service (resource exhaustion of Web3Forms' free-tier quota / Romane's inbox) | Honeypot short-circuit (CONT-02, D-12) — locked scope, no CAPTCHA added |
| Direct API abuse (bypassing the site entirely, POSTing straight to Web3Forms with the public access key) | Spoofing / Denial of Service | Out of scope to fully prevent on a static site with no server-side rate limiting; Web3Forms' own free-tier quota and bot-detection (verified to reject non-browser requests) provide the only available backstop. Not a blocking concern for a low-traffic single-artist site. |
| Message content injected into a future admin-facing view | Tampering (stored XSS) | Not applicable this phase — messages are only ever relayed to email by Web3Forms, never stored/displayed by this codebase. Flag for whoever builds any future "view past submissions" feature (not in current scope). |

## Sources

### Primary (HIGH confidence)
- Direct `curl` test against `https://api.web3forms.com/submit` (this research session, 2026-07-07) — confirmed live, reachable, and that non-browser-context requests are explicitly rejected with a structured JSON error.
- `docs.web3forms.com/llms-full.txt` (fetched 2026-07-07) — official docs: access-key signup flow, plain-HTML form example, honeypot (`botcheck`) field, AJAX/JSON `fetch()` submission pattern.
- `docs.astro.build/en/guides/environment-variables/` — official confirmation of the `PUBLIC_` prefix requirement for client-exposed env vars.
- This codebase: `astro.config.mjs`, `.github/workflows/deploy.yml`, `src/layouts/BaseLayout.astro`, `src/components/LanguageSwitcher.astro`, `src/components/Lightbox.astro`, `src/pages/galleries/index.astro`, `src/lib/sanity.ts`, `src/lib/i18n-paths.ts`, `tests/unit/i18n-paths.test.ts`, `vitest.config.ts`, `playwright.config.ts`, `.planning/config.json` — direct inspection, HIGH confidence (primary source, not training data).
- Direct `WebFetch` of `https://atelierjacquelinesuzanne.fr` and its `/work`, `/contact`, `/test`, `/about`, `/info` paths (2026-07-07) — confirmed no About/bio content exists on the crawlable live site, and that the Contact page displays `contact@jacquelinesuzanneatelier.fr`.

### Secondary (MEDIUM confidence)
- WebSearch aggregation on Web3Forms free-tier submission cap (250/month) and honeypot/hCaptcha features — multiple independent comparison sources agree, but the official pricing page itself returned HTTP 403 to WebFetch, so this is not a direct-source confirmation.
- WebSearch aggregation on Formspree free-tier cap (50/month) — consistent across multiple sources.

### Tertiary (LOW confidence)
- WebSearch aggregation on OVH "Hébergement Mutualisé"/Free-tier PHP `mail()` availability — sources directly contradict each other (community forum claims both "not available on the entry perso offer" and "available on all paid mutualisé plans including perso" in the same result set). Not used as the basis for any recommendation — only cited to justify avoiding this path rather than trusting it.

## Metadata

**Confidence breakdown:**
- Standard stack (Web3Forms mechanics): HIGH — directly verified via live API call and official docs
- Standard stack (free-tier limits/pricing): MEDIUM — WebSearch-aggregated, official pricing page unreachable
- Architecture/patterns: HIGH — directly derived from existing, working codebase conventions (Lightbox.astro, i18n-paths.ts)
- Content-sourcing premise (D-01/D-04): LOW-confirmed-broken — live verification found the assumed source content does not exist where expected; flagged prominently, not glossed over
- Pitfalls: MEDIUM-HIGH — several verified live (Web3Forms bot-rejection, missing bio content), one (Playwright bot-detection behavior) unverified and flagged as such

**Research date:** 2026-07-07
**Valid until:** ~30 days (Web3Forms free-tier terms and OVH hosting-tier specifics could change; re-verify if planning is delayed significantly past this window)
