import {defineField, defineType} from 'sanity'

// quick-260728-el6: mirrors homePage.ts's intro-only shape EXACTLY (same
// locale-text-field pattern), minus the seo field/group — Florian only
// asked for the intro text on the Éditions overview; the route files keep
// hardcoding their own seoTitle/seoDescription (out of scope here).
//
// This copy MUST stay byte-identical to DEFAULT_EDITIONS_INTRO in
// src/lib/site-config.ts so Studio and the code fallback read the same
// placeholder text until Romane edits it. It is deliberately EDN-06-clean
// (no commerce-affordance wording).
const defaultIntro = {
  fr: 'Les Éditions sont les objets imprimés — zines, livrets, tirages en petite série — qui prolongent le travail photographique de Romane Lepont sous une autre forme.',
  en: "Éditions are the printed objects — zines, booklets, small-run prints — that extend Romane Lepont's photographic work into another form.",
}

export const editionsPage = defineType({
  name: 'editionsPage',
  title: 'Page Éditions',
  type: 'document',
  initialValue: {intro: defaultIntro},
  groups: [{name: 'content', title: 'Contenu', default: true}],
  fields: [
    defineField({
      name: 'intro',
      title: 'Introduction de la page Éditions',
      type: 'object',
      group: 'content',
      description:
        'Court texte descriptif affiché aux visiteurs sous le titre de la page Éditions.',
      options: {columns: 2},
      fields: [
        defineField({
          name: 'fr',
          title: 'Français',
          type: 'text',
          rows: 4,
          validation: (rule) => rule.required().error("L'introduction française est obligatoire."),
        }),
        defineField({
          name: 'en',
          title: 'Anglais',
          type: 'text',
          rows: 4,
          validation: (rule) => rule.required().error("L'introduction anglaise est obligatoire."),
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Page Éditions', subtitle: 'Introduction'}
    },
  },
})
