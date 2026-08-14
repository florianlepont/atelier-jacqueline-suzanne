import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {getRecentDeployments} from '../deployment'
import {useDeploymentPolling} from '../useDeploymentPolling'

vi.mock('../deployment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../deployment')>()
  return {...actual, getRecentDeployments: vi.fn(() => Promise.resolve([]))}
})

const NOW = '2026-08-14T12:00:00.000Z'

describe('useDeploymentPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    vi.mocked(getRecentDeployments).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports the missing-reference error and no runs when there is no reference timestamp yet', () => {
    const missingReferenceError = new Error('Aucune publication de référence disponible')
    const {result} = renderHook(() =>
      useDeploymentPolling({
        referenceTimestamp: '',
        pendingCount: 0,
        missingReferenceError,
      }),
    )

    expect(result.current.runs).toEqual([])
    expect(result.current.error).toBe(missingReferenceError)
    expect(getRecentDeployments).not.toHaveBeenCalled()
  })

  it('defaults to no error when no missingReferenceError is supplied (production before any release)', () => {
    const {result} = renderHook(() =>
      useDeploymentPolling({referenceTimestamp: '', pendingCount: 0}),
    )

    expect(result.current.runs).toEqual([])
    expect(result.current.error).toBeUndefined()
  })

  it('polls immediately once a reference timestamp is present, using the given workflow file', async () => {
    const {result} = renderHook(() =>
      useDeploymentPolling({
        referenceTimestamp: NOW,
        pendingCount: 0,
        workflowFile: 'deploy-ovh.yml',
        target: 'production',
      }),
    )

    await act(async () => vi.advanceTimersByTimeAsync(0))
    expect(result.current.runs).toEqual([])
    expect(getRecentDeployments).toHaveBeenCalledWith(expect.anything(), 'deploy-ovh.yml')
  })

  it('schedules a follow-up poll after the first one resolves', async () => {
    const {unmount} = renderHook(() =>
      useDeploymentPolling({referenceTimestamp: NOW, pendingCount: 0}),
    )

    await act(async () => vi.advanceTimersByTimeAsync(0))
    expect(getRecentDeployments).toHaveBeenCalledTimes(1)

    await act(async () => vi.advanceTimersByTimeAsync(5_000))
    expect(getRecentDeployments).toHaveBeenCalledTimes(2)

    unmount()
  })

  it('backs off to a 5-minute retry and surfaces the error when a poll rejects', async () => {
    vi.mocked(getRecentDeployments).mockRejectedValueOnce(new Error('GitHub API: 500'))
    const {result, unmount} = renderHook(() =>
      useDeploymentPolling({referenceTimestamp: NOW, pendingCount: 0}),
    )

    await act(async () => vi.advanceTimersByTimeAsync(0))
    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('GitHub API: 500')

    vi.mocked(getRecentDeployments).mockResolvedValue([])
    await act(async () => vi.advanceTimersByTimeAsync(5 * 60_000))
    expect(getRecentDeployments).toHaveBeenCalledTimes(2)

    unmount()
  })

  it('stops polling and aborts the in-flight request on unmount', async () => {
    const {unmount} = renderHook(() =>
      useDeploymentPolling({referenceTimestamp: NOW, pendingCount: 0}),
    )

    await act(async () => vi.advanceTimersByTimeAsync(0))
    const callCountBeforeUnmount = vi.mocked(getRecentDeployments).mock.calls.length
    unmount()

    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(getRecentDeployments).toHaveBeenCalledTimes(callCountBeforeUnmount)
  })
})
