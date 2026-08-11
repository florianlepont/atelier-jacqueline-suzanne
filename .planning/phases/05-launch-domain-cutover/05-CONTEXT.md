# Phase 5: Launch & Domain Cutover - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

The new Astro + Sanity site fully replaces the old Myportfolio site at atelierjacquelinesuzanne.fr, with no unplanned downtime and no broken email. This phase covers: standing up the OVH production deploy path (manual SFTP push), a rehearsed/reversible DNS cutover that preserves the domain's active Zimbra mail service, and switching the contact form from the never-provisioned Web3Forms integration to OVH's native PHP `mail()` so it actually delivers messages once live. GitHub Pages staging is not being retired — it continues as the pre-production environment after cutover.

</domain>

<decisions>
## Implementation Decisions

### Mécanisme de déploiement
- **D-01:** Deploys to the real domain are always an explicit, manual trigger (e.g. `workflow_dispatch` or a manual SFTP push) — never automatic on push to `main`. `main` continues to auto-deploy to GitHub Pages staging as it does today; that pipeline is untouched.
  - **D-01 superseded in part (2026-08-11, post-launch):** Production deploys triggered by the Sanity `sanity-content-published` webhook now run automatically with no approval gate, because the non-technical maintainer has no GitHub access and could not otherwise publish content to the real domain. Manual/dispatch-triggered production deploys still require the D-02 approval, and commits to `main` still deploy only to GitHub Pages staging — so the code-deploy half of D-01 stands. Implemented via a trigger-conditional `environment.name` on the `deploy` job in `.github/workflows/deploy-ovh.yml`, selecting the unprotected `production-ovh-auto` environment for `repository_dispatch` runs and the reviewer-protected `production-ovh` environment for everything else. See `.planning/quick/260811-v3t-make-sanity-content-triggered-production/`.
- **D-02:** For this specific first launch, show a preview/recap first — build ready, exact DNS records that will change — and wait for an explicit go-ahead before any SFTP push or DNS modification. Same confirmation pattern as the v1.6 milestone-close "ok go" gate.
- **D-03:** GitHub Pages stays live as a permanent pre-production environment after the OVH cutover — useful for previewing future changes before they reach the real domain, at no extra cost.

### Séquencement DNS & plan de rollback
- **D-04:** Before touching anything, show the full current DNS zone state (MX, A, CNAME, TXT, etc.) as it exists today at OVH. This is a hard prerequisite given the domain's active Zimbra mail service — nothing gets modified blind.
- **D-05:** No timing constraint on the cutover — any day/time is acceptable, no maintenance window needed.
- **D-06:** If something breaks immediately post-cutover, prefer troubleshooting/fixing in place for a reasonable window before considering a DNS rollback — don't roll back at the first sign of trouble, but don't let it drag on indefinitely either.

### Implémentation du formulaire de contact (PHP mail())
- **D-07:** Contact form submissions deliver to the domain's existing Zimbra mailbox. **Open item:** the exact recipient address was not specified by the user and must be confirmed via the OVH control panel before implementation — do not guess or invent an address.
- **D-08:** The existing client-side honeypot (`isHoneypotTriggered` in `src/lib/contact-form.ts`) is sufficient anti-spam. No additional server-side (PHP-side) spam filtering — consistent with the project's near-zero-maintenance-overhead posture.
- **D-09:** If the PHP `mail()` send fails, the visitor must never be left stuck with a generic error — show a fallback contact alternative (e.g., a direct email address or Instagram link) so they always have a way to reach Romane.

### Claude's Discretion
- Exact OVH deploy mechanism details (which SFTP client/script, whether a GitHub Actions manual-dispatch job or a local script) — pick whatever is simplest and most reliable given the confirmed SFTP creds (`ftp.cluster129.hosting.ovh.net`, user `atelihu`, home `/home/atelihu`, port 22, SFTP not FTPS).
- PHP `mail()` implementation specifics (script structure, header sanitization, error handling shape) — standard secure practice, no user preference expressed beyond D-07/D-08/D-09.
- Exact DNS record values to set (A record IP, TTL numbers) — derive from OVH hosting's actual requirements once the current zone is inspected per D-04; just don't touch MX/mail-related records.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Domain & hosting facts
- `.planning/PROJECT.md` Key Decisions table — OVH Web Hosting as production target, GitHub Pages as staging, Sanity build-time fetch, near-zero budget constraint
- Project memory `project_ovh_hosting.md` — domain has active Zimbra email/MX records at OVH's DNS zone; hosting is cluster129 mutualized; confirmed SFTP creds (host `ftp.cluster129.hosting.ovh.net`, user `atelihu`, home `/home/atelihu`, port 22)
- `.github/workflows/deploy.yml` — current CI/CD pipeline (checkout → typecheck → build → tests → GitHub Pages deploy); no OVH SFTP step exists yet; a comment already flags this as deferred to "a separate Phase 5 plan, using the SFTP facts"

### Contact form
- `src/lib/contact-form.ts` — dependency-free honeypot/validation helpers (`isHoneypotTriggered`, `isValidEmail`, `isBlank`); explicit doc comment: must stay dependency-free since it ships to both the client bundle and Vitest
- `src/components/ContactForm.astro` (~line 203) — current `fetch('https://api.web3forms.com/submit', ...)` call to be replaced with a PHP `mail()` endpoint
- Project memory `project_contact_form_delivery_deferred.md` — Web3Forms key was never provisioned; deliberately deferred to this phase; form is non-functional on staging until this ships

### Roadmap scope
- `.planning/ROADMAP.md` "Phase 5: Launch & Domain Cutover" section — Goal, Depends on (Phases 2/3/4/04.1/04.2, all shipped), Requirements (LAUNCH-01), and the 3 Success Criteria (new site serves the domain; MX/email continues working; DNS cutover rehearsed/verified before the production switch)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/contact-form.ts`: existing honeypot/validation logic is kept as-is (D-08) — the PHP endpoint just needs to receive and forward the already-validated form fields.
- Existing GitHub Actions workflow (`deploy.yml`) build steps (typecheck, unit/e2e tests, artifact verification) can be reused/mirrored for a manually-triggered OVH deploy job rather than rebuilt from scratch.

### Established Patterns
- Root-base vs. `/ajs-website/`-base dual build already exists in the pipeline (`ASTRO_BASE` env var) — the OVH production build should use the root-base artifact, same as the "test artifact" build already produced for GitHub Pages' pre-Pages-rebuild verification step.

### Integration Points
- New PHP `mail()` script lives on OVH hosting itself (outside the Astro build) — `ContactForm.astro`'s fetch target changes from the Web3Forms URL to this script's path.
- DNS changes happen at OVH's DNS zone management, outside the codebase entirely — no code changes required for the cutover itself, only for the deploy mechanism and the contact form.

</code_context>

<specifics>
## Specific Ideas

No specific implementation examples given beyond the decisions above — user wants to see concrete artifacts (DNS zone dump, deploy preview/recap) before each irreversible step, not a particular technical approach.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The "Checklist de vérification du lancement" gray area was surfaced but not selected for discussion this round; it remains available to revisit if planning surfaces open questions about launch verification steps.

</deferred>

---

*Phase: 5-Launch & Domain Cutover*
*Context gathered: 2026-08-11*
