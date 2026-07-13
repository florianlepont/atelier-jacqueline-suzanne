# Guide d’édition — Atelier Jacqueline Suzanne

Ce Studio permet de gérer les collections, leurs photos et les textes communs du site sans modifier le code.

## Première connexion

Dans le menu utilisateur en haut à droite, choisir **Français** comme langue d’interface. Ce choix est ensuite mémorisé par Sanity.

## Modifier une collection

1. Ouvrir **Collections**, puis choisir une collection.
2. Utiliser les onglets **Présentation**, **Page d’accueil** et **Photos**.
3. Renseigner les textes français et anglais.
4. Dans **Photos**, glisser-déposer les images et les réordonner. La première image est la couverture.
5. Ajouter une courte description française et anglaise à chaque image.
6. Cliquer sur **Publier**. Une modification enregistrée mais non publiée reste un brouillon invisible sur le site.

Pour une nouvelle collection, saisir d’abord son nom puis cliquer sur **Générer** sous « Adresse de la page ».

## Modifier les textes communs

Ouvrir **Réglages du site** pour changer les libellés du menu, l’introduction de la page d’accueil, le copyright ou le compte Instagram.

## Ordre des collections

Dans **Collections**, déplacer les lignes par glisser-déposer. Cet ordre est repris sur la page d’accueil.

## Mise en ligne

La publication dans Sanity met le contenu à disposition du site. Le site étant généré statiquement, sa mise à jour visible intervient après le prochain déploiement automatique déclenché par le webhook Sanity/GitHub.

## Développement local

```bash
npm install
npm run dev
```

Le Studio est généralement disponible sur `http://localhost:3333`.
