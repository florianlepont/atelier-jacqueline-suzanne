import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {frFRLocale} from '@sanity/locale-fr-fr'
import {schemaTypes} from './schemas'
import {defaultDocumentNode, structure} from './schemas/structure'

export default defineConfig({
  name: 'default',
  title: 'Atelier Jacqueline Suzanne',

  projectId: 'gwz8iug4',
  dataset: 'production',

  // French UI for the day-to-day editor. The developer-only Vision query
  // tool is deliberately omitted from the main navigation.
  plugins: [structureTool({structure, defaultDocumentNode}), frFRLocale({title: 'Français'})],

  schema: {
    types: schemaTypes,
  },

  document: {
    // WR-01: structure.ts only hides siteSettings from the desk sidebar —
    // Studio's global "Create new document" / omnisearch command palette
    // lists all registered schema types regardless of desk filtering, and
    // nothing else stops an editor from spawning a second siteSettings
    // document (or duplicating the existing one) via those affordances.
    // A second document would make `*[_type == "siteSettings"][0]` in
    // src/lib/sanity.ts non-deterministic, silently breaking Romane's edits.
    actions: (prev, context) =>
      ['siteSettings', 'aboutPage'].includes(context.schemaType)
        ? prev.filter((action) => !['duplicate'].includes(action.action ?? ''))
        : prev,
    newDocumentOptions: (prev, context) =>
      context.creationContext.type === 'global'
        ? prev.filter(
            (template) => !['siteSettings', 'aboutPage'].includes(template.templateId),
          )
        : prev,
  },
})
