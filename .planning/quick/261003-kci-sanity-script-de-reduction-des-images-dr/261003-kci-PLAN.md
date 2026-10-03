---
phase: quick-261003-kci
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/lib/sanity-image-downsize.mjs
  - scripts/sanity-downsize-images.mjs
  - tests/unit/sanity-image-downsize.test.ts
  - docs/reduction-images-sanity.md
  - package.json
  - package-lock.json
  - eslint.config.mjs
  - README.md
  - src/lib/static-routes.ts
  - tests/unit/static-routes.test.ts
  - tests/scripts/verify-static-artifact.mjs
  - tests/e2e/seo.spec.ts
autonomous: true
requirements: [IMG-DOWNSIZE-01, ROBOTS-AI-01]

must_haves:
  truths:
    - "Running the CLI with no flags is a read-only dry-run: it lists every Sanity image asset wider than the threshold (default 2400 px) with file name, dimensions (current and target) and the documents that reference it, using only the public dataset (no write token needed), and performs no upload, patch or delete."
    - "The CLI refuses, before any network call, to run with --apply unless BOTH the --i-have-a-backup flag AND the SANITY_WRITE_TOKEN environment variable are present, and refuses --delete-originals unless --apply is also given; --threshold, --dataset and --project-id are supported with SANITY_PROJECT_ID / SANITY_DATASET as env fallbacks."
    - "--apply downloads each oversized original, resizes it to at most the threshold in width (never upscales, aspect ratio kept), uploads the reduced image preserving originalFilename, repoints every asset reference to the old asset id (drafts and published documents both, found by walking the document JSON) in one revision-guarded transaction per asset, and deletes nothing."
    - "--delete-originals deletes old assets only after re-checking, right before deleting, that every one of them has zero remaining references; any remaining reference, any failed replacement, or any unverifiable count aborts ALL deletion."
    - "The write token is read only from the environment, is never hardcoded, never printed, and every error message that reaches the console has the token value redacted."
    - "A French documentation page, linked from the README, walks through: export a backup with `sanity dataset export`, confirm full-resolution originals exist in Lightroom, run the dry-run, review it, run --apply, verify the site, and only then run --delete-originals; it warns that the CDN may keep deleted assets cached briefly."
    - "Vitest unit tests cover the pure logic with no network: threshold selection, target-dimension math (no upscaling, aspect kept), reference walking and patch building, flag validation, deletion-safety assessment, secret redaction, dry-run report formatting."
    - "robots.txt emits a `User-agent` block with `Disallow: /` for GPTBot, ChatGPT-User, OAI-SearchBot, CCBot, Google-Extended, anthropic-ai, ClaudeBot, Claude-Web, Bytespider, PerplexityBot and Applebot-Extended, while the existing generic `User-agent: *` / `Allow: /` block and the Sitemap line stay intact; this is documented as a deterrent, not an enforcement."
  artifacts:
    - scripts/lib/sanity-image-downsize.mjs      # pure, importable ES module (all logic worth testing)
    - scripts/sanity-downsize-images.mjs         # thin CLI: argv/env -> pure module -> @sanity/client + sharp
    - tests/unit/sanity-image-downsize.test.ts   # Vitest, no network
    - docs/reduction-images-sanity.md            # French runbook linked from README
    - package.json                               # sharp devDependency + sanity:downsize-images script
    - package-lock.json                          # only the root devDependencies entry (+ sharp's dev/optional flags) changes
    - eslint.config.mjs                          # Node globals block for scripts/**/*.mjs
    - src/lib/static-routes.ts                   # AI_CRAWLER_USER_AGENTS + buildRobotsText
    - tests/unit/static-routes.test.ts           # robots.txt group assertions
    - tests/scripts/verify-static-artifact.mjs   # build-level robots.txt assertion
    - tests/e2e/seo.spec.ts                      # served robots.txt assertion
  key_links:
    - "scripts/sanity-downsize-images.mjs MUST call resolveCliOptions() and exit on errors BEFORE importing @sanity/client or sharp and before creating any client: the usage-error exit paths are what the verify commands exercise offline, and that ordering is what guarantees 'refuses before any network call'."
    - "The dry-run code path receives a read-only facade exposing only `fetch` (never the full client): write capability is absent by construction, not by discipline. Only the apply path receives the full client."
    - "package.json `sharp` devDependency <-> package-lock.json: sharp is ALREADY locked at 0.35.5 as astro's optional dependency; the lock diff must touch only the root package's devDependencies and sharp's flags, with no new node_modules entry. `npm ci` (CI) fails if package.json and the lockfile disagree."
    - "README.md: tests/unit/publishing-docs.test.ts finds the webhook filter by the FIRST README line containing the marker `_type in [`; new README rows must not contain that marker, and the runbook lives in docs/ (linked), not inlined."
    - "src/lib/static-routes.ts buildRobotsText <-> src/pages/robots.txt.ts (unchanged, delegates) <-> tests/scripts/verify-static-artifact.mjs + scripts/launch-smoke-check.sh: both existing checks look for `${base}sitemap.xml` inside the text, so the Sitemap line must stay present and base-aware."
