import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  COLOR_INK,
  DEFAULT_INSTAGRAM_URL,
  getHeroTextColor,
  normalizeHeroColor,
  resolveEditionsIntro,
  resolveHomepageIntro,
  resolveSiteCopy,
} from '../../src/lib/site-config';

describe('resolveSiteCopy', () => {
  it('keeps the current live copy as a safe fallback for existing Sanity data', () => {
    const copy = resolveSiteCopy(null, 'fr');

    expect(copy.aboutLabel).toBe('À propos');
    expect(copy.contactLabel).toBe('Contact');
    expect(copy.instagramUrl).toBe(DEFAULT_INSTAGRAM_URL);
    expect(resolveHomepageIntro(null, 'fr')).toContain('travail photographique');
  });

  it('uses the new editable site settings when populated', () => {
    const copy = resolveSiteCopy(
      {
        siteTitle: { fr: 'AJS', en: 'AJS' },
        navLabels: { about: { fr: 'Studio' }, contact: { fr: 'Écrire' } },
        footerText: { fr: '', en: '' },
      },
      'fr',
    );

    expect(copy).toMatchObject({
      aboutLabel: 'Studio',
      contactLabel: 'Écrire',
      instagramUrl: DEFAULT_INSTAGRAM_URL,
      instagramLabel: '@ajs_romanelepont',
    });
  });

  it('uses the dedicated homepage document when populated', () => {
    expect(resolveHomepageIntro({ intro: { fr: 'Texte éditable' } }, 'fr')).toBe('Texte éditable');
  });

  // Phase 13 (EDN-01, SC #4) — the "Éditions" nav label follows the exact
  // fallback/override shape as aboutLabel/contactLabel: a hardcoded default
  // when Sanity has nothing, overridden once Romane populates
  // navLabels.editions in the siteSettings singleton.
  it('falls back to the same "Éditions" literal in both locales when Sanity is empty (EDN-01, SC #4)', () => {
    expect(resolveSiteCopy(null, 'fr').editionsLabel).toBe('Éditions');
    expect(resolveSiteCopy(null, 'en').editionsLabel).toBe('Éditions');
  });

  it('uses the editable navLabels.editions value when populated (EDN-01, SC #4)', () => {
    const copy = resolveSiteCopy(
      {
        siteTitle: { fr: 'AJS', en: 'AJS' },
        navLabels: { editions: { fr: 'Nos éditions' } },
        footerText: { fr: '', en: '' },
      },
      'fr',
    );

    expect(copy.editionsLabel).toBe('Nos éditions');
  });
});

describe('resolveEditionsIntro', () => {
  it('falls back to the fr placeholder copy when Sanity is empty', () => {
    expect(resolveEditionsIntro(null, 'fr')).toContain('objets imprimés');
  });

  it('falls back to the en placeholder copy when Sanity is empty', () => {
    expect(resolveEditionsIntro(null, 'en')).toContain('printed objects');
  });

  it('uses the populated Sanity value when present, and falls back per-locale when a locale is missing', () => {
    const page = { intro: { fr: 'Texte éditable' } };

    expect(resolveEditionsIntro(page, 'fr')).toBe('Texte éditable');
    expect(resolveEditionsIntro(page, 'en')).toContain('printed objects');
  });
});

describe('homepage hero colors', () => {
  it('accepts only named colors from the design-system palette', () => {
    expect(normalizeHeroColor('purple')).toBe('#A73AF4');
    expect(normalizeHeroColor('red')).toBeUndefined();
    expect(normalizeHeroColor('#A73AF4')).toBeUndefined();
  });

  it('chooses readable ink on light colors and white on dark colors', () => {
    expect(getHeroTextColor('#A6FD29')).toBe('#1A1A1A');
    expect(getHeroTextColor('#37013A')).toBe('#FFFFFF');
  });

  it('resolves the correct paired text color for all five presets (260718-r2o)', () => {
    // Dark presets: Violet and Plum must resolve to white text so the
    // grid-mode hero tile stays legible on a dark accent background.
    expect(getHeroTextColor(normalizeHeroColor('purple')!)).toBe('#FFFFFF');
    expect(getHeroTextColor(normalizeHeroColor('plum')!)).toBe('#FFFFFF');

    // Light presets: Rose, Turquoise, Citron vert must resolve to ink text.
    expect(getHeroTextColor(normalizeHeroColor('pink')!)).toBe('#1A1A1A');
    expect(getHeroTextColor(normalizeHeroColor('teal')!)).toBe('#1A1A1A');
    expect(getHeroTextColor(normalizeHeroColor('lime')!)).toBe('#1A1A1A');
  });
});

describe('COLOR_INK stays in lockstep with BaseLayout.astro\'s --gray-900 (WR-01)', () => {
  // COLOR_INK exists so plain TS/JS code needing this exact ink value (e.g.
  // getHeroTextColor's fallback above) doesn't re-type the hex literal --
  // but the single source of truth for the color itself is still the CSS
  // custom property in BaseLayout.astro's `:root` block. Nothing but this
  // test previously verified the two stay equal; a future rebrand touching
  // only one side would otherwise pass silently.
  it('matches the --gray-900 value declared in BaseLayout.astro', () => {
    const layoutSource = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
    const match = layoutSource.match(/--gray-900:\s*(#[0-9A-Fa-f]{6});/);
    expect(match).not.toBeNull();
    expect(COLOR_INK).toBe(match![1]);
  });
});
