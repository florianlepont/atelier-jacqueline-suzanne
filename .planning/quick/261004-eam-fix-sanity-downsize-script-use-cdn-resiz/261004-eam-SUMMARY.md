---
phase: quick-261004-eam
plan: 01
subsystem: scripts / sanity image downsizing
tags: [sanity, cdn, images, cli, tests, docs]
requires: []
provides:
  - "CDN-side image reduction in `npm run sanity:downsize-images --apply` (request reduced version, validate, upload unchanged)"
affects:
  - scripts/lib/sanity-image-downsize.mjs
  - scripts/sanity-downsize-images.mjs
  - tests/unit/sanity-image-downsize.test.ts
  - docs/reduction-images-sanity.md
tech-stack:
  added: []
  patterns:
    - "pure module with injected fetch and decoder; sharp used only to read (metadata + stats), never to resize or encode"
key-files:
  modified:
    - scripts/lib/sanity-image-downsize.mjs
    - scripts/sanity-downsize-images.mjs
    - tests/unit/sanity-image-downsize.test.ts
    - docs/reduction-images-sanity.md
decisions:
  - "sharp stays a root devDependency (still imported by the CLI for validation); package.json and package-lock.json untouched"
  - "Dimension rule not loosened: width exact, height within 1 px; a mismatch is a per-image failure that leaves the image untouched"
metrics:
  commits: 2
  completed: 2026-10-04
status: complete
requirements: [IMG-DOWNSIZE-01]
---

# Quick 261004-eam: downsize script uses the Sanity CDN resize Summary

`--apply` now asks the Sanity CDN for the already-reduced image (`?w=<target>&q=90&fm=jpg` / `?w=<target>&fm=png` / `?w=<target>&fm=webp&q=90`), validates what came back (HTTP ok, content-type, full decode, format, width exact, height within 1 px) and uploads those exact bytes. The original is never downloaded, nothing is re-encoded locally, and the byte-count comparison that made the owner's real run fail 49/49 is gone.

## Commits

- `61a2dde` fix(quick-261004-eam): ask the Sanity CDN for the reduced image instead of downloading the original (Task 1: module, CLI, unit tests)
- `ab06f24` docs(quick-261004-eam): document the CDN-side image reduction in the French runbook (Task 2: runbook, doc-contract test)

## Status per plan item

| Item | Status | Evidence |
|------|--------|----------|
| Pure module: `ReducedImageError`, `resolveOutputFormat`, `buildReducedImageUrl`, `validateReducedImage`, `fetchReducedImage`, `HEIGHT_TOLERANCE_PX` | done + verified | `npx vitest run tests/unit/sanity-image-downsize.test.ts` (121 tests passed) |
| URL per format (JPEG, PNG, WebP), extension fallback, conflicts, unsupported, missing url, query/fragment dropped, no `auto=`/`dl=`, RangeError on bad width | done + verified | same vitest run |
| Validation: content-type first, UNDECODABLE, FORMAT_MISMATCH, width exact, height +/-1 px pass and 2 px fail, message shows received and expected size | done + verified | same vitest run |
| Fetch flow with injected stubs (HTTP error, wrong content-type, undecodable, wrong format/dimensions, unsupported before any request, fetch rejection propagates, bytes unchanged) | done + verified | same vitest run |
| CLI: CDN request then validation then `assets.upload('image', reduced.data, {filename: deriveFilename(asset), contentType: reduced.mimeType})`; post-upload check against `reduced.width/height`; no headers/token on the CDN request | done + verified by tests and source guard; real path NOT exercised | source-guard tests (call order, no sharp resize/rotate/keepIccProfile/jpeg/png/webp/toBuffer); lint and typecheck pass |
| Source guard test for call order and absence of sharp resize/encode methods | done + verified | vitest run |
| No test or CLI code refers to the removed byte-count comparison | done + verified | grep for `original\.length` / `incomplet ou altéré` outside comments returns 0 on both files |
| Safety behavior untouched (dry-run facade, flag gating, ifRevisionID transaction, fail-closed deletion) | done + verified for the offline parts | `--help` exit 0; the three refusal invocations (`--apply` without backup and token, `--apply --i-have-a-backup` without token, `--delete-originals` alone) each exit 2; existing unit tests pass |
| `package.json` / `package-lock.json` unchanged, sharp stays a devDependency | done + verified | `git diff --name-only HEAD~2 -- package.json package-lock.json .github .claude` is empty |
| `npm run lint`, `npm run typecheck`, `npm run test:unit` | done + verified | lint clean; typecheck 0 errors; unit suite 35 files / 733 tests passed (run with the env hazard workaround) |
| French runbook updated (côté serveur, jamais téléchargé, no EXIF, Sanity sert du sRGB, no local recompression, checks incl. width exact and ±1 px, token never sent to the CDN, failed image laissée intacte, Studio-section parenthetical fixed) | done + verified | new doc-contract `it.each` over the five fragments passes together with the existing needles and the ordering test; grep for the removed claims returns 0 |
| Optional read-only CDN smoke check | done + verified | see below |
| Real `--apply` run | NOT done (forbidden by the plan) | never run, no write token used, no write request sent to Sanity |

## Optional CDN smoke check

Read-only public GET requests only, through `fetchReducedImage` with real `fetch` and a sharp-based decoder, in a throwaway script in the scratchpad (deleted afterwards, nothing written to the repo):

| Sample | Result |
|--------|--------|
| JPEG landscape 13040x9730 | OK `image/jpeg`, 2400x1791, 1026177 bytes (target 2400x1791) |
| JPEG portrait 5593x6731 | OK `image/jpeg`, 2400x2888, 1991143 bytes (target 2400x2888) |
| PNG 3872x2592 | OK `image/png`, 2400x1607, 7541045 bytes (target 2400x1607) |

## What was NOT exercised, and what the owner should check on the first real run

The real `--apply` path (Sanity write client, `assets.upload`, the revision-guarded transaction, deletion) was NOT run. Everything that only needs network reads plus the validation was checked; the write path is unchanged code except for what is passed to `assets.upload`.

On the first real run, the owner should:

1. Start with a small `--threshold` scope or just watch the first images: each line should read `remplacée`, not `ÉCHEC`.
2. Confirm that the new asset's id carries the target dimensions (the existing post-upload check does this; a failure shows as `Image téléversée inattendue`).
3. Watch for `ÉCHEC : Dimensions inattendues` lines: they mean Sanity's recorded dimensions disagree with the CDN output for that photo (for example an EXIF-rotated image). By design the image is left untouched and the run exits 1; do not loosen the rule.
4. Open a few replaced images on the site (and one PNG) to check the visual result and that file names are preserved in the Media library, before running `--delete-originals`.
5. Check that the uploaded copy is not larger than expected (JPEG about 1 to 2 MB at 2400 px; the PNG sample is about 7.5 MB because PNG is lossless).

## Deviations from Plan

None - plan executed as written. Minor note: the test stub for the fetch response copies the bytes into a fresh `ArrayBuffer` so the typecheck against the `FetchLikeResponse` typedef passes (fixed before the Task 1 commit).

## Known Stubs

None.

## Threat Flags

None. The CDN request helper sends no headers and no token; the new surface is a read-only GET to `cdn.sanity.io`.

## Self-Check: PASSED

- Commits `61a2dde` and `ab06f24` exist in `git log`.
- Modified files exist; `git status` shows only the untracked `.planning/quick/261004-eam-...` directory; no stray image files in the repository.
