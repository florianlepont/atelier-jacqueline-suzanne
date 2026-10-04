---
phase: quick-261004-eam
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/lib/sanity-image-downsize.mjs
  - scripts/sanity-downsize-images.mjs
  - tests/unit/sanity-image-downsize.test.ts
  - docs/reduction-images-sanity.md
autonomous: true
requirements: [IMG-DOWNSIZE-01]

must_haves:
  truths:
    - "For each oversized image, --apply asks the Sanity CDN for the already-reduced version: JPEG -> `<asset.url>?w=<target.width>&q=90&fm=jpg`, PNG -> `<asset.url>?w=<target.width>&fm=png`, WebP -> `<asset.url>?w=<target.width>&fm=webp&q=90`. The original is never downloaded, and no check compares the received byte count with the asset's recorded size any more (the CDN never serves original bytes, so that check was wrong by design and made the owner's real run fail 49/49)."
    - "The bytes received from the CDN are uploaded as they are: NO local re-encoding (no second compression). sharp is used only to READ the received image (metadata plus a full decode to catch truncated or corrupt data), never to resize or encode."
    - "An image is uploaded ONLY if: HTTP status is ok, the response content-type matches the requested format, the bytes fully decode, the decoded format matches, width equals target.width exactly and height is within 1 px of target.height. Any other outcome is an explicit per-image failure (ÉCHEC with the reason) for which NOTHING is uploaded, patched or deleted; the run continues with the next image and exits 1."
    - "All existing safety behavior is untouched: dry-run by default and fetch-only facade; --apply requires --i-have-a-backup AND SANITY_WRITE_TOKEN (exit 2 before any client or sharp import); --delete-originals separate, requires --apply and stays fail-closed (deletion only when every candidate has zero remaining references and nothing failed); ifRevisionID-guarded patches in one transaction per asset; upload keeps originalFilename."
    - "The pure module has unit tests for URL building per format (mimeType, extension fallback, conflicts, unsupported, missing url), for dimension/format/content-type validation including the 1 px height tolerance and the exact-width rule, and for the fetch-and-validate flow with injected fetch/decoder stubs (HTTP error, wrong content-type, undecodable bytes, wrong dimensions all reject). No test refers to the removed byte-count guard."
    - "docs/reduction-images-sanity.md (French) states that the CDN produces the reduced version server-side and originals are never downloaded, that the result has no EXIF and no ICC profile (Sanity serves sRGB), that nothing is re-compressed locally, and that an image failing validation is left untouched; every constraint the existing doc-contract tests check still holds."
  artifacts:
    - scripts/lib/sanity-image-downsize.mjs      # + ReducedImageError, resolveOutputFormat, buildReducedImageUrl, validateReducedImage, fetchReducedImage, HEIGHT_TOLERANCE_PX
    - scripts/sanity-downsize-images.mjs         # replaceAsset: CDN request + validation instead of download + local resize
    - tests/unit/sanity-image-downsize.test.ts   # new describe blocks, extended docs contract, CLI source guard
    - docs/reduction-images-sanity.md            # French runbook updated
  key_links:
    - "scripts/sanity-downsize-images.mjs MUST call fetchReducedImage BEFORE client.assets.upload, and the upload receives exactly the validated bytes (reduced.data) with contentType reduced.mimeType. A source-text guard test asserts the call order and that the CLI source calls no sharp resize/rotate/encode/ICC method."
    - "Format, content-type and dimension rules live in ONE place, validateReducedImage in scripts/lib/sanity-image-downsize.mjs; the CLI adds no ad-hoc dimension check of its own besides the existing post-upload comparison of the new asset id's encoded dimensions."
    - "package.json `sharp` devDependency <-> scripts/sanity-downsize-images.mjs dynamic `import('sharp')`: sharp STAYS a devDependency because the CLI still imports it for validation. package.json and package-lock.json are NOT modified by this plan."
    - "docs/reduction-images-sanity.md <-> tests/unit/sanity-image-downsize.test.ts docs contract: the first index of `sanity dataset export` < the first index of `--apply --i-have-a-backup` < the first index of `--delete-originals`. New prose placed before step 2 must NOT contain either of the two later literals."
    - "resolveCliOptions validation and the exit-2 refusals still run BEFORE any dynamic import of @sanity/client or sharp (offline verify commands depend on it)."
