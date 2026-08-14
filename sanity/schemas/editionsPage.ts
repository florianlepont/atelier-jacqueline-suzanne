import {defineField, defineType} from 'sanity'
import {localeTextField} from './lib/localeField'

// quick-260801-id4: mirrors homePage.ts's shape (same locale-text-field
// pattern for the intro, same shared `seo` field for search/share
// metadata). The /editions and /en/editions Astro routes still hardcode
// their own seoTitle/seoDescription, so this field is not yet consumed by
// the public site — see src/lib/sanity.ts's EDITIONS_PAGE_QUERY.
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
  groups: [
    {name: 'content', title: 'Contenu', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    localeTextField({
      name: 'intro',
      title: 'Introduction de la page Éditions',
      group: 'content',
      description:
        'Court texte descriptif affiché aux visiteurs sous le titre de la page Éditions.',
      rows: 4,
      frError: "L'introduction française est obligatoire.",
      enError: "L'introduction anglaise est obligatoire.",
    }),
    defineField({
      name: 'seo',
      title: 'SEO de la page Éditions',
      type: 'seo',
      group: 'seo',
      description: 'Facultatif : les réglages SEO globaux sont utilisés si ces champs sont vides.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Page Éditions', subtitle: 'Introduction et référencement'}
    },
  },
})
