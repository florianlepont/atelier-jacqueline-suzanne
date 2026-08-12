# Quick Task 260812-bj1: Retravailler le vocabulaire et la mise en page visuelle du tableau de bord Sanity Studio pour que le parcours de publication soit clair pour Romane - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Task Boundary

Retravailler le vocabulaire et la mise en page visuelle du tableau de bord Sanity Studio
(`sanity/editorial/EditorialDashboard.tsx` / `.css`, et `sanity/README.md`) pour que le
parcours de publication soit clair pour Romane (non-technique), **sans changer le
mécanisme sous-jacent**.

Contexte : la fonctionnalité "Mettre en production" (quick task 260811-w8d, sketch 016
Variant C) est déjà construite, déployée sur le Studio réel, et fonctionnelle de bout en
bout. En la regardant en vrai, l'utilisateur (Florian) a trouvé l'interface confuse : il ne
comprenait pas pourquoi deux boutons distincts existent ni ce que fait chacun. Après
discussion, la conclusion est que les deux actions doivent **rester structurellement
séparées** (ce ne sont pas les mêmes préconditions ni le même effet — voir
Contrainte d'architecture ci-dessous), mais l'habillage (mots, hiérarchie visuelle) doit
changer pour rendre cette relation lisible.

</domain>

<decisions>
## Implementation Decisions

### Contrainte d'architecture à ne PAS remettre en cause
- Les deux actions ("mettre à jour le contenu" et "publier sur le site en ligne")
  restent deux boutons distincts, jamais fusionnés en un bouton unique dynamique.
  Raison validée avec l'utilisateur : ce sont deux états indépendants dans le temps
  (du nouveau contenu peut être en attente de publication ET une promotion vers le site
  réel peut être en attente, simultanément — cf. `releasePipelineState()` dans
  `sanity/editorial/deployment.ts`). Un bouton unique masquerait forcément l'une des
  deux actions selon l'état courant.

### Vocabulaire site de test / site réel
- "Staging" devient **"Site de test"**.
- "Production" devient **"Site en ligne"**.
- Ces deux termes remplacent tout jargon technique visible par Romane dans le tableau
  de bord et dans `sanity/README.md`.

### Libellé du bouton de promotion
- Le bouton "Mettre en production" devient **"Publier sur le site en ligne"**.
- Le bouton existant "Mettre le site à jour" (publication du contenu Sanity) garde son
  nom actuel — seul le bouton de promotion est renommé.

### Hiérarchie visuelle entre les deux étapes
- Les deux actions sont regroupées dans **une même carte**, avec une **numérotation
  explicite "Étape 1" / "Étape 2"** — pas deux cartes séparées, pas de fusion en un
  bouton unique. La numérotation doit rendre visible que l'étape 2 dépend de l'étape 1
  sans changer leur indépendance fonctionnelle (l'étape 2 peut être grisée/désactivée
  tant que l'étape 1 n'a pas produit un site de test à jour, mais reste un contrôle
  séparé et toujours visible).

### Niveau de détail de la barre d'état
- Simplifier la barre actuelle à 3 segments (Contenu / Staging / Production) à
  **2 segments** : le segment "Contenu" est fusionné avec "Site de test" (ils
  avancent presque toujours ensemble du point de vue de Romane), et "Site en ligne"
  reste un segment séparé.
- Réutiliser la logique d'état déjà présente dans `releasePipelineState()` — ce
  changement est un changement d'affichage/vocabulaire, pas un changement de state
  machine. Si la fusion à 2 segments nécessite d'adapter la fonction, le faire de
  façon minimale (ne pas réintroduire de state supplémentaire).

### Claude's Discretion
- Détails visuels précis de la numérotation Étape 1/Étape 2 (taille, position,
  style — respecter la charte Sanity Studio dark existante, aucune nouvelle couleur).
- Formulation exacte des textes d'état sous chaque étape (garder l'esprit des textes
  du sketch 016 : "En attente…", "Prêt à publier ?", "Publication en cours…", etc.,
  adaptés au nouveau vocabulaire site de test/site en ligne).
- Comportement du segment fusionné "Contenu + Site de test" dans les cas d'échec
  (actuellement le sketch distingue un échec de contenu vs un échec de staging —
  décider si ça reste distinguable dans le texte d'état même si le segment visuel
  est fusionné).

</decisions>

<specifics>
## Specific Ideas

Le sketch 016 (`.planning/sketches/016-dashboard-deploy-stepper/`, Variant C : barre
segmentée compacte) reste la base visuelle de référence pour le style général (barre de
progression + ligne d'action dynamique), mais ce quick task en modifie le nombre de
segments (3→2), le vocabulaire, et ajoute le regroupement "Étape 1/Étape 2" dans une
carte commune — ce n'est pas un nouveau sketch, c'est un ajustement du sketch existant
déjà implémenté.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/sketches/016-dashboard-deploy-stepper/index.html` et `README.md` — design
  visuel de référence (Variant C), dont ce quick task ajuste le vocabulaire et le
  regroupement.
- `.planning/quick/260811-w8d-build-the-real-mettre-en-production-feat/` — le quick
  task qui a construit le mécanisme actuel (PLAN.md, SUMMARY.md, VERIFICATION.md) :
  contient le detail de `releasePipelineState()` et des must_haves d'architecture à
  préserver ici.
- `sanity/editorial/deployment.ts`, `dashboardLogic.ts`, `EditorialDashboard.tsx/.css`,
  `sanity/README.md` — fichiers à modifier.

</canonical_refs>
