# Quick Task 260729-f3r: Clarifier le workflow de publication du Studio - Research

**Researched:** 2026-07-29  
**Domain:** Sanity Studio draft workflow, atomic publication, GitHub Pages deployment state  
**Confidence:** HIGH for the codebase audit and publication architecture; MEDIUM for the live webhook behavior, which is not stored in this repository.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Task Boundary

Auditer puis simplifier le workflow éditorial du Sanity Studio. Les modifications doivent rester enregistrées comme brouillons tant que l’éditrice ne choisit pas explicitement de mettre le site à jour depuis le tableau de bord. Le tableau de bord doit compter et nommer les contenus modifiés depuis la dernière mise en ligne, bloquer une publication globale si des informations indispensables manquent, publier les brouillons prêts en une seule action, puis rendre lisible l’état réel du déploiement GitHub Pages.

Le travail couvre le Studio, sa logique de tableau de bord, ses actions documentaires, les libellés de visibilité, les tests et la documentation éditoriale. Il ne modifie pas le rendu public du site ni l’hébergement.

#### Modèle mental de l’éditrice
- Éditer un contenu signifie seulement « enregistrer des modifications ». L’enregistrement automatique de Sanity reste le mécanisme normal.
- Les actions « Publier » et « Dépublier » au niveau d’une fiche sont retirées pour les types qui alimentent le site public afin d’éviter deux chemins concurrents.
- La zone d’action de la fiche affiche un état passif et explicite, par exemple « Modifications enregistrées » ou « À jour », avec une aide indiquant que la mise en ligne se fait depuis le tableau de bord.
- Les actions utiles qui ne mettent pas le site en ligne, notamment abandonner les changements, restent disponibles.

#### Point unique de mise en ligne
- Le tableau de bord devient l’unique point de publication : un bouton principal « Mettre le site à jour » publie tous les brouillons prêts.
- Une confirmation récapitule le nombre de contenus concernés avant l’action.
- Les champs `publicationStatus` expriment la visibilité souhaitée après la prochaine mise en ligne. Modifier ce statut ne doit jamais changer immédiatement le site.
- Les libellés « Publication » ambigus dans les schémas deviennent des libellés de « Visibilité » et expliquent quand le choix prend effet.

#### Compteur et garde-fous
- « Nombre de modifications » signifie le nombre de contenus ayant un brouillon, pas le nombre de frappes ni de champs changés.
- Le tableau de bord liste ces contenus et distingue clairement : modification d’un contenu déjà en ligne, nouveau contenu, contenu destiné à être retiré/archivé.
- Toute information indispensable manquante dans un brouillon bloque la publication globale. Les recommandations SEO restent non bloquantes.
- Le périmètre doit inclure tous les types actuellement consommés par le site, notamment `edition` et `editionsPage`, absents du tableau de bord historique.

#### Déploiement
- Le clic manuel publie les brouillons dans Sanity ; le webhook Sanity existant continue de déclencher la reconstruction GitHub Pages.
- Aucun jeton GitHub secret ne doit être embarqué dans le Studio côté navigateur.
- L’état doit distinguer « modifications en attente », « mise à jour en cours », « site à jour » et « échec ».
- Le Studio doit comparer la date des contenus publiés à celle du dernier run GitHub afin de ne pas annoncer « Site à jour » lorsqu’un contenu vient d’être publié mais que le nouveau run n’a pas encore commencé.

### Claude's Discretion
- Composition visuelle exacte de la carte de mise en ligne, microcopy secondaire, durée du rafraîchissement accéléré après publication et détails d’implémentation de la transaction Sanity.
- Ajustements raisonnables aux checklists et tests nécessaires pour garantir qu’une publication groupée ne contourne pas les validations importantes.

### Specific Ideas

- Conserver le tableau de bord actuel comme base visuelle, mais faire de la mise en ligne son action dominante plutôt qu’une tâche dispersée dans chaque ligne.
- Après une publication réussie côté Sanity, le compteur doit retomber à zéro immédiatement, tandis que l’indicateur de site reste « en attente » ou « en cours » jusqu’au résultat GitHub.
- Les Content Releases natives de Sanity ne sont pas retenues : elles répondent conceptuellement au besoin, mais sont réservées à une offre Enterprise et violent la contrainte de coût quasi nul.

