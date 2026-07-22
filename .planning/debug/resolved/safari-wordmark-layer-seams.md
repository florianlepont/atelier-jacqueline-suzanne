---
status: awaiting_human_verify
trigger: "Des formes et bandes géométriques apparaissent dans les lettres du wordmark après l'ajout du voile de contraste."
created: 2026-07-22T14:55:00+02:00
updated: 2026-07-22T15:25:00+02:00
---

## Current Focus

hypothesis: |
  Révisé après retour utilisateur : supprimer la seconde background-image
  n'a pas suffi. Les artefacts viennent plus largement des couches de peinture
  supplémentaires de Safari, notamment text-stroke/paint-order sur le texte
  multiligne transparent.
next_action: Faire confirmer dans Safari la version sans blend ni contour.

## Symptoms

expected: Le remplissage photographique est continu à travers toutes les lettres.
actual: Des rectangles et bandes droites apparaissaient dans A, T, E et J sur Safari.
errors: Aucun message d'erreur ; artefact de rendu CSS uniquement.
reproduction: Ouvrir le wordmark Paysage sur Safari après le commit 28ea128.
started: Signalé par l'utilisateur avec une capture le 2026-07-22.

## Evidence

- timestamp: 2026-07-22T14:55:00+02:00
  checked: Capture Safari fournie par l'utilisateur
  found: Les défauts sont rectilignes et traversent plusieurs glyphes, contrairement aux formes organiques de la photographie.
  implication: Le défaut vient du découpage/rastering des couches CSS, pas du fichier image.

- timestamp: 2026-07-22T14:58:00+02:00
  checked: CSS calculé et prévisualisation Paysage à 1280x800
  found: Le wordmark utilise une seule background-image, une couleur rgba(0,0,0,0.22) et background-blend-mode:multiply ; le remplissage est continu sans raccord.
  implication: La suppression de la seconde image de fond élimine la cause structurelle tout en conservant l'assombrissement.

- timestamp: 2026-07-22T15:05:00+02:00
  checked: Nouveau retour et capture Safari de l'utilisateur
  found: Les formes restent visibles après suppression du gradient ; text-stroke et paint-order sont encore actifs.
  implication: La première correction était insuffisante. Tous les contours et blends doivent être supprimés.

## Resolution

root_cause: |
  Safari produit des artefacts géométriques quand ce texte multiligne combine
  background-clip:text avec des couches de peinture supplémentaires. Le
  gradient était un déclencheur possible, mais text-stroke/paint-order a
  continué à provoquer le défaut après son retrait.
fix: |
  Utiliser une seule background-image, sans background-color/blend, sans
  text-stroke et sans paint-order. Appliquer un filtre adaptatif au résultat
  rasterisé : brightness(.65) contrast(1.12) sur panneau clair et
  brightness(1.38) contrast(.92) sur panneau sombre.
verification: |
  Build réussi (21 pages), typecheck sans erreur et 41/41 tests homepage
  réussis. Confirmation Safari encore requise.
files_changed:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
  - .planning/quick/260722-improve-wordmark-legibility-SUMMARY.md
