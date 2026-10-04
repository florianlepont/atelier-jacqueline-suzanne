# Contributing

This is a small personal project (the site of the photographer Romane Lepont), maintained by Florian Lepont. Pull requests are welcome for fixes and improvements to the code; the photographs, texts and brand are not open for reuse (see [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md)).

## Before you start

- Read the [`README.md`](README.md) setup section. You need a Sanity read token to build the site; without access, you can still run the unit tests (see the README for the two variables they need).
- Open an issue first for anything bigger than a small fix, so the direction can be agreed before you spend time on it.
- To report a vulnerability, do not open an issue: follow [`SECURITY.md`](SECURITY.md).

## Workflow

1. Branch from `main`. `main` is protected: changes go through a pull request, and the `checks` job must pass.
2. Keep each pull request focused on one thing.
3. Run the same checks CI runs, before pushing:

   ```bash
   npm run lint
   npm run typecheck
   npm run format:check     # fix with npm run format
   npm run test:unit        # export SANITY_PROJECT_ID and SANITY_DATASET first
   npm run build && npm run test:artifact
   npm --prefix sanity run lint && npm --prefix sanity run format:check && npm --prefix sanity run typecheck && npm --prefix sanity run test
   ```

   Playwright end-to-end tests (`npm run test:e2e`) run in CI on every push to `main`.
4. Add or update tests with the change. Several source-level tests (workflows, `.htaccess`, legal pages) fail on purpose when a documented invariant changes: update the test and the documentation together.
5. Open the pull request as a draft, describe what changes and how you checked it.

## Conventions

- Formatting is enforced by Prettier on `.ts`/`.mjs` files (`npm run format`, and `npm --prefix sanity run format` for the Studio); `.astro` templates are not auto-formatted. Match the surrounding code for naming and comment density.
- Content comes from Sanity at build time. Do not hard-code editorial text, addresses or prices in templates.
- Keep the build static: no server-side rendering and no new runtime dependency on a third-party host without discussing it first (the Content-Security-Policy in `public/.htaccess` will block it).
- Do not commit secrets, tokens, personal addresses or full-resolution photographs.

## Deploying

A merge to `main` does not deploy the site. It reaches production with the next content publish in the Sanity Studio, or when the maintainer runs the `Deploy to OVH production` workflow. See the Deployments section of the README.
