---
phase: quick-260813-whb-correct-stale-claude-md-github-actions-p
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - CLAUDE.md
autonomous: true
requirements: [QUICK-260813-WHB]
---

## Objective

Correct CLAUDE.md's "GitHub Actions pipeline" description, stale on 3 counts after recent CI changes (kog-06 added a root lint step and Studio test:coverage; Phase 5-01 added a PHP-artifact-strip step, none reflected in the doc).

<task>
<name>Correct the pipeline description sentence in CLAUDE.md</name>
<files>CLAUDE.md</files>
<action>
Rewrite the pipeline sentence to insert "Lint (root)" (npm run lint) as its own blocking gate right after the Sanity Studio step and before typecheck; mention test:coverage running as part of the Sanity Studio step; insert the "strip the PHP endpoint from the Pages artifact" step right after verifying the GitHub Pages static artifact and before uploading it. Verified against .github/workflows/deploy.yml's actual step names before rewriting.
</action>
<verify>grep -c "Lint (root)\|strip the PHP endpoint" CLAUDE.md</verify>
<done>CLAUDE.md's pipeline description matches deploy.yml's actual step order and content exactly.</done>
</task>

No packages added — Package Legitimacy Gate not applicable.
