import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {MediaLibrary} from '../MediaLibrary'
import {createSanityTestClient, deferred} from '../test/mocks'

function asset(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'asset-1',
    originalFilename: 'photo.jpg',
    sha1hash: 'hash-1',
    url: 'https://cdn.example/photo.jpg',
    usageCount: 1,
    metadata: {dimensions: {width: 800, height: 600}},
    ...overrides,
  }
}

function gallery(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'gallery-1',
    title: 'Collection A',
    images: [{_key: 'img-1', assetId: 'asset-1', alt: {fr: 'Une photo', en: 'A photo'}}],
    ...overrides,
  }
}

describe('MediaLibrary lifecycle', () => {
  it('shows a loading state, then renders metrics from the load', async () => {
    const inventory = deferred<{assets: unknown[]; galleries: unknown[]}>()
    createSanityTestClient(() => inventory.promise)

    render(<MediaLibrary />)
    expect(screen.getByRole('status')).toBeTruthy()

    await inventory.resolve({assets: [asset()], galleries: [gallery()]})

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(screen.getByText('Images')).toBeTruthy()
    // One asset, zero missing descriptions (both locales present), zero
    // unused (usageCount 1), zero reused (only referenced by one gallery).
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })

  it('shows an error on load failure and recovers via the retry button', async () => {
    const client = createSanityTestClient(() =>
      Promise.reject(new Error('Sanity indisponible')),
    )
    render(<MediaLibrary />)

    await screen.findByText(/Impossible de charger la médiathèque/)
    expect(screen.getByText(/Sanity indisponible/)).toBeTruthy()

    client.fetch.mockImplementation(() =>
      Promise.resolve({assets: [asset()], galleries: [gallery()]}),
    )
    fireEvent.click(screen.getByRole('button', {name: 'Actualiser'}))

    await waitFor(() =>
      expect(screen.queryByText(/Impossible de charger la médiathèque/)).toBeNull(),
    )
    expect(screen.getByText('Images')).toBeTruthy()
    expect(client.fetch).toHaveBeenCalledTimes(2)
  })

  it('switches sections and reflects missing-description, unused and reused filters', async () => {
    const galleries = [
      gallery({
        _id: 'gallery-1',
        title: 'Collection A',
        images: [
          {_key: 'img-1', assetId: 'asset-1', alt: {fr: '', en: ''}},
          {_key: 'img-2', assetId: 'asset-2', alt: {fr: 'ok', en: 'ok'}},
        ],
      }),
      gallery({
        _id: 'gallery-2',
        title: 'Collection B',
        images: [{_key: 'img-3', assetId: 'asset-2', alt: {fr: 'ok', en: 'ok'}}],
      }),
    ]
    const assets = [
      asset({_id: 'asset-1', originalFilename: 'missing-alt.jpg'}),
      asset({_id: 'asset-2', originalFilename: 'shared.jpg', usageCount: 2}),
      asset({_id: 'asset-3', originalFilename: 'orphan.jpg', usageCount: 0}),
    ]
    createSanityTestClient(() => Promise.resolve({assets, galleries}))

    render(<MediaLibrary />)
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())

    // Descriptions tab is the default: the image missing both FR/EN alts.
    expect(screen.getByText('Photo 1')).toBeTruthy()
    expect(screen.getByText('FR manquant')).toBeTruthy()
    expect(screen.getByText('EN manquant')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', {name: /Inutilisées/}))
    expect(screen.getByText('orphan.jpg')).toBeTruthy()
    expect(screen.queryByText('missing-alt.jpg')).toBeNull()

    fireEvent.click(screen.getByRole('button', {name: /Réutilisées/}))
    expect(screen.getByText('shared.jpg')).toBeTruthy()
    expect(screen.getByText('Collection A')).toBeTruthy()
    expect(screen.getByText('Collection B')).toBeTruthy()
  })

  it('never throws or leaves an unhandled rejection when the load settles after unmount', async () => {
    // React 19's createRoot-based unmount silently drops state updates on a
    // torn-down root, so a stale setState is no longer *observable* as a
    // console warning the way it was on legacy roots. What remains
    // genuinely provable — and what would break if refresh()'s promise
    // chain lost its mountedRef guard and someone re-threw inside a
    // .then/.catch — is that settling after unmount produces no thrown
    // error and no unhandled rejection.
    const rejections: unknown[] = []
    const onUnhandledRejection = (event: {reason: unknown}) => rejections.push(event.reason)
    process.on('unhandledRejection', onUnhandledRejection as never)

    const initialLoad = deferred<{assets: unknown[]; galleries: unknown[]}>()
    createSanityTestClient(() => initialLoad.promise)
    const view = render(<MediaLibrary />)
    view.unmount()
    expect(() => initialLoad.resolve({assets: [], galleries: []})).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const retryFailure = deferred<never>()
    createSanityTestClient(() => retryFailure.promise)
    const secondView = render(<MediaLibrary />)
    fireEvent.click(secondView.getByRole('button', {name: 'Actualiser'}))
    secondView.unmount()
    expect(() => retryFailure.reject(new Error('après démontage'))).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))

    process.off('unhandledRejection', onUnhandledRejection as never)
    expect(rejections).toEqual([])
  })
})
