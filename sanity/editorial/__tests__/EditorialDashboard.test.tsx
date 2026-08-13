import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {getRecentDeployments} from '../deployment'
import {EditorialDashboard} from '../EditorialDashboard'
import {
  createSanityTestClient,
  deferred,
  sanityTestState,
} from '../test/mocks'

vi.mock('../deployment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../deployment')>()
  return {...actual, getRecentDeployments: vi.fn(() => Promise.resolve([]))}
})

const homepageDraft = (revision = 'draft-r1') => ({
  _id: 'drafts.homePage',
  _type: 'homePage',
  _rev: revision,
  _updatedAt: '2026-08-11T10:00:00.000Z',
  intro: {fr: 'Bienvenue', en: 'Welcome'},
})

function dashboardClient({
  inventories = [[homepageDraft()]],
  action = () => Promise.resolve({}),
  timestamps = () =>
    Promise.resolve([{_id: 'homePage', _updatedAt: '2026-08-11T10:05:00.000Z'}]),
}: {
  inventories?: Array<Array<Record<string, unknown>> | Promise<Array<Record<string, unknown>>>>
  action?: () => Promise<unknown>
  timestamps?: () => Promise<Array<{_id: string; _updatedAt: string}>>
} = {}) {
  let inventoryIndex = 0
  const client = createSanityTestClient((query) => {
    if (query.includes("_id == 'siteDeployment'")) return Promise.resolve(null)
    if (query.includes('_id in $ids')) return timestamps()
    const next = inventories[Math.min(inventoryIndex, inventories.length - 1)] ?? []
    inventoryIndex += 1
    return Promise.resolve(next)
  })
  client.action.mockImplementation(action)
  return client
}

async function openPublicationConfirmation() {
  await screen.findAllByText("Page d'accueil")
  fireEvent.click(screen.getByRole('button', {name: 'Publier'}))
  await screen.findByText('Publier maintenant sur le site public ?')
}

