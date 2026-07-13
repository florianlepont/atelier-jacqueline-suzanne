# Guide d’édition — Atelier Jacqueline Suzanne

Ce Studio permet de gérer les collections, leurs photos et les textes communs du site sans modifier le code.

Le **Tableau de bord** résume les brouillons, les contenus à vérifier et l’état du dernier déploiement. Cliquer sur une ligne ouvre directement le document concerné.

## Première connexion

Dans le menu utilisateur en haut à droite, choisir **Français** comme langue d’interface. Ce choix est ensuite mémorisé par Sanity.

## Modifier une collection

1. Ouvrir **Collections photo**, puis choisir une collection.
2. Utiliser les onglets **Présentation**, **Page d’accueil** et **Photos**.
3. Renseigner les textes français et anglais.
4. Dans **Photos**, glisser-déposer les images et les réordonner. La première image est la couverture.
5. Ajouter une courte description française et anglaise à chaque image.
6. Cliquer sur **Publier**. Une modification enregistrée mais non publiée reste un brouillon invisible sur le site.

L’onglet **Checklist** indique ce qui est obligatoire et ce qui est simplement recommandé. Les badges « À compléter », « SEO à compléter », « Prêt » et « Masquée » rendent l’état du document visible immédiatement.

L’onglet **Aperçu du brouillon** montre le contenu avant publication. L’onglet **Site publié** affiche le véritable site en version ordinateur ou mobile et indique si sa mise à jour est terminée.

Pour une nouvelle collection, saisir d’abord son nom puis cliquer sur **Générer** sous « Adresse de la page ».

## Modifier les textes communs

Ouvrir **Page d’accueil** pour modifier son introduction et son référencement.

Ouvrir **Réglages du site** pour changer le nom du site, les libellés du menu, le copyright et le référencement utilisé par défaut.

La rubrique **Page À propos** permet de modifier la biographie, la présentation de la pratique et les informations de technique. L’onglet **Aperçu** montre le brouillon courant en français ou en anglais avant sa publication.

## Masquer temporairement une collection

Dans l’onglet **Page d’accueil** d’une collection, désactiver « Afficher cette collection sur le site ». La collection et ses photos restent dans Sanity mais sa page publique ne sera plus générée au prochain déploiement.

## Référencement

Les onglets **SEO & partage** permettent de personnaliser le titre Google, sa description et l’image affichée sur les réseaux sociaux. Ces champs sont facultatifs : le site utilise automatiquement le titre, le texte de présentation et la couverture lorsqu’ils sont vides.

L’aperçu Google affiche le nombre de caractères. L’option « Masquer cette page dans Google » doit rester désactivée sauf besoin précis. Le site génère automatiquement les URL canoniques, les alternatives FR/EN, le sitemap, le fichier robots et les données structurées.

## Crédits et droits des photographies

Chaque photo possède une rubrique **Crédits et droits**. Le crédit « Romane Lepont » et la mention « Tous droits réservés » sont préremplis. Ils peuvent être adaptés image par image, notamment pour une licence particulière ou une utilisation éditoriale. Le crédit est affiché dans la visionneuse lorsque l’option correspondante est activée.

## Agenda / Expositions

Cette rubrique peut déjà accueillir les expositions et événements à venir. Ces données sont préparées dans Sanity mais ne sont pas encore affichées sur le site public.

## Ordre des collections

Dans **Collections photo**, déplacer les lignes par glisser-déposer. Cet ordre est repris sur la page d’accueil.

## Mise en ligne

La publication dans Sanity met le contenu à disposition du site. Le site étant généré statiquement, sa mise à jour visible intervient après le prochain déploiement automatique déclenché par le webhook Sanity/GitHub.

## Développement local

```bash
npm install
npm run dev
```

Le Studio est généralement disponible sur `http://localhost:3333`.

Pour changer le site affiché dans l’onglet **Site publié**, copier `.env.example` vers `.env.local` et adapter `SANITY_STUDIO_PREVIEW_URL` avant de construire ou déployer le Studio.
