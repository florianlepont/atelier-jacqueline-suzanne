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
});
