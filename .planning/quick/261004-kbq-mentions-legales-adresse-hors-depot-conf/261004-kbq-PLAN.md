---
phase: quick-261004-kbq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/schemas/siteSettings.ts
  - sanity/schemas/__tests__/siteSettings.test.ts
  - sanity/README.md
  - src/lib/sanity.ts
  - src/lib/sanity-validation.ts
  - tests/unit/sanity-validation.test.ts
  - tests/unit/sanity-singletons.test.ts
  - src/lib/page-models.ts
  - tests/unit/page-models.test.ts
  - src/pages/mentions-legales.astro
  - src/pages/en/mentions-legales.astro
  - src/pages/confidentialite.astro
  - src/pages/en/confidentialite.astro
  - tests/unit/privacy-pages.test.ts
  - tests/e2e/legal.spec.ts
  - .planning/STATE.md
  - .planning/quick/260826-r78-update-src-pages-mentions-legales-astro-/260826-r78-PLAN.md
  - .planning/quick/260826-r78-update-src-pages-mentions-legales-astro-/260826-r78-SUMMARY.md
autonomous: true
requirements: [LEGAL-01, LEGAL-03]

must_haves:
  truths:
    - "The Studio document `siteSettings` has ONE new optional field `publisherAddress` (type `text`, 3 rows, plain text, NOT localized, in a new group `legal` titled « Mentions légales »). It has no required rule, a 300-character cap enforced with `.max(...)`, a custom rule that rejects `<` and `>`, and a French description that explains the legal rule: leave EMPTY while the site is non-professional (the legal page then shows the LCEN anonymity wording), fill it in when Romane starts selling (a professional editor must publish name, address and phone), type the address without « domiciliée au », plain text, 300 characters max, and warn Florian because phone/status/CGV are not managed by this field."
    - "The build-time fetch projects `publisherAddress` in `SITE_SETTINGS_QUERY`; `SiteSettings` has `publisherAddress?: string`; `sanitizeSiteSettings` returns it only when it is a clean non-empty string (CRLF normalised, every line trimmed, blank lines dropped, at most 300 characters, no `<`/`>`, no control characters). A rejected value is dropped (page falls back to the anonymity wording) and recorded as the code-only issue `publisherAddress.invalid_removed`; an empty, null or whitespace-only value is silently absent. The address text never appears in an issue, a warning or a log line."
    - "`buildLegalNoticeModel({siteSettings, locale})` in src/lib/page-models.ts returns exactly one variable publisher notice: `{kind: 'address', lead, lines}` when an address is present, otherwise `{kind: 'anonymity', text}`, plus `hostedByNote`, the host sentence naming Florian Lepont as OVH account holder with NO address in either locale. Both pages render only that one notice, so the anonymity paragraph and the address paragraph can never appear together or both be missing."
    - "FR and EN mentions légales: filled case renders « Éditrice du site : Romane Lepont, domiciliée au <address> » / « Site publisher: Romane Lepont, residing at <address> » with line breaks rendered as `<br>` (Astro text escaping, never `set:html`) and the anonymity paragraph omitted; empty case keeps today's anonymity paragraph byte-for-byte; every other section (publication director, e-mail, OVH hosting block, Statut) is unchanged."
    - "The privacy policy pages (FR and EN, identical structure: 5 chunks when split on `<h2>`) no longer claim that no data reaches Sanity or that the site's data is limited to form/hosting/cookie. They state that images are served by the CDN of Sanity, a third-party company, that the visitor's browser sends the request directly and the provider therefore receives the IP address and technical request data, legal basis legitimate interest (Art. 6(1)(f) GDPR), and that this site sets no advertising cookie or tracker in doing so. Contact form, OVH hosting logs, `ajs_locale` cookie, GDPR rights and CNIL content stay."
    - "No git-tracked file contains the former postal address of the OVH account holder (checked by the bracketed-pattern `git grep` in the verification section). The three docs that quoted it carry the token `[adresse retirée du dépôt public]` instead. No real postal address appears anywhere in the repo, tests, fixtures, docs, commit messages or this plan; tests use only `TEST-ADDRESS-FIXTURE`-style strings."
  artifacts:
    - sanity/schemas/siteSettings.ts                    # + PUBLISHER_ADDRESS_MAX_LENGTH, group `legal`, field `publisherAddress`
    - sanity/schemas/__tests__/siteSettings.test.ts     # new: field shape, optional, cap, `<`/`>` rule, description content
    - src/lib/sanity.ts                                  # SiteSettings.publisherAddress, GROQ projection
    - src/lib/sanity-validation.ts                       # PUBLISHER_ADDRESS_MAX_LENGTH export, cleaning/rejection, code-only issue
    - src/lib/page-models.ts                             # LegalPublisherNotice, LegalNoticeModel, buildLegalNoticeModel
    - src/pages/mentions-legales.astro                   # + src/pages/en/mentions-legales.astro, driven by the model
    - src/pages/confidentialite.astro                    # + src/pages/en/confidentialite.astro, honest Sanity CDN section
    - tests/unit/privacy-pages.test.ts                   # new: false claims gone, CDN disclosure present, FR/EN structure parity
  key_links:
    - "PUBLISHER_ADDRESS_MAX_LENGTH is declared (plain assignment, same identifier, value 300) in BOTH sanity/schemas/siteSettings.ts and src/lib/sanity-validation.ts because the two npm projects cannot import each other; a root unit test reads both source files and fails if they diverge."
    - "sanity/schemas/siteSettings.ts MUST NOT contain the max-length option key used by the localeField helper, even in a comment: tests/unit/statement-length-limit.test.ts requires zero such occurrences in this file. The cap is expressed with the constant plus `.max(...)` only."
    - "src/lib/sanity.ts GROQ projection <-> sanitizeSiteSettings <-> SiteSettings type <-> buildLegalNoticeModel: the field name `publisherAddress` is spelled identically in all four; the singleton contract test and the model tests exercise the chain."
    - "The legal pages import `getSiteSettings` from src/lib/sanity.ts (cached per build by getBuildCached) and `buildLegalNoticeModel` from src/lib/page-models.ts; BaseLayout already fetches the same document, so no extra network request is added."
    - "Warning/diagnostic path: warnForSanityIssues logs documentType, id, slug and reason codes only. The new issue code carries no value, so the address cannot reach public CI logs."
