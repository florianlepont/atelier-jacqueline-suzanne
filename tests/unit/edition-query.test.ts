import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// RED (Wave 0): src/lib/sanity.ts's getEditions/getEdition exports do not
// exist yet — they are built in Plan 12-01 Task 2. Importing them now yields
// `undefined`, so calling them throws ("is not a function") — this is the
// intended failing state for this task; do not stub or weaken these
// assertions to make them pass early.

// sanity.ts throws at module-load time if these are unset — stub them before
// any import of the module under test so the import itself doesn't blow up.
process.env.SANITY_PROJECT_ID ??= 'test-project';
process.env.SANITY_DATASET ??= 'test-dataset';

const fetchMock = vi.fn();

vi.mock('@sanity/client', () => ({
  createClient: () => ({ fetch: fetchMock }),
}));

describe('getEditions', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the array fetch resolves', async () => {
    const editions = [
      {
        title: 'Rebut',
        slug: 'rebut',
        statement: { fr: 'a', en: 'b' },
        leadPhoto: { asset: { _ref: 'image-abc' }, alt: { fr: 'x', en: 'y' } },
        images: [],
        pageCount: 50,
        printRun: 2,
        dimensions: { width: 21, height: 29.7, unit: 'cm' },
      },
    ];
    fetchMock.mockResolvedValueOnce(editions);

    const { getEditions } = await import('../../src/lib/sanity');
    const result = await getEditions();

    expect(result).toEqual(editions);
  });

  it('resolves to [] when fetch resolves null', async () => {
    fetchMock.mockResolvedValueOnce(null);
    const { getEditions } = await import('../../src/lib/sanity');
    await expect(getEditions()).resolves.toEqual([]);
  });

  it('fetches with a GROQ query ordered by orderRank', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('order(orderRank)'));
  });

  it('filters on publicationStatus == "published"', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('publicationStatus == "published"'),
    );
  });

  it('does not reference isVisible (edition has no such field — Pitfall 1)', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();

    expect(fetchMock).toHaveBeenCalledWith(expect.not.stringContaining('isVisible'));
    const queryArg = fetchMock.mock.calls[0][0] as string;
    expect(queryArg).not.toContain('isVisible');
  });

  it('does not reference a seo field (edition has no such field — Pitfall 3)', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();

    const queryArg = fetchMock.mock.calls[0][0] as string;
    expect(queryArg).not.toContain('seo');
  });

  it('projects leadPhoto', async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('leadPhoto'));
  });

  it('projects images', async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('images'));
  });

  it('projects pageCount', async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('pageCount'));
  });

  it('projects printRun', async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('printRun'));
  });

  it('projects dimensions', async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { getEditions } = await import('../../src/lib/sanity');
    await getEditions();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('dimensions'));
  });
});

describe('getEdition', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when fetch resolves null', async () => {
    fetchMock.mockResolvedValueOnce(null);

    const { getEdition } = await import('../../src/lib/sanity');
    const result = await getEdition('rebut');

    expect(result).toBeNull();
  });

  it('returns null when fetch resolves undefined', async () => {
    fetchMock.mockResolvedValueOnce(undefined);

    const { getEdition } = await import('../../src/lib/sanity');
    const result = await getEdition('rebut');

    expect(result).toBeNull();
  });

  it('fetches with a GROQ query matching slug.current == $slug and a bound slug parameter', async () => {
    fetchMock.mockResolvedValueOnce(null);

    const { getEdition } = await import('../../src/lib/sanity');
    await getEdition('rebut');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('slug.current == $slug'), {
      slug: 'rebut',
    });
  });
});
