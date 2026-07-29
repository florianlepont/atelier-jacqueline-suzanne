import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  deploymentState,
  getRecentDeployments,
  nextDeploymentPollDelay,
  selectQualifiedRun,
  type DeploymentRun,
} from '../../sanity/editorial/deployment'

const publishedAt = '2026-07-29T09:00:00Z'

const run = (overrides: Partial<DeploymentRun> = {}): DeploymentRun => ({
  id: 1,
  event: 'repository_dispatch',
  status: 'completed',
  conclusion: 'success',
  html_url: 'https://github.com/example/actions/runs/1',
  created_at: '2026-07-29T09:00:01Z',
  run_started_at: '2026-07-29T09:00:03Z',
  updated_at: '2026-07-29T09:01:00Z',
  ...overrides,
})

describe('GitHub deployment reads', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns a bounded list of recent workflow runs', async () => {
    const runs = [run({id: 2}), run({id: 1})]
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({workflow_runs: runs})),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getRecentDeployments()).resolves.toEqual(runs)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('per_page=10'),
      expect.objectContaining({
        headers: {Accept: 'application/vnd.github+json'},
      }),
    )
  })

  it('returns an empty list when GitHub has no workflow run', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
    await expect(getRecentDeployments()).resolves.toEqual([])
  })

  it('throws a useful error for an unsuccessful GitHub response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {status: 503})))
    await expect(getRecentDeployments()).rejects.toThrow('GitHub API: 503')
  })
})

describe('deployment freshness state machine', () => {
  it('selects the newest qualified run regardless of API order', () => {
    expect(
      selectQualifiedRun(
        [
          run({id: 2, created_at: '2026-07-29T09:02:00Z'}),
          run({id: 1, created_at: '2026-07-29T09:01:00Z'}),
        ],
        publishedAt,
      )?.id,
    ).toBe(2)
  })

  it('rejects an old run even when it completed after publication', () => {
    const old = run({
      created_at: '2026-07-29T08:59:59Z',
      run_started_at: '2026-07-29T09:00:02Z',
      updated_at: '2026-07-29T09:02:00Z',
    })
    expect(selectQualifiedRun([old], publishedAt)).toBeNull()
    expect(
      deploymentState({
        runs: [old],
        publishedAt,
        pendingCount: 0,
        now: new Date('2026-07-29T09:01:00Z'),
      }).kind,
    ).toBe('waiting-run')
  })

  it('prioritizes pending public drafts', () => {
    expect(
      deploymentState({
        runs: [run()],
        publishedAt,
        pendingCount: 1,
      }).kind,
    ).toBe('pending-content')
  })

  it('covers waiting, deploying, current, failed, and unknown states', () => {
    expect(
      deploymentState({
        runs: [],
        publishedAt,
        pendingCount: 0,
        now: new Date('2026-07-29T09:01:00Z'),
      }).kind,
    ).toBe('waiting-run')
    expect(
      deploymentState({
        runs: [run({status: 'in_progress', conclusion: null})],
        publishedAt,
        pendingCount: 0,
      }).kind,
    ).toBe('deploying')
    expect(
      deploymentState({runs: [run()], publishedAt, pendingCount: 0}).kind,
    ).toBe('current')
    expect(
      deploymentState({
        runs: [run({conclusion: 'failure'})],
        publishedAt,
        pendingCount: 0,
      }).kind,
    ).toBe('failed')
    expect(
      deploymentState({
        runs: [],
        publishedAt,
        pendingCount: 0,
        error: new Error('rate limited'),
      }).kind,
    ).toBe('unknown')
  })

  it('fails closed for invalid or incoherent timestamps', () => {
    expect(
      deploymentState({
        runs: [run()],
        publishedAt: 'not-a-date',
        pendingCount: 0,
      }).kind,
    ).toBe('unknown')
    expect(
      deploymentState({
        runs: [
          run({
            created_at: '2026-07-29T09:02:00Z',
            run_started_at: '2026-07-29T09:01:00Z',
          }),
        ],
        publishedAt,
        pendingCount: 0,
      }).kind,
    ).toBe('unknown')
  })

  it('surfaces the not-started timeout after three minutes', () => {
    const state = deploymentState({
      runs: [],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:03:01Z'),
    })
    expect(state.kind).toBe('waiting-run')
    expect(state.label).toBe('Mise à jour non démarrée')
    expect(state.actionLabel).toBe('Prévenir le mainteneur')
  })
})

describe('deployment polling cadence', () => {
  it('fetches immediately after publication', () => {
    expect(
      nextDeploymentPollDelay({elapsedMs: 0, terminal: false, firstPoll: true}),
    ).toBe(0)
  })

  it('polls every five seconds during the first two minutes', () => {
    expect(
      nextDeploymentPollDelay({
        elapsedMs: 119_999,
        terminal: false,
        firstPoll: false,
      }),
    ).toBe(5_000)
  })

  it('polls every fifteen seconds after two minutes until terminal', () => {
    expect(
      nextDeploymentPollDelay({
        elapsedMs: 120_000,
        terminal: false,
        firstPoll: false,
      }),
    ).toBe(15_000)
  })

  it('returns to the five-minute background delay for terminal states', () => {
    expect(
      nextDeploymentPollDelay({
        elapsedMs: 10_000,
        terminal: true,
        firstPoll: false,
      }),
    ).toBe(5 * 60_000)
  })
})