describe('EditorialDashboard lifecycle', () => {
  beforeEach(() => {
    vi.mocked(getRecentDeployments).mockResolvedValue([])
  })

  it('renders the inventory without waiting for the supplementary history request', async () => {
    const inventory = deferred<Array<Record<string, unknown>>>()
    const history = deferred<never[]>()
    createSanityTestClient((query) =>
      query.includes('_type in $types') ? inventory.promise : Promise.resolve([]),
    )
    sanityTestState.historyStore.getTransactions.mockReturnValue(history.promise)

    render(<EditorialDashboard />)
    expect(screen.getByText('Chargement…')).toBeTruthy()

    await act(async () => inventory.resolve([homepageDraft()]))

    await waitFor(() => expect(screen.queryByText('Chargement…')).toBeNull())
    expect(screen.getAllByText("Page d'accueil").length).toBeGreaterThan(0)
  })

  it('shows the first inventory failure with its technical detail', async () => {
    createSanityTestClient(() => Promise.reject(new Error('Sanity indisponible')))

    render(<EditorialDashboard />)

    await screen.findByText(/n’a pas pu se charger/)
    expect(screen.getByText('Sanity indisponible')).toBeTruthy()
  })

  it('debounces realtime refresh, keeps good data on refresh failure, and cleans timers/subscription', async () => {
    vi.useFakeTimers()
    const refreshFailure = deferred<Array<Record<string, unknown>>>()
    const client = dashboardClient({inventories: [[homepageDraft()], refreshFailure.promise]})
    let observer: {next: () => void} | undefined
    const unsubscribe = vi.fn()
    client.listen.mockReturnValue({
      subscribe: vi.fn((nextObserver: {next: () => void}) => {
        observer = nextObserver
        return {unsubscribe}
      }),
    })

    const view = render(<EditorialDashboard />)
    await act(async () => Promise.resolve())
    expect(screen.getAllByText("Page d'accueil").length).toBeGreaterThan(0)
    expect(observer).toBeDefined()

    act(() => {
      observer?.next()
      observer?.next()
      vi.advanceTimersByTime(999)
    })
    expect(client.fetch).toHaveBeenCalledTimes(1)

    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(client.fetch).toHaveBeenCalledTimes(2)
    await act(async () => refreshFailure.reject(new Error('refresh cassé')))
    expect(screen.getAllByText("Page d'accueil").length).toBeGreaterThan(0)
    expect(screen.queryByText(/n’a pas pu se charger/)).toBeNull()

    act(() => observer?.next())
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    view.unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('EditorialDashboard publication workflow', () => {
  beforeEach(() => {
    vi.mocked(getRecentDeployments).mockResolvedValue([])
  })

  it('publishes a confirmed batch exactly once and closes the confirmation dialog', async () => {
    const client = dashboardClient()
    render(<EditorialDashboard />)
    await openPublicationConfirmation()

    fireEvent.click(screen.getByRole('button', {name: 'Confirmer'}))

    await waitFor(() =>
      expect(screen.queryByText('Publier maintenant sur le site public ?')).toBeNull(),
    )
    expect(client.action).toHaveBeenCalledOnce()
    expect(screen.queryByText('Échec de la publication')).toBeNull()
  })

  it('keeps confirmation open when the batch changes during final preflight', async () => {
    const client = dashboardClient({
      inventories: [[homepageDraft('r1')], [homepageDraft('r1')], [homepageDraft('r2')]],
    })
    render(<EditorialDashboard />)
    await openPublicationConfirmation()

    fireEvent.click(screen.getByRole('button', {name: 'Confirmer'}))

    await screen.findByText(/Le lot a changé depuis la confirmation/)
    expect(screen.getByText('Publier maintenant sur le site public ?')).toBeTruthy()
    expect(client.action).not.toHaveBeenCalled()
  })

  it('shows a publication error and retries without an unhandled rejection', async () => {
    const client = dashboardClient()
    client.action
      .mockRejectedValueOnce(new Error('publication refusée'))
      .mockResolvedValueOnce({})
    render(<EditorialDashboard />)
    await openPublicationConfirmation()

    fireEvent.click(screen.getByRole('button', {name: 'Confirmer'}))
    // The dialog closes on a non-recoverable-from-dialog error; the specific
    // reason surfaces in the compact status panel instead.
    await screen.findByText('publication refusée')
    expect(screen.queryByText('Publier maintenant sur le site public ?')).toBeNull()

    // Retrying is the same "Publier" action — the button stays enabled
    // (only a tracking failure disables it) so clicking it again re-opens
    // confirmation for another attempt.
    fireEvent.click(screen.getByRole('button', {name: 'Publier'}))
    await screen.findByText('Publier maintenant sur le site public ?')
    fireEvent.click(screen.getByRole('button', {name: 'Confirmer'}))

    await waitFor(() => expect(screen.queryByText('publication refusée')).toBeNull())
    expect(client.action).toHaveBeenCalledTimes(2)
  })

  it('shows a tracking failure and retries tracking without publishing twice', async () => {
    let timestampsCall = 0
    const client = dashboardClient({
      timestamps: () => {
        timestampsCall += 1
        return timestampsCall === 1
          ? Promise.reject(new Error('horodatage indisponible'))
          : Promise.resolve([{_id: 'homePage', _updatedAt: '2026-08-11T10:05:00.000Z'}])
      },
    })
    render(<EditorialDashboard />)
    await openPublicationConfirmation()

    fireEvent.click(screen.getByRole('button', {name: 'Confirmer'}))
    await screen.findAllByText(/fraîcheur du site non vérifiable/)
    expect(client.action).toHaveBeenCalledOnce()

    // The "Publier" button is disabled while tracking is unverified;
    // "Réessayer le suivi" is the only wired recovery path.
    fireEvent.click(screen.getByRole('button', {name: 'Réessayer le suivi'}))

    await waitFor(() =>
      expect(screen.queryAllByText(/fraîcheur du site non vérifiable/).length).toBe(0),
    )
    // Tracking retry re-checks the same commit; it must never re-invoke
    // the publish action.
    expect(client.action).toHaveBeenCalledOnce()
  })
})
