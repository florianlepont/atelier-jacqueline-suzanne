# Phase 11: Schema & Content Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-22
**Phase:** 11-schema-content-model
**Areas discussed:** Rebut naming overlap, Lead photo modeling, Format details field shape, Seed content readiness, Édition photo content, Seed édition & sign-off status

---

## Rebut naming overlap (blocks success criterion #5)

| Option | Description | Selected |
|--------|-------------|----------|
| Same subject — move to Éditions | Portfolio "Rebut" gallery is the édition's photo shoot migrated to the wrong section; move it | |
| Unrelated — keep both, same name | Two different things sharing a name; keep both independently | |
| Not resolved yet — flag as blocking | Romane hasn't been asked; seed a different édition and flag as a checkpoint | |

**User's choice:** Free text — "Actually it's the same subject, but the gallery presents the pictures. The edition is a printed editions of this picture collection. But I want to keep both part separated. One idea is that at the end of the gallery I can have a link to the Edition and vice versa."
**Notes:** Same underlying subject, deliberately kept as two separate documents/pages. Cross-link idea matches EDN-08, already tracked as deferred in REQUIREMENTS.md's v2 section — not built in this phase.

---

## Rebut sign-off status & seed édition (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Rebut — my call, Romane not yet asked | Seed Rebut; flag resolution as needing a checkpoint before recording as Confirmed | |
| Rebut — already confirmed with Romane | Seed Rebut; record directly as Confirmed in PROJECT.md | ✓ |
| A different édition (specify) | Seed something else instead | |

**User's choice:** Rebut — already confirmed with Romane
**Notes:** No additional human-sign-off checkpoint needed before seeding; resolution recorded as Confirmed in CONTEXT.md D-02, to be logged in PROJECT.md's Key Decisions during phase execution (satisfies success criterion #5).

---

## Lead photo modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated lead photo field | Separate `leadPhoto` field, independent of the photo-shoot array order | ✓ |
| Reuse gallery's first-image convention | No separate field; overview uses `images[0]` like gallery does | |

**User's choice:** Dedicated lead photo field
**Notes:** Matches the roadmap success criterion's literal wording (lead photo + full photo-shoot array as two separate things).

---

## Format details field shape

| Option | Description | Selected |
|--------|-------------|----------|
| Structured | pageCount: number, printRun: number, dimensions: object (width/height/unit) | ✓ |
| Mixed — dimensions as free text | pageCount/printRun as numbers, dimensions as a single string | |

**User's choice:** Structured
**Notes:** Print run locked as number by success criterion #3. Structured dimensions keep the door open for a future shop/commerce field group without restructuring.

---

## Seed content readiness

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — real content ready | Florian has real photos/statement/format details ready to seed | ✓ |
| Not yet — placeholder for now | Seed with realistic placeholder content, Romane fills in later | |

**User's choice:** Yes — real content ready
**Notes:** Confirmed for the "Rebut" édition specifically (see seed édition question above).

---

## Édition photo content (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Photos of the printed object | Cover, spreads, binding, physical pages — documents the printed artifact | ✓ |
| Same/overlapping photographic content | Reuse the gallery's photographic subject matter | |

**User's choice:** Photos of the printed object
**Notes:** Reinforces that the édition presents the printed artifact itself, not a re-presentation of the gallery's photography — a deliberate content distinction, not just a schema-naming one.

---

## Claude's Discretion

- Exact Studio field/group French labels (e.g. "Détails du format").
- Whether `dimensions.unit` is a fixed default or a select list.
- Internal field/group naming beyond what's explicitly specified.
- Whether to reuse `PublishedPageLinks` now or wire it in Phase 12.

## Deferred Ideas

- Gallery ↔ édition cross-link (EDN-08) — optional link between a gallery and its related édition, already tracked in REQUIREMENTS.md's v2 section as a future v1.x phase. Not built in Phase 11; schema should not preclude adding it later.

---

*Phase: 11-schema-content-model*
*Context gathered: 2026-07-22*