---

<objective>
Ship two independent, self-contained improvements, each as its own atomic commit on branch `claude/kind-cannon-2myct1`:

1. Task 1 (IMG-DOWNSIZE-01): a safe-by-default tool that shrinks the oversized images stored in Sanity (anything wider than 2400 px) without changing how the site looks. Pure logic in an importable ES module (fully unit-tested, no network), a thin CLI, a French runbook.
2. Task 2 (ROBOTS-AI-01): opt the known AI-training crawlers out of the site via robots.txt, keeping search engines welcome.

Purpose: Task 1 cuts storage weight on the free Sanity plan; it has to be impossible to run destructively by accident, because it edits and (optionally) deletes production assets. Task 2 is a low-cost deterrent against content scraping for a photographer whose work is the product.

Output: the files listed in the frontmatter. NOTHING in this plan touches `.github/`, `.claude/`, `src/pages/mentions-legales*` or `src/pages/confidentialite*` or their `en/` counterparts.

Hard rule for execution: do NOT run the CLI in any mode that reaches the network. Dry-run included. Offline verification uses only `--help` and invocations that must fail argument validation (exit 2) before any client is created.
</objective>

<execution_context>
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/workflows/execute-plan.md
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/lib/static-routes.ts
@src/pages/robots.txt.ts
@tests/unit/static-routes.test.ts
@tests/scripts/verify-static-artifact.mjs
@tests/e2e/seo.spec.ts
@eslint.config.mjs
@vitest.config.ts
@package.json
@README.md
@src/lib/sanity.ts

