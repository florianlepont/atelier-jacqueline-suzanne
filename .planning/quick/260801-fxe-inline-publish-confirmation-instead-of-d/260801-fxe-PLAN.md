---
phase: quick-260801-fxe
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260801-fxe]
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
must_haves:
  truths:
    - "Cliquer sur « Mettre le site à jour » ne fait plus apparaître de fenêtre modale : le bouton lui-même est remplacé, sur place dans le panneau, par une demande de confirmation."
    - "La demande de confirmation est écrite en français courant, grammaticalement correcte à 1 comme à N contenus, sans jargon technique de traitement par lot, et sans répéter la répartition par catégorie déjà lisible dans la liste du panneau."
    - "Le garde-fou reste obligatoire : « Confirmer » est le seul chemin vers une publication réelle, « Annuler » ramène le panneau à son bouton « Mettre le site à jour » sans rien publier."
    - "Si le lot a changé entre la demande et la confirmation, l'erreur de la phase confirming reste affichée, désormais dans le panneau, et reste visuellement distincte de son conteneur."
    - "Aucun comportement de publication n'a changé : requestPublication, confirmPublication, publicationController, publicationCardState, le garde de génération et les empreintes de révision sont strictement inchangés."
  artifacts:
    - path: "sanity/editorial/EditorialDashboard.tsx"
      provides: "Panneau « Mettre le site à jour » à deux états (bouton d'appel / confirmation inline), sans composant modal"
  key_links:
    - "publicationCard.dialogOpen (dashboardLogic.ts:430, pass-through de confirmationOpen) pilote désormais le rendu à deux états du panneau au lieu de l'ouverture d'un overlay"
    - "confirmationBatch (EditorialDashboard.tsx:364) reste la source du décompte affiché dans la confirmation — le lot figé du préflight, pas le snapshot live"
    - "publicationState.phase === 'confirming' && publicationState.error reste rendu : c'est le signal « le lot a changé sous vos pieds »"
---

<objective>
Remplacer la popup modale de confirmation de publication du tableau de bord Sanity Studio par une confirmation inline, affichée directement dans le panneau « Mettre le site à jour », et réécrire son message en français clair pour Romane (utilisatrice non technique).

Purpose: l'étape de confirmation est le SEUL garde-fou avant une publication réelle en production — elle est conservée telle quelle. Ce qui change est sa forme (overlay modal -> deux états du panneau) et sa formulation (le texte actuel est faux au singulier et parle de « lot » / d'« élément qui échoue », vocabulaire inutilisable pour l'utilisatrice réelle).

Output: `sanity/editorial/EditorialDashboard.tsx` sans composant modal, avec un panneau à deux états et un message de confirmation compréhensible.
</objective>

<execution_context>
@.claude/gsd-core/workflows/execute-plan.md
@.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@sanity/editorial/EditorialDashboard.tsx
@sanity/editorial/dashboardLogic.ts
</context>

<facts_verified_at_planning_time>
Vérifié par grep sur les sources (hors `sanity/dist/`) au moment de la planification — à re-vérifier avant suppression, mais déjà établi :

- Le composant modal de `@sanity/ui` n'apparaît QUE dans `EditorialDashboard.tsx`, aux lignes 3 (import), 822 et 873 (usage unique). Aucun autre fichier source ne l'utilise. Son import peut donc être retiré.
- Aucun test ne référence l'identifiant `editorial-publication-confirmation` ni le composant modal. `tests/unit/dashboard-logic.test.ts` ne teste que le champ pur `dialogOpen` produit par `publicationCardState` (lignes 454, 475, 513) — ce champ ne change pas, ces tests doivent rester verts sans modification.
- `PublicationCategory` (import ligne 54) reste utilisé ligne 60 (`Record<PublicationCategory, string>`) même après suppression de la ventilation par catégorie — ne pas retirer cet import.
- `publicationCategoryLabels` (ligne 60) reste utilisé ligne 569 (badge de chaque contenu listé) — ne pas le retirer.
- `pluralize(count, singular, plural)` (`dashboardLogic.ts:686`) renvoie le pluriel uniquement quand `count > 1` : à N=1 il renvoie le singulier. C'est l'outil correct pour corriger la faute d'accord actuelle.
- `npm run lint` à la racine ignore `sanity/` (`eslint.config.mjs:18`). Le vrai lint de ce fichier est `npm --prefix sanity run lint`. `npm run typecheck` (astro check) ne couvre pas non plus ce fichier ; `npm --prefix sanity run build` est le gate de compilation réel.
</facts_verified_at_planning_time>