---

<objective>
Take the publisher's postal address out of the public repository and make it a value the owner types in Sanity Studio, and make the privacy policy truthful about Sanity.

Purpose: the repo is PUBLIC and the mentions-légales pages currently publish the OVH account holder's personal home address in source (and the same address is quoted in three planning docs). The site is non-professional today, so the legal page should keep the LCEN anonymity wording and publish NO address; the day Romane starts selling she becomes a professional editor and must publish her own name, address and phone. That address must therefore be an optional Studio field (empty by default) instead of a string in code. Separately, the privacy policy claims no visitor data ever reaches Sanity and no third party is involved, which is false: every photograph is loaded by the visitor's browser from the Sanity image CDN.

Output: an optional `publisherAddress` field wired from Studio to the page model (unit-tested), FR/EN legal pages driven by that model, a rewritten Sanity section in both privacy pages with tests, and the old address redacted from every tracked file. Three atomic commits on the current branch `claude/kind-cannon-2myct1`, then a SUMMARY.

Brief items (traceability labels used in the tasks): B-1 Sanity field and wiring; B-2 mentions légales FR/EN; B-3 privacy policy; B-4 redaction of the three planning docs and purge of the old address; B-5 SUMMARY statements (no legal review, open legal points); B-6 confidentiality rules; B-7 verification and commit rules.

Hard rules for execution (B-6, B-7):
- NEVER write a real postal address anywhere: not in code, tests, fixtures, docs, comments, commit messages, the SUMMARY or terminal notes that end up in a file. Fixtures are `TEST-ADDRESS-FIXTURE`-style strings only. Do not quote the old address in any new text, including this repo's commit messages.
- NEVER print environment variables or tokens (no bare `env`, `printenv`, `set`, `export -p`, no `echo $VAR`). The `env -u ... VAR=value command` prefix below is the only sanctioned form.
- No GitHub variable, no workflow change, no `.github/` edit. Do not touch `.claude/`, `.codex/`, `.agents/`, workflows, or any `.planning/` file other than the three redactions in Task 2 and the SUMMARY. No `git rm`, no history rewriting.
- Root npm and vitest commands use exactly this prefix (note the deliberate leading space inside the second quoted name): `env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production`. Sanity-project commands (`npm --prefix sanity ...`) need no env prefix.
- One atomic commit per task. Stage explicit paths only (never `git add -A` or `git add .`). Commit message = a subject line plus a second `-m` paragraph that is exactly the trailer `Claude-Session: https://claude.ai/code/session_01U8V1i15iTkwxadMvZXmpnd` and nothing else (no model name, no Co-Authored-By line, no other trailer). The three commit subjects are given in the tasks.
</objective>

<execution_context>
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/workflows/execute-plan.md
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@sanity/schemas/siteSettings.ts
@sanity/schemas/lib/localeField.ts
@sanity/schemas/__tests__/localeField.test.ts
@sanity/README.md
@src/lib/sanity.ts
@src/lib/sanity-validation.ts
@src/lib/page-models.ts
@src/pages/mentions-legales.astro
@src/pages/en/mentions-legales.astro
@src/pages/confidentialite.astro
@src/pages/en/confidentialite.astro
@tests/unit/sanity-validation.test.ts
@tests/unit/sanity-singletons.test.ts
@tests/unit/page-models.test.ts
@tests/unit/statement-length-limit.test.ts
@tests/e2e/legal.spec.ts

Do NOT load `.planning/STATE.md` whole (about 300 very long lines); Task 2 edits exactly one line of it, located with Grep and read with `offset`/`limit`.

