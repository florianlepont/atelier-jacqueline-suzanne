---
phase: quick-261004-kbq
plan: 01
subsystem: legal-pages
tags: [sanity, legal, privacy, lcen, gdpr, confidentiality]
requires: []
provides:
  - optional Studio field siteSettings.publisherAddress wired to the build
  - buildLegalNoticeModel (exactly one publisher notice per locale)
  - truthful privacy policy section about the Sanity image CDN
affects: [mentions-legales FR/EN, confidentialite FR/EN, siteSettings schema]
key-files:
  created:
    - sanity/schemas/__tests__/siteSettings.test.ts
    - tests/unit/privacy-pages.test.ts
  modified:
    - sanity/schemas/siteSettings.ts
    - sanity/README.md
    - src/lib/sanity.ts
    - src/lib/sanity-validation.ts
    - src/lib/page-models.ts
    - src/pages/mentions-legales.astro
    - src/pages/en/mentions-legales.astro
    - src/pages/confidentialite.astro
    - src/pages/en/confidentialite.astro
    - tests/e2e/legal.spec.ts
    - tests/unit/page-models.test.ts
    - tests/unit/sanity-singletons.test.ts
    - tests/unit/sanity-validation.test.ts
    - .planning/STATE.md (redaction of one row only)
    - .planning/quick/260826-r78-update-src-pages-mentions-legales-astro-/260826-r78-PLAN.md (redaction)
    - .planning/quick/260826-r78-update-src-pages-mentions-legales-astro-/260826-r78-SUMMARY.md (redaction)
decisions:
  - "Anonymity regime cited as LCEN article 1-1, II (current numbering), not the pre-2024 numbering from the brief."
  - "Contact-form 'no third party' statements are true (contact.php through OVH mail()) and were scoped to the form, not removed."
status: complete
---

# Quick 261004-kbq: publisher address out of the public repo, truthful privacy policy

**One-liner:** the OVH account holder's postal address is gone from every tracked file; an optional, empty-by-default Studio field `publisherAddress` now drives a single publisher notice (anonymity wording or address) on the FR/EN mentions légales, and both privacy pages now disclose that images come from Sanity's CDN.

## LEGAL REVIEW STATEMENT