<!-- planner-discipline-allow: Dialog -->
<!-- planner-discipline-allow: échoue -->
<!-- planner-discipline-allow: editorial-publication-confirmation -->

<tasks>

<task type="auto">
  <name>Task 1: Remplacer la confirmation modale par une confirmation à deux états dans le panneau</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
Refactor de présentation uniquement dans `sanity/editorial/EditorialDashboard.tsx`. Aucune fonction, aucun state, aucun contrôleur ne change de comportement.

(1) SUPPRIMER le bloc modal entier, actuellement lignes 821-874 : la garde `{publicationCard.dialogOpen && ( ... )}` et le composant `Dialog` de `@sanity/ui` qu'elle contient (id `editorial-publication-confirmation`, header « Confirmer la mise à jour du site », `onClose`, `width={1}`), avec tout son contenu — texte de comptage, ventilation par catégorie, et les deux boutons Annuler/Confirmer. Ce bloc était le frère du `<Box>` fermé ligne 820, juste avant le `</div>` de fin de composant.

(2) RETIRER `Dialog` de la liste d'imports nommés de `@sanity/ui` ligne 3. Re-vérifier d'abord par grep sur `sanity/editorial`, `sanity/schemas`, `sanity/plugins`, `tests` (en excluant `sanity/dist/`) qu'il n'est utilisé nulle part ailleurs. NE PAS toucher aux autres imports de cette ligne (`Badge`, `Box`, `Button`, `Card`, `Flex`, `Heading`, `Spinner`, `Stack`, `Text`), tous encore utilisés. NE PAS retirer l'import de type `PublicationCategory` (ligne 54) ni la constante `publicationCategoryLabels` (ligne 60) : tous deux restent utilisés ailleurs dans le fichier.

(3) Dans l'en-tête du panneau « Mettre le site à jour » — le `<Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">` ouvert ligne 505 — REMPLACER l'unique `<Button>` (lignes 529-536) par une expression conditionnelle sur `publicationCard.dialogOpen`, produisant deux états mutuellement exclusifs occupant le même emplacement :

État normal (`publicationCard.dialogOpen` faux) : rendre le `<Button>` actuel à l'identique, sans modifier une seule de ses props — `tone="primary"`, `text={publicationBusy ? 'Vérification…' : 'Mettre le site à jour'}`, `disabled={publicationCard.buttonDisabled}`, `loading={publicationBusy}`, `onClick={() => void requestPublication()}`, `style={{minHeight: 44}}`.

