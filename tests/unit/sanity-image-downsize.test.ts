import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THRESHOLD,
  HEIGHT_TOLERANCE_PX,
  MIN_THRESHOLD,
  REDACTED,
  ReducedImageError,
  USAGE_TEXT,
  assessDeletionSafety,
  buildReducedImageUrl,
  computeTargetDimensions,
  deriveFilename,
  describeError,
  fetchReducedImage,
  findReferencePaths,
  formatDryRunReport,
  parseImageAssetId,
  planReferencePatches,
  redactSecrets,
  resolveCliOptions,
  resolveOutputFormat,
  selectOversizedAssets,
  validateReducedImage,
} from '../../scripts/lib/sanity-image-downsize.mjs';

// Pure-logic tests only: no real network, no sharp, no process access. Network
// and image decoding are replaced by injected stubs.

const OLD_ID = 'image-aaaa1111-6000x4000-jpg';
const NEW_ID = 'image-bbbb2222-2400x1600-jpg';
const TOKEN = 'skAbCdEf1234SecretTokenValue';

describe('selectOversizedAssets', () => {
  it('selects only widths strictly above the default threshold of 2400', () => {
    expect(DEFAULT_THRESHOLD).toBe(2400);
    const { oversized, skipped } = selectOversizedAssets([
      { _id: 'a', mimeType: 'image/jpeg', width: 2400 },
      { _id: 'b', mimeType: 'image/jpeg', width: 2401 },
      { _id: 'c', mimeType: 'image/jpeg', width: 1200 },
    ]);
    expect(oversized.map((asset) => asset._id)).toEqual(['b']);
    expect(skipped).toEqual([]);
  });

  it('honours a custom threshold', () => {
    const assets = [
      { _id: 'a', mimeType: 'image/png', width: 1500 },
      { _id: 'b', mimeType: 'image/png', width: 900 },
    ];
    expect(selectOversizedAssets(assets, 1000).oversized.map((asset) => asset._id)).toEqual(['a']);
    expect(selectOversizedAssets(assets, 800).oversized.map((asset) => asset._id)).toEqual(['a', 'b']);
  });

  it('skips unsupported formats and unknown dimensions with a reason', () => {
    const { oversized, skipped } = selectOversizedAssets([
      { _id: 'svg', mimeType: 'image/svg+xml', width: 5000 },
      { _id: 'gif', mimeType: 'image/gif', width: 5000 },
      { _id: 'nowidth', mimeType: 'image/jpeg' },
      { _id: 'nullwidth', mimeType: 'image/jpeg', width: null },
      { _id: 'small-svg', mimeType: 'image/svg+xml', width: 100 },
      { _id: 'small', mimeType: 'image/jpeg', width: 100 },
    ]);
    expect(oversized).toEqual([]);
    const reasons = Object.fromEntries(skipped.map((entry) => [entry.asset._id, entry.reason]));
    expect(reasons).toEqual({
      svg: 'UNSUPPORTED_FORMAT',
      gif: 'UNSUPPORTED_FORMAT',
      nowidth: 'UNKNOWN_DIMENSIONS',
      nullwidth: 'UNKNOWN_DIMENSIONS',
    });
  });

  it('accepts jpeg, png and webp', () => {
    const { oversized } = selectOversizedAssets([
      { _id: 'j', mimeType: 'image/jpeg', width: 3000 },
      { _id: 'p', mimeType: 'image/png', width: 3000 },
      { _id: 'w', mimeType: 'image/webp', width: 3000 },
    ]);
    expect(oversized).toHaveLength(3);
  });

  it('orders by width descending then id, and does not mutate its input', () => {
    const input = [
      { _id: 'b', mimeType: 'image/jpeg', width: 3000 },
      { _id: 'c', mimeType: 'image/jpeg', width: 5000 },
      { _id: 'a', mimeType: 'image/jpeg', width: 3000 },
    ];
    const snapshot = JSON.stringify(input);
    const { oversized } = selectOversizedAssets(input);
    expect(oversized.map((asset) => asset._id)).toEqual(['c', 'a', 'b']);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('computeTargetDimensions', () => {
  it('scales a landscape image down to the max width', () => {
    expect(computeTargetDimensions({ width: 6000, height: 4000 }, 2400)).toEqual({ width: 2400, height: 1600 });
  });

  it('is width-driven for portrait images', () => {
    expect(computeTargetDimensions({ width: 4000, height: 6000 }, 2400)).toEqual({ width: 2400, height: 3600 });
  });

  it('never upscales', () => {
    expect(computeTargetDimensions({ width: 2400, height: 1600 }, 2400)).toEqual({ width: 2400, height: 1600 });
    expect(computeTargetDimensions({ width: 1000, height: 700 }, 2400)).toEqual({ width: 1000, height: 700 });
  });

  it('defaults to the default threshold', () => {
    expect(computeTargetDimensions({ width: 4800, height: 3200 })).toEqual({ width: 2400, height: 1600 });
  });

  it('keeps the aspect ratio within 1 px and rounds the height', () => {
    const source = { width: 5471, height: 3647 };
    const target = computeTargetDimensions(source, 2400);
    expect(target.width).toBe(2400);
    expect(Number.isInteger(target.height)).toBe(true);
    expect(Math.abs(target.height - (source.height * 2400) / source.width)).toBeLessThanOrEqual(1);
  });

  it('never returns a zero height', () => {
    expect(computeTargetDimensions({ width: 100000, height: 1 }, 2400).height).toBe(1);
  });

  it('throws on invalid input', () => {
    expect(() => computeTargetDimensions({ width: 0, height: 100 })).toThrow(RangeError);
    expect(() => computeTargetDimensions({ width: -5, height: 100 })).toThrow(RangeError);
    expect(() => computeTargetDimensions({ width: Number.NaN, height: 100 })).toThrow(RangeError);
    expect(() => computeTargetDimensions({ width: 100, height: Number.NaN })).toThrow(RangeError);
    expect(() => computeTargetDimensions({ width: '100' as unknown as number, height: 100 })).toThrow(RangeError);
    expect(() => computeTargetDimensions({ width: 4000, height: 3000 }, 0)).toThrow(RangeError);
  });
});

describe('parseImageAssetId', () => {
  it('parses a well-formed id', () => {
    expect(parseImageAssetId('image-0123abcd-2400x1600-jpg')).toEqual({
      hash: '0123abcd',
      width: 2400,
      height: 1600,
      extension: 'jpg',
    });
  });

  it('returns null for malformed ids', () => {
    expect(parseImageAssetId('file-abc-pdf')).toBeNull();
    expect(parseImageAssetId('image-abc-2400-jpg')).toBeNull();
    expect(parseImageAssetId('image--2400x1600-jpg')).toBeNull();
    expect(parseImageAssetId('')).toBeNull();
    expect(parseImageAssetId(undefined as unknown as string)).toBeNull();
  });
});

describe('deriveFilename', () => {
  it('prefers originalFilename and falls back to the id', () => {
    expect(deriveFilename({ _id: OLD_ID, originalFilename: 'IMG_001.jpg' })).toBe('IMG_001.jpg');
    expect(deriveFilename({ _id: OLD_ID })).toBe('aaaa1111.jpg');
  });
});

describe('findReferencePaths', () => {
  const ref = (id: string) => ({ _type: 'reference', _ref: id });

  it('finds a top-level image field', () => {
    expect(findReferencePaths({ image: { _type: 'image', asset: ref(OLD_ID) } }, OLD_ID)).toEqual([
      'image.asset._ref',
    ]);
  });

  it('uses _key selectors for array members', () => {
    const doc = {
      images: [
        { _key: 'k0', _type: 'image', asset: ref('image-zzzz-1x1-jpg') },
        { _key: 'k1', _type: 'image', asset: ref(OLD_ID) },
      ],
    };
    expect(findReferencePaths(doc, OLD_ID)).toEqual(['images[_key=="k1"].asset._ref']);
  });

  it('falls back to indexes for array members without a _key', () => {
    const doc = {
      images: [
        { asset: ref('image-zzzz-1x1-jpg') },
        { asset: ref('image-zzzz-1x1-jpg') },
        { asset: ref(OLD_ID) },
      ],
    };
    expect(findReferencePaths(doc, OLD_ID)).toEqual(['images[2].asset._ref']);
  });

  it('walks nested objects and arrays', () => {
    const doc = {
      sections: [{ _key: 's', blocks: [{ _key: 'b', media: { image: { asset: ref(OLD_ID) } } }] }],
    };
    expect(findReferencePaths(doc, OLD_ID)).toEqual([
      'sections[_key=="s"].blocks[_key=="b"].media.image.asset._ref',
    ]);
  });

  it('returns every occurrence of the same asset', () => {
    const doc = { a: { asset: ref(OLD_ID) }, b: [{ _key: 'x', asset: ref(OLD_ID) }] };
    expect(findReferencePaths(doc, OLD_ID).sort()).toEqual(['a.asset._ref', 'b[_key=="x"].asset._ref']);
  });

  it('ignores plain strings and references to other assets', () => {
    const doc = {
      note: OLD_ID,
      other: { asset: ref('image-zzzz-1x1-jpg') },
      notAReference: { asset: { _ref: OLD_ID } },
      wrongType: { asset: { _type: 'span', _ref: OLD_ID } },
    };
    expect(findReferencePaths(doc, OLD_ID)).toEqual([]);
  });

  it('fails closed on a key that cannot be expressed as a patch path', () => {
    const doc = { 'weird-key': { asset: ref(OLD_ID) } };
    expect(() => findReferencePaths(doc, OLD_ID)).toThrow();
  });

  it('does not complain about odd keys that are not on a matching path', () => {
    const doc = { 'weird-key': { asset: ref('image-zzzz-1x1-jpg') }, image: { asset: ref(OLD_ID) } };
    expect(findReferencePaths(doc, OLD_ID)).toEqual(['image.asset._ref']);
  });
});

describe('planReferencePatches', () => {
  const ref = (id: string) => ({ _type: 'reference', _ref: id });

  it('builds one patch per document, with every path set to the new id', () => {
    const doc = {
      _id: 'gallery-1',
      _type: 'gallery',
      _rev: 'rev1',
      cover: { asset: ref(OLD_ID) },
      images: [{ _key: 'k', asset: ref(OLD_ID) }],
    };
    const { patches, unpatchable } = planReferencePatches([doc], OLD_ID, NEW_ID);
    expect(unpatchable).toEqual([]);
    expect(patches).toEqual([
      {
        documentId: 'gallery-1',
        ifRevisionID: 'rev1',
        set: { 'cover.asset._ref': NEW_ID, 'images[_key=="k"].asset._ref': NEW_ID },
      },
    ]);
  });

  it('plans a draft and its published twin independently, each with its own revision', () => {
    const published = { _id: 'about', _type: 'aboutPage', _rev: 'r-pub', image: { asset: ref(OLD_ID) } };
    const draft = { _id: 'drafts.about', _type: 'aboutPage', _rev: 'r-draft', image: { asset: ref(OLD_ID) } };
    const { patches } = planReferencePatches([published, draft], OLD_ID, NEW_ID);
    expect(patches.map((patch) => [patch.documentId, patch.ifRevisionID])).toEqual([
      ['about', 'r-pub'],
      ['drafts.about', 'r-draft'],
    ]);
    for (const patch of patches) {
      expect(Object.values(patch.set)).toEqual([NEW_ID]);
    }
  });

  it('reports documents it cannot patch instead of patching them', () => {
    const noPath = { _id: 'no-path', _rev: 'r', other: { asset: ref('image-zzzz-1x1-jpg') } };
    const noRev = { _id: 'no-rev', image: { asset: ref(OLD_ID) } };
    const oddKey = { _id: 'odd-key', _rev: 'r', 'a b': { asset: ref(OLD_ID) } };
    const good = { _id: 'good', _rev: 'r', image: { asset: ref(OLD_ID) } };
    const { patches, unpatchable } = planReferencePatches([noPath, noRev, oddKey, good], OLD_ID, NEW_ID);
    expect(patches.map((patch) => patch.documentId)).toEqual(['good']);
    expect(unpatchable).toEqual(['no-path', 'no-rev', 'odd-key']);
  });

  it('does not mutate its input documents', () => {
    const doc = { _id: 'd', _rev: 'r', image: { asset: ref(OLD_ID) } };
    const snapshot = JSON.stringify(doc);
    planReferencePatches([doc], OLD_ID, NEW_ID);
    expect(JSON.stringify(doc)).toBe(snapshot);
  });
});

describe('resolveCliOptions', () => {
  const env = { SANITY_PROJECT_ID: 'gwz8iug4', SANITY_DATASET: 'production' };

  function options(argv: string[], environment: Record<string, string | undefined> = env) {
    const result = resolveCliOptions(argv, environment);
    if (!result.ok || !('options' in result)) {
      throw new Error(`expected options, got ${JSON.stringify(result)}`);
    }
    return result.options;
  }

  function errorCodes(argv: string[], environment: Record<string, string | undefined> = env): string[] {
    const result = resolveCliOptions(argv, environment);
    if (result.ok) throw new Error('expected errors');
    return result.errors.map((error) => error.code);
  }

  it('defaults to a dry-run with the default threshold and env project/dataset', () => {
    expect(options([])).toMatchObject({
      apply: false,
      deleteOriginals: false,
      threshold: DEFAULT_THRESHOLD,
      projectId: 'gwz8iug4',
      dataset: 'production',
    });
  });

  it('lets flags override the environment', () => {
    expect(options(['--project-id', 'p2', '--dataset', 'staging'])).toMatchObject({
      projectId: 'p2',
      dataset: 'staging',
    });
  });

  it('reports a missing project id and dataset', () => {
    expect(errorCodes([], {})).toEqual(['MISSING_PROJECT_ID', 'MISSING_DATASET']);
    expect(errorCodes([], { SANITY_DATASET: 'production' })).toEqual(['MISSING_PROJECT_ID']);
    expect(errorCodes([], { SANITY_PROJECT_ID: 'p' })).toEqual(['MISSING_DATASET']);
  });

  it('accepts integer thresholds from the minimum upward', () => {
    expect(MIN_THRESHOLD).toBe(800);
    expect(options(['--threshold', '800']).threshold).toBe(800);
    expect(options(['--threshold=3000']).threshold).toBe(3000);
  });

  it.each(['abc', '0', '799', '2400.5', '-5', '', '1e4'])('rejects the threshold %j', (value) => {
    expect(errorCodes([`--threshold=${value}`])).toEqual(['INVALID_THRESHOLD']);
  });

  it('refuses --apply without the backup flag', () => {
    expect(errorCodes(['--apply'], { ...env, SANITY_WRITE_TOKEN: TOKEN })).toEqual([
      'APPLY_REQUIRES_BACKUP_FLAG',
    ]);
  });

  it('refuses --apply without a write token', () => {
    expect(errorCodes(['--apply', '--i-have-a-backup'])).toEqual(['APPLY_REQUIRES_WRITE_TOKEN']);
    expect(errorCodes(['--apply', '--i-have-a-backup'], { ...env, SANITY_WRITE_TOKEN: '  ' })).toEqual([
      'APPLY_REQUIRES_WRITE_TOKEN',
    ]);
  });

  it('reports both apply problems together', () => {
    expect(errorCodes(['--apply'])).toEqual(['APPLY_REQUIRES_BACKUP_FLAG', 'APPLY_REQUIRES_WRITE_TOKEN']);
  });

  it('accepts --apply with the backup flag and a token, and carries the token', () => {
    const parsed = options(['--apply', '--i-have-a-backup'], { ...env, SANITY_WRITE_TOKEN: TOKEN });
    expect(parsed).toMatchObject({ apply: true, deleteOriginals: false, writeToken: TOKEN });
  });

  it('refuses --delete-originals without --apply', () => {
    expect(errorCodes(['--delete-originals'])).toEqual(['DELETE_REQUIRES_APPLY']);
    expect(errorCodes(['--delete-originals', '--i-have-a-backup'], { ...env, SANITY_WRITE_TOKEN: TOKEN })).toEqual([
      'DELETE_REQUIRES_APPLY',
    ]);
  });

  it('accepts the full destructive combination only with everything present', () => {
    const parsed = options(['--apply', '--i-have-a-backup', '--delete-originals'], {
      ...env,
      SANITY_WRITE_TOKEN: TOKEN,
    });
    expect(parsed).toMatchObject({ apply: true, deleteOriginals: true, writeToken: TOKEN });
  });

  it('never carries the write token in a dry-run, even when the environment has one', () => {
    const parsed = options([], { ...env, SANITY_WRITE_TOKEN: TOKEN });
    expect(parsed.apply).toBe(false);
    expect(parsed.writeToken).toBeUndefined();
    expect(JSON.stringify(parsed)).not.toContain(TOKEN);
  });

  it('passes the optional read token through', () => {
    expect(options([], { ...env, SANITY_API_READ_TOKEN: 'read-token' }).readToken).toBe('read-token');
    expect(options([]).readToken).toBeUndefined();
  });

  it('rejects unknown options and unexpected positionals', () => {
    expect(errorCodes(['--nope'])).toEqual(['UNKNOWN_OPTION']);
    expect(errorCodes(['--nope=1'])).toEqual(['UNKNOWN_OPTION']);
    expect(errorCodes(['stray'])).toEqual(['INVALID_ARGUMENTS']);
  });

  it('returns a help result for --help', () => {
    expect(resolveCliOptions(['--help'], {})).toEqual({ ok: true, help: true });
    expect(USAGE_TEXT).toContain('--apply');
    expect(USAGE_TEXT).toContain('--i-have-a-backup');
    expect(USAGE_TEXT).toContain('--delete-originals');
  });

  it('never leaks the token into errors', () => {
    const cases: string[][] = [['--apply'], ['--delete-originals'], ['--nope'], ['--threshold=abc']];
    for (const argv of cases) {
      const result = resolveCliOptions(argv, { SANITY_WRITE_TOKEN: TOKEN });
      expect(JSON.stringify(result)).not.toContain(TOKEN);
    }
    const echoed = resolveCliOptions([`--token=${TOKEN}`], env);
    expect(JSON.stringify(echoed)).not.toContain(TOKEN);
    const spaced = resolveCliOptions(['--token', TOKEN], env);
    expect(JSON.stringify(spaced)).not.toContain(TOKEN);
  });
});

describe('assessDeletionSafety', () => {
  const ids = ['image-a-3000x2000-jpg', 'image-b-4000x3000-jpg'];

  it('is safe only when every count is exactly 0 and nothing failed', () => {
    expect(
      assessDeletionSafety({
        assetIds: ids,
        remainingReferenceCounts: { [ids[0]]: 0, [ids[1]]: 0 },
        failedAssetIds: [],
      }),
    ).toEqual({ safe: true, blockers: [] });
  });

  it('treats an empty candidate list as safe', () => {
    expect(assessDeletionSafety({ assetIds: [], remainingReferenceCounts: {}, failedAssetIds: [] }).safe).toBe(true);
  });

  it('fails closed on a missing or non-numeric count', () => {
    const result = assessDeletionSafety({
      assetIds: ids,
      remainingReferenceCounts: { [ids[0]]: 0, [ids[1]]: undefined },
      failedAssetIds: [],
    });
    expect(result.safe).toBe(false);
    expect(result.blockers.map((blocker) => [blocker.assetId, blocker.code])).toEqual([
      [ids[1], 'UNKNOWN_REFERENCE_COUNT'],
    ]);
    const missing = assessDeletionSafety({ assetIds: ids, remainingReferenceCounts: {}, failedAssetIds: [] });
    expect(missing.blockers).toHaveLength(2);
    const nan = assessDeletionSafety({
      assetIds: [ids[0]],
      remainingReferenceCounts: { [ids[0]]: Number.NaN },
      failedAssetIds: [],
    });
    expect(nan.safe).toBe(false);
  });

  it('blocks on any remaining reference', () => {
    const result = assessDeletionSafety({
      assetIds: ids,
      remainingReferenceCounts: { [ids[0]]: 0, [ids[1]]: 2 },
      failedAssetIds: [],
    });
    expect(result.safe).toBe(false);
    expect(result.blockers).toEqual([expect.objectContaining({ assetId: ids[1], code: 'STILL_REFERENCED' })]);
  });

  it('blocks on a failed replacement even when its count is 0', () => {
    const result = assessDeletionSafety({
      assetIds: ids,
      remainingReferenceCounts: { [ids[0]]: 0, [ids[1]]: 0 },
      failedAssetIds: [ids[0]],
    });
    expect(result.safe).toBe(false);
    expect(result.blockers).toEqual([expect.objectContaining({ assetId: ids[0], code: 'REPLACEMENT_FAILED' })]);
  });
});

describe('redactSecrets and describeError', () => {
  it('replaces every occurrence of every secret with the marker', () => {
    const text = `a ${TOKEN} b ${TOKEN} c other-secret`;
    const out = redactSecrets(text, [TOKEN, 'other-secret']);
    expect(out).not.toContain(TOKEN);
    expect(out).not.toContain('other-secret');
    expect(out.split(REDACTED)).toHaveLength(4);
  });

  it('ignores empty and undefined secrets', () => {
    expect(redactSecrets('hello', ['', undefined, null as unknown as string])).toBe('hello');
  });

  it('redacts secrets that overlap by prefix, longest first', () => {
    expect(redactSecrets('xx abcdef yy', ['abc', 'abcdef'])).toBe(`xx ${REDACTED} yy`);
  });

  it('describes Error objects with the token redacted', () => {
    expect(describeError(new Error(`401 for token ${TOKEN}`), [TOKEN])).not.toContain(TOKEN);
    expect(describeError(new Error('boom'), [TOKEN])).toContain('boom');
  });

  it('stringifies non-Error throwables safely', () => {
    expect(describeError(`plain ${TOKEN}`, [TOKEN])).not.toContain(TOKEN);
    expect(describeError(42, [])).toContain('42');
    expect(typeof describeError(undefined, [])).toBe('string');
    const hostile = {
      toString() {
        throw new Error('nope');
      },
    };
    expect(typeof describeError(hostile, [])).toBe('string');
  });
});

describe('formatDryRunReport', () => {
  const row = {
    asset: {
      _id: OLD_ID,
      originalFilename: 'IMG_0001.jpg',
      mimeType: 'image/jpeg',
      width: 6000,
      height: 4000,
      size: 12 * 1024 * 1024,
    },
    target: { width: 2400, height: 1600 },
    documents: [
      { _id: 'gallery-abc', _type: 'gallery' },
      { _id: 'drafts.edition-def', _type: 'edition' },
    ],
  };

  it('lists file name, current and target dimensions and referencing documents', () => {
    const text = formatDryRunReport({ rows: [row], skipped: [], threshold: 2400 }).join('\n');
    expect(text).toContain('IMG_0001.jpg');
    expect(text).toContain('6000x4000');
    expect(text).toContain('2400x1600');
    expect(text).toContain('gallery-abc');
    expect(text).toContain('gallery');
    expect(text).toContain('drafts.edition-def');
    expect(text).toContain('edition');
    expect(text).toContain('12,0 Mo');
  });

  it('labels an asset with no referencing document as ignored by --apply', () => {
    const text = formatDryRunReport({
      rows: [{ ...row, documents: [] }],
      skipped: [],
      threshold: 2400,
    }).join('\n');
    expect(text).toMatch(/ignor/);
    expect(text).toContain('--apply');
  });

  it('summarises skipped assets and mentions the draft/read-token hint', () => {
    const text = formatDryRunReport({
      rows: [row],
      skipped: [
        { asset: { _id: 'a', mimeType: 'image/svg+xml', width: 5000 }, reason: 'UNSUPPORTED_FORMAT' },
        { asset: { _id: 'b', mimeType: 'image/gif', width: 5000 }, reason: 'UNSUPPORTED_FORMAT' },
        { asset: { _id: 'c', mimeType: 'image/jpeg' }, reason: 'UNKNOWN_DIMENSIONS' },
      ],
      threshold: 2400,
    }).join('\n');
    expect(text).toContain('2 ');
    expect(text).toContain('SANITY_API_READ_TOKEN');
  });

  it('prints a clear nothing-to-do line when there is nothing oversized', () => {
    const lines = formatDryRunReport({ rows: [], skipped: [], threshold: 2400 });
    expect(lines.join('\n')).toContain('Rien à faire');
    expect(lines.join('\n')).toContain('2400');
  });
});

const JPEG_ASSET = {
  _id: 'image-badfea3dd4d4ab5abbf8f09a5556610da89d90b9-13040x9730-jpg',
  mimeType: 'image/jpeg',
  extension: 'jpg',
  url: 'https://cdn.sanity.io/images/gwz8iug4/production/badfea3dd4d4ab5abbf8f09a5556610da89d90b9-13040x9730.jpg',
  width: 13040,
  height: 9730,
};
const JPEG_TARGET = { width: 2400, height: 1791 };
const PNG_ASSET = {
  _id: 'image-cad9b00c5232d9beb80459bfeb40ef95bfc07194-3872x2592-png',
  mimeType: 'image/png',
  extension: 'png',
  url: 'https://cdn.sanity.io/images/gwz8iug4/production/cad9b00c5232d9beb80459bfeb40ef95bfc07194-3872x2592.png',
  width: 3872,
  height: 2592,
};
const PNG_TARGET = { width: 2400, height: 1607 };

function errorCode(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    return (error as { code?: string }).code;
  }
  return undefined;
}

describe('resolveOutputFormat', () => {
  it('decides from the mime type', () => {
    expect(resolveOutputFormat({ _id: 'a', mimeType: 'image/jpeg' })).toEqual({
      mimeType: 'image/jpeg',
      fm: 'jpg',
      sharpFormat: 'jpeg',
    });
    expect(resolveOutputFormat({ _id: 'a', mimeType: 'image/png' })).toEqual({
      mimeType: 'image/png',
      fm: 'png',
      sharpFormat: 'png',
    });
    expect(resolveOutputFormat({ _id: 'a', mimeType: 'image/webp' })).toEqual({
      mimeType: 'image/webp',
      fm: 'webp',
      sharpFormat: 'webp',
    });
  });

  it('trims and lowercases the mime type', () => {
    expect(resolveOutputFormat({ _id: 'a', mimeType: ' IMAGE/JPEG ' }).fm).toBe('jpg');
  });

  it.each([
    ['jpg', 'image/jpeg'],
    ['JPEG', 'image/jpeg'],
    ['png', 'image/png'],
    ['WebP', 'image/webp'],
  ])('falls back to the extension %s when the mime type is missing', (extension, mimeType) => {
    expect(resolveOutputFormat({ _id: 'a', extension }).mimeType).toBe(mimeType);
  });

  it('rejects a mime type and an extension that disagree', () => {
    expect(errorCode(() => resolveOutputFormat({ _id: 'a', mimeType: 'image/png', extension: 'jpg' }))).toBe(
      'UNSUPPORTED_FORMAT',
    );
  });

  it('ignores an unknown extension next to a valid mime type', () => {
    expect(resolveOutputFormat({ _id: 'a', mimeType: 'image/jpeg', extension: 'bin' }).fm).toBe('jpg');
  });

  it('rejects unsupported formats and assets with no format information', () => {
    expect(errorCode(() => resolveOutputFormat({ _id: 'a', mimeType: 'image/gif' }))).toBe('UNSUPPORTED_FORMAT');
    expect(errorCode(() => resolveOutputFormat({ _id: 'a', mimeType: 'image/svg+xml' }))).toBe('UNSUPPORTED_FORMAT');
    expect(errorCode(() => resolveOutputFormat({ _id: 'a', extension: 'tiff' }))).toBe('UNSUPPORTED_FORMAT');
    expect(errorCode(() => resolveOutputFormat({ _id: 'a' }))).toBe('UNSUPPORTED_FORMAT');
  });
});

describe('buildReducedImageUrl', () => {
  it('asks for a JPEG at quality 90', () => {
    expect(buildReducedImageUrl(JPEG_ASSET, 2400)).toBe(`${JPEG_ASSET.url}?w=2400&q=90&fm=jpg`);
  });

  it('asks for a lossless PNG without a quality', () => {
    expect(buildReducedImageUrl(PNG_ASSET, 2400)).toBe(`${PNG_ASSET.url}?w=2400&fm=png`);
  });

  it('asks for a WebP at quality 90', () => {
    const asset = { ...JPEG_ASSET, mimeType: 'image/webp', extension: 'webp', url: JPEG_ASSET.url.replace('.jpg', '.webp') };
    expect(buildReducedImageUrl(asset, 2400)).toBe(`${asset.url}?w=2400&fm=webp&q=90`);
  });

  it('uses the given target width', () => {
    expect(buildReducedImageUrl(JPEG_ASSET, 3000)).toContain('?w=3000&');
  });

  it('decides the format from the extension when the mime type is missing', () => {
    const { mimeType: _mimeType, ...noMime } = PNG_ASSET;
    expect(buildReducedImageUrl(noMime, 2400)).toBe(`${PNG_ASSET.url}?w=2400&fm=png`);
  });

  it('rejects conflicting and unsupported formats', () => {
    expect(errorCode(() => buildReducedImageUrl({ ...JPEG_ASSET, extension: 'png' }, 2400))).toBe('UNSUPPORTED_FORMAT');
    expect(errorCode(() => buildReducedImageUrl({ ...JPEG_ASSET, mimeType: 'image/gif' }, 2400))).toBe(
      'UNSUPPORTED_FORMAT',
    );
    expect(errorCode(() => buildReducedImageUrl({ ...JPEG_ASSET, mimeType: 'image/svg+xml' }, 2400))).toBe(
      'UNSUPPORTED_FORMAT',
    );
    const { mimeType: _mimeType, ...noMime } = JPEG_ASSET;
    expect(errorCode(() => buildReducedImageUrl({ ...noMime, extension: 'tiff' }, 2400))).toBe('UNSUPPORTED_FORMAT');
  });

  it('rejects a missing, empty or unparsable url', () => {
    const { url: _url, ...noUrl } = JPEG_ASSET;
    expect(errorCode(() => buildReducedImageUrl(noUrl, 2400))).toBe('MISSING_URL');
    expect(errorCode(() => buildReducedImageUrl({ ...JPEG_ASSET, url: '' }, 2400))).toBe('MISSING_URL');
    expect(errorCode(() => buildReducedImageUrl({ ...JPEG_ASSET, url: 'not a url' }, 2400))).toBe('MISSING_URL');
  });

  it('drops any query string or fragment already on the asset url', () => {
    const url = buildReducedImageUrl({ ...JPEG_ASSET, url: `${JPEG_ASSET.url}?q=100&dl=x#frag` }, 2400);
    expect(url).toBe(`${JPEG_ASSET.url}?w=2400&q=90&fm=jpg`);
  });

  it('never asks for automatic format negotiation or a download', () => {
    for (const asset of [JPEG_ASSET, PNG_ASSET]) {
      const url = buildReducedImageUrl(asset, 2400);
      expect(url).not.toContain('auto=');
      expect(url).not.toContain('dl=');
    }
  });

  it.each([0, -1, 2400.5, Number.NaN, Number.POSITIVE_INFINITY, '2400'])('rejects the target width %j', (width) => {
    expect(() => buildReducedImageUrl(JPEG_ASSET, width as number)).toThrow(RangeError);
  });
});

describe('validateReducedImage', () => {
  const good = { format: 'jpeg', width: 2400, height: 1791 };

  function validate(overrides: Record<string, unknown> = {}) {
    return validateReducedImage({
      expectedMimeType: 'image/jpeg',
      contentType: 'image/jpeg',
      decoded: good,
      target: JPEG_TARGET,
      ...overrides,
    } as Parameters<typeof validateReducedImage>[0]);
  }

  function failureCode(overrides: Record<string, unknown> = {}): string | undefined {
    const result = validate(overrides);
    return result.ok ? undefined : result.code;
  }

  it('accepts an exact match', () => {
    expect(validate()).toEqual({ ok: true });
    expect(HEIGHT_TOLERANCE_PX).toBe(1);
  });

  it('compares the content type case-insensitively and ignores parameters', () => {
    expect(validate({ contentType: 'IMAGE/JPEG; charset=binary' })).toEqual({ ok: true });
  });

  it('rejects a wrong or missing content type, even when nothing decoded', () => {
    expect(failureCode({ contentType: 'text/html' })).toBe('CONTENT_TYPE_MISMATCH');
    expect(failureCode({ contentType: null })).toBe('CONTENT_TYPE_MISMATCH');
    expect(failureCode({ contentType: 'text/html', decoded: null })).toBe('CONTENT_TYPE_MISMATCH');
  });

  it('rejects an undecodable image', () => {
    expect(failureCode({ decoded: null })).toBe('UNDECODABLE');
    expect(failureCode({ decoded: { format: 'jpeg', width: 0, height: 1791 } })).toBe('UNDECODABLE');
    expect(failureCode({ decoded: { format: 'jpeg', width: 2400, height: Number.NaN } })).toBe('UNDECODABLE');
    expect(failureCode({ decoded: { format: 'jpeg', width: 2400 } })).toBe('UNDECODABLE');
  });

  it('rejects a decoded format that differs from the expected one', () => {
    expect(failureCode({ decoded: { ...good, format: 'png' } })).toBe('FORMAT_MISMATCH');
    expect(failureCode({ decoded: { ...good, format: undefined } })).toBe('FORMAT_MISMATCH');
    expect(
      failureCode({
        expectedMimeType: 'image/webp',
        contentType: 'image/webp',
        decoded: { ...good, format: 'webp' },
      }),
    ).toBeUndefined();
  });

  it('requires the exact width', () => {
    expect(failureCode({ decoded: { ...good, width: 2399 } })).toBe('DIMENSIONS_MISMATCH');
    expect(failureCode({ decoded: { ...good, width: 2401 } })).toBe('DIMENSIONS_MISMATCH');
  });

  it('tolerates a height off by 1 px in both directions but not by 2 px', () => {
    expect(failureCode({ decoded: { ...good, height: 1790 } })).toBeUndefined();
    expect(failureCode({ decoded: { ...good, height: 1792 } })).toBeUndefined();
    expect(failureCode({ decoded: { ...good, height: 1789 } })).toBe('DIMENSIONS_MISMATCH');
    expect(failureCode({ decoded: { ...good, height: 1793 } })).toBe('DIMENSIONS_MISMATCH');
  });

  it('shows the received and the expected size in a dimensions failure', () => {
    const result = validate({ decoded: { ...good, width: 2000, height: 1500 } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('2000x1500');
      expect(result.message).toContain('2400x1791');
    }
  });

  it('never throws on hostile input', () => {
    expect(() => validate({ decoded: undefined, contentType: undefined })).not.toThrow();
  });
});

describe('fetchReducedImage', () => {
  type StubOptions = { ok?: boolean; status?: number; contentType?: string | null; bytes?: Uint8Array };

  function stubResponse({ ok = true, status = 200, contentType = 'image/jpeg', bytes = new Uint8Array([1, 2, 3, 4]) }: StubOptions = {}) {
    return {
      ok,
      status,
      headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
      arrayBuffer: async (): Promise<ArrayBuffer> => {
        const copy = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(copy).set(bytes);
        return copy;
      },
    };
  }

  function setup(response: ReturnType<typeof stubResponse>, decoded: unknown = { format: 'jpeg', width: 2400, height: 1791 }) {
    const urls: string[] = [];
    const seen: Buffer[] = [];
    const fetchImpl = async (url: string) => {
      urls.push(url);
      return response;
    };
    const decodeImage = async (data: Buffer) => {
      seen.push(data);
      if (decoded instanceof Error) throw decoded;
      return decoded as { format?: string; width?: number; height?: number };
    };
    return { urls, seen, fetchImpl, decodeImage };
  }

  async function rejectionCode(promise: Promise<unknown>): Promise<string | undefined> {
    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(ReducedImageError);
      return (error as ReducedImageError).code;
    }
    return undefined;
  }

  it('returns the received bytes unchanged with the decoded size', async () => {
    const bytes = new Uint8Array([9, 8, 7, 6, 5]);
    const { urls, seen, fetchImpl, decodeImage } = setup(stubResponse({ bytes }));
    const result = await fetchReducedImage({ asset: JPEG_ASSET, target: JPEG_TARGET, fetchImpl, decodeImage });
    expect(urls).toEqual([`${JPEG_ASSET.url}?w=2400&q=90&fm=jpg`]);
    expect(Buffer.isBuffer(result.data)).toBe(true);
    expect([...result.data]).toEqual([...bytes]);
    expect(result).toMatchObject({ mimeType: 'image/jpeg', width: 2400, height: 1791 });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(result.data);
  });

  it('works for a PNG', async () => {
    const { urls, fetchImpl, decodeImage } = setup(stubResponse({ contentType: 'image/png' }), {
      format: 'png',
      width: 2400,
      height: 1607,
    });
    const result = await fetchReducedImage({ asset: PNG_ASSET, target: PNG_TARGET, fetchImpl, decodeImage });
    expect(urls).toEqual([`${PNG_ASSET.url}?w=2400&fm=png`]);
    expect(result.mimeType).toBe('image/png');
  });

  it('rejects an HTTP error without decoding', async () => {
    const { seen, fetchImpl, decodeImage } = setup(stubResponse({ ok: false, status: 404 }));
    const code = await rejectionCode(fetchReducedImage({ asset: JPEG_ASSET, target: JPEG_TARGET, fetchImpl, decodeImage }));
    expect(code).toBe('HTTP_ERROR');
    expect(seen).toHaveLength(0);
  });

  it('rejects a wrong content type even if the decoder would also fail', async () => {
    const { fetchImpl, decodeImage } = setup(stubResponse({ contentType: 'text/html' }), new Error('not an image'));
    const code = await rejectionCode(fetchReducedImage({ asset: JPEG_ASSET, target: JPEG_TARGET, fetchImpl, decodeImage }));
    expect(code).toBe('CONTENT_TYPE_MISMATCH');
  });

  it('rejects bytes the decoder cannot read', async () => {
    const { fetchImpl, decodeImage } = setup(stubResponse(), new Error('truncated'));
    const code = await rejectionCode(fetchReducedImage({ asset: JPEG_ASSET, target: JPEG_TARGET, fetchImpl, decodeImage }));
    expect(code).toBe('UNDECODABLE');
  });

  it('rejects a wrong decoded format', async () => {
    const { fetchImpl, decodeImage } = setup(stubResponse(), { format: 'png', width: 2400, height: 1791 });
    const code = await rejectionCode(fetchReducedImage({ asset: JPEG_ASSET, target: JPEG_TARGET, fetchImpl, decodeImage }));
    expect(code).toBe('FORMAT_MISMATCH');
  });

  it('rejects wrong dimensions', async () => {
    const { fetchImpl, decodeImage } = setup(stubResponse(), { format: 'jpeg', width: 2400, height: 1500 });
    const code = await rejectionCode(fetchReducedImage({ asset: JPEG_ASSET, target: JPEG_TARGET, fetchImpl, decodeImage }));
    expect(code).toBe('DIMENSIONS_MISMATCH');
  });

  it('rejects an unsupported asset before any request', async () => {
    const { urls, fetchImpl, decodeImage } = setup(stubResponse());
    const code = await rejectionCode(
      fetchReducedImage({ asset: { ...JPEG_ASSET, mimeType: 'image/gif' }, target: JPEG_TARGET, fetchImpl, decodeImage }),
    );
    expect(code).toBe('UNSUPPORTED_FORMAT');
    expect(urls).toHaveLength(0);
  });

  it('lets a failure of fetch itself propagate unchanged', async () => {
    const boom = new Error('network down');
    const fetchImpl = async () => {
      throw boom;
    };
    const decodeImage = async () => ({ format: 'jpeg', width: 2400, height: 1791 });
    await expect(fetchReducedImage({ asset: JPEG_ASSET, target: JPEG_TARGET, fetchImpl, decodeImage })).rejects.toBe(boom);
  });
});

describe('CLI source guard', () => {
  const source = readFileSync('scripts/sanity-downsize-images.mjs', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('requests the reduced image before uploading, and uploads exactly the validated bytes', () => {
    const fetchCall = source.indexOf('fetchReducedImage(');
    const upload = source.indexOf('assets.upload(');
    expect(fetchCall).toBeGreaterThan(-1);
    expect(upload).toBeGreaterThan(fetchCall);
    expect(source).toMatch(/assets\.upload\(\s*'image',\s*reduced\.data,/);
    expect(source).toContain('contentType: reduced.mimeType');
  });

  it.each(['resize', 'rotate', 'keepIccProfile', 'jpeg', 'png', 'webp', 'toBuffer'])(
    'never calls the sharp method %s',
    (method) => {
      expect(source).not.toMatch(new RegExp(`\\.${method}\\s*\\(`));
    },
  );
});

describe('docs contract', () => {
  const runbook = readFileSync('docs/reduction-images-sanity.md', 'utf8');
  const readme = readFileSync('README.md', 'utf8');

  it.each(['sanity dataset export', '--i-have-a-backup', '--apply', '--delete-originals', 'Lightroom', 'CDN'])(
    'the runbook mentions %s',
    (needle) => {
      expect(runbook).toContain(needle);
    },
  );

  it('the runbook orders backup, dry-run, apply, then deletion', () => {
    const backup = runbook.indexOf('sanity dataset export');
    const apply = runbook.indexOf('--apply --i-have-a-backup');
    const del = runbook.indexOf('--delete-originals');
    expect(backup).toBeGreaterThan(-1);
    expect(apply).toBeGreaterThan(backup);
    expect(del).toBeGreaterThan(apply);
  });

  it('the README links to the runbook and names the write token', () => {
    expect(readme).toContain('docs/reduction-images-sanity.md');
    expect(readme).toContain('SANITY_WRITE_TOKEN');
    expect(readme).toContain('sanity:downsize-images');
  });
});
