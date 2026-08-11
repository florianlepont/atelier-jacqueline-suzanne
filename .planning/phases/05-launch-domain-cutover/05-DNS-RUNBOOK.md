# Phase 5: DNS Cutover Runbook — atelierjacquelinesuzanne.fr

**Purpose:** Point `atelierjacquelinesuzanne.fr` at the new Astro/OVH site, replacing the old Myportfolio/Fastly-hosted site, without breaking the domain's active Zimbra mail service. This is an operational document — follow it step by step with the OVH control panel open. Every step is a checkbox; nothing gets checked until it is actually done.

**Maps to ROADMAP.md Phase 5 success criteria:**
1. The new site fully replaces the old Myportfolio site at the live domain.
2. No broken email — the domain's existing MX/Zimbra records survive byte-identical.
3. The cutover is rehearsed/verified before the production switch (`npm run test:smoke`, see plan `05-04`).

---

## Section 0 — Facts

Snapshot of the live DNS zone for `atelierjacquelinesuzanne.fr`, captured 2026-08-11 in the `05-04` planning worktree. **This is a snapshot, not the authoritative record** — Section 1 re-captures the authoritative zone state immediately before any edit.

| Record | Current value |
|--------|---------------|
| NS | `ns16.ovh.net.`, `dns16.ovh.net.` — the zone is hosted at OVH itself, so all edits happen in the OVH DNS zone editor |
| A (apex) | `151.101.128.119`, `151.101.192.119` — Fastly addresses, i.e. the Adobe Portfolio / Myportfolio site being replaced |
| A (`www`) | same two Fastly addresses |
| MX | `1 mx1.mail.ovh.net.`, `5 mx2.mail.ovh.net.`, `100 mx3.mail.ovh.net.` — **the live Zimbra mail path; must survive byte-identical** |
| TXT | `"v=spf1 include:mx.ovh.com -all"` (SPF, hard fail) and `"1\|www.atelierjacquelinesuzanne.fr"` (an OVH internal marker) |
| `cluster129.hosting.ovh.net` | resolves to `51.91.236.255` — a plausible target for the new A record, but the authoritative value must come from OVH's own Multisite attach flow (Section 2), not from this lookup |

**Hard invariant, in bold because it is the entire point of this document: the three MX records and the SPF TXT record must be byte-identical before and after this procedure. Nothing else in this procedure is allowed to touch them.**

- [ ] I have read and understood the hard invariant above.

---

## Section 1 — Capture (D-04, blocking)

No edit happens until this section is complete and its output has been shown to and reviewed by the maintainer (Florian). This is D-04's hard prerequisite — nothing gets modified blind.

- [ ] Log into the OVH control panel: Web Cloud → Domain names → `atelierjacquelinesuzanne.fr` → DNS zone.
- [ ] Open "Edit in text mode" and copy the **entire** zone text verbatim into a file saved in this phase directory (e.g. `.planning/phases/05-launch-domain-cutover/05-zone-capture-pre-cutover.txt`).
- [ ] Independently record the `dig` view of the same zone, saved alongside the text-mode capture:
  - [ ] `dig +short MX atelierjacquelinesuzanne.fr`
  - [ ] `dig +short A atelierjacquelinesuzanne.fr`
  - [ ] `dig +short A www.atelierjacquelinesuzanne.fr`
  - [ ] `dig +short TXT atelierjacquelinesuzanne.fr`
  - [ ] `dig +short NS atelierjacquelinesuzanne.fr`
  - [ ] `dig +noall +answer A atelierjacquelinesuzanne.fr` (for the current TTL value)
- [ ] Save the `dig +short MX` output specifically as an `MX_BASELINE` file (e.g. `.planning/phases/05-launch-domain-cutover/mx-baseline.txt`) — plan `05-04`'s `scripts/launch-smoke-check.sh` consumes this file directly via the `MX_BASELINE` env var in Section 4.
- [ ] Show the full captured zone text to the maintainer for review before proceeding to Section 2. No edit happens until this review is done.

---

## Section 2 — Prepare

Two prerequisites, neither of which is itself a DNS edit.

- [ ] Confirm in OVH Web Cloud → Hosting plans → `atelihu` → Multisite that `atelierjacquelinesuzanne.fr` is attached to the hosting plan, and record the target A record value that OVH's attach flow supplies here: `__________________`.
  - Note: `cluster129.hosting.ovh.net` currently resolves to `51.91.236.255` (Section 0) — this is a cross-check on OVH's supplied value, **never** a substitute for it. Use whatever OVH's Multisite flow actually gives you.
