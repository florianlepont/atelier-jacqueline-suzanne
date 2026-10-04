import { describe, expect, it } from 'vitest';
import { IMAGE_UPLOAD_CONFIG } from '../../sanity/editorial/imageUploadConfig';
import {
  PROCESSABLE_MIME_TYPES,
  computeSignatureLayout,
  computeTargetSize,
  describeFailureReason,
  detectImageMime,
  formatBytes,
  formatDimensions,
  outputFileName,
  summarizeNotices,
  usesQuality,
  validateImageUploadConfig,
} from '../../sanity/editorial/imageUploadLogic';
import type {
  ImageUploadNotice,
  ProcessFailureReason,
  SignatureConfig,
} from '../../sanity/editorial/imageUploadLogic';

const MIB = 1048576;
const signature: SignatureConfig = IMAGE_UPLOAD_CONFIG.signature;

function cloneConfig(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(IMAGE_UPLOAD_CONFIG)) as Record<string, unknown>;
}

describe('computeTargetSize', () => {
  it.each([
    [6000, 4000, 2400, { width: 2400, height: 1600 }],
    [4000, 6000, 2400, { width: 1600, height: 2400 }],
    [3000, 3000, 2400, { width: 2400, height: 2400 }],
    [1200, 800, 2400, { width: 1200, height: 800 }],
    [2400, 1600, 2400, { width: 2400, height: 1600 }],
    [2401, 1, 2400, { width: 2400, height: 1 }],
    [1, 5000, 2400, { width: 1, height: 2400 }],
  ])('%i x %i with max %i gives %o', (width, height, max, expected) => {
    expect(computeTargetSize(width, height, max)).toEqual(expected);
  });

  it('always lands exactly on the max for the longest side', () => {
    const result = computeTargetSize(5999, 4001, 2400);
    expect(Math.max(result.width, result.height)).toBe(2400);
  });

  it.each([
    [0, 100, 2400],
    [100, -1, 2400],
    [Number.NaN, 100, 2400],
    [100, Number.POSITIVE_INFINITY, 2400],
    [100, 100, 0],
    ['100' as unknown as number, 100, 2400],
  ])('throws a RangeError for %s x %s max %s', (width, height, max) => {
    expect(() => computeTargetSize(width, height, max)).toThrow(RangeError);
  });
});

describe('detectImageMime', () => {
  it.each([
    ['image/jpeg', 'a.jpg', 'image/jpeg'],
    ['IMAGE/JPEG', 'a.jpg', 'image/jpeg'],
    ['image/jpg', 'a.jpg', 'image/jpeg'],
    ['image/pjpeg', 'a.jpg', 'image/jpeg'],
    ['image/png', 'a.png', 'image/png'],
    ['image/webp', 'a.webp', 'image/webp'],
  ])('recognises type %s', (type, name, expected) => {
    expect(detectImageMime(type, name)).toBe(expected);
    expect(PROCESSABLE_MIME_TYPES).toContain(expected);
  });

  it.each([
    ['image/gif', 'a.jpg'],
    ['image/svg+xml', 'a.png'],
    ['image/avif', 'a.webp'],
    ['application/pdf', 'a.jpg'],
  ])('returns null for the non-empty type %s even with a %s extension', (type, name) => {
    expect(detectImageMime(type, name)).toBeNull();
  });

  it.each([
    ['photo.jpg', 'image/jpeg'],
    ['photo.JPEG', 'image/jpeg'],
    ['photo.png', 'image/png'],
    ['photo.WebP', 'image/webp'],
    ['photo.gif', null],
    ['photo', null],
  ])('falls back to the extension of %s when the type is empty', (name, expected) => {
    expect(detectImageMime('', name)).toBe(expected);
  });
});

describe('outputFileName and usesQuality', () => {
  it.each([
    ['IMG_0001.JPG', 'image/jpeg', 'IMG_0001.jpg'],
    ['photo.jpeg', 'image/jpeg', 'photo.jpeg'],
    ['photo', 'image/jpeg', 'photo.jpg'],
    ['a.b.webp', 'image/webp', 'a.b.webp'],
    ['shot.png', 'image/png', 'shot.png'],
    ['', 'image/jpeg', 'image.jpg'],
    ['.jpg', 'image/jpeg', 'image.jpg'],
    ['.png', 'image/png', 'image.png'],
    ['shot.png', 'image/jpeg', 'shot.jpg'],
    ['my.photo', 'image/webp', 'my.photo.webp'],
  ] as const)('names %s as %s -> %s', (name, mime, expected) => {
    expect(outputFileName(name, mime)).toBe(expected);
  });

  it('applies quality to jpeg and webp only', () => {
    expect(usesQuality('image/jpeg')).toBe(true);
    expect(usesQuality('image/webp')).toBe(true);
    expect(usesQuality('image/png')).toBe(false);
  });
});

