---
phase: quick-260720-dzo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - CLAUDE.md
  - AGENTS.md
  - .planning/research/STACK.md
  - README.md
autonomous: true
requirements: [260720-dzo]

must_haves:
  truths:
    - "The `## Technology Stack` section in both CLAUDE.md and AGENTS.md describes the actually-implemented stack — static Astro (`output: 'static'`, no SSR adapter), GitHub Pages (staging) + OVH Web Hosting (production, Phase 5), Sanity as a build-time-fetched CMS — NOT the retired Cloudflare Pages / @astrojs/cloudflare / Stripe-in-Workers plan"
    - ".planning/research/STACK.md (the regeneration SOURCE named in the GSD:stack marker) reflects the same corrected stack, so a future `/gsd-docs-update` regen re-injects accurate content instead of re-introducing the stale Cloudflare/Stripe tables"
    - "The corrected docs clearly mark e-commerce (Stripe checkout, server-side stock tracking, EU shipping/VAT) as DEFERRED to the v1.x milestone and NOT present in the current codebase"
    - "A developer can read a root README.md to install deps, run the dev server, learn every required env var NAME, and understand how src/ (the Astro site) relates to the separate sanity/ Studio subproject"
    - "The GSD content markers and the 'managed by generate-*-profile — do not edit manually' Developer Profile section in CLAUDE.md/AGENTS.md are left intact"
  artifacts:
    - CLAUDE.md
    - AGENTS.md
    - .planning/research/STACK.md
    - README.md
  key_links:
    - "All corrected stack prose in CLAUDE.md/AGENTS.md stays strictly inside the `<!-- GSD:stack-start source:research/STACK.md -->` … `<!-- GSD:stack-end -->` markers; the corrected STACK.md body matches what a regen injects between them, preventing future drift"
    - "README.md env-var list matches the names actually read by src/ + astro.config.mjs (SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_READ_TOKEN, PUBLIC_WEB3FORMS_ACCESS_KEY, optional SITE_URL/ASTRO_BASE)"
    - "README.md points to sanity/README.md (French editor guide), CLAUDE.md, and .planning/PROJECT.md rather than duplicating them"
---

<objective>
Fix the stale "Technology Stack" documentation and add a developer README. Three doc surfaces currently misdescribe the architecture, and there is no root developer quick-reference. All facts below are confirmed by a completed read-only quality audit and a prior planning pass — do NOT re-derive, implement directly.

1. **Stale stack section (CLAUDE.md + AGENTS.md).** Both files carry a byte-identical `## Technology Stack` block, bounded by `<!-- GSD:stack-start source:research/STACK.md -->` … `<!-- GSD:stack-end -->`, that still documents the ORIGINAL research plan: Cloudflare Pages hosting, the @astrojs/cloudflare adapter, the Cloudflare Workers CLI, Stripe Checkout + Stripe-in-Workers webhook patterns, and Cloudflare cost/bandwidth tables. None of that is implemented. The real architecture (astro.config.mjs + .github/workflows/deploy.yml + package.json) is a static Astro build with NO SSR adapter, deployed to GitHub Pages (staging) and OVH (production, Phase 5), with Sanity content fetched at build time and NO Stripe/e-commerce yet.
2. **Regeneration source (.planning/research/STACK.md).** The GSD:stack marker names `research/STACK.md` as the generation source. If only CLAUDE.md/AGENTS.md are fixed, a future docs regen re-injects the stale content. So STACK.md's body must be corrected to the same implemented stack. (PROJECT.md needs NO change — it already records the OVH-over-Cloudflare override in its Key Decisions table and has no stale stack tables.)
3. **Missing README.md.** No root README exists. Add a concise developer quick-reference: dev setup, required env var NAMES, and how src/ relates to the separate sanity/ Studio subproject (pointing to the existing sanity/README.md, which is a French editor guide for Romane — do not duplicate it).

Purpose: Make the project's canonical docs match the shipped architecture so contributors (human and agent) stop reading a retired plan, and give a new developer a working entry point.
Output: Corrected `## Technology Stack` region in CLAUDE.md and AGENTS.md, corrected `.planning/research/STACK.md`, and a new root `README.md`.

