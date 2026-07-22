---
phase: quick-260722-remove-redundant-sanity-fieldsets
plan: 01
type: execute
files_modified:
  - sanity/schemas/contactPage.ts
  - sanity/schemas/homePage.ts
  - sanity/schemas/aboutPage.ts
  - sanity/schemas/gallery.ts
  - sanity/schemas/siteSettings.ts
requirements:
  - QUICK-260722-REMOVE-REDUNDANT-SANITY-FIELDSETS
---

<objective>
Supprimer dans Sanity les niveaux de titre et de description répétés lorsqu'un fieldset ne contient qu'un seul champ, tout en conservant les explications utiles au niveau du champ éditable.
</objective>

<tasks>
<task type="auto">
  <name>Aplatir les groupes à champ unique</name>
  <files>sanity/schemas/contactPage.ts, sanity/schemas/homePage.ts, sanity/schemas/aboutPage.ts, sanity/schemas/gallery.ts, sanity/schemas/siteSettings.ts</files>
  <action>Retirer les fieldsets à champ unique et leurs références. Conserver les fieldsets qui regroupent réellement plusieurs champs, et déplacer les descriptions contextuelles utiles sur les champs concernés.</action>
  <verify><automated>npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</automated></verify>
</task>
</tasks>
