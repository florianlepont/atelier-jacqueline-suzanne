---
phase: quick-260810-qmm-ajuster-l-accueil-mobile-apr-s-l-apparit
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/MobileHomePrototype.astro
  - tests/e2e/homepage-scroll-deck.spec.ts
  - tests/e2e/homepage-mobile-responsive.spec.ts
  - tests/e2e/mobile-nav.spec.ts
  - tests/e2e/critical.smoke.spec.ts
  - tests/e2e/homepage-accent-random.spec.ts
  - tests/e2e/accessibility.spec.ts
autonomous: true
requirements:
  - QUICK-260810-QMM
must_haves:
  truths:
    - "Sur téléphone, le visiteur voit successivement le logo, la description, puis la photo Paysage sans texte avant d'atteindre les autres galeries."
    - "Le mouvement de photo mobile est latéral, de gauche à droite, et ne produit plus de travelling vertical."
    - "Le libellé Défiler/Scroll est lisible en noir sur le vert d'accent."
    - "La CI vérifie l'accueil mobile réellement livré et le panneau de navigation hamburger, sans attendre l'ancien scroll deck."
  artifacts:
    - "src/components/MobileHomePrototype.astro"
    - "Les six spécifications Playwright de l'accueil et du menu mobile"
  key_links:
    - "Le calcul de progression du prototype pilote à la fois le retrait du texte, le mouvement de la photo et l'apparition du logo compact/header."
    - "Les tests Playwright font défiler le vrai conteneur d'arrivée avant de tester le hamburger, au lieu de cibler le DOM desktop caché."
---

<objective>
Ajuster la version finale de l'accueil mobile, puis réaligner la couverture E2E qui bloquait la CI sur l'ancien carousel scroll-snapped et l'ancienne navigation inline.

Purpose: respecter la séquence visuelle validée par l'utilisateur sans régression desktop ni accessibilité mobile.
Output: prototype mobile avec temps de contemplation et travelling horizontal, plus tests E2E représentatifs.
</objective>

<context>
@AGENTS.md
@src/components/MobileHomePrototype.astro
@src/pages/index.astro
@src/pages/en/index.astro
@tests/e2e/homepage-scroll-deck.spec.ts
@tests/e2e/mobile-nav.spec.ts
@tests/e2e/critical.smoke.spec.ts
</context>

<user_decision_coverage>
- UD-01: après l'apparition du logo et de la description, conserver la photo de Paysage visible assez longtemps, puis faire disparaître la description avant les autres galeries.
- UD-02: remplacer le travelling vertical par un travelling gauche-vers-droite qui permet de parcourir toute la photo.
- UD-03: corriger le contraste de « Défiler ».
- UD-04: considérer cette expérience mobile comme la version validée et aligner les E2E, y compris le hamburger.
</user_decision_coverage>

<tasks>

<task type="auto">
  <name>Task 1: Orchestrer la séquence Paysage et le travelling horizontal de l'accueil mobile</name>
  <files>src/components/MobileHomePrototype.astro</files>
  <action>Implémenter UD-01 à UD-03 dans le prototype mobile actuellement rendu sous 768px par les deux routes d'accueil. Conserver la première image de galerie (Paysage) épinglée pendant une séquence à quatre temps, déterminée par la progression de scroll existante : disparition du wordmark, apparition lisible de la description, maintien bref de cette description, puis fondu complet de la description avant la fin de la zone d'arrivée. Prévoir une portion de scroll dédiée après ce fondu afin que la photo reste seule à l'écran avant que le premier panneau de série ou une autre galerie n'entre dans le viewport. Synchroniser la classe qui révèle le logo compact avec ce point de sortie, sans créer un second header ni toucher au comportement desktop.

Remplacer toutes les translations verticales utilisées pour le mouvement photographique mobile par un mouvement horizontal gauche-vers-droite. Pour l'image d'arrivée, piloter une propriété CSS dédiée à la progression du pan afin que le cadrage parcoure le paysage sur la période où la photo est contemplée; pour les photos de séries, convertir le parallax existant en translation X et conserver le zoom de couverture nécessaire pour éviter les bords vides. Ne pas utiliser de lecture de layout dans chaque animation frame : conserver la mesure au chargement/redimensionnement et la mise à jour via requestAnimationFrame. Garder le chemin `prefers-reduced-motion` sans animation forcée et avec une description stable/lisible.

Donner explicitement au repère « Défiler » / « Scroll » la couleur ink (`#1A1A1A` ou le token équivalent) afin de garantir le contraste sur le vert néon, tout en gardant son caractère décoratif (`aria-hidden`). Ajouter des attributs `data-role` uniquement si nécessaires pour tester l'étape d'arrivée ou le pan sans cibler des détails de style fragiles.</action>
  <verify>
    <automated>npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run build</automated>
  </verify>
  <done>À 393px, le logo laisse place à la description, la description atteint ensuite une opacité nulle avant le passage aux séries et la photo Paysage reste seule visible pendant une étape dédiée; aucun mouvement de photo mobile ne translate verticalement; le repère Défiler/Scroll calcule en `rgb(26, 26, 26)` sur le vert d'accent; l'expérience desktop reste servie par HomeCarousel.</done>
</task>