describe('computeSignatureLayout', () => {
  it('lays out the default signature at the bottom right of a landscape image', () => {
    const longest = 2400;
    const margin = Math.round(longest * signature.marginRatio);
    const fontSize = Math.round(longest * signature.sizeRatio);
    expect(margin).toBe(48);
    expect(fontSize).toBe(53);

    const layout = computeSignatureLayout(2400, 1600, signature);
    expect(layout).not.toBeNull();
    expect(layout).toMatchObject({
      text: '© Romane Lepont',
      x: 2352,
      y: 1552,
      textAlign: 'right',
      textBaseline: 'bottom',
      fillStyle: 'rgba(255, 255, 255, 0.55)',
      shadow: { color: 'rgba(0, 0, 0, 0.6)', blur: 6, offsetX: 0, offsetY: 2 },
    });
    expect(layout?.font.startsWith('600 53px')).toBe(true);
  });

  it.each([
    ['bottom-left', { x: 48, y: 1552, textAlign: 'left', textBaseline: 'bottom' }],
    ['top-right', { x: 2352, y: 48, textAlign: 'right', textBaseline: 'top' }],
    ['top-left', { x: 48, y: 48, textAlign: 'left', textBaseline: 'top' }],
  ] as const)('positions %s', (position, expected) => {
    expect(computeSignatureLayout(2400, 1600, { ...signature, position })).toMatchObject(expected);
  });

  it('derives size and margin from the longest side for portraits', () => {
    const layout = computeSignatureLayout(1600, 2400, signature);
    expect(layout?.font.startsWith('600 53px')).toBe(true);
    expect(layout).toMatchObject({ x: 1600 - 48, y: 2400 - 48 });
  });

  it('floors the font size on tiny images when it fits', () => {
    const layout = computeSignatureLayout(200, 100, signature);
    expect(layout?.font.startsWith('600 10px')).toBe(true);
  });

  it('shrinks an over-long text, down to 8 px, and gives up below that', () => {
    expect(computeSignatureLayout(70, 50, signature)).toBeNull();
    const layout = computeSignatureLayout(80, 50, signature);
    expect(layout?.font.startsWith('600 8px')).toBe(true);
  });

  it('returns null for an empty or whitespace-only text', () => {
    expect(computeSignatureLayout(2400, 1600, { ...signature, text: '' })).toBeNull();
    expect(computeSignatureLayout(2400, 1600, { ...signature, text: '   ' })).toBeNull();
  });

  it('supports a zero margin', () => {
    expect(computeSignatureLayout(2400, 1600, { ...signature, marginRatio: 0 })).toMatchObject({
      x: 2400,
      y: 1600,
    });
  });
});

describe('validateImageUploadConfig', () => {
  it('accepts the shipped config', () => {
    expect(validateImageUploadConfig(IMAGE_UPLOAD_CONFIG)).toEqual([]);
  });

  it('rejects a non-object config', () => {
    expect(validateImageUploadConfig(null)).toHaveLength(1);
    expect(validateImageUploadConfig('config')).toHaveLength(1);
    expect(validateImageUploadConfig([])).toHaveLength(1);
  });

  it.each([
    ['enabled', 'yes', 'enabled'],
    ['maxDimension', 799, 'maxDimension'],
    ['maxDimension', 8001, 'maxDimension'],
    ['maxDimension', 2400.5, 'maxDimension'],
    ['maxDimension', '2400', 'maxDimension'],
    ['quality', 0.4, 'quality'],
    ['quality', 5, 'quality'],
    ['quality', '0.9', 'quality'],
    ['signature', undefined, 'signature'],
  ])('flags %s = %s', (field, value, path) => {
    const config = cloneConfig();
    config[field] = value;
    const errors = validateImageUploadConfig(config);
    expect(errors.some((message) => message.startsWith(path))).toBe(true);
  });

  it.each([
    ['enabled', 'oui', 'signature.enabled'],
    ['text', '', 'signature.text'],
    ['text', 'x'.repeat(61), 'signature.text'],
    ['opacity', 0.05, 'signature.opacity'],
    ['opacity', 1.5, 'signature.opacity'],
    ['sizeRatio', 0.001, 'signature.sizeRatio'],
    ['sizeRatio', 0.5, 'signature.sizeRatio'],
    ['marginRatio', -0.1, 'signature.marginRatio'],
    ['marginRatio', 0.2, 'signature.marginRatio'],
    ['position', 'center', 'signature.position'],
  ])('flags signature.%s = %s', (field, value, path) => {
    const config = cloneConfig();
    config.signature = { ...(config.signature as Record<string, unknown>), [field]: value };
    const errors = validateImageUploadConfig(config);
    expect(errors.some((message) => message.startsWith(path))).toBe(true);
  });

  it('does not validate the other signature fields when the signature is disabled', () => {
    const config = cloneConfig();
    config.signature = { enabled: false, text: '', opacity: 9, position: 'nowhere' };
    expect(validateImageUploadConfig(config)).toEqual([]);
  });

  it('reports several problems together', () => {
    const config = cloneConfig();
    config.maxDimension = 1;
    config.quality = 9;
    expect(validateImageUploadConfig(config).length).toBeGreaterThanOrEqual(2);
  });
});

