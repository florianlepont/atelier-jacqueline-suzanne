# Phase 1: Foundation & Bilingual Infrastructure - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the technical foundation — Astro static site + OVH Web Hosting + Sanity CMS — with working bilingual (FR/EN) routing and a persistent language switcher, deployed to a public preview URL. This phase proves the plumbing (routing, CMS wiring, deployment pipeline) that every later content phase (Portfolio, About/Contact, Legal, Launch) builds on. It does not include real portfolio/about/contact content — only enough placeholder content to prove the infrastructure works end-to-end.

</domain>

<decisions>
## Implementation Decisions

### Locale URL Structure
- **D-01:** French is the default locale served at the root path (no `/fr/` prefix); English is served under `/en/`. This overrides ROADMAP.md's literal "/fr/ and /en/" phrasing — treat "under both /fr/ and /en/ URL paths" as satisfied by root-for-French + `/en/`-prefix, matching CLAUDE.md's `prefixDefaultLocale: false` recommendation.
- **D-02:** Visiting `/` always serves French — no Accept-Language browser detection or auto-redirect. Keep this simple; no locale-detection logic to build or debug.
- **D-03:** Once a visitor switches to English, remember that choice via a cookie so return visits stay in English. (Note for Phase 4/Legal: assess whether this locale-preference cookie counts as "essential/functional" and can be exempted from the cookie-consent banner, or needs to be listed in it — flag this when Phase 4 is planned.)
- **D-04:** The language switcher navigates to the equivalent page in the other locale (not always to homepage), per ROADMAP.md's Phase 1 success criteria #2 — each page needs to know its translated-URL counterpart.

### OVH Deployment Mechanics
- **D-05:** Deploy via automated CI: GitHub Actions builds the Astro static output and syncs it to OVH Web Hosting over FTP/SFTP on every push to `main`. No manual upload step.
- **D-06:** The exact OVH protocol/plan details (FTP vs SFTP vs SSH, any OVH-specific deploy tooling) are **unverified** — confirming this is the first task of Phase 1 execution, before wiring the CI pipeline. (Carries forward the existing STATE.md blocker.)
- **D-07:** Phase 1 deploys to a staging subdomain of the real domain (e.g. `staging.atelierjacquelinesuzanne.fr`), not OVH's default temporary hosting URL and not the production domain — the real domain cutover happens in Phase 5. Requires adding a DNS record for the subdomain now, separate from the live site's existing DNS.
- **D-08:** The staging subdomain must have HTTPS (OVH Web Hosting includes free Let's Encrypt certs for subdomains — no added cost).

### Staging Host Override (discovered during execution, 2026-07-06)
- **D-07/D-08 superseded:** D-07 and D-08 assumed OVH Web Hosting's multisite feature could host a `staging.` subdomain alongside the production domain. During Plan 01-02 execution, OVH's control panel confirmed the "Free hosting" tier ("Hébergement Mutualisé") cannot attach any additional domain/subdomain at all — multisite requires a paid tier, not just a cert-provisioning delay as RESEARCH.md's Pitfall 5 anticipated.
- **D-12:** Phase 1 staging deploys to **GitHub Pages** instead (project page at `https://florianlepont.github.io/ajs-website/`, requiring `base: '/ajs-website/'` in `astro.config.mjs`). No new account needed (repo is already on GitHub), and HTTPS is automatic — no Let's Encrypt wait. Production cutover to the real OVH-hosted domain is still deferred to Phase 5, as originally planned.
- **D-13:** The OVH protocol/doc-root question (D-06) is still resolved now, for later Phase 5 use: plan tier is OVH "Free hosting" (cluster129, eu-west-gra datacenter, 100MB disk), DNS zone is managed at OVH itself, and **SFTP is available and enabled** (port 22, host `ftp.cluster129.hosting.ovh.net`, user `atelihu`, home dir `/home/atelihu`) — encrypted SFTP should be preferred over the originally-assumed FTPS when Phase 5 wires the real production deploy.
- **D-14:** The domain already has an active email service (MX Plan + Zimbra mailbox) — Phase 5's eventual DNS cutover must preserve existing MX/email records, not perform a blanket DNS wipe.

### First Sanity Content Type
- **D-09:** The first locale-aware Sanity content type is a **site-wide settings singleton** (nav labels, footer text, site title) — not a throwaway placeholder schema. The localized UI chrome (nav, footer) required by Phase 1's success criteria pulls its copy from this Sanity document, so it's real infrastructure that Phase 2+ keeps using.
- **D-10:** Phase 1 also ships a bare placeholder homepage (short locale-aware welcome text) so the staging URL shows coherent content when previewed, rather than a blank page. Real homepage content arrives in later phases.

### Language Switcher UX
- **D-11:** Switcher lives in the header as a simple text toggle: "FR | EN". No dropdown, no flag icons.

### Claude's Discretion
None — all discussed areas resulted in explicit user decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack & Architecture Research
- `.planning/research/STACK.md` — verified package versions and stack rationale (Astro, Sanity, OVH override, etc.)
- `.planning/research/ARCHITECTURE.md` — component boundaries and data-flow patterns (Jamstack-with-islands, locale-in-URL-path caching implications)
- `.planning/research/PITFALLS.md` — known integration risks (e.g. free-tier limits, Sharp/Cloudflare-adapter incompatibility — note: hosting is OVH not Cloudflare for v1, re-check which pitfalls still apply)
- `.planning/research/SUMMARY.md` — overall stack synthesis and phase-by-phase risk notes

### Project-Level Decisions
- `.planning/PROJECT.md` — Key Decisions table (OVH override rationale, near-zero budget constraint, SIRET/business-registration tracking) and open Context/Constraints notes
- `.planning/REQUIREMENTS.md` — I18N-01, I18N-02 (this phase's mapped requirements) and full v1/v2 requirement traceability
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and dependency ordering
- `CLAUDE.md` (repo root) — distilled technology-stack recommendation, including the i18n config recommendation (`prefixDefaultLocale: false`) this phase's D-01 follows, and the OVH/Sharp/Cloudflare incompatibility notes

</canonical_refs>

<code_context>
## Existing Code Insights

This is a greenfield project — no application code exists yet (repo currently contains only `.planning/`, `.claude/`, and `CLAUDE.md`). Nothing to scout for reusable assets or established patterns; Phase 1 establishes the first patterns other phases will follow.

</code_context>

<specifics>
## Specific Ideas

- Staging preview should live at a subdomain of the real domain (not a throwaway OVH URL) so it's easy to point Romane to for review during later phases.
- The site-wide settings content type should be treated as durable infrastructure, not scaffolding to be thrown away — Phase 2/3 nav and footer content should come from it.

</specifics>

<deferred>
## Deferred Ideas

- Whether the locale-preference cookie is "essential" or needs disclosure in the CNIL cookie-consent banner — belongs to Phase 4 (Legal & Compliance), noted as a flag in D-03 above, not resolved here.

### Reviewed Todos (not folded)
None — no pending todos existed to review (`todo_count: 0`).

</deferred>

---

*Phase: 1-Foundation & Bilingual Infrastructure*
*Context gathered: 2026-07-05*