<task type="auto">
  <name>Task 2: Remplacer les attentes E2E de l'ancien deck par les contrats du prototype et du hamburger</name>
  <files>tests/e2e/homepage-scroll-deck.spec.ts, tests/e2e/homepage-mobile-responsive.spec.ts, tests/e2e/mobile-nav.spec.ts, tests/e2e/critical.smoke.spec.ts, tests/e2e/homepage-accent-random.spec.ts, tests/e2e/accessibility.spec.ts</files>
  <action>Implémenter UD-04 en supprimant les assertions qui attendent le `scroll-deck`, ses tracks de zoom, ses slides fullscreen et ses métriques de frame. Réécrire `homepage-scroll-deck.spec.ts` comme la spécification du prototype mobile : aux routes FR et EN et à 393px, elle vérifie la zone d'arrivée, un seul H1, le texte localisé, l'absence visuelle du carousel/grille desktop, l'ordre logo → description → photo seule → séries en faisant défiler les vraies hauteurs du conteneur, ainsi que le mouvement horizontal sans composante Y. Ajouter l'assertion de contraste calculé du repère Défiler/Scroll et la variante `prefers-reduced-motion` (pas de mouvement automatique, texte restant lisible).

Mettre à jour `homepage-mobile-responsive.spec.ts` pour vérifier le vrai contrat étroit : absence d'overflow et hamburger à 320px, plutôt que l'ancien alignement de la navigation inline. Dans `mobile-nav.spec.ts`, centraliser une aide qui atteint l'état où le header est réellement interactif (scroll normal jusqu'à la fin de l'arrivée, ou variante reduced-motion), puis conserver les contrôles d'ouverture, fermeture, focus, navigation et absence d'overflow du dialogue natif. Retirer les commentaires qui expliquent ces cas par l'ancien zoom/deck.

Mettre à jour le smoke WebKit pour reconnaître l'arrivée du prototype, son wordmark et l'absence d'overflow plutôt que les sélecteurs du deck; conserver le scénario de restauration de focus du hamburger. Déplacer les assertions propres au carousel legacy de `homepage-accent-random.spec.ts` à une largeur desktop/tablette afin qu'elles ne testent jamais une sous-arborescence cachée. Enfin, faire scanner Axe dans les deux états de l'accueil mobile réellement atteignables (arrivée et panneau hamburger ouvert), sans dépendre des anciennes conditions de zoom.</action>
  <verify>
    <automated>npm run test:e2e -- tests/e2e/homepage-scroll-deck.spec.ts tests/e2e/homepage-mobile-responsive.spec.ts tests/e2e/mobile-nav.spec.ts tests/e2e/critical.smoke.spec.ts tests/e2e/homepage-accent-random.spec.ts tests/e2e/accessibility.spec.ts &amp;&amp; npm run test:e2e</automated>
  </verify>
  <done>Les six spécifications n'attendent plus les sélecteurs ni la géométrie de l'ancien scroll deck; les tests de carousel legacy s'exécutent à une largeur où il est visible; FR, EN, reduced motion, Chromium et WebKit couvrent la séquence mobile validée et les parcours du hamburger; la suite E2E complète passe.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Scroll/animation client → interface mobile | Les mesures et évènements de scroll pilotent seulement des styles client, mais une mauvaise progression peut masquer du contenu ou créer un mouvement inaccessible. |
| Tests Playwright → DOM responsive | Des sélecteurs vers une arborescence cachée peuvent faire passer la CI sans vérifier l'interface livrée. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-QMM-01 | Denial of service | `MobileHomePrototype.astro` scroll handler | low | mitigate | Conserver les mesures hors animation frame, limiter les mutations à des propriétés compositées et annuler les updates doublons. |
| T-QMM-02 | Tampering | E2E responsive selectors | medium | mitigate | Les tests ciblent le prototype visible et font défiler le vrai conteneur avant les assertions du hamburger. |
| T-QMM-03 | Information disclosure | Aucun | low | accept | Aucun nouvel input utilisateur, appel réseau, secret ou package n'est introduit. |
</threat_model>

<verification>
Exécuter `npm run typecheck`, `npm run lint`, `npm run build`, les six specs ciblées puis `npm run test:e2e`. Faire ensuite une passe manuelle à 390px sur Safari/iPhone : vérifier le temps de contemplation sans texte, le pan gauche-droite, le repère noir et l'ouverture/fermeture du menu.
</verification>

<success_criteria>
- La photo Paysage est admirée seule après le texte avant toute série suivante.
- Aucun travelling mobile ne déplace la photo sur l'axe vertical.
- Le repère de scroll a un contraste suffisant sur le vert d'accent.
- La CI E2E ne conserve aucune attente structurelle du scroll deck retiré et passe complètement.
</success_criteria>

<source_audit>
| Source | Item | Coverage |
|---|---|---|
| GOAL | Séquence mobile finale et corrections de recette | Tasks 1–2 |
| REQ | `QUICK-260810-QMM` | Tasks 1–2 |
| RESEARCH | Aucun nouveau package ou intégration; les patterns existants sont vanilla JS, `requestAnimationFrame`, Playwright et Axe | Tasks 1–2 |
| CONTEXT | UD-01 à UD-04, décisions directes de l'utilisateur | Tasks 1–2 |
</source_audit>

<output>
Create `.planning/quick/260810-qmm-ajuster-l-accueil-mobile-apr-s-l-apparit/260810-qmm-SUMMARY.md` when done.
</output>
