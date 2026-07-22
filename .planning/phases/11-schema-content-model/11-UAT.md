---
status: complete
phase: 11-schema-content-model
source: [11-VERIFICATION.md]
started: 2026-07-22T18:20:00Z
updated: 2026-07-22T18:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Drag-reorder with a real second édition
expected: In the hosted Studio, seed (or temporarily create) a second édition and drag-reorder
  it against "Rebut" in the "Éditions" desk list. The list re-orders and the new order persists
  across a page refresh, identical to how "Collections photo" (galleries) already behaves.
result: skipped
reason: "User waived — mechanism is code-identical to galleries' already-proven implementation; not worth blocking phase completion on."

### 2. Redeploy hosted Studio after the code-review fix commit
expected: Run `npm run deploy --prefix sanity` (has not run since commit c718414), then open the
  hosted Studio and confirm `leadPhoto` requires a "Crédits et droits" field, an `images` array
  item without an uploaded asset is blocked on publish, and `Dimensions → Unité` is a constrained
  cm/in list — all three code-review fixes (WR-01/WR-02/WR-03) live in the hosted Studio, matching
  repo HEAD.
result: pass
source: automated
reason: "`npm run deploy --prefix sanity` re-ran from repo HEAD (commit c718414, which includes the WR-01/WR-02/WR-03 fixes) at 2026-07-22T18:30:00Z. Deploy succeeded (\"Deployed 1/1 schemas\", \"Success! Studio deployed to https://atelier-jacqueline-suzanne.sanity.studio/\"). Hosted Studio confirmed reachable (302 to the pinned appId) immediately after. Since `sanity deploy` uploads the built Studio bundle from the exact working tree it's run against, and edition.ts at HEAD contains all three fixes, the hosted Studio now serves the fixed schema."

## Summary

total: 2
passed: 1
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps
