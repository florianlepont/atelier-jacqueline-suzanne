# Phase 13: Nav Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 13-nav-integration
**Areas discussed:** Position dans la nav, Stratégie mobile (4e lien)

---

## Position dans la nav

| Option | Description | Selected |
|--------|-------------|----------|
| Après Contact, avant Instagram | À propos → Contact → Éditions → Instagram — regroupe les 3 liens de contenu texte ensemble | |
| Entre À propos et Contact | À propos → Éditions → Contact → Instagram | |
| En premier, avant À propos | Éditions → À propos → Contact → Instagram — priorité visuelle la plus haute | ✓ |

**User's choice:** En premier, avant À propos.
**Notes:** No further questions on this area — moved directly to mobile strategy.

---

## Stratégie mobile (4e lien)

| Option | Description | Selected |
|--------|-------------|----------|
| Tout rétrécir sur une ligne (comme aujourd'hui) | Continue la méthode existante : rogner padding/gap/police itérativement (précédent Phase 7/10), mesuré en direct | ✓ |
| Autoriser un retour à la ligne sur les téléphones les plus étroits | Le header peut passer sur 2 lignes en dessous d'un certain seuil | |

**User's choice:** Tout rétrécir sur une ligne (comme aujourd'hui).

**Follow-up question:** Sur les téléphones les plus étroits (<359px), si l'espace reste insuffisant après les ajustements habituels, le libellé "Éditions" peut-il être abrégé (ex. "Éd.") ?

| Option | Description | Selected |
|--------|-------------|----------|
| Toujours en entier, quitte à rogner encore la police/le padding | Cohérent avec À propos/Contact qui restent toujours en entier aujourd'hui | |
| Abréviation autorisée en dernier recours | Si le rognage classique ne suffit pas, un libellé court ("Éd.") est acceptable | ✓ |

**User's choice:** Abréviation autorisée en dernier recours.
**Notes:** Explicit, scoped exception — À propos/Contact are never abbreviated; "Éditions" may be, only as a last resort after normal squeeze tricks are exhausted.

---

## Claude's Discretion

- English nav label wording — keep "Éditions" unchanged in English (no discussion question raised; default per site-wide convention in REQUIREMENTS.md/PROJECT.md/ROADMAP.md, none of which use an English variant of the term).
- `siteSettings.navLabels.editions` schema field shape — mirror `navLabels.about`/`navLabels.contact` exactly.
- Exact abbreviated form for "Éditions" below 359px (D-03) — "Éd." was the working example; any short recognizable form is acceptable, verify live.
- Whether the nav link gets a "current page" active-state treatment — default to no, matching existing About/Contact behavior.

## Deferred Ideas

None — discussion stayed within Phase 13's nav-wiring scope.