### Deferred Ideas (OUT OF SCOPE)

Aucune section « Deferred Ideas » n'est présente dans `260729-f3r-CONTEXT.md`. [VERIFIED: CONTEXT.md]
</user_constraints>

## Summary

Le site public lit uniquement les versions publiées de sept types Sanity : `siteSettings`, `homePage`, `editionsPage`, `aboutPage`, `contactPage`, `gallery` et `edition`. Le tableau de bord historique omet `edition` et `editionsPage`, inclut `exhibition` alors qu'aucune page publique ne la consomme, et traite une checklist vide comme valide. Ce dernier comportement permettrait à un nouveau type public non couvert de contourner tous les garde-fous. [VERIFIED: `src/lib/sanity.ts`, `sanity/editorial/EditorialDashboard.tsx`, `sanity/editorial/checks.ts`]

La publication globale doit utiliser l'Actions API déjà fournie par `@sanity/client`, avec une action `sanity.action.document.publish` par brouillon dans un seul appel atomique. L'API native copie le brouillon vers l'identifiant publié, supprime le brouillon et annule toute la transaction si une action échoue. Elle évite de réimplémenter la gestion des champs système et des références effectuée par Sanity. [CITED: https://www.sanity.io/docs/content-lake/dispatch-actions] [CITED: https://www.sanity.io/docs/http-reference/actions]

L'état GitHub doit être dérivé de deux horloges : le maximum `_updatedAt` des documents publiés concernés et `created_at` du run GitHub. Un succès antérieur à la publication Sanity ne prouve pas que le site contient cette publication. [CITED: https://www.sanity.io/docs/content-lake/drafts] [CITED: https://docs.github.com/en/rest/actions/workflow-runs]

**Primary recommendation:** définir une seule liste canonique des sept types publics, effectuer un préflight bloquant et exhaustif, publier tous leurs brouillons par une transaction Actions API, puis maintenir l'état « en attente/en cours » jusqu'à ce qu'un run GitHub créé après la publication se termine avec succès.

## Project Constraints (from AGENTS.md)

