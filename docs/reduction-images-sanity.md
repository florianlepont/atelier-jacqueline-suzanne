# Réduire les images stockées dans Sanity

Ce guide explique comment alléger les images du projet Sanity (`gwz8iug4`, dataset `production`) avec le script `npm run sanity:downsize-images`. Il s'adresse à la personne qui maintient le site.

## À quoi ça sert, ce que ça change

- Toute image plus large que **2400 px** est remplacée par une copie de 2400 px de large (le seuil se règle avec `--threshold`, minimum 800).
- **Le site garde le même rendu** : le rapport hauteur/largeur est conservé, donc les recadrages et les points d'intérêt (hotspot) définis dans le Studio restent valides. Seule la largeur change, et les images plus petites ne sont jamais agrandies.
- Seuls les formats **JPEG, PNG et WebP** sont traités. Les SVG et les GIF sont ignorés.
- C'est uniquement une économie de **poids de stockage** (plan gratuit de Sanity). Les copies réduites n'ont plus les données EXIF (position GPS, appareil photo) ; le profil colorimétrique ICC est conservé.
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

Pour chaque image trop large, le script télécharge l'original, le réduit, téléverse la copie (avec le même nom de fichier d'origine), puis repointe toutes les références (documents publiés **et** brouillons) vers la nouvelle image, en une seule transaction par image, protégée contre les modifications faites entre-temps dans le Studio.

- **Rien n'est supprimé** : les anciennes images restent dans la médiathèque.
- Les documents publiés modifiés déclenchent le **rebuild habituel du site** (webhook Sanity). C'est normal.
- Le script peut être **relancé sans risque** : une image déjà remplacée n'est plus référencée par aucun document, elle est donc simplement ignorée, et une image en échec est retentée.
- Si une image échoue, elle est signalée et le script continue avec les suivantes ; le code de sortie est alors 1.

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
