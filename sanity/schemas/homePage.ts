import {defineField, defineType} from 'sanity'
import {localeTextField} from './lib/localeField'

const defaultIntro = {
  fr: 'Le site présente le travail photographique de Romane Lepont à travers ses différentes séries et éditions.',
  en: "This site showcases Romane Lepont's photographic work through her different series and editions.",
}

export const homePage = defineType({
  name: 'homePage',
  title: "Page d'accueil",
  type: 'document',
  initialValue: {intro: defaultIntro},
  groups: [
    {name: 'content', title: 'Contenu', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    localeTextField({
      name: 'intro',
      title: "Introduction de la page d'accueil",
      group: 'content',
      description:
        "Court texte affiché aux visiteurs dans le panneau coloré de la page d'accueil.",
      rows: 5,
      frError: "L'introduction française est obligatoire.",
      enError: "L'introduction anglaise est obligatoire.",
    }),
    defineField({
      name: 'seo',
      title: "SEO de la page d'accueil",
      type: 'seo',
      group: 'seo',
      description: 'Facultatif : les réglages SEO globaux sont utilisés si ces champs sont vides.',
    }),
  ],
  preview: {
    prepare() {
      return {title: "Page d'accueil", subtitle: 'Introduction et référencement'}
    },
  },
})
