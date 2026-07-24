# Deferred Items — 260724-dw6

## Pre-existing sanity/ typecheck errors (out of scope)

`cd sanity && npx tsc --noEmit -p tsconfig.json` reports 2 pre-existing errors in
`sanity/editorial/workflow.tsx` (DocumentBadgeComponent color type mismatch,
`"default"` not assignable to `"warning" | "success" | "primary" | "danger"`).
This file was not touched by this plan (only `sanity/schemas/edition.ts` was
modified for EDN-08) and the errors are unrelated to the `relatedGallery`
reference field added here. Per the SCOPE BOUNDARY rule, these are logged
but not fixed as part of this task.