Facts established while planning (verified, do not re-derive):
- LCEN numbering: Legifrance (JORFTEXT000000801164) shows the anonymity rule for non-professional editors in the CURRENT text as Article 1-1, II, effective 2024-05-23. The brief called it "art. 6-III-2", which is the pre-2024 numbering; the existing pages and their code comments deliberately cite "article 1-1, II" and warn against the old numbering. This plan keeps "article 1-1, II" everywhere (pages and Studio description) and does not introduce the old numbering.
- tests/unit/statement-length-limit.test.ts asserts `sanity/schemas/siteSettings.ts` contains ZERO matches of the max-length option key regex. So the 300 cap must be a named constant plus `.max(...)`, and that option key must not appear in the file at all (comments included).
- Root eslint uses `js.configs.recommended`, which includes `no-control-regex`: do NOT write a regex containing control-character escapes in src/lib/sanity-validation.ts; test control characters with a char-code check instead.
- `sanity/schemas/__tests__/*.test.ts` run under `sanity/vitest.config.ts` (jsdom) with `sanity/editorial/test/setup.ts`, which keeps the REAL `defineType`/`defineField` from `sanity`, so a schema file can be imported and inspected (see localeField.test.ts for the mock-Rule technique). `sanity/tsconfig.typecheck.json` excludes test files.
- Root vitest includes only `tests/unit/**/*.test.ts` in the node environment; `src/lib/**` is inside the 80/75/80/80 coverage floor. page-models.test.ts must import the model module dynamically after stubbing `SANITY_PROJECT_ID`/`SANITY_DATASET` (already done at the top of that file; extend its existing destructured dynamic import).
- The contact form really is sent by public/contact.php through OVH `mail()` to Romane's own mailbox, so the contact-form statements "no third-party processor" stay TRUE. They are scoped to the form, not removed. The page-level claims (intro: "the only data processed" and the Sanity section) are the false ones.
- Occurrences of the old address in tracked files: exactly 5 files: the two mentions-légales pages, `.planning/STATE.md` (one very long table row near line 301), and the two files of `.planning/quick/260826-r78-*/` (PLAN and SUMMARY). In the r78 PLAN the parenthesised address WRAPS across two source lines (the street number ends one line, the street name starts the next), so a single-line grep for the street name finds only the second line.
- `dist/` and `node_modules/` are untracked/ignored; `git grep` only searches tracked files. `astro build` empties `dist/` first, so a post-build grep on `dist/` is valid only when the build itself succeeded.
- The production Sanity dataset (project `gwz8iug4`, dataset `production`) is public-read, so a published `publisherAddress` is readable through the Sanity API exactly as it is on the legal page. Drafts are not served. Nothing here reads or writes the dataset with a token.
- Playwright browsers are NOT installed in the planning sandbox (`~/.cache/ms-playwright` absent). The e2e spec edits are still required; running them is best-effort (see the e2e step in Tasks 2 and 3).
- Production keeps serving the old pages (with the old address) until the next `deploy-ovh.yml` run (next Sanity publish or manual dispatch); a push to `main` never deploys. This goes in the SUMMARY as an owner action.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Optional publisherAddress field on siteSettings, wired from Studio to the build model (B-1)</name>
  <files>sanity/schemas/siteSettings.ts, sanity/schemas/__tests__/siteSettings.test.ts, sanity/README.md, src/lib/sanity.ts, src/lib/sanity-validation.ts, tests/unit/sanity-validation.test.ts, tests/unit/sanity-singletons.test.ts</files>
  <behavior>
    Schema (sanity/schemas/__tests__/siteSettings.test.ts, imports `siteSettings` from `../siteSettings`, uses the same recording mock-Rule idea as localeField.test.ts but with `max`, `error` and `custom` methods, no `required` call allowed):
    - The `siteSettings` type has a field named `publisherAddress` of type `text`, `rows` 3, `group` `legal`; that group exists in `siteSettings.groups` with title « Mentions légales ».
    - It is not localized (no `fr`/`en` sub-fields, type is not `object`) and is optional: running its `validation` builder against the mock rule never records a `required` call and records `['max', 300]`.
    - The recorded `custom` validator returns `true` for `undefined`, for an empty string and for `TEST-ADDRESS-FIXTURE`, returns a non-empty French string for a value containing `<` and for one containing `>`.
    - Its description (French) mentions the LCEN, the word « vide » (case-insensitive), `téléphone`, `300` and `Florian`, so the legal rule and the maintainer warning cannot be silently dropped.
    - Exactly ONE new field was added: the set of field names equals the previous set plus `publisherAddress` (the previous set is `siteTitle`, `navLabels`, `footerText`, `defaultSeo`, `welcomeHeading`, `welcomeBody`, `homepageIntro`).

    Sanitizer (tests/unit/sanity-validation.test.ts, new describe blocks; fixtures only `TEST-ADDRESS-FIXTURE`, `TEST-ADDRESS-FIXTURE-LINE-1`, `TEST-ADDRESS-FIXTURE-LINE-2`):
    - A valid site document plus `publisherAddress: '  TEST-ADDRESS-FIXTURE  '` yields `publisherAddress: 'TEST-ADDRESS-FIXTURE'` and no issue.
    - Multi-line input with CRLF, indentation and blank lines (`'  TEST-ADDRESS-FIXTURE-LINE-1  \r\n\r\n TEST-ADDRESS-FIXTURE-LINE-2\r\n'`) yields exactly `'TEST-ADDRESS-FIXTURE-LINE-1\nTEST-ADDRESS-FIXTURE-LINE-2'`.
    - Absent key, `null`, `''` and a whitespace-only string (spaces, newlines, tabs-as-spaces) produce NO `publisherAddress` key and NO issue.
    - A string of exactly `PUBLISHER_ADDRESS_MAX_LENGTH` characters is kept; one character more is dropped with the issue code `publisherAddress.invalid_removed`.
    - Values containing `<` or `>` (for example an HTML-looking `TEST-ADDRESS-FIXTURE` wrapped in angle-bracket tags), a control character (BEL, built with `String.fromCharCode(7)` inside the test), and non-strings (`42`, `{}`, `['TEST-ADDRESS-FIXTURE']`) are dropped with that same issue code and the site document itself is still returned (never null because of the address).
    - `JSON.stringify(result.issues)` never contains `TEST-ADDRESS-FIXTURE` (diagnostics carry codes and identity only).
    - A document with an invalid `siteTitle` still returns `value: null` even when a valid address is present (existing guard unchanged).
    - Lockstep: reading `sanity/schemas/siteSettings.ts` and `src/lib/sanity-validation.ts` as text with `readFileSync`, the number captured after `PUBLISHER_ADDRESS_MAX_LENGTH =` is identical in both files and equals the imported `PUBLISHER_ADDRESS_MAX_LENGTH`.

    Fetch contract (tests/unit/sanity-singletons.test.ts):
    - The existing `getSiteSettings` contract entry gets `publisherAddress: '  TEST-ADDRESS-FIXTURE  '` in `partial` and `publisherAddress: 'TEST-ADDRESS-FIXTURE'` in `expectedPartial`; the `minimal` entry stays unchanged and still round-trips (no `publisherAddress` key invented).
    - New test after the contract loop: `getSiteSettings()` calls `fetchMock` with a GROQ string matching `/publisherAddress/`.
    - New test: when the fetched document carries a rejected address (angle-bracket value built from `TEST-ADDRESS-FIXTURE`), `console.warn` was called with a payload containing `publisherAddress.invalid_removed` and `JSON.stringify(warn mock calls)` does not contain `TEST-ADDRESS-FIXTURE`.
  </behavior>
  <action>
    Per B-1. Work test-first: write the three test files' new cases, run them and watch them fail, then implement.

    1. sanity/schemas/siteSettings.ts. Add a module-level constant named exactly `PUBLISHER_ADDRESS_MAX_LENGTH`, plain assignment to 300, with a short comment saying it is mirrored in src/lib/sanity-validation.ts and kept in lockstep by a root unit test. Do NOT use the max-length option key of the localeField helper anywhere in this file (see key_links). Add a group `{name: 'legal', title: 'Mentions légales'}` after the existing `seo` group. Add ONE `defineField` placed after `defaultSeo` and before the hidden legacy fields: name `publisherAddress`, title « Adresse de l’éditrice (mentions légales) », type `text`, rows 3, group `legal`, no `required()` anywhere, no `initialValue` (the field must be absent by default), and this French description verbatim: « Laisser VIDE tant que le site est édité à titre non professionnel : la page « Mentions légales » affiche alors la mention d’anonymat de l’article 1-1, II de la loi n° 2004-575 du 21 juin 2004 (LCEN). Dès que Romane commence à vendre (tirages, originaux, livres, produits), l’éditrice devient professionnelle : la loi impose alors de publier son nom, son adresse et son numéro de téléphone. Renseigner alors ce champ avec l’adresse postale complète, sans « domiciliée au » (le site l’ajoute), une ligne d’adresse par ligne, en texte brut (300 caractères au maximum), puis prévenir Florian : le numéro de téléphone, le statut et les conditions de vente ne sont pas gérés ici. » Validation: `rule.max(PUBLISHER_ADDRESS_MAX_LENGTH)` followed by an `.error(...)` with a French message naming the limit, then `.custom(...)` returning `true` when the value is not a string or contains neither `<` nor `>`, and a French message (« Texte brut uniquement : les caractères < et > ne sont pas autorisés. ») otherwise. Keep the existing `NAV_ERRORS`, fields, preview and hidden legacy fields untouched.

    2. src/lib/sanity.ts. Add `publisherAddress?: string` to the `SiteSettings` interface with a doc comment: optional, plain text, lines separated by `\n`, absent means the non-professional anonymity regime; never log it. Add `publisherAddress,` to `SITE_SETTINGS_QUERY` between `footerText` and `defaultSeo`. No other change in this file.

    3. src/lib/sanity-validation.ts. Export `PUBLISHER_ADDRESS_MAX_LENGTH` (plain assignment, 300, comment pointing at the Studio schema twin). Add an internal helper (suggested name `cleanPublisherAddress(value: unknown)`) returning `{value?: string; rejected: boolean}`: `null`/`undefined` give no value and not rejected; a non-string is rejected; a string has `\r\n` and lone `\r` normalised to `\n`, is split on `\n`, every line trimmed, empty lines dropped and the rest re-joined with `\n`; an empty result means no value and not rejected; a result longer than the constant, containing `<` or `>`, or containing any character whose code is below 32 other than the `\n` separator, or equal to 127, is rejected with no value (test control characters with a char-code loop, NOT a regex, see Facts). In `sanitizeSiteSettings`, call the helper on `record.publisherAddress` after the existing SEO/navLabels handling, push `issue('publisherAddress.invalid_removed', value)` when rejected, and add `...(address.value ? {publisherAddress: address.value} : {})` to the returned value. The two early `value: null` return paths stay exactly as they are. The issue must carry only the code and the document identity, never the address.

    4. Tests as listed in the behavior block. In tests/unit/sanity-validation.test.ts add the `node:fs` import for the lockstep reads (paths relative to the repo root, as tests/unit/document-completeness-contracts.test.ts does) and import `PUBLISHER_ADDRESS_MAX_LENGTH`. In tests/unit/sanity-singletons.test.ts the existing `beforeEach` already spies on `console.warn`; read the spy back with `vi.mocked(console.warn)` in the new warning test.

    5. sanity/README.md (Romane-facing French, typographic apostrophes like the rest of the file): change the « Réglages du site » bullet under « Pages et réglages communs » to list « adresse de l’éditrice pour les mentions légales » as well, and add a short section « Adresse de l’éditrice (mentions légales) » after that list block, stating: in « Réglages du site », onglet « Mentions légales », le champ « Adresse de l’éditrice » reste vide tant que le site n’est pas professionnel (la page affiche alors la mention d’anonymat prévue par la loi); à remplir (adresse postale complète, sans « domiciliée au ») dès que Romane commence à vendre, puis cliquer sur **Publier**; prévenir Florian car le téléphone, le statut et les conditions de vente restent à mettre à jour dans le code; ces textes juridiques n’ont fait l’objet d’aucune relecture juridique. Do not use any of the retired words checked by tests/unit/publishing-docs.test.ts (`Tableau de bord`, `Checklist`, `site de test`, `Mettre le site à jour`, `siteDeployment`, `siteProductionRelease`).

    6. Commit the seven files above with subject `feat(quick-261004-kbq): optional publisher address field on siteSettings, wired to the build model` and the single Claude-Session trailer paragraph.
  </action>
  <verify>
    <automated>env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npx vitest run tests/unit/sanity-validation.test.ts tests/unit/sanity-singletons.test.ts tests/unit/statement-length-limit.test.ts tests/unit/publishing-docs.test.ts && npm --prefix sanity test && npm --prefix sanity run lint && npm --prefix sanity run typecheck && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run lint && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run typecheck</automated>
  </verify>
  <done>The Studio schema exposes an optional, non-localized, capped, plain-text `publisherAddress` with the French legal-rule description; the GROQ projection, `SiteSettings` type and sanitizer carry it end to end; invalid values are dropped with a code-only diagnostic and never leak into logs; the 300 cap is proven identical in the schema and the sanitizer; statement-length-limit and publishing-docs tests still pass; lint and both typechecks are green; one commit with the Claude-Session trailer only.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Mentions légales read the publisher address from Sanity; old personal address purged from the repo (B-2, B-4)</name>
  <files>src/lib/page-models.ts, tests/unit/page-models.test.ts, src/pages/mentions-legales.astro, src/pages/en/mentions-legales.astro, tests/e2e/legal.spec.ts, .planning/STATE.md, .planning/quick/260826-r78-update-src-pages-mentions-legales-astro-/260826-r78-PLAN.md, .planning/quick/260826-r78-update-src-pages-mentions-legales-astro-/260826-r78-SUMMARY.md</files>
  <behavior>
    `buildLegalNoticeModel` (tests/unit/page-models.test.ts; add it to the file's existing dynamic `await import('../../src/lib/page-models')` destructuring and reuse its `siteSettings(...)` fixture builder; the new tests set `publisherAddress` through that builder's overrides):
    - Filled FR (`publisherAddress: 'TEST-ADDRESS-FIXTURE'`): `publisherNotice` is `{kind: 'address', lead: 'Éditrice du site : Romane Lepont, domiciliée au', lines: ['TEST-ADDRESS-FIXTURE']}`.
    - Filled EN: lead is `Site publisher: Romane Lepont, residing at`, same lines.
    - Multi-line fixture `'TEST-ADDRESS-FIXTURE-LINE-1\nTEST-ADDRESS-FIXTURE-LINE-2'` gives two lines, and a line holding markup-looking text (angle-bracket fixture) is returned verbatim as plain text in `lines` (the model never builds HTML).
    - Empty cases, each for FR and EN: `siteSettings: null`, settings without the field, `publisherAddress: ''`, whitespace-only, and a blank-lines-only string all give `{kind: 'anonymity', text}` where the text contains `article 1-1, II` and contains no `TEST-ADDRESS-FIXTURE`; the FR text is `Le site étant édité à titre non professionnel, l'adresse et le numéro de téléphone personnels de l'éditrice ne sont pas publiés, conformément à l'article 1-1, II de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.` and the EN text is `As the site is published on a non-professional basis, the publisher's personal address and phone number are not published here, in accordance with Article 1-1, II of French law n° 2004-575 of 21 June 2004 for confidence in the digital economy (LCEN).` (byte-identical to the copy in the pages today).
    - Exactly-one invariant: for every case above, `publisherNotice.kind` is either `'address'` or `'anonymity'` and the object has no key of the other variant (no `text` on an address notice, no `lines`/`lead` on an anonymity notice).
    - `hostedByNote`: FR is `Le site est hébergé via le compte d'hébergement OVH de Florian Lepont.`, EN is `The site is hosted via the OVH hosting account of Florian Lepont.`; both contain `Florian Lepont` and match no digit (`/\d/`), in the filled AND the empty case (the note does not depend on the address).
  </behavior>
  <action>
    Per B-2 and B-4. Task 1 must be committed first (the `SiteSettings.publisherAddress` type is needed).

    1. src/lib/page-models.ts. Add and export a discriminated union `LegalPublisherNotice` (variant `address` with `lead: string` and `lines: string[]`; variant `anonymity` with `text: string`), an interface `LegalNoticeModel` (`publisherNotice: LegalPublisherNotice`, `hostedByNote: string`) and `buildLegalNoticeModel({siteSettings, locale}: {siteSettings: SiteSettings | null; locale: Locale})`. Keep the file's conventions: a `Record<Locale, ...>` copy table holding the three strings per locale (address lead, anonymity text, hosted-by note, exactly as quoted in the behavior block, straight apostrophes), a doc comment stating the function is pure (no fetch, no HTML), that the text is escaped by Astro and must never be fed to `set:html`, and that the union exists so the anonymity paragraph and the address paragraph can never be rendered together or both omitted. The line splitting is defensive even though `sanitizeSiteSettings` already cleaned the value: split on `\r?\n`, trim, drop empty lines; no lines means the anonymity variant. Do not log anything.

    2. src/pages/mentions-legales.astro and src/pages/en/mentions-legales.astro. In each frontmatter: import `getSiteSettings` from the sanity lib and `buildLegalNoticeModel` from page-models (existing import depth: `../lib/...` for FR, `../../lib/...` for EN), compute `const model = buildLegalNoticeModel({siteSettings: await getSiteSettings(), locale: 'fr'})` (`'en'` for EN) and `const notice = model.publisherNotice`. Rewrite the frontmatter comments so they match the new reality and say nothing false: keep the LCEN Article 1-1 numbering note and the D-07/D-08 hosting and identity rationale; replace the D-09/D-10 blocks and the line "Hardcoded content (Pattern 3 — no Sanity fetch)" with an explanation that the legal copy stays in code (developer review before any change; copy lives in `buildLegalNoticeModel`) while ONE value, `siteSettings.publisherAddress`, is read from Sanity at build time; empty (the default) means the non-professional regime, Article 1-1, II anonymity wording and no address published; filled means the professional-publisher notice with the address; the repository is public, so the hosting account holder's personal address is deliberately NOT in the repo and the host sentence names him as account holder only (quick task 261004-kbq purged the earlier address); open legal points: the texts have had no legal review, the Statut section still says non-professional even when the address is filled and must be revisited when the Shop/Checkout milestone ships, whether the host's phone number must appear is unverified. The EN comment can point to the FR file for the full rationale, as it does today. The comments must contain no postal address or fragment of one.
    Template: keep h1, every `h2`, the publisher line ("Romane Lepont, exerçant sous le nom commercial « Atelier Jacqueline Suzanne », à titre non professionnel." and its EN twin), the publication-director line, the e-mail line, the OVH block, the Statut section and all CSS exactly as they are. Replace ONLY the two paragraphs that follow the e-mail line (the anonymity paragraph and the host-with-address paragraph) by: one conditional paragraph, and `<p>{model.hostedByNote}</p>`. The conditional renders, when `notice.kind === 'address'`, a `<p>` containing `{notice.lead}`, a space, then the lines with a `<br />` between consecutive lines built from Astro fragments (an index guard, no `set:html`, no string concatenation of markup, no trailing period appended); otherwise a `<p>` containing `{notice.text}`. Do not add or remove any other element.

    3. tests/e2e/legal.spec.ts: add a new `test.describe` with two content-agnostic tests (the address is typed in Studio, so the build may or may not contain one; never assert which state is live). FR at `/mentions-legales/`: inside `main`, count `p` elements with `hasText: 'Éditrice du site :'` plus those with `hasText: 'ne sont pas publiés'`, and assert the sum is exactly 1; assert exactly one `p` with `hasText: "compte d'hébergement OVH de Florian Lepont"` and that it does not contain any digit (`not.toContainText(/\d/)`). EN at `/en/mentions-legales/`: same with `Site publisher:`, `are not published here` and `OVH hosting account of Florian Lepont`. Keep every existing assertion (they still hold: the Statut sections are unchanged). Never put any part of a real address in the spec (the digit check is the address guard). Do not add hardcoded gallery/édition routes (tests/unit/e2e-content-fragility.test.ts).

    4. Redaction (B-4), three files, minimal edits, nothing else in them changes. Locate the lines with Grep using ONLY the bracketed pattern `Saint[-]Martin` (never type the unbracketed street name into a command or file) and `output_mode: content`. In each file replace the parenthesised postal address, from its opening parenthesis (before the street number) to its closing parenthesis (after the country or city), with the exact token `[adresse retirée du dépôt public]`, parentheses included in the replaced span, so the sentence reads, for example, "with his real address [adresse retirée du dépôt public] and no phone number". Per file: (a) `.planning/STATE.md`: one line (a table row near line 301); Read ONLY that line with `offset` and `limit: 1` (the file is huge; never read it whole), then Edit with `old_string` set to the exact parenthesised span copied from that read; (b) `260826-r78-SUMMARY.md`: one line, same replacement; (c) `260826-r78-PLAN.md`: the span wraps across two lines, so the `old_string` must include the line break and the following line's indentation exactly as the file has them; the result is the token followed by the rest of the sentence on the same line (". Update the ..." stays intact). Read each file (or its relevant range) before editing. No other `.planning/` file is touched.

    5. Run the checks in `<verify>`. Optional e2e (best effort, record the outcome in the SUMMARY either way): if `npx playwright install chromium` succeeds and the build is fresh, run `npx playwright test tests/e2e/legal.spec.ts --project=chromium` (root env prefix). If browsers cannot be installed, say "e2e not run" in the SUMMARY; never claim it passed.

    6. Commit the eight files above with subject `fix(quick-261004-kbq): legal notice reads the publisher address from Sanity, former personal address purged from the repo` (do not quote the address) and the single Claude-Session trailer paragraph.
  </action>
  <verify>
    <automated>env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npx vitest run tests/unit/page-models.test.ts tests/unit/e2e-content-fragility.test.ts && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run lint && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run typecheck && test -z "$(git grep -n -i -E 'Saint[-]Martin|Ville[n]euve|9429[0]|(^|[^0-9])[7] rue')" && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run build && test -z "$(grep -rliE 'Saint[-]Martin|Ville[n]euve|9429[0]' dist)" && npm run test:artifact && grep -q 'Florian Lepont' dist/mentions-legales/index.html && grep -q 'Florian Lepont' dist/en/mentions-legales/index.html</automated>
  </verify>
  <done>The model returns exactly one publisher notice (address or anonymity) per locale with the exact FR/EN copy and a host sentence free of any address; both pages render only that and their code comments match; the old address is gone from every tracked file (bracketed git grep empty, built dist empty), the three docs carry the redaction token with no other change; unit tests, lint, typecheck, build and artifact check are green; the e2e spec edits are in place (run or explicitly reported as not run); one commit with the Claude-Session trailer only.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Privacy policy tells the truth about the Sanity image CDN, with tests in both languages (B-3)</name>
  <files>src/pages/confidentialite.astro, src/pages/en/confidentialite.astro, tests/unit/privacy-pages.test.ts, tests/e2e/legal.spec.ts</files>
  <behavior>
    tests/unit/privacy-pages.test.ts (new, node environment, no src import). Helper: read a page file, drop the frontmatter (everything up to and including the second line that is exactly `---`), cut at `<style>`, then derive (a) `chunks`: the template split on `<h2>` (index 0 = h1 plus intro, 1 = contact form, 2 = Sanity section, 3 = hosting logs, 4 = cookies) and (b) `text(chunk)`: tags replaced by a space, the JSX `{' '}` token replaced by a space, whitespace collapsed. Exercise `src/pages/confidentialite.astro` (FR) and `src/pages/en/confidentialite.astro` (EN):
    - Structure parity: both split into exactly 5 chunks, the number of `<p>` elements is identical per chunk index between FR and EN, and the section 2 chunk has exactly 3 `<p>`.
    - The retained sections are still there: FR contains `Formulaire de contact`, `Journaux d'hébergement`, `ajs_locale`, `CNIL`, `OVH`; EN contains `Contact form`, `Hosting logs`, `ajs_locale`, `CNIL`, `OVH`.
    - False claims gone: the old FR sentence denying any transmission to Sanity and the old FR intro wording about "the only data processed by this site" appear nowhere; same for their EN twins (quote the exact old sentences from the current page files before editing them, and assert absence of each as a whitespace-collapsed substring). The no-third-party wording is allowed ONLY in the contact-form chunk: chunks 0, 2, 3 and 4 contain neither `aucun prestataire tiers` / `no third-party processor` nor equivalent denials, while chunk 1 still contains its form-scoped statement.
    - CDN disclosure present in section 2: FR text contains `Sanity`, `réseau de diffusion de contenu (CDN) de Sanity`, `société tierce`, `adresse IP`, `intérêt légitime`, `aucun cookie publicitaire ni traceur`; EN text contains `Sanity`, `content delivery network (CDN) of Sanity`, `third-party company`, `IP address`, `legitimate interest`, `no advertising cookie or tracker`.
    - The intro chunk of each language now names Sanity (the image delivery) among the processed data: FR intro contains `Sanity`, EN intro contains `Sanity`.
    e2e additions in tests/e2e/legal.spec.ts, inside the existing `privacy policy page content` describe: the FR page's `main` contains `réseau de diffusion de contenu (CDN)`, `adresse IP`, `intérêt légitime` and does not contain the old denial sentence; the EN page's `main` contains `content delivery network (CDN)`, `IP address`, `legitimate interest` and does not contain its old denial sentence.
  </behavior>
  <action>
    Per B-3. Write the unit test first and watch it fail on the current pages, then edit the pages. Edit the template text and the frontmatter comment of BOTH pages; keep every other section, the CSS and the `{' '}` JSX tokens exactly as they are.

    Copy to apply (straight apostrophes, same as today; FR and EN must mirror each other paragraph for paragraph):
    - Intro paragraph, FR: « Cette page décrit, de façon simple et directe, les données traitées par ce site : celles du formulaire de contact, l'affichage des images du site par un prestataire tiers (Sanity), les journaux techniques de l'hébergeur, et un unique cookie technique. Ce n'est pas un document juridique formel — c'est une explication claire de ce qui se passe réellement. » EN: « This page describes, simply and directly, the data handled by this site: contact-form data, the display of the site's images by a third-party provider (Sanity), the host's technical logs, and a single functional cookie. This is not a formal legal document — it is a plain-language explanation of what actually happens. »
    - Contact-form section: unchanged except the "Destinataire" / "Recipient" paragraph, which becomes form-scoped: FR « Destinataire : Romane Lepont uniquement — aucun prestataire tiers n'intervient dans le traitement de ce formulaire. » EN « Recipient: Romane Lepont only — no third-party processor is involved in handling this form. » (the first contact-form paragraph already scopes its own "no third party" wording to the form message and stays).
    - Section 2 heading: FR « Images du site (Sanity) », EN « Site images (Sanity) », followed by exactly three paragraphs.
      FR p1: « Les textes et les photographies du site sont gérés dans un système de gestion de contenu, Sanity, interrogé uniquement au moment de la construction du site, une étape qui n'implique aucune donnée de visiteur. »
      FR p2: « En revanche, les photographies affichées sur le site sont servies par le réseau de diffusion de contenu (CDN) de Sanity, une société tierce. Lorsque votre navigateur charge une image, il envoie directement une requête à ce prestataire, qui reçoit ainsi votre adresse IP et les données techniques de la requête. Pour savoir comment Sanity traite ces données, consultez sa propre politique de confidentialité. »
      FR p3: « Finalité : afficher les images du site. Base légale : l'intérêt légitime d'afficher le site et ses images (article 6, paragraphe 1, point f du RGPD). Ce site ne dépose aucun cookie publicitaire ni traceur à cette occasion. »
      EN p1: « The site's texts and photographs are managed in a content management system, Sanity, queried only when the site is built, a step that involves no visitor data. »
      EN p2: « However, the photographs shown on the site are served by the content delivery network (CDN) of Sanity, a third-party company. When your browser loads an image, it sends a request directly to that provider, which therefore receives your IP address and the technical data of the request. To learn how Sanity handles this data, see Sanity's own privacy policy. »
      EN p3: « Purpose: displaying the site's images. Legal basis: the legitimate interest in displaying the site and its images (Article 6(1)(f) GDPR). This site sets no advertising cookie or tracker in doing so. »
    - Hosting-logs and Cookies sections: untouched.
    Do not invent facts about Sanity beyond these statements: no retention period, no server location, no controller/processor characterisation, no cookie claim about Sanity's servers (the no-cookie sentence speaks only of this site), and no URL for Sanity's policy (the pages say to consult it, they do not link to it). Do not re-quote the removed denial sentences in any code comment; update each page's frontmatter comment instead to say the Sanity section now discloses the image CDN (IP address and request data reach Sanity's CDN; legitimate interest), that the contact-form "no third party" statements are true and form-scoped (public/contact.php to OVH mail()), and that this policy has had no legal review.

    Then add the e2e assertions described above to tests/e2e/legal.spec.ts (same describe, FR and EN tests; keep the existing assertions) and run `<verify>`. Optional e2e (best effort, same rule as Task 2): run `npx playwright test tests/e2e/legal.spec.ts --project=chromium` only if Chromium is available; otherwise record "e2e not run".

    Commit the four files with subject `fix(quick-261004-kbq): privacy policy discloses the Sanity image CDN instead of denying third-party transfers` and the single Claude-Session trailer paragraph.
  </action>
  <verify>
    <automated>env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npx vitest run tests/unit/privacy-pages.test.ts tests/unit/e2e-content-fragility.test.ts && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run lint && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run typecheck && env -u SANITY_API_READ_TOKEN -u ' SANITY_PROJECT_ID' SANITY_PROJECT_ID=gwz8iug4 SANITY_DATASET=production npm run build && grep -q 'CDN' dist/confidentialite/index.html && grep -q 'CDN' dist/en/confidentialite/index.html && npm run test:artifact</automated>
  </verify>
  <done>Both privacy pages disclose that images come from the CDN of Sanity, a third party that receives the visitor's IP address and request data, with legitimate interest as the basis and no advertising cookie or tracker set by the site; the denial sentences and the "only data" intro are gone; the contact form, OVH logs, cookie, GDPR rights and CNIL content remain with FR/EN structure identical; the new unit test enforces all of it in both languages and the e2e spec asserts the rendered text; lint, typecheck, build and artifact check are green; one commit with the Claude-Session trailer only.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Repository (public) -> world | Everything git-tracked, every commit message and public CI log is world-readable; a personal postal address placed here is a privacy breach |