describe('notice wording', () => {
  it('formats dimensions and bytes', () => {
    expect(formatDimensions(6000, 4000)).toBe('6000 × 4000 px');
    expect(formatBytes(900 * 1024)).toBe('900 Ko');
    expect(formatBytes(14.2 * MIB)).toBe('14,2 Mo');
  });

  it('describes every failure reason in French', () => {
    const expected: Record<ProcessFailureReason, string> = {
      'invalid-config': 'réglage d’envoi d’images invalide',
      'too-large': 'fichier trop volumineux pour être traité dans le navigateur',
      'decode-failed': 'image illisible par le navigateur',
      'canvas-unavailable': 'traitement d’image indisponible dans ce navigateur',
      'encode-failed': 'échec de la réécriture de l’image',
      'encode-type-mismatch': 'format de sortie non géré par ce navigateur',
      timeout: 'traitement trop long',
      unexpected: 'erreur inattendue',
    };
    for (const [reason, label] of Object.entries(expected)) {
      expect(describeFailureReason(reason as ProcessFailureReason)).toBe(label);
    }
  });

  const processed = (
    overrides: Partial<Extract<ImageUploadNotice, { kind: 'processed' }>> = {},
  ): ImageUploadNotice => ({
    kind: 'processed',
    fileName: 'photo.jpg',
    original: { width: 6000, height: 4000, bytes: 14.2 * MIB },
    output: { width: 2400, height: 1600, bytes: 1.1 * MIB },
    resized: true,
    signed: true,
    ...overrides,
  });

  it('returns null without notices', () => {
    expect(summarizeNotices([])).toBeNull();
  });

  it('summarises one resized and signed image', () => {
    expect(summarizeNotices([processed()])).toEqual({
      status: 'success',
      title: 'Image optimisée',
      description:
        'photo.jpg : 6000 × 4000 px → 2400 × 1600 px, 14,2 Mo → 1,1 Mo, signature ajoutée.',
    });
  });

  it('summarises one image that kept its dimensions', () => {
    const spec = summarizeNotices([
      processed({
        original: { width: 2000, height: 1333, bytes: 1.2 * MIB },
        output: { width: 2000, height: 1333, bytes: 900 * 1024 },
        resized: false,
      }),
    ]);
    expect(spec?.description).toBe(
      'photo.jpg : dimensions conservées (2000 × 1333 px), 1,2 Mo → 900 Ko, signature ajoutée.',
    );
  });

  it('ends with a plain period when the image is not signed', () => {
    const spec = summarizeNotices([processed({ signed: false })]);
    expect(spec?.description.endsWith('1,1 Mo.')).toBe(true);
    expect(spec?.description).not.toContain('signature');
  });

  it('groups several processed images', () => {
    const spec = summarizeNotices([
      processed({
        original: { width: 6000, height: 4000, bytes: 20 * MIB },
        output: { width: 2400, height: 1600, bytes: 1 * MIB },
      }),
      processed({
        original: { width: 6000, height: 4000, bytes: 15 * MIB },
        output: { width: 2400, height: 1600, bytes: 2 * MIB },
      }),
      processed({
        original: { width: 2000, height: 1000, bytes: 5 * MIB },
        output: { width: 2000, height: 1000, bytes: 0.3 * MIB },
        resized: false,
      }),
    ]);
    expect(spec).toEqual({
      status: 'success',
      title: '3 images optimisées',
      description: 'Réduites : 2/3 · signées : 3/3 · poids total : 40,0 Mo → 3,3 Mo.',
    });
  });

  it('turns any fallback into a warning', () => {
    const single = summarizeNotices([
      { kind: 'fallback', fileName: 'a.jpg', reason: 'decode-failed' },
    ]);
    expect(single?.status).toBe('warning');
    expect(single?.title).toBe('Image envoyée sans optimisation');
    expect(single?.description).toBe(
      'a.jpg : image illisible par le navigateur. L’original a été envoyé tel quel (ni réduction ni signature).',
    );

    const several = summarizeNotices([
      { kind: 'fallback', fileName: 'a.jpg', reason: 'timeout' },
      { kind: 'fallback', fileName: 'b.jpg', reason: 'unexpected' },
    ]);
    expect(several?.title).toBe('2 images envoyées sans optimisation');
  });

  it('mentions the processed images mixed with fallbacks and caps the list at three', () => {
    const fallbacks: ImageUploadNotice[] = ['a', 'b', 'c', 'd', 'e'].map((name) => ({
      kind: 'fallback',
      fileName: `${name}.jpg`,
      reason: 'timeout',
    }));
    const one = summarizeNotices([processed(), ...fallbacks]);
    expect(one?.description.startsWith('1 autre image optimisée. a.jpg')).toBe(true);
    expect(one?.description).toContain('c.jpg : traitement trop long et 2 autres.');
    expect(one?.description).not.toContain('d.jpg');
    expect(one?.description.endsWith('(ni réduction ni signature).')).toBe(true);

    const many = summarizeNotices([processed(), processed(), ...fallbacks.slice(0, 4)]);
    expect(many?.description.startsWith('2 autres images optimisées.')).toBe(true);
    expect(many?.description).toContain('et 1 autre.');
  });
});