**The legal texts (mentions légales and politique de confidentialité, FR and EN) have received NO legal review.** No compliance claim is made. They are developer drafts based on public sources (Legifrance for the LCEN numbering, OVH's own legal page).

## Commits

| Task | Commit | Subject |
|------|--------|---------|
| 1 | 26a489c | feat(quick-261004-kbq): optional publisher address field on siteSettings, wired to the build model |
| 2 | 5ddfd7b | fix(quick-261004-kbq): legal notice reads the publisher address from Sanity, former personal address purged from the repo |
| 3 | 598c395 | fix(quick-261004-kbq): privacy policy discloses the Sanity image CDN instead of denying third-party transfers |

This SUMMARY, STATE.md and PLAN.md are committed by the orchestrator, not by these three commits (the STATE.md row for this task is added by the orchestrator; only the single address row was edited here, as a redaction).

## What changed

**Task 1 (B-1).** `siteSettings` gets one optional field `publisherAddress` (type `text`, 3 rows, not localized, new group `legal` titled « Mentions légales », no required rule, no initial value, `.max(300)` via the constant `PUBLISHER_ADDRESS_MAX_LENGTH`, custom rule rejecting `<` and `>`, French description carrying the legal rule and the warning to Florian). `SITE_SETTINGS_QUERY` projects it, `SiteSettings.publisherAddress?: string` carries it, and `sanitizeSiteSettings` returns it only when clean (CRLF normalised, lines trimmed, blank lines dropped, at most 300 chars, no `<`/`>`, no control characters, checked with a char-code loop). A rejected value is dropped and recorded as the code-only issue `publisherAddress.invalid_removed`; empty/null/whitespace is silently absent. A root test keeps the 300 cap identical in the Studio schema and the sanitizer. `sanity/README.md` documents the field for Romane.

**Task 2 (B-2, B-4).** `buildLegalNoticeModel({siteSettings, locale})` returns a discriminated union (`address` with lead + lines, or `anonymity` with text) plus `hostedByNote` (Florian Lepont named as OVH account holder, no address, no digit). Both mentions-légales pages render only that model: one conditional paragraph (lines joined with `<br />` via Astro fragments, no `set:html`) and the host sentence; every other section, the CSS and the empty-case anonymity text are unchanged byte for byte. Frontmatter comments rewritten to match. The former address was replaced by the token `[adresse retirée du dépôt public]` in the three planning docs that quoted it. Two content-agnostic e2e tests were added.

**Task 3 (B-3).** Both privacy pages: intro now names Sanity; the contact-form recipient line is scoped to the form; the former « Contenu du site (Sanity) » section is replaced by « Images du site (Sanity) » (three paragraphs: build-time CMS use without visitor data; images served by Sanity's CDN, a third party that receives the IP address and request data; purpose, legitimate interest Art. 6(1)(f) GDPR, no advertising cookie or tracker set by this site). Hosting logs, cookie, rights and CNIL content kept. New `tests/unit/privacy-pages.test.ts` enforces FR/EN structure parity and the disclosure; e2e assertions added.

## Status per plan item

| Item | Status | Evidence |
|------|--------|----------|
| B-1 Studio field and wiring | done + verified | `vitest run` of sanity-validation, sanity-singletons, statement-length-limit, publishing-docs: 59 passed; `npm --prefix sanity test`: 52 passed; sanity lint and typecheck clean |
| B-2 mentions légales FR/EN driven by the model | done + verified (empty case); filled case unit-tested only | page-models tests (48 with e2e-content-fragility) passed; built `dist` contains exactly one `ne sont pas publiés` notice and `Florian Lepont` in FR and EN; the filled branch was NOT rendered in a real build (no address is published in Sanity and none was written), only covered by model unit tests and `astro check` |
| B-3 privacy policy | done + verified | privacy-pages + e2e-content-fragility: 11 passed; `dist/confidentialite` and `dist/en/confidentialite` contain `CDN` |
| B-4 purge of the old address | done + verified | bracketed `git grep` (`Saint[-]Martin`, `Ville[n]euve`, `9429[0]`, `[7] rue`): 0 hits in tracked files; `grep -r` on `dist/` after a successful build: empty. The old address is still in git history (see open points) |
| B-5 SUMMARY statements | done | this file |
| B-6 confidentiality | done | fixtures are `TEST-ADDRESS-FIXTURE` only; no address in code, tests, docs, commit messages or this SUMMARY; no env dump |
| B-7 verification and commit rules | done | three commits, explicit paths staged, single Claude-Session trailer, no model name; `git diff --name-only origin/main..HEAD` touches only plan files (plus the plan/summary directory), nothing under `.claude/.codex/.agents/.github`, no package.json or lockfile change |

## Verification outcomes (real results)

- Root `npm run lint`: 0 errors, 0 warnings.
- Root `npm run typecheck` (astro check): 0 errors, 0 warnings, 3 hints (pre-existing).
- Root `npm run test:coverage`: passed; statements 98.84%, branches 90.55%, functions 100%, lines 99.49% (floor 80/75/80/80).
- `npm --prefix sanity run lint`, `typecheck`, `test`, `test:coverage`: all passed (coverage: statements 95.76%, branches 81.28%; per-file TSX gate passed).
- `npm run build` (real content, `SANITY_API_READ_TOKEN` unset): succeeded after Task 2 and after Task 3, 31 pages; no `publisherAddress.invalid_removed` warning in the build log.
- `npm run test:artifact`: "Static artifact verified (31 HTML files, base /)" after both builds.
- Playwright e2e: `npx playwright install chromium` succeeded (browser stored outside the repo, under `/opt/pw-browsers`). `npx playwright test tests/e2e/legal.spec.ts --project=chromium` against the fresh build via `astro preview`: **17 passed**. Only `legal.spec.ts` on chromium was run; the rest of the e2e suite and the `webkit-mobile` project were **NOT run**. The preview server was stopped afterwards.
- NOT run: full e2e suite, webkit project, any Sanity write, Studio deploy, GitHub workflow, push or PR.

## Open legal points

- (a) The non-professional anonymity regime ends once prints, originals, books or merch are sold; at that point the `publisherAddress` field must be filled in Studio and the whole page revisited (phone number, status, CGV).
- (b) The hosting account is in Florian's name: whether Romane's identity was communicated to the host (a condition of the anonymity regime) is **unverified**.
- (c) Whether the host's phone number must appear on the page is **unverified** (OVH's own legal page publishes none).
- (d) The « Statut » section and the « à titre non professionnel » publisher line still say non-professional even when the address is filled; kept as-is per the brief, to be revisited with the Shop/Checkout milestone.
- (e) The former address remains in git history, forks and earlier PRs (no history rewrite per the brief); a separate history-purge decision belongs to the owner.
- No legal review of any of the texts (see statement above).
- Sanity's own handling of CDN request data (retention, location, controller/processor role) is deliberately not described; the policy tells visitors to consult Sanity's own privacy policy.

## Deviations from the brief

1. **LCEN numbering.** The brief said "art. 6-III-2", the pre-2024 numbering. Legifrance shows the current text as Article 1-1, II (effective 2024-05-23), which the pages already cited; kept "article 1-1, II" everywhere.
2. **Contact-form statements.** The "no third-party processor" statements about the contact form are true (public/contact.php sends through OVH `mail()`), so they were scoped to the form instead of removed; the false page-level claims (intro "only data" wording and the Sanity section) were rewritten.

No other deviation: plan executed as written. Fix attempts: none needed.

## Owner actions

- Production keeps serving the old pages, old address included, until the next `deploy-ovh.yml` run (a push or merge to `main` never deploys). **Trigger a manual dispatch of `deploy-ovh.yml` (or publish in Studio) right after merging.**
- Leave the Studio field « Adresse de l'éditrice » empty until Romane starts selling.
- Decide separately whether to purge the former address from git history.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model (the published `publisherAddress` is readable through the public Sanity dataset API, accepted as T-kbq-07).

## Self-Check: PASSED

- Commits 26a489c, 5ddfd7b, 598c395 exist on `claude/kind-cannon-2myct1`.
- Created files exist: `sanity/schemas/__tests__/siteSettings.test.ts`, `tests/unit/privacy-pages.test.ts`.
- `git status` shows only the untracked quick-task directory (plan + this SUMMARY), no stray files.