Facts established while planning (do not re-derive):
- Root `package.json` is ESM (`"type": "module"`), already depends on `@sanity/client` 7.23.0 (exact) and has Vitest (`tests/unit/**/*.test.ts`, node env), ESLint flat config and `astro check`. `sanity/package.json` declares none of these, so the script is hosted at the ROOT. `sharp` 0.35.5 is installed at the root only because astro lists `"sharp": "^0.35.4"` as an optional dependency (lock marks it optional). Node is 22 (README + CI), so `node:util` `parseArgs`, global `fetch`, `AbortSignal.timeout` and `process.loadEnvFile` are all available.
- Root tsconfig extends `astro/tsconfigs/strict` with `allowJs: true` and `moduleResolution: Bundler`, so a `.ts` test can import a `.mjs` module and gets types inferred from JSDoc. Root ESLint (`js.configs.recommended` + typescript-eslint recommended) flags `no-undef` for Node globals in `.mjs` unless declared: `tests/scripts/**/*.mjs` already has such a block, `scripts/**/*.mjs` does not. In `.ts` tests, `any` is a lint error.
- Image fields in the Studio schema (gallery images[], edition images[], aboutPage image, seo image, exhibition image) all store `asset: {_type: 'reference', _ref: 'image-<sha1>-<W>x<H>-<ext>'}`; the script must NOT hardcode these field names, it finds references generically with GROQ `references($assetId)` and a JSON walk. Hotspot/crop are stored as fractions, so they stay valid when an image is resized with the aspect ratio preserved.
- The Sanity webhook (Drafts and Versions unchecked) fires on published-document changes, so a real `--apply` triggers site rebuilds. That is expected; the runbook says so.
- `src/pages/robots.txt.ts` just returns `buildRobotsText(origin, import.meta.env.BASE_URL)`; the current text is `User-agent: *`, `Allow: /`, blank line, `Sitemap: <url>`; tests/e2e/seo.spec.ts asserts it contains `Sitemap: https://`; verify-static-artifact.mjs asserts it contains `${expectedBase}sitemap.xml`; launch-smoke-check.sh probes the same substring.
- No `.env.example` exists, `.env` is gitignored, `.planning/` and `.claude/` are ESLint-ignored. The public Sanity project id `gwz8iug4` and dataset `production` already appear in README.md and may be used in docs examples.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Sanity image downsizing tool (pure module, thin CLI, unit tests, French runbook), dry-run by default</name>
  <files>scripts/lib/sanity-image-downsize.mjs, scripts/sanity-downsize-images.mjs, tests/unit/sanity-image-downsize.test.ts, docs/reduction-images-sanity.md, package.json, package-lock.json, eslint.config.mjs, README.md</files>
  <behavior>
    Selection (selectOversizedAssets): width strictly greater than the threshold is selected; width equal to the threshold is not; default threshold 2400; a custom threshold changes the cut; unsupported mime types (SVG, GIF, anything outside JPEG/PNG/WebP) wider than the threshold land in `skipped` with reason UNSUPPORTED_FORMAT; unknown/missing width lands in `skipped` with reason UNKNOWN_DIMENSIONS; small images appear in neither list; order is deterministic (width descending, then id); the input array is not mutated.
    Target math (computeTargetDimensions): 6000x4000 with max 2400 gives 2400x1600; portrait 4000x6000 gives 2400x3600 (width-driven); an image at or under the max is returned unchanged (never upscaled); height is rounded and the aspect ratio holds within 1 px; zero, negative, NaN or non-number inputs throw.
    Reference walking (findReferencePaths / planReferencePatches): a top-level image field gives a path like `image.asset._ref`; an array member with a `_key` gives `images[_key=="k1"].asset._ref`; an array member without `_key` falls back to `images[2].asset._ref`; nested arrays/objects are walked; the same asset used twice in one document yields two paths in ONE patch; only objects with `_type: 'reference'` and `_ref` equal to the old id match (a plain string equal to the id, or a reference to a different asset, is ignored); a draft and its published twin each get their own patch carrying their own `_rev` as `ifRevisionID`; every `set` value is the new asset id; a document returned by GROQ but with no matching path, a missing `_rev`, or an unsupported key shape is reported in `unpatchable` instead of patched; the input documents are not mutated.
    Asset ids (parseImageAssetId): `image-<hash>-2400x1600-jpg` parses to hash/width/height/extension; a malformed id returns null.
    CLI options (resolveCliOptions, pure: takes argv array and env object, touches nothing global): no flags = dry-run with threshold 2400 and project/dataset from env; `--project-id`/`--dataset` override env; missing project id or dataset gives MISSING_PROJECT_ID / MISSING_DATASET; `--threshold` accepts integers >= 800 only (INVALID_THRESHOLD for abc, 0, 799, 2400.5, negatives); `--apply` without `--i-have-a-backup` gives APPLY_REQUIRES_BACKUP_FLAG; `--apply` without SANITY_WRITE_TOKEN gives APPLY_REQUIRES_WRITE_TOKEN (both reported together when both are missing); `--apply` with both is valid and carries the token; `--delete-originals` without `--apply` gives DELETE_REQUIRES_APPLY; `--apply --i-have-a-backup --delete-originals` with a token is valid; a dry-run result NEVER carries the write token even when env has one; an unknown flag gives UNKNOWN_OPTION; `--help` gives a help result; no error object or message ever contains the token value.
    Deletion safety (assessDeletionSafety): safe only when every old asset id has a numeric remaining-reference count of exactly 0 and no old asset is in the failed list; a missing/undefined count is a blocker (fail closed); a count above 0 is a blocker STILL_REFERENCED; a failed id is a blocker REPLACEMENT_FAILED; an empty candidate list is safe.
    Secrets (redactSecrets / describeError): every occurrence of each secret is replaced with a fixed marker; empty/undefined secrets are ignored; non-Error throwables are stringified safely.
    Report (formatDryRunReport): returns lines containing, per asset, the file name, `WxH`, the target `WxH`, and the referencing document ids with types; an asset with no referencing document is labelled as ignored by --apply; the skipped list is summarised; the empty case prints a clear "nothing to do" line.
    Docs contract: docs/reduction-images-sanity.md exists and contains `sanity dataset export`, `--i-have-a-backup`, `--apply`, `--delete-originals`, `Lightroom` and `CDN`; README.md links to it.
  </behavior>
  <action>
**Where it lives and why.** Host everything at the repo ROOT (not in `sanity/`): `@sanity/client`, Vitest (`tests/unit`) and the ESLint/typecheck gates are all declared there. Plain `.mjs` files (not TypeScript) because the CLI must run with bare `node` on Node 22 with no TS loader in the repo. Put the pure module in `scripts/lib/sanity-image-downsize.mjs` and the CLI in `scripts/sanity-downsize-images.mjs`. Both start with the `// @ts-check` pragma and give every exported function JSDoc `@param`/`@returns` types; keep input typedefs permissive (optional fields) so the tests can pass partial fixtures. If `// @ts-check` on the CLI produces only non-actionable errors from third-party typings, remove it from the CLI file only and say so in the SUMMARY.

**Write the tests first (tdd).** Create `tests/unit/sanity-image-downsize.test.ts` from the behavior block above, importing from `../../scripts/lib/sanity-image-downsize.mjs`. Assert on error CODES, not message text. Use no `any` (lint error). No network, no `process` access, no sharp import. Include a small source-text "docs contract" describe block in the style of tests/unit/publishing-docs.test.ts (readFileSync the runbook and README).

