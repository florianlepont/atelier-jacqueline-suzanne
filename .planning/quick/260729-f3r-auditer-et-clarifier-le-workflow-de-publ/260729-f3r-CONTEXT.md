# Quick Task 260729-f3r: Clarifier le workflow de publication du Studio - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Task Boundary

Auditer puis simplifier le workflow éditorial du Sanity Studio. Les modifications doivent rester enregistrées comme brouillons tant que l’éditrice ne choisit pas explicitement de mettre le site à jour depuis le tableau de bord. Le tableau de bord doit compter et nommer les contenus modifiés depuis la dernière mise en ligne, bloquer une publication globale si des informations indispensables manquent, publier les brouillons prêts en une seule action, puis rendre lisible l’état réel du déploiement GitHub Pages.

Le travail couvre le Studio, sa logique de tableau de bord, ses actions documentaires, les libellés de visibilité, les tests et la documentation éditoriale. Il ne modifie pas le rendu public du site ni l’hébergement.

</domain>

<decisions>
## Implementation Decisions

### Modèle mental de l’éditrice
- Éditer un contenu signifie seulement « enregistrer des modifications ». L’enregistrement automatique de Sanity reste le mécanisme normal.
- Les actions « Publier » et « Dépublier » au niveau d’une fiche sont retirées pour les types qui alimentent le site public afin d’éviter deux chemins concurrents.
- La zone d’action de la fiche affiche un état passif et explicite, par exemple « Modifications enregistrées » ou « À jour », avec une aide indiquant que la mise en ligne se fait depuis le tableau de bord.
- Les actions utiles qui ne mettent pas le site en ligne, notamment abandonner les changements, restent disponibles.

### Point unique de mise en ligne
- Le tableau de bord devient l’unique point de publication : un bouton principal « Mettre le site à jour » publie tous les brouillons prêts.
- Une confirmation récapitule le nombre de contenus concernés avant l’action.
- Les champs `publicationStatus` expriment la visibilité souhaitée après la prochaine mise en ligne. Modifier ce statut ne doit jamais changer immédiatement le site.
- Les libellés « Publication » ambigus dans les schémas deviennent des libellés de « Visibilité » et expliquent quand le choix prend effet.

### Compteur et garde-fous
- « Nombre de modifications » signifie le nombre de contenus ayant un brouillon, pas le nombre de frappes ni de champs changés.
- Le tableau de bord liste ces contenus et distingue clairement : modification d’un contenu déjà en ligne, nouveau contenu, contenu destiné à être retiré/archivé.
- Toute information indispensable manquante dans un brouillon bloque la publication globale. Les recommandations SEO restent non bloquantes.
- Le périmètre doit inclure tous les types actuellement consommés par le site, notamment `edition` et `editionsPage`, absents du tableau de bord historique.

### Déploiement
- Le clic manuel publie les brouillons dans Sanity ; le webhook Sanity existant continue de déclencher la reconstruction GitHub Pages.
- Aucun jeton GitHub secret ne doit être embarqué dans le Studio côté navigateur.
- L’état doit distinguer « modifications en attente », « mise à jour en cours », « site à jour » et « échec ».
- Le Studio doit comparer la date des contenus publiés à celle du dernier run GitHub afin de ne pas annoncer « Site à jour » lorsqu’un contenu vient d’être publié mais que le nouveau run n’a pas encore commencé.

### Claude's Discretion
- Composition visuelle exacte de la carte de mise en ligne, microcopy secondaire, durée du rafraîchissement accéléré après publication et détails d’implémentation de la transaction Sanity.
- Ajustements raisonnables aux checklists et tests nécessaires pour garantir qu’une publication groupée ne contourne pas les validations importantes.

</decisions>

<specifics>
## Specific Ideas

- Conserver le tableau de bord actuel comme base visuelle, mais faire de la mise en ligne son action dominante plutôt qu’une tâche dispersée dans chaque ligne.
- Après une publication réussie côté Sanity, le compteur doit retomber à zéro immédiatement, tandis que l’indicateur de site reste « en attente » ou « en cours » jusqu’au résultat GitHub.
- Les Content Releases natives de Sanity ne sont pas retenues : elles répondent conceptuellement au besoin, mais sont réservées à une offre Enterprise et violent la contrainte de coût quasi nul.

</specifics>

<canonical_refs>
## Canonical References

- Sanity « Drafts » : les brouillons préservent une version publiée inchangée jusqu’à une publication explicite.
- Sanity « Document Actions » : les actions natives peuvent être filtrées ou remplacées par type de document.
- Sanity « Transactions » : une transaction regroupe les mutations mais les validations de schéma restent côté Studio, donc le flux global doit vérifier ses propres garde-fous.
- Sanity « Content Releases » : référence UX pertinente, mais fonctionnalité Enterprise payante exclue par les contraintes du projet.

</canonical_refs>
