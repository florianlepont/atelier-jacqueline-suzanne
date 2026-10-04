---
status: complete
---
# 261004-m1d — Dependency audit fixes

- Root: `npm audit` 8 → 0 (lockfile refresh for brace-expansion, devalue, fast-uri, http-cache-semantics, undici; vitest + @vitest/coverage-v8 pinned 4.1.9 → 4.1.11).
- sanity/: 25 → 11 (vitest bump, lockfile refresh, overrides `adm-zip` 0.6.1 and `@module-federation/dts-plugin > undici` 7.30.0). `sanity` stays pinned at 6.6.0 (npm's suggested fix `sanity@5.14.1` is a downgrade and was not applied).
- Remaining 11 (high): braces, micromatch, fast-glob, globby, chokidar, js-yaml, smol-toml and their parents `@sanity/cli`, `@sanity/codegen`, `@vercel/frameworks`, `sanity`. Dev-time CLI tooling inside the Studio subproject, never shipped to the public site; no patched version exists upstream (braces/micromatch/fast-glob are at their latest). js-yaml/smol-toml are already pinned by an existing override. Revisit when Sanity ships a release that updates them.
- Note: `npm install`/`audit fix` crash (arborist `edgesOut`) on the vitest peer set; installs were done with `--legacy-peer-deps`, and `npm ci` (strict) passes.
- Gates: sanity lint/typecheck/test:coverage/build, root lint/typecheck/test:unit (765)/build/test:artifact all green. e2e not run locally (CI).