---

<objective>
Fix `npm run sanity:downsize-images --apply`: ask the Sanity CDN for the reduced version of each oversized image instead of downloading the original and resizing it locally.

Purpose: the owner's real run failed 49/49 because the script compared the downloaded byte count with `asset.size`, but the Sanity image CDN never serves the original bytes (verified: `asset.size` 2963439 vs 2146510 bytes served, valid JPEG). The safety guard held (nothing written, deleted or modified), but the tool cannot work with that design. Reading the CDN's own server-side resize removes the need to download originals at all, avoids a second compression, and is much cheaper (about 1 MB and 1.5 s per image).

Output: an updated pure module with URL building and validation (unit-tested), a CLI whose per-image path is CDN request -> validate -> upload -> repoint, updated tests, and an updated French runbook. One atomic commit per task on the current branch `claude/kind-cannon-2myct1`.

Hard rules for execution: do NOT run the CLI with `--apply`, and never use or request a write token. Offline checks on the CLI are limited to `--help` and the three invocations that must be refused with exit code 2. The executor MAY issue a few read-only public GET requests to cdn.sanity.io (see the optional smoke check in Task 1), writing nothing into the repo. Do NOT touch `.github/`, `.claude/`, legal pages (`src/pages/mentions-legales*`, `src/pages/confidentialite*` and their `en/` counterparts) or Sanity schemas.
</objective>

<execution_context>
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/workflows/execute-plan.md
@/home/user/atelier-jacqueline-suzanne/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@scripts/sanity-downsize-images.mjs
@scripts/lib/sanity-image-downsize.mjs
@tests/unit/sanity-image-downsize.test.ts
@docs/reduction-images-sanity.md
@package.json