| Sanity Studio editor -> public dataset -> static build | Free text typed by an editor is fetched at build time and rendered into public HTML |
| Visitor browser -> Sanity image CDN (cdn.sanity.io) | Every page view sends the visitor's IP address and request data to a third party; the privacy policy must describe it truthfully |
| Build logs (GitHub Actions, public repo) | Diagnostics emitted by src/lib/sanity-validation.ts |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-kbq-01 | Information Disclosure | Real postal address committed to the public repo (pages, docs, tests, fixtures, commit messages, this plan) | high | mitigate | Address removed from the two pages and redacted from three tracked docs with a fixed token; tests use `TEST-ADDRESS-FIXTURE` only; the bracketed `git grep` gate (empty) and a built-`dist/` grep are required verification; commit messages and SUMMARY never quote it; no GitHub variable and no workflow change |
| T-kbq-02 | Information Disclosure | Address leaking through build diagnostics into public CI logs | medium | mitigate | `warnForSanityIssues` logs type, id, slug and reason codes only; the new issue code carries no value; a unit test asserts neither the issue list nor the `console.warn` payload contains the fixture |
| T-kbq-03 | Tampering | Markup or script injected through the free-text address (editor error or compromised editor account) | medium | mitigate | Studio rule rejects `<` and `>`; sanitizer drops values with `<`, `>` or control characters and over 300 characters; the model returns plain strings; pages render them as escaped Astro text with `<br />` produced by markup, never `set:html` |
| T-kbq-04 | Repudiation | Privacy policy and legal notice make statements that are false or unverifiable (no data to Sanity; address regime) | high | mitigate | Task 3 rewrites the Sanity section from verifiable facts only (browser request to the CDN, IP and request data received, legitimate interest) and adds no claim about Sanity's retention, location or cookies; Task 2 keeps the exact LCEN Article 1-1, II wording and the exactly-one-notice invariant |
| T-kbq-05 | Elevation of Privilege | Publisher falls back to the wrong legal regime silently (invalid or dropped address makes the page claim anonymity while Romane is professional) | medium | mitigate | Studio blocks publish on over-length or angle-bracket values, so a build-time drop is only reachable through direct API writes; the drop is surfaced as `publisherAddress.invalid_removed` in the build warnings; the Studio description and README tell the owner exactly when to fill the field |
| T-kbq-06 | Information Disclosure | Former address stays retrievable from git history, forks and merged PR history | medium | accept | Rewriting history is explicitly out of scope; recorded as a residual risk in the SUMMARY so the owner can decide on a separate history purge |
| T-kbq-07 | Information Disclosure | Published `publisherAddress` readable through the public Sanity dataset API | low | accept | Equivalent to its intended publication on the legal page; drafts are not served; the field stays empty while non-professional |
| T-kbq-08 | Repudiation | Legal texts shipped without legal review | medium | accept | Stated in code comments, in sanity/README.md and in the SUMMARY together with the open legal points; no claim of compliance is made |
| T-kbq-SC | Tampering | npm/pip/cargo installs | low | accept | No package is added or changed (package.json and package-lock.json untouched); no legitimacy checkpoint needed |
</threat_model>

