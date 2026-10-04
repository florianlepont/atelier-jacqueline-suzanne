# Réduire les images stockées dans Sanity

Ce guide explique comment alléger les images du projet Sanity (`gwz8iug4`, dataset `production`) avec le script `npm run sanity:downsize-images`. Il s'adresse à la personne qui maintient le site. Pour la réduction et la signature automatiques des nouvelles images téléversées dans le Studio, voir la dernière section de ce document.

## À quoi ça sert, ce que ça change

- Toute image plus large que **2400 px** est remplacée par une copie de 2400 px de large (le seuil se règle avec `--threshold`, minimum 800).
- **Le site garde le même rendu** : le rapport hauteur/largeur est conservé, donc les recadrages et les points d'intérêt (hotspot) définis dans le Studio restent valides. Seule la largeur change, et les images plus petites ne sont jamais agrandies.
- Seuls les formats **JPEG, PNG et WebP** sont traités. Les SVG et les GIF sont ignorés.
- C'est uniquement une économie de **poids de stockage** (plan gratuit de Sanity).
- La réduction est faite côté serveur par le CDN de Sanity, qui redimensionne à partir de l'original stocké : le fichier original n'est jamais téléchargé. La copie réduite n'a plus de données EXIF (ni position GPS, ni appareil photo) et pas de profil ICC, car Sanity sert du sRGB. Les copies JPEG et WebP sont produites en qualité 90, les PNG restent sans perte.
- Le script **ne supprime rien** tant que vous ne lui demandez pas explicitement (étape 4).

Le script est **en lecture seule par défaut** : sans option, il ne fait que lister ce qu'il ferait.

## Avant de commencer

1. **Faire une sauvegarde complète du dataset**, depuis le dossier `sanity/` :

   ```bash
   cd sanity
   npx sanity login
   npx sanity dataset export production ./sauvegarde-AAAA-MM-JJ.tar.gz
   ```

   Vérifiez que l'archive existe et qu'elle est volumineuse : les images (assets) sont incluses dans l'export. Gardez-la en lieu sûr (elle ne doit pas être ajoutée au dépôt Git).

2. **Vérifier que les originaux en pleine résolution existent bien dans Lightroom.** Si une image est supprimée de Sanity à l'étape 4, la version en pleine résolution ne subsiste que dans Lightroom et dans la sauvegarde.

