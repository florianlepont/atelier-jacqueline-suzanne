---
status: complete
---
# 261004-u8f — Prettier

- Prettier 3.9.4 (exact) added at the root with `.prettierrc.json` (semi, single quotes, width 100) and `.prettierignore`; the Studio keeps its own config (no semicolons, no bracket spacing). Scripts: `format` / `format:check` in both projects. Scope is `.ts`/`.mjs` only: `.astro` templates are NOT auto-formatted because inline whitespace can be significant.
- CI: the shared composite action `lint-typecheck-and-install` now runs both format checks (blocking), so PR checks, `ci.yml` and `deploy-ovh.yml` all enforce it. A test guards the step.
- One formatting-only commit (`85ae2db76bcfa4bb7fc0b455a0d35e66829a1805`) rewrote 103 files; it is listed in `.git-blame-ignore-revs`. Proof of no behaviour change: the built site (all files except the prerender scratch folder) hashes identically before and after; lint, typecheck, 725 unit tests, Studio lint/typecheck/coverage/build all pass.
- Docs: README scripts table and CONTRIBUTING mention the commands.
