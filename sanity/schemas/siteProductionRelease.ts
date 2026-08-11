import {defineField, defineType} from 'sanity'

// This fixed-ID document is the internal PRODUCTION release trigger. It is
// created and published only by the Editorial Dashboard's dedicated
// production-release action -- never by the content-publish batch. A Sanity
// Project Webhook filtering on this type is what starts the OVH deploy
// workflow.
export const siteProductionRelease = defineType({
  name: 'siteProductionRelease',
  title: 'Marqueur technique de mise en production',
  type: 'document',
  fields: [
    defineField({
      name: 'buildSequence',
      title: 'Séquence de construction',
      type: 'number',
      readOnly: true,
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'lastTriggeredAt',
      title: 'Dernier déclenchement',
      type: 'datetime',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
})