**Pure module exports (names are fixed so tests and CLI agree).**
- Constants: DEFAULT_THRESHOLD = 2400, MIN_THRESHOLD = 800, RESIZABLE_MIME_TYPES = image/jpeg, image/png, image/webp, OUTPUT_QUALITY = 90, REDACTED marker string.
- selectOversizedAssets(assets, threshold = DEFAULT_THRESHOLD) returns `{oversized, skipped}`. Input assets come from the GROQ projection `_id, originalFilename, mimeType, extension, size, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height`. Selection depends ONLY on width and mime type, never on references (the CLI relies on this: after a successful --apply the old assets are still "oversized" and are exactly what a later --delete-originals run must find).
- computeTargetDimensions({width, height}, maxWidth = DEFAULT_THRESHOLD) returns `{width, height}`. Width-driven scale, `Math.round` on height, minimum 1, unchanged when width <= maxWidth, RangeError on invalid input.
- findReferencePaths(value, assetId) walks arbitrary JSON (objects, arrays, nested) and returns Sanity patch-path strings, each ending in `._ref`, for every object with `_type === 'reference'` and `_ref === assetId`. Do not descend into a matched reference object. Path syntax: object keys joined with dots; an array member with a string `_key` becomes `[_key=="<JSON-escaped key>"]`; otherwise `[<index>]`. An object key not matching `^[A-Za-z_][A-Za-z0-9_]*$` on a matching path must make that document unpatchable (fail closed) rather than emit a malformed path.
- planReferencePatches(documents, oldAssetId, newAssetId) returns `{patches, unpatchable}`; each patch is `{documentId, ifRevisionID, set}` where `set` maps every found path to newAssetId; a document with zero found paths, no `_rev`, or an unsupported key shape goes to `unpatchable` (as its `_id`). Drafts need no special casing: GROQ returns `drafts.<id>` documents as separate documents and each is planned independently.
- parseImageAssetId(assetId) returns `{hash, width, height, extension}` or null.
- resolveCliOptions(argv, env) uses `node:util` `parseArgs` in strict mode (no positionals) with options apply, i-have-a-backup, delete-originals, threshold, dataset, project-id, help. Return `{ok: true, help: true}` for --help, `{ok: true, options}` or `{ok: false, errors: [{code, message}]}`. `options` = `{apply, deleteOriginals, threshold, projectId, dataset, writeToken, readToken}`; `writeToken` is populated ONLY when `apply` is true (dry-run never even holds it); `readToken` comes from the optional env SANITY_API_READ_TOKEN (already a repo env var) so a dry-run can see drafts when the maintainer provides it. Project id and dataset: flag first, then env SANITY_PROJECT_ID / SANITY_DATASET, same names the Astro build uses. Report ALL validation errors together, not just the first. Messages are in French and never include a token value. Also export a USAGE_TEXT string (French) used by --help and by usage errors.
- assessDeletionSafety({assetIds, remainingReferenceCounts, failedAssetIds}) returns `{safe, blockers}` per the behavior block; fail closed.
- redactSecrets(text, secrets) and describeError(error, secrets): the single place every printed error passes through.
- formatDryRunReport({rows, skipped, threshold}) returns an array of lines (plain padded columns, no extra dependency) where each row is `{asset, target, documents}`; also print totals and a one-line hint that drafts are only listed when SANITY_API_READ_TOKEN is provided. Keep byte formatting (human-readable Mo) as a small private helper.

**Dependency.** Declare `sharp` as a devDependency of the ROOT package.json with the range `^0.35.4` (the exact range astro already declares; the lock already resolves 0.35.5). Run `npm install --save-dev sharp@^0.35.4`; if the registry is unreachable retry with `--offline`; if both fail, edit only the root `packages[""].devDependencies` in package-lock.json by hand. Then confirm with `git diff package-lock.json` that no new `node_modules/*` entry appeared and sharp still resolves to 0.35.5 with the same integrity hash, and that `npm ci --dry-run` succeeds (package.json and lockfile in sync). Do not use a different sharp version. Add the npm script `"sanity:downsize-images": "node scripts/sanity-downsize-images.mjs"` to package.json.

**ESLint.** In eslint.config.mjs add a config block for `scripts/**/*.mjs` declaring read-only globals process, console, fetch, Buffer, URL, AbortSignal (mirror the existing `tests/scripts/**/*.mjs` block and add a comment saying these are plain-Node maintenance scripts).