<verification>
Run after the three task commits (root commands with the env prefix from the hard rules; never print env):
- Purge gate: `test -z "$(git grep -n -i -E 'Saint[-]Martin|Ville[n]euve|9429[0]|(^|[^0-9])[7] rue')"` (any hit fails; the patterns are bracketed so this plan file does not match itself). A plain case-insensitive `git grep -n` for the old street name (typed from memory by the orchestrator, never copied into a file) must return nothing too.
- Root: `npm run lint`, `npm run typecheck` (astro check), `npm run test:coverage` (all unit tests plus the 80/75/80/80 floor).
- Sanity project: `npm --prefix sanity run lint`, `npm --prefix sanity run typecheck`, `npm --prefix sanity run test:coverage`.
- Scope: `git diff --name-only origin/main..HEAD` lists only files named in `files_modified` plus this plan and the SUMMARY under `.planning/quick/261004-kbq-mentions-legales-adresse-hors-depot-conf/`; the command `git diff --name-only origin/main..HEAD | grep -E '^(\.claude|\.codex|\.agents|\.github)/|package(-lock)?\.json'` prints nothing. `git log -3 --format=%B` shows only the three subjects plus the one Claude-Session trailer each (no `Co-Authored-By`, no model name).
- Brief coverage audit: GOAL (publisher address out of the repo, owner-typed in Studio; privacy policy truthful) -> Tasks 1-3; REQ LEGAL-01 (mentions légales) -> Tasks 1-2; REQ LEGAL-03 (privacy policy) -> Task 3; RESEARCH: none for this quick task; CONTEXT (brief): B-1 -> Task 1, B-2 -> Task 2, B-3 -> Task 3, B-4 -> Task 2 step 4, B-5 -> SUMMARY (`<output>`), B-6 -> hard rules + purge gate + T-kbq-01/02, B-7 -> verification section and per-task commits. Deviations from the brief, all recorded in the SUMMARY: the brief's "art. 6-III-2" is the pre-2024 numbering, so the current "article 1-1, II" is used (verified on Legifrance); the contact-form "no third party" statements are true (contact.php through OVH mail()) and were scoped to the form instead of removed, while the false page-level claims were rewritten.
</verification>