Confirmed facts (reuse, do NOT re-derive):
- astro.config.mjs: `output: 'static'`, no SSR adapter (explicitly excludes @astrojs/cloudflare / @astrojs/node); i18n `defaultLocale: 'fr'` at root, `'en'` under /en/, no Accept-Language auto-redirect; `site` = `SITE_URL` or `https://florianlepont.github.io`; `base` = `ASTRO_BASE` or `/` (set `/ajs-website/` for GitHub Pages staging).
- .github/workflows/deploy.yml (as it exists TODAY): Node 22 → `npm ci` → build (root base, test artifact) → Playwright e2e + Vitest unit as a BLOCKING gate → rebuild with GitHub Pages base → un-prefixed-link grep guard → deploy to GitHub Pages. Triggered on push to `main` and on `repository_dispatch (sanity-content-published)` from a Sanity publish webhook. Production OVH cutover is a separate Phase 5.
- Root package.json: deps = @fontsource/unbounded ^5.2.8, @sanity/client 7.23.0, @sanity/image-url 2.1.1, astro 7.0.6; devDeps = @playwright/test 1.61.1, vitest 4.1.9; scripts = dev/build/preview/astro/test:unit(vitest run)/test:e2e(playwright test). NO stripe, @astrojs/react, @astrojs/cloudflare, wrangler, or sharp as direct deps.
- sanity/ subproject (own package.json): `sanity` ^6.4.0 Studio, React 19, scripts dev(sanity dev)/build/deploy/start; Studio runs on localhost:3333; has its own sanity/README.md (French editor guide) and its own SANITY_STUDIO_PREVIEW_URL.
- Env vars read by src/ + config (grep-confirmed): SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_READ_TOKEN (all build-time content fetch), PUBLIC_WEB3FORMS_ACCESS_KEY (contact form — unprovisioned/deferred to Phase 5 OVH cutover, form non-functional until then), plus optional build-time SITE_URL and ASTRO_BASE.

Scope guardrails (from task constraints):
- Only edit CLAUDE.md/AGENTS.md WITHIN the `<!-- GSD:stack-start -->` … `<!-- GSD:stack-end -->` region. Do NOT touch any other GSD-marked section, and specifically do NOT touch the "Developer Profile" section (marked "managed by generate-*-profile — do not edit manually").
- Do NOT touch package.json, tsconfig.json, .github/workflows/deploy.yml, vitest.config.ts, or any ESLint config — the parallel quick task 260720-dzi owns CI/tooling changes. Describe CI accurately based on deploy.yml as it exists TODAY (build + Playwright e2e + Vitest unit). Do NOT predict or reference the not-yet-merged typecheck/lint/coverage steps that task may add.
- Do NOT touch HomeCarousel.astro or src/lib — another parallel quick task owns those.
- Keep the corrected stack section a useful reference doc at the same table/section granularity as today — not a one-line stub.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Files this plan edits:
@CLAUDE.md
@AGENTS.md
@.planning/research/STACK.md

# Ground-truth architecture (read-only reference — do NOT edit these here):
@astro.config.mjs
@.github/workflows/deploy.yml
@package.json
@sanity/package.json
@sanity/README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace the stale Technology Stack content in CLAUDE.md, AGENTS.md, and the research/STACK.md source</name>
  <files>CLAUDE.md, AGENTS.md, .planning/research/STACK.md</files>
  <action>
Draft ONE corrected "Technology Stack" body describing the actually-implemented architecture, then apply it to all three files so the two consumer docs and their regeneration source stay in sync. Write directive reference prose with real tables at the same level of detail as the current section — a useful reference, not a stub.

Corrected content to author (use the confirmed facts in the objective; cite versions from package.json):

