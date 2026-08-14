import {defineField} from 'sanity'

export interface LocaleFieldOptions {
  name: string
  title: string
  required?: boolean
  maxLength?: number
  group?: string
  hidden?: boolean
  description?: string
  objectError?: string
  frError?: string
  enError?: string
}

export interface LocaleTextFieldOptions extends LocaleFieldOptions {
  rows?: number
}

// Default error copy for fields that don't need bespoke wording. Matches
// gallery.ts/edition.ts's original `localeTextField` message exactly when
// both required and maxLength are set, so migrating those two (the only
// byte-identical duplicates among the half-dozen local copies this helper
// replaces) needed no per-field override at all.
function defaultLocaleError(
  lang: 'français' | 'anglais',
  required: boolean,
  maxLength: number | undefined,
): string | undefined {
  if (required && maxLength !== undefined) {
    return `Le texte ${lang} est obligatoire et ne doit pas dépasser ${maxLength} caractères.`
  }
  if (required) return `Le texte ${lang} est obligatoire.`
  if (maxLength !== undefined) return `Le texte ${lang} ne doit pas dépasser ${maxLength} caractères.`
  return undefined
}

/** Locale-aware single-line string pair: one `object` field with `fr`/`en` string sub-fields. */
export function localeStringField({
  name,
  title,
  required = true,
  maxLength,
  group,
  hidden,
  description,
  objectError,
  frError,
  enError,
}: LocaleFieldOptions) {
  return defineField({
    name,
    title,
    type: 'object',
    group,
    hidden,
    description,
    options: {columns: 2},
    validation: objectError ? (rule) => rule.required().error(objectError) : undefined,
    fields: [
      defineField({
        name: 'fr',
        title: 'Français',
        type: 'string',
        validation:
          required || maxLength !== undefined
            ? (rule) => {
                let next = rule
                if (required) next = next.required()
                if (maxLength !== undefined) next = next.max(maxLength)
                const message = frError ?? defaultLocaleError('français', required, maxLength)
                return message ? next.error(message) : next
              }
            : undefined,
      }),
      defineField({
        name: 'en',
        title: 'Anglais',
        type: 'string',
        validation:
          required || maxLength !== undefined
            ? (rule) => {
                let next = rule
                if (required) next = next.required()
                if (maxLength !== undefined) next = next.max(maxLength)
                const message = enError ?? defaultLocaleError('anglais', required, maxLength)
                return message ? next.error(message) : next
              }
            : undefined,
      }),
    ],
  })
}

/** Locale-aware multi-line text pair: one `object` field with `fr`/`en` text sub-fields. */
export function localeTextField({
  name,
  title,
  required = true,
  maxLength,
  rows = 3,
  group,
  hidden,
  description,
  objectError,
  frError,
  enError,
}: LocaleTextFieldOptions) {
  return defineField({
    name,
    title,
    type: 'object',
    group,
    hidden,
    description,
    options: {columns: 2},
    validation: objectError ? (rule) => rule.required().error(objectError) : undefined,
    fields: [
      defineField({
        name: 'fr',
        title: 'Français',
        type: 'text',
        rows,
        validation:
          required || maxLength !== undefined
            ? (rule) => {
                let next = rule
                if (required) next = next.required()
                if (maxLength !== undefined) next = next.max(maxLength)
                const message = frError ?? defaultLocaleError('français', required, maxLength)
                return message ? next.error(message) : next
              }
            : undefined,
      }),
      defineField({
        name: 'en',
        title: 'Anglais',
        type: 'text',
        rows,
        validation:
          required || maxLength !== undefined
            ? (rule) => {
                let next = rule
                if (required) next = next.required()
                if (maxLength !== undefined) next = next.max(maxLength)
                const message = enError ?? defaultLocaleError('anglais', required, maxLength)
                return message ? next.error(message) : next
              }
            : undefined,
      }),
    ],
  })
}

// The required image-alt-text pair repeated verbatim in gallery.ts,
// edition.ts, and aboutPage.ts (accessibility description, one per locale).
export function localeAltField(description?: string) {
  return localeStringField({
    name: 'alt',
    title: "Description de l'image (accessibilité)",
    description,
    objectError: "La description de l'image est obligatoire.",
    frError: 'La description française est obligatoire.',
    enError: 'La description anglaise est obligatoire.',
  })
}
