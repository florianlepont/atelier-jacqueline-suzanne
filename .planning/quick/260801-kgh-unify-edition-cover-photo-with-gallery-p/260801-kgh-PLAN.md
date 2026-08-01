---
phase: quick-260801-kgh
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260801-kgh]
files_modified:
  - src/lib/sanity.ts
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/pages/editions/index.astro
  - src/pages/en/editions/index.astro
  - src/components/EditionDetailBody.astro
  - sanity/schemas/edition.ts
  - sanity/schemas/gallery.ts
  - sanity/editorial/checks.ts
  - tests/unit/edition-query.test.ts
  - tests/unit/editorial-checks.test.ts
  - tests/unit/dashboard-logic.test.ts
  - tests/e2e/edition.spec.ts
must_haves:
  truths:
    - "`npm run build` réussit contre le dataset production réel, où le champ dédié de couverture a déjà été retiré des 3 éditions publiées (Silos, Rebut, Entasse) — c'est la porte qui prouve que le site n'est plus cassé par la migration déjà effectuée."
    - "Sur une page de détail d'édition, la photo héros est la première photo PAYSAGE du tableau `images` (repli sur la photo 1 si aucune n'est paysage), exactement comme sur une page de collection photo."
    - "Le déclencheur héros d'une page d'édition ouvre la visionneuse sur SA diapositive réelle (pas systématiquement la première) et le compteur affiche sa position réelle — l'aria-label et le compteur concordent toujours."
    - "La grille de la page de détail d'une édition n'affiche plus la photo héros en doublon, et chaque vignette ouvre la diapositive correspondant à sa position réelle dans `images`."
    - "Les listes /editions et /en/editions affichent pour chaque édition la couverture choisie par `pickHeroIndex`, exactement comme l'accueil le fait déjà pour les collections photo."
    - "Dans le Studio, la fiche Édition n'expose plus qu'un seul champ photo (le tableau « Photos de l'objet imprimé ») ; sa description et son message de validation indiquent que la première photo sert de couverture, et l'aperçu de la liste montre `images.0`."
    - "La checklist éditoriale d'une Édition ne contient plus de ligne dédiée à la photo de couverture ; une édition sans photo, ou dont la première photo est incomplète, reste bloquée par les lignes `images` existantes."
    - "Dans le Studio, l'onglet de la fiche Collection photo qui regroupe l'affichage accueil et la couleur s'intitule désormais « Couleur » — le libellé du tableau de bord pour le document `homePage` est inchangé."
  artifacts:
    - path: "src/lib/sanity.ts"
      provides: "Interface `Edition` sans champ de couverture dédié + projection GROQ partagée `IMAGES_WITH_DIMENSIONS_PROJECTION` appliquée aux 4 requêtes (2 gallery + 2 edition)"
    - path: "src/pages/editions/[slug].astro"
      provides: "Dérivation héros identique à galleries/[slug].astro : pickHeroIndex + exclusion de l'index réel dans la grille"
    - path: "src/pages/en/editions/[slug].astro"
      provides: "Jumeau EN de la même dérivation"
    - path: "src/pages/editions/index.astro"
      provides: "Couverture de vignette dérivée de pickHeroIndex, motif de src/pages/index.astro"
    - path: "src/pages/en/editions/index.astro"
      provides: "Jumeau EN de la même dérivation"
    - path: "src/components/EditionDetailBody.astro"
      provides: "Prop `heroIndex` obligatoire transmise à DetailHero (parité avec GalleryDetailBody)"
    - path: "sanity/schemas/edition.ts"
      provides: "Schéma Édition à un seul champ photo, description/validation/preview alignées sur gallery.ts"
    - path: "sanity/editorial/checks.ts"
      provides: "Branche `edition` de getDocumentChecks sans ligne de couverture dédiée"
    - path: "sanity/schemas/gallery.ts"
      provides: "Onglet `homepage` renommé « Couleur » (clé `name` inchangée)"
    - path: "tests/e2e/edition.spec.ts"
      provides: "Assertions héros/visionneuse structurelles, calquées sur tests/e2e/gallery.spec.ts"
  key_links:
    - "`pickHeroIndex` (src/lib/image-orientation.ts) lit `image.dimensions.width/height` → la projection GROQ des éditions DOIT désormais déréférencer `asset->metadata.dimensions`, sinon la sélection paysage est inerte et retombe silencieusement sur l'index 0"
    - "`heroIndex` calculé dans la page → `EditionDetailBody` → `DetailHero` `data-index` → index de diapositive de `Lightbox` : la chaîne doit être complète, sinon l'aria-label annonce une position et la visionneuse en ouvre une autre"
    - "`lightboxImages` = le tableau `images` COMPLET et non réordonné → les index de la grille et du héros sont des positions réelles dans ce même tableau"
    - "`sanity/schemas/edition.ts` `preview.select.media: 'images.0'` → aperçu de la liste Studio (mirror de gallery.ts)"
    - "`sanity/schemas/gallery.ts` clé `name: 'homepage'` → référencée par `group: 'homepage'` sur `showOnHomePage` et `heroColor` : seul le `title` change"
---

<objective>
Aligner la gestion de la photo de couverture des Éditions sur celle des Collections photo : supprimer le champ de couverture dédié et utiliser la position dans le tableau `images` partagé, avec la même sélection « première photo paysage » (`pickHeroIndex`) que les collections.

