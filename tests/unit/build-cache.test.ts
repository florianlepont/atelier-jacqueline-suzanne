import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  createBuildCacheKey,
  getBuildCached,
  resetBuildCacheForTests,
  setBuildCacheEnabledForTests,
} from '../../src/lib/build-cache'

afterEach(() => {
  resetBuildCacheForTests()
})

describe('production build promise cache', () => {
  it('shares concurrent and settled reads for an identical stable key', async () => {
    setBuildCacheEnabledForTests(true)
    const load = vi.fn(async () => ({title: 'Rebut'}))

    const first = getBuildCached('getGallery', {slug: 'rebut'}, load)
    const second = getBuildCached('getGallery', {slug: 'rebut'}, load)

    expect(first).toBe(second)
    await expect(Promise.all([first, second])).resolves.toEqual([
      {title: 'Rebut'},
      {title: 'Rebut'},
    ])
    await expect(getBuildCached('getGallery', {slug: 'rebut'}, load)).resolves.toEqual({
      title: 'Rebut',
    })
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('keeps getter names and stable parameters isolated', async () => {
    setBuildCacheEnabledForTests(true)
    const load = vi.fn(async () => 'value')

    await getBuildCached('getGallery', {slug: 'rebut'}, load)
    await getBuildCached('getGallery', {slug: 'silos'}, load)
    await getBuildCached('getEdition', {slug: 'rebut'}, load)

    expect(load).toHaveBeenCalledTimes(3)
    expect(createBuildCacheKey('query', {b: 2, a: 1})).toBe(
      createBuildCacheKey('query', {a: 1, b: 2}),
    )
  })

  it('bypasses the cache in development and tests', async () => {
    setBuildCacheEnabledForTests(false)
    const load = vi.fn(async () => 'fresh')

    await getBuildCached('getHomePage', null, load)
    await getBuildCached('getHomePage', null, load)

    expect(load).toHaveBeenCalledTimes(2)
  })

  it('evicts a rejected promise so the next call retries', async () => {
    setBuildCacheEnabledForTests(true)
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary Sanity outage'))
      .mockResolvedValueOnce('recovered')

    await expect(getBuildCached('getSiteSettings', null, load)).rejects.toThrow(
      'temporary Sanity outage',
    )
    await expect(getBuildCached('getSiteSettings', null, load)).resolves.toBe('recovered')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('caches a successful null like any other stable result', async () => {
    setBuildCacheEnabledForTests(true)
    const load = vi.fn(async () => null)

    await expect(getBuildCached('getAboutPage', null, load)).resolves.toBeNull()
    await expect(getBuildCached('getAboutPage', null, load)).resolves.toBeNull()
    expect(load).toHaveBeenCalledTimes(1)
  })
})
