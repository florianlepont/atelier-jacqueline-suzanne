# Deferred Items — Phase 04.3

## Sandbox `npm run build` is currently broken for this exact dependency set (env, not code)

**Found during:** Plan 04.3-02, Task 1 verification.

**Symptom:** `npm run build` fails at the Vite/rolldown static-build step with:
```
[rolldown:vite-resolve] plugin `rolldown:vite-resolve` threw an error
Caused by:
    Tsconfig not found astro/tsconfigs/strict
```

**Scope confirmed pre-existing, not caused by this plan:** Reproduced identically with
`src/pages/galleries/index.astro`, `src/pages/en/galleries/index.astro`, and
`src/components/GalleryCard.astro` temporarily restored via `git checkout --` (i.e. on the
unmodified pre-plan tree) — the failure is byte-identical regardless of this plan's deletions
or edits. `npm ci` reproduces the same committed `package-lock.json` used by
`.github/workflows/deploy.yml`, so this is not an install drift issue either.

**Root cause (best-effort diagnosis):** Astro 7.0.6 sets Vite's native
`resolve.tsconfigPaths: true` (see `node_modules/astro/dist/core/create-vite.js`). Astro's own
`get-tsconfig`-based config loader resolves `tsconfig.json`'s `"extends": "astro/tsconfigs/strict"`
correctly (confirmed via direct `readTsconfig()` call — fully merged, no dangling `extends`).
However Vite 8.1.3's native rolldown/oxc resolver (`@rolldown/binding-linux-x64-gnu`) independently
tries to resolve the same bare specifier for its own per-file TS transform config and fails to find
it — even after editing `tsconfig.json`'s `extends` to a relative, unambiguous path
(`./node_modules/astro/tsconfigs/strict.json`) and clearing `.astro/` + `node_modules/.vite`
caches, the native resolver still reports the exact original bare-specifier string, and setting
`vite: { resolve: { tsconfigPaths: false } }` only shifts the failure to a broader
`[TSCONFIG_ERROR] Failed to load tsconfig for '<every .astro page>': Tsconfig not found` — i.e. the
native per-file JSX/TS transform tsconfig lookup fails independent of the alias-resolution feature
toggle. This points to a native-binding-level incompatibility (likely glibc/sandboxed-filesystem
specific) with `astro@7.0.6` + `vite@8.1.3` (rolldown-vite) in this execution sandbox, not a
project misconfiguration.

**Workaround used for this plan's verification:** Since `npm run build` cannot run to completion
in this sandbox, Task 1 and Task 2 were verified via equivalent static checks instead:
- `npx astro sync` (exercises the content-collection/type-generation pipeline) — passes cleanly.
- `grep`-based checks confirming no remaining imports of the deleted `GalleryCard.astro` or the
  deleted listing routes anywhere in `src/`.
- Manual diff review confirming the edits match the plan's specified line-for-line changes.
- File-existence assertions for the plan's acceptance criteria (deleted files gone,
  `GalleryGrid.astro` + both `[slug].astro` routes intact).

**Not fixed** (out of scope per SCOPE BOUNDARY — pre-existing, environment-wide, not caused by
this plan's task changes). GitHub Actions CI (`.github/workflows/deploy.yml`, `npm ci` + `npm run
build` on `ubuntu-latest`) remains the authoritative build gate and should be checked on push to
confirm this sandbox-specific failure does not reproduce there. If it does reproduce in CI, it
blocks deploy and needs a dedicated investigation/fix phase (likely pinning a different `vite`/
`rolldown` version or filing an upstream issue) — flag to the user before the next production
push.