Purpose: La migration des données live est DÉJÀ FAITE (les 3 éditions publiées ont vu leur photo de couverture insérée en position 0 de `images`, puis le champ dédié retiré). Le code de cette branche lit encore ce champ absent — un `npm run build` contre le dataset production plante donc aujourd'hui sur `builder.image(undefined)`. Ce plan est la moitié « code » de ce changement : il répare le build ET supprime la divergence de modèle entre Édition et Collection photo.
Output: Un seul champ photo par Édition, quatre routes Astro alignées sur le motif gallery, schéma + checklist Studio nettoyés, tests unitaires et e2e mis à jour, plus un renommage d'onglet Studio sans rapport (« Accueil » → « Couleur » sur la fiche Collection photo).

Branche : travailler et committer directement sur `codex/studio-publication-workflow` (PR #12 déjà ouverte). NE PAS créer de nouvelle branche.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Motifs de référence à LIRE EN ENTIER avant d'éditer quoi que ce soit :
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro
@src/pages/index.astro
@src/lib/image-orientation.ts
@src/components/GalleryDetailBody.astro
@src/components/DetailHero.astro
@sanity/schemas/gallery.ts
@tests/e2e/gallery.spec.ts
@tests/unit/gallery-query.test.ts

# Fichiers modifiés :
@src/lib/sanity.ts
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro
@src/pages/editions/index.astro
@src/pages/en/editions/index.astro
@src/components/EditionDetailBody.astro
@sanity/schemas/edition.ts
@sanity/editorial/checks.ts
@tests/unit/edition-query.test.ts
@tests/unit/editorial-checks.test.ts
@tests/unit/dashboard-logic.test.ts
@tests/e2e/edition.spec.ts
</context>

<state_of_the_world>
Faits vérifiés dans le dépôt au moment de la rédaction (les numéros de ligne peuvent avoir bougé — toujours relire le fichier avant d'éditer) :

1. **Les données live sont déjà migrées.** Les 3 éditions publiées ont leur photo de couverture en position 0 de `images` et le champ dédié effacé. Aucun script de migration, aucune écriture Sanity ne doit être produite par ce plan.
2. **Le build est cassé aujourd'hui.** `src/pages/editions/[slug].astro` appelle `fullSizeUrl(edition.leadPhoto, 2000)`, et `edition.leadPhoto` est maintenant `undefined` en production → `builder.image(undefined)` lève. La Task 2 est le correctif ; `npm run build` ne peut donc PAS servir de porte avant elle.
3. **Les pages de liste utilisent bien `pickHeroIndex`.** `src/pages/index.astro`, `src/pages/en/index.astro` et `src/pages/404.astro` font tous `gallery.images[pickHeroIndex(gallery.images)]`. La question ouverte du brief (« les listes utilisent-elles `images[0]` brut ? ») est tranchée : NON, elles utilisent `pickHeroIndex`. Les listes d'éditions doivent faire pareil.
4. **`pickHeroIndex` a besoin de `image.dimensions`.** Les requêtes gallery projettent `"dimensions": asset->metadata.dimensions` ; les requêtes edition projettent `images` brut. Sans enrichissement, `pickHeroIndex` ne trouverait jamais de paysage et retomberait silencieusement sur l'index 0 — la fonctionnalité serait inerte. D'où la Task 1.
5. **DÉVIATION ASSUMÉE vs le brief : `EditionDetailBody.astro` DOIT changer.** Le brief demandait de ne pas y toucher, mais `DetailHero` déclare `heroIndex?: number` avec un défaut de `0`, et `EditionDetailBody` ne transmet pas cette prop (contrairement à `GalleryDetailBody`). Sans transmission, une édition dont le héros est la photo 3 afficherait l'aria-label « image 3 sur N » tout en ouvrant la diapositive 1 — bug d'accessibilité réel et livré. Le changement est strictement ADDITIF (une prop en plus, aucune prop existante renommée ou supprimée : `leadPhotoSrc`/`leadPhotoSrcSet`/`leadPhotoAlt` restent tels quels), et il reproduit exactement ce que `GalleryDetailBody` fait déjà.
6. **Deux emplacements e2e ciblent le héros par `data-index="0"`** dans `tests/e2e/edition.spec.ts` : le test « editions lightbox » et le test `prefers-reduced-motion`. Les deux doivent passer au localisateur structurel `.detail-hero [data-gallery-thumb]`, comme `tests/e2e/gallery.spec.ts` le fait déjà.
7. **Le libellé « Accueil » existe à deux endroits** dans `sanity/` : `sanity/schemas/gallery.ts` (l'onglet à renommer) et `sanity/editorial/workflowLogic.ts` (libellé du document `homePage` dans le tableau de bord — À NE PAS TOUCHER).
</state_of_the_world>

<scope_boundaries>
HORS SCOPE — ne pas faire, même si ça semble « compléter » le travail :

1. **Aucune écriture dans Sanity, aucun script de migration.** Les données live sont déjà dans la forme attendue.
2. **Ne pas modifier `src/components/DetailHero.astro` ni `src/components/GalleryDetailBody.astro`.** Le seul composant partagé touché est `EditionDetailBody.astro`, et uniquement pour l'ajout additif de `heroIndex` (voir `<state_of_the_world>` point 5).
3. **Ne pas renommer les props `leadPhotoSrc` / `leadPhotoSrcSet` / `leadPhotoAlt`** des composants partagés. Elles sont utilisées par les pages gallery ET edition ; les renommer est un refactor distinct, non demandé.
4. **Ne pas restructurer les items de checklist restants** de la branche `edition` dans `sanity/editorial/checks.ts`. La branche `gallery` éclate ses vérifications photo en 4 lignes, la branche `edition` les combine — cette différence de style est laissée intacte. Ce plan ne fait que RETIRER la ligne de couverture dédiée.
5. **Ne pas changer le traitement visuel de la grille d'édition.** Elle reste en vignettes carrées (`thumbnailUrl` / `responsiveThumbnailSrcSet`, `GalleryGrid` sans `layout="masonry"`) ; seuls les INDEX et l'exclusion du héros changent. Ne pas y importer le motif masonry/`aspectRatio` de la page gallery.
6. **Ne pas ajouter de filtre dans `getStaticPaths`** des pages de détail d'édition. Une édition sans photo ferait planter le build — exposition strictement identique à celle des collections photo aujourd'hui ; corriger cette symétrie est un travail distinct.
7. **Ne pas renommer la clé `name: 'homepage'`** du groupe de `gallery.ts`, ni déplacer les champs `showOnHomePage` / `heroColor`. Seul le `title` visible change.
8. **Ne pas toucher `sanity/editorial/workflowLogic.ts`.**
</scope_boundaries>

<tasks>

<task type="auto">
  <name>Task 1: Projection GROQ partagée — exposer les dimensions d'image aux requêtes Édition</name>
  <files>src/lib/sanity.ts, tests/unit/edition-query.test.ts</files>
  <action>
Changement purement ADDITIF : rien n'est supprimé ici, donc l'arbre reste vert (typecheck + build inchangés). Objectif : rendre `pickHeroIndex` réellement opérant sur les éditions avant que les pages ne s'en servent en Task 2.

Dans `src/lib/sanity.ts` :

1. Renommer la constante `GALLERY_IMAGES_WITH_DIMENSIONS_PROJECTION` en `IMAGES_WITH_DIMENSIONS_PROJECTION` (constante module-privée, non exportée — le renommage n'a aucun effet hors fichier). Mettre à jour ses 2 usages existants dans `GALLERIES_QUERY` et `GALLERY_BY_SLUG_QUERY`. La chaîne GROQ produite pour les collections doit rester STRICTEMENT identique octet pour octet — seul le nom de la variable change.

2. Dans `EDITIONS_QUERY` et `EDITION_BY_SLUG_QUERY`, remplacer le champ nu `images` par l'interpolation `${IMAGES_WITH_DIMENSIONS_PROJECTION}`, en conservant la position et l'ordre de tous les autres champs de la projection.

3. Mettre à jour le commentaire au-dessus de la constante : il ne parle plus que des collections ; il doit indiquer qu'elle est désormais partagée par les 4 requêtes (2 collections + 2 éditions), et que les éditions en ont besoin pour la même raison que les collections (`pickHeroIndex` préfère la première photo paysage).

4. Mettre à jour le commentaire JSDoc au-dessus de l'interface `ImageDimensions` : il affirme « Only projected for gallery queries » — devenu faux. Le reformuler pour dire que les requêtes collection ET édition la projettent.

5. Mettre à jour le commentaire inline au-dessus du champ `dimensions?` de l'interface `GalleryImage` : il affirme que les requêtes édition ne projettent jamais ce champ — devenu faux. Le reformuler : le champ reste OPTIONNEL (un asset dont Sanity n'a pas encore calculé les métadonnées peut ne rien renvoyer, et `pickHeroIndex` traite déjà ce cas comme « non paysage »), mais les deux familles de requêtes le projettent maintenant.

Dans `tests/unit/edition-query.test.ts` :

6. Ajouter, dans le `describe('getEditions')`, un test calqué mot pour mot sur celui de `tests/unit/gallery-query.test.ts` qui assure la déréférence des dimensions (le lire d'abord) : mock `fetchMock.mockResolvedValueOnce([])`, appel de `getEditions()`, puis `expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('"dimensions": asset->metadata.dimensions'))`.

7. Ajouter le test symétrique dans `describe('getEdition')`, en respectant la forme à deux arguments utilisée par ce bloc : `expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('"dimensions": asset->metadata.dimensions'), {slug: 'rebut'})`.

8. NE PAS toucher aux fixtures ni aux autres tests de ce fichier dans cette task (leur nettoyage est la Task 3). Vérifier en particulier que le test existant « does not reference a seo field » passe toujours : la nouvelle projection n'introduit aucune occurrence de `seo`.
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website &amp;&amp; test "$(grep -c 'const IMAGES_WITH_DIMENSIONS_PROJECTION' src/lib/sanity.ts)" = 1 &amp;&amp; test "$(grep -c '${IMAGES_WITH_DIMENSIONS_PROJECTION}' src/lib/sanity.ts)" = 4 &amp;&amp; test "$(grep -c 'asset->metadata.dimensions' src/lib/sanity.ts)" = 1 &amp;&amp; npm run test:unit -- edition-query gallery-query &amp;&amp; npm run typecheck</automated>
  </verify>
  <!-- Portes POSITIVES : 1 définition + 4 interpolations (2 collections + 2 éditions), la déréférence n'existant qu'une fois puisqu'elle vit dans la constante partagée. -->
  <done>
La constante de projection est partagée et interpolée dans les 4 requêtes ; les requêtes collections produisent une chaîne GROQ inchangée ; les requêtes éditions déréfèrent désormais `asset->metadata.dimensions` ; 4 commentaires devenus faux sont corrigés ; `edition-query` et `gallery-query` passent ; `astro check` reste à 0 erreur.
  </done>
</task>

<task type="auto">
  <name>Task 2: Les 4 routes Édition adoptent la sélection de héros paysage des collections</name>
  <files>src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro, src/pages/editions/index.astro, src/pages/en/editions/index.astro, src/components/EditionDetailBody.astro, tests/e2e/edition.spec.ts</files>
  <action>
C'est la task qui répare le build cassé (voir `<state_of_the_world>` point 2). Lire `src/pages/galleries/[slug].astro` EN ENTIER avant de commencer : c'est le motif à reproduire.

**A. `src/components/EditionDetailBody.astro`** (changement additif, voir `<state_of_the_world>` point 5) :
Ajouter `heroIndex: number;` à l'interface `Props` (OBLIGATOIRE, non optionnel — même raisonnement que `scrollHintLabel` documenté dans `DetailHero.astro` : `astro check` échoue si l'un des deux jumeaux de route est oublié), le déstructurer, et le transmettre à `<DetailHero heroIndex={heroIndex} ... />`. Placer la prop au même endroit relatif que dans `GalleryDetailBody.astro` (juste après `heroAriaLabel`). Ne rien changer d'autre : ni le balisage, ni le bloc `<style>`, ni les autres props.

**B. `src/pages/editions/[slug].astro`** — remplacer toute la dérivation actuelle de la photo de couverture par le motif de la page collection :
- Importer `pickHeroIndex` depuis `'../../lib/image-orientation'`.
- Dériver, dans cet ordre : le tableau `images` (en conservant le garde-fou nullish `?? []` déjà présent dans ce fichier, posture D-02/WR-03), `heroIndex` via `pickHeroIndex(images)`, puis `heroImage = images[heroIndex]`.
- Alimenter `leadPhotoSrc` / `leadPhotoSrcSet` / `leadPhotoAlt` et `socialImage` depuis `heroImage` (mêmes helpers et mêmes largeurs qu'aujourd'hui : `fullSizeUrl(..., 2000)`, `responsiveImageSrcSet(...)`, `alt?.[locale] ?? ''`, `fullSizeUrl(..., 1200)`).
- `lightboxImages` devient le tableau `images` COMPLET et non réordonné (plus de tableau combiné construit par spread), et `total` devient `images.length` (plus de `+ 1`).
- `heroAriaLabel` doit annoncer la position RÉELLE du héros : `heroIndex + 1` sur `total`, en conservant la formulation française existante du fichier.
- Grille : construire par `.map((img, index) => ...)` puis `.filter()` sur l'index réel différent de `heroIndex`, exactement comme la page collection — et NON par un décalage `i + 1`. Chaque item conserve son index RÉEL dans `images` ; `src`/`srcset`/`alt` gardent les helpers actuels (vignette carrée, voir `<scope_boundaries>` point 5) ; l'`ariaLabel` annonce `index + 1` sur `total`.
- Passer `heroIndex={heroIndex}` à `<EditionDetailBody>`.
- Commentaires : le bloc d'en-tête décrit aujourd'hui le tableau combiné et le « NO .slice(1) » ; le commentaire au-dessus de la grille dit la même chose ; la note SEO cite le champ de couverture supprimé. Les trois sont devenus faux et doivent être réécrits pour décrire le nouveau comportement (tableau unique, héros paysage à index réel, exclusion par index réel, SEO construit depuis `title`/`statement`/la photo héros). Conserver les points encore vrais : D-05 (héros cliquable), D-08 (back-link en flux normal), l'absence de champ `seo` sur `edition`.

**C. `src/pages/en/editions/[slug].astro`** — jumeau strict de B, avec le chemin d'import `'../../../lib/image-orientation'` et les chaînes anglaises existantes du fichier (`View full size, image N of M`). Aucune divergence de logique entre les deux jumeaux.

**D. `src/pages/editions/index.astro` et `src/pages/en/editions/index.astro`** — reproduire le motif de la page d'accueil (`src/pages/index.astro`, à relire) :
- Importer `pickHeroIndex`.
- Filtrer les éditions sans photo avant de construire les vignettes, comme l'accueil filtre les collections sans photo — c'est ce qui empêche un `builder.image(undefined)` sur une édition incomplète.
- Pour chaque édition, dériver `cover = images[pickHeroIndex(images)]` puis alimenter `imgSrc` / `imgSrcset` / `alt` depuis `cover`, en conservant les helpers et largeurs actuels (`previewPanelUrl(..., 680)`, `responsiveThumbnailSrcSet(...)`).
- `href`, `title` et `statement` sont inchangés. Ne pas toucher à `EditionsOverviewBody.astro` : la forme des tuiles ne change pas.

**E. `tests/e2e/edition.spec.ts`** — lire d'abord `tests/e2e/gallery.spec.ts` (bloc « gallery hero is clickable ») : c'est le motif à reproduire.
- Test « editions lightbox » : renommer le `it`/`test` pour supprimer la mention du tableau combiné et décrire le nouveau comportement (tableau `images` unique, héros choisi par préférence paysage, EDN-03). Remplacer le localisateur `[data-gallery-thumb][data-index="0"]` par le localisateur STRUCTUREL `.detail-hero [data-gallery-thumb]`, lire le `data-index` réel du héros, assurer que son `aria-label` contient bien `heroIndex + 1`, puis que le compteur de la visionneuse affiche `${heroIndex + 1} / ${total}`. Conserver le cycle Escape → focus rendu au déclencheur. Pour la première vignette de grille : ne plus assurer `data-index === '1'` (faux dès que le héros n'est pas la photo 1) ; lire son propre `data-index`, assurer qu'il DIFFÈRE de celui du héros, et que le clic ouvre la visionneuse au compteur correspondant à sa propre position. Conserver les deux assertions `srcset` finales (`/\d+w/`) sur l'image du héros et sur celle de la vignette.
- Test `prefers-reduced-motion` : même remplacement du localisateur `[data-gallery-thumb][data-index="0"]` par `.detail-hero [data-gallery-thumb]`. Le reste du test (pin non sticky, état final immédiat, ouverture de la visionneuse) est inchangé.
- Relire le fichier en entier pour vérifier qu'aucun autre test ne présuppose un héros hors du tableau `images` ni un total valant `images.length + 1`.
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website &amp;&amp; for f in 'src/pages/editions/[slug].astro' 'src/pages/en/editions/[slug].astro' 'src/pages/editions/index.astro' 'src/pages/en/editions/index.astro'; do grep -q 'pickHeroIndex' "$f" || exit 1; test "$(grep -c 'edition.leadPhoto' "$f")" = 0 || exit 1; done &amp;&amp; test "$(grep -c 'heroIndex' src/components/EditionDetailBody.astro)" -ge 3 &amp;&amp; test "$(grep -c 'data-index="0"' tests/e2e/edition.spec.ts)" = 0 &amp;&amp; test "$(grep -c 'detail-hero \[data-gallery-thumb\]' tests/e2e/edition.spec.ts)" -ge 2 &amp;&amp; npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run build &amp;&amp; npm run test:e2e -- tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts</automated>
  </verify>
  <!-- planner-discipline-allow: edition.leadPhoto -->
  <!-- planner-discipline-allow: data-index="0" -->
  <!-- planner-discipline-allow: heroIndex -->
  <!-- La porte `heroIndex` ci-dessus est POSITIVE (-ge 3 : déclaration dans Props, déstructuration, transmission à DetailHero) ; seule la porte `data-index="0"` est négative. -->
  <!-- planner-discipline-allow: detail-hero [data-gallery-thumb] -->
  <done>
Les 4 routes dérivent leur couverture de `images` via `pickHeroIndex` ; `EditionDetailBody` transmet `heroIndex` à `DetailHero` ; la grille de détail exclut le héros par son index réel et chaque vignette porte son index réel ; les e2e édition ciblent le héros structurellement et vérifient la concordance aria-label / compteur ; `npm run build` réussit CONTRE LE DATASET PRODUCTION RÉEL (preuve que la migration déjà effectuée est bien absorbée) ; les suites e2e édition et collection sont vertes.
  </done>
</task>

<task type="auto">
  <name>Task 3: Retirer le champ de couverture dédié du type Edition et des projections GROQ</name>
  <files>src/lib/sanity.ts, tests/unit/edition-query.test.ts</files>
  <action>
Après la Task 2, plus aucun consommateur ne lit ce champ — sa suppression laisse donc l'arbre vert.

Dans `src/lib/sanity.ts` :

1. Interface `Edition` : supprimer la ligne du champ de couverture dédié (celle commentée « D-04: dedicated cover photo, not images[0] »).

2. Interface `Edition`, champ `images` : remplacer son commentaire par une formulation calquée sur celle du champ `images` de `Gallery` — conserver le sens actuel (la campagne photo de l'objet imprimé lui-même) ET ajouter la note « la photo 0 est la couverture », en mentionnant que `pickHeroIndex` (src/lib/image-orientation.ts) lui préfère la première photo paysage quand il y en a une.

3. JSDoc au-dessus de `EditionImage` : il décrit aujourd'hui le type comme « la photo de couverture dédiée OU un membre du tableau images » et cite `sanity/schemas/edition.ts` sur ce point. Le réécrire : une photo d'édition est un membre du tableau `images` ; sa forme (`alt`/`rights`) est identique à celle des membres du tableau `images` de `gallery.ts`, d'où l'alias de type.

4. Bloc de commentaire « NOTE: edition has NO `seo` field/group » : il conclut que les métadonnées de page doivent être construites depuis `title`/`statement`/le champ de couverture supprimé. Remplacer la référence à ce champ par `images[0]` (ou, plus exactement, la photo héros retenue par `pickHeroIndex`) — le reste de la note reste vrai et doit être conservé.

5. `EDITIONS_QUERY` et `EDITION_BY_SLUG_QUERY` : retirer le champ de couverture des deux projections. Ne pas toucher aux autres champs projetés ni à leur ordre, ni au filtre `PUBLISHED_EDITION_FILTER`, ni aux fonctions `getEditions`/`getEdition`.

Dans `tests/unit/edition-query.test.ts` :

6. Supprimer le test `it('projects leadPhoto', ...)`.

7. À sa place, ajouter un test négatif calqué sur les tests négatifs déjà présents dans le fichier (`does not reference isVisible`, `does not reference a seo field`) : appeler `getEditions()` avec un mock `[]`, récupérer `fetchMock.mock.calls[0][0] as string` et assurer que la chaîne ne contient plus le nom du champ supprimé. Nommer le test en expliquant POURQUOI (le champ n'existe plus dans le schéma ; la couverture est désormais la position dans `images`).

8. Retirer la propriété du champ supprimé des 4 objets de fixture du fichier (2 dans `getEditions` « returns the array fetch resolves » / « returns a populated relatedGallery intact », 2 dans les cas relatedGallery). Ces fixtures sont comparées par `toEqual` au retour du mock, donc leur nettoyage est mécanique et sans effet sur les assertions. Conserver le champ `images` de chaque fixture tel quel.

9. Conserver intacts les tests ajoutés en Task 1 sur la déréférence des dimensions.
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website &amp;&amp; test "$(grep -c leadPhoto src/lib/sanity.ts)" = 0 &amp;&amp; test "$(grep -c 'leadPhoto:' tests/unit/edition-query.test.ts)" = 0 &amp;&amp; npm run test:unit -- edition-query &amp;&amp; npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run build</automated>
  </verify>
  <!-- planner-discipline-allow: leadPhoto -->
  <!-- planner-discipline-allow: leadPhoto: -->
  <done>
L'interface `Edition` n'expose plus qu'un seul champ photo ; les deux projections GROQ édition ne demandent plus le champ supprimé ; 3 commentaires devenus faux sont corrigés ; le test « projects » correspondant est remplacé par un test négatif idiomatique et les 4 fixtures sont nettoyées ; typecheck, lint, unit et `npm run build` restent verts.
  </done>
</task>

<task type="auto">
  <name>Task 4: Studio — un seul champ photo sur le schéma Édition, et checklist alignée</name>
  <files>sanity/schemas/edition.ts, sanity/editorial/checks.ts, tests/unit/editorial-checks.test.ts, tests/unit/dashboard-logic.test.ts</files>
  <action>
Lire `sanity/schemas/gallery.ts` EN ENTIER d'abord : c'est le motif de référence pour les 3 premiers points.

Dans `sanity/schemas/edition.ts` :

1. Supprimer intégralement le `defineField` du champ photo de couverture dédié (celui titré « Photo principale », placé juste avant le champ `images`), AINSI QUE le bloc de commentaire « D-04 » qui le précède — ce commentaire affirme que la convention « la première photo du tableau est la couverture » est explicitement rejetée pour les éditions ; cette décision est renversée par ce plan, donc le commentaire devenu faux disparaît avec le champ. Ne rien laisser derrière (ni le champ `alt`, ni le champ `rights`, ni les commentaires « Review WR-02 » / « Pitfall B » qui lui étaient propres).

2. Champ `images`, `description` : compléter la chaîne existante pour indiquer que la première photo sert de couverture et que l'ordre se règle par glisser-déposer, en calquant l'esprit de la description du champ `images` de `gallery.ts` — mais SANS reprendre « sur la page d'accueil » : les éditions n'apparaissent jamais sur l'accueil (D-13). Formuler la couverture par rapport à la liste des éditions. Conserver telle quelle la partie propre aux éditions (« couverture, pages intérieures, détail de reliure/impression ») ainsi que la phrase finale existante sur « Ajouter » puis « Sélectionner ».

3. Champ `images`, `validation.custom`, cas tableau vide : compléter le message pour mentionner que la première photo devient la couverture, en calquant le message équivalent de `gallery.ts` mais sans mention de l'accueil. Ne toucher à aucune autre branche de ce validateur (`missingAlt`, `missingRights`, la construction du message final).

4. `preview.select` : la clé `media` doit désormais sélectionner la première photo du tableau, exactement comme `gallery.ts`. La fonction `prepare` et son calcul de statut sont inchangés.

5. Le commentaire « Review WR-01 » au-dessus de la `validation` du membre de tableau renvoie au champ supprimé (« mirror leadPhoto's Pitfall B fix ») — la référence devient pendante. Réécrire ce commentaire en conservant sa justification (une règle `required()` seule peut passer sur un item ayant alt/rights renseignés mais aucun asset réellement téléversé, ex. un envoi interrompu — d'où `assetRequired()`) sans citer le champ supprimé.

6. Ne toucher à RIEN d'autre : ni le membre du tableau `images` (sous-champs `alt`/`rights`, déjà identiques à ceux de gallery), ni les groupes, ni les champs de format (`pageCount`, `printRun`, `dimensions`), ni `relatedGallery`, ni `orderRankField`.

Dans `sanity/editorial/checks.ts`, branche `schemaType === 'edition'` :

7. Supprimer la variable locale qui lit le champ de couverture supprimé, et l'item de checklist « Photo principale avec image, descriptions et droits » qui s'en sert.

8. Ne rien ajouter : les items `images` restants (« Au moins une photo de l'objet » + l'item combiné image/descriptions/droits) couvrent déjà le cas « couverture manquante », qui n'est plus qu'un cas de « aucune photo ». Ne pas restructurer ces items pour imiter le découpage en 4 lignes de la branche `gallery` (voir `<scope_boundaries>` point 4). Ne modifier aucune autre branche du fichier.

Dans `tests/unit/editorial-checks.test.ts` (test « requires a complete edition including assets, rights, and positive format details ») :

9. Retirer la propriété du champ supprimé de la fixture `completeEdition`.

10. Le tableau des cas invalides contient une entrée qui corrompt l'asset du champ supprimé. La remplacer par une entrée équivalente qui corrompt l'asset de la PREMIÈRE photo du tableau `images` (`{...completeEdition, images: [{...completeImage, asset: undefined}]}`), afin de continuer à couvrir le scénario « donnée d'image requise incomplète ». L'entrée voisine qui corrompt `rights` reste distincte et inchangée ; les 3 autres entrées (pageCount, printRun, dimensions) sont inchangées.

11. Ajouter, dans ce même test, une assertion de régression prouvant que la checklist `edition` ne comporte plus AUCUN item dédié à une photo de couverture séparée : parcourir `getDocumentChecks('edition', completeEdition)` et assurer qu'aucun `label` ne commence par le libellé de l'ancien item. Utiliser un `expect(...).toBe(false)` sur un `.some(...)`, pas un grep.

Dans `tests/unit/dashboard-logic.test.ts` :

12. Retirer le bloc de propriété du champ supprimé des 2 fixtures d'édition (tests « orders an unpublished reference target before its dependant » et « blocks a missing strong reference and emits no actions »). Les deux fixtures possèdent déjà un tableau `images` complet (asset + alt bilingue + rights), donc les attentes existantes restent valides : la première doit toujours produire `batch.ready === true`, la seconde toujours `false` pour cause de référence manquante. Ne modifier aucune assertion.
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website &amp;&amp; test "$(grep -c leadPhoto sanity/schemas/edition.ts)" = 0 &amp;&amp; test "$(grep -c leadPhoto sanity/editorial/checks.ts)" = 0 &amp;&amp; test "$(grep -c leadPhoto tests/unit/editorial-checks.test.ts)" = 0 &amp;&amp; test "$(grep -c leadPhoto tests/unit/dashboard-logic.test.ts)" = 0 &amp;&amp; grep -qF "media: 'images.0'" sanity/schemas/edition.ts &amp;&amp; grep -qF 'couverture' sanity/schemas/edition.ts &amp;&amp; npm run test:unit &amp;&amp; npm run lint &amp;&amp; npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</automated>
  </verify>
  <!-- planner-discipline-allow: leadPhoto -->
  <done>
Le schéma Édition n'a plus qu'un champ photo ; sa description et son message de tableau vide annoncent la couverture ; l'aperçu Studio affiche la première photo du tableau ; le commentaire de validation ne cite plus un champ inexistant ; la checklist éditoriale a perdu sa ligne de couverture dédiée sans perdre de couverture fonctionnelle ; les 3 fichiers de tests concernés sont nettoyés et la suite unitaire COMPLÈTE passe ; lint + build du Studio verts.
  </done>
</task>

<task type="auto">
  <name>Task 5: Renommer l'onglet « Accueil » de la fiche Collection photo en « Couleur »</name>
  <files>sanity/schemas/gallery.ts</files>
  <action>
Changement isolé, sans rapport avec le reste du plan — commit séparé.

Dans `sanity/schemas/gallery.ts`, tableau `groups` : le groupe dont la clé est `homepage` porte aujourd'hui le titre `Accueil`. Remplacer CE SEUL titre par `Couleur`.

Contraintes :
- NE PAS renommer la clé `name: 'homepage'`. Les champs `showOnHomePage` et `heroColor` la référencent via `group: 'homepage'` ; changer la clé imposerait de mettre à jour chaque référence sans aucun bénéfice.
- NE PAS déplacer, renommer ni retitrer les champs `showOnHomePage` et `heroColor` : ils restent tous les deux dans ce groupe, inchangés. Seul le libellé français visible de l'onglet change.
- NE PAS toucher `sanity/editorial/workflowLogic.ts`, qui contient une occurrence indépendante du même mot comme libellé du document `homePage` dans le tableau de bord (vérifié : c'est le seul autre emplacement dans `sanity/`).
  </action>
  <verify>
    <automated>cd /Users/florian/Projects/ajs-website &amp;&amp; grep -qF "{name: 'homepage', title: 'Couleur'}" sanity/schemas/gallery.ts &amp;&amp; test "$(grep -c "title: 'Accueil'" sanity/schemas/gallery.ts)" = 0 &amp;&amp; test "$(grep -c "group: 'homepage'" sanity/schemas/gallery.ts)" = 2 &amp;&amp; grep -qF "homePage: 'Accueil'" sanity/editorial/workflowLogic.ts &amp;&amp; npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</automated>
  </verify>
  <!-- planner-discipline-allow: title: 'Accueil' -->
  <!-- planner-discipline-allow: group: 'homepage' -->
  <!-- planner-discipline-allow: name: 'homepage' -->
  <!-- Les portes `group: 'homepage'` (= 2) et `homePage: 'Accueil'` (grep -q) sont POSITIVES : elles prouvent que la clé du groupe et le libellé indépendant du tableau de bord sont restés intacts. Seule `title: 'Accueil'` dans gallery.ts est une porte négative. -->
  <done>
L'onglet `homepage` de la fiche Collection photo s'intitule « Couleur » ; la clé du groupe et les 2 rattachements de champs sont intacts ; l'occurrence indépendante dans `workflowLogic.ts` est prouvée intacte ; lint + build du Studio verts.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Sanity Content Lake → build Astro | Contenu éditorial (non fiable côté forme) lu au build ; une forme inattendue fait planter le build, jamais un utilisateur final |
| Build → artefact statique public | Aucune donnée nouvelle n'est exposée : les mêmes champs image transitent, seule leur provenance change |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-kgh-01 | Denial of Service | `getStaticPaths` des routes édition | high | mitigate | Une édition sans photo ferait lever `builder.image(undefined)` et casserait tout le déploiement. Mitigé côté liste par le filtre « au moins une photo » (Task 2 D, motif de l'accueil) et côté modèle par la validation `rule.custom` du schéma qui exige ≥ 1 photo. `npm run build` contre le dataset production est une porte bloquante en Task 2 et Task 3. |
| T-kgh-02 | Information Disclosure | projection GROQ enrichie `asset->metadata.dimensions` | low | accept | N'expose que la largeur/hauteur/ratio d'images déjà publiques, sur des routes déjà publiques — même exposition que les collections photo depuis quick-260724-oep. |
| T-kgh-03 | Tampering | dépendances npm | low | accept | Aucune installation de paquet dans ce plan ; `package.json` et les deux lockfiles ne sont pas modifiés. |
| T-kgh-04 | Repudiation | données live Sanity | medium | mitigate | Le plan interdit explicitement toute écriture Sanity (`<scope_boundaries>` point 1) ; la migration a déjà été effectuée et vérifiée en amont par l'orchestrateur. Toute commande d'écriture serait une violation de scope. |
</threat_model>

<verification>
Portes finales, toutes vertes avant la fin de l'exécution :

1. `npm run test:unit` — 0 échec (couvre `edition-query`, `gallery-query`, `editorial-checks`, `dashboard-logic`).
2. `npm run typecheck` — 0 erreur (`astro check`). C'est la porte qui prouve que les 2 jumeaux FR/EN de chaque route ont bien reçu la nouvelle prop `heroIndex`.
3. `npm run lint` — propre.
4. `npm --prefix sanity run lint` — propre.
5. `npm --prefix sanity run build` — succès (seule vraie compilation du schéma Studio).
6. `npm run build` — succès CONTRE LE DATASET PRODUCTION RÉEL. Porte la plus importante du plan : elle est censée être ROUGE avant la Task 2 et VERTE après.
7. `npm run test:e2e -- tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts` — 0 échec sur les deux projets Playwright configurés (`chromium`, `webkit-mobile`). Si l'environnement ne permet pas d'installer les navigateurs, le signaler explicitement dans le SUMMARY plutôt que de le passer sous silence.
8. `git diff --stat` ne liste QUE les 13 fichiers de `files_modified`. Toute apparition de `src/components/DetailHero.astro`, `src/components/GalleryDetailBody.astro`, `sanity/editorial/workflowLogic.ts` ou d'un fichier de migration est une violation de scope à annuler.

Confirmation visuelle facultative (non bloquante) : si une session `sanity dev` tourne, ouvrir une fiche Édition et vérifier qu'un seul champ photo apparaît dans l'onglet Photos, puis ouvrir une fiche Collection photo et vérifier que l'onglet s'intitule « Couleur ». Inspection en lecture seule : ne rien saisir, ne rien sauvegarder, ne rien publier.
</verification>

<success_criteria>
- [ ] Une seule source de couverture pour une Édition : la position dans le tableau `images` — plus aucun champ dédié dans le schéma, le type, les requêtes GROQ, les routes, la checklist ou les tests.
- [ ] La projection GROQ des éditions déréfère `asset->metadata.dimensions` via la constante partagée, sinon la préférence paysage serait inerte.
- [ ] Les 4 routes Édition (2 détail + 2 liste, FR + EN) dérivent leur couverture via `pickHeroIndex`, sans divergence de logique entre jumeaux.
- [ ] `EditionDetailBody` transmet `heroIndex` (prop obligatoire) à `DetailHero` : l'aria-label du héros et le compteur de la visionneuse concordent toujours.
- [ ] La grille de détail exclut le héros par son index RÉEL et chaque vignette porte son index réel dans `images`.
- [ ] `DetailHero.astro` et `GalleryDetailBody.astro` sont strictement inchangés ; les props `leadPhotoSrc`/`leadPhotoSrcSet`/`leadPhotoAlt` ne sont pas renommées.
- [ ] Description, message de validation « tableau vide » et `preview.select.media` du schéma Édition alignés sur `gallery.ts`, sans mention de la page d'accueil.
- [ ] Onglet `homepage` de `gallery.ts` intitulé « Couleur », clé `name` et rattachements de champs intacts, `workflowLogic.ts` intact.
- [ ] Les 8 portes de `<verification>` passent, `npm run build` inclus.
- [ ] Aucune écriture Sanity, aucun script de migration produit.
- [ ] Commits sur `codex/studio-publication-workflow` (pas de nouvelle branche), messages scopés `quick-260801-kgh-01`, un commit atomique par task.
</success_criteria>

<output>
Créer `.planning/quick/260801-kgh-unify-edition-cover-photo-with-gallery-p/260801-kgh-SUMMARY.md` en fin d'exécution.
</output>