import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INSTAGRAM_URL,
  getHeroTextColor,
  normalizeHeroColor,
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

describe('homepage hero colors', () => {
  it('accepts only named colors from the design-system palette', () => {
    expect(normalizeHeroColor('purple')).toBe('#AF3DFF');
    expect(normalizeHeroColor('red')).toBeUndefined();
    expect(normalizeHeroColor('#AF3DFF')).toBeUndefined();
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
