import {defineField, defineType} from 'sanity'

const defaultIntro = {
  fr: "Le site présente le travail photographique de Romane Lepont et permet l'achat d'une œuvre directement en ligne.",
  en: "This site showcases Romane Lepont's photographic work and lets you buy a piece directly online.",
}

export const homePage = defineType({
  name: 'homePage',
  title: "Page d'accueil",
  type: 'document',
  initialValue: {intro: defaultIntro},
  groups: [
    {name: 'content', title: 'Contenu', default: true},
    {name: 'seo', title: 'SEO & partage'},
  ],
  fieldsets: [
    {
      name: 'content',
      title: 'Contenu',
      group: 'content',
      description: 'Le texte affiché aux visiteurs dès leur arrivée sur le site.',
    },
    {
      name: 'seo',
      title: 'SEO & partage',
      group: 'seo',
      description:
        "Comment cette page apparaît dans les résultats Google et lors d'un partage sur les réseaux sociaux.",
    },
  ],
  fields: [
    defineField({
      name: 'intro',
      title: "Introduction de la page d'accueil",
      type: 'object',
      group: 'content',
      fieldset: 'content',
      description: "Court texte affiché dans le panneau coloré de la page d'accueil.",
      options: {columns: 2},
      fields: [
        defineField({
          name: 'fr',
          title: 'Français',
          type: 'text',
          rows: 5,
          validation: (rule) => rule.required().error("L'introduction française est obligatoire."),
        }),
        defineField({
          name: 'en',
          title: 'Anglais',
          type: 'text',
          rows: 5,
          validation: (rule) => rule.required().error("L'introduction anglaise est obligatoire."),
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: "SEO de la page d'accueil",
      type: 'seo',
      group: 'seo',
      fieldset: 'seo',
      description: 'Facultatif : les réglages SEO globaux sont utilisés si ces champs sont vides.',
    }),
  ],
  preview: {
    prepare() {
      return {title: "Page d'accueil", subtitle: 'Introduction et référencement'}
    },
  },
})