3. **Créer un jeton Sanity temporaire** (uniquement pour l'étape 2 et suivantes, pas pour le rapport) :
   - sur https://www.sanity.io/manage, projet `gwz8iug4`, onglet « API » puis « Tokens », créez un jeton avec les droits **Éditeur** ;
   - exportez-le dans votre terminal pour la session seulement : `export SANITY_WRITE_TOKEN=...` ;
   - **ne l'écrivez jamais** dans `.env`, dans un fichier du dépôt ni dans un message ;
   - **révoquez-le** sur la même page dès que vous avez terminé.

Le projet et le dataset sont lus dans `SANITY_PROJECT_ID` / `SANITY_DATASET` (fichier `.env` du dépôt, comme pour le build du site), ou passés avec `--project-id gwz8iug4 --dataset production`.

## Étape 1 : le rapport (lecture seule)

```bash
npm run sanity:downsize-images
```

Aucun jeton d'écriture n'est nécessaire et rien n'est modifié. Le script affiche, pour chaque image plus large que le seuil : le nom du fichier, ses dimensions actuelles, les dimensions cibles, son poids et les documents qui l'utilisent (galeries, éditions, page À propos, etc.).

À savoir pour lire le tableau :

- Les **brouillons** ne sont listés que si la variable `SANITY_API_READ_TOKEN` est fournie ; sans elle, seuls les documents publiés apparaissent.
- Une image qui n'est utilisée par **aucun document** est signalée « ignorée par --apply » : elle n'est pas remplacée (mais elle pourra être supprimée à l'étape 4).
- Les images dans un format non géré ou aux dimensions inconnues sont résumées en fin de rapport.

Relisez le rapport : le nombre d'images et les documents concernés doivent vous sembler cohérents.

## Étape 2 : remplacer les images

```bash
npm run sanity:downsize-images -- --apply --i-have-a-backup
```

Sans la sauvegarde confirmée (`--i-have-a-backup`) **et** sans `SANITY_WRITE_TOKEN`, le script refuse de démarrer (code 2) avant tout accès à Sanity.

Pour chaque image trop large, le script, dans cet ordre :

1. demande au CDN la version réduite (largeur = largeur cible) ;
2. vérifie ce qu'il a reçu, avant toute autre action ;
3. téléverse cette copie telle que reçue, avec le même nom de fichier d'origine ;
4. repointe toutes les références (documents publiés **et** brouillons) vers la nouvelle image, en une seule transaction par image, protégée contre les modifications faites entre-temps dans le Studio.

Rien n'est recompressé sur la machine de la personne qui lance le script : il n'y a donc pas de seconde compression. Les vérifications faites avant tout téléversement : réponse HTTP correcte, type de fichier attendu (JPEG, PNG ou WebP, identique à l'original), image lisible en entier, largeur exactement égale à la largeur cible et hauteur à ±1 px de la hauteur cible. Le jeton d'écriture n'est envoyé qu'à l'API de Sanity, jamais au CDN.

- **Rien n'est supprimé** : les anciennes images restent dans la médiathèque.
- Les documents publiés modifiés déclenchent le **rebuild habituel du site** (webhook Sanity). C'est normal.
- Le script peut être **relancé sans risque** : une image déjà remplacée n'est plus référencée par aucun document, elle est donc simplement ignorée, et une image en échec est retentée.
- Si une image échoue, elle est signalée et le script continue avec les suivantes ; le code de sortie est alors 1. Une image qui ne passe pas les vérifications est laissée intacte : rien n'est téléversé, modifié ou supprimé pour elle, la ligne affiche ÉCHEC avec la raison, elle est retentée à la prochaine exécution, et tant qu'elle n'est pas remplacée la suppression de l'étape 4 reste refusée.

## Étape 3 : vérifier le site et le Studio

Attendez la fin du rebuild, puis contrôlez :

- les galeries, les éditions, la page À propos et la page d'accueil (miniatures, recadrages, qualité) ;
- le Studio : les images sont présentes dans chaque document, y compris les brouillons ;
- qu'aucune URL d'image Sanity n'est écrite « en dur » dans le code, ce que le script ne peut pas voir :

  ```bash
  grep -rn "cdn.sanity.io" src public
  ```

Ne passez à l'étape suivante qu'après cette vérification.

## Étape 4 : supprimer les anciennes images (irréversible)

```bash
npm run sanity:downsize-images -- --apply --i-have-a-backup --delete-originals
```

- Juste avant de supprimer, le script recompte les références de chaque ancienne image. **S'il en reste une seule, si un remplacement a échoué ou si un décompte est impossible, aucune suppression n'a lieu** (code 1).
- Cette étape supprime aussi de la médiathèque les images trop larges **qui n'étaient plus utilisées** par aucun document.
- La suppression est **irréversible**, sauf à restaurer la sauvegarde de l'étape « Avant de commencer ».
- Le **CDN** de Sanity peut continuer à servir une image supprimée depuis son cache pendant un court moment : un lien qui fonctionne encore juste après la suppression n'est pas anormal.

Quand vous avez fini, révoquez le jeton temporaire.

## Options et variables d'environnement

| Option / variable | Rôle |
|-------------------|------|
| `--threshold <px>` | Largeur maximale conservée. Entier supérieur ou égal à 800, 2400 par défaut. |
| `--project-id <id>` | Projet Sanity. Par défaut : `SANITY_PROJECT_ID`. |
| `--dataset <nom>` | Dataset Sanity. Par défaut : `SANITY_DATASET`. |
| `--apply` | Remplace réellement les images. Exige `--i-have-a-backup` et `SANITY_WRITE_TOKEN`. |
| `--i-have-a-backup` | Confirme qu'une sauvegarde `sanity dataset export` existe. |
| `--delete-originals` | Avec `--apply` : supprime les anciennes images après vérification. |
| `SANITY_PROJECT_ID`, `SANITY_DATASET` | Valeurs par défaut du projet et du dataset (lues aussi dans `.env`). |
| `SANITY_API_READ_TOKEN` | Optionnel : permet au rapport de voir aussi les brouillons. |
| `SANITY_WRITE_TOKEN` | Jeton temporaire avec droits Éditeur, uniquement pour `--apply`. Jamais affiché par le script. |

Codes de sortie : `0` tout s'est bien passé ; `1` au moins une image ou une suppression a échoué (ou une erreur de connexion) ; `2` erreur d'utilisation (option inconnue, `--apply` sans sauvegarde ou sans jeton, `--delete-originals` sans `--apply`...), détectée avant tout accès à Sanity.

## En cas de problème : restaurer la sauvegarde

Depuis `sanity/`, importez l'archive dans le dataset (cela réécrit les documents et ré-envoie les images) :

```bash
npx sanity dataset import ./sauvegarde-AAAA-MM-JJ.tar.gz production --replace
```

Vérifiez ensuite le site, puis relancez un rebuild si besoin.

## Réduction automatique au téléversement dans le Studio

Le script décrit plus haut ne corrige que les images déjà stockées. Pour empêcher les nouvelles images trop lourdes d'entrer dans Sanity, le Studio réduit et signe automatiquement chaque image **dans le navigateur, avant** son envoi. Cela économise le stockage et la bande passante du plan gratuit, évite de mettre en ligne des fichiers de qualité tirage et retire les métadonnées de position.

### Ce qui se passe à chaque téléversement

- Les images **JPEG, PNG et WebP** sont réduites pour que leur **côté le plus long** ne dépasse pas **2400 px** (jamais agrandies, rapport hauteur/largeur conservé), puis réécrites : qualité 90 % pour JPEG et WebP, PNG sans perte, même format qu'à l'origine.
- Une signature « © Romane Lepont » est dessinée sur l'image : texte blanc à environ 55 % d'opacité avec une ombre discrète, environ 2,2 % du côté le plus long, en bas à droite, avec une marge d'environ 2 %.
- Les **GIF, SVG** et tous les autres formats sont envoyés **sans aucune modification**.
- Cela s'applique à tous les champs image du Studio : bouton « Téléverser », glisser-déposer d'un ou de plusieurs fichiers, collage. Plusieurs photos déposées d'un coup sont traitées l'une après l'autre pour ne pas saturer la mémoire du navigateur.
- Un message en français indique les dimensions et le poids avant et après ; il est regroupé en un seul message quand beaucoup de photos sont déposées. Si une image n'a pas pu être traitée, l'original est envoyé tel quel et un message **orange** le signale : un envoi n'est jamais bloqué ni perdu.

### Pourquoi le côté le plus long, et la différence avec le script

La limite s'applique au **côté le plus long**, pas seulement à la largeur : une photo en portrait doit être plafonnée comme une photo en paysage, car le but est de limiter le poids et la valeur d'un fichier récupéré. Le script hors ligne (`npm run sanity:downsize-images`) ne regarde que la **largeur** : un portrait de 4000×6000 px devient 2400×3600 px avec le script, mais 1600×2400 px dans le Studio. Le site ne demande jamais plus de 2000 px de large, donc un plafond de 2400 px ne dégrade pas un paysage ; un portrait 2:3 plafonné à 2400 px de haut fait 1600 px de large, un peu sous le palier de 2000 px. Si des portraits paraissent mous sur le site, relevez `maxDimension`.

### Métadonnées et couleur

- La réécriture supprime les métadonnées **EXIF et IPTC, position GPS comprise** : c'est un bénéfice voulu pour la vie privée. L'orientation EXIF est appliquée avant la réduction, la photo reste donc à l'endroit.
- Le profil colorimétrique ICC n'est **pas conservé** : l'image est convertie en sRGB, le standard du web (le script hors ligne se comporte de la même façon, car le CDN sert du sRGB sans profil ICC). Exportez depuis Lightroom en sRGB.
- Une image déjà petite n'est laissée **intacte** (EXIF compris) que lorsque la signature est désactivée ; signature activée, toute image JPEG, PNG ou WebP est réécrite.

### Modifier ou désactiver

Tout se règle dans un seul fichier, `sanity/editorial/imageUploadConfig.ts` :

| Réglage | Rôle | Valeur par défaut | Valeurs permises |
|---------|------|-------------------|------------------|
| `enabled` | Interrupteur général : `false` envoie tous les originaux tels quels | `true` | `true` ou `false` |
| `maxDimension` | Côté le plus long maximal, en pixels | `2400` | entier de 800 à 8000 |
| `quality` | Qualité JPEG et WebP (le PNG reste sans perte) | `0.9` | 0,5 à 1 |
| `signature.enabled` | `false` garde la réduction mais retire la signature | `true` | `true` ou `false` |
| `signature.text` | Texte de la signature | `© Romane Lepont` | 1 à 60 caractères |
| `signature.opacity` | Opacité du texte blanc | `0.55` | 0,1 à 1 |
| `signature.sizeRatio` | Taille du texte, en part du côté le plus long | `0.022` | 0,005 à 0,1 |
| `signature.marginRatio` | Marge au bord, en part du côté le plus long | `0.02` | 0 à 0,1 |
| `signature.position` | Coin de la signature | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |

Deux interrupteurs : `signature.enabled: false` (réduction sans signature) et `enabled: false` (aucun traitement). Après une modification, le Studio doit être redéployé : un push sur `main` republie le Studio hébergé via `ci.yml`, ou `npm --prefix sanity run deploy`. Une valeur invalide ne bloque jamais un envoi : l'original est envoyé, avec un message orange.

### Limites

- Cela ne concerne que les envois faits **depuis le Studio**. Les images déjà stockées, les images choisies dans la Médiathèque et les envois par l'API ou par le script hors ligne ne sont pas touchés (le script `npm run sanity:downsize-images` s'occupe des images déjà stockées).
- La signature est un **moyen dissuasif** : elle peut être rognée ou retouchée. La vraie protection est le plafond de taille et les mentions de crédits.
- Réenvoyer une image déjà signée la signe une seconde fois.
- Les fichiers de plus de 100 Mo, et les formats que le navigateur ne sait pas réécrire (Safari ne sait pas écrire du WebP), sont envoyés tels quels avec un message orange.
- Le mécanisme s'appuie sur une API bêta de Sanity (`AssetSource.Uploader`) ; la version de `sanity` est figée à l'identique (6.6.0, sans mise à jour automatique).

### Vérification manuelle après déploiement du Studio

À faire avec `npm run dev` dans `sanity/` (http://localhost:3333) avant de pousser, ou sur le Studio hébergé après le push. Ces cinq vérifications sont les seules à exercer le vrai chemin d'envoi du Studio.

1. Téléverser un grand JPEG en paysage avec le bouton « Téléverser » d'un champ image (À propos ou Image de partage) : l'image stockée fait au plus 2400 px sur son côté le plus long, la signature est visible en bas à droite et lisible sur zones claires et sombres, et un message en français indique les deux tailles.
2. Téléverser une photo de téléphone en portrait avec une orientation EXIF : elle est à l'endroit, plafonnée à 2400 px de haut, un lecteur EXIF sur l'asset téléchargé ne montre ni GPS ni données d'appareil, et les couleurs semblent inchangées.
3. Glisser au moins 10 grandes photos d'un coup dans le champ « Photos » d'une collection (et d'une édition) : chaque photo devient un élément et finit son envoi, l'onglet reste réactif, UN seul message groupé apparaît à la fin, et appuyer sur Annuler pendant un envoi ne laisse aucun élément bloqué.
4. Repli et formats intacts : un GIF et un SVG sont envoyés sans modification et sans erreur ; avec une valeur volontairement invalide dans `imageUploadConfig.ts` (par exemple `quality` à 5), un envoi réussit quand même avec le fichier original et un message orange (puis remettre la valeur).
5. Interrupteurs et navigateurs : `signature.enabled` à `false` réduit sans signer, `enabled` à `false` envoie l'original intact, et la vérification 1 est refaite dans Safari et Firefox avec un PNG et un WebP (Safari doit envoyer le WebP tel quel avec le message orange).

Après toute future mise à jour de la version de `sanity`, refaire ces vérifications, car ce mécanisme repose sur une API bêta du Studio.