**CLI (thin, French output).** Flow, in this order:
1. Optionally call `process.loadEnvFile()` inside a try/catch that ignores a missing `.env` (it never overrides variables already set), so SANITY_PROJECT_ID / SANITY_DATASET resolve from the repo's `.env` like the Astro build.
2. `resolveCliOptions(process.argv.slice(2), process.env)`. `--help` prints USAGE_TEXT and exits 0. Errors print each message plus the usage hint to stderr and exit 2. This happens BEFORE any dynamic `import()` of `@sanity/client` or `sharp`; both are imported lazily afterwards (so `--help` and usage errors load neither).
3. Create the client with `createClient({projectId, dataset, apiVersion: '2024-01-01' (same as src/lib/sanity.ts), useCdn: false, perspective: 'raw'` so drafts are returned when the token can see them`, token: apply ? writeToken : readToken (omit when undefined)})`.
4. Fetch all `sanity.imageAsset` documents with the projection above, run selectOversizedAssets, then for each oversized asset fetch the referencing documents with the GROQ `*[references($assetId)]` (pass the id as a parameter, never interpolate it) and compute the target dimensions.
5. DRY-RUN (default): hand the dry-run function a read-only facade object exposing ONLY `fetch`, never the client, so write capability is absent by construction. Print formatDryRunReport, then a next-steps hint pointing at the runbook. Exit 0. Never create the sharp import in this path.
6. APPLY: for each oversized asset that has at least one referencing document (unreferenced oversized assets are reported and left untouched by the replace step): download `asset.url` with `fetch` and `AbortSignal.timeout`, compare the byte length to `asset.size` when known (mismatch = fail this asset); run sharp with auto-orient, `resize({width: target.width, withoutEnlargement: true})`, keep the ICC colour profile (drop EXIF, which also drops GPS and avoids a stale orientation tag), re-encode in the SAME format (JPEG with quality OUTPUT_QUALITY and mozjpeg, WebP with OUTPUT_QUALITY, PNG lossless), and take `info` from `toBuffer({resolveWithObject: true})`; fail the asset unless output width equals the target width and height is within 1 px of the target height. Upload with `client.assets.upload('image', buffer, {filename: asset.originalFilename (fallback: derived from the id), contentType: asset.mimeType})`. Fail the asset unless the new id differs from the old id and `parseImageAssetId(newId)` reports exactly the sharp output dimensions. THEN re-fetch the referencing documents (fresh `_rev`, the upload took time), `planReferencePatches`, fail the asset if `unpatchable` is non-empty, and commit ONE `client.transaction()` containing a `patch(documentId, {set, ifRevisionID})` per document. After the commit re-count remaining references to the old id; non-zero marks the asset failed. A per-asset failure is recorded (message through describeError with the write token as a secret) and the loop continues; the run exits 1 at the end if anything failed. The apply path deletes NOTHING. Print a per-asset result table (old id, new id, documents patched, status).
7. DELETE (only when `--delete-originals`, only after the loop): the candidates are ALL oversized assets selected in step 4, including ones that were already orphaned by an earlier run (this is what makes the documented two-step flow work: apply, verify the site, then run again with `--apply --i-have-a-backup --delete-originals`). Print the candidate list, freshly re-count references for each candidate with `count(*[references($assetId)])`, feed everything to assessDeletionSafety together with the ids that failed in this run, and if not safe print every blocker and exit 1 having deleted nothing. If safe, delete each asset with `client.delete(assetId)`, reporting each result; a deletion error is reported and does not stop the others (Sanity also refuses to delete still-referenced assets, a second line of defence).
8. No code path ever prints the token, `client.config()`, or a raw error object; everything printed from a catch block goes through describeError.

