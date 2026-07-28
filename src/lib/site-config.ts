import type {EditionsPage, HomePage, SiteSettings} from './sanity'

export type Locale = 'fr' | 'en'

export const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/ajs_romanelepont/'
export const DEFAULT_INSTAGRAM_LABEL = '@ajs_romanelepont'

export const HERO_COLORS = {
  pink: '#FF3B94',
  purple: '#AF3DFF',
  teal: '#55FFE1',
  lime: '#A6FD29',
  plum: '#37013A',
} as const

const DEFAULT_HOMEPAGE_INTRO: Record<Locale, string> = {
  fr: 'Le site présente le travail photographique de Romane Lepont à travers ses différentes séries et éditions.',
  en: "This site showcases Romane Lepont's photographic work through her different series and editions.",
}

// quick-260728-el6: byte-identical to defaultIntro in
// sanity/schemas/editionsPage.ts so Studio and this code-side fallback
// read the same placeholder copy until Romane edits it. Deliberately
// EDN-06-clean (no commerce-affordance wording).
const DEFAULT_EDITIONS_INTRO: Record<Locale, string> = {
  fr: 'Les Éditions sont les objets imprimés — zines, livrets, tirages en petite série — qui prolongent le travail photographique de Romane Lepont sous une autre forme.',
  en: "Éditions are the printed objects — zines, booklets, small-run prints — that extend Romane Lepont's photographic work into another form.",
}

export function resolveSiteCopy(settings: SiteSettings | null, locale: Locale) {
  return {
    editionsLabel: settings?.navLabels?.editions?.[locale] || 'Éditions',
    aboutLabel: settings?.navLabels?.about?.[locale] || (locale === 'en' ? 'About' : 'À propos'),
    contactLabel: settings?.navLabels?.contact?.[locale] || 'Contact',
    instagramUrl: DEFAULT_INSTAGRAM_URL,
    instagramLabel: DEFAULT_INSTAGRAM_LABEL,
  }
}

export function resolveHomepageIntro(page: HomePage | null, locale: Locale) {
  return page?.intro?.[locale] || DEFAULT_HOMEPAGE_INTRO[locale]
}

export function resolveEditionsIntro(page: EditionsPage | null, locale: Locale) {
  return page?.intro?.[locale] || DEFAULT_EDITIONS_INTRO[locale]
}

/** Resolve only named colors from the site's decorative design-system palette. */
export function normalizeHeroColor(value?: string): string | undefined {
  return value && value in HERO_COLORS ? HERO_COLORS[value as keyof typeof HERO_COLORS] : undefined
}

/** Pick whichever of the site's ink/white colors has the stronger WCAG contrast. */
export function getHeroTextColor(background: string): '#1A1A1A' | '#FFFFFF' {
  const hex = /^#[0-9a-f]{6}$/i.test(background)
    ? background.toUpperCase()
    : normalizeHeroColor(background)
  if (!hex) return '#1A1A1A'

  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  const contrastWithInk = (luminance + 0.05) / (0.0103 + 0.05)
  const contrastWithWhite = 1.05 / (luminance + 0.05)

  return contrastWithInk >= contrastWithWhite ? '#1A1A1A' : '#FFFFFF'
}