Facts established while planning (verified with real read-only requests; do not re-derive):
- The public dataset (project `gwz8iug4`, dataset `production`) answers unauthenticated GROQ queries, and `asset.url` has the shape `https://cdn.sanity.io/images/gwz8iug4/production/<hash>-<W>x<H>.<ext>` with no query string. `mimeType` is `image/jpeg` / `image/png` and `extension` is `jpg` / `png`.
- The CDN resizes server-side from the stored original and output dimensions follow the existing target math exactly: 13040x9730 JPEG with `?w=2400&q=90&fm=jpg` gives a valid 2400x1791 JPEG (about 1 MB, no EXIF); portrait 5593x6731 JPEG gives 2400x2888 (`image/jpeg`); PNG 3872x2592 with `?w=2400&fm=png` gives 2400x1607 (`image/png`, about 7.5 MB); `?w=2400&fm=webp&q=90` gives a valid `image/webp`. Every response has no EXIF, no orientation tag and no ICC profile, colour space sRGB.
- The plain asset URL is NOT the original (it is already a re-encode) and `?q=100` returns a bigger file, so the plain URL must never be used as a source for local re-encoding.
- sharp 0.35.x (already a root devDependency, locked at 0.35.5): `metadata()` only parses the header; `stats()` forces a full decode. Cutting any of the three real samples at 60 percent made `stats()` throw (truncated JPEG, PNG read error, corrupt WebP header), so metadata followed by stats gives a real integrity check with nothing re-encoded and the decoded output discarded.
- Node is 22 (global fetch, `AbortSignal.timeout`, `process.loadEnvFile`). Vitest runs `tests/unit/**/*.test.ts` in the node environment; `scripts/lib` is outside the coverage include list, so coverage thresholds are unaffected. Root tsconfig has `allowJs`, so `// @ts-check` JSDoc in the `.mjs` files is checked by `npm run typecheck`; ESLint already declares Node globals (process, console, fetch, Buffer, URL, AbortSignal) for `scripts/**/*.mjs`. In `.ts` tests, `any` is a lint error.
- The existing doc-contract tests require the runbook to contain `sanity dataset export`, `--i-have-a-backup`, `--apply`, `--delete-originals`, `Lightroom` and `CDN`, and to order them: first `sanity dataset export`, then the first `--apply --i-have-a-backup`, then the first `--delete-originals`. tests/unit/publishing-docs.test.ts only reads README.md, sanity/README.md, CLAUDE.md, AGENTS.md and the deploy workflow, none of which this plan touches.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Request the reduced image from the CDN and validate it before upload (pure module, CLI, unit tests)</name>
  <files>scripts/lib/sanity-image-downsize.mjs, scripts/sanity-downsize-images.mjs, tests/unit/sanity-image-downsize.test.ts</files>
  <behavior>
    URL building (buildReducedImageUrl(asset, targetWidth), pure, `https://cdn.sanity.io/images/p/d/<hash>-6000x4000.<ext>` style input): a JPEG asset gives the asset URL followed by `?w=2400&q=90&fm=jpg`; a PNG asset gives `?w=2400&fm=png`; a WebP asset gives `?w=2400&fm=webp&q=90`; the width in the query is the given target width; the format is decided from `mimeType`, and when `mimeType` is missing from the `extension` (`jpg`, `jpeg`, `png`, `webp`, case-insensitive); a `mimeType` and an `extension` that disagree are rejected (code UNSUPPORTED_FORMAT); `image/gif`, `image/svg+xml` and an unknown extension are rejected (UNSUPPORTED_FORMAT); a missing, empty or unparsable `url` is rejected (code MISSING_URL); a pre-existing query string or fragment on the asset URL is dropped, never carried over; the output never contains `auto=` or `dl=`; a target width that is not a positive integer throws RangeError.
    Validation (validateReducedImage({expectedMimeType, contentType, decoded, target}), pure, returns `{ok: true}` or `{ok: false, code, message}` and never throws): content-type is compared case-insensitively after dropping any `;` parameters, mismatch gives CONTENT_TYPE_MISMATCH; a content-type mismatch is reported even when `decoded` is null; `decoded` null or non-finite/non-positive width or height gives UNDECODABLE; decoded format different from the format expected for the mime type (`jpeg`, `png`, `webp`) gives FORMAT_MISMATCH; width must equal target.width exactly, height may differ from target.height by at most 1 px (HEIGHT_TOLERANCE_PX), anything else gives DIMENSIONS_MISMATCH, with width off by 1 failing, height off by 1 passing in both directions and height off by 2 failing; the message for a dimensions failure shows the received and expected sizes.
    Fetch and validate (fetchReducedImage({asset, target, fetchImpl, decodeImage}), async, no global access, all I/O injected): on success it calls fetchImpl exactly once with the built URL and returns the received bytes unchanged as a Buffer together with mimeType, width and height from the decoder, and the decoder receives those same bytes; a response with ok false rejects with ReducedImageError code HTTP_ERROR and the decoder is never called; a wrong content-type rejects with CONTENT_TYPE_MISMATCH even if the decoder would also fail; a decoder that rejects (with a content-type that is fine) rejects with UNDECODABLE; a wrong format or wrong dimensions rejects with FORMAT_MISMATCH or DIMENSIONS_MISMATCH; an unsupported asset rejects before fetchImpl is called; a rejection from fetchImpl itself (network error, timeout) propagates unchanged.
    CLI source guard (source-text test, same style as the docs contract): after stripping comments, scripts/sanity-downsize-images.mjs contains a call to fetchReducedImage that comes BEFORE the `assets.upload(` call, and contains no call to the sharp methods that resize, rotate, keep a profile, encode or return a buffer (`resize`, `rotate`, `keepIccProfile`, `jpeg`, `png`, `webp`, `toBuffer`).
  </behavior>
  <action>
**Root cause and design (per the brief).** The old per-image path downloaded `asset.url`, compared the received byte count with the asset's recorded size, then resized and re-encoded locally with sharp. The CDN never serves original bytes, so that comparison could never hold. Replace the whole path with: ask the CDN for the reduced version, validate what came back, upload exactly those bytes. Everything else in the CLI stays as it is.