- **Core Technologies** table (Technology | Version | Purpose | Notes):
  - Astro 7.0.6 — static site framework, `output: 'static'` with NO server-rendering integration installed (the config explicitly excludes the Cloudflare adapter, the Node adapter, and the Workers deploy CLI, because OVH Web Hosting is a zero-compute Apache file host). Zero-JS-by-default; built-in i18n.
  - GitHub Pages — staging host (current public site), deployed by GitHub Actions; project-page base path `/ajs-website/` injected via `ASTRO_BASE` at build; live at https://florianlepont.github.io/ajs-website/.
  - OVH Web Hosting — production host (Phase 5, not yet cut over); Free tier, static files uploaded over SFTP; ultimately serves the real domain atelierjacquelinesuzanne.fr; zero request-time compute, which is WHY the build is static-only.
  - Sanity (Content Lake + Studio) — headless CMS for galleries, About, site settings, agenda; content fetched at BUILD time (published perspective only) via @sanity/client 7.23.0; Studio is the separate sanity/ subproject (`sanity` ^6.4.0).
  - astro:i18n (built-in, Astro 7 core) — fr/en locale routing, French at root, English under /en/, no Accept-Language auto-redirect.
- **Supporting Libraries** table: @sanity/client 7.23.0 (build-time GROQ fetch), @sanity/image-url 2.1.1 (build transformed Sanity image URLs), @fontsource/unbounded ^5.2.8 (self-hosted brand display font).
- **Development & CI Tools** table: Vitest 4.1.9 (unit tests — `npm run test:unit`), Playwright 1.61.1 (e2e — `npm run test:e2e`), GitHub Actions (Node 22 pipeline: `npm ci` → build root-base test artifact → Playwright e2e + Vitest unit as a BLOCKING gate → rebuild with GitHub Pages base → un-prefixed-link grep guard → deploy to GitHub Pages; triggered on push to `main` and on a `repository_dispatch` fired by a Sanity publish webhook), Sanity CLI (Studio dev/build/deploy in sanity/), TypeScript (strict tsconfig; Astro ships TS support). Describe CI ONLY as it exists in deploy.yml today — do not mention typecheck/lint/coverage steps.
- **Deferred to v1.x (not yet implemented)** section: e-commerce — Stripe Checkout, server-side stock tracking (stockQuantity/soldOut on Sanity product docs), EU/France shipping + VAT, commerce legal (CGV). State plainly that NONE of this is installed in the current codebase; the "browse and buy / checkout" language in the Project section describes the v1.x milestone GOAL, not shipped v1 behavior. Note that when commerce ships it will need a request-time compute surface, which the current static-only OVH/GitHub Pages hosting cannot provide — so the hosting/adapter decision is deferred to that milestone.
- **What NOT to Use (still valid)** section: SaaS site builders (Shopify/Squarespace/Wix/Myportfolio/Format — recurring monthly fees violate the near-zero-budget constraint; this project replaces exactly such a site); WordPress + WooCommerce (needs a persistent PHP/MySQL host, not free-tier-friendly); a separate product/order database for stock (when commerce ships, store stock on the Sanity product document instead).
- **Cost (against the ~0-5€/month target)** section: GitHub Pages staging 0€; OVH production already owned (existing domain hosting, no new recurring cost); Sanity free tier 0€; domain atelierjacquelinesuzanne.fr already owned; Stripe fees apply only once v1.x commerce ships (per-transaction, no monthly platform fee).

