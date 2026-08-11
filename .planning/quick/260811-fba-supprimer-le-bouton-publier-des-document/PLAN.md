---
phase: quick-260811-fba-supprimer-le-bouton-publier-des-document
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements:
  - QUICK-260811-FBA
must_haves:
  truths:
    - "Les sept types de contenu public n'offrent ni Publier ni Dépublier depuis leur fiche Studio ; les modifications restent des brouillons auto-enregistrés."
    - "La seule mutation qui publie du contenu public reste la publication atomique déclenchée par le bouton existant « Mettre le site à jour » du Tableau de bord."
    - "Le périmètre est déjà satisfait dans le code courant : l'exécution ne modifie aucun fichier de production ou de test."
  artifacts:
    - "sanity/sanity.config.ts relie document.actions à resolveActions"
    - "sanity/editorial/workflow.tsx délègue à filterDocumentActions"
    - "sanity/editorial/workflowLogic.ts applique la politique aux sept types publics"
    - "tests/unit/workflow-logic.test.ts couvre l'absence des actions documentaires de publication"
  key_links:
    - "sanity.config.ts -> resolveActions -> filterDocumentActions : les actions Sanity rendues dans chaque fiche publique"
    - "EditorialDashboard.tsx -> createPublicationController -> client.action(..., {tag: 'editorial.publish-all'}) : unique chemin de publication"
---

<objective>
Constater et verrouiller le retrait déjà présent des boutons de publication par document Sanity Studio, sans modifier l'implémentation : les fiches publiques auto-enregistrent des brouillons et le Tableau de bord conserve l'unique commande de mise en ligne.

Purpose: éviter de réintroduire par erreur un second chemin de publication ou de toucher à une implémentation déjà conforme.
Output: une vérification ciblée et un SUMMARY déclarant explicitement l'absence de changement de code.
</objective>

<context>
@AGENTS.md
@sanity/sanity.config.ts
@sanity/editorial/workflow.tsx
@sanity/editorial/workflowLogic.ts
@sanity/editorial/EditorialDashboard.tsx
@sanity/editorial/dashboardLogic.ts
@tests/unit/workflow-logic.test.ts
@tests/unit/dashboard-logic.test.ts

<facts_verified_at_planning_time>
- `sanity/sanity.config.ts` définit `document.actions: resolveActions`.
- `resolveActions` appelle `filterDocumentActions(prev, context.schemaType)`.
- `filterDocumentActions` retire `publish` et `unpublish` pour exactement `siteSettings`, `homePage`, `editionsPage`, `aboutPage`, `contactPage`, `gallery` et `edition`, tout en conservant les actions de gestion de brouillon ; les singletons retirent aussi delete/duplicate.
- Le Tableau de bord rend le bouton « Mettre le site à jour » et son contrôleur envoie l'unique appel `client.action(..., {tag: 'editorial.publish-all'})`.
- Les tests unitaires existants prouvent déjà cette politique et le chemin de publication global.
</facts_verified_at_planning_time>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Vérifier le contrat actions-documentaires / tableau de bord sans modifier les sources</name>
  <files>sanity/sanity.config.ts, sanity/editorial/workflow.tsx, sanity/editorial/workflowLogic.ts, sanity/editorial/EditorialDashboard.tsx, sanity/editorial/dashboardLogic.ts, tests/unit/workflow-logic.test.ts, tests/unit/dashboard-logic.test.ts</files>
  <action>Relire les fichiers listés et confirmer que le chaînage `document.actions -> resolveActions -> filterDocumentActions` est intact, que les sept types publics ne conservent aucune action `publish` ou `unpublish`, et que `discardChanges`/`restore` restent possibles. Confirmer séparément que le bouton existant « Mettre le site à jour » appelle le contrôleur global, lequel publie par son unique Actions API taggé `editorial.publish-all`. Ne modifier ni code, ni tests, ni configuration : ces conditions sont déjà satisfaites. Si l'une d'elles n'est plus vraie au moment de l'exécution, arrêter l'exécution et signaler la dérive plutôt que d'élargir ce quick task sans nouvelle planification.</action>
  <verify>
    <automated>npm run test:unit -- tests/unit/workflow-logic.test.ts tests/unit/dashboard-logic.test.ts</automated>
  </verify>
  <done>Les tests établissent que les fiches publiques ne proposent pas de publication individuelle et que la publication reste centralisée dans le contrôleur du Tableau de bord ; aucun fichier applicatif ou de test n'a été modifié.</done>
</task>

<task type="auto">
  <name>Task 2: Vérifier que la configuration Studio compile sans toucher au dataset de production</name>
  <files>sanity/sanity.config.ts, sanity/editorial/workflow.tsx, sanity/editorial/workflowLogic.ts</files>
  <action>Compiler le sous-projet Studio pour vérifier que le resolver d'actions configuré est chargeable avec la politique existante. Ne lancer aucune interaction manuelle avec le Studio et ne cliquer sur aucun bouton de publication : le dataset configuré est `production` et aucune mutation n'est nécessaire pour ce contrôle. Vérifier ensuite que `git diff --name-only` ne contient aucun fichier de production ni de test ajouté par cette exécution ; les éventuels fichiers déjà sales appartenant à l'utilisateur ne doivent ni être modifiés ni rétablis.</action>
  <verify>
    <automated>npm --prefix sanity run build</automated>
  </verify>
  <done>Le build Studio passe, aucun contenu n'est publié, et cette tâche ne produit aucun changement applicatif ou de test.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Éditrice -> fiche Studio | Une publication individuelle accidentelle contournerait le contrôle global. |
| Tableau de bord -> Sanity Actions API | Seul chemin autorisé de mutation vers le dataset `production`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-QUICK-260811-FBA-01 | Tampering | Actions par fiche Studio | high | mitigate | Le filtre testé retire les deux actions de publication de chaque type public, tout en conservant la gestion de brouillon. |
| T-QUICK-260811-FBA-02 | Elevation of Privilege | Tableau de bord / Actions API | high | mitigate | Le plan vérifie le chemin global existant uniquement ; il ne crée aucun autre appel de mutation et ne lance aucune publication réelle. |
| T-QUICK-260811-FBA-03 | Repudiation | Vérification locale | low | accept | Les commandes sont lecture/compilation seulement ; le SUMMARY devra signaler l'absence de mutation et de publication. |

## ASVS Applicability (level 1)

Pas de nouvelle surface applicative : vérification d'une politique Studio existante.
</threat_model>

<verification>
- `npm run test:unit -- tests/unit/workflow-logic.test.ts tests/unit/dashboard-logic.test.ts` passe.
- `npm --prefix sanity run build` passe.
- Le contrôle de la politique couvre les actions `publish`/`unpublish`, la conservation des actions de brouillon et le chemin unique du Tableau de bord.
- Aucun fichier applicatif ou de test n'est ajouté au diff ; les modifications préexistantes de l'utilisateur restent intactes.
</verification>

<success_criteria>
- Les actions documentaires de publication sont absentes des sept fiches publiques, lesquelles continuent d'auto-enregistrer en brouillon.
- Le bouton « Mettre le site à jour » du Tableau de bord reste l'unique déclencheur de publication.
- La vérification ne publie aucun contenu et ne modifie aucun fichier source, test ou configuration.
</success_criteria>

<output>
Créer `.planning/quick/260811-fba-supprimer-le-bouton-publier-des-document/SUMMARY.md` après les vérifications, en indiquant que le comportement était déjà conforme, qu'aucune publication réelle n'a été déclenchée et qu'aucun fichier de code n'a été modifié. Ne pas committer sans validation explicite de l'utilisateur.
</output>
