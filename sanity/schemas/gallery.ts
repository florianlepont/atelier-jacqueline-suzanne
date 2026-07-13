import {defineArrayMember, defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

/**
 * Locale-aware text pair, copied verbatim from `siteSettings.ts`'s
 * `localeTextField` helper (no shared schema-lib module exists yet to import
 * it from — see 02-PATTERNS.md's guidance to duplicate the shape inline).
 */
function localeTextField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({name: 'fr', title: 'French', type: 'text', rows: 3, validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'English', type: 'text', rows: 3, validation: (rule) => rule.required()}),
    ],
  })
}

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    // D-04: plain string, NOT a locale-object — project titles are shared
    // proper nouns across both locales (e.g. "Rebut").
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    localeTextField('statement', 'Artist Statement'),
    defineField({
      name: 'heroColor',
      title: 'Homepage hero color',
      type: 'string',
      description:
        'Background color of this collection\'s text panel in the homepage carousel. The automatic palette is used when no color is selected.',
      options: {
        layout: 'radio',
        list: [
          {title: 'Pink — #FF3B94', value: 'pink'},
          {title: 'Purple — #AF3DFF', value: 'purple'},
          {title: 'Teal — #55FFE1', value: 'teal'},
          {title: 'Lime — #A6FD29', value: 'lime'},
          {title: 'Plum — #37013A', value: 'plum'},
        ],
      },
    }),
    defineField({
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
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
              title: 'Alt Text',
              type: 'object',
              validation: (rule) => rule.required(),
              fields: [
                defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
                defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
              ],
            }),
          ],
        }),
      ],
      options: {layout: 'grid'},
      validation: (rule) =>
        rule.min(1).error('A gallery needs at least one image (D-09: the first image is the cover).'),
    }),
    // Fractional-index ordering field for Studio drag-reorder (CMS-01/D-10).
    // Hidden per Pitfall 4 so Romane never sees the raw field in the edit form.
    {...orderRankField({type: 'gallery'}), hidden: true},
  ],
  preview: {
    select: {title: 'title', media: 'images.0'},
  },
})
