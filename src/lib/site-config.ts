import type {HomePage, SiteSettings} from './sanity'

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
  fr: "Le site présente le travail photographique de Romane Lepont et permet l'achat d'une œuvre directement en ligne.",
  en: "This site showcases Romane Lepont's photographic work and lets you buy a piece directly online.",
}

export function resolveSiteCopy(settings: SiteSettings | null, locale: Locale) {
  return {
    aboutLabel: settings?.navLabels?.about?.[locale] || (locale === 'en' ? 'About' : 'À propos'),
    contactLabel: settings?.navLabels?.contact?.[locale] || 'Contact',
    instagramUrl: DEFAULT_INSTAGRAM_URL,
    instagramLabel: DEFAULT_INSTAGRAM_LABEL,
  }
}

export function resolveHomepageIntro(page: HomePage | null, locale: Locale) {
  return page?.intro?.[locale] || DEFAULT_HOMEPAGE_INTRO[locale]
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
