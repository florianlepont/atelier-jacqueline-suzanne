# Phase 5: Launch & Domain Cutover - Research

**Researched:** 2026-08-11
**Domain:** Static-site production deployment (OVH mutualized hosting via SFTP), DNS cutover preserving existing email (Zimbra/MX), and a minimal-dependency PHP `mail()` contact-form endpoint
**Confidence:** MEDIUM (no `05-CONTEXT.md` exists on disk yet — `/gsd-discuss-phase` has not run for this phase. The "Known project facts" / "User wants" block supplied in this research's task brief is treated as the locked decision set below, sourced from project memory + prior phase summaries, not from a file this agent read directly. The planner and `/gsd-discuss-phase` should confirm these are still accurate before locking further.)

<user_constraints>
## User Constraints (from task brief — no 05-CONTEXT.md file exists on disk)

> No `.planning/phases/05-launch-domain-cutover/05-CONTEXT.md` exists yet. The phase directory itself did not exist before this research ran (`init.phase-op` reported `phase_found: true, phase_dir: null, has_context: false`). Everything below was supplied directly in this research task's brief, attributed to "project memory" and prior phase summaries (chiefly `01-02-SUMMARY.md`). Treat it as strong signal, not as a substitute for running `/gsd-discuss-phase 5` before planning.

### Confirmed facts (verified against 01-02-SUMMARY.md and codebase during this research)
- OVH SFTP creds: host `ftp.cluster129.hosting.ovh.net`, user `atelihu`, home dir `/home/atelihu`, port 22, SFTP (password auth only — [VERIFIED: 01-02-SUMMARY.md]).
- OVH Web Hosting Free tier cannot attach any subdomain — this is why GitHub Pages hosts staging instead of an OVH subdomain [VERIFIED: 01-02-SUMMARY.md].
- atelierjacquelinesuzanne.fr has ACTIVE Zimbra email/MX records at OVH's own DNS zone (not an external DNS provider) that must survive any DNS cutover [VERIFIED: 01-02-SUMMARY.md].
- Current site build is Astro 7 `output: 'static'`, no server-rendering integration, deployed today only to GitHub Pages via `.github/workflows/deploy.yml` — no OVH SFTP step exists yet [VERIFIED: codebase, astro.config.mjs + deploy.yml read this session].
- Contact form currently POSTs to Web3Forms (`src/components/ContactForm.astro` line ~203), which was never provisioned — must be replaced with OVH's native PHP `mail()` [VERIFIED: codebase read this session; confirms project memory "Contact Form Delivery Deferred"].
- `src/lib/contact-form.ts` holds dependency-free honeypot/validation helpers (`isHoneypotTriggered`, `isValidEmail`, `isBlank`) that must stay reusable client-side; honeypot is the ONLY anti-spam layer wanted (user explicitly declined server-side spam filtering) [VERIFIED: codebase read this session].
- A graceful fallback message already exists client-side: on any submission failure, `ContactForm.astro` shows "Something went wrong… email me directly at {publicEmail}" (`publicEmail` defaults to `contact@atelierjacquelinesuzanne.fr`, Sanity-editable) [VERIFIED: codebase read this session — this is closer to "done" than the brief implied; the new PHP endpoint just needs to preserve the same success/failure response contract].

### User decisions (from task brief, unverified against a written CONTEXT.md — confirm in /gsd-discuss-phase)
- Manual-trigger-only production deploys (never automatic on push to main).
- A preview/recap + explicit go-ahead gate before the first SFTP push, and before any DNS change.
- GitHub Pages kept alive **permanently** as a pre-production environment after cutover.
- Full current DNS zone dump shown before any modification.
- No rollback rush if something breaks post-cutover — troubleshoot first, don't panic-revert.
- Contact form delivers to the domain's existing Zimbra mailbox (exact address TBD — confirm via OVH panel / Sanity `contact.publicEmail`, currently defaults to `contact@atelierjacquelinesuzanne.fr` in code).
- If PHP `mail()` send fails, the visitor must see a fallback contact alternative, never a dead end (already partially implemented client-side — see above).

### Claude's Discretion
- Exact GitHub Actions mechanism for the "preview + explicit go-ahead" gate (typed-confirmation input vs. GitHub Environments required-reviewer gate) — see Architecture Patterns.
- Exact `.htaccess` contents (404 routing, directory-listing prevention) — no user preference stated.
- Whether the contact form's cross-origin request (from permanently-alive GitHub Pages) uses CORS headers or a same-origin-friendly payload format — see Common Pitfalls / Code Examples.

### Deferred Ideas (OUT OF SCOPE)
- None stated in the task brief for this phase. E-commerce/Stripe, shop, exhibitions remain out of scope per CLAUDE.md's "Deferred to v1.x" section — not part of Phase 5.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAUNCH-01 | Visiting atelierjacquelinesuzanne.fr serves the new site (not Myportfolio); existing MX/Zimbra email continues working; the DNS cutover was rehearsed/verified before the production switch | Standard Stack (SFTP deploy action + OVH DNS zone editor capabilities), Architecture Patterns (deploy workflow gating, DNS cutover sequence), Common Pitfalls (MX-wipe risk, cross-origin contact form, header injection), Code Examples (workflow YAML, .htaccess, PHP endpoint) |
</phase_requirements>

## Summary

Phase 5 has three independent technical threads that must each land correctly, in roughly this order: (1) a new, manually-triggered GitHub Actions job that builds the site with an OVH-appropriate config (root base path, production `SITE_URL`) and pushes it over SFTP to `cluster129`; (2) a PHP `mail()`-based contact endpoint that replaces the never-provisioned Web3Forms integration, hardened against header injection and reachable both same-origin (post-cutover) and cross-origin (from the permanently-kept-alive GitHub Pages staging site); and (3) the DNS cutover itself, which is a manual, rehearsed OVH-control-panel operation, not something GitHub Actions touches.

The single highest-leverage finding: OVH's Free/mutualized Web Hosting plan has **no SSH shell access** (SSH is Professional-tier-and-up only) but **does** expose password-authenticated SFTP on port 22, which the project's own `01-02-SUMMARY.md` already confirmed. This rules out the most popular FTP GitHub Action (`SamKirkland/FTP-Deploy-Action`, which dropped SFTP support in v4) and any rsync-over-ssh action (rsync needs a remote shell). The action that fits — `wlixcc/SFTP-Deploy-Action` — has a dedicated `sftp_only: true` flag documented for exactly this "SFTP protocol but no shell" case, plus password auth (OVH shared hosting has no SSH-key support). For DNS, OVH's own zone editor already provides everything the success criteria ask for natively: a full-zone text-mode export/dump, a version history with restore, and — because the domain's DNS is hosted at OVH itself, not an external registrar — a "Multisite" domain-attach flow that supplies the exact A/TXT records needed and a live Diagnostic/propagation check, which doubles as the "rehearsed/verified" mechanism the phase's third success criterion requires. For the contact form, the standard defense (validate + reject CR/LF before headers are built, fixed envelope-from) is well-documented and cheap to implement; the more interesting design decision is that a fetch with `Content-Type: application/json` triggers a CORS preflight when GitHub Pages (kept alive permanently) calls the OVH-hosted endpoint cross-origin — switching the existing `FormData` object to be sent directly as the fetch body (instead of hand-built JSON) avoids the preflight entirely and requires no PHP-side CORS/OPTIONS handling.

**Primary recommendation:** Add a manually-triggered (`workflow_dispatch`), build-then-gate-then-deploy job to the existing `deploy.yml` using `wlixcc/SFTP-Deploy-Action@v1.2.6` with `sftp_only: true` and password auth from a GitHub secret; ship a hand-written `public/.htaccess` (Astro copies it through unmodified) for the 404 route and directory-listing lockdown; write a single small `contact.php` with strict CRLF/format validation and a fixed envelope-from, deployed alongside the static build; and treat the DNS cutover as a manual, OVH-panel-native operation (TTL lowered days ahead, Multisite domain-attach flow, MX untouched, zone dumped/exported before any edit) that is explicitly outside GitHub Actions' scope.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Static site deploy (build + SFTP push) | CI/CD (GitHub Actions) | CDN/Static (OVH Apache file host) | Build happens in CI; OVH is a zero-compute static file server, so all logic must be baked in at build time. |
| Contact form submission handling | API/Backend (single PHP script, OVH's only request-time compute) | Browser/Client (existing fetch + validation in `ContactForm.astro`) | PHP `mail()` is the ONE piece of server-side compute this near-zero-budget static site has; client already does honeypot + format validation, server must independently re-validate (never trust client-only checks) and own the actual send. |
| DNS record management (A/CNAME/MX) | Database/Storage tier equivalent — OVH's DNS zone (external to the app) | — | Not part of the codebase at all; a control-plane operation against OVH's own DNS hosting, done through OVH's control panel/API, never through GitHub Actions or the Astro build. |
| Error routing (404) | CDN/Static (Apache `.htaccess` `ErrorDocument`) | Browser/Client (existing custom `404.astro`) | The already-built `404.html` is a static asset; Apache just needs to be told to serve it on a real 404 instead of its own default error page. |
| Staging environment (GitHub Pages) permanence | CDN/Static (GitHub Pages) | CI/CD (existing `deploy.yml`, unchanged) | Explicit user decision: GitHub Pages keeps serving the `/ajs-website/`-base build forever as pre-production; this phase adds a second, separate production deploy target rather than replacing the existing one. |

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `wlixcc/SFTP-Deploy-Action` (GitHub Action, not an npm package) | `v1.2.6` [CITED: github.com/wlixcc/SFTP-Deploy-Action] | Uploads the Astro `dist/` build to OVH over SFTP from a GitHub Actions job | 288 GitHub stars; explicit `sftp_only: true` option for SFTP-protocol-but-no-shell hosts (exactly OVH's constraint) and `ssh_password` auth (OVH shared hosting has no SSH-key support) [CITED: github.com/wlixcc/SFTP-Deploy-Action]. `[ASSUMED]` package/action name and exact input names — discovered via WebSearch, not fetched from the action's own docs page directly; verify `action.yml`'s current input names (`server`, `username`, `ssh_password`, `local_path`, `remote_path`, `sftp_only`, `dangerous_clean_slate`/`delete_remote_files`) before wiring the workflow. |
| PHP `mail()` (built-in, no install) | Whatever PHP version OVH's shared plan runs (project-wide, not per-site configurable — [CITED: docs.ovhcloud.com/en/guides/web-cloud/web-hosting/configure-your-web-hosting]) | Sends the contact-form message to the domain's Zimbra mailbox | Explicit user/locked decision: OVH's native `mail()`, no third-party mail library, matching the near-zero-dependency philosophy already used for the honeypot/validation helpers. |
| Apache `.htaccess` (via `public/.htaccess` in the Astro repo) | N/A (Apache config, not a package) | 404 routing (`ErrorDocument 404 /404.html`), optional directory-listing lockdown | Astro's `public/` directory is copied into `dist/` unmodified at build time [CITED: docs.astro.build/en/basics/project-structure/#public] — the standard Astro pattern for host-specific static config files, no integration/dependency needed. |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GitHub Actions `environment:` + required reviewers | Native GitHub feature (free for public repos) | Implements the "preview/recap + explicit go-ahead" gate before the first SFTP push | Add a `production` (or `production-deploy`) environment with Required reviewers configured in repo Settings → Environments; a job targeting that environment pauses in the Actions UI until approved — this is GitHub's native mechanism for exactly this kind of gate [CITED: docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments]. `[ASSUMED]` self-approval is not blocked for a solo maintainer on a public repo (that restriction applies to PR reviews, not environment protection) — verify this doesn't silently no-op the gate before relying on it. |
| A typed-confirmation `workflow_dispatch` input (fallback/simpler alternative) | N/A (plain YAML + a bash `if` check) | Same gating goal, lower setup complexity, but bypassable by anyone who can trigger the workflow | Use instead of GitHub Environments if the solo-maintainer self-approval question above turns out to be a real gap, or if the added Settings-page setup isn't wanted. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `wlixcc/SFTP-Deploy-Action` | `milanmk/actions-file-deployer` | Also supports SFTP + password auth and delta/full sync modes [CITED: github.com/milanmk/actions-file-deployer]; fewer stars (89 vs 288) and this research could not confirm from its README whether it truly avoids requiring shell access the way `sftp_only: true` explicitly documents — treat as a secondary option, not the primary recommendation. |
| `wlixcc/SFTP-Deploy-Action` | `SamKirkland/FTP-Deploy-Action` | The most popular action in this space generally, but SFTP support was explicitly dropped in v4+ (FTP/FTPS only) — incompatible with the confirmed SFTP-only OVH credentials unless FTP (port 21, unencrypted) is enabled instead, which is a worse security posture than the already-available SFTP. |
| PHP `mail()` | PHPMailer + OVH's authenticated SMTP (MX Plan) | Better deliverability (SPF/DKIM pass, avoids OVH's automatic abuse-blocking of unauthenticated `mail()` sends) [CITED: docs.ovhcloud.com/en/guides/web-cloud/web-hosting/email-sending-best-practices] — but this is explicitly NOT what the user decided; documented here as a pitfall/tradeoff to flag, not a recommendation to override the locked decision. |

**Installation:**
No npm/pip/cargo packages are installed by this phase — see Package Legitimacy Audit below.

```yaml
# GitHub Actions job addition (not an npm install) — see Code Examples for full context
- name: Deploy to OVH via SFTP
  uses: wlixcc/SFTP-Deploy-Action@v1.2.6
  with:
    username: atelihu
    server: ftp.cluster129.hosting.ovh.net
    port: 22
    ssh_password: ${{ secrets.OVH_SFTP_PASSWORD }}
    local_path: './dist/*'
    remote_path: '/home/atelihu/www'   # verify exact webroot subpath with Florian/OVH panel before first run
    sftp_only: true
```

**Version verification:** `wlixcc/SFTP-Deploy-Action`'s exact current latest tag and input names were derived via WebSearch/WebFetch of the repo page this session, not via `npm view` (this is a GitHub Action, not an npm registry package — the ecosystem-appropriate verification here is checking the repo's Releases page / `action.yml` directly before first use). Treat the tag `v1.2.6` and the input names above as `[ASSUMED]` until confirmed against the live `action.yml` at plan/execute time.

## Package Legitimacy Audit

> No npm, pip, or cargo packages are installed by this phase — the only new "dependency" is a third-party **GitHub Action** (`wlixcc/SFTP-Deploy-Action`), which is outside the scope of `gsd-tools query package-legitimacy check` (npm/pypi/crates only). The Package Legitimacy Gate is therefore N/A for this phase's registry-package audit; documenting the equivalent supply-chain check for the Action below instead.

| Package | Registry | Age | Downloads/Stars | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| N/A — no npm/pypi/cargo packages installed this phase | — | — | — | — | — | — |

**GitHub Action supply-chain note (not covered by the standard gate, documented manually):** `wlixcc/SFTP-Deploy-Action` — 288 stars, actively referenced across multiple current tutorials and Marketplace listings [CITED: github.com/wlixcc/SFTP-Deploy-Action, github.com/marketplace/actions/sftp-deploy]. Because this action will run with an SFTP password secret, pin it to the exact release tag (`@v1.2.6`) or, for stronger supply-chain safety, to a specific commit SHA rather than a floating major-version tag — a compromised or malicious update to a mutable tag could exfiltrate the OVH SFTP password. This is a `checkpoint:human-verify`-worthy item for the plan: confirm the pinned SHA/tag against the actual repo immediately before first use, since this research's version data is WebSearch-sourced, not fetched from the authoritative source directly.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none (not applicable — no registry packages this phase)

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────┐
                         │   GitHub repo (main branch)  │
                         └──────────────┬────────────────┘
                                        │  workflow_dispatch (manual only)
                                        ▼
                    ┌────────────────────────────────────────┐
                    │  GitHub Actions: existing build+test    │
                    │  gates (typecheck, Playwright, Vitest)  │
                    │  — unchanged, still block everything    │
                    └──────────────────┬───────────────────────┘
                                        │ gates pass
                                        ▼
              ┌───────────────────────────────────────────────────┐
              │  NEW job: build "production" artifact              │
              │  SITE_URL=https://atelierjacquelinesuzanne.fr       │
              │  ASTRO_BASE unset (root base)                       │
              │  → prints recap (file count/size diff) to job summary│
              └──────────────────────────┬───────────────────────────┘
                                          │
                                          ▼
              ┌───────────────────────────────────────────────────┐
              │  GATE: environment "production-deploy"              │
              │  Required reviewer approval (human clicks Approve)  │
              │  — the "preview/recap + explicit go-ahead" gate      │
              └──────────────────────────┬───────────────────────────┘
                                          │ approved
                                          ▼
              ┌───────────────────────────────────────────────────┐
              │  NEW job: wlixcc/SFTP-Deploy-Action (sftp_only)      │
              │  → pushes dist/ to ftp.cluster129.hosting.ovh.net    │
              │     as user atelihu, /home/atelihu/www               │
              └──────────────────────────┬───────────────────────────┘
                                          │
                                          ▼
                     ┌───────────────────────────────────────┐
                     │  OVH mutualized hosting (Apache,        │
                     │  cluster129) — zero request-time        │
                     │  compute except one PHP script          │
                     │  serves: static dist/ files + .htaccess │
                     │          + contact.php (mail())         │
                     └──────────────────┬────────────────────────┘
                                          ▲
                                          │ cross-origin fetch (FormData,
                                          │ no JSON preflight) from the
                                          │ permanently-kept-alive
                                          │ GitHub Pages pre-prod site
                     ┌────────────────────┴────────────────────┐
                     │  GitHub Pages (unchanged existing         │
                     │  deploy.yml job — still auto-deploys       │
                     │  on push to main, /ajs-website/ base)      │
                     └─────────────────────────────────────────────┘

  SEPARATE, MANUAL, OUTSIDE GitHub Actions:
     ┌───────────────────────────────────────────────────────────┐
     │  OVH Control Panel: DNS zone editor                          │
     │  1. Dump/export current full zone (text mode) — show human   │
     │  2. Lower A-record TTL 24-48h ahead of cutover                │
     │  3. Multisite "attach domain" flow → supplies target A/TXT    │
     │  4. Verify Diagnostic column shows correct propagation        │
     │  5. MX/Zimbra records: touched by NONE of the above           │
     └───────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
.github/workflows/
└── deploy.yml              # extended, not replaced: existing GH Pages job untouched,
                             # new job(s) added for the OVH production deploy path
public/
├── logos/                  # existing
├── .htaccess                # NEW — ErrorDocument 404, directory-listing lockdown
└── contact.php               # NEW — the one server-side script; Astro copies it
                             #        through to dist/contact.php unmodified since it
                             #        lives in public/, not src/pages/
src/
├── components/
│   └── ContactForm.astro    # MODIFIED — fetch target becomes contact.php (relative
│                             #  path in production, absolute in the GH Pages build);
│                             #  consider switching JSON body → FormData body (see
│                             #  Common Pitfalls) to sidestep CORS preflight
└── lib/
    └── contact-form.ts      # UNCHANGED — client-side honeypot/validation helpers
                             #  stay as-is; contact.php independently re-validates
```

### Pattern 1: Dual-target build (GitHub Pages base vs. OVH root base)
**What:** The existing `deploy.yml` already builds the site twice — once with a root base for the test artifact, once with `ASTRO_BASE: /ajs-website/` for the actual GitHub Pages deploy. Phase 5 needs a THIRD variant: root base (like the test build) but with `SITE_URL` overridden to the real production domain, since `sitemap.xml.ts` and `robots.txt.ts` both read `Astro.site` (which comes from `astro.config.mjs`'s `site: process.env.SITE_URL || 'https://florianlepont.github.io'`) [VERIFIED: `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts` read this session].
**When to use:** Any new "build for OVH production" step.
**Example:**
```yaml
# Source: pattern extends the existing deploy.yml env-var convention (ASTRO_BASE),
# same mechanism already used for the GitHub Pages base-path build
- name: Build (OVH production artifact, root base, real domain)
  run: npm run build
  env:
    SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
    SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
    SANITY_API_READ_TOKEN: ${{ secrets.SANITY_API_READ_TOKEN }}
    SITE_URL: https://atelierjacquelinesuzanne.fr
    # ASTRO_BASE intentionally unset — OVH serves from the domain root
```

### Pattern 2: Manual-trigger + recap + approval gate
**What:** `workflow_dispatch` alone only prevents *automatic* runs; it does not pause a running job for review. Combine it with a job that prints a recap (e.g. `git diff --stat` between the last-deployed commit SHA — stored as a workflow artifact or a marker file — and `HEAD`, or simply a file-count/size summary of the new `dist/`) to the GitHub Actions job summary, then gate the actual SFTP-push job behind an `environment:` with Required reviewers [CITED: docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments].
**When to use:** The production-deploy job and, separately, is NOT applicable to the DNS cutover (that's a manual OVH-panel operation with no GitHub Actions involvement at all — see Common Pitfalls).
**Example:**
```yaml
on:
  workflow_dispatch: {}

jobs:
  build-recap:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: prod-dist
    steps:
      - uses: actions/checkout@v4
      # ... build steps from Pattern 1 ...
      - name: Recap
        run: |
          echo "### Deploy recap" >> "$GITHUB_STEP_SUMMARY"
          echo "Files: $(find dist -type f | wc -l)" >> "$GITHUB_STEP_SUMMARY"
          echo "Size: $(du -sh dist | cut -f1)" >> "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@v4
        with: { name: prod-dist, path: dist }

  deploy:
    needs: build-recap
    runs-on: ubuntu-latest
    environment: production-deploy   # pauses here for Required-reviewer approval
    steps:
      - uses: actions/download-artifact@v4
        with: { name: prod-dist, path: dist }
      - uses: wlixcc/SFTP-Deploy-Action@v1.2.6
        with:
          username: atelihu
          server: ftp.cluster129.hosting.ovh.net
          ssh_password: ${{ secrets.OVH_SFTP_PASSWORD }}
          local_path: './dist/*'
          remote_path: '/home/atelihu/www'
          sftp_only: true
```

### Anti-Patterns to Avoid
- **Wiping/"resetting" the DNS zone:** OVH's DNS zone editor has a reset function that "revert[s] back to a minimal configuration, with OVHcloud default records" [CITED: docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-edit] — this would delete the Zimbra MX records. Never use it; only ever edit the specific A/CNAME record(s) needed.
- **Using rsync-based or shell-exec-based GitHub Actions:** Any action that assumes SSH shell access (to `mkdir -p`, run `rsync` on the remote, etc.) will fail silently or with a confusing permission error on OVH's shared plan, which has no shell below the Professional tier [CITED: docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ssh-on-webhosting].
- **Hand-building the contact form's `From`/headers from raw `$_POST` values:** the classic PHP mail-injection vector — see Common Pitfalls.
- **Trusting only the client-side honeypot/validation:** `isHoneypotTriggered`/`isValidEmail`/`isBlank` in `contact-form.ts` are correctly scoped as UX-layer checks; `contact.php` must independently re-validate everything server-side, since any client-side JS can be bypassed entirely by a direct POST to the endpoint.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Manual-approval deploy gate | A custom "type CONFIRM" bash script parsing a `workflow_dispatch` text input | GitHub Actions `environment:` + Required reviewers | Native, pauses the run in the Actions UI with a real Approve/Reject button and a place to review the recap output first — exactly what's being asked for, zero custom code [CITED: docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments]. |
| SFTP upload from CI | Hand-rolled `curl`/`lftp` shell script inside the workflow | `wlixcc/SFTP-Deploy-Action` (or `milanmk/actions-file-deployer` as a fallback) | Both already handle retry, incremental sync, and the SFTP-without-shell case that OVH's plan requires — reimplementing this in raw shell reintroduces exactly the class of bug (partial uploads, silent failures) these actions exist to avoid. |
| Full zone export/history before DNS changes | A manual copy-paste of each record into a notes doc | OVH's built-in "Edit in text mode" export + version history/restore | Already exists natively in the OVH control panel [CITED: docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-edit] — satisfies "full current DNS zone dump shown before any modification" with zero tooling. |
| Email format/injection validation in PHP | A hand-rolled regex from scratch | PHP's built-in `filter_var($email, FILTER_VALIDATE_EMAIL)` plus an explicit CRLF rejection check | `filter_var` is the standard, well-tested library function for this; hand-rolled email regexes are a well-known source of both false rejections and injection-vector gaps. |

**Key insight:** Every piece of this phase has a native, already-provided mechanism (GitHub Environments for gating, OVH's zone editor for DNS safety, `filter_var` for email validation) — the main planning risk is *not knowing these exist* and reinventing weaker versions, not a lack of tooling.

## Common Pitfalls

### Pitfall 1: DNS cutover silently breaks Zimbra/MX
**What goes wrong:** An A-record or "point domain at hosting" change accidentally touches or is scoped too broadly and removes/overwrites MX records, breaking Romane's existing email.
**Why it happens:** Some DNS UIs (and OVH's own "reset zone" feature) operate at the whole-zone level rather than per-record; a well-intentioned "clean slate" click can wipe everything.
**How to avoid:** Only ever edit the specific A (and possibly `www` CNAME) record(s); never use the zone reset function; export/dump the full zone via text mode BEFORE any change and diff it against the post-change export to confirm MX rows are byte-identical.
**Warning signs:** Any UI flow that mentions "reset," "restore defaults," or "reconfigure zone" rather than "edit this record."

### Pitfall 2: PHP mail() header injection via the contact form
**What goes wrong:** A malicious submitter puts `\r\nBcc: attacker@example.com` (or similar) into the name/email field; if that value is concatenated directly into a mail header, it silently adds recipients or corrupts the message.
**Why it happens:** `mail()`'s header-string parameter is just a string — PHP does not sanitize it, so any newline the caller passes through becomes a new header line.
**How to avoid:** Validate the submitted email with `filter_var(..., FILTER_VALIDATE_EMAIL)`; additionally explicitly reject any field containing `\r` or `\n` before it touches header construction; never build `From:`/`Reply-To:` directly from the visitor's raw input — set a fixed `From:` matching the hosting domain and put the visitor's email only in the message body or a `Reply-To:` that has already passed the CRLF check [CITED: shiflett.org/articles/email-injection].
**Warning signs:** Any code path where `$_POST['email']` (or `name`/`message`) is interpolated straight into a string later passed as `mail()`'s headers argument.

### Pitfall 3: Cross-origin contact-form request from the (permanently-alive) GitHub Pages staging site
**What goes wrong:** Since GitHub Pages stays live forever as pre-production, its build's `ContactForm.astro` will `fetch()` the OVH-hosted `contact.php` cross-origin. The current implementation sends `Content-Type: application/json`, which is a non-simple CORS request and triggers a preflight `OPTIONS` call — if `contact.php` doesn't answer `OPTIONS` with the right `Access-Control-Allow-*` headers, the real POST never fires and the form silently fails on staging (while working fine on production, where it's same-origin) [CITED: enable-cors.org/server_php.html].
**Why it happens:** CORS preflight rules are content-type-dependent and easy to miss when a form "already works" in same-origin local dev/testing.
**How to avoid:** Either (a) have `contact.php` explicitly handle `OPTIONS` requests and set `Access-Control-Allow-Origin` to the exact GitHub Pages origin (`https://florianlepont.github.io`) before any output, or (b) simpler: change the fetch call to send the existing `FormData` object directly as the body (dropping the hand-built JSON + `Content-Type: application/json` header) — `multipart/form-data` is CORS-safelisted, so no preflight fires at all, and PHP reads it natively via `$_POST`.
**Warning signs:** Contact form works when testing against the production domain directly but silently does nothing (or throws a CORS console error) when tested from the `florianlepont.github.io/ajs-website/` staging URL.

### Pitfall 4: Missing `SITE_URL` override breaks canonical URLs/sitemap/robots.txt on production
**What goes wrong:** `astro.config.mjs`'s `site` falls back to `https://florianlepont.github.io` whenever `SITE_URL` isn't set at build time; if the new "build for OVH" CI step forgets to set `SITE_URL=https://atelierjacquelinesuzanne.fr`, the deployed production site's sitemap, robots.txt, canonical tags, and hreflang links all point back at the GitHub Pages URL instead of itself.
**Why it happens:** This is an easy step to omit since it's not needed for local dev or for the existing GitHub Pages build path (which correctly wants the GitHub Pages URL).
**How to avoid:** Explicitly set `SITE_URL` in the new OVH-production build step's `env:` block (see Pattern 1); add it to the phase's verification checklist (`curl https://atelierjacquelinesuzanne.fr/sitemap.xml` should list `atelierjacquelinesuzanne.fr` URLs, not `florianlepont.github.io`).
**Warning signs:** Post-cutover, `view-source:` on the production homepage shows a `<link rel="canonical">` pointing at github.io.

### Pitfall 5: Un-pinned or shell-requiring third-party GitHub Action for the SFTP step
**What goes wrong:** Either the Action floats on a mutable tag (supply-chain risk to the SFTP password secret) or the chosen Action silently assumes SSH shell access that OVH's shared plan doesn't have, producing a cryptic connection/permission failure at deploy time rather than at planning time.
**Why it happens:** Most FTP/SFTP GitHub Actions in the ecosystem target VPS/dedicated-server targets with full shell access; shared-hosting-compatible ones are a minority and not always clearly labeled as such.
**How to avoid:** Confirm `sftp_only: true` (or equivalent) is set for whichever action is chosen; pin to a specific release tag or commit SHA, not `@master`/`@main`.
**Warning signs:** A deploy job that fails with a permission or "command not found" error referencing shell commands (`mkdir`, `rsync`) rather than a file-transfer error.

## Code Examples

### `public/.htaccess` — minimal, static-site-appropriate
```apache
# Source: pattern combining OVHcloud's documented .htaccess/mod_rewrite guidance
# (docs.ovhcloud.com/en/guides/web-cloud/web-hosting/htaccess-what-else-can-you-do)
# with Astro's documented custom-404 build output (docs.astro.build — 404.astro
# always builds to /404.html regardless of trailingSlash config)
ErrorDocument 404 /404.html

# Prevent directory listing on any folder without an index.html
Options -Indexes

# Force HTTPS (OVH's free Let's Encrypt cert is already auto-issued and
# auto-renewed — docs.ovhcloud.com/en/guides — this just redirects http -> https)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### `public/contact.php` — minimal header-injection-safe endpoint
```php
<?php
// Source: pattern synthesized from Shiflett's email-injection defense
// (shiflett.org/articles/email-injection) + thesitewizard.com's mail-injection
// guide + this project's existing client-side validation contract
// (src/lib/contact-form.ts: isBlank / isValidEmail semantics mirrored here).
// [ASSUMED — not fetched verbatim from a single authoritative "reference impl";
// synthesized from the cited articles' described techniques, adapt at plan time]

header('Content-Type: application/json; charset=utf-8');

// If the ContactForm.astro fetch is switched to send FormData directly
// (recommended, see Pitfall 3), no CORS headers are needed at all for the
// production (same-origin) case. Cross-origin GitHub Pages staging support,
// if kept on the JSON path instead, would need explicit OPTIONS handling here.

function fail(int $code, string $message): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method not allowed');
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$honeypot = trim($_POST['website'] ?? ''); // mirrors the client-side honeypot field name

// Server-side honeypot re-check (defense in depth — client-side check in
// contact-form.ts can be bypassed by a direct POST to this endpoint).
if ($honeypot !== '') {
    // Pretend success, exactly like the client does — never reveal detection.
    echo json_encode(['success' => true]);
    exit;
}

if ($name === '' || $email === '' || $message === '') {
    fail(400, 'Missing required field');
}

// Reject CRLF in any field before it can reach a header — the core
// header-injection defense (Shiflett / thesitewizard.com pattern).
foreach ([$name, $email, $message] as $field) {
    if (preg_match('/[\r\n]/', $field)) {
        fail(400, 'Invalid input');
    }
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(400, 'Invalid email address');
}

$to = 'contact@atelierjacquelinesuzanne.fr'; // keep in sync with Sanity contact.publicEmail
$subject = 'Nouveau message depuis le site — Atelier Jacqueline Suzanne';

// Fixed envelope-from matching the hosting domain — never the visitor's
// address — per OVHcloud's own guidance to reduce SPF/DKIM/deliverability
// risk (docs.ovhcloud.com/en/guides/web-cloud/web-hosting/email-sending-best-practices).
$headers = "From: no-reply@atelierjacquelinesuzanne.fr\r\n";
$headers .= "Reply-To: {$email}\r\n"; // already CRLF/format-checked above
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$body = "Nom: {$name}\nEmail: {$email}\n\n{$message}";

$sent = mail($to, $subject, $body, $headers, '-f no-reply@atelierjacquelinesuzanne.fr');

if (!$sent) {
    // Matches ContactForm.astro's existing renderSubmissionError() contract:
    // any non-2xx or {success:false} response triggers the already-built
    // "email me directly at {publicEmail}" fallback message client-side.
    fail(502, 'Send failed');
}

echo json_encode(['success' => true]);
```

### `ContactForm.astro` fetch call — recommended change (avoids CORS preflight)
```typescript
// Source: pattern derived from MDN CORS-safelisted-content-type documentation
// referenced via enable-cors.org/server_php.html this session.
// BEFORE (current, triggers a preflight when cross-origin):
//   fetch('https://api.web3forms.com/submit', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ access_key, name, email, message }),
//   });
//
// AFTER (recommended — same FormData already built via `new FormData(form)`,
// just send it directly instead of hand-building JSON):
const response = await fetch(contactEndpoint, {
  method: 'POST',
  body: data, // the existing `const data = new FormData(form)` — no
              // Content-Type header set manually; the browser sets the
              // correct multipart/form-data boundary itself, and this
              // content type is CORS-safelisted (no preflight).
});
const json = await response.json();
if (response.ok && json.success) {
  renderSuccess();
  form.reset();
} else {
  renderSubmissionError(); // unchanged — existing fallback-to-email message
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Web3Forms third-party form-relay service | OVH native PHP `mail()` | This phase (locked user decision) | Removes the never-provisioned third-party dependency; trades away Web3Forms' built-in spam filtering and deliverability tooling for a smaller, self-hosted surface — explicitly accepted per the "honeypot is the only anti-spam layer wanted" decision. |
| `SamKirkland/FTP-Deploy-Action` supporting SFTP (pre-v4) | v4+ dropped SFTP, FTP/FTPS only | Noted in that action's own migration docs [CITED: github.com/SamKirkland/FTP-Deploy-Action/blob/master/migration.md] | Rules this action out for this phase given OVH's confirmed SFTP-only credentials; use `wlixcc/SFTP-Deploy-Action` (or `milanmk/actions-file-deployer`) instead. |

**Deprecated/outdated:**
- Manually FTP-uploading via a desktop client: superseded by the CI-driven SFTP-Action approach in this phase, which gives the "preview + go-ahead gate" property that a manual desktop upload can't easily provide in an auditable way.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | This research's entire "Known project facts / User wants" input was supplied directly in the task brief, not read from an on-disk `05-CONTEXT.md` (none exists yet). | User Constraints | If the brief mis-transcribed an actual prior user decision, the plan would lock in the wrong constraint. Run `/gsd-discuss-phase 5` to produce a real `05-CONTEXT.md` before/alongside planning. |
| A2 | `wlixcc/SFTP-Deploy-Action`'s exact current version (`v1.2.6`) and input names (`server`, `username`, `ssh_password`, `sftp_only`, `local_path`, `remote_path`) | Standard Stack, Code Examples | If the action's interface has changed, the workflow YAML will fail at first run; low risk (fails loud, not silent) but should be confirmed against the live `action.yml` before finalizing the plan's task list. |
| A3 | OVH's exact webroot subpath under `/home/atelihu/` (guessed as `/home/atelihu/www` in examples) | Code Examples, Architecture Patterns | Wrong remote path means files upload but the live site doesn't update, or upload fails outright — this needs a `checkpoint:human-verify` against the actual OVH control panel/FTP client before the plan's SFTP step is finalized. |
| A4 | The exact production contact mailbox address (`contact@atelierjacquelinesuzanne.fr`, taken from the codebase default / Sanity `contact.publicEmail`) is the correct live Zimbra mailbox to send to | Code Examples | Per the task brief, this is explicitly "TBD/to confirm via OVH panel" — sending to a wrong/nonexistent mailbox alias would silently swallow every contact-form submission. |
| A5 | Self-approval is not blocked when the same GitHub user both triggers a `workflow_dispatch` run and is listed as the Required reviewer on its target environment | Standard Stack, Architecture Patterns | If GitHub does block self-approval for this repo/plan combination, the "explicit go-ahead gate" would deadlock (nobody else to approve) — verify this in a low-stakes test run before relying on it for the real cutover, or use the simpler typed-confirmation fallback instead. |
| A6 | `milanmk/actions-file-deployer` genuinely avoids requiring shell access (documented only as "supports SFTP," not explicitly confirmed shell-free the way `wlixcc`'s `sftp_only` flag is) | Standard Stack (Alternatives) | Listed only as a secondary/fallback option, not the primary recommendation — low risk since the primary recommendation doesn't depend on this claim. |

## Open Questions

1. **Does `05-CONTEXT.md` need to be created via `/gsd-discuss-phase` before this research is treated as final?**
   - What we know: No such file exists; this research's "User Constraints" section was populated from the task brief's "Known project facts"/"User wants" text.
   - What's unclear: Whether the orchestrator intends to run `/gsd-discuss-phase 5` separately, or whether this brief IS the intended substitute for it in this workflow run.
   - Recommendation: Treat this RESEARCH.md as valid for planning purposes given the brief's specificity, but flag to the user/planner that a formal discuss-phase pass would firm up the "Claude's Discretion" items (gate mechanism choice, exact `.htaccess` contents, CORS-vs-FormData decision) into locked decisions.

2. **Exact OVH webroot path and whether `atelierjacquelinesuzanne.fr` is already "attached" to the `atelihu` hosting account, or needs the Multisite attach-domain flow run first**
   - What we know: SFTP home dir is `/home/atelihu`; OVH's Multisite feature is the documented mechanism for attaching an OVH-registered domain to a Web Hosting plan and yields the required DNS records.
   - What's unclear: Whether this attachment step has already been done (the domain currently serves Myportfolio, suggesting either it was never attached to `atelihu`'s hosting, or it was attached but DNS still points elsewhere) — this needs to be checked live in the OVH control panel, not assumed from research.
   - Recommendation: First plan task/checkpoint should be "log into the OVH control panel, check Hébergements → Multisite status for this domain, and the exact webroot subdirectory" before the SFTP workflow step's `remote_path` is finalized.

3. **Exact live Zimbra mailbox address the contact form should send to**
   - What we know: Code defaults to `contact@atelierjacquelinesuzanne.fr`; the task brief explicitly says this is "TBD/to confirm via OVH panel."
   - What's unclear: Whether that mailbox actually exists/is monitored, or whether Romane checks a different address.
   - Recommendation: `checkpoint:human-verify` before or during the plan — confirm the mailbox in the OVH panel/Zimbra webmail before wiring `contact.php`'s `$to`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| OVH SFTP (port 22) | Production deploy job | ✓ (confirmed via `01-02-SUMMARY.md`, not re-tested live this session) | — | Plain FTP (port 21) also available per the same summary, but SFTP is preferred (encrypted) — no fallback needed. |
| OVH SSH shell access | N/A — deliberately not used | ✗ (Free/mutualized tier has none; Professional tier+ only) [CITED: docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ssh-on-webhosting] | — | Not needed — `sftp_only: true` mode is the designed-for path, not a workaround. |
| PHP `mail()` on OVH shared hosting | Contact form endpoint | ✓ (available by default per OVH's own docs discussing its rate-limiting/abuse policy, which presupposes it's enabled) [CITED: docs.ovhcloud.com/en/guides/web-cloud/web-hosting/email-sending-best-practices] | Whatever PHP version the shared plan runs (not independently configurable per OVH's own docs) | None needed. |
| OVH free Let's Encrypt SSL/HTTPS | `.htaccess` HTTPS-redirect rule | ✓ (auto-issued and auto-renewed by default on all OVH web hosting plans) [CITED: OVHcloud SSL documentation] | — | None needed. |
| GitHub Actions `environment:` Required reviewers | Deploy approval gate | ✓ (free feature for public repos; this repo is already public per `01-02-SUMMARY.md`) | — | Typed-confirmation `workflow_dispatch` input, if self-approval turns out to be a problem (see A5). |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** none currently blocking — see Assumptions Log for items needing live confirmation rather than missing tooling.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit) + Playwright 1.61.1 (e2e) — both already wired as BLOCKING CI gates [VERIFIED: `.github/workflows/deploy.yml`, CLAUDE.md] |
| Config file | `vitest.config.ts` / `playwright.config.ts` (existing, unchanged by this phase) |
| Quick run command | `npm run test:unit` (Vitest) / `npx playwright test --grep <name>` (targeted e2e) |
| Full suite command | `npm run test:coverage && npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| LAUNCH-01 (site serves from production domain) | Post-deploy smoke check: `curl -I https://atelierjacquelinesuzanne.fr` returns 200 and body matches the new site, not Myportfolio | manual/smoke (not unit-testable pre-cutover — no live prod target exists in CI) | `curl -sI https://atelierjacquelinesuzanne.fr \| head -1` | ❌ Wave 0 — this is inherently a post-deploy manual/scripted check, not a pre-existing test file |
| LAUNCH-01 (MX/email preserved) | `dig MX atelierjacquelinesuzanne.fr` unchanged before/after DNS edit | manual/smoke | `dig +short MX atelierjacquelinesuzanne.fr` (run before AND after, diff the output) | ❌ Wave 0 — DNS verification is not something Vitest/Playwright can exercise; must be a documented manual step |
| LAUNCH-01 (DNS cutover rehearsed) | TTL lowered in advance, zone exported before change, staging-alias-equivalent verified via OVH's Diagnostic column | manual/checklist | N/A — procedural, not automatable from this codebase | ❌ Wave 0 — process checklist, not a test file |
| Contact form (`contact.php`) reachable and functioning | POST with valid fields returns `{success:true}`; POST with honeypot filled returns success without sending; POST with CRLF-laden field returns 400 | integration (new) | New Playwright/e2e test hitting a locally-served `contact.php` via PHP's built-in server (`php -S localhost:8000`), or a lighter PHPUnit/Pest unit test if a PHP test runner is added | ❌ Wave 0 — no PHP test infrastructure currently exists in this all-JS/TS repo |

### Sampling Rate
- **Per task commit:** `npm run test:unit` (existing Vitest suite; any `ContactForm.astro`/`contact-form.ts` changes stay covered by the existing unit tests for those files).
- **Per wave merge:** `npm run test:coverage && npx playwright test` (existing full suite) — note this does NOT and cannot cover the new `contact.php` script (PHP, not JS/TS) or the live DNS/OVH deploy path; those need the manual/smoke checks above.
- **Phase gate:** Full existing JS/TS suite green, PLUS the manual DNS/deploy checklist items above, PLUS (if added) a PHP-side test for `contact.php`'s validation logic.

### Wave 0 Gaps
- [ ] No PHP test runner/framework exists in this repo at all — decide whether `contact.php`'s validation logic gets (a) a lightweight PHPUnit/Pest test, (b) an e2e Playwright test that POSTs to a locally-`php -S`-served instance, or (c) manual-only verification given this is a single ~40-line script. Given the project's near-zero-tooling philosophy, (b) or (c) is likely more proportionate than adding a whole new PHP test framework for one script — flag this tradeoff to the planner.
- [ ] A documented manual DNS-cutover checklist/runbook (zone dump before, TTL-lowering timeline, Diagnostic-column check, zone dump after with MX-row diff) — this is process documentation, not a test file, but should exist as an artifact (likely a plan task output, e.g. `05-DNS-RUNBOOK.md`) so the "rehearsed/verified" success criterion has a concrete, checkable artifact.
- [ ] Post-deploy smoke-check script (`curl`/`dig` one-liners above) — trivial to write, currently doesn't exist; could live as a small shell script or just documented commands run manually at cutover time.

*(Not "none" — this phase's two riskiest requirement areas, DNS and PHP, sit entirely outside the existing JS/TS test harness by nature, so Wave 0 gaps here are expected and should be explicitly scoped rather than silently skipped.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|--------------------|
| V2 Authentication | No | No auth surface introduced — `contact.php` is anonymous-POST by design, same as the Web3Forms integration it replaces. |
| V3 Session Management | No | No sessions/cookies involved. |
| V4 Access Control | Marginal | `contact.php` should reject non-POST methods (405) and, ideally, be placed such that it isn't directly browsable/listable (covered by `Options -Indexes` in `.htaccess`). |
| V5 Input Validation | **Yes** | Server-side re-validation in `contact.php`: `filter_var(..., FILTER_VALIDATE_EMAIL)` for email format, explicit CR/LF rejection on all fields before header construction, required-field checks mirroring `isBlank`'s semantics. |
| V6 Cryptography | Marginal | No app-level crypto; relies on OVH's auto-issued Let's Encrypt TLS termination (never hand-roll TLS) and SFTP's built-in encryption for the deploy channel — both already provided by the platform, not something this phase implements itself. |
| V13/V14 Communications & Config | **Yes** | `.htaccess` HTTPS-redirect rule; DNS cutover itself is a configuration-security-relevant operation (must not expose MX/email to disruption); GitHub Actions secret (`OVH_SFTP_PASSWORD`) must be stored as a repo/environment secret, never committed or logged. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| PHP `mail()` header/CRLF injection (adding Bcc, forging From) | Spoofing / Tampering | Reject `\r`/`\n` in all fields before header construction; `filter_var` email validation; fixed envelope-from (see Pitfall 2, Code Examples). |
| SFTP credential leakage via workflow logs or a compromised/mutable Action tag | Information Disclosure | Store the SFTP password only as a GitHub Actions secret (never echoed, never in `local_path`/`remote_path` which are safe to log); pin the deploy Action to an exact tag or commit SHA (see Pitfall 5, Package Legitimacy Audit). |
| DNS zone tampering / accidental MX wipe during cutover | Tampering / Denial of Service (of email) | Full zone dump before any change, edit only the specific A/CNAME record, never use the "reset zone" feature, verify MX rows are unchanged in a post-change dump (see Pitfall 1). |
| Contact-form spam/abuse triggering OVH's automatic outbound-mail blocking | Denial of Service (of the contact channel itself) | Explicit user decision accepted the honeypot-only risk profile; documented as a known tradeoff (see Alternatives Considered) rather than silently mitigated, since server-side rate limiting was explicitly declined. |
| Cross-origin contact-form request mishandled, silently failing on the permanent GitHub Pages staging site | Tampering (of intended data flow) / availability of a feature, not a security vuln per se | FormData-body approach (no preflight) or correctly-scoped `Access-Control-Allow-Origin` (exact origin, not `*`) — see Pitfall 3. |

## Sources

### Primary (HIGH confidence)
- Codebase reads this session: `astro.config.mjs`, `.github/workflows/deploy.yml`, `src/components/ContactForm.astro`, `src/lib/contact-form.ts`, `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `.planning/milestones/v1.0-phases/01-foundation-bilingual-infrastructure/01-02-SUMMARY.md` — all VERIFIED by direct file read, not inference.

### Secondary (MEDIUM confidence — WebSearch/WebFetch cross-checked against official docs)
- docs.ovhcloud.com/en/guides/web-cloud/web-hosting/ssh-on-webhosting — SSH access Professional-tier-and-up only.
- docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-edit — zone text-mode export, version history/restore, reset-zone danger.
- docs.ovhcloud.com/en/guides/web-cloud/web-hosting/email-sending-best-practices — `mail()` abuse-blocking risk, MX Plan SMTP quota figure (~200/hr, not applicable to `mail()` itself), recommendation to prefer authenticated SMTP.
- docs.ovhcloud.com/en/guides/web-cloud/web-hosting/htaccess-what-else-can-you-do — mod_rewrite availability on OVH shared hosting.
- docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments — Environments + Required reviewers gating mechanism.
- shiflett.org/articles/email-injection — canonical PHP mail-header-injection mechanism and defense.
- github.com/wlixcc/SFTP-Deploy-Action, github.com/milanmk/actions-file-deployer — SFTP-only/password-auth GitHub Action capabilities.
- docs.astro.build (public/ directory passthrough, custom 404 build behavior).
- enable-cors.org/server_php.html — PHP-side CORS preflight handling.

### Tertiary (LOW confidence — WebSearch only, flagged for validation at plan/execute time)
- Exact `wlixcc/SFTP-Deploy-Action` current input-name spelling and `v1.2.6` tag currency (Assumption A2).
- OVH's public REST API DNS coverage (not needed for this phase's one-time manual cutover, included only for completeness).
- Whether `milanmk/actions-file-deployer` truly requires zero shell access (Assumption A6) — not relied upon as the primary recommendation.

## Metadata

**Confidence breakdown:**
- Standard Stack: MEDIUM — core facts (OVH SFTP-only/no-shell, DNS zone editor capabilities, PHP mail() availability/risk) are CITED against official OVHcloud docs; the specific third-party GitHub Action's exact version/input names are WebSearch-derived and flagged `[ASSUMED]` pending a direct check of the action's own repo at plan/execute time.
- Architecture: MEDIUM — the deploy-gate pattern (GitHub Environments) is a well-documented native GitHub feature; the exact self-approval behavior for a solo maintainer (Assumption A5) is unverified and should be smoke-tested before relying on it for the real cutover.
- Pitfalls: HIGH for the DNS/MX and PHP-injection pitfalls (grounded in official OVH docs and the canonical Shiflett/Nicol injection literature); MEDIUM for the CORS/preflight pitfall (correct mechanism, but the exact interaction with this specific `ContactForm.astro` codebase is this research's own synthesis, not a fetched worked example).

**Research date:** 2026-08-11
**Valid until:** ~2026-09-10 (30 days — OVH hosting mechanics and PHP mail-injection defenses are stable/slow-moving; the one faster-moving piece, the exact GitHub Action version, should be re-verified regardless of this date, right before first use).
