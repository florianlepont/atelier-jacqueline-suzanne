---
phase: quick-260811-gdi
plan: 01
type: execute
autonomous: true
requirements: [260811-gdi]
files_modified:
  - sanity/schemas/edition.ts
must_haves:
  truths:
    - "La fiche Édition du Studio présente un onglet « Collection liée » dédié."
    - "Le champ `relatedGallery` conserve son nom, sa référence vers `gallery` et les données existantes."
    - "Les requêtes et le rendu public du lien de collection restent inchangés."
  artifacts:
    - path: "sanity/schemas/edition.ts"
      provides: "Groupe Studio dédié et rattachement de `relatedGallery` à ce groupe"
---

<objective>
Déplacer le champ Studio existant `relatedGallery` depuis l'onglet Présentation vers un onglet « Collection liée ».

Purpose: rendre le lien vers une collection Portfolio plus facile à retrouver dans la fiche d'une édition, sans migration ni changement du site public.
Output: un seul changement de schéma, validé par la compilation du Studio.
</objective>

<scope_boundaries>
- Ne pas renommer `relatedGallery` ni modifier son type, sa cible de référence ou sa description.
- Ne modifier ni les requêtes Sanity, ni les routes Astro, ni les données du Content Lake.
- Ne pas déployer ni committer.
</scope_boundaries>

<tasks>
<task type="auto">
  <name>Créer l'onglet Collection liée et y déplacer le champ existant</name>
  <files>sanity/schemas/edition.ts</files>
  <action>
Ajouter un groupe Studio `relatedCollection` titré « Collection liée », puis affecter ce groupe au champ existant `relatedGallery`. Conserver toutes les autres propriétés du champ intactes.
  </action>
  <verify>
    <automated>npm --prefix sanity run build</automated>
  </verify>
</task>
</tasks>
