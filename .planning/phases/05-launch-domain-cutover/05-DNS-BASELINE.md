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

*Reserved for Task 2. This resolver-side `dig` capture above only shows the record types that were explicitly queried — the OVH control panel's "Edit in text mode" export shows every record that exists in the zone, including anything the targeted lookups above might have missed. Task 2 will append that export here verbatim and diff it against the capture above.*

**Not yet filled in — do not proceed past Task 2 without this section being populated and reviewed.**

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
