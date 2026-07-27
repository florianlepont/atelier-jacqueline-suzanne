---
status: partial
phase: 03-about-contact
source: [03-VERIFICATION.md]
started: 2026-07-08T10:56:28Z
updated: 2026-07-08T11:20:00Z
---

## Current Test

[blocked — see Gaps]

## Tests

### 1. Real Web3Forms delivery
expected: Deploy with a real `PUBLIC_WEB3FORMS_ACCESS_KEY`, submit the live `/contact/` form with genuine values, and confirm the email arrives in Romane's atelierjacquelinesuzanne.fr inbox within a few minutes. Inline success message appears without navigating (already confirmed automated); the email arrives at the correct mailbox; From: domain is a Web3Forms sending domain, not a spoof of atelierjacquelinesuzanne.fr.
result: [blocked] Live-tested on GitHub Pages staging (florianlepont.github.io/ajs-website/contact/) 2026-07-08 — form shows "Une erreur est survenue" because `PUBLIC_WEB3FORMS_ACCESS_KEY` is not set anywhere (missing from `.github/workflows/deploy.yml` build env, and no Web3Forms account/key exists yet). Florian deliberately deferred creating a Web3Forms account until the Phase 5 OVH cutover, where he intends to re-evaluate using OVH's built-in PHP `mail()` instead of Web3Forms. Contact form delivery will not work on any deployment (GitHub Pages staging or OVH) until one of these two paths is implemented.

### 2. Honeypot silently discards spam on live deployment
expected: Fill the hidden honeypot field via devtools on the live deployed form and submit; no email arrives at Romane's inbox while the UI still shows the success message.
result: [blocked] Cannot be meaningfully tested while item 1 is blocked — no real delivery path exists yet to confirm silent discard against.

## Summary

total: 2
passed: 0
issues: 0
pending: 0
skipped: 0
blocked: 2

## Gaps

- id: CONT-DELIVERY-01
  status: deferred
  description: "Contact form has no working email delivery path on any deployment target. Code (Web3Forms client-side integration) is built and automated-test-verified, but PUBLIC_WEB3FORMS_ACCESS_KEY was never provisioned (no Web3Forms account signed up, key missing from deploy.yml build env)."
  decision: "Florian deferred resolving this until Phase 5 (OVH domain cutover), where he wants to reconsider OVH's built-in PHP mail() as an alternative to Web3Forms, rather than sign up for Web3Forms now."
  resolves_phase: "5"
