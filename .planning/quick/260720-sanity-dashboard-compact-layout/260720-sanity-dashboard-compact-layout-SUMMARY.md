---
phase: quick-260720-sanity-dashboard-compact-layout
plan: 01
subsystem: sanity-studio
tags: [sanity-ui, editorial-dashboard, responsive, compact-layout]
requirements-completed: [QUICK-260720-SANITY-DASHBOARD-COMPACT-LAYOUT]
status: complete
completed: 2026-07-20
files-modified:
  - sanity/editorial/EditorialDashboard.tsx
---

# Quick Task: Recomposer le dashboard en cockpit compact

Le dashboard utilise désormais l'espace du premier écran pour les informations éditoriales utiles : les actions sont intégrées à l'en-tête, les indicateurs forment un bandeau compact et les tâches apparaissent à côté de l'activité récente sur ordinateur.

## Changements

- Suppression de la section autonome « Actions rapides » ; les deux actions et « Ouvrir le site » forment une barre d'outils dans l'en-tête.
- Réduction de l'espacement global de `space={6}` à `space={4}`.
- Indicateurs réécrits en cartes horizontales compactes, sans grandes zones vides ni ombres superflues.
- Grille principale responsive : une colonne sur écran étroit, `2fr / 1fr` à partir de 64 em.
- Suppression du badge total redondant ; un seul résumé indique « N priorités sur M ».
- En-têtes de groupes moins hauts et lignes de tâches sur une seule ligne quand la largeur le permet.
- Activité récente adaptée à la colonne latérale avec titre/date puis auteur/action/état.
- Les zones interactives conservent environ 44 px de hauteur minimale grâce au padding Sanity UI.

## Vérification

- `npm run lint` dans `sanity/` : réussi sans avertissement.
- `npm run build` dans `sanity/` : réussi.
- HMR du serveur local : rechargement réussi sans erreur Vite.
- `git diff --check` : réussi.
- `npx tsc --noEmit` : aucune nouvelle erreur ; seules les erreurs globales préexistantes documentées restent présentes.

## Commit d'implémentation

- `e64b856` — `feat(sanity): compact dashboard layout`

## Note visuelle

Le navigateur intégré n'était pas disponible. La refonte a été conduite à partir de la capture desktop fournie, puis vérifiée par lint, build et rechargement HMR. La confirmation visuelle finale reste ouverte dans le Studio local déjà démarré sur `http://localhost:3333/`.
