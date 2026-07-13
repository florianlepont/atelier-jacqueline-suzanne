import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// RED (Wave 0): src/lib/sanity.ts's getGalleries/getGallery exports do not
// exist yet — they are built in Plan 02-01 Task 3. Importing them now yields
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

describe('getGalleries', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the array fetch resolves', async () => {
    const galleries = [
      { title: 'Rebut', slug: 'rebut', statement: { fr: 'a', en: 'b' }, images: [] },
    ];
    fetchMock.mockResolvedValueOnce(galleries);

    const { getGalleries } = await import('../../src/lib/sanity');
    const result = await getGalleries();

    expect(result).toEqual(galleries);
  });

  it('fetches with a GROQ query ordered by orderRank', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getGalleries } = await import('../../src/lib/sanity');
    await getGalleries();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('order(orderRank)'));
  });

  it('projects the collection design-system hero color key', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getGalleries } = await import('../../src/lib/sanity');
    await getGalleries();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('statement, heroColor, images'),
    );
  });
});

describe('getGallery', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when fetch resolves null (WR-03 null-safety)', async () => {
    fetchMock.mockResolvedValueOnce(null);

    const { getGallery } = await import('../../src/lib/sanity');
    const result = await getGallery('rebut');

    expect(result).toBeNull();
  });

  it('returns null when fetch resolves undefined (WR-03 null-safety)', async () => {
    fetchMock.mockResolvedValueOnce(undefined);

    const { getGallery } = await import('../../src/lib/sanity');
    const result = await getGallery('rebut');

    expect(result).toBeNull();
  });

  it('fetches with a GROQ query matching slug.current == $slug', async () => {
    fetchMock.mockResolvedValueOnce(null);

    const { getGallery } = await import('../../src/lib/sanity');
    await getGallery('rebut');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('slug.current == $slug'),
      { slug: 'rebut' },
    );
  });
});
