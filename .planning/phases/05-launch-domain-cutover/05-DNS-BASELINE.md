# Phase 5 Plan 05 — DNS Baseline (pre-cutover)

**Captured:** 2026-08-11T14:56:58Z, from the `05-launch-domain-cutover` execution worktree, against the public resolver (independent of OVH's own panel — see the reserved zone-export section below for the authoritative D-04 capture).

This is the rollback source of truth for the DNS cutover in this plan's Task 4. If anything goes wrong after the cutover, the "Rollback values" section below is the one thing you need to read to restore the pre-change state.

---

## Resolver-view captures (Task 1, `dig`)

All commands run against `atelierjacquelinesuzanne.fr` at `2026-08-11T14:56:58Z`.

| Command | Output |
|---|---|
| `dig +short NS atelierjacquelinesuzanne.fr` | `ns16.ovh.net.`<br>`dns16.ovh.net.` |
| `dig +short A atelierjacquelinesuzanne.fr` | `151.101.128.119`<br>`151.101.192.119` |
| `dig +short A www.atelierjacquelinesuzanne.fr` | `151.101.192.119`<br>`151.101.128.119` |
| `dig +short MX atelierjacquelinesuzanne.fr` | `1 mx1.mail.ovh.net.`<br>`100 mx3.mail.ovh.net.`<br>`5 mx2.mail.ovh.net.` |
| `dig +short TXT atelierjacquelinesuzanne.fr` | `"v=spf1 include:mx.ovh.com -all"`<br>`"1\|www.atelierjacquelinesuzanne.fr"` |
| `dig +short CNAME www.atelierjacquelinesuzanne.fr` | *(empty — `www` is an `A` record, not a `CNAME`)* |

### TTL captures (`dig +noall +answer`)

`dig +noall +answer A atelierjacquelinesuzanne.fr`:
```
atelierjacquelinesuzanne.fr. 3600 IN	A	151.101.192.119
atelierjacquelinesuzanne.fr. 3600 IN	A	151.101.128.119
```

`dig +noall +answer MX atelierjacquelinesuzanne.fr`:
```
atelierjacquelinesuzanne.fr. 3600 IN	MX	100 mx3.mail.ovh.net.
atelierjacquelinesuzanne.fr. 3600 IN	MX	5 mx2.mail.ovh.net.
atelierjacquelinesuzanne.fr. 3600 IN	MX	1 mx1.mail.ovh.net.
```

**Apex `A` TTL:** 3600s (the "previous TTL" that Task 2 step 6 must wait out after lowering it to 60s).

### What the domain currently serves ("before" snapshot)

`curl -sSI https://atelierjacquelinesuzanne.fr/` at `2026-08-11T14:56:58Z`:
```
HTTP/2 404
server: Varnish
retry-after: 0
accept-ranges: bytes
date: Tue, 11 Aug 2026 14:56:58 GMT
via: 1.1 varnish
x-served-by: cache-par-lfpg1960082-PAR
x-cache: MISS
x-cache-hits: 0
x-timer: S1786460218.424334,VS0,VE0
x-last-60s-hits: 1
content-length: 0
```
Served by Fastly/Varnish (the Myportfolio origin) — the root path currently 404s at this origin, which is consistent with "old site being replaced," not a DNS misconfiguration. This confirms the domain is not yet pointed at OVH.

---

## Record summary table

| Record | Value | TTL | Command |
|---|---|---|---|
| NS | `ns16.ovh.net.`, `dns16.ovh.net.` | — (not queried) | `dig +short NS atelierjacquelinesuzanne.fr` |
| A (apex) | `151.101.128.119`, `151.101.192.119` | 3600s | `dig +noall +answer A atelierjacquelinesuzanne.fr` |
| A (`www`) | `151.101.128.119`, `151.101.192.119` | not independently captured; assumed same 3600s zone default | `dig +short A www.atelierjacquelinesuzanne.fr` |
| MX | `1 mx1.mail.ovh.net.`, `5 mx2.mail.ovh.net.`, `100 mx3.mail.ovh.net.` | 3600s | `dig +noall +answer MX atelierjacquelinesuzanne.fr` |
| TXT | `"v=spf1 include:mx.ovh.com -all"`, `"1\|www.atelierjacquelinesuzanne.fr"` | — (not queried) | `dig +short TXT atelierjacquelinesuzanne.fr` |
| CNAME (`www`) | none (empty) | — | `dig +short CNAME www.atelierjacquelinesuzanne.fr` |

`cluster129.hosting.ovh.net` resolves to `51.91.236.255` — a cross-check on the address OVH's Multisite flow supplies at Task 2, never a substitute for it (per `05-DNS-RUNBOOK.md` Section 2).

---

## Rollback values

If anything breaks after the cutover, restoring the apex and `www` `A` records to these two values reverts the site to its pre-cutover state:

- **`151.101.128.119`**
- **`151.101.192.119`**

Both records currently hold both addresses (apex and `www` are identical today). MX, SPF TXT, and NS must **never** differ from what is recorded in this document:

- MX: `1 mx1.mail.ovh.net.`, `5 mx2.mail.ovh.net.`, `100 mx3.mail.ovh.net.` (raw baseline also saved separately at `05-mx-baseline.txt` for `scripts/launch-smoke-check.sh`'s `MX_BASELINE`)
- SPF TXT: `"v=spf1 include:mx.ovh.com -all"`
- NS: `ns16.ovh.net.`, `dns16.ovh.net.`

If MX or SPF ever differ from the above, that is runbook Section 5's immediate, no-deliberation rollback trigger — restore the affected record(s) from this document or from OVH's DNS zone version history right away.

---

## OVH zone text-mode export (pasted at the D-04 checkpoint)

Pasted verbatim by the maintainer from OVH Control Panel → Web Cloud → Domain names → `atelierjacquelinesuzanne.fr` → DNS zone → "Edit in text mode", 2026-08-11:

```
$TTL 3600
@	IN SOA dns16.ovh.net. tech.ovh.net. (2086453506 86400 3600 3600000 60)
        IN NS     dns16.ovh.net.
        IN NS     ns16.ovh.net.
        IN MX     1 mx1.mail.ovh.net.
        IN MX     5 mx2.mail.ovh.net.
        IN MX     100 mx3.mail.ovh.net.
        IN A     151.101.192.119
        IN A     151.101.128.119
        IN TXT     "v=spf1 include:mx.ovh.com -all"
        IN TXT     "1|www.atelierjacquelinesuzanne.fr"
_autodiscover._tcp        IN SRV     0 0 443 mailconfig.ovh.net.
_imaps._tcp        IN SRV     0 0 993 ssl0.ovh.net.
_submission._tcp        IN SRV     0 0 465 ssl0.ovh.net.
autoconfig        IN CNAME     mailconfig.ovh.net.
autodiscover        IN CNAME     mailconfig.ovh.net.
ftp        IN CNAME     atelierjacquelinesuzanne.fr.
imap        IN CNAME     ssl0.ovh.net.
mail        IN CNAME     ssl0.ovh.net.
ovhmo-selector-1._domainkey        IN CNAME     ovhmo-selector-1._domainkey.4262476.fa.dkim.mail.ovh.net.
ovhmo-selector-2._domainkey        IN CNAME     ovhmo-selector-2._domainkey.4262477.fa.dkim.mail.ovh.net.
pop3        IN CNAME     ssl0.ovh.net.
smtp        IN CNAME     ssl0.ovh.net.
www        IN A     151.101.128.119
www        IN A     151.101.192.119
www        IN TXT     "3|welcome"
```

### Diff against the Task 1 `dig` capture

The NS, apex A, www A, MX, and TXT records the zone export shows are **byte-identical** to Task 1's `dig` capture — no drift, no surprise value.

**Records the export reveals that the targeted `dig` queries never asked about** (all mail/domain infrastructure, none in the proposed change set, none to be touched by Task 4):
- `SOA` — standard zone metadata, serial `2086453506`.
- 3× `SRV` (`_autodiscover._tcp`, `_imaps._tcp`, `_submission._tcp`) — email client autoconfiguration.
- 7× `CNAME` (`autoconfig`, `autodiscover`, `ftp`, `imap`, `mail`, `pop3`, `smtp`) — all point at `ssl0.ovh.net.` / `mailconfig.ovh.net.`, or in `ftp`'s case, back at the zone apex.
- 2× DKIM-selector `CNAME` (`ovhmo-selector-1._domainkey`, `ovhmo-selector-2._domainkey`) — email authentication; breaking these would not stop mail delivery outright but would hurt deliverability/anti-spoofing.
- `www` `TXT` `"3|welcome"` — an OVH-internal marker TXT, same family as the apex `"1|www...."` marker.

**D-04 satisfied.** None of the above is in scope for Task 4's edit — that edit touches exactly the apex `A` and `www` `A` records and nothing else, confirmed against this full picture rather than the narrower `dig` view alone.

---

## Launch readiness checks (Task 1, part D)

All checks are read-only; none of them modify anything on OVH or in GitHub Actions.

| # | Check | Command | Result |
|---|---|---|---|
| 1 | `production-ovh` GitHub Environment exists | `gh api repos/florianlepont/ajs-website/environments --jq '.environments[].name'` | **PASS** — returned `github-pages`, `production-ovh` |
| 2 | `OVH_SFTP_PASSWORD` secret set on that environment | `gh secret list --env production-ovh` | **PASS** — `OVH_SFTP_PASSWORD` listed, set `2026-08-11T14:48:44Z` (value never read or printed) |
| 3 | OVH production workflow registered on the default branch | `gh workflow list` | **FAIL** — only `Build, test, and deploy to GitHub Pages` is listed. `deploy-ovh.yml` does **not** appear. |
| 4 | Pinned `SFTP-Deploy-Action` SHA still matches a real release tag | `gh api repos/wlixcc/SFTP-Deploy-Action/tags --jq '.[0:3][] | "\(.name) \(.commit.sha)"'` | **PASS** — `v1.2.6 a5ccb9c6211a94cc59404f0fdb2a9936a6dfee64`, byte-identical to the SHA pinned in `.github/workflows/deploy-ovh.yml` and recorded in `05-03-SUMMARY.md` at pin time. No drift. |
| 5 | Latest `main` CI run is green | `gh run list --workflow=deploy.yml --limit 1` | **PASS (with caveat)** — most recent recorded run: `completed / success`, commit `feat: refine editorial publishing and detail navigation`, run `31489977666`. **Caveat:** this is the CI run for `origin/main`'s current HEAD (`7332061`), which is 28 commits behind this worktree's local `main` (`011620a`) — see check 3's root cause below. |

### Root cause of check 3's failure

`git rev-list --left-right --count origin/main...HEAD` shows local `main` is **28 commits ahead of `origin/main`**, and `.github/workflows/deploy-ovh.yml` (added in commit `c96ae6e`, part of plan `05-03`) has never been pushed to the remote. GitHub Actions reads registered workflow files from the pushed branch state, not from any local worktree — so until this worktree's `main` is pushed to `origin/main`, `deploy-ovh.yml` cannot appear in `gh workflow list` and **`gh workflow run deploy-ovh.yml` cannot succeed** in Task 3.

**This readiness check failure blocks Task 3 (the dispatch) until `origin/main` is updated.** Per this task's own instruction ("If any readiness check fails, stop and report. Do not proceed to Task 2 with a known-broken prerequisite"), and because pushing 28 unreviewed commits to the public remote is an action with real side effects (it will also trigger `deploy.yml`'s push-triggered GitHub Pages staging deploy) outside this dispatch's explicitly read-only, nothing-dispatched-to-GitHub-Actions scope, this was **not fixed automatically** here. It is reported for the maintainer's explicit decision, not silently resolved.

No credential, token, or password value appears anywhere in this document.

---

## Deploy (Task 3)

**Successful run:** [`31525572071`](https://github.com/florianlepont/ajs-website/actions/runs/31525572071) — conclusion `success`, both `build` and `deploy` jobs green.
**Deployed commit:** `b550b9ecd60ec2d6c5dfaa4e866c53d63070ff5d`
**Run started:** 2026-08-11T18:59:27Z · **Run completed:** 2026-08-11T19:06:23Z
**Target:** `ftp.cluster129.hosting.ovh.net:/home/atelihu/www`
**SFTP steps confirmed:** `Deploy dist to OVH (SFTP)` ✓ and `Deploy .htaccess to OVH (SFTP, dotfile)` ✓ (both required — the second exists solely because `./dist/*` cannot match dotfiles).

**Getting here took three attempts, all recorded for the audit trail:**

1. **Run [`31507309098`](https://github.com/florianlepont/ajs-website/actions/runs/31507309098) — failed in `build`.** `tests/e2e/critical.smoke.spec.ts`'s "contact form completes a mocked submission" test still mocked the retired `https://api.web3forms.com/submit` endpoint (never updated when plan `05-02` repointed the form at `contact.php`). Fixed in `87785d3`: route mock changed to `**/contact.php`, matching `tests/e2e/contact.spec.ts`'s own `CONTACT_ENDPOINT` pattern. No SFTP attempt was made — the build gate correctly blocked before reaching OVH.
2. **Run [`31507915488`](https://github.com/florianlepont/ajs-website/actions/runs/31507915488) — `build` passed, approved, `deploy` failed.** `Deploy dist to OVH (SFTP)` failed with `dest open "/home/atelihu/www/index.html": Failure` — every other file in the same recursive upload succeeded. Root cause: OVH provisions a default placeholder `index.html` in a hosting's webroot when a domain is attached via Multisite, and the existing file could not be overwritten by a plain `put`. Added a one-time workaround step (`54cd8c9`) to delete that specific path via plain SFTP before the main upload.
3. **Run [`31523817015`](https://github.com/florianlepont/ajs-website/actions/runs/31523817015) — `build` passed, approved, `deploy` failed again, same file.** The workaround step itself had a bug: `sshpass -e` requires the password in an environment variable literally named `SSHPASS`; it was named `SFTP_PASSWORD`. `continue-on-error: true` suppressed the failure (correctly, per its own design as best-effort cleanup) but meant the real fix silently never ran. Fixed in `b550b9e`.
4. **Run `31525572071` (this one) — clean.** The workaround step deleted the stale `index.html`, and both SFTP steps succeeded on the first real attempt afterward.

**Nothing was smoke-checked against the production origin after this deploy** — DNS still points at the old Fastly/Myportfolio addresses (see the resolver-view and zone-export captures above), so any probe would only describe the old site. That is Task 4 and plan `05-06`'s job, in that order.

**The one-time workaround step in `deploy-ovh.yml` ("Workaround: remove stale OVH default index.html") is now safe to remove** in a follow-up commit — the stale file is confirmed gone, and every subsequent deploy will be uploading over content this pipeline itself produced.