- Le rendu reste statique (`output: 'static'`) et le CMS est lu uniquement au build ; aucune logique serveur ne doit être ajoutée à l'hébergement OVH. [VERIFIED: AGENTS.md]
- Le coût récurrent doit rester proche de zéro ; aucune fonctionnalité Enterprise ni nouveau service payant ne doit être introduit. [VERIFIED: AGENTS.md]
- Le Studio doit rester utilisable en autonomie par une éditrice non technique et conserver le français comme langue d'interface éditoriale. [VERIFIED: AGENTS.md and current Studio code]
- Les tests Vitest et Playwright sont des portes bloquantes de la CI avant le déploiement. [VERIFIED: AGENTS.md and `.github/workflows/deploy.yml`]
- Les modifications de dépôt doivent passer par un workflow GSD ; ce travail a été ouvert avec `/gsd:quick --full`. [VERIFIED: AGENTS.md and quick-task context]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Auto-enregistrement des modifications | Sanity Studio / Content Lake | — | Le mécanisme natif conserve les changements sous `drafts.*` sans toucher à la version publique. [CITED: https://www.sanity.io/docs/content-lake/drafts] |
| Inventaire, classement et validation des brouillons | Sanity Studio | Content Lake | Le tableau de bord lit les paires brouillon/publié et applique les checklists avant toute action. [VERIFIED: existing editorial architecture] |
| Publication globale atomique | Content Lake Actions API | Sanity Studio | Le Studio prépare les actions ; le Content Lake garantit l'atomicité. [CITED: https://www.sanity.io/docs/http-reference/actions] |
| Déclenchement du build | Webhook Sanity | GitHub Actions | Le webhook existant déclenche `repository_dispatch`; le Studio ne possède aucun secret GitHub. [VERIFIED: CONTEXT.md and `.github/workflows/deploy.yml`] |
| Calcul de fraîcheur et présentation d'état | Sanity Studio | GitHub REST API | L'interface compare les timestamps publiés avec ceux des runs du workflow. [CITED: https://docs.github.com/en/rest/actions/workflow-runs] |
| Rendu public | Astro build / GitHub Pages | Sanity published perspective | Le site ne lit que les documents publiés au moment du build. [VERIFIED: `src/lib/sanity.ts` and `.github/workflows/deploy.yml`] |

## Current-State Audit

### Canonical public scope

| Type | Public query | Dashboard today | Checklist today | Required change |
|---|---:|---:|---:|---|
| `siteSettings` | yes | yes | yes | Ajouter `navLabels.editions` aux contrôles bloquants. |
| `homePage` | yes | yes | yes | Conserver les contrôles existants. |
| `editionsPage` | yes | no | no | Ajouter au dashboard, à la checklist et aux singletons protégés. |
| `aboutPage` | yes | yes | yes | Conserver les contrôles existants. |
| `contactPage` | yes | yes | yes | Conserver les contrôles existants. |
| `gallery` | yes | yes | yes | Vérifier aussi l'asset de chaque image, pas seulement son alt et ses droits. |
| `edition` | yes | no | no | Ajouter au dashboard, à la checklist et au workflow documentaire. |
| `exhibition` | no | yes | yes | Exclure du lot public tant qu'aucune route publique ne la consomme. |

La matrice est issue des requêtes GROQ publiques et des registres Studio actuels. [VERIFIED: `src/lib/sanity.ts`, `sanity/editorial/EditorialDashboard.tsx`, `sanity/editorial/DocumentChecklist.tsx`, `sanity/editorial/workflowLogic.ts`]

### Gaps that can cause incorrect publication

1. `getDocumentChecks()` retourne `[]` pour un type inconnu et `summarizeChecks([])` retourne `requiredComplete: true`. La validation globale est donc « fail-open ». [VERIFIED: `sanity/editorial/checks.ts`]
2. `publicSiteDocumentTypes` omet `edition` et `editionsPage`; le workflow actuel renomme seulement l'action native Publier au lieu de la retirer. [VERIFIED: `sanity/editorial/workflowLogic.ts` and `sanity/editorial/workflow.tsx`]
3. `editionsPage` n'est pas dans les singletons protégés ni dans le filtre global de création, ce qui permet de proposer une seconde instance du singleton. [VERIFIED: `sanity/editorial/workflowLogic.ts` and `sanity/sanity.config.ts`]
4. `deploymentLabel()` annonce « Site à jour » dès que le dernier run visible a réussi, sans vérifier s'il est postérieur au contenu publié. [VERIFIED: `sanity/editorial/deployment.ts`]
5. L'endpoint GitHub ne demande qu'un run et le modèle local ignore `run_started_at` et `event`; une courte liste de runs qualifiés est plus robuste face aux courses et aux déclenchements rapprochés. [VERIFIED: `sanity/editorial/deployment.ts`] [CITED: https://docs.github.com/en/rest/actions/workflow-runs]
6. La validation de schéma Sanity est exécutée côté Studio et peut être contournée par une mutation directe ; le bouton global doit donc exécuter ses propres contrôles. [CITED: https://www.sanity.io/docs/content-lake/schema-validation-and-the-content-lake]

## Recommended Architecture

### System flow

```text
Éditrice ouvre une fiche
        │
        ├─ saisie ──> auto-save Sanity ──> drafts.<id>
        │                                  │
        │                                  v
        └──────────── tableau de bord <─ query paires draft/published
                                           │
                         aucun brouillon ──┤──> « Site à jour » seulement
                                           │     si run.created_at >= publishedAt
                                           v
                               préflight exhaustif
                                  │             │
                         erreurs requises     prêt
                                  │             │
                          bloquer + liens       v
                                         confirmation
                                               │
                                               v
                               Actions API, une transaction
                                  │             │
                               échec         succès
                                  │             │
                         aucun changement      ├─> re-fetch Sanity
                         drafts conservés      ├─> compteur = 0
                                               └─> webhook -> GitHub -> Pages
                                                          │
                                                poll + comparaison temporelle
```

Le Content Lake exécute les actions d'une requête dans l'ordre et annule l'ensemble en cas d'échec. [CITED: https://www.sanity.io/docs/http-reference/actions]

### Single source of truth

Créer un module logique sans React, par exemple `sanity/editorial/publicationScope.ts`, exportant `PUBLIC_SITE_DOCUMENT_TYPES`, `PUBLIC_SINGLETON_TYPES`, les libellés et la couverture de checklist. Tous les queries, actions, compteurs et tests doivent importer ce registre au lieu de recopier des tableaux de types. [VERIFIED: duplicated type lists in current codebase]

Ajouter un test d'invariant :

```ts
expect([...PUBLIC_SITE_DOCUMENT_TYPES].sort()).toEqual(
  ['aboutPage', 'contactPage', 'edition', 'editionsPage', 'gallery', 'homePage', 'siteSettings'],
)
expect([...PUBLIC_SITE_DOCUMENT_TYPES].every(hasBlockingChecklist)).toBe(true)
```

Cette vérification transforme l'ajout futur d'un type public sans checklist en échec de test, plutôt qu'en publication silencieusement autorisée.

### Preflight sequence

1. Recharger, juste avant confirmation, les versions `drafts.<id>` et publiées des sept types avec leurs `_id`, `_rev`, `_type`, `_updatedAt` et données complètes. Ne pas publier la copie déjà affichée par React. [VERIFIED: installed Sanity 6.4.0 publish operation warns that custom draft snapshots can be stale]
2. Regrouper par identifiant public (`drafts.foo` → `foo`) et compter une modification par identifiant possédant un brouillon. [CITED: https://www.sanity.io/docs/content-lake/drafts]
3. Refuser le lot si un type public n'a pas de contrôleur explicite ou si un contrôle obligatoire échoue. L'absence de contrôles doit être un état d'erreur, jamais un succès.
4. Laisser les recommandations SEO visibles mais non bloquantes, conformément aux décisions verrouillées.
5. Vérifier les références fortes. Une référence vers un document sans version publiée doit viser un document du même lot ; publier les cibles avant leurs dépendants. Pour le schéma actuel, une nouvelle `gallery` doit précéder une `edition` qui la référence. [CITED: https://www.sanity.io/docs/studio/reference-type] [VERIFIED: `sanity/schemas/edition.ts`]
6. Présenter une confirmation avec total et catégories, puis désactiver le bouton pendant l'appel.

### Atomic publish

Utiliser l'Actions API native ; ne pas construire une transaction qui copie manuellement les champs du brouillon :

```ts
// Source: https://www.sanity.io/docs/content-lake/dispatch-actions
const actions = orderedPairs.map(({draft, published}) => ({
  actionType: 'sanity.action.document.publish' as const,
  draftId: draft._id,
  publishedId: draft._id.replace(/^drafts\./, ''),
  ifPublishedRevisionId: published?._rev,
}))

await client.action(actions, {tag: 'editorial.publish-all'})
```

La version installée de Sanity utilise elle-même `sanity.action.document.publish` avec `ifPublishedRevisionId` pour protéger la version publiée contre deux publications concurrentes. Son implémentation indique que `ifDraftRevisionId` n'est pas fiable lorsqu'un snapshot fourni au composant est devenu obsolète ; il faut donc recharger et revalider immédiatement avant l'appel, puis traiter tout conflit comme un échec global récupérable. [VERIFIED: installed Sanity 6.4.0 source, `serverOperations/publish.ts`]

Après succès, recharger les documents publiés et utiliser leur `_updatedAt` maximal comme `publishedAt` de référence ; ne pas utiliser uniquement l'horloge du navigateur. [CITED: https://www.sanity.io/docs/content-lake/drafts]

### Required checklist coverage

| Type | Blocking checks |
|---|---|
| `homePage` | Introduction FR + EN. |
| `aboutPage` | Biographie, pratique et médium FR + EN. |
| `contactPage` | Introduction FR + EN et e-mail public. |
| `siteSettings` | Titre, navigation `about`/`editions`/`contact`, pied de page, tous FR + EN. |
| `editionsPage` | Introduction FR + EN. |
| `gallery` | Visibilité, titre, slug, statement FR + EN, ≥1 image, asset + alt FR/EN + crédit/copyright/droits pour chaque image. |
| `edition` | Visibilité, titre, slug, statement FR + EN, lead asset + alt + droits, ≥1 image avec asset + alt + droits, `pageCount`, `printRun`, largeur, hauteur et unité valides. |

Ces contrôles suivent les champs requis des schémas et ferment les trous de la checklist actuelle ; les images About, liens professionnels et métadonnées SEO restent recommandés. [VERIFIED: `sanity/schemas/*.ts` and `sanity/editorial/checks.ts`]

## Document Action Policy

Pour les sept types publics, filtrer les actions dont `action` vaut `publish` ou `unpublish`. Conserver `discardChanges` et `restore`; conserver les actions de suppression/duplication uniquement pour les documents non-singleton. Sanity expose ces identifiants et place la première action renvoyée comme action principale. [CITED: https://www.sanity.io/docs/studio/document-actions-api]

Insérer en première position une action personnalisée désactivée, sans mutation :

- brouillon présent : **« Modifications enregistrées »** ;
- aucun brouillon : **« À jour »** ;
- aide : **« La mise en ligne se fait depuis le tableau de bord. »**

La liste `protectedDocumentTypes` et `newDocumentOptions` doit inclure `editionsPage` avec les quatre autres singletons. [VERIFIED: current singleton protection]

Renommer les groupes/champs `publicationStatus` de **« Publication »** vers **« Visibilité »**, avec une description telle que : « Ce choix prendra effet lors de la prochaine mise à jour du site depuis le tableau de bord. » Le champ reste un état éditorial ; aucune action documentaire ne doit être déclenchée à son changement.

## Pending Count and Classification

Le compteur est le nombre d'identifiants publics distincts qui possèdent un document `drafts.*`. Il inclut aussi un brouillon destiné à retirer un contenu : publier ce brouillon est précisément ce qui applique le nouvel état de visibilité au prochain build. [CITED: https://www.sanity.io/docs/content-lake/drafts] [VERIFIED: public queries filter `publicationStatus`]

| Condition | Category | Suggested label |
|---|---|---|
| draft + published + visibilité publique souhaitée | modified | « Modifié » |
| draft sans published + visibilité publique souhaitée | new | « Nouveau » |
| draft + published + `preparation`/`archived` | withdrawal | « Sera retiré du site » |
| draft sans published + `preparation`/`archived` | new-hidden | « Nouveau, gardé hors ligne » |

Les singletons, qui n'ont pas de `publicationStatus`, sont classés uniquement en « Nouveau » ou « Modifié ». [VERIFIED: singleton schemas]

## Deployment State Machine

`getLatestDeployment()` doit charger plusieurs runs récents du workflow, exposer au minimum `created_at`, `run_started_at`, `updated_at`, `status`, `conclusion`, `event` et `html_url`, puis choisir le run pertinent le plus récent. Ces champs appartiennent à la réponse officielle workflow-runs. [CITED: https://docs.github.com/en/rest/actions/workflow-runs]

| Condition | State | Primary copy |
|---|---|---|
| au moins un brouillon public | pending-content | « Modifications en attente » |
| zéro brouillon, aucun run avec `created_at >= publishedAt` | waiting-run | « Mise à jour en attente » |
| run qualifié non terminé | deploying | « Mise à jour en cours » |
| run qualifié terminé avec `success` | current | « Site à jour » |
| run qualifié terminé sans `success` | failed | « Échec de la mise à jour » |
| API inaccessible ou données incohérentes | unknown | « État temporairement indisponible » |

Comparer `created_at`, et non seulement `updated_at` : un run créé avant la transaction mais terminé après elle peut avoir construit l'ancien contenu. L'utilisation de `created_at >= publishedAt` est une règle conservatrice destinée à éviter les faux positifs. [CITED: https://docs.github.com/en/rest/actions/workflow-runs]

Après publication, lancer un fetch immédiat puis toutes les 5 secondes pendant deux minutes, toutes les 15 secondes jusqu'à un état terminal, puis revenir au rafraîchissement de fond existant. Si aucun run qualifié n'apparaît après trois minutes, afficher « Mise à jour non démarrée » avec une consigne de contacter le mainteneur. Ces durées sont des recommandations UX relevant de la discrétion accordée.

### Failure recovery

- **Erreur de préflight :** ne rien publier ; afficher les documents fautifs avec un lien direct vers chaque fiche.
- **Erreur Actions API / conflit / permission :** l'atomicité conserve tous les brouillons ; recharger l'inventaire, réactiver le bouton et afficher un message actionnable. [CITED: https://www.sanity.io/docs/http-reference/actions]
- **Succès Sanity, échec GitHub :** le contenu est publié dans Sanity mais le site peut rester ancien. Afficher le lien `html_url` du run et « Prévenir le mainteneur ». Un bouton de relance GitHub dans le navigateur nécessiterait un secret ou une nouvelle surface serveur et reste hors périmètre.
- **API GitHub indisponible :** ne jamais transformer l'absence d'information en « Site à jour » ; conserver un lien direct vers le site et le workflow.

## Standard Stack

### Core

| Library | Installed version | Purpose | Decision |
|---|---:|---|---|
| `sanity` | 6.4.0 | Studio, `useClient`, custom actions | Use existing dependency. [VERIFIED: installed package metadata] |
| `@sanity/client` | 7.23.0 | Query and Actions API | Use existing transitive dependency through Studio APIs. [VERIFIED: installed package metadata] |
| Vitest | 4.1.9 | Pure logic unit tests | Extend existing test suite. [VERIFIED: installed package metadata] |
| GitHub Actions REST API | current public API | Deployment observation | Keep unauthenticated, read-only request; do not add a token. [VERIFIED: `sanity/editorial/deployment.ts`] |

**Installation:** aucune. La solution recommandée n'ajoute aucun package.

## Package Legitimacy Audit

Not applicable: this phase installs no external package. The existing `sanity`, `@sanity/client` and Vitest packages are already locked and installed in the repository. [VERIFIED: package metadata and lockfiles]

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Draft-to-published copy | Mutation that strips/copies `_id`, `_rev`, timestamps and draft fields | `sanity.action.document.publish` | Native semantics, reference handling and atomic rollback. [CITED: https://www.sanity.io/docs/content-lake/dispatch-actions] |
| Multi-document rollback | Per-document publish loop | One Actions API call containing all actions | A loop can leave a partial release; one request is atomic. [CITED: https://www.sanity.io/docs/http-reference/actions] |
| Validation enforcement assumption | Rely only on schema validation | Explicit exhaustive preflight | Direct API writes bypass Studio validation. [CITED: https://www.sanity.io/docs/content-lake/schema-validation-and-the-content-lake] |
| GitHub authentication in Studio | Personal token or repository secret in browser code | Public read-only workflow-runs endpoint | Respecte l'interdiction verrouillée d'embarquer un jeton GitHub dans le Studio. [VERIFIED: CONTEXT.md] |
| Enterprise release system | Content Releases | Existing drafts + custom dashboard | Content Releases are an Enterprise add-on excluded by cost. [CITED: https://www.sanity.io/docs/user-guides/content-releases] [CITED: https://www.sanity.io/pricing?lang=en] |

## Common Pitfalls

### Empty checklist treated as success

**What goes wrong:** a newly added public type publishes with no validation.  
**Avoidance:** explicit registry coverage and fail-closed unknown types.  
**Warning sign:** `getDocumentChecks(type, value).length === 0` for any public type. [VERIFIED: current fail-open behavior]

### Sequential publish loop

**What goes wrong:** early documents publish before a later document fails.  
**Avoidance:** one Actions API request, never `for (...) await client.action(...)`. [CITED: https://www.sanity.io/docs/http-reference/actions]

### Stale validation snapshot

**What goes wrong:** the user edits while the dashboard validates an older draft.  
**Avoidance:** re-fetch and revalidate immediately before dispatch, disable duplicate submission, surface conflicts, and refresh after completion. [VERIFIED: installed Sanity 6.4.0 source]

### Strong reference ordering

**What goes wrong:** publishing a new edition can fail if its related gallery is not published.  
**Avoidance:** validate target availability and order dependency targets before dependants. [CITED: https://www.sanity.io/docs/studio/reference-type]

### False “Site à jour”

**What goes wrong:** a previous successful run remains the latest result while the webhook for new content has not appeared.  
**Avoidance:** compare run creation time with authoritative Sanity publication time and represent a waiting state. [VERIFIED: current deployment logic lacks comparison]

### Webhook fan-out

**What goes wrong:** a multi-document transaction may produce an unexpected number of workflow dispatches depending on the live webhook configuration.  
**Avoidance:** test two drafts in staging and observe the number of GitHub runs before locking polling and queue assumptions. The webhook definition is not present in this repository. [VERIFIED: repository audit]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.9 [VERIFIED: installed package metadata] |
| Config file | `vitest.config.ts` [VERIFIED: codebase] |
| Quick run | `npm run test:unit -- tests/unit/dashboard-logic.test.ts tests/unit/editorial-checks.test.ts tests/unit/workflow-logic.test.ts tests/unit/deployment.test.ts` |
| Full suite | `npm run test:unit` |

### Behavior-to-test map

| Behavior | Test type | Target |
|---|---|---|
| Seven-type public registry and exhaustive checklist invariant | unit | `workflow-logic.test.ts`, `editorial-checks.test.ts` |
| One draft counted once and classified correctly for all four categories | unit | `dashboard-logic.test.ts` |
| Any missing required field blocks the complete batch; SEO does not | unit | `editorial-checks.test.ts`, `dashboard-logic.test.ts` |
| `edition`, `editionsPage`, gallery asset and `navLabels.editions` checks | unit | `editorial-checks.test.ts` |
| Per-document publish/unpublish removed; discard retained; singleton safety includes editions page | unit | `workflow-logic.test.ts` |
| Action payload contains all drafts, dependency order and revision guard | unit with mocked client | new publication logic test or `dashboard-logic.test.ts` |
| Second click while pending cannot dispatch a second transaction | component/logic unit | dashboard action test |
| Atomic failure keeps pending list and exposes error state | unit with rejected mocked client | dashboard action test |
| GitHub freshness for waiting/running/success/failure/unknown | unit | `deployment.test.ts` |
| Confirmation and post-success count/deploy UI | Playwright smoke or focused component test | existing Studio smoke path if available |

### Sampling Rate

- **Per task commit:** targeted Vitest command above.
- **Per wave merge:** `npm run test:unit`.
- **Phase gate:** `npm run lint && npm run typecheck && npm run test:unit && npm --prefix sanity run build`.

### Wave 0 Gaps

- [ ] Réparer la résolution Vitest de `@sanity/icons/BulbOutline` dans `dashboardLogic.ts` : le baseline du 2026-07-29 donne 3 suites/13 tests passants, mais `dashboard-logic.test.ts` échoue avant collecte car ce sous-chemin n'est pas exporté sous les conditions Node/Vite. [VERIFIED: targeted Vitest baseline]
- [ ] Extract pure batch inventory/action-building logic so it can be tested without mounting the 1,000-line dashboard component.
- [ ] Add an invariant test that every public type has a blocking checklist.
- [ ] Add a mocked-client test proving one Actions API call contains all draft publish actions.
- [ ] Decide whether the existing Playwright setup can authenticate to Studio; if not, document the confirmation/modal check as a manual acceptance test.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard control |
|---|---:|---|
| V2 Authentication | yes | Use the current authenticated Sanity Studio session; add no credentials to source. [CITED: https://www.sanity.io/docs/user-guides/roles] |
| V3 Session Management | no custom work | Sanity owns the Studio session. |
| V4 Access Control | yes | Let Content Lake authorize the authenticated user and handle 403 atomically. Read/write permission is required for Actions API requests. [CITED: https://www.sanity.io/docs/http-reference/actions] |
| V5 Input Validation | yes | Exhaustive client preflight plus Content Lake structural/reference enforcement; do not rely on Studio schema validation alone. [CITED: https://www.sanity.io/docs/content-lake/schema-validation-and-the-content-lake] |
| V6 Cryptography | no custom work | Do not add tokens, encryption, or signing code. |

### Threat patterns

| Pattern | STRIDE | Mitigation |
|---|---|---|
| GitHub token exposed in browser bundle | Information disclosure / elevation | No token; read public workflow metadata only. |
| User without publish permission triggers batch | Elevation | Server-side Sanity authorization; show a non-destructive permission error. [CITED: https://www.sanity.io/docs/http-reference/actions] |
| Duplicate click or stale published revision | Tampering | In-flight guard plus `ifPublishedRevisionId`; refresh on conflict. [VERIFIED: installed Sanity 6.4.0 source] |
| Unvalidated API mutation | Tampering | Fail-closed preflight for every public type. [CITED: https://www.sanity.io/docs/content-lake/schema-validation-and-the-content-lake] |

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---:|---:|---|
| Node.js | Studio build/tests | yes | 22.22.3 | — |
| npm | scripts/build/tests | yes | 10.9.8 | — |
| Sanity Studio | workflow implementation | yes | 6.4.0 | — |
| `@sanity/client` | Actions API | yes | 7.23.0 | — |
| Vitest | unit validation | yes | 4.1.9 | — |
| Live Sanity webhook config | deploy trigger verification | not represented in git | — | Manual staging observation required. |

Installed versions were read from the local runtime and package metadata. [VERIFIED: environment audit]

**Missing dependencies with no fallback:** none for implementation.  
**Missing external evidence:** the live webhook's filtering/projection and dispatch cardinality must be observed before final acceptance.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| — | No implementation recommendation depends on an unverified package or undocumented Sanity behavior. | — | — |

The live webhook behavior and current editor role are recorded as open verification items rather than assumptions.

## Open Questions

1. **How many GitHub runs does the live webhook create for a transaction publishing two documents?**
   - What we know: the repository contains the `repository_dispatch` listener but not the Sanity webhook configuration. [VERIFIED: repository audit]
   - Recommendation: publish two harmless staging drafts together and assert the run count and ordering before acceptance.

2. **Does Romane's current Sanity role permit Actions API publication?**
   - What we know: Content Lake checks the authenticated user's read/write permissions. [CITED: https://www.sanity.io/docs/http-reference/actions]
   - Recommendation: include one acceptance test with the real editor account; handle 403 without losing drafts.

3. **Should `exhibition` remain visible in the editorial dashboard's non-public planning sections?**
   - What we know: it is registered and checked today but is not queried by the public site. [VERIFIED: codebase audit]
   - Recommendation: exclude it from the global public count and publish transaction; retaining a separate non-public editorial card is safe if useful.

## Sources

### Primary codebase evidence (HIGH confidence)

- `src/lib/sanity.ts` — complete public query/type inventory.
- `sanity/editorial/EditorialDashboard.tsx` and `dashboardLogic.ts` — current dashboard scope and draft pairing.
- `sanity/editorial/checks.ts`, `workflow.tsx`, `workflowLogic.ts`, `deployment.ts` — current validation, actions and deployment semantics.
- `sanity/schemas/*.ts` — required fields and strong references.
- Installed Sanity 6.4.0 `serverOperations/publish.ts` and legacy `operations/publish.ts` source maps — native publish payload, revision guard and draft-strengthening behavior.
- `.github/workflows/deploy.yml` — actual build triggers and deployment gate.

### Official documentation (MEDIUM confidence)

- https://www.sanity.io/docs/content-lake/dispatch-actions — Actions API and publish action.
- https://www.sanity.io/docs/http-reference/actions — ordered atomic action transactions and authorization.
- https://www.sanity.io/docs/content-lake/transactions — transaction guarantees.
- https://www.sanity.io/docs/content-lake/drafts — draft identifiers and publication timestamps.
- https://www.sanity.io/docs/studio/document-actions-api — filtering and ordering document actions.
- https://www.sanity.io/docs/content-lake/schema-validation-and-the-content-lake — validation boundary.
- https://www.sanity.io/docs/studio/reference-type — strong/weak reference publication behavior.
- https://docs.github.com/en/rest/actions/workflow-runs — workflow-run response model.
- https://www.sanity.io/docs/user-guides/content-releases and https://www.sanity.io/pricing?lang=en — excluded Enterprise feature.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all required libraries are installed; no package addition.
- Architecture: HIGH — matches official Actions API semantics and the installed Sanity implementation.
- Public scope and checklist gaps: HIGH — derived directly from public GROQ queries and Studio registries.
- Deployment state model: MEDIUM — API fields are official, but live webhook behavior requires staging observation.
- Pitfalls: HIGH for atomicity/validation; MEDIUM for webhook fan-out.

**Research date:** 2026-07-29  
**Valid until:** 2026-08-28 for the stable codebase findings; recheck Sanity Actions API docs if dependencies change.
