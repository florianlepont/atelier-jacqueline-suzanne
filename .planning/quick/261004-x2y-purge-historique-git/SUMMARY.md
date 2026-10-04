---
status: complete
---
# 261004-x2y — Git history purge

- Tool: `git filter-repo` on a fresh mirror clone, with regex replacement of the address, city and postcode in file contents and commit messages (replaced by `[adresse retirée]`). Only 2 commits (2026-08-26 and 2026-10-04) carried it.
- Checked on all 1,765 rewritten commits: zero remaining occurrences of the address, the city or the postcode; the tree of `main` was byte-identical before the housekeeping commit.
- Force-pushed `main` and the working branches; Dependabot branches deleted (they were based on the old history; Dependabot recreates them on its next run).
- `.git-blame-ignore-revs` updated to the new hash of the Prettier formatting commit.
- Not covered by a push: GitHub keeps the old commits reachable through `refs/pull/*` and cached PR pages until GitHub Support removes them; forks or clones made before 2026-10-04 keep their copies.
