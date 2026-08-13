import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {CreditsManager} from '../CreditsManager'
import {createSanityTestClient, deferred, sanityTestState} from '../test/mocks'

function galleryDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'gallery-1',
    _type: 'gallery',
    title: 'Collection A',
    images: [{_key: 'img-1', rights: {}}],
    ...overrides,
  }
}

describe('CreditsManager lifecycle', () => {
  it('loads galleries and pre-selects only collections with incomplete credits', async () => {
    createSanityTestClient(() =>
      Promise.resolve([
        galleryDoc({_id: 'drafts.gallery-1', title: 'Incomplète', images: [{_key: 'i1', rights: {}}]}),
        galleryDoc({
          _id: 'gallery-2',
          title: 'Complète',
          images: [
            {
              _key: 'i2',
              rights: {credit: 'Romane', copyrightNotice: '© Romane', usage: 'allRightsReserved'},
            },
          ],
        }),
      ]),
    )

    render(<CreditsManager />)

    await screen.findByText('Incomplète')
    expect(screen.getByText('Complète')).toBeTruthy()

    // getAllByRole('checkbox')[0] is the bulk "Afficher le crédit sur le
    // site" switch; the gallery rows (sorted "Complète" then "Incomplète")
    // start at index 1.
    const [, ...rowCheckboxes] = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(rowCheckboxes).toHaveLength(2)
    expect(rowCheckboxes[0].checked).toBe(false)
    expect(rowCheckboxes[1].checked).toBe(true)
    expect(screen.getByText('1 à compléter')).toBeTruthy()
    expect(screen.getByText('Complet')).toBeTruthy()
  })

  it('creates a draft only when needed and patches only the selected rows', async () => {
    const client = createSanityTestClient(() =>
      Promise.resolve([
        // Published-only gallery: applying credits must seed a draft first.
        galleryDoc({_id: 'gallery-1', title: 'Sans brouillon', images: [{_key: 'i1', rights: {}}]}),
        galleryDoc({
          _id: 'drafts.gallery-2',
          title: 'Déjà complète',
          images: [
            {
              _key: 'i2',
              rights: {credit: 'Romane', copyrightNotice: '© Romane', usage: 'allRightsReserved'},
            },
          ],
        }),
      ]),
    )
    const transaction = client.transaction()

    render(<CreditsManager />)
    await screen.findByText('Sans brouillon')

    // Only the incomplete row ("Sans brouillon") is pre-selected; the
    // complete row stays unchecked and must not be touched.
    fireEvent.click(screen.getByRole('button', {name: 'Appliquer à 1 collection (1 photos)'}))

    await waitFor(() => expect(sanityTestState.toastPush).toHaveBeenCalledOnce())
    expect(transaction.createIfNotExists).toHaveBeenCalledOnce()
    expect(transaction.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({_id: 'drafts.gallery-1'}),
    )
    expect(transaction.patch).toHaveBeenCalledOnce()
    expect(transaction.patch).toHaveBeenCalledWith(
      'drafts.gallery-1',
      expect.objectContaining({
        set: expect.objectContaining({
          images: [expect.objectContaining({rights: expect.objectContaining({credit: 'Romane Lepont'})})],
        }),
      }),
    )
    expect(transaction.commit).toHaveBeenCalledOnce()
    const [toastArgs] = sanityTestState.toastPush.mock.calls[0]
    expect(toastArgs.status).toBe('success')
  })

  it('shows a commit error and succeeds on retry without duplicating the request', async () => {
    const client = createSanityTestClient(() =>
      Promise.resolve([galleryDoc({_id: 'drafts.gallery-1', images: [{_key: 'i1', rights: {}}]})]),
    )
    const transaction = client.transaction()
    transaction.commit
      .mockRejectedValueOnce(new Error('Réseau indisponible'))
      .mockResolvedValueOnce({})

    render(<CreditsManager />)
    await screen.findByText('1 photo')

    const applyButton = () => screen.getByRole('button', {name: /Appliquer à/})
    fireEvent.click(applyButton())

    await waitFor(() => expect(sanityTestState.toastPush).toHaveBeenCalledTimes(1))
    expect(sanityTestState.toastPush.mock.calls[0][0]).toMatchObject({
      status: 'error',
      description: 'Réseau indisponible',
    })

    fireEvent.click(applyButton())

    await waitFor(() => expect(sanityTestState.toastPush).toHaveBeenCalledTimes(2))
    expect(sanityTestState.toastPush.mock.calls[1][0]).toMatchObject({status: 'success'})
    expect(transaction.commit).toHaveBeenCalledTimes(2)
  })

  it('toggling a row selection changes what a subsequent apply would patch', async () => {
    createSanityTestClient(() =>
      Promise.resolve([
        galleryDoc({_id: 'drafts.gallery-1', title: 'A', images: [{_key: 'i1', rights: {}}]}),
        galleryDoc({_id: 'drafts.gallery-2', title: 'B', images: [{_key: 'i2', rights: {}}]}),
      ]),
    )

    render(<CreditsManager />)
    await screen.findByText('A')

    // Both start selected (both incomplete). getAllByRole('checkbox')[0] is
    // the bulk "Afficher le crédit sur le site" switch, not a row — the
    // gallery rows (sorted "A" then "B") start at index 1.
    expect(screen.getByText('Appliquer à 2 collections (2 photos)')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('checkbox')[1])
    expect(screen.getByText('Appliquer à 1 collection (1 photos)')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', {name: 'Tout désélectionner'}))
    const applyButton = screen.getByRole('button', {name: /Appliquer à/}) as HTMLButtonElement
    expect(applyButton.disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', {name: 'Tout sélectionner'}))
    expect(screen.getByText('Appliquer à 2 collections (2 photos)')).toBeTruthy()
  })

  it('cancels its in-flight load on unmount without throwing', async () => {
    const pending = deferred<unknown[]>()
    createSanityTestClient(() => pending.promise)

    const view = render(<CreditsManager />)
    view.unmount()

    expect(() => pending.resolve([galleryDoc()])).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
})
