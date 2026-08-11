---
phase: quick-260811-gdi
plan: 01
subsystem: cms
tags: [sanity, studio, editions]

requires:
  - phase: edition schema
    provides: Existing `relatedGallery` reference and public rendering
provides:
  - Dedicated « Collection liée » tab for the existing Edition-to-Gallery reference
affects: [sanity-studio-edition]

key-files:
  modified:
    - sanity/schemas/edition.ts
  created:
    - .planning/quick/260811-gdi-d-placer-dans-sanity-le-champ-collection/260811-gdi-PLAN.md
    - .planning/quick/260811-gdi-d-placer-dans-sanity-le-champ-collection/260811-gdi-SUMMARY.md

key-decisions:
  - "Use the new internal group name `relatedCollection` while preserving the persisted `relatedGallery` field name."
  - "Keep the existing `gallery` reference target and public query/rendering untouched."

requirements-completed: [260811-gdi]

verification:
  - command: npm --prefix sanity run build
    status: pass
    notes: "Passed after granting the build its required network access to resolve Sanity's remote runtime module."

completed: 2026-08-11
status: complete
---

# Move `relatedGallery` to the Collection liée Studio tab

Added the `relatedCollection` group, titled « Collection liée », to the Édition schema and assigned the existing `relatedGallery` field to it. The field name, `gallery` reference target, description, and all public data/rendering paths are unchanged, so existing documents continue to work without migration.

## Verification

- `npm --prefix sanity run build` passed.

## Scope

No deployment or commit was made. The unrelated pre-existing quick-task worktree change was left untouched.
