---
status: resolved
trigger: "À certaines dimensions du navigateur, l'image de fond ne remplit pas tout l'écran et le footer paraît énorme."
created: 2026-07-22T00:00:00+02:00
updated: 2026-07-22T14:23:20+02:00
---

## Current Focus

hypothesis: |
  CONFIRMÉE ET VALIDÉE — sur desktop haut, la contrainte 16:9 sans
  `min-height` plein viewport réduisait la photo à 720 px; la promotion de
  `min-height:100svh` vers la règle de base corrige directement ce mécanisme.
test: |
  Validation humaine effectuée sur le build à exactement 1280x1320.
expecting: |
  Photo de y=0 à y=1320 et footer commençant à y=1320, invisible avant
  défilement.
next_action: |
  Session résolue; archiver le journal, valider les commits et mettre à jour
  la knowledge base.
reasoning_checkpoint:
  hypothesis: "La contrainte 16:9 réduit le hero desktop haut à 720 px parce que le min-height plein viewport n'est déclaré que sous 767 px."
  confirming_evidence:
    - "Playwright mesure exactement 1280x720 pour la photo à un viewport 1280x1320, soit la hauteur issue de 1280 * 9 / 16."
    - "Le footer ne mesure que 145 px et commence à y=720; il n'est donc pas surdimensionné."
    - "Le test de régression RED échoue sur la hauteur photo attendue >=1318 avec 720 reçu."
  falsification_test: "Après promotion du seul min-height existant, une photo restant sous 1318 px ou un footer commençant avant y=1319 à 1280x1320 réfuterait le mécanisme proposé."
  fix_rationale: "Appliquer la même hauteur minimale de petit viewport à toutes les largeurs force le conteneur photo à remplir le pli initial; object-fit:cover remplit alors cette boîte et repousse naturellement le footer sans modifier celui-ci."
  blind_spots: "La vérification automatisée utilise Chromium; le chrome dynamique Safari reste couvert par la règle 100svh déjà validée sur mobile, mais ne peut pas être reproduit exactement ici. Les viewports desktop larges/courts et mobile doivent être retestés pour exclure une régression."
tdd_checkpoint:
  test_file: tests/e2e/homepage.spec.ts
  test_name: at 1280x1320 the photo fills the initial viewport and the footer stays below the fold
  status: green
  failure_output: "Expected photo height >= 1318; received 720 at tests/e2e/homepage.spec.ts:680"
  green_output: "Focused responsive checks 2/2 passed; full Chromium homepage suite 41/41 passed."

## Symptoms

expected: |
  En mode carrousel, la photographie de fond remplit la hauteur visible de
  l'écran à toutes les dimensions du navigateur et le footer reste sous le pli.
actual: |
  À environ 1280x1320, la photographie s'arrête vers 720 px (ratio 16:9), puis
  une grande zone blanche contenant le footer occupe le reste de l'écran.
errors: Aucun message d'erreur ; défaut visuel responsive uniquement.
reproduction: Ouvrir la page d'accueil en mode carrousel avec un viewport desktop haut, par exemple 1280x1320.
started: Signalé par l'utilisateur le 2026-07-22 avec une capture d'écran.

## Eliminated

- hypothesis: Le footer possède une hauteur ou un padding anormalement grand à 1280x1320.
  evidence: Le footer mesuré fait 145 px de haut avec 32 px de padding haut et bas; il commence simplement à y=720 parce que le hero précédent s'arrête là.
  timestamp: 2026-07-22T14:15:00+02:00

## Evidence

- timestamp: 2026-07-22T14:13:22+02:00
  checked: Knowledge base des sessions résolues
  found: Aucun motif connu ne partage au moins deux mots-clés avec ce défaut visuel responsive.
  implication: La session doit tester directement les règles de dimensionnement du hero; aucun diagnostic antérieur ne peut être priorisé.
- timestamp: 2026-07-22T14:14:00+02:00
  checked: Structure complète de HomeCarousel.astro, BaseLayout.astro, SiteHeader.astro et tests/e2e/homepage.spec.ts
  found: La photo desktop a width:100%, aspect-ratio:16/9 et max-height:100vh, mais aucun min-height; min-height:100svh n'existe que dans @media (max-width:767px). Le footer est un élément de flux normal avec seulement 32px de padding vertical sur desktop.
  implication: À 1280px de large, la formule CSS impose 720px de hauteur malgré un viewport de 1320px; le footer ne contient aucune règle pouvant lui attribuer les ~600px restants.
- timestamp: 2026-07-22T14:14:00+02:00
  checked: Common Bug Patterns — catégories rapides
  found: Aucun motif null/async/state/import/data ne correspond; le défaut est une condition de frontière responsive où une contrainte maximale ne garantit pas une hauteur minimale.
  implication: Le candidat prioritaire est la règle de dimensionnement CSS elle-même, pas le script du carrousel ni les données Sanity.
