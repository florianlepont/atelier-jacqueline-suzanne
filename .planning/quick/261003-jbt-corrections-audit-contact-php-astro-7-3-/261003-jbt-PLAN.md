---
phase: quick-261003-jbt
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/contact.php
  - tests/unit/contact-php.test.ts
  - package.json
  - package-lock.json
  - .github/workflows/ci.yml
  - .github/workflows/deploy-ovh.yml
  - src/layouts/BaseLayout.astro
  - src/lib/robots.ts
  - tests/unit/robots-meta.test.ts
  - tests/unit/ci-workflow.test.ts
  - tests/unit/deploy-ovh-workflow.test.ts
  - README.md
  - LICENSE
  - LICENSE-CONTENT.md
  - SECURITY.md
  - .gitignore
  - .claude/settings.local.json
autonomous: true
requirements: [AUDIT-01, AUDIT-02, AUDIT-03]
user_setup:
  - service: github
    why: "deploy-ovh.yml no longer hard-codes the OVH SFTP host and account name; it reads them from two repository variables. Claude cannot create GitHub repository variables. Until both exist, the production deploy's credential guard fails loudly (by design) before any upload is attempted."
    env_vars:
      - name: OVH_SFTP_HOST
        source: "OVH Control Panel -> Web Cloud -> Hosting plans -> (the plan) -> FTP - SSH -> FTP server hostname. Then: `gh variable set OVH_SFTP_HOST --body '<hostname>'` (repository-level Actions variable, NOT environment-scoped)."
      - name: OVH_SFTP_USER
        source: "Same OVH screen -> the FTP/SFTP login (also the hosting account name used in the remote path). Then: `gh variable set OVH_SFTP_USER --body '<login>'` (repository-level Actions variable, NOT environment-scoped)."
    dashboard_config:
      - task: "Enable GitHub private vulnerability reporting (SECURITY.md points to it; the plan deliberately does NOT change GitHub settings)"
        location: "GitHub repo -> Settings -> Code security -> Private vulnerability reporting"

must_haves:
  truths:
    - "A contact-form submission whose message spans several lines (CRLF as sent by browsers, or bare LF) is accepted and delivered with every line intact, instead of being rejected with HTTP 400."
    - "A name or email containing a carriage return or line feed is still rejected with HTTP 400 and nothing is sent: the header-injection defence is narrowed to the two single-line fields, not removed."
    - "A request that submits an array for any form field (name[]=x) is answered with a normal JSON 400 failure and never causes a PHP fatal error (an HTTP 500 on the real host); an array in the honeypot field sends nothing and never fatals."
    - "These behaviours are proven by tests that actually execute public/contact.php through php-cli, and those tests skip cleanly (suite reported skipped, no failure) on a machine without PHP."
    - "package.json and package-lock.json both resolve astro to 7.3.5, and root lint, typecheck and unit tests pass on it (the build result is reported honestly, success or failure)."
    - "Every pull request runs lint, typecheck and unit tests in a workflow with a read-only token, the pull_request trigger only, and no secrets."
    - "The GitHub Pages staging build (non-root base) emits <meta name=\"robots\" content=\"noindex, nofollow\"> on every page; the production root-base build keeps its existing robots behaviour unchanged."
    - "deploy-ovh.yml contains no SFTP host or account-name literal: both SFTP steps read vars.OVH_SFTP_HOST / vars.OVH_SFTP_USER, the credential guard fails loudly if either is missing, and neither value is echoed into any run summary."
    - "The repo ships an MIT LICENSE for the code, a separate all-rights-reserved LICENSE-CONTENT.md for Romane Lepont's photos/texts/logos/brand (with an AI / text-and-data-mining reservation), a SECURITY.md, and a README Licence section."
    - ".claude/settings.local.json is removed from version control (still present on disk) and ignored by .gitignore."
  artifacts:
    - public/contact.php                         # name/email-only CRLF check + string-type guards
    - tests/unit/contact-php.test.ts             # source invariants kept + executed php-cli suite
    - package.json                               # astro range bumped to ^7.3.5
    - package-lock.json                          # astro resolved 7.3.5
    - .github/workflows/ci.yml                   # new pull_request workflow
    - src/lib/robots.ts                          # pure robots-meta resolver (staging = non-root base)
    - src/layouts/BaseLayout.astro               # robots meta driven by the resolver
    - tests/unit/robots-meta.test.ts             # resolver cases + layout wiring invariants
    - tests/unit/ci-workflow.test.ts             # ci.yml safety invariants
    - .github/workflows/deploy-ovh.yml           # host/user via repository variables
    - tests/unit/deploy-ovh-workflow.test.ts     # assertions updated for the variables
    - README.md                                  # variables documented, CI + noindex notes, Licence section
    - LICENSE
    - LICENSE-CONTENT.md
    - SECURITY.md
    - .gitignore
  key_links:
    - "public/contact.php CRLF regex call <-> tests/unit/contact-php.test.ts source-invariant test: that test locates the exact text of the CRLF regex call and requires it to precede the outgoing-mail call, and a second test counts every occurrence of the mail-call token across the WHOLE file, comments included. The regex call must stay textually intact, and no new comment may spell the mail-call token."
    - "src/layouts/BaseLayout.astro `import.meta.env.BASE_URL` <-> src/lib/robots.ts <-> ASTRO_BASE in .github/workflows/deploy.yml: staging detection is base-only ON PURPOSE. The CI test build and local preview/e2e use the root base with the default github.io `site`, and tests/e2e/seo.spec.ts asserts `index, follow` on that build; a rule keyed on the site URL differing from the production domain would turn the entire e2e gate red."
    - ".github/workflows/deploy-ovh.yml `vars.OVH_SFTP_*` <-> repository Actions variables (created by the owner, user_setup above): the extended guard step is what converts a missing variable into a loud failure before any upload instead of an opaque SFTP error."
    - ".github/workflows/ci.yml <-> .github/actions/lint-typecheck-and-install/action.yml: the PR workflow reuses the same composite action the deploy workflows run, so PR gates cannot drift from deploy gates. That composite needs no secrets (deploy.yml calls it with none)."