**Runbook (French).** Create `docs/reduction-images-sanity.md`. Sections: purpose and what changes (storage weight only, the site looks the same: aspect ratio kept so crop/hotspot stay valid, widths only, JPEG/PNG/WebP only, SVG and GIF ignored); BEFORE starting (1. export a full backup with `npx sanity dataset export production ./sauvegarde-AAAA-MM-JJ.tar.gz` run from `sanity/` after `npx sanity login`, check the archive exists and is large because assets are included; 2. confirm the full-resolution originals really exist in Lightroom; 3. create a TEMPORARY Sanity API token with Editor rights at https://www.sanity.io/manage, export it as SANITY_WRITE_TOKEN for the session only, revoke it afterwards, never put it in `.env` or the repo); step 1 dry-run command and how to read the table (drafts only visible with SANITY_API_READ_TOKEN; rows with zero documents are ignored by --apply); step 2 `--apply --i-have-a-backup` (what it does, that nothing is deleted, that patched published documents trigger the normal site rebuild webhook, that it is safe to re-run); step 3 verify the site and the Studio (galleries, éditions, À propos, thumbnails, crops, also `grep -rn "cdn.sanity.io" src public` for any hardcoded asset URL, which the script cannot see); step 4 `--apply --i-have-a-backup --delete-originals` only after verification (refuses if any reference remains, irreversible apart from the backup, also deletes unused oversized images from the media library, the CDN may keep serving a deleted asset from cache for a short while); an options and environment variables table (--threshold, --dataset, --project-id, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_READ_TOKEN, SANITY_WRITE_TOKEN); exit codes 0/1/2; how to restore from the backup with `sanity dataset import`. Use project `gwz8iug4` and dataset `production` in examples.

**README.** Add one row to the Scripts table: `npm run sanity:downsize-images`, a maintenance script that is a read-only dry-run by default, linking to `docs/reduction-images-sanity.md` (French). Add one row to the Environment variables table: `SANITY_WRITE_TOKEN`, optional, used only by that maintenance script's `--apply`, never needed for builds, names only. Neither added line may contain the marker `_type in [`.

**Commit.** One atomic commit containing exactly the Task 1 files: `feat(quick-261003-kci): add Sanity image downsizing script, dry-run by default`. The only trailer is `Claude-Session: https://claude.ai/code/session_01U8V1i15iTkwxadMvZXmpnd` (no model name, per the brief). Never pass `--no-verify`. Do not run the CLI against the network in any mode.
  </action>
  <verify>
    <automated>npx vitest run tests/unit/sanity-image-downsize.test.ts && npm run lint && npm run typecheck && node scripts/sanity-downsize-images.mjs --help && (env -u SANITY_WRITE_TOKEN node scripts/sanity-downsize-images.mjs --project-id p --dataset d --apply; test $? -eq 2) && (env -u SANITY_WRITE_TOKEN node scripts/sanity-downsize-images.mjs --project-id p --dataset d --apply --i-have-a-backup; test $? -eq 2) && (node scripts/sanity-downsize-images.mjs --project-id p --dataset d --delete-originals; test $? -eq 2) && npm run test:unit && npm ci --dry-run</automated>
  </verify>
  <done>
Unit tests for the downsizing module pass with no network. `npm run lint`, `npm run typecheck` and the full `npm run test:unit` pass. `--help` exits 0; `--apply` without the backup flag, `--apply --i-have-a-backup` without a token, and `--delete-originals` without `--apply` each exit 2 before any client is created (no network was touched). `npm ci --dry-run` succeeds and `git diff package-lock.json` shows no new package entries and sharp unchanged at 0.35.5. `sharp` is a root devDependency; `npm run sanity:downsize-images` exists; ESLint declares Node globals for `scripts/**/*.mjs`. docs/reduction-images-sanity.md exists in French with the backup-first, Lightroom, dry-run, apply, verify, delete-originals order and the CDN caveat, and README links to it. The commit exists with only the Claude-Session trailer. The CLI was never run against the real dataset.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: robots.txt opts the AI-training crawlers out, keeping the generic allow and the Sitemap line</name>
  <files>src/lib/static-routes.ts, tests/unit/static-routes.test.ts, tests/scripts/verify-static-artifact.mjs, tests/e2e/seo.spec.ts</files>
  <behavior>
    buildRobotsText still begins with the generic group (`User-agent: *` then `Allow: /`) exactly as today, then emits one separate group per AI crawler, each being `User-agent: <name>` followed by `Disallow: /`, with groups separated by a blank line, and ends with the existing blank line plus `Sitemap: <absolute base-aware url>` and a trailing newline.
    The exported crawler list has exactly these 11 names with no duplicates: GPTBot, ChatGPT-User, OAI-SearchBot, CCBot, Google-Extended, anthropic-ai, ClaudeBot, Claude-Web, Bytespider, PerplexityBot, Applebot-Extended.
    Parsed into groups, the `*` group has `Allow: /` and no `Disallow` line (search engines are not blocked), every AI group has exactly `Disallow: /` and no `Allow`, the Sitemap line appears exactly once and last, and the Sitemap URL stays base-aware for both the project-page base and the root base.
    src/pages/robots.txt.ts still delegates to buildRobotsText (source-text guard in the existing repo style).
  </behavior>
  <action>
**Implementation (src/lib/static-routes.ts).** Export a read-only list constant named AI_CRAWLER_USER_AGENTS holding the 11 crawler tokens above, in that order. Change buildRobotsText to build: the unchanged generic group, then one group per entry of that list (a separate `User-agent` block each, not one block with many agent lines, because some simple parsers only honour the last agent line of a shared group), then the existing blank line and Sitemap line via the existing siteUrl helper. Keep the function signature and the `\n` line endings. Add a short code comment above the constant stating that this is an opt-out SIGNAL honoured by well-behaved crawlers (a deterrent, not an enforcement: it cannot technically stop a scraper that ignores it), that Google-Extended and Applebot-Extended are training opt-out tokens which do not affect Google Search or Applebot indexing, and that the AI groups do not inherit from the generic group (which is why each repeats its own rule). Do not change src/pages/robots.txt.ts.

**Tests (tests/unit/static-routes.test.ts).** Keep the existing 'builds a base-aware robots file' test untouched. Add a describe block for the robots.txt AI opt-out. Use a small local helper that splits the text on blank lines into groups of `{agents, rules}` so the assertions are about structure, not substrings. Cover: the generic group is first and equals Allow-only; each of the 11 names has its own group with exactly `Disallow: /`; the exported list equals the specified 11 names (sorted comparison, no duplicates); no `Disallow` in the `*` group; exactly one Sitemap line and it is the last non-empty line; the Sitemap URL is correct for base `/atelier-jacqueline-suzanne` on a github.io origin AND for base `/` on https://atelierjacquelinesuzanne.fr; the text ends with a single trailing newline; and a source-text guard that src/pages/robots.txt.ts imports and calls buildRobotsText.

**Build-level and e2e guards.** In tests/scripts/verify-static-artifact.mjs, directly after the existing robots Sitemap check, add two failures-array checks on the same `robots` string: it contains `User-agent: *\nAllow: /\n` and it contains `User-agent: GPTBot\nDisallow: /\n` (two representative assertions; the unit test is authoritative for the full list, and an .mjs script cannot import the TypeScript list). In tests/e2e/seo.spec.ts extend the existing 'robots.txt references the generated sitemap' test with one assertion that the served text contains `User-agent: GPTBot` and one that it still contains the generic allow group. Do not alter any existing assertion; both existing robots checks (`Sitemap: https://` in e2e, `${expectedBase}sitemap.xml` in the artifact script) and the launch-smoke-check.sh probe keep passing because the Sitemap line is preserved. These two files are exercised by CI's build job and cannot run in this offline verification (the build fetches content from Sanity), so locally confirm only that the artifact script parses (`node --check`) and that the e2e file is covered by the typecheck and lint gates; say this explicitly in the SUMMARY.

**Out of scope.** Do not touch the mentions-legales or confidentialite pages (fr or en), `.github/workflows/`, `.claude/`, LICENSE-CONTENT.md or the meta-robots logic in src/lib/robots.ts.

**Commit.** One atomic commit containing exactly the Task 2 files: `feat(quick-261003-kci): opt AI crawlers out of the site via robots.txt`. The only trailer is `Claude-Session: https://claude.ai/code/session_01U8V1i15iTkwxadMvZXmpnd` (no model name, per the brief). Never pass `--no-verify`.
  </action>
  <verify>
    <automated>npx vitest run tests/unit/static-routes.test.ts && node --check tests/scripts/verify-static-artifact.mjs && npm run lint && npm run typecheck && npm run test:coverage</automated>
  </verify>
  <done>
buildRobotsText emits the generic allow group, the 11 per-crawler Disallow groups and the Sitemap line last; the new unit tests (structure-based, both bases) and the whole unit suite pass with the coverage thresholds intact; lint and typecheck pass; the artifact script parses and carries the two new robots assertions; the e2e spec carries the extended assertion; no existing robots assertion was weakened. A code comment records that this is a deterrent, not an enforcement. The commit exists with only the Claude-Session trailer, and no legal page, workflow or .claude file was touched.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Maintainer shell -> Sanity production dataset | The CLI can mutate and delete production assets and documents with an Editor-level token |
| Environment -> process output | SANITY_WRITE_TOKEN lives in the environment and must never reach stdout/stderr, git or logs |
| Sanity CDN -> local machine | The original image bytes are downloaded and re-encoded before being uploaded back |
| npm registry -> repo | sharp is declared as a devDependency |
| Public web -> crawlers | robots.txt is a public, advisory signal |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-kci-01 | Tampering | CLI mutating production by accident | high | mitigate | Default is read-only dry-run; the dry-run function receives a fetch-only facade so it cannot write; --apply needs --i-have-a-backup AND SANITY_WRITE_TOKEN (validated before any client exists, unit-tested and exercised offline via exit code 2); --delete-originals needs --apply; deletion is a separate flag |
| T-kci-02 | Information Disclosure | write token leaking via logs, errors, repo or `.env` | high | mitigate | Token read only from env, populated in options only when --apply, never hardcoded, every printed error passes through describeError/redactSecrets (unit-tested), client config never printed; runbook says to use a temporary token, export it per session and revoke it |
| T-kci-03 | Tampering | irreversible deletion of an asset that is still referenced | high | mitigate | assessDeletionSafety fails closed (unknown count, count above 0, or earlier failure blocks ALL deletion); counts re-fetched immediately before deleting; Sanity's own strong-reference refusal is a second line; the runbook makes a verified `sanity dataset export` backup and the Lightroom-originals check preconditions |
| T-kci-04 | Tampering | repointing the wrong path or clobbering a concurrent Studio edit | medium | mitigate | References found by walking the document JSON (type reference plus exact id), `_key`-based array paths, `ifRevisionID` on every patch, one transaction per asset, unpatchable documents (no path, no `_rev`, odd keys) abort that asset, post-commit remaining-reference count marks the asset failed; re-running is safe and idempotent |
| T-kci-05 | Tampering | quality loss (upscaling, wrong orientation, colour shift, wrong size uploaded) | medium | mitigate | withoutEnlargement plus unit-tested dimension math; auto-orient; ICC profile kept; sharp output dimensions verified before upload and the new asset id's encoded dimensions verified after; originals are never deleted by --apply; Lightroom originals precondition |
| T-kci-06 | Denial of Service | a mistyped threshold crushing every image | low | mitigate | MIN_THRESHOLD of 800 enforced in resolveCliOptions and unit-tested |
| T-kci-07 | Tampering | corrupted or truncated download re-encoded as the "original" | low | mitigate | Byte length compared with the asset's recorded size before resizing; mismatch fails that asset only |
| T-kci-08 | Information Disclosure | EXIF (GPS, camera) in publicly served originals | low | accept | Reduced copies drop EXIF while keeping the ICC profile (a privacy side benefit, documented in the runbook); originals only disappear if the maintainer later runs the delete step |
| T-kci-09 | Repudiation | scrapers ignoring robots.txt | low | accept | robots.txt is a deterrent, not an enforcement, and says so in the code comment; the legal reservation in LICENSE-CONTENT.md remains the real position; listing crawler names discloses nothing sensitive |
| T-kci-SC | Tampering | npm install of sharp (supply chain) | low | accept | Not a new package: sharp 0.35.5 is already in package-lock.json with an integrity hash as astro's optional dependency; declaring it at the root adds no new node_modules entry. Verified by reviewing the lock diff (only the root devDependencies entry and sharp's flags may change), `npm ci --dry-run`, and the unchanged resolved version. The new-package legitimacy checkpoint is intentionally not triggered because no unaudited package enters the dependency graph (same precedent as T-jbt-SC) |
</threat_model>