État confirmation (`publicationCard.dialogOpen` vrai) : rendre à la place un `<Card padding={3} radius={2} tone="caution" style={{flex: '1 1 320px'}}>` contenant un `<Stack space={3}>` avec, dans cet ordre :
  a. un `<Stack space={2}>` de deux `<Text>` : d'abord un `<Text size={1} weight="semibold">` contenant exactement `Publier maintenant sur le site public ?` ; ensuite un `<Text size={1}>` contenant le décompte construit avec le helper `pluralize` sur `confirmationBatch.total`, forme singulier `contenu sera visible` et forme pluriel `contenus seront visibles`, suivi de ` par tout le monde.` — c'est-à-dire `{confirmationBatch.total} contenu sera visible par tout le monde.` à N=1 et `{confirmationBatch.total} contenus seront visibles par tout le monde.` à N>1. Utiliser `confirmationBatch.total` (ligne 364, le lot figé par le préflight), PAS `publicationCard.total` (le snapshot live) : le nombre confirmé doit être celui qui sera réellement publié.
  b. la garde d'erreur existante, déplacée telle quelle depuis l'ancien modal : `publicationState.phase === 'confirming' && publicationState.error` rend un `<Card padding={3} radius={2}>` avec un `<Text size={1}>{publicationState.error}</Text>`. CHANGER uniquement sa `tone` de `caution` à `critical` : le conteneur parent est désormais lui-même `tone="caution"`, une carte caution imbriquée dans une carte caution serait invisible.
  c. un `<Flex gap={2} justify="flex-end" wrap="wrap">` contenant les deux boutons, dans cet ordre : « Annuler » (`text="Annuler"`, `mode="bleed"`, `disabled={publicationBusy}`, `onClick={() => setConfirmationOpen(false)}`, `style={{minHeight: 44}}`) puis « Confirmer » (`tone="primary"`, `text={publicationState.phase === 'publishing' ? 'Publication…' : 'Confirmer'}`, `loading={publicationBusy}`, `disabled={publicationBusy}`, `onClick={() => void confirmPublication()}`, `style={{minHeight: 44}}`). Reprendre l'expression de texte du bouton Confirmer à l'identique de l'ancien modal (test sur `publicationState.phase === 'publishing'`) pour garantir zéro changement de comportement. Le `style={{minHeight: 44}}` sur les deux boutons est un ajout délibéré : la cible tactile 44px est la convention du panneau, que l'ancien modal n'appliquait pas.

(4) NE PAS ajouter d'`autoFocus` sur « Confirmer », ni de soumission par touche Entrée. Sans le piège de focus du modal, un focus automatique transformerait une frappe parasite en publication réelle en production.

(5) NE PAS répéter la ventilation par catégorie (Modifié / Nouveau / …) : ces mêmes contenus sont déjà listés nommément juste en dessous dans le panneau (`publicationCard.pairs.map`, lignes 543-574). NE PAS réintroduire de vocabulaire de traitement par lot ni de vocabulaire d'échec technique dans le nouveau message — le message doit tenir en deux phrases lisibles par une personne non technique.

(6) NE MODIFIER AUCUNE de ces définitions : `requestPublication` (372-375), `confirmPublication` (377-390), `publicationController`, `publicationCardState`, `publicationBusy` (355-357), `publicationPanelHasBody` (365-370), `confirmationOpen`/`setConfirmationOpen` (83), le garde de génération, les empreintes de révision, ni quoi que ce soit dans `sanity/editorial/dashboardLogic.ts`. Le champ `dialogOpen` produit par `publicationCardState` garde son nom : seule sa consommation change.

(7) Ne laisser dans le fichier aucun commentaire de code mentionnant le composant modal supprimé ni son ancien identifiant : la suppression doit être vérifiable par grep.
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website && test "$(grep -c 'Dialog' sanity/editorial/EditorialDashboard.tsx)" = 0 && ! grep -q 'editorial-publication-confirmation' sanity/editorial/EditorialDashboard.tsx && ! grep -q 'échoue' sanity/editorial/EditorialDashboard.tsx && grep -q 'Publier maintenant sur le site public' sanity/editorial/EditorialDashboard.tsx && grep -q 'contenus seront visibles' sanity/editorial/EditorialDashboard.tsx && grep -q 'publicationCard.dialogOpen' sanity/editorial/EditorialDashboard.tsx && grep -q "publicationState.phase === 'confirming' && publicationState.error" sanity/editorial/EditorialDashboard.tsx && echo VERIFY_OK</automated>
    <automated>cd /Users/florian/Projects/ajs-website && git diff --name-only | grep -qx 'sanity/editorial/EditorialDashboard.tsx' && test "$(git diff --name-only | wc -l | tr -d ' ')" = 1 && echo SCOPE_OK</automated>
    <automated>cd /Users/florian/Projects/ajs-website && npm --prefix sanity run lint && npm --prefix sanity run build</automated>
  </verify>
  <done>