- timestamp: 2026-07-22T14:15:00+02:00
  checked: Reproduction Playwright instrumentée à 1280x1320
  found: Le viewport mesure 1280x1320; `.home-hero__photo` et `.home-hero` mesurent exactement 1280x720 et se terminent à y=720. Le footer commence à y=720 et mesure seulement 145 px.
  implication: La hauteur 16:9 non assortie d'un minimum desktop est directement responsable du footer visible 600 px trop tôt; le footer lui-même n'est pas surdimensionné.
- timestamp: 2026-07-22T14:15:58+02:00
  checked: Test Playwright ciblé tall-desktop full-bleed hero regression
  found: Le nouveau test échoue en phase RED avec `Expected >= 1318, Received 720` sur la hauteur de `.home-hero__photo`.
  implication: Le test reproduit automatiquement le symptôme exact avant toute correction et protège la hauteur du hero ainsi que la position du footer.
- timestamp: 2026-07-22T14:18:31+02:00
  checked: Correction CSS minimale dans HomeCarousel.astro
  found: `min-height:100svh` a été promu de la media query mobile vers la règle de base `.home-hero__photo`; la règle mobile dupliquée a été supprimée.
  implication: Tous les viewports disposent maintenant du même plancher plein écran, sans changer le comportement mobile déjà validé.
- timestamp: 2026-07-22T14:18:51+02:00
  checked: Build statique de production après correction
  found: `npm run build` termine avec succès et génère les 21 pages.
  implication: La correction CSS compile dans l'artefact Astro réel utilisé par Playwright.
- timestamp: 2026-07-22T14:19:20+02:00
  checked: Reproduction desktop haute et régression mobile full-bleed sous Chromium
  found: Les 2 tests ciblés passent, y compris le cas exact 1280x1320 auparavant RED et le cas mobile avec morph actif.
  implication: La correction satisfait le test de falsification causal et conserve le comportement mobile adjacent.
- timestamp: 2026-07-22T14:19:53+02:00
  checked: Suite Playwright complète de la page d'accueil sous Chromium
  found: Les 41 tests passent, couvrant carrousel, grille, responsive, header, images progressives, transitions et sémantique.
  implication: Aucun comportement adjacent de la page d'accueil ne régresse avec la nouvelle contrainte de hauteur.
- timestamp: 2026-07-22T14:20:11+02:00
  checked: Contrôle Astro/TypeScript après correction
  found: `npm run typecheck` termine avec 0 erreur et 0 warning; 5 hints préexistants restent signalés.
  implication: La modification et le test de régression sont valides pour le compilateur et l'analyseur Astro.
- timestamp: 2026-07-22T14:20:31+02:00
  checked: Intégrité whitespace du diff
  found: `git diff --check` ne signale aucune erreur.
  implication: Le correctif ne contient ni espace de fin ni marqueur de conflit.
- timestamp: 2026-07-22T14:20:51+02:00
  checked: Relecture finale du diff et de l'état de travail
  found: Le diff de code est limité à la promotion du min-height et au test Playwright tall-desktop; le seul autre fichier est ce journal de debug.
  implication: Le correctif est minimal, ciblé et prêt pour la validation humaine dans le navigateur réel.
- timestamp: 2026-07-22T14:23:20+02:00
  checked: Validation humaine sur le site construit à exactement 1280x1320
  found: La photo commence à y=0, mesure 1320 px et se termine à y=1320; le footer commence à y=1320 avec sa hauteur normale de 145 px. La capture ne montre aucun footer avant défilement.
  implication: Le workflow réel confirme le test automatisé et satisfait entièrement le critère d'acceptation original; la session peut être archivée.

## Resolution

root_cause: |
  `.home-hero__photo` applique `aspect-ratio:16/9` sur desktop avec seulement
  `max-height:100vh`; à 1280x1320, la largeur calcule une hauteur de 720 px.
  La règle `min-height:100svh` qui garantirait un plein écran est limitée à
  `@media (max-width:767px)`, donc le footer normal entre dans le viewport à
  y=720 et donne l'impression d'occuper tout l'espace restant.
fix: |
  Promotion de `min-height:100svh` vers la règle de base
  `.home-hero__photo`, avec conservation de `max-height:100vh` et
  `object-fit:cover`; suppression de la déclaration mobile devenue redondante.
verification: |
  `npm run build` réussi (21 pages); tests Playwright ciblés 2/2 réussis;
  suite homepage Chromium 41/41 réussie; `npm run typecheck` avec 0 erreur
  et 0 warning; `git diff --check` sans sortie. Validation humaine confirmée
  sur le build à exactement 1280x1320: photo y=0..1320, footer y=1320 avec
  sa hauteur normale de 145 px, aucun footer visible avant défilement.
files_changed:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