**Write the tests first (tdd).** Extend `tests/unit/sanity-image-downsize.test.ts` from the behavior block, importing the new names from `../../scripts/lib/sanity-image-downsize.mjs`. Add describe blocks for resolveOutputFormat/buildReducedImageUrl, validateReducedImage, fetchReducedImage and the CLI source guard. Assert on error CODES (ReducedImageError.code), not on message text, except that the dimension-failure message must contain both the received and the expected `WxH`. Build fetch stubs as plain objects exposing only `ok`, `status`, `headers.get(name)` and `arrayBuffer()` (do not depend on Response or Headers); decoder stubs return `{format, width, height}`. Use realistic fixtures: asset URL `https://cdn.sanity.io/images/gwz8iug4/production/badfea3dd4d4ab5abbf8f09a5556610da89d90b9-13040x9730.jpg` with target 2400x1791, a PNG 3872x2592 with target 2400x1607. For the `fetchReducedImage` success test, assert the returned bytes equal the stubbed response bytes and that the decoder was handed those same bytes. No `any`, no network, no sharp import, no process access (update the file's header comment to say network and decoding are replaced by injected stubs). The source guard strips `//` line comments and block comments before matching and compares `indexOf` positions of the fetchReducedImage call and the `assets.upload(` call. Do not write any test about the removed byte-count comparison.

**Pure module (scripts/lib/sanity-image-downsize.mjs); export names are fixed so tests and CLI agree.**
- Add the constant HEIGHT_TOLERANCE_PX = 1 (the same 1 px tolerance the CLI previously applied inline). Keep OUTPUT_QUALITY = 90, which is now the `q` value sent to the CDN. Update the module header comment: still no process access, no sharp, no Sanity client and no global fetch (network and decoding are injected).
- Add an exported class ReducedImageError extending Error with `name` and a string `code`, modelled on the existing UnsupportedPathError. Codes: UNSUPPORTED_FORMAT, MISSING_URL, HTTP_ERROR, CONTENT_TYPE_MISMATCH, UNDECODABLE, FORMAT_MISMATCH, DIMENSIONS_MISMATCH. Messages are in French and never include URLs with secrets (there are none) or tokens.
- resolveOutputFormat(asset) returns `{mimeType, fm, sharpFormat}` for the three supported formats (image/jpeg -> fm `jpg`, sharp name `jpeg`; image/png -> `png`; image/webp -> `webp`). `mimeType` is authoritative (trim and lowercase it); the extension (lowercase, no dot; `jpg` and `jpeg` both mean image/jpeg) is used only when `mimeType` is absent, and is cross-checked when both exist: a known extension that maps to a different mime type is a conflict and throws ReducedImageError UNSUPPORTED_FORMAT (fail closed: requesting the wrong format could flatten a PNG). An unknown extension next to a valid mime type is ignored. Anything outside the three formats throws UNSUPPORTED_FORMAT.
- buildReducedImageUrl(asset, targetWidth): require a positive integer targetWidth (RangeError otherwise), require a parsable `asset.url` (ReducedImageError MISSING_URL otherwise), parse it with the URL class, clear its search and hash so nothing from the stored URL is carried over, then set the parameters in this fixed order: JPEG w, q, fm; PNG w, fm; WebP w, fm, q (q is OUTPUT_QUALITY; PNG carries no q because it is lossless). Never add `auto=format` (it would make the CDN pick a format from the Accept header) and never add `dl`. Return the URL string.
- validateReducedImage({expectedMimeType, contentType, decoded, target}) applies, in this order: content-type, then decoded null or unusable dimensions (UNDECODABLE), then format, then width exact and height within HEIGHT_TOLERANCE_PX. Return `{ok: true}` or `{ok: false, code, message}`; it never throws. The content-type check comes first on purpose, so an HTML error page is reported as a wrong content-type rather than as an undecodable image.
- fetchReducedImage({asset, target, fetchImpl, decodeImage}): resolve the format and build the URL first (so an unsupported asset fails before any request); call `fetchImpl(url)` once; a response that is not ok throws HTTP_ERROR carrying the status; read the body with `Buffer.from(await response.arrayBuffer())`; run `decodeImage(data)` inside a try/catch that turns a rejection into `decoded = null` (the validator then reports the right code); call validateReducedImage with the response's `content-type` header; on `{ok: false}` throw ReducedImageError with that code and message; on success return `{data, mimeType, width, height}` taken from the decoder. Do not catch errors from `fetchImpl` itself. Add JSDoc typedefs for the fetch-like response (`ok`, `status`, `headers.get`, `arrayBuffer`) and the decoded shape (`format`, `width`, `height`, all optional) so `// @ts-check` passes with both real `fetch` and the test stubs.

**CLI (scripts/sanity-downsize-images.mjs).** Change only the per-image replacement path and its imports; every other function (option handling order, dry-run with the fetch-only facade, candidate selection, reference fetching, the revision-guarded transaction, remaining-reference count, deletion gate, main) stays byte-for-byte as it is.
- Imports: add fetchReducedImage, drop the now-unused OUTPUT_QUALITY import; drop the `Sharp` typedef. Rename the timeout constant to describe a CDN request (keep 120000 ms; the CDN answers in about 1.5 s but a very large source can take longer).
- Add a small helper that requests a URL with the existing timeout via `AbortSignal.timeout` and sends NO headers and NO token (the CDN request must never carry the write token). Add a decoding helper built on the dynamically imported sharp: create the sharp instance from the received bytes, read its metadata (format, width, height), then call `stats()` on it to force a full decode so truncated or corrupt data throws, and return `{format, width, height}`. Nothing is encoded and the decoded output is discarded. Add a short comment saying exactly that.
- replaceAsset: keep the first steps (fetch referencing documents, ignore when none, compute the target with computeTargetDimensions). Remove the original download, the byte-count/recorded-size comparison, and the entire local sharp pipeline (auto-orient, resize, ICC retention and the JPEG/WebP/PNG encoders, plus the inline dimension check that followed them). Replace them with one call to fetchReducedImage (passing the asset, the target, the request helper and the decoding helper) BEFORE anything is uploaded. Then upload `reduced.data` with `client.assets.upload('image', ...)` keeping `filename: deriveFilename(asset)` (original file name preserved) and `contentType: reduced.mimeType`. Keep the existing post-upload check unchanged except that it compares the new asset id's encoded dimensions with `reduced.width` and `reduced.height`. Everything after that (fresh reference fetch, planReferencePatches, unpatchable handling, one transaction with ifRevisionID, remaining-reference count) is unchanged. The replaceAsset context now carries the decoding helper instead of `sharp`.
- runApply: keep the lazy `import('sharp')` after the candidate summary as today and build the decoding helper from it; pass that helper to replaceAsset. Per-image failures keep flowing through the existing catch with describeError, so a ReducedImageError shows as `ÉCHEC : <reason>`, the image id goes into `failedIds`, nothing is uploaded or patched for it, the loop continues, and the exit code is 1.
- Update the header comment (sharp is now used only to validate what the CDN returned, never to resize or encode) and the replaceAsset JSDoc (request reduced version, validate, upload, repoint).
- Do not leave any comment that quotes the removed code or error text; describe the new behavior only.

**sharp stays a devDependency (decision).** The CLI still imports sharp for the validation decode, so removing it would break the CLI. package.json and package-lock.json are NOT modified by this plan (nothing to keep consistent). Say so in the SUMMARY.

**Pitfall to leave alone (fail closed, per the brief).** Expected dimensions come from Sanity's recorded metadata and the CDN output is auto-oriented. If some photo's recorded dimensions ever disagree with the CDN output (for example an EXIF-rotated image recorded pre-rotation), the dimension check fails for that image: it is reported as ÉCHEC and left untouched. That is the intended outcome. Do not loosen the width-exact / height plus-or-minus-1 px rule and do not add a rotation workaround.

**Optional read-only CDN smoke check (MAY; not part of the automated gate).** To confirm 2 or 3 built URLs behave as expected, use a throwaway Node snippet or curl outside the repo (a directory from `mktemp -d`) that builds URLs with buildReducedImageUrl for these public assets and fetches them with no token: JPEG landscape `https://cdn.sanity.io/images/gwz8iug4/production/badfea3dd4d4ab5abbf8f09a5556610da89d90b9-13040x9730.jpg` (expect `image/jpeg`, 2400x1791), JPEG portrait `https://cdn.sanity.io/images/gwz8iug4/production/445bc20a0d62e93a70f71210f66df4289c586d41-5593x6731.jpg` (expect 2400x2888), PNG `https://cdn.sanity.io/images/gwz8iug4/production/cad9b00c5232d9beb80459bfeb40ef95bfc07194-3872x2592.png` (expect `image/png`, 2400x1607). Record the outcome in the SUMMARY. Plain GET requests only; write nothing into the repo; never run the CLI against the network.

**Commit.** One atomic commit containing exactly the three Task 1 files: `fix(quick-261004-eam): ask the Sanity CDN for the reduced image instead of downloading the original`. The only trailer is `Claude-Session: https://claude.ai/code/session_01U8V1i15iTkwxadMvZXmpnd` (no model name). Never pass `--no-verify`.
  </action>
  <verify>
    <automated>npx vitest run tests/unit/sanity-image-downsize.test.ts && npm run lint && npm run typecheck && node scripts/sanity-downsize-images.mjs --help && (env -u SANITY_WRITE_TOKEN node scripts/sanity-downsize-images.mjs --project-id p --dataset d --apply; test $? -eq 2) && (env -u SANITY_WRITE_TOKEN node scripts/sanity-downsize-images.mjs --project-id p --dataset d --apply --i-have-a-backup; test $? -eq 2) && (node scripts/sanity-downsize-images.mjs --project-id p --dataset d --delete-originals; test $? -eq 2) && test "$(grep -vE '^[[:space:]]*(//|\*|/\*)' scripts/sanity-downsize-images.mjs | grep -cE 'original\.length|incomplet ou altéré')" = 0 && test "$(grep -vE '^[[:space:]]*(//|\*|/\*)' tests/unit/sanity-image-downsize.test.ts | grep -cE 'original\.length|incomplet ou altéré')" = 0 && test -z "$(git status --porcelain -- package.json package-lock.json)"</automated>
  </verify>
  <done>
`buildReducedImageUrl` produces the three URL forms (JPEG `?w=N&q=90&fm=jpg`, PNG `?w=N&fm=png`, WebP `?w=N&fm=webp&q=90`) from the asset's mimeType or extension; `validateReducedImage` and `fetchReducedImage` reject HTTP errors, wrong content-types, undecodable bytes, wrong formats and wrong dimensions with explicit codes, accept height off by 1 px and reject width off by 1 px or height off by 2 px; the source-guard test proves the CLI requests the reduced image before any upload and calls no sharp resize, rotate, ICC or encode method; no test and no CLI code refers to the removed byte-count comparison. The CLI uploads the CDN bytes unchanged with `reduced.mimeType` and the original file name, and every other safety behavior is unchanged: `--help` exits 0 and the three refusal invocations exit 2 before any client or sharp import. `npm run lint` and `npm run typecheck` pass; package.json and package-lock.json show no change in `git status` (sharp stays a devDependency because it is still imported for validation). The CLI was never run with `--apply` and no write token was used. The commit exists with only the Claude-Session trailer.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Update the French runbook for the CDN-side reduction and lock it with doc-contract tests</name>
  <files>docs/reduction-images-sanity.md, tests/unit/sanity-image-downsize.test.ts</files>
  <behavior>
    Docs contract (extends the existing `docs contract` describe block, reading docs/reduction-images-sanity.md): the runbook contains each of these exact French fragments: `côté serveur` (the CDN builds the reduced image), `jamais téléchargé` (originals are not downloaded), `Sanity sert du sRGB` (no ICC profile in the result), `laissée intacte` (a failed image is untouched) and `±1 px` (the dimension tolerance). The existing needles and the ordering test (backup export, then `--apply --i-have-a-backup`, then `--delete-originals`) keep passing unchanged.
  </behavior>
  <action>
**Update docs/reduction-images-sanity.md (French, keep the existing section structure, tone and Markdown style).** Edit with scoped replacements; do not rewrite the file wholesale. The Studio-upload section at the end is about a different mechanism and stays as it is, except for the one parenthetical named below.

1. Section « À quoi ça sert, ce que ça change »: replace the bullet that says the reduced copies lose their EXIF data while the ICC profile is kept. The new bullet keeps the storage-weight point (plan gratuit de Sanity) and states: the reduction is made **côté serveur** by the Sanity CDN, which resizes from the stored original, so the original file is **jamais téléchargé** (the exact words `côté serveur` and `jamais téléchargé` must appear, with no Markdown emphasis splitting them); the reduced copy has no EXIF data (no GPS position, no camera) and no ICC profile because **Sanity sert du sRGB** (that exact phrase, unsplit); JPEG and WebP copies are produced at quality 90 and PNG stays lossless. In this intro section do NOT write the flag names for the later steps (the ordering test looks at their first occurrence in the whole file).
2. Step 2 (« remplacer les images »): replace the sentence describing what the script does per image. New behavior to describe, in this order: the script asks the CDN for the reduced version (width = target width), checks what it received before doing anything else, uploads that copy as received with the same original file name, then repoints every reference (published documents and drafts) in one revision-guarded transaction per image, as before. State that nothing is re-compressed on the maintainer's machine, so there is no second compression. List the checks performed before any upload: correct HTTP response, expected file type (JPEG, PNG or WebP matching the original), image readable in full, width exactly equal to the target width and height within **±1 px** of the target height (that exact fragment `±1 px`). State that the write token is sent only to the Sanity API, never to the CDN.
3. Step 2, the failure bullet: extend the existing line saying a failed image is reported and the script continues (exit code 1). Add that an image that fails these checks is **laissée intacte** in plain text (exact fragment `laissée intacte`, no bold inside it): nothing is uploaded, modified or deleted for it, the line shows ÉCHEC with the reason, it is retried on the next run, and while it is still unreplaced the deletion in step 4 stays refused.
4. Section « Métadonnées et couleur » in the Studio part: fix the parenthetical that says the offline script keeps the colour profile. The offline script no longer does: say instead that it behaves the same, because the CDN serves sRGB without an ICC profile.
5. Do not change the options table, exit codes, backup, Lightroom, verification and deletion steps beyond what is needed for consistency. Leave the existing sentence about the CDN caching a deleted image.
6. Self-check the finished file for any remaining statement that the script downloads the original file, resizes locally, or keeps the ICC profile; there must be none. Do not quote those removed sentences in comments or notes anywhere.

**Doc-contract tests (tests/unit/sanity-image-downsize.test.ts).** In the existing `docs contract` describe block add one `it.each` over the five fragments listed in the behavior block, asserting `runbook` contains each. Do not remove or loosen any existing assertion. Positive assertions only.

**Commit.** One atomic commit containing exactly the two Task 2 files: `docs(quick-261004-eam): document the CDN-side image reduction in the French runbook`. The only trailer is `Claude-Session: https://claude.ai/code/session_01U8V1i15iTkwxadMvZXmpnd` (no model name). Never pass `--no-verify`.
  </action>
  <verify>
    <automated>npx vitest run tests/unit/sanity-image-downsize.test.ts tests/unit/publishing-docs.test.ts && npm run test:unit && npm run lint && npm run typecheck && test "$(grep -vE '^[[:space:]]*<!--' docs/reduction-images-sanity.md | grep -cE "télécharge l'original|ICC est conservé|conserve le profil")" = 0 && test -z "$(git status --porcelain -- package.json package-lock.json README.md sanity .github)"</automated>
  </verify>
  <done>
The runbook says in French that the CDN produces the reduced version côté serveur and originals are jamais téléchargé, that the result has no EXIF and no ICC profile (Sanity sert du sRGB), that nothing is re-compressed locally, which checks run before an upload (including width exact and height ±1 px), that the token never goes to the CDN, and that a failing image is laissée intacte. No sentence still claims that the script downloads the original, resizes locally or keeps the ICC profile. The new doc-contract test passes together with the existing ones and the ordering contract (backup export, then `--apply --i-have-a-backup`, then `--delete-originals`); the full unit suite, lint and typecheck pass. package.json, package-lock.json, README.md, `sanity/` and `.github/` show no change in `git status`, and `.claude/` was not touched by either commit. The commit exists with only the Claude-Session trailer.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Maintainer shell -> Sanity production dataset | The CLI can still mutate and delete production assets and documents with an Editor-level token (behavior unchanged by this fix) |
| Sanity CDN -> maintainer machine | Reduced image bytes produced by the CDN are fetched, validated and then uploaded back into the production dataset |
| Environment -> process output / network | SANITY_WRITE_TOKEN lives in the environment and must reach only the Sanity API, never the CDN, stdout or stderr |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-eam-01 | Tampering | A truncated, corrupt, mislabeled or wrongly sized CDN response uploaded in place of a good image | high | mitigate | `fetchReducedImage` runs `validateReducedImage` before any upload: HTTP ok, content-type, full decode (sharp metadata then stats), decoded format, width exact, height within 1 px. Any failure is an explicit per-image ÉCHEC: nothing uploaded, patched or deleted for that image. Unit-tested for each failure code; the source guard test pins the call order (validate before `assets.upload(`) |
| T-eam-02 | Tampering | Quality loss from double compression or a wrong source | medium | mitigate | The CDN produces the reduced image in one server-side step from the stored original; the bytes are uploaded unchanged and the CLI calls no sharp resize/encode method (source guard test); the plain asset URL (already a re-encode) is never used as a source; explicit `q=90` for JPEG/WebP and lossless PNG |
| T-eam-03 | Information Disclosure | Write token sent to the CDN or printed | high | mitigate | The CDN request helper sends no headers and no token; errors still pass through `describeError` with both tokens as secrets; unchanged `resolveCliOptions` tests prove tokens never appear in options or errors |
| T-eam-04 | Information Disclosure | EXIF (GPS, camera) in served images | low | mitigate | Verified: CDN output carries no EXIF and no orientation tag; documented in the runbook. Originals only disappear if the maintainer runs the separate deletion step |
| T-eam-05 | Tampering | Regression in existing safeguards while rewriting `replaceAsset` | high | mitigate | Only the per-image fetch/validate/upload section changes; dry-run facade, flag gating (exit 2 before any import), ifRevisionID transaction, remaining-reference count and fail-closed deletion are untouched; the three offline refusal invocations and the existing unit tests are part of the verify command |
| T-eam-06 | Tampering | Recorded dimensions disagree with CDN output (for example an EXIF-rotated photo) | low | mitigate | Dimension check fails closed: that image is reported and left intact; the tolerance is not loosened and no workaround is added |
| T-eam-07 | Denial of Service | CDN slow or unavailable | low | accept | Per-request `AbortSignal.timeout`; a failing image is reported and the run continues; the run is retryable because replaced images are no longer referenced |
| T-eam-SC | Tampering | npm/pip/cargo installs | low | accept | No package is added or changed: sharp is already a locked root devDependency; package.json and package-lock.json are asserted unmodified by the verify commands, so no legitimacy checkpoint is needed |
</threat_model>

<verification>
Overall checks after both tasks (all offline apart from the optional read-only CDN smoke check):
- `npm run lint`, `npm run typecheck` and `npm run test:unit` pass; `node scripts/sanity-downsize-images.mjs --help` exits 0 and the three refusal invocations exit 2.
- `git log --oneline -2` shows two commits, one per task, each with only the `Claude-Session` trailer; `git diff --stat HEAD~2` lists only the four frontmatter files (no package.json, lockfile, `.github/`, `.claude/`, legal pages or schemas).
- The CLI was never run with `--apply`; no write token was set or requested.
- Brief-coverage audit: GOAL (CDN-side reduction instead of downloading the original) -> Task 1 (CLI path); REQ IMG-DOWNSIZE-01 (safe downsizing tool keeps working) -> Tasks 1-2; brief constraints: URL per format built in the pure module with tests -> Task 1; replace the size check by HTTP ok / content-type / decodable / width exact / height ±1 px with per-image failure and nothing uploaded -> Task 1 (`validateReducedImage`, `fetchReducedImage`, source guard); no local re-encoding and sharp kept for validation (stays a devDependency, package files untouched) -> Task 1; keep all safety behavior and originalFilename -> Task 1 (untouched code, offline refusal checks); tests updated with URL building per type, ±1 px tolerance and mismatch failure, no reference to the old check -> Task 1; French runbook updated (CDN server-side, originals never downloaded, no EXIF, no ICC / sRGB, failed image untouched) with existing doc contracts preserved -> Task 2; evidence from real read-only requests -> encoded in the Task 1 smoke check and in the fixtures. Deferred ideas: none.
</verification>

<success_criteria>
`--apply` no longer downloads originals or compares byte counts; each oversized image is fetched already reduced from the CDN, fully validated, uploaded unchanged with its original file name and repointed under all the existing safeguards; a failing image is reported and left intact; the unit tests, lint, typecheck and the offline refusal checks pass; the French runbook matches the new behavior and its doc-contract tests pass; sharp remains a devDependency with package.json and package-lock.json untouched.
</success_criteria>

<output>
Create `.planning/quick/261004-eam-fix-sanity-downsize-script-use-cdn-resiz/261004-eam-SUMMARY.md` when done, noting the outcome of the optional CDN smoke check (or that it was skipped).
</output>