Le fichier ne contient plus aucune occurrence du composant modal ni de son identifiant ; le panneau « Mettre le site à jour » affiche soit son bouton d'appel, soit — quand `publicationCard.dialogOpen` est vrai — la question `Publier maintenant sur le site public ?`, le décompte accordé correctement au singulier comme au pluriel, l'erreur éventuelle de la phase confirming, et les boutons Annuler/Confirmer ; le lint et le build Sanity Studio passent ; `git diff --name-only` ne liste que `sanity/editorial/EditorialDashboard.tsx`.
  </done>
</task>

<task type="auto">
  <name>Task 2: Passer la suite de gates complète et vérifier l'affichage en direct sans publier</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
Exécuter la suite de vérification complète du dépôt et confirmer l'absence de régression, puis faire valider l'affichage réel.

(1) Lancer, depuis la racine du dépôt : `npm run test:unit`, `npm run lint`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`. Les trois premiers ne couvrent pas ce fichier (le lint racine ignore `sanity/`, `astro check` ne type-checke pas le sous-projet Studio) : ils servent de contrôle de non-régression du reste du dépôt. Les deux derniers sont les gates réels de ce changement.

(2) Confirmer explicitement que `tests/unit/dashboard-logic.test.ts` reste vert SANS avoir été modifié : le champ `dialogOpen` produit par `publicationCardState` est inchangé, donc toute modification de ce fichier de test signalerait une dérive de logique métier et doit être annulée.

(3) Vérification visuelle sur le serveur `sanity dev` déjà lancé sur localhost:3333. AVERTISSEMENT OPÉRATIONNEL : ce Studio est branché sur le dataset RÉEL `production`. Ne JAMAIS cliquer sur « Confirmer » pendant la vérification. Le préflight déclenché par « Mettre le site à jour » est en lecture seule et ne publie rien : il est sans danger. Le chemin de vérification est donc : ouvrir le tableau de bord, cliquer « Mettre le site à jour », observer l'état de confirmation, puis cliquer « Annuler ». Si aucun contenu n'est en attente (bouton désactivé), créer d'abord une modification de brouillon anodine sur un document existant — un brouillon n'est pas public, donc non destructif — et la laisser en brouillon.

(4) Points à contrôler à l'écran : aucune fenêtre modale ni voile sombre n'apparaît ; le bouton « Mettre le site à jour » est bien remplacé sur place, dans l'en-tête du panneau, par le bloc de confirmation ; le message est lisible et grammaticalement correct pour le nombre de contenus réellement en attente ; la liste nommée des contenus reste visible sous le message ; « Annuler » restaure le bouton initial sans rien publier ; la mise en page reste correcte en largeur réduite (le `wrap="wrap"` de l'en-tête doit faire passer le bloc sous le titre, sans débordement).
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website && npm run test:unit && npm run lint && npm run typecheck && npm --prefix sanity run lint && npm --prefix sanity run build</automated>
    <automated>cd /Users/florian/Projects/ajs-website && ! git diff --name-only | grep -q 'tests/unit/dashboard-logic.test.ts' && echo TESTS_UNTOUCHED_OK</automated>
    <human-check>Sur localhost:3333, tableau de bord éditorial : cliquer « Mettre le site à jour ». Confirmer que (a) aucune popup ne s'ouvre, (b) le bouton est remplacé sur place par la question « Publier maintenant sur le site public ? » plus le décompte, (c) les boutons Annuler et Confirmer apparaissent au même endroit, (d) « Annuler » revient à l'état initial. NE PAS cliquer « Confirmer » : le dataset est le vrai `production`.</human-check>
  </verify>
  <done>
`npm run test:unit`, `npm run lint`, `npm run typecheck`, `npm --prefix sanity run lint` et `npm --prefix sanity run build` passent tous ; `tests/unit/dashboard-logic.test.ts` n'a pas été modifié ; la confirmation inline est validée à l'écran sur localhost:3333 sans qu'aucune publication réelle n'ait été déclenchée.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Éditrice (Romane) -> tableau de bord Studio | Une interaction humaine ambiguë ou accidentelle peut déclencher une publication irréversible vers le site public. |
| Tableau de bord -> Sanity Actions API (dataset `production`) | Le seul chemin de mutation réelle ; franchi uniquement par `confirmPublication()`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-fxe-01 | Elevation of Privilege | Panneau « Mettre le site à jour », état confirmation | medium | mitigate | Le garde-fou de confirmation est conservé : publier exige toujours un second clic explicite sur « Confirmer » après un préflight réussi. Aucun `autoFocus` ni soumission par Entrée sur « Confirmer » (Task 1, point 4) — la perte du piège de focus du modal ne peut donc pas transformer une frappe parasite en publication production. |
| T-fxe-02 | Tampering | requestPublication / confirmPublication / publicationController / publicationCardState | high | mitigate | Changement de présentation strict : ces définitions ne sont pas éditées (Task 1, point 6). Vérifié par un gate de portée (`git diff --name-only` limité à `EditorialDashboard.tsx`) et par la suite `tests/unit/dashboard-logic.test.ts` qui doit rester verte sans modification (Task 2, points 2 et gate `TESTS_UNTOUCHED_OK`). |
| T-fxe-03 | Repudiation | Erreur de la phase `confirming` (lot modifié entre demande et confirmation) | medium | mitigate | La garde `publicationState.phase === 'confirming' && publicationState.error` est déplacée, pas supprimée, et sa `tone` passe à `critical` pour rester visible dans le conteneur `caution` — un lot modifié sous l'éditrice n'est jamais silencieusement avalé. Vérifié par grep dans Task 1. |
| T-fxe-04 | Information Disclosure | Message de confirmation inline | low | accept | Le nouveau message n'expose qu'un décompte déjà affiché dans le sous-titre du panneau ; l'accès au Studio est déjà authentifié. Aucune donnée nouvelle exposée. |
| T-fxe-05 | Denial of Service | Vérification sur dataset `production` en direct | medium | mitigate | Le chemin de vérification humaine est explicitement limité au préflight (lecture seule) suivi d'« Annuler », avec interdiction écrite de cliquer « Confirmer » (Task 2, point 3). |
| T-fxe-SC | Tampering | Installations npm/pip/cargo | low | accept | Aucune installation de paquet dans ce plan ; aucune dépendance ajoutée ni modifiée. Un seul fichier source est touché. |
</threat_model>

<verification>
- `grep -c 'Dialog' sanity/editorial/EditorialDashboard.tsx` renvoie 0 ; `editorial-publication-confirmation` et le vocabulaire d'échec technique de l'ancien message ont disparu du fichier.
- Les nouvelles chaînes (`Publier maintenant sur le site public`, `contenus seront visibles`) sont présentes, et la garde `publicationState.phase === 'confirming' && publicationState.error` est toujours rendue.
- `git diff --name-only` ne liste que `sanity/editorial/EditorialDashboard.tsx` — aucun fichier de logique ni de test modifié.
- `npm run test:unit`, `npm run lint`, `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build` passent tous.
- Contrôle humain sur localhost:3333 : bascule à deux états sans modale, « Annuler » réversible, aucune publication réelle déclenchée.
</verification>

<success_criteria>
- La confirmation de publication ne s'affiche plus dans une fenêtre modale mais directement dans le panneau « Mettre le site à jour », à l'emplacement exact de l'ancien bouton unique.
- Le message est en français courant, correct à 1 comme à N contenus, sans jargon de traitement par lot, et ne duplique pas la liste des contenus déjà affichée sous lui.
- L'étape de confirmation reste obligatoire et reste le seul chemin vers une publication réelle ; « Annuler » est non destructif.
- L'erreur « le lot a changé » de la phase `confirming` reste visible dans le panneau.
- Aucun changement de logique métier : un seul fichier modifié, suite unitaire `dashboard-logic` verte et intacte.
</success_criteria>

<output>
Créer `.planning/quick/260801-fxe-inline-publish-confirmation-instead-of-d/260801-fxe-SUMMARY.md` après vérification locale complète. Committer directement sur la branche courante `codex/studio-publication-workflow` (PR #12 déjà ouverte) — ne PAS créer de nouvelle branche. Le SUMMARY doit indiquer explicitement qu'aucune publication réelle n'a été déclenchée sur le dataset `production` pendant la vérification.
</output>
