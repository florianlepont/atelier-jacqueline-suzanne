import type {EditionsPage, HomePage, SiteSettings} from './sanity'

export type Locale = 'fr' | 'en'

export const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/ajs_romanelepont/'
export const DEFAULT_INSTAGRAM_LABEL = '@ajs_romanelepont'

// WR-01 (21-REVIEW.md): single source of truth for the --color-ink/
// --gray-900 token defined once in BaseLayout.astro's :root block, so
// call sites needing the same value in plain TS/JS (outside CSS) import
// this instead of re-typing the hex literal — a future rebrand/palette
// change to --gray-900 would otherwise silently stop matching here, with
// no compiler/test signal.
export const COLOR_INK = '#1A1A1A'

export const HERO_COLORS = {
  pink: '#FF3B94',
  // Nudged from #AF3DFF (a11y fix, Phase 20): the original never reached
  // 4.5:1 contrast with either white or ink text (best case ~4.25:1 with
  // white) — dormant before HOME-16's random starting accent made this
  // hue reachable on initial homepage load, not just via manual carousel
  // navigation. This value clears 4.5:1 with white with a small margin
  // while keeping the same hue/chroma (uniform luminance scale-down).
  purple: '#A73AF4',
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

// 260825-hl7 (bug 2): the automatic accent palette used whenever a gallery
// has no explicit heroColor set in Studio ("Palette automatique"). Defined
// exactly once here so both the client-side homepage carousel
// (src/client/home-carousel-runtime.ts) and the build-time gallery detail
// model (src/lib/page-models.ts) resolve the SAME accent for the same
// gallery — previously these were two independent, never-synchronized
// implementations (the homepage cycled this array per carousel index; the
// detail page fell back to a hardcoded lime hex regardless of index).
// Values are copied verbatim, in order, from the array that used to live
// inline in home-carousel-runtime.ts.
//
// D-2 (260825-hl7-PLAN.md): these are CSS custom-property REFERENCE strings
// (e.g. 'var(--color-accent)'), not resolved hex literals. `--color-accent`
// resolves to `--pink-600` (#D6327C), which is NOT the same as
// HERO_COLORS.pink (#FF3B94) below — hex-ifying this palette would silently
// change the homepage's shipped rendering. Passing the same var(...) string
// through to both pages' inline custom properties makes them resolve
// against the same :root tokens in BaseLayout.astro, byte-identically.
// Consequence: this automatic path must NOT be routed through
// getHeroTextColor() (which cannot parse a var() string) — each entry
// carries its own correct paired text color directly.
export const AUTOMATIC_ACCENTS: ReadonlyArray<{bg: string; text: string}> = [
  {bg: 'var(--color-accent)', text: 'var(--color-on-accent)'},
  {bg: 'var(--palette-purple)', text: '#FFFFFF'},
  {bg: 'var(--palette-teal)', text: 'var(--color-ink)'},
  {bg: 'var(--palette-lime)', text: 'var(--color-ink)'},
  {bg: 'var(--palette-plum)', text: '#FFFFFF'},
] as const

/**
 * Resolve the automatic accent for a 0-based index, cycling generically for
 * N galleries (not hardcoded to the palette's own length). A negative,
 * `NaN`, or non-finite index falls back to entry 0 rather than throwing or
 * returning `undefined` — this is the safe default used both when a gallery
 * has no known homepage position (homeIndex === -1) and defensively for any
 * other out-of-range input.
 */
export function resolveAutomaticAccent(index: number): {bg: string; text: string} {
  if (!Number.isFinite(index) || index < 0) return AUTOMATIC_ACCENTS[0]
  return AUTOMATIC_ACCENTS[Math.trunc(index) % AUTOMATIC_ACCENTS.length]
}

/** Resolve only named colors from the site's decorative design-system palette. */
export function normalizeHeroColor(value?: string): string | undefined {
  return value && Object.prototype.hasOwnProperty.call(HERO_COLORS, value)
    ? HERO_COLORS[value as keyof typeof HERO_COLORS]
    : undefined
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
