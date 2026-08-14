import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import {localeAltField, localeTextField} from './lib/localeField'

export const edition = defineType({
  name: 'edition',
  title: 'Édition',
  type: 'document',
  // No showOnHomePage/heroColor (D-13) -- Éditions must never appear on the
  // homepage carousel/grid.
  initialValue: {publicationStatus: 'published'},
  groups: [
    {name: 'publication', title: 'Visibilité', default: true},
    {name: 'content', title: 'Présentation'},
    {name: 'relatedCollection', title: 'Collection liée'},
    {name: 'photos', title: 'Photos'},
    // No 'seo' group this phase -- omitted by Claude's Discretion (no
    // requirement calls for it yet); Phase 12 may add SEO once the public
    // route ships.
    {name: 'format', title: 'Détails du format'},
  ],
  fields: [
    // D-07: same three-state editorial workflow as gallery.
    defineField({
      name: 'publicationStatus',
      title: 'Visibilité souhaitée',
      type: 'string',
      group: 'publication',
      description:
        'Ce choix prendra effet lors de la prochaine mise à jour du site depuis le tableau de bord. « En préparation » et « Archivée » gardent l’édition hors ligne.',
      initialValue: 'published',
      options: {
        layout: 'radio',
        list: [
          {title: 'En préparation', value: 'preparation'},
          {title: 'Publiée sur le site', value: 'published'},
          {title: 'Archivée', value: 'archived'},
        ],
      },
      validation: (rule) => rule.required().error("Choisir le statut de l'édition."),
    }),
    // D-08: plain string, NOT a locale-object -- édition titles are shared
    // proper nouns across both locales (e.g. "Rebut"), same rationale as
    // gallery's title field.
    defineField({
      name: 'title',
      title: "Nom de l'édition",
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().error("Le nom de l'édition est obligatoire."),
    }),
    // D-09: slug sourced from title, same "Cliquer sur « Générer »" pattern.
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
    // D-10: bilingual statement, both fr/en required (satisfies CMS-04).
    localeTextField({
      name: 'statement',
      title: 'Texte de présentation',
      group: 'content',
      rows: 5,
      maxLength: 700,
      description: 'Renseigner les deux langues avant de publier.',
    }),
    // EDN-08: optional, unidirectional cross-link to a related Portfolio
    // gallery (e.g. the "Rebut" édition/book and the "Rebut" gallery are the
    // same underlying subject). No validation rule -- most éditions will
    // never set this field.
    defineField({
      name: 'relatedGallery',
      title: 'Collection photo liée (optionnel)',
      type: 'reference',
      group: 'relatedCollection',
      to: [{type: 'gallery'}],
      description:
        'Lien optionnel vers la collection Portfolio qui présente les mêmes photographies, lorsqu\'elle existe. Exemple : l\'édition « Rebut » (le livre imprimé) et la collection photo « Rebut » sont le même sujet — renseigner ce champ affiche un lien vers la collection sur la page de l\'édition. Laisser vide s\'il n\'existe pas de collection correspondante.',
    }),
    // D-05/D-11: photo shoot of the printed object itself (cover, spreads,
    // binding/print detail) -- not a reuse of the gallery's photographic
    // subject matter. Each image carries bilingual alt + rights, exactly as
    // gallery does.
    defineField({
      name: 'images',
      title: "Photos de l'objet imprimé",
      type: 'array',
      group: 'photos',
      description:
        "Photos de l'objet imprimé — couverture, pages intérieures, détail de reliure/impression — avec leurs descriptions, leur ordre et leurs crédits. Glisser-déposer plusieurs images ici. La première photo sert de couverture dans la liste des éditions ; réordonner les photos par glisser-déposer. Pour réutiliser une image existante, choisir « Ajouter » puis « Sélectionner ».",
      // D-01/D-02/CMS-01 (same technique as gallery.ts): `alt` fields are
      // attached directly onto an `image`-type array member (rather than
      // nesting `image` inside a separate `object` wrapper type) so Sanity
      // Studio still recognizes each array item as an image and preserves
      // native multi-file drag-and-drop upload.
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          // Review WR-01: required() alone can pass on an array item that has
          // alt/rights filled in but no actual uploaded asset (e.g. an
          // interrupted upload) -- assetRequired() closes that gap.
          validation: (rule) => rule.required().assetRequired(),
          fields: [
            localeAltField(
              "Décrire brièvement ce que montre l'image pour les personnes qui ne peuvent pas la voir.",
            ),
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
        rule.custom((images) => {
          if (!Array.isArray(images) || images.length === 0) {
            return 'Ajouter au moins une photo. La première servira de couverture.'
          }
          const missingAlt = images.flatMap((image, index) => {
            const alt = (image as {alt?: {fr?: string; en?: string}})?.alt
            return alt?.fr?.trim() && alt?.en?.trim() ? [] : [index + 1]
          })
          const missingRights = images.flatMap((image, index) => {
            const rights = (
              image as {rights?: {credit?: string; copyrightNotice?: string; usage?: string}}
            )?.rights
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
    // D-06/EDN-05: typed, structured format fields -- not free text.
    defineField({
      name: 'pageCount',
      title: 'Nombre de pages',
      type: 'number',
      group: 'format',
      validation: (rule) =>
        rule.required().integer().positive().error('Le nombre de pages est obligatoire.'),
    }),
    defineField({
      name: 'printRun',
      title: 'Tirage',
      type: 'number',
      group: 'format',
      description: "Nombre d'exemplaires imprimés.",
      validation: (rule) => rule.required().integer().positive().error('Le tirage est obligatoire.'),
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'object',
      group: 'format',
      options: {columns: 3},
      fields: [
        defineField({
          name: 'width',
          title: 'Largeur',
          type: 'number',
          validation: (rule) => rule.required().positive().error('La largeur est obligatoire.'),
        }),
        defineField({
          name: 'height',
          title: 'Hauteur',
          type: 'number',
          validation: (rule) => rule.required().positive().error('La hauteur est obligatoire.'),
        }),
        defineField({
          name: 'unit',
          title: 'Unité',
          type: 'string',
          initialValue: 'cm',
          // Review WR-03: constrain to a fixed set so the value stays
          // machine-usable (Phase 12 fetch, future i18n label lookups)
          // instead of arbitrary free text ("CM", "pouces", etc.).
          options: {
            list: [
              {title: 'cm', value: 'cm'},
              {title: 'in', value: 'in'},
            ],
          },
          validation: (rule) => rule.required().error("L'unité est obligatoire."),
        }),
      ],
      // Pitfall B: per-field required() inside a nested object is a
      // documented Sanity Studio validation gap -- add a parent-level
      // rule.custom() so an editor cannot publish with an entirely untouched
      // dimensions object (mirrors the technique gallery.ts's images array
      // validator already applies to a different field).
      validation: (rule) =>
        rule.custom((value) => {
          const d = value as {width?: number; height?: number; unit?: string} | undefined
          if (!d || !d.width || !d.height || !d.unit) {
            return 'Renseigner la largeur, la hauteur et l’unité.'
          }
          return true
        }),
    }),
    // D-12: fractional-index ordering field for Studio drag-reorder.
    // Hidden so Romane never sees the raw field in the edit form.
    {...orderRankField({type: 'edition'}), hidden: true},
  ],
  preview: {
    select: {
      id: '_id',
      title: 'title',
      media: 'images.0',
      publicationStatus: 'publicationStatus',
    },
    prepare({id, title, media, publicationStatus}) {
      const hasUnpublishedDraft = typeof id === 'string' && id.startsWith('drafts.')
      const status =
        publicationStatus === 'archived'
          ? 'Archivée'
          : publicationStatus === 'preparation'
            ? 'En préparation'
            : hasUnpublishedDraft
              ? 'Modifications non publiées'
              : 'Publiée'
      return {
        title: title || 'Édition sans nom',
        subtitle: status,
        media,
      }
    },
  },
})
