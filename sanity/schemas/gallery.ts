import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {HERO_COLOR_OPTIONS, HeroColorInput} from './HeroColorInput'
import {GalleryImagesInput} from './GalleryImagesInput'
import {PublishedPageLinks} from './PublishedPageLinks'

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
  initialValue: {publicationStatus: 'published'},
  groups: [
    {name: 'publication', title: 'Publication', default: true},
    {name: 'content', title: 'Présentation'},
    {name: 'homepage', title: "Page d'accueil"},
    {name: 'photos', title: 'Photos'},
    {name: 'seo', title: 'SEO & partage'},
  ],
  fields: [
    defineField({
      name: 'publicationStatus',
      title: 'Statut de la collection',
      type: 'string',
      group: 'publication',
      description:
        '« En préparation » reste dans Sanity, « Publiée » apparaît sur le site, « Archivée » est conservée mais retirée du site.',
      initialValue: 'published',
      options: {
        layout: 'radio',
        list: [
          {title: 'En préparation', value: 'preparation'},
          {title: 'Publiée sur le site', value: 'published'},
          {title: 'Archivée', value: 'archived'},
        ],
      },
      validation: (rule) => rule.required().error('Choisir le statut de la collection.'),
    }),
    defineField({
      name: 'publishedPageLinks',
      title: 'Page publiée',
      type: 'string',
      group: 'publication',
      readOnly: true,
      components: {input: PublishedPageLinks},
    }),
    defineField({
      name: 'isVisible',
      title: 'Ancienne visibilité',
      type: 'boolean',
      hidden: true,
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
      components: {input: GalleryImagesInput},
      validation: (rule) =>
        rule.custom((images) => {
          if (!Array.isArray(images) || images.length === 0) {
            return 'Ajouter au moins une photo. La première servira de couverture.'
          }
          const missingAlt = images.flatMap((image, index) => {
            const alt = image?.alt
            return alt?.fr?.trim() && alt?.en?.trim() ? [] : [index + 1]
          })
          const missingRights = images.flatMap((image, index) => {
            const rights = image?.rights
            return rights?.credit?.trim() &&
              rights?.copyrightNotice?.trim() &&
              rights?.usage?.trim()
              ? []
              : [index + 1]
          })
          const messages = [
            missingAlt.length
              ? `description manquante sur ${missingAlt.map((index) => `la photo ${index}`).join(', ')}`
              : '',
            missingRights.length
              ? `crédits incomplets sur ${missingRights.map((index) => `la photo ${index}`).join(', ')}`
              : '',
          ].filter(Boolean)
          return messages.length ? `À corriger : ${messages.join(' ; ')}.` : true
        }),
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
      publicationStatus: 'publicationStatus',
      isVisible: 'isVisible',
      ...previewImageKeys,
    },
    prepare({title, media, heroColor, publicationStatus, isVisible, ...imageKeys}) {
      const count = Object.values(imageKeys).filter(Boolean).length
      const color = HERO_COLOR_OPTIONS.find((option) => option.value === heroColor)?.title
      const photoLabel = `${count}${count === PREVIEW_IMAGE_LIMIT ? '+' : ''} photo${count > 1 ? 's' : ''}`
      const status =
        publicationStatus === 'archived'
          ? 'Archivée'
          : publicationStatus === 'preparation' || (!publicationStatus && isVisible === false)
            ? 'En préparation'
            : 'Publiée'
      return {
        title: title || 'Collection sans nom',
        subtitle: `${status} · ${photoLabel} · ${color || 'Palette automatique'}`,
        media,
      }
    },
  },
})
