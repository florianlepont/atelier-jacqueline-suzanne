---
status: complete
---
# 261004-p3s — Pin GitHub Actions by SHA, add dependabot.yml

- Every external action in the 3 workflows and 2 composite actions is pinned to the full commit SHA of its latest v4 release (checkout 4.4.0, setup-node 4.4.0, cache 4.3.0, upload-artifact 4.6.2, download-artifact 4.3.0); the SFTP deploy action was already pinned. SHAs read from the upstream tags with `git ls-remote` (annotated tags peeled).
- New `.github/dependabot.yml`: weekly grouped updates for github-actions, npm (root) and npm (`sanity/`, with `sanity` ignored because it is pinned by hand). Dependabot also keeps the pins current.
- `ci-workflow.test.ts`: new invariants (every non-local `uses:` is a 40-hex SHA; dependabot config covers Actions and both npm projects); the checkout assertion accepts the SHA form.
- Still manual in the GitHub/Sanity UI (not code): scope of the webhook PAT, Sanity deploy token role, required reviewers on `production-ovh-auto`.