<verification>
Overall checks after both tasks (all offline):
- `npm run lint`, `npm run typecheck`, `npm run test:unit` and `npm run test:coverage` pass.
- `git log --oneline -2` shows two commits, one per task, each with only the `Claude-Session` trailer.
- `git status --short` is clean and `git diff --stat HEAD~2` lists only files from the frontmatter list (no `.github/`, `.claude/`, legal pages).
- Brief-coverage audit: dry-run default and table -> Task 1; read-only without token -> Task 1 (facade + options); --apply gating by backup flag and token -> Task 1; download/resize 2400/upload preserving originalFilename/patch all refs incl. drafts/delete nothing -> Task 1; --delete-originals gating and zero-reference re-check -> Task 1; --threshold/--dataset/--project-id with env fallbacks -> Task 1; sharp declared as devDependency -> Task 1; Vitest pure-logic tests -> Task 1; French runbook with backup/Lightroom/dry-run/apply/verify/delete/CDN -> Task 1; npm script -> Task 1; robots.txt 11 AI blocks + intact generic group and Sitemap + tests + artifact/e2e checks + deterrent note -> Task 2.
</verification>

<success_criteria>
- A maintainer can run `npm run sanity:downsize-images` and get a harmless, read-only report, and cannot reach a write or delete path without the backup flag, the write token and (for deletion) an extra explicit flag.
- The pure logic is covered by network-free Vitest tests; lint and typecheck are green.
- robots.txt tells the 11 named AI crawlers to stay out while search engines and the sitemap are unaffected; existing robots checks still pass.
</success_criteria>

<output>
Create `.planning/quick/261003-kci-sanity-script-de-reduction-des-images-dr/261003-kci-SUMMARY.md` when done (the only write allowed under `.planning/`; leave STATE.md bookkeeping to the orchestrator). The SUMMARY must state explicitly that the CLI was never run against the network, that the e2e and artifact robots assertions were only syntax/lint/typecheck-verified locally (CI exercises them), and which design discretions were taken (width-only selection, orphan-inclusive deletion candidates, EXIF dropped / ICC kept, JPEG/WebP quality 90, MIN_THRESHOLD 800, `.env` auto-load, per-asset failure continues).
</output>
