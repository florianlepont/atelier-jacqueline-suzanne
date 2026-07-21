---
task: live-sanity-dashboard-audit
component: Sanity Studio Editorial Dashboard (sanity/editorial/EditorialDashboard.tsx + .css)
method: live, authenticated browser inspection via Chrome DevTools MCP (http://localhost:3333/dashboard)
reviewed: 2026-07-21
overall-risk: LOW-MEDIUM
---

# Audit UI en direct — Dashboard Sanity Studio

## 0. Méthode

Premier audit réalisé sur une session **authentifiée réelle** (pas du code seul, pas de captures manuelles) via Chrome DevTools MCP. Vérifications faites : snapshot d'accessibilité (arbre a11y), calcul de contraste WCAG sur les couleurs réellement rendues, mesure des cibles tactiles (`getBoundingClientRect`), navigation clavier réelle (Tab), messages de console, structure des liens externes.

## 1. Résumé exécutif

- **Risque global : faible à moyen.** Les correctifs récents (centrage d'icônes, hauteur des boutons) sont confirmés pixel-parfaits en direct. Aucun problème bloquant trouvé.
- **Point le plus important : deux cibles cliquables sont trop petites pour le tactile** — le lien de statut de déploiement (259×20px) et le bouton "Tout voir (9)" (74×23px) sont sous le minimum WCAG 2.5.5 de 44px, alors que le reste du dashboard (boutons, lignes) respecte bien cette règle.
- **Hiérarchie de titres correcte** : h1 → h2 → h2 → h3, navigation par titre fonctionnelle pour lecteur d'écran (confirmé par l'arbre d'accessibilité, pas juste le code).
- **Contraste excellent partout sauf un point mineur** : la plupart des textes sont à 13-14.6:1 (bien au-dessus du minimum AA de 4.5:1). Le résumé de tâche (10px, 4.99:1) passe de justesse.
- **Le focus clavier fonctionne mais est incohérent sur un élément** : le lien de statut de déploiement utilise l'anneau natif du navigateur au lieu de l'anneau indigo personnalisé utilisé partout ailleurs.

## 2. Constats par catégorie

### Accessibilité (WCAG 2.1 AA)

**[Important] Deux cibles tactiles sous le minimum de 44px**
- Lien "Site : Échec du déploiement" : 259.6 × **20px** de hauteur, `padding: 0px`
- Bouton "Tout voir (9)" : 74.2 × **23px** de hauteur, `padding: 0px`

Les deux sont des vrais liens/boutons interactifs (le premier ouvre les détails GitHub Actions, le second ouvre la liste complète de l'activité), pas des éléments décoratifs. Comparé au reste du dashboard, où boutons et lignes de tâches font tous 44-47px, ces deux éléments détonnent. Sur un usage tactile (iPad, éventuellement le téléphone de Romane), ils seraient difficiles à toucher précisément.
**Fix suggéré :** ajouter `min-height: 44px` + centrage vertical du contenu (comme déjà fait pour les boutons d'en-tête), sans changer la taille visuelle du texte/icône si ce n'est pas souhaité — juste agrandir la zone cliquable.

**[Mineur] Anneau de focus incohérent sur le lien de déploiement**
Tous les éléments interactifs du dashboard (boutons, lignes de tâches) affichent un anneau de focus personnalisé (`box-shadow` indigo, cohérent avec le design system). Le lien de statut de déploiement, lui, retombe sur l'anneau **natif du navigateur** (fin, bleu `rgb(0,95,204)`, `outline: auto 1px`). Toujours visible et donc conforme WCAG 2.4.7, mais visuellement disparate — un utilisateur clavier verra un style de focus différent juste sur cet élément.
**Fix suggéré :** ajouter la même règle `:focus-visible { box-shadow: var(--card-focus-ring-box-shadow...) }` déjà utilisée sur `.editorial-dashboard__row-link`.

**[Mineur] Texte de résumé de tâche à la limite du contraste AA**
`.editorial-dashboard__task-summary` : police 10px, couleur `rgb(102,106,121)` sur fond `rgb(246,246,248)` → ratio **4.99:1**. Le minimum AA pour du texte de cette taille est 4.5:1 — donc conforme, mais avec une marge minime, et la taille (10px) est petite pour un texte informatif destiné à une utilisatrice non-technique.
**Fix suggéré (optionnel) :** passer à 11-12px et/ou assombrir légèrement la couleur pour une marge plus confortable (viser 6-7:1).

**[Mineur] Liens externes n'annoncent pas "s'ouvre dans un nouvel onglet"**
"Ouvrir le site" et le lien de statut de déploiement (`target="_blank"`, `rel="noreferrer"` — bon réflexe sécurité) n'ont aucune indication pour lecteur d'écran qu'ils ouvrent un nouvel onglet. Incohérent avec le site public lui-même, qui a déjà ce pattern exact (`instagramNewTabHint` sur le lien Instagram du header). Pas une violation WCAG stricte, mais une bonne pratique déjà établie ailleurs dans ce projet et absente ici.
**Fix suggéré :** ajouter un texte `sr-only` ou enrichir l'`aria-label` existant (le lien de déploiement en a déjà un très complet — juste "Ouvrir le site" manque ce détail).

**[Positif] Hiérarchie de titres correcte, confirmée en direct**
`h1 "Tableau de bord"` → `h2 "À faire maintenant"` / `h2 "Activité récente"` → `h3 "À améliorer"` (et les 3 autres groupes) — confirmé par l'arbre d'accessibilité réel du navigateur, pas seulement par lecture de code. La correction de sémantique faite plus tôt (`aria-level={3}`) fonctionne comme prévu.

**[Positif] Focus clavier fonctionnel et généralement cohérent**
Testé en tabulant réellement à travers la page : logo → recherche → nav → icônes chrome Sanity → menu utilisateur → "Nouvelle collection" (anneau indigo visible) → "Ouvrir le site" → lien déploiement (voir ci-dessus) → lignes "À faire maintenant" (anneau indigo visible, cohérent). Aucun piège de focus, aucun élément invisible au clavier.

**[Positif] Contraste excellent partout ailleurs**
Titre principal, titres de tâches, titres d'activité, auteur, date : tous entre **13:1 et 14.6:1** contre blanc — largement au-dessus du seuil AA, proche du niveau AAA (7:1).

### Visuel & Cohérence (confirmation post-correctifs)

**[Positif, confirmé en direct]** Les correctifs de centrage d'icônes (bulle de déploiement, icônes d'activité, de tâche, de groupe) sont **pixel-parfaits** : écart symétrique de ±0.5px sur les 4 côtés pour chaque icône — c'est le débordement naturel minimal d'un glyphe de 21px dans une boîte de 20px, pas un défaut.
**[Positif, confirmé en direct]** Les deux boutons d'en-tête ("Nouvelle collection", "Ouvrir le site") font tous les deux exactement 44px de hauteur.

### Performance / Console

**[Mineur, non visuel]** Un avertissement console : `WebSocket connection ... failed: WebSocket is closed before the connection is established` (socket temps-réel Sanity). Probablement transitoire (lié aux rechargements forcés pendant le développement), sans impact visuel observé, mais à surveiller si ça persiste en usage normal — pourrait indiquer un souci de sync temps-réel de l'historique de contenu.

## 3. Plan d'action priorisé

| # | Action | Effort | Impact | Pourquoi |
|---|--------|--------|--------|----------|
| 1 | Agrandir la zone cliquable du lien de statut de déploiement à min. 44px de hauteur | S | Moyen-Haut | Vraie violation de cible tactile sur un lien fonctionnel important |
| 2 | Agrandir la zone cliquable du bouton "Tout voir (9)" à min. 44px | S | Moyen | Même famille de problème, cohérence avec le reste du dashboard |
| 3 | Aligner l'anneau de focus du lien de déploiement sur le style indigo du reste du dashboard | S | Faible-Moyen | Cohérence visuelle, déjà quasi-conforme WCAG |
| 4 | Ajouter l'indication "s'ouvre dans un nouvel onglet" aux liens externes du dashboard | S | Faible | Cohérence avec le pattern déjà établi sur le site public |
| 5 | (Optionnel) Agrandir/assombrir légèrement le texte de résumé de tâche (10px, 4.99:1) | S | Faible | Marge de confort au-delà du minimum AA strict |
| 6 | Surveiller l'avertissement WebSocket dans la console en usage normal (hors rechargements forcés) | S | Faible | Vérifier que ce n'est pas un vrai souci de sync d'activité |

---
*Audité en direct le 2026-07-21 via Chrome DevTools MCP, session authentifiée réelle.*