Apply it:
1. **CLAUDE.md** — replace everything BETWEEN `<!-- GSD:stack-start source:research/STACK.md -->` and `<!-- GSD:stack-end -->` (keep both marker lines exactly, and keep the leading `## Technology Stack` heading) with the corrected body. Touch nothing outside these markers — the Developer Profile "do not edit manually" section and all other GSD sections stay byte-for-byte unchanged.
2. **AGENTS.md** — apply the identical replacement inside its own `<!-- GSD:stack-start -->` … `<!-- GSD:stack-end -->` markers (this file's other sections legitimately say "generate-codex-profile" / ".Codex/skills/" — do not "fix" those; they are the Codex mirror).
3. **.planning/research/STACK.md** — replace the body from the `## Recommended Stack` heading through the end of the `## Cost Implications` table with the corrected content above (so a regen injects accurate tables). Keep the top `# Stack Research` header and its metadata lines, but add a short blockquote note directly under them: "Status (updated 2026-07-20): the implemented architecture diverged from the original research below — static Astro on GitHub Pages (staging) / OVH (production), no SSR adapter, and e-commerce deferred to v1.x. See PROJECT.md Key Decisions and STATE.md Phase 01 decisions." The `## Sources` section may remain as historical research provenance, but precede it with one line noting several sources informed the original (since-revised) Cloudflare/Stripe plan.

Remove the retired Cloudflare-hosting justification prose (the uncapped-bandwidth pitch) and the entire Stripe-in-Workers webhook block (the async Web-Crypto signature-verification pattern and the Snipcart/Stripe-Tax alternatives) — they describe software that is not installed. Do not merely append; the stale tables must be replaced.
  </action>
  <verify>
    <automated>for f in CLAUDE.md AGENTS.md .planning/research/STACK.md; do grep -q 'GitHub Pages' "$f" && grep -q 'OVH' "$f" && ! grep -q 'constructEventAsync' "$f" && ! grep -qi 'no bandwidth cap' "$f" || { echo "FAIL: $f"; exit 1; }; done; grep -q 'GSD:stack-start' CLAUDE.md && grep -q 'GSD:stack-end' CLAUDE.md && grep -q 'GSD:stack-start' AGENTS.md && grep -q 'GSD:stack-end' AGENTS.md && grep -q 'do not edit manually' CLAUDE.md && echo "PASS: stack docs corrected, markers + profile intact"</automated>
  </verify>
  <done>CLAUDE.md, AGENTS.md, and .planning/research/STACK.md all describe the static Astro + GitHub Pages/OVH + Sanity stack with e-commerce marked deferred to v1.x; the retired Cloudflare-hosting and Stripe-in-Workers blocks are gone; GSD:stack markers and the Developer Profile "do not edit manually" section are intact; edits in CLAUDE.md/AGENTS.md stayed inside the stack markers.</done>
</task>

<task type="auto">
  <name>Task 2: Add a root README.md developer quick-reference</name>
  <files>README.md</files>
  <action>
Create a new `README.md` at the repo root — a concise developer quick-reference (NOT a full project doc; PROJECT.md and CLAUDE.md hold the deep context). Distinct from sanity/README.md, which is the French content-editor guide for Romane — point to it, do not duplicate it. Document env var NAMES and purposes only — NEVER real values, tokens, or keys.

Include these sections:
- **Title + one-line summary**: "Atelier Jacqueline Suzanne — website. Bilingual (fr/en) static Astro site with a Sanity CMS, for Romane Lepont's photography." Add a line pointing to `.planning/PROJECT.md` and `CLAUDE.md` for full project context/decisions.
- **Stack (one line)**: Astro 7 static output (no SSR adapter), content from Sanity fetched at build time, bilingual fr/en. Deployed to GitHub Pages (staging) and OVH (production, Phase 5).
- **Repo layout**: `src/` = the Astro site (pages, components, layouts, lib helpers); `sanity/` = a SEPARATE Sanity Studio subproject with its OWN package.json / node_modules / scripts — see `sanity/README.md` (French editor guide) for Studio and content-editing docs; `.planning/` = GSD planning artifacts (roadmap, phases, state).
- **Prerequisites**: Node 22 (matches CI).
- **Setup**: `npm install`, then copy `.env.example` to `.env` and fill the required vars.
- **Environment variables** table (Name | Required? | Purpose) — names only:
  - `SANITY_PROJECT_ID` — required (build) — Sanity project id for build-time content fetch.
  - `SANITY_DATASET` — required (build) — Sanity dataset name (e.g. production).
  - `SANITY_API_READ_TOKEN` — required (build) — Sanity read token used at build time.
  - `PUBLIC_WEB3FORMS_ACCESS_KEY` — contact form — currently unprovisioned / deferred to the Phase 5 OVH cutover; the contact form is non-functional until it is set.
  - `SITE_URL` — optional (build) — canonical site origin; defaults to https://florianlepont.github.io.
  - `ASTRO_BASE` — optional (build) — base path; defaults to `/`; set `/ajs-website/` for the GitHub Pages staging build.
  - Note: the `sanity/` Studio has its own env (`SANITY_STUDIO_PREVIEW_URL`) documented in `sanity/README.md`.
- **Scripts** (root, from package.json today): `npm run dev` (astro dev), `npm run build` (astro build), `npm run preview`, `npm run test:unit` (Vitest), `npm run test:e2e` (Playwright). Describe only these current scripts.
- **Sanity Studio**: run it from the subproject — `cd sanity && npm install && npm run dev` (Studio on http://localhost:3333); see `sanity/README.md` for the editor workflow.
- **Deployment (brief)**: push to `main` → GitHub Actions builds, runs Playwright + Vitest as a blocking gate, and deploys to GitHub Pages; a Sanity publish fires a webhook that triggers a rebuild. Production cutover to OVH (the real domain) is Phase 5.

Keep it tight and skimmable. Do NOT invent scripts, env vars, or CI steps beyond those listed above (in particular, do not reference the not-yet-merged typecheck/lint/coverage tooling owned by the parallel 260720-dzi task).
  </action>
  <verify>
    <automated>test -f README.md && grep -q 'SANITY_PROJECT_ID' README.md && grep -q 'PUBLIC_WEB3FORMS_ACCESS_KEY' README.md && grep -q 'npm run dev' README.md && grep -q 'sanity/README.md' README.md && grep -q 'GitHub Pages' README.md && echo "PASS: README present with env vars, scripts, and cross-links"</automated>
  </verify>
  <done>Root README.md exists as a concise developer quick-reference covering setup (npm install + .env), all required env var NAMES (no values), current npm scripts, the src/ ↔ sanity/ relationship (pointing to sanity/README.md), a brief deploy summary, and pointers to CLAUDE.md / .planning/PROJECT.md.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| repo docs → readers (human + agent) | Documentation-only edits. No runtime code, dependency, network endpoint, user input, or production surface is touched. The only sensitive concern is that a doc could inadvertently commit a secret value. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-dzo-01 | Information Disclosure | README.md env-var documentation | low | mitigate | Document env var NAMES and purposes ONLY — never paste a real value, token, or key. `.env` stays gitignored; `.env.example` (names/placeholders only) remains the single template. Verify no secret-shaped strings land in README.md at review. |
| T-dzo-02 | Tampering | CLAUDE.md / AGENTS.md GSD markers + "do not edit manually" profile section | low | mitigate | Edit strictly inside the `GSD:stack-start`…`GSD:stack-end` markers; leave the Developer Profile section and all other GSD-marked sections byte-for-byte unchanged. Task 1 verify asserts both markers and the "do not edit manually" line still exist. |

No package-manager installs occur in this plan, so no supply-chain (T-dzo-SC) legitimacy checkpoint is required.
</threat_model>

<verification>
- `grep -q 'GitHub Pages'` and `grep -q 'OVH'` succeed in CLAUDE.md, AGENTS.md, and .planning/research/STACK.md.
- `grep 'constructEventAsync'` and `grep -i 'no bandwidth cap'` return nothing in those three files (the Stripe-in-Workers and Cloudflare-hosting stale blocks are gone).
- `GSD:stack-start` / `GSD:stack-end` markers still present in CLAUDE.md and AGENTS.md; the "do not edit manually" Developer Profile line still present.
- README.md exists and contains SANITY_PROJECT_ID, PUBLIC_WEB3FORMS_ACCESS_KEY, `npm run dev`, `sanity/README.md`, and `GitHub Pages`.
- `git diff` touches only CLAUDE.md, AGENTS.md, .planning/research/STACK.md, and README.md — no package.json/deploy.yml/tooling/src changes (respecting the parallel tasks' ownership).
</verification>

<success_criteria>
- CLAUDE.md and AGENTS.md "Technology Stack" sections describe the real static-Astro + GitHub Pages/OVH + Sanity architecture, with e-commerce clearly marked deferred to v1.x; edits confined to the GSD:stack region.
- .planning/research/STACK.md carries the same corrected stack (plus a status note) so a future docs regen won't reintroduce the Cloudflare/Stripe content.
- A new root README.md gives a working developer entry point: setup, required env var NAMES (values never shown), current scripts, the src/ ↔ sanity/ relationship, deploy summary, and pointers to CLAUDE.md / PROJECT.md / sanity/README.md.
- No changes outside the four target doc files; no tooling/CI/source files touched.
</success_criteria>

<output>
Create `.planning/quick/260720-dzo-fix-the-stale-claude-md-agents-md-techno/260720-dzo-SUMMARY.md` when done.
</output>
