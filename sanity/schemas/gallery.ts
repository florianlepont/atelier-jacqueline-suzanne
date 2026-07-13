import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {HERO_COLOR_OPTIONS, HeroColorInput} from './HeroColorInput'

// Sanity list previews intentionally expose only selected array positions,
// not a complete array. Selecting lightweight `_key` values keeps the
// collection list fast while still allowing an accurate photo count.
const PREVIEW_IMAGE_LIMIT = 100
const previewImageKeys = Object.fromEntries(
  Array.from({length: PREVIEW_IMAGE_LIMIT}, (_, index) => [
    `imageKey${index}`,
    `images.${index}._key`,
  ]),
)

/**
 * Locale-aware text pair, copied verbatim from `siteSettings.ts`'s
 * `localeTextField` helper (no shared schema-lib module exists yet to import
 * it from — see 02-PATTERNS.md's guidance to duplicate the shape inline).
 */
function localeTextField(name: string, title: string, group?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    group,
    description: 'Renseigner les deux langues avant de publier.',
    options: {columns: 2},
    fields: [
      defineField({
        name: 'fr',
        title: 'Français',
        type: 'text',
        rows: 5,
        validation: (rule) => rule.required().error('Le texte français est obligatoire.'),
      }),
      defineField({
        name: 'en',
        title: 'Anglais',
        type: 'text',
        rows: 5,
        validation: (rule) => rule.required().error('Le texte anglais est obligatoire.'),
      }),
    ],
  })
}

export const gallery = defineType({
  name: 'gallery',
  title: 'Collection photo',
  type: 'document',
  initialValue: {isVisible: true},
  groups: [
    {name: 'content', title: 'Présentation', default: true},
    {name: 'homepage', title: "Page d'accueil"},
    {name: 'photos', title: 'Photos'},
    {name: 'seo', title: 'SEO & partage'},
  ],
  fieldsets: [
    {
      name: 'publication',
      title: 'Publication',
      description: 'Contrôle si cette collection est accessible aux visiteurs.',
      options: {collapsible: false},
    },
  ],
  fields: [
    defineField({
      name: 'isVisible',
      title: 'Afficher cette collection sur le site',
      type: 'boolean',
      group: 'content',
      fieldset: 'publication',
      description:
        "Désactiver pour conserver la collection dans Sanity sans l'afficher sur la page d'accueil ni créer sa page publique.",
      initialValue: true,
    }),
    // D-04: plain string, NOT a locale-object — project titles are shared
    // proper nouns across both locales (e.g. "Rebut").
    defineField({
      name: 'title',
      title: 'Nom de la collection',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().error('Le nom de la collection est obligatoire.'),
    }),
    defineField({
      name: 'slug',
      title: 'Adresse de la page',
      type: 'slug',
      group: 'content',
      description:
        'Cliquer sur « Générer » après avoir saisi le nom. À modifier uniquement avant la première publication.',
      options: {source: 'title'},
      validation: (rule) => rule.required().error("L'adresse de la page est obligatoire."),
    }),
    localeTextField('statement', 'Texte de présentation', 'content'),
    defineField({
      name: 'heroColor',
      title: "Couleur sur la page d'accueil",
      type: 'string',
      group: 'homepage',
      description:
        'Choisir le fond du panneau associé à cette collection, ou conserver la palette automatique.',
      options: {
        list: HERO_COLOR_OPTIONS.map(({title, value}) => ({title, value})),
      },
      components: {input: HeroColorInput},
    }),
    defineField({
      name: 'images',
      title: 'Photos de la collection',
      type: 'array',
      group: 'photos',
      description:
        "Glisser-déposer plusieurs images ici. La première photo sert de couverture sur la page d'accueil ; réordonner les photos par glisser-déposer.",
      // D-01/D-02/CMS-01: `alt` fields are attached directly onto an `image`-
      // type array member (rather than nesting `image` inside a separate
      // `object` wrapper type) so Sanity Studio still recognizes each array
      // item as an image and preserves native multi-file drag-and-drop
      // upload — one dropped file becomes one array item automatically.
      // Nesting `image` inside a custom object type breaks that heuristic.
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: "Description de l'image (accessibilité)",
              type: 'object',
              description:
                "Décrire brièvement ce que montre l'image pour les personnes qui ne peuvent pas la voir.",
              options: {columns: 2},
              validation: (rule) =>
                rule.required().error("La description de l'image est obligatoire."),
              fields: [
                defineField({
                  name: 'fr',
                  title: 'Français',
                  type: 'string',
                  validation: (rule) =>
                    rule.required().error('La description française est obligatoire.'),
                }),
                defineField({
                  name: 'en',
                  title: 'Anglais',
                  type: 'string',
                  validation: (rule) =>
                    rule.required().error('La description anglaise est obligatoire.'),
                }),
              ],
            }),
            defineField({
              name: 'rights',
              title: 'Crédits et droits',
              type: 'imageRights',
              description:
                'Ces informations permettent de tracer les droits et, si souhaité, d’afficher le crédit dans la visionneuse.',
              initialValue: {
                credit: 'Romane Lepont',
                copyrightNotice: '© Romane Lepont — Tous droits réservés',
                usage: 'allRightsReserved',
                displayCredit: true,
              },
              validation: (rule) => rule.required().error('Ajouter les crédits et les droits.'),
            }),
          ],
        }),
      ],
      options: {layout: 'grid'},
      validation: (rule) =>
        rule.min(1).error('Ajouter au moins une photo. La première servira de couverture.'),
    }),
    // Fractional-index ordering field for Studio drag-reorder (CMS-01/D-10).
    // Hidden per Pitfall 4 so Romane never sees the raw field in the edit form.
    {...orderRankField({type: 'gallery'}), hidden: true},
    defineField({name: 'seo', title: 'SEO & partage', type: 'seo', group: 'seo'}),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'images.0',
      heroColor: 'heroColor',
      isVisible: 'isVisible',
      ...previewImageKeys,
    },
    prepare({title, media, heroColor, isVisible, ...imageKeys}) {
      const count = Object.values(imageKeys).filter(Boolean).length
      const color = HERO_COLOR_OPTIONS.find((option) => option.value === heroColor)?.title
      const photoLabel = `${count}${count === PREVIEW_IMAGE_LIMIT ? '+' : ''} photo${count > 1 ? 's' : ''}`
      return {
        title: title || 'Collection sans nom',
        subtitle: `${isVisible === false ? 'Masquée · ' : ''}${photoLabel} · ${color || 'Palette automatique'}`,
        media,
      }
    },
  },
})