---

<objective>
Apply the corrections from the repository audit: harden and fix the contact endpoint, bump Astro and add PR-time CI, keep the staging site out of search results, stop publishing the SFTP target in a tracked workflow, and add the licensing / security / hygiene files the repo is missing.

Purpose: three independent audit findings groups, each landing as its own atomic commit on branch `claude/kind-cannon-2myct1`.
- Task 1 (AUDIT-01): contact.php rejects every multi-line message (so real visitors with a two-paragraph message get a failure) and fatals with a TypeError on array input.
- Task 2 (AUDIT-02): Astro is two minors behind, nothing runs on pull requests, the GitHub Pages staging mirror is indexable (duplicate content competing with the real domain), and the SFTP host/account are hard-coded in a public workflow file.
- Task 3 (AUDIT-03): no LICENSE, no content-rights notice, no security policy, and a per-machine Claude settings file is tracked.

Output: fixed `public/contact.php` with an executed-PHP test suite, Astro 7.3.5, `.github/workflows/ci.yml`, noindex-on-staging via a tested helper, SFTP target moved to repository variables, LICENSE / LICENSE-CONTENT.md / SECURITY.md / README Licence section, untracked local settings.

Out of scope, user decisions still pending - do NOT touch: anything under `.planning/` other than writing this plan's SUMMARY, any other file under `.claude/`, the mentions-legales page address, and any Sanity or GitHub settings (including enabling private vulnerability reporting). Do not push, open a PR, or rewrite git history.

Commit rules: one atomic commit per task, staging only the files named in that task (never `git add -A` / `git add .`). No AI model name anywhere in a commit message (explicit instruction): do not add a co-author trailer that names a model. Commit-message prefixes shown in each task.
</objective>

<execution_context>
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/workflows/execute-plan.md
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@public/contact.php
@tests/unit/contact-php.test.ts
@.github/workflows/deploy-ovh.yml
@.github/workflows/deploy.yml
@.github/actions/lint-typecheck-and-install/action.yml
@src/layouts/BaseLayout.astro
@tests/unit/deploy-ovh-workflow.test.ts
@package.json
@.gitignore
@README.md

