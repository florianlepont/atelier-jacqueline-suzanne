import {defineField, defineType} from 'sanity'
import {localeAltField, localeTextField} from './lib/localeField'

function localizedText(name: string, title: string, rows = 5) {
  return localeTextField({
    name,
    title,
    rows,
    frError: 'Le texte français est obligatoire.',
    enError: 'Le texte anglais est obligatoire.',
  })
}

function editorialImage(name: string, title: string, description: string) {
  return defineField({
    name,
    title,
    type: 'image',
    group: 'content',
    description,
    options: {hotspot: true},
    fields: [localeAltField()],
  })
}

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'Page À propos',
  type: 'document',
  initialValue: {
    biography: {
      fr: 'Le texte de présentation de Romane sera bientôt disponible ici — en attente de sa version définitive.',
      en: "Romane's biography will be available here soon — pending her final text.",
    },
    practice: {
      fr: "Informations sur l'atelier et la pratique de Romane à venir prochainement.",
      en: "Information about Romane's studio and practice is coming soon.",
    },
    medium: {
      fr: "Précisions sur le médium et la technique à venir — en attente de confirmation avec l'artiste.",
      en: 'Details on medium and technique coming soon — pending confirmation with the artist.',
    },
  },
  groups: [
    {name: 'content', title: 'Contenu', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    {...localizedText('biography', 'Biographie'), group: 'content'},
    {...localizedText('practice', 'Atelier & pratique'), group: 'content'},
    {...localizedText('medium', 'Médium & technique', 3), group: 'content'},
    editorialImage(
      'image',
      'Portrait de Romane',
      'Portrait vertical de Romane, affiché dans la colonne étroite.',
    ),
    editorialImage(
      'exhibitionImage',
      "Vue d'exposition",
      "Photo horizontale d'une exposition ou d'une installation du travail de Romane, affichée dans la colonne large.",
    ),
    defineField({name: 'seo', title: 'SEO & partage', type: 'seo', group: 'seo'}),
  ],
  preview: {
    prepare() {
      return {title: 'Page À propos', subtitle: 'Biographie, pratique et technique'}
    },
  },
})
