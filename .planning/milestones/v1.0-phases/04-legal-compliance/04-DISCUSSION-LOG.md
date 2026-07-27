# Phase 4: Legal & Compliance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-08
**Phase:** 4-Legal & Compliance
**Areas discussed:** Locale cookie treatment, Privacy policy depth, Page placement & identity

---

## Locale Cookie Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Exempt — document only | Single functional preference cookie, no tracking/sharing; CNIL generally exempts strictly-necessary cookies | ✓ |
| Informational notice, no gate | Non-blocking notice mentions the cookie but doesn't gate it | |
| Full accept/reject banner | Locale switcher wouldn't set the cookie until accepted | |

**User's choice:** Exempt — document only.

| Option | Description | Selected |
|--------|-------------|----------|
| No banner — policy link in footer | Matches the exempt choice; disclosed via privacy policy only | ✓ |
| Small dismiss-once bottom bar | Shown once per visitor, then never again | |
| Persistent bottom bar until dismissed | Stays until actively dismissed | |

**User's choice:** No banner — policy page link in footer suffices.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, verify during research | Researcher checks current CNIL guidance on language-preference cookies specifically | ✓ |
| No, proceed on the exempt assumption | Skip explicit verification | |

**User's choice:** Yes, verify during research.
**Notes:** This resolves the flag Phase 1 (D-03 in `01-CONTEXT.md`) explicitly left open for Phase 4 to decide.

---

## Privacy Policy Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight, plain-language | Short, readable notice appropriate for a small personal/artist site | ✓ |
| Full formal GDPR Article 13 notice | Comprehensive legal document with full processor list, legal basis, etc. | |

**User's choice:** Lightweight, plain-language.

| Option | Description | Selected |
|--------|-------------|----------|
| Contact form → email → Romane's OVH inbox | Required disclosure | ✓ |
| Sanity CMS (build-time only) | One-line mention, no visitor PII involved | ✓ |
| Hosting logs (GitHub Pages / OVH) | Standard access logs, technically personal data under GDPR | ✓ |

**User's choice:** All three selected.
**Notes:** User initially didn't understand the question — clarified with concrete plain-language framing ("which paths does visitor information take, and who touches it") before re-asking.

| Option | Description | Selected |
|--------|-------------|----------|
| Describe the intended/target flow | Write for the end-state (Web3Forms or OVH mail(), whichever Phase 5 lands on) | (superseded) |
| Describe only what's currently true | State the form doesn't yet deliver messages | (superseded) |

**User's choice:** Neither as originally framed. User clarified mid-discussion that **OVH's PHP mail() is the confirmed real target mechanism, not Web3Forms** — stronger than the earlier Phase 3 "reconsider at Phase 5" framing. Privacy policy should describe a direct send to Romane's own OVH inbox, no third-party processor involved.
**Notes:** This is a meaningful clarification beyond the original Phase 3 deferral decision (`PROJECT.md` Key Decisions, 2026-07-08 entry) — worth updating that decision's framing after this session.

---

## Page Placement & Identity

| Option | Description | Selected |
|--------|-------------|----------|
| Footer links, every page | Standard placement, always reachable | ✓ |
| Footer, only from About/Contact | More minimal footer on gallery/home pages | |

**User's choice:** Footer links, every page.

| Option | Description | Selected |
|--------|-------------|----------|
| Romane's full legal name | Standard mentions légales practice, brand name noted as trading name | |
| "Atelier Jacqueline Suzanne" only, no personal name | Keep brand as sole public identity | ✓ (flagged, not fully locked) |

**User's choice:** Brand name only, no personal name.
**Notes:** Claude flagged a legal nuance (LCEN Article 6-III identification requirements can differ for individual vs. professional/commercial site publishers) before accepting this at face value.

| Option | Description | Selected |
|--------|-------------|----------|
| Reference OVH (eventual real host) | Write for the Phase-5 end state | ✓ |
| Reference GitHub Pages (current actual host) | Accurately describe today's staging reality | |

**User's choice:** Reference OVH.

| Option | Description | Selected |
|--------|-------------|----------|
| Have the researcher verify LCEN requirements first | Confirm compliance before planner locks final identity content | ✓ |
| Proceed with brand-name-only as your call | Lock the preference regardless of research findings | |

**User's choice:** Have the researcher verify LCEN requirements first.
**Notes:** User's brand-name-only preference stands as the working assumption but is explicitly NOT locked — research must confirm it's compliant for an individual, non-SIRET, non-commercial (yet) site owner before the planner finalizes content.

---

## Claude's Discretion

- Exact visual layout/typography of the three legal pages — follow Phase 3's About page single-flowing-page pattern (no boxed panels, no portrait).
- Exact footer link ordering/wording between the legal page links.

## Deferred Ideas

None deferred to other phases. "Business Status Disclosure" (SIRET pending) was in the original gray-area list but the user did not select it for discussion — it remains in-scope for this phase, just unresolved pending research/planning attention (see CONTEXT.md `<decisions>` for the context carried forward).