<success_criteria>
Romane (or Florian) can type the éditrice's postal address into Studio under « Réglages du site » > « Mentions légales »; empty (default) keeps the LCEN anonymity wording, filled shows « Éditrice du site : Romane Lepont, domiciliée au <address> » and drops the anonymity paragraph, in French and English, with no address ever stored in the repository. The host paragraph names Florian Lepont as OVH account holder with no address. The privacy policy states, in both languages, that images come from the CDN of Sanity, a third party that receives the visitor's IP address and request data, on a legitimate-interest basis, with no advertising cookie or tracker set by the site. The old personal address is absent from every tracked file. All root and Studio lint, typecheck and unit/coverage gates are green, and three atomic commits carry only the Claude-Session trailer.
</success_criteria>

<output>
Create `.planning/quick/261004-kbq-mentions-legales-adresse-hors-depot-conf/261004-kbq-SUMMARY.md` when done (never include the old address or any fragment of it; commit it as a separate docs commit with the same single-trailer rule, staging only that file). It MUST contain:
1. What changed per task, with the three commit hashes, and the real outcome of every verification command (including whether the optional e2e runs and the full `npm run build` succeeded, or "not run" with the reason; never claim an unrun check passed).
2. A prominent statement that the legal texts (mentions légales and politique de confidentialité) received NO legal review.
3. The open legal points: (a) the non-professional anonymity regime ends when prints are sold, at which point the address field must be filled and the page revisited; (b) the hosting account is in Florian's name, so whether Romane's identity was communicated to the host (a condition of the anonymity regime) is unverified; (c) whether the host's phone number is required on the page is unverified (OVH's own page publishes none). Also list: (d) the Statut section and the « à titre non professionnel » publisher line still say non-professional even when the address is filled, kept as-is per the brief, to be revisited with the Shop/Checkout milestone; (e) the former address remains in git history, forks and earlier PRs (no history rewrite per the brief), so a separate purge decision is the owner's.
4. The deviations from the brief (LCEN numbering; contact-form statements scoped rather than removed).
5. Owner actions: production keeps serving the old pages, old address included, until the next `deploy-ovh.yml` run, so trigger a manual dispatch (or publish in Studio) right after merging; the Studio field stays empty until Romane starts selling.
6. A note that the STATE.md row for this task is added by the orchestrator, not by this plan.
</output>
