import {describe, expect, it} from 'vitest'
import {siteSettings} from '../siteSettings'

// Recording Rule double: every method appends to `calls` and returns the rule
// so the real chaining style works. `custom` stores the validator so the test
// can run it directly.
function mockRule() {
  const calls: unknown[] = []
  const customs: Array<(value: unknown) => true | string> = []
  const rule = {
    calls,
    customs,
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
    custom(validator: (value: unknown) => true | string) {
      calls.push('custom')
      customs.push(validator)
      return rule
    },
  }
  return rule
}

const fields = (siteSettings as unknown as {fields: Array<Record<string, unknown>>}).fields
const groups = (siteSettings as unknown as {groups: Array<{name: string; title: string}>}).groups
const publisherAddress = fields.find((field) => field.name === 'publisherAddress')

describe('siteSettings.publisherAddress', () => {
  it('is a plain text field of 3 rows in the legal group', () => {
    expect(publisherAddress).toBeDefined()
    expect(publisherAddress?.type).toBe('text')
    expect(publisherAddress?.rows).toBe(3)
    expect(publisherAddress?.group).toBe('legal')
    expect(groups.find((group) => group.name === 'legal')?.title).toBe('Mentions légales')
  })

  it('is not localized and has no default value', () => {
    expect(publisherAddress?.type).not.toBe('object')
    expect(publisherAddress?.fields).toBeUndefined()
    expect(publisherAddress?.initialValue).toBeUndefined()
  })

  it('is optional, capped at 300 characters', () => {
    const rule = mockRule()
    ;(publisherAddress?.validation as (r: typeof rule) => unknown)(rule)
    expect(rule.calls).not.toContain('required')
    expect(rule.calls).toContainEqual(['max', 300])
  })

  it('rejects angle brackets and accepts empty or plain values', () => {
    const rule = mockRule()
    ;(publisherAddress?.validation as (r: typeof rule) => unknown)(rule)
    const custom = rule.customs[0]
    expect(custom(undefined)).toBe(true)
    expect(custom('')).toBe(true)
    expect(custom('TEST-ADDRESS-FIXTURE')).toBe(true)
    for (const bad of ['TEST-ADDRESS-FIXTURE <b>', 'TEST-ADDRESS-FIXTURE >']) {
      const result = custom(bad)
      expect(typeof result).toBe('string')
      expect((result as string).length).toBeGreaterThan(0)
    }
  })

  it('keeps the legal rule and the maintainer warning in the French description', () => {
    const description = String(publisherAddress?.description)
    expect(description).toContain('LCEN')
    expect(description.toLowerCase()).toContain('vide')
    expect(description).toContain('téléphone')
    expect(description).toContain('300')
    expect(description).toContain('Florian')
  })

  it('adds exactly one field to the previous set', () => {
    expect(fields.map((field) => field.name).sort()).toEqual(
      [
        'siteTitle',
        'navLabels',
        'footerText',
        'defaultSeo',
        'welcomeHeading',
        'welcomeBody',
        'homepageIntro',
        'publisherAddress',
      ].sort(),
    )
  })
})
