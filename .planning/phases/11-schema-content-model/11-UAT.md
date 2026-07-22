---
status: testing
phase: 11-schema-content-model
source: [11-VERIFICATION.md]
started: 2026-07-22T18:20:00Z
updated: 2026-07-22T18:20:00Z
---

## Current Test

number: 1
name: Drag-reorder a second édition in the hosted Studio's "Éditions" desk list
expected: |
  The list re-orders and the new order persists across a page refresh, identical to how
  "Collections photo" (galleries) already behaves.
awaiting: user response

## Tests

### 1. Drag-reorder with a real second édition
expected: In the hosted Studio, seed (or temporarily create) a second édition and drag-reorder
  it against "Rebut" in the "Éditions" desk list. The list re-orders and the new order persists
  across a page refresh, identical to how "Collections photo" (galleries) already behaves.
result: [pending]

### 2. Redeploy hosted Studio after the code-review fix commit
expected: Run `npm run deploy --prefix sanity` (has not run since commit c718414), then open the
  hosted Studio and confirm `leadPhoto` requires a "Crédits et droits" field, an `images` array
  item without an uploaded asset is blocked on publish, and `Dimensions → Unité` is a constrained
  cm/in list — all three code-review fixes (WR-01/WR-02/WR-03) live in the hosted Studio, matching
  repo HEAD.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