- [ ] Lower the TTL on the apex `A` record and the `www` `A` record ONLY, to 60 seconds.
- [ ] Wait at least the previous TTL (recorded in Section 1's `dig +noall +answer A` capture) before proceeding to Section 3.
  - Why: a 60-second TTL is what makes the change reversible in about a minute instead of hours — this is the "TTLs lowered in advance" half of ROADMAP success criterion 3. Per D-05, there is no timing constraint on this cutover, so waiting out the old TTL costs nothing.

---

## Section 3 — Cut over

The edit itself, scoped as narrowly as possible.

- [ ] Change the value of the apex `A` record from the two Fastly addresses (`151.101.128.119`, `151.101.192.119`) to the OVH hosting address recorded in Section 2.
- [ ] Change the value of the `www` `A` record the same way, to the same OVH hosting address.

**Prohibited — do not do any of the following:**

- [ ] **Do NOT** use the DNS zone's "Reset the DNS zone" function. OVH documents this as reverting to a minimal default configuration, which **deletes the MX records** and breaks Romane's email.
- [ ] **Do NOT** delete and recreate the zone.
- [ ] **Do NOT** touch the MX, SPF TXT, or NS records, for any reason, at any point in this section.
- [ ] **Do NOT** bulk-paste a replacement zone in text mode — this makes an MX omission a single silent keystroke. Edit only the two named `A` records through the zone editor's per-record edit UI.

---

## Section 4 — Verify

Run in this exact order — email is the higher-consequence surface, so it is checked before anything about the website.

- [ ] `dig +short MX atelierjacquelinesuzanne.fr` — diff this against the Section 1 capture. Must be byte-identical.
- [ ] `dig +short A atelierjacquelinesuzanne.fr` — confirms the new address is live.
- [ ] `MX_BASELINE=.planning/phases/05-launch-domain-cutover/mx-baseline.txt npm run test:smoke -- https://atelierjacquelinesuzanne.fr` exits 0.
- [ ] Send **one** real message through the live contact form (not the smoke check's honeypot-triggered probe) and confirm it arrives in the confirmed Zimbra mailbox (`contact@atelierjacquelinesuzanne.fr`, per `05-01-SUMMARY.md`).
  - **Flag explicitly:** it may land in spam. The apex SPF record is `v=spf1 include:mx.ovh.com -all` — a hard fail — and it has not been independently confirmed that OVH's web-hosting cluster sends `mail()` output from within that include. If the message is missing or spam-foldered, that is a deliverability issue in `contact.php`'s envelope sender, **not** a DNS failure, and it does **not** justify a DNS rollback (see Section 5).
- [ ] Re-check the OVH zone's Diagnostic column and confirm propagation.
- [ ] Confirm the old site is gone: the homepage at `https://atelierjacquelinesuzanne.fr/` no longer serves Myportfolio content.

---

## Section 5 — Rollback (D-06)

**Decision rule, in the maintainer's own terms:** troubleshoot in place first, for a bounded window, rather than reverting at the first sign of trouble — but do not let it drag on indefinitely either.

### Immediate rollback trigger — no waiting

- [ ] MX records differ from the Section 1 capture, **or**
- [ ] SPF TXT record differs from the Section 1 capture, **or**
- [ ] Mail delivery to the domain has stopped.

Any one of these is an immediate, no-deliberation rollback — email outage is never a "troubleshoot in place" situation. Restore the affected record(s) from the Section 1 capture, or use OVH's DNS zone version history / restore feature.

### Bounded troubleshooting window — ~60 minutes

- [ ] The site is unreachable, serves the wrong content, or serves broken assets.

These are almost always a wrong webroot path, a missing `.htaccess`, or DNS propagation lag — all fixable forward (re-running the OVH deploy) and all cheaper to fix than to revert. With the 60-second TTL from Section 2, a revert stays about a minute away for the entire troubleshooting window, so there is no cost to trying the forward fix first.

### Rollback mechanics

- [ ] Restore the apex and `www` `A` records to the two Fastly addresses recorded in Section 1 (`151.101.128.119`, `151.101.192.119`).
- Note: the old site remains reachable at its Fastly origin throughout this entire procedure — nothing about this cutover deletes or disables it — so a revert genuinely restores the previous, fully working state.

---

## Section 6 — Post-cutover

- [ ] Once the site has been stable for a day, raise the apex and `www` `A` record TTLs back to their original values (recorded in Section 1's `dig +noall +answer A` capture).
- [ ] GitHub Pages stays live permanently as pre-production per D-03 — it is **not** retired by this cutover.
- [ ] Note for future reference: the OVH deploy workflow has no SSH shell, so it never deletes stale files from the webroot. If the webroot ever needs pruning, that is a manual SFTP cleanup, not something this runbook or the deploy pipeline does automatically.

---

## Full Checklist (sequenced, for plan 05-06 to execute)

- [ ] Section 0: hard invariant read and understood
- [ ] Section 1: full zone text captured to a saved file
- [ ] Section 1: independent `dig` view captured (MX, A, A www, TXT, NS, TTL)
- [ ] Section 1: MX baseline file saved for `scripts/launch-smoke-check.sh`'s `MX_BASELINE`
- [ ] Section 1: full zone text shown to and reviewed by the maintainer
- [ ] Section 2: Multisite attachment confirmed, target A value recorded
- [ ] Section 2: apex + `www` TTL lowered to 60s
- [ ] Section 2: waited out the previous TTL
- [ ] Section 3: apex `A` record changed to the OVH hosting address
- [ ] Section 3: `www` `A` record changed to the OVH hosting address
- [ ] Section 3: confirmed MX/SPF/NS untouched, zone reset function not used
- [ ] Section 4: MX diff against Section 1 capture — clean
- [ ] Section 4: `dig +short A` shows the new address
- [ ] Section 4: `npm run test:smoke` against production, with `MX_BASELINE` set, exits 0
- [ ] Section 4: one real end-to-end contact-form message confirmed delivered
- [ ] Section 4: OVH Diagnostic column confirms propagation
- [ ] Section 4: old Myportfolio content confirmed gone from the homepage
- [ ] Section 6: TTLs raised back to original values (after a day of stability)
