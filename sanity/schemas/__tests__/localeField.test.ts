import {describe, expect, it} from 'vitest'
import {localeAltField, localeStringField, localeTextField} from '../lib/localeField'

// Minimal Rule double: each method appends to `calls` and returns `this` so
// the real chaining style (`rule.required().max(N).error(msg)`) works
// unchanged. Good enough to observe what a field's `validation` builder
// actually does without pulling in Sanity's real Rule class.
function mockRule() {
  const calls: unknown[] = []
  const rule = {
    calls,
    required() {
      calls.push('required')
      return rule
    },
    max(n: number) {
      calls.push(['max', n])
      return rule
    },
    error(message: string) {
      calls.push(['error', message])
      return rule
    },
  }
  return rule
}

function subField(field: ReturnType<typeof localeStringField>, name: 'fr' | 'en') {
  const match = field.fields?.find((candidate) => candidate.name === name)
  if (!match) throw new Error(`expected a '${name}' sub-field`)
  return match
}

describe('localeStringField', () => {
  it('defaults to a required object with fr/en string sub-fields', () => {
    const field = localeStringField({name: 'label', title: 'Libellé'})
    expect(field.type).toBe('object')
    expect(field.options).toEqual({columns: 2})

    const fr = subField(field, 'fr')
    expect(fr.type).toBe('string')
    expect(fr.title).toBe('Français')
    const rule = mockRule()
    ;(fr.validation as (r: typeof rule) => typeof rule)(rule)
    expect(rule.calls).toEqual(['required', ['error', 'Le texte français est obligatoire.']])
  })

  it('attaches no validation at all when required is false and no maxLength is set', () => {
    const field = localeStringField({name: 'label', title: 'Libellé', required: false})
    expect(subField(field, 'fr').validation).toBeUndefined()
    expect(subField(field, 'en').validation).toBeUndefined()
    expect(field.validation).toBeUndefined()
  })

  it('combines required + maxLength into one default message', () => {
    const field = localeStringField({name: 'label', title: 'Libellé', maxLength: 50})
    const rule = mockRule()
    ;(subField(field, 'en').validation as (r: typeof rule) => typeof rule)(rule)
    expect(rule.calls).toEqual([
      'required',
      ['max', 50],
      ['error', 'Le texte anglais est obligatoire et ne doit pas dépasser 50 caractères.'],
    ])
  })

  it('applies maxLength even when not required', () => {
    const field = localeStringField({name: 'label', title: 'Libellé', required: false, maxLength: 50})
    const rule = mockRule()
    ;(subField(field, 'fr').validation as (r: typeof rule) => typeof rule)(rule)
    expect(rule.calls).toEqual([
      ['max', 50],
      ['error', 'Le texte français ne doit pas dépasser 50 caractères.'],
    ])
  })

  it('prefers custom frError/enError/objectError over the generic default', () => {
    const field = localeStringField({
      name: 'label',
      title: 'Libellé',
      frError: 'Message FR sur mesure.',
      enError: 'Message EN sur mesure.',
      objectError: 'Message objet sur mesure.',
    })
    const objectRule = mockRule()
    ;(field.validation as (r: typeof objectRule) => typeof objectRule)(objectRule)
    expect(objectRule.calls).toEqual(['required', ['error', 'Message objet sur mesure.']])

    const frRule = mockRule()
    ;(subField(field, 'fr').validation as (r: typeof frRule) => typeof frRule)(frRule)
    expect(frRule.calls).toEqual(['required', ['error', 'Message FR sur mesure.']])
  })

  it('passes through group, hidden, and description', () => {
    const field = localeStringField({
      name: 'label',
      title: 'Libellé',
      group: 'content',
      hidden: true,
      description: 'Une description.',
    })
    expect(field.group).toBe('content')
    expect(field.hidden).toBe(true)
    expect(field.description).toBe('Une description.')
  })
})

describe('localeTextField', () => {
  it('defaults to rows: 3 and type: text', () => {
    const field = localeTextField({name: 'body', title: 'Texte'})
    const fr = subField(field, 'fr')
    expect(fr.type).toBe('text')
    expect(fr.rows).toBe(3)
  })

  it('honors a custom rows value', () => {
    const field = localeTextField({name: 'body', title: 'Texte', rows: 5})
    expect(subField(field, 'fr').rows).toBe(5)
    expect(subField(field, 'en').rows).toBe(5)
  })

  it('matches gallery.ts/edition.ts\'s exact original statement message (required + max 700)', () => {
    const field = localeTextField({name: 'statement', title: 'Texte de présentation', rows: 5, maxLength: 700})
    const rule = mockRule()
    ;(subField(field, 'fr').validation as (r: typeof rule) => typeof rule)(rule)
    expect(rule.calls).toEqual([
      'required',
      ['max', 700],
      ['error', 'Le texte français est obligatoire et ne doit pas dépasser 700 caractères.'],
    ])
  })
})

describe('localeAltField', () => {
  it('produces the shared required image-alt-text preset', () => {
    const field = localeAltField('Décrire l’image.')
    expect(field.name).toBe('alt')
    expect(field.description).toBe('Décrire l’image.')

    const objectRule = mockRule()
    ;(field.validation as (r: typeof objectRule) => typeof objectRule)(objectRule)
    expect(objectRule.calls).toEqual(['required', ['error', "La description de l'image est obligatoire."]])

    const frRule = mockRule()
    ;(subField(field, 'fr').validation as (r: typeof frRule) => typeof frRule)(frRule)
    expect(frRule.calls).toEqual(['required', ['error', 'La description française est obligatoire.']])

    const enRule = mockRule()
    ;(subField(field, 'en').validation as (r: typeof enRule) => typeof enRule)(enRule)
    expect(enRule.calls).toEqual(['required', ['error', 'La description anglaise est obligatoire.']])
  })

  it('works with no description at all', () => {
    const field = localeAltField()
    expect(field.description).toBeUndefined()
  })
})
