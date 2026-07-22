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
      {
        title: 'Rebut',
        slug: 'rebut',
        statement: { fr: 'a', en: 'b' },
        images: [],
      },
    ];
    fetchMock.mockResolvedValueOnce(galleries);

    const { getGalleries } = await import('../../src/lib/sanity');
    const result = await getGalleries();

    expect(result).toEqual(galleries);
  });

  it('returns an empty deterministic fixture when Sanity has no galleries', async () => {
    fetchMock.mockResolvedValueOnce(null);
    const { getGalleries } = await import('../../src/lib/sanity');
    await expect(getGalleries()).resolves.toEqual([]);
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

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('statement, heroColor'));
  });

  it('projects whether a collection is selected for the homepage', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getGalleries } = await import('../../src/lib/sanity');
    await getGalleries();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('showOnHomePage'));
  });

  it('excludes collections explicitly hidden in Sanity', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const { getGalleries } = await import('../../src/lib/sanity');
    await getGalleries();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('publicationStatus'));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('isVisible == false'));
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

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('slug.current == $slug'), {
      slug: 'rebut',
    });
  });
});

describe('getAboutPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns null safely when the singleton is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(undefined);

    const { getAboutPage } = await import('../../src/lib/sanity');
    await expect(getAboutPage()).resolves.toBeNull();
  });

  it('queries the fixed aboutPage singleton', async () => {
    fetchMock.mockResolvedValueOnce(null);

    const { getAboutPage } = await import('../../src/lib/sanity');
    await getAboutPage();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('_id == "aboutPage"'));
  });
});

describe('getHomePage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns null safely when the singleton is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(undefined);

    const { getHomePage } = await import('../../src/lib/sanity');
    await expect(getHomePage()).resolves.toBeNull();
  });

  it('queries the fixed homePage singleton', async () => {
    fetchMock.mockResolvedValueOnce(null);

    const { getHomePage } = await import('../../src/lib/sanity');
    await getHomePage();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('_id == "homePage"'));
  });
});

describe('getContactPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('queries the fixed Contact page singleton', async () => {
    fetchMock.mockResolvedValueOnce(null);

    const { getContactPage } = await import('../../src/lib/sanity');
    await getContactPage();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('_id == "contactPage"'));
  });
});

describe('getSiteSettings', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns null safely when the singleton is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(undefined);
    const {getSiteSettings} = await import('../../src/lib/sanity');
    await expect(getSiteSettings()).resolves.toBeNull();
  });

  it('queries the fixed siteSettings singleton', async () => {
    fetchMock.mockResolvedValueOnce(null);
    const {getSiteSettings} = await import('../../src/lib/sanity');
    await getSiteSettings();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('_type == "siteSettings"'));
  });
});