Environment facts established while planning (re-check cheaply, do not re-derive):
- `node_modules/` is NOT installed in this checkout: run `npm ci` at the repo root before any vitest / lint / typecheck command. Node is 22.22.0; astro 7.3.5 requires >=22.12.0 (satisfied; CI uses Node 22.x).
- `php` 8.3.6 is installed locally. A throwaway prototype confirmed the approach in Task 1: a harness script that sets the request method and `$_POST` and requires contact.php, a `sendmail_path` capture script, and a shutdown function that reads the response code all work under php-cli. Against the CURRENT script that prototype showed: multi-line message -> 400 "Invalid input"; array name -> uncaught TypeError from trim(), process exit status 255, no JSON on stdout.
- astro 7.3.5 exists on npm (published 2026-09-24 by the official maintainers). Its only peer dependency, `@astrojs/markdown-remark`, is optional, so the lockfile change should be confined to astro and its own transitive entries.
- `npm run build` needs SANITY_PROJECT_ID and SANITY_DATASET (it throws at import time without them); the read token is optional (the client falls back to the CDN without it). No token is available in this environment.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Fix contact.php multi-line messages and non-string input, with executed php-cli tests</name>
  <files>public/contact.php, tests/unit/contact-php.test.ts</files>
  <behavior>
    - Baseline: a normal single-line submission (name Camille, a syntactically valid email, one-line message) returns HTTP 200 with JSON success true and the message reaches the captured outgoing mail.
    - AUDIT-01a: a message containing CRLF and bare LF line breaks is accepted: HTTP 200, success true, the captured mail contains every line of the message in its body, and the header block of the captured mail contains none of the message text.
    - AUDIT-01b: CR or LF inside the name, or inside the email, is rejected: HTTP 400, JSON success false, no mail captured.
    - AUDIT-01c: an array submitted for name, for email, or for message (as name[]=x produces) is rejected with HTTP 400 and JSON success false; the PHP process exits with status 0 (not 255) and no mail is captured.
    - AUDIT-01d: an array submitted for the honeypot field `website` sends nothing, answers JSON success true, and the process exits 0.
    - Every pre-existing source-invariant test in the file still passes unchanged.
  </behavior>
  <action>
    Work test-first. Per AUDIT-01.

    0. Dependencies: run `npm ci` at the repo root (node_modules is absent).

    1. Tests first (RED). In tests/unit/contact-php.test.ts keep every existing source-invariant `it` exactly as is, and rewrite only the file's header comment: it currently claims no PHP runtime is available in this repo's tooling, which is no longer true of this file. Replace it with a short note that the file has two layers: source-text invariants that always run, and an executed layer that runs the real script under php-cli and is skipped when PHP is not installed. Then add a second `describe` block for the executed layer, guarded with `describe.skipIf(...)`. Probe availability once at module load with `spawnSync` from `node:child_process`, running the PHP binary with `--version` and treating exit status 0 as available. The binary name comes from an `AJS_PHP_BIN` environment variable, defaulting to `php`; this seam lets a reviewer simulate "PHP absent" by pointing it at a nonexistent path.

    Harness, built in a `beforeAll` inside the guarded block (hooks of a skipped suite do not run) and removed in `afterAll`: create a temp directory with `mkdtemp` under `os.tmpdir()`, and write two files into it. (a) A PHP harness that sets `$_SERVER['REQUEST_METHOD']` to POST, fills `$_POST` from `json_decode(getenv('AJS_POST_JSON'), true)` in associative mode so array values survive, registers a shutdown function that writes the text `STATUS:` followed by the response code to stderr (taking the code from `http_response_code()`, falling back to 200 when it returns false), and finally requires the path held in the `AJS_CONTACT_PHP` environment variable. (b) An executable sendmail stand-in (mode 0o755, `#!/bin/sh`, body that copies stdin into the file named by the `AJS_CAPTURE` environment variable). Resolve the real contact.php path with `fileURLToPath(new URL('../../public/contact.php', import.meta.url))`.

    Run each case with `spawnSync` on the PHP binary with arguments `-d`, `sendmail_path=<capture script>`, and the harness path; pass `{...process.env, AJS_POST_JSON, AJS_CONTACT_PHP, AJS_CAPTURE: <unique file in the temp dir>}` as env and `encoding: 'utf8'`. Do NOT pass `-n`: distro PHP builds load json/filter through their ini files and the script needs them. Write a small local helper that returns the process exit status, the parsed stdout JSON (tolerating a parse failure by returning null so an assertion fails readably), the numeric status from the STATUS marker, and the captured mail text (or null when the capture file does not exist). The capture script exists so the success path is observable without sending real mail: PHP appends the envelope-sender arguments to the sendmail command, the stand-in ignores them and exits 0, so the script's mail call returns true.

    Cases: one baseline case plus AUDIT-01a, 01b, 01c, 01d as listed in the behavior block. Use `it.each` for 01b (CRLF and bare LF, each in name and in email) and for 01c (array in name, in email, in message). For 01a use a message equivalent to "Bonjour,", CRLF, "Deuxième ligne", LF, "Troisième ligne"; to split header from body, take the captured text before the index of the body label `Nom: Camille` as the header region and assert the message lines are absent from it while `Reply-To:` followed by the submitted address is present. For the array cases assert exit status 0 and non-null parsed JSON with `success === false` and status 400.

    Run `npx vitest run tests/unit/contact-php.test.ts`. Expected RED: the multi-line case fails (currently 400) and the three array cases fail (currently exit 255); the baseline, the CR/LF-in-name/email cases and all source-invariant tests pass. Record this RED result in the SUMMARY; if the baseline case itself fails, the harness is wrong, fix the harness before touching contact.php.

    2. Fix public/contact.php (GREEN).
    (a) Next to the existing `fail()` function add a small helper that reads one `$_POST` key and returns the trimmed string, or null when the submitted value is not a string. It is where the string-type guard (`is_string`) lives. Replace the four direct `trim($_POST[...] ?? '')` reads with it. Keep PHP-version tolerance exactly as the file header promises: syntax no newer than PHP 7.1 (a nullable return type is fine; no union types, no `mixed`, no PHP 8-only string functions, no strict_types declaration).
    (b) name, email and message returning null -> `fail(400, 'Invalid input')`. The honeypot returning null counts as "filled": take the existing silent-success-and-send-nothing path (a non-string value in the decoy field can only come from a bot or hand-crafted request, and the D-08 rule is to never reveal detection). Do this before the required-field check, preserving the existing order: read fields, honeypot short-circuit, required check, length caps, CRLF check, email format, send.
    (c) Narrow the CRLF loop to name and email only; message is excluded. Keep the existing regex call text intact, unchanged, and still ahead of the outgoing-mail call (a source-invariant test finds it by its exact text). Rewrite the comment above the loop to say why: name and email are single-line fields by definition and the email reaches the Reply-To header, while the message is only ever placed in the body after the blank line, where a line break is legitimate and cannot create a header.
    (d) Leave the From header line, the length caps, FILTER_VALIDATE_EMAIL, the CORS allowlist, the recipient, and the mail call itself untouched. Do not write the mail call token (the function name immediately followed by an opening parenthesis) in any new or edited comment: an existing test counts its occurrences across the whole file, comments included, and requires exactly one.

    3. Re-run `npx vitest run tests/unit/contact-php.test.ts` until GREEN, then `php -l public/contact.php`, then `npm run test:unit` and `npm run lint` to prove nothing else moved. Also run the suite once with `AJS_PHP_BIN` pointed at a nonexistent path and confirm the executed block is reported as skipped (not failed) while the source-invariant tests still pass.

    4. Commit only the two files, message prefix `fix(quick-261003-jbt):` summarising "accept multi-line contact messages, reject non-string POST fields, add executed php-cli tests".
  </action>
  <verify>
    <automated>npx vitest run tests/unit/contact-php.test.ts && AJS_PHP_BIN=/nonexistent/php npx vitest run tests/unit/contact-php.test.ts && php -l public/contact.php && npm run lint</automated>
  </verify>
  <done>Multi-line messages reach the captured mail intact (HTTP 200, success true); CR/LF in name or email gives 400 and no mail; array input in any field gives JSON 400 with PHP exit status 0; array honeypot gives silent success with no mail; with AJS_PHP_BIN pointing at nothing the executed suite is skipped and the file still passes; all pre-existing tests green; one commit containing exactly public/contact.php and tests/unit/contact-php.test.ts.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Astro 7.3.5, pull_request CI, noindex on staging, SFTP target moved to repository variables</name>
  <files>package.json, package-lock.json, .github/workflows/ci.yml, .github/workflows/deploy-ovh.yml, src/layouts/BaseLayout.astro, src/lib/robots.ts, tests/unit/robots-meta.test.ts, tests/unit/ci-workflow.test.ts, tests/unit/deploy-ovh-workflow.test.ts, README.md</files>
  <behavior>
    - robots resolver: root base (`/` or empty) with noIndex false returns exactly `index, follow, max-image-preview:large` (byte-identical to today's value); noIndex true returns `noindex, nofollow` on any base; a non-root base (with or without trailing slash, e.g. the GitHub Pages project path) returns `noindex, nofollow` even when noIndex is false.
    - BaseLayout wiring: the layout imports the resolver, passes `import.meta.env.BASE_URL`, and its robots meta tag uses the resolved value; no inline index/noindex literal remains in the layout.
    - ci.yml: triggers on `pull_request` only; token permission is read-only; no secrets context; no deploy/pages/id-token permission; reuses the shared composite action and runs the unit tests with coverage thresholds.
    - deploy-ovh.yml: exactly two `username:` lines read `vars.OVH_SFTP_USER`, exactly two `server:` lines read `vars.OVH_SFTP_HOST`, both `remote_path:` lines build the path from `vars.OVH_SFTP_USER`; no `.hosting.ovh.net` hostname and no literal `/home/<account>` path anywhere in the file; the existing credential guard step (same name, still before the first SFTP step) also references both variables; the recap and completion summary no longer print a host, account or remote path.
  </behavior>
  <action>
    Four sub-steps, in this order. For 2b, 2c and 2d write the new test assertions first and see them fail before making the implementation edit. Per AUDIT-02. Task 2 touches ten files because each sub-step is a few lines; if the lockfile churn makes it preferable, land 2a as its own preceding commit with the same message prefix.

    2a. Astro bump. Run `npm install astro@^7.3.5` (keeps the caret convention this file already uses for astro). Confirm `git diff package.json` is exactly the one astro line, the lockfile's root `node_modules/astro` entry reports version 7.3.5, and no new top-level dependency appeared (the optional markdown-remark peer must not be added; if npm adds any package you did not expect, list them in the SUMMARY). Then run `npm run lint`, `npm run typecheck`, `npm run test:unit`. Then attempt a real build with only the public identifiers from the README, no token: set SANITY_PROJECT_ID to `gwz8iug4` and SANITY_DATASET to `production` on the command line and run `npm run build`. If it succeeds, keep dist/ for the check in 2b. If it fails (private dataset, no network access, missing token), copy the real error excerpt into the SUMMARY and state plainly that the production build was NOT verified in this environment for lack of a Sanity read token; do not fabricate content, do not create stub tokens or fake env values beyond those two public identifiers, and do not claim the build passed.

    2b. Staging noindex. Create `src/lib/robots.ts`, a pure module with no `astro:` imports, exporting `isStagingBase(base: string): boolean` and `resolveRobotsContent(options: { noIndex: boolean; base: string }): string`. A base is "staging" when, after trimming slashes, it is non-empty. The two output strings are exactly `noindex, nofollow` and `index, follow, max-image-preview:large` (the strings the layout emits today, so tests/e2e/seo.spec.ts and tests/e2e/not-found.spec.ts keep passing). Document in a comment why detection is base-only: the GitHub Pages deploy build is the only build with a non-root `ASTRO_BASE`; production always builds at the root even if its SITE_URL were ever omitted, so production can never be flipped to noindex by accident; and the CI test build, local preview and the SEO e2e use the root base with the default github.io `site`, so a rule keyed on the site URL would break the e2e gate. In `src/layouts/BaseLayout.astro` import the resolver, compute a `robotsContent` constant in the frontmatter from the already-destructured `noIndex` prop and `import.meta.env.BASE_URL`, and point the existing robots meta tag at it. Change nothing else in the layout. Create `tests/unit/robots-meta.test.ts` covering every behavior bullet for the resolver, plus a source-invariant block reading `src/layouts/BaseLayout.astro` as text (same pattern as tests/unit/contact-php.test.ts) asserting the import, the BASE_URL argument, and that the robots tag uses the resolved variable. If the 2a build succeeded: build once more with `ASTRO_BASE=/atelier-jacqueline-suzanne/` set, confirm `dist/index.html` and `dist/en/index.html` contain a robots meta with `noindex, nofollow`, and rebuild at the root base to confirm the homepage robots meta is unchanged from the CMS-driven value; record both results (or the not-verified statement) in the SUMMARY.

    2c. PR workflow. Create `.github/workflows/ci.yml`: workflow name "CI (pull request)"; trigger `pull_request` only, no branch filter (never the `_target` variant of that trigger, which would run untrusted PR code with secrets in scope; no push or dispatch triggers: pushes to main are already gated by the deploy workflows); a top-level `permissions` block with only `contents: read`; a `concurrency` group keyed on workflow name plus ref with `cancel-in-progress: true` so superseded PR pushes are cancelled; one job on `ubuntu-latest` with a `timeout-minutes` of 20. Steps: `actions/checkout@v4` with `persist-credentials: false`; `uses: ./.github/actions/lint-typecheck-and-install` (Node 22 setup, both `npm ci`s, Studio lint/coverage/build/typecheck, root lint, root `astro check`: the same gates the deploy workflows run, reused rather than copied, and secret-free exactly as deploy.yml already calls it); then a step running `npm run test:coverage` (Vitest with the repository's coverage thresholds). No `env` block carrying Sanity values, no Playwright, no site build, no deploy or pages/id-token permission, no `environment`. Add a header comment explaining that pull requests (especially from forks) receive no secrets by design, so the site build and Playwright e2e stay on the deploy pipelines and this workflow is the fast lint, typecheck and unit gate. Create `tests/unit/ci-workflow.test.ts` (text assertions after stripping comment lines, mirroring tests/unit/deploy-ovh-workflow.test.ts) asserting: a `pull_request:` trigger exists; the `_target` trigger variant, `push:`, `repository_dispatch` and `environment:` are all absent; `contents: read` is present and no permission is granted as `write`; no `${{ secrets` expression appears; the composite action and `npm run test:coverage` are both referenced.

    2d. SFTP target out of the workflow. In `.github/workflows/deploy-ovh.yml`: in both SFTP-Deploy-Action steps replace the hard-coded account name with `${{ vars.OVH_SFTP_USER }}` and the hard-coded cluster hostname with `${{ vars.OVH_SFTP_HOST }}`, and build each `remote_path` as `/home/${{ vars.OVH_SFTP_USER }}/www` (the account name is embedded in the remote path as well, so it must come from the variable too). Extend the existing credential-guard step: keep its name and position exactly (the existing test and its ordering assertion depend on both) but map the two variables into its `env` and fail with a clear `::error::` message naming whichever variable is empty, never printing a value; an unset variable resolves to an empty string, the same failure mode that guard already handles for the password. In the build job's "Deploy recap" step remove the target-host line and the remote-path line, replacing them with one neutral line saying the SFTP target is read from repository variables; reword the "Deploy complete" summary so it names no host, account or path. Update the explanatory comments in the file that mention the host or path, and leave every other line (action SHA pins, triggers, environments, concurrency, include-hidden-files, the dotfile step) untouched. Update `tests/unit/deploy-ovh-workflow.test.ts`: keep every existing assertion, and add ones for each deploy-ovh.yml behavior bullet above (use regexes such as a generic `.hosting.ovh.net` hostname pattern and a `/home/` path whose next segment is not a `${{` expression, so the test file itself needs no account literal). README.md, one edit pass: (i) in "Production deploy: one-time setup" change the "six things" count to seven and add an item documenting the two repository Actions variables, `OVH_SFTP_HOST` and `OVH_SFTP_USER`, created with `gh variable set <NAME> --body '<value>'` at repository level (not environment-scoped, so the build job and both environments see them), values taken from OVH Control Panel Web Cloud -> Hosting plans -> FTP - SSH, described by generic angle-bracket text rather than the real values, noting they are variables not secrets because they are identifiers that only need to stay out of the tracked workflow file, and that they must exist before the next production run or the credential guard fails the run; (ii) replace the literal account-name mentions in the existing setup items that refer to the SFTP user and the hosting plan with generic wording that points at `OVH_SFTP_USER`; (iii) add one sentence in the Deployments section that `.github/workflows/ci.yml` runs lint, typecheck and unit tests on every pull request with a read-only token and no secrets; (iv) extend the `ASTRO_BASE` row of the environment-variables table with a note that a non-root base marks the build as staging and makes every page emit a noindex robots meta.

    Finish: `npm run lint`, `npm run typecheck`, `npm run test:coverage` (proves the new src/lib/robots.ts stays above the coverage thresholds). Commit only the files listed in this task's `<files>` with prefix `chore(quick-261003-jbt):` summarising the four changes.
  </action>
  <verify>
    <automated>npm run lint && npm run typecheck && npx vitest run tests/unit/robots-meta.test.ts tests/unit/ci-workflow.test.ts tests/unit/deploy-ovh-workflow.test.ts && npm run test:coverage && grep -q '"astro": "\^7.3.5"' package.json && ! grep -nE 'atelihu|cluster129' .github/workflows/deploy-ovh.yml README.md</automated>
  </verify>
  <done>package.json and package-lock.json resolve astro 7.3.5 with a lockfile diff limited to astro's own tree; lint, typecheck, unit tests and coverage thresholds pass; the build outcome (or the explicit not-verified statement) is recorded; ci.yml exists and its safety invariants are test-enforced; the robots resolver and layout wiring are unit-tested and root-base output is unchanged; deploy-ovh.yml and README contain no SFTP host or account literal and the guard covers both variables; README documents the two repository variables, the PR workflow and the staging noindex; one commit with exactly the listed files.</done>
</task>

<task type="auto">
  <name>Task 3: Licences, security policy, README Licence section, untrack local Claude settings</name>
  <files>LICENSE, LICENSE-CONTENT.md, SECURITY.md, README.md, .gitignore, .claude/settings.local.json</files>
  <action>
    Per AUDIT-03. Documentation and hygiene only; no code changes.

    1. `LICENSE`: the standard, unmodified MIT License text (title line `MIT License`), with the copyright line `Copyright (c) 2026 Florian Lepont`. It covers the software source code only; the content carve-out lives in the next file and in the README.

    2. `LICENSE-CONTENT.md`: a rights notice, written in English followed by a French version of the same text (the rights holder and her audience are French). Content: all photographs and artworks, all texts (site copy, biography, descriptions, exhibition and agenda entries), the logos and wordmark, and the Atelier Jacqueline Suzanne name and visual identity are (c) Romane Lepont, all rights reserved. They are NOT covered by the MIT licence on the code, wherever they appear: files in this repository (for example the assets under `public/` and any copy shipped in `src/`), the published website, and content stored in the Sanity dataset. No reproduction, distribution, public display, modification or other use without prior written permission. Include an explicit AI and text-and-data-mining reservation: the rights holder reserves her rights, including the opt-out from text and data mining, under Article 4 of Directive (EU) 2019/790 and article L122-5-3 of the French Code de la propriete intellectuelle (cite only these two provisions and add no other legal citations); no use of the content to train, fine-tune or evaluate machine-learning or generative-AI models, to build datasets, or for automated scraping, without written permission. Permission requests and questions go to contact@atelierjacquelinesuzanne.fr. Keep it to roughly one screen per language; do not add a copyright year, do not invent contact details beyond that address.

    3. `SECURITY.md`: how to report a vulnerability. Two channels: GitHub private vulnerability reporting (the repository's Security tab, "Report a vulnerability") or email to contact@atelierjacquelinesuzanne.fr; ask reporters not to open public issues or pull requests for vulnerabilities and not to include real secrets in reports. State scope: this repository's website code, the `public/contact.php` endpoint, and the CI/deploy workflows; vulnerabilities in third-party services (Sanity, GitHub, OVH) belong with those vendors. State that only the code on the `main` branch and the live site are supported, that this is a small personal project with best-effort responses and no bug bounty. Do not state any response-time guarantee and do not name any other email address. The GitHub private-reporting channel only works once the owner enables it in repository settings: do NOT change that setting; the SUMMARY must flag it as a pending owner action.

    4. `README.md`: add a `## Licence` section immediately before the existing `## Author` section: code is MIT (link `LICENSE`); photographs, texts, logos and brand are (c) Romane Lepont, all rights reserved, including the AI/TDM reservation (link `LICENSE-CONTENT.md`); a one-line pointer to `SECURITY.md` for vulnerability reports. Do not change any other README text (Task 2 already edited it).

    5. Local settings hygiene. Run `git rm --cached .claude/settings.local.json` (index only: the file must remain on disk, the user's local setup depends on it). Add a short comment and the path `.claude/settings.local.json` to `.gitignore` under its own heading, leaving every other `.gitignore` line alone. Do not modify, add or delete any other file under `.claude/` (the shared `.claude/settings.json` stays tracked) and do not touch `.planning/`. The file stays in git history; do not rewrite history. Mention in the SUMMARY that it contained a developer-machine absolute path.

    6. Commit with prefix `docs(quick-261003-jbt):` (summary: add MIT licence, content-rights notice and security policy; untrack local Claude settings). Stage explicitly: `git add LICENSE LICENSE-CONTENT.md SECURITY.md README.md .gitignore` (the index removal is already staged by the `git rm --cached`). Before committing, check `git status --short` shows nothing unexpected staged (in particular no `.planning/` paths).
  </action>
  <verify>
    <automated>test -f LICENSE && test -f LICENSE-CONTENT.md && test -f SECURITY.md && grep -q 'MIT License' LICENSE && grep -q 'Copyright (c) 2026 Florian Lepont' LICENSE && grep -q 'contact@atelierjacquelinesuzanne.fr' LICENSE-CONTENT.md && grep -q 'contact@atelierjacquelinesuzanne.fr' SECURITY.md && grep -q '^## Licence' README.md && test -f .claude/settings.local.json && test -z "$(git ls-files .claude/settings.local.json)" && git check-ignore -q .claude/settings.local.json && git ls-files --error-unmatch .claude/settings.json >/dev/null</automated>
  </verify>
  <done>LICENSE (MIT, 2026 Florian Lepont), LICENSE-CONTENT.md (all rights reserved, Romane Lepont, AI/TDM reservation, contact address), SECURITY.md and the README Licence section exist; settings.local.json is untracked, still on disk and ignored while settings.json stays tracked; one commit staged explicitly with no .planning/ or other .claude/ paths.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser / anonymous caller -> public/contact.php | Every form field is untrusted; values are interpolated into a mail body and a Reply-To header |
| Pull request (including forks) -> GitHub Actions | Untrusted code runs in CI; must not have secrets or write tokens in scope |
| Repo -> public web (workflow files, README) | Everything tracked in this public repository is world-readable |
| npm registry -> build | Dependency bump pulls code that runs at build and in CI |
| Public staging host -> search engines | GitHub Pages mirror is crawlable unless it opts out |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-jbt-01 | Tampering | contact.php header injection via CR/LF in name or email | high | mitigate | CR/LF rejection retained for name and email, evaluated before any header string is built and ahead of the mail call; executed php-cli tests cover CR and LF in each field |
| T-jbt-02 | Tampering | multi-line message now permitted | low | accept | The message is only placed in the body after the blank line, where a line break cannot create a header; the test asserts the header region contains none of the message text |
| T-jbt-03 | Denial of Service | array-valued POST field causes uncaught TypeError (HTTP 500 on the real host) | medium | mitigate | `is_string` guard in a single read helper; non-string name/email/message returns JSON 400, non-string honeypot is treated as filled; executed test asserts exit status 0 and JSON failure |
| T-jbt-04 | Information Disclosure | GitHub Pages staging mirror indexed alongside the real domain | low | mitigate | Non-root base emits `noindex, nofollow` on every page; unit-tested resolver plus layout-wiring assertion; production (root base) path unchanged |
| T-jbt-05 | Elevation of Privilege | new pull_request workflow running untrusted PR code | high | mitigate | `pull_request` trigger only (never the `_target` variant), `permissions: contents: read`, no secrets, no environment, no deploy/pages/id-token permission, checkout with `persist-credentials: false`; all enforced by tests/unit/ci-workflow.test.ts |
| T-jbt-06 | Information Disclosure | SFTP host and account name published in tracked workflow and README | low | mitigate | Moved to repository variables; guard fails loudly when unset; recap and completion summary no longer echo them; test asserts no hostname or literal home path in the workflow. Residual: values remain in git history and `.planning/` (accepted, not rewritten) |
| T-jbt-07 | Information Disclosure | per-machine .claude/settings.local.json tracked (developer-machine absolute path) | low | mitigate | Untracked via `git rm --cached` and ignored; remains in history (accepted) |
| T-jbt-08 | Repudiation / Tampering | repo reuse without clear terms (photos/texts/brand reused or scraped for AI) | low | mitigate | LICENSE (code only) plus LICENSE-CONTENT.md reserving all rights and TDM/AI opt-out |
| T-jbt-SC | Tampering | npm install of astro 7.3.5 (supply chain) | low | accept | Not a new package: same package name, official maintainers, already a locked dependency, optional peer not added. Mitigations: caret range kept, lockfile integrity hashes reviewed in the diff, diff confined to astro's own tree, no new top-level dependency. The new-package legitimacy checkpoint is intentionally not triggered because no unaudited package is introduced |
</threat_model>

<verification>
Run in this order after all three tasks (each command is also in the task's own verify):
1. `npm run lint && npm run typecheck && npm run test:coverage` all pass on astro 7.3.5.
2. `npx vitest run tests/unit/contact-php.test.ts` passes with the executed suite active; with `AJS_PHP_BIN=/nonexistent/php` the executed suite is skipped, the file still passes.
3. `git log --oneline -3` shows exactly three new commits (or four if the astro bump was isolated), prefixes `fix(quick-261003-jbt)`, `chore(quick-261003-jbt)`, `docs(quick-261003-jbt)`, no model name in any message (`git log -3 --format=%B`).
4. `git status --short` shows no tracked-file modifications left over; `.planning/` untouched apart from the new SUMMARY; `.claude/settings.local.json` present on disk.
5. Build status is stated plainly in the SUMMARY: verified (with the two public identifiers) or not verified for lack of a Sanity read token, with the real error excerpt.
</verification>

<success_criteria>
- All ten must_haves truths hold and are evidenced (executed tests, resolver tests, workflow-text tests, git/grep checks).
- Three focused atomic commits on branch claude/kind-cannon-2myct1; nothing pushed.
- SUMMARY lists the pending owner actions: create the two repository variables `OVH_SFTP_HOST` and `OVH_SFTP_USER` before the next production deploy; enable GitHub private vulnerability reporting; and notes that the SFTP values and the settings file persist in git history and `.planning/`.
</success_criteria>

<output>
Create `.planning/quick/261003-jbt-corrections-audit-contact-php-astro-7-3-/261003-jbt-SUMMARY.md` when done (the only write allowed under `.planning/`; leave STATE.md bookkeeping to the orchestrator).
</output>
