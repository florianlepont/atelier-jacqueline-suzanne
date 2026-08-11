import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  deploymentState,
  deploymentSubtitle,
  getRecentDeployments,
  GITHUB_WORKFLOW_URL,
  latestValidTimestamp,
  nextDeploymentPollDelay,
  PRODUCTION_SITE_URL,
  PRODUCTION_WORKFLOW_FILE,
  releasePipelineState,
  selectQualifiedRun,
  STAGING_WORKFLOW_FILE,
  workflowActionsUrl,
  workflowRunsUrl,
  type DeploymentRun,
  type DeploymentState,
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

  it('fetches the production workflow when passed deploy-ovh.yml, and defaults to staging', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify({workflow_runs: []})))
    vi.stubGlobal('fetch', fetchMock)

    await getRecentDeployments(undefined, PRODUCTION_WORKFLOW_FILE)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('deploy-ovh.yml'),
      expect.anything(),
    )
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('per_page=10'), expect.anything())

    await getRecentDeployments()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(STAGING_WORKFLOW_FILE),
      expect.anything(),
    )
  })

  it('builds runs and actions URLs for a given workflow file', () => {
    expect(workflowRunsUrl(PRODUCTION_WORKFLOW_FILE)).toBe(
      'https://api.github.com/repos/florianlepont/ajs-website/actions/workflows/deploy-ovh.yml/runs?per_page=10',
    )
    expect(workflowActionsUrl(PRODUCTION_WORKFLOW_FILE)).toBe(
      'https://github.com/florianlepont/ajs-website/actions/workflows/deploy-ovh.yml',
    )
    expect(workflowActionsUrl(STAGING_WORKFLOW_FILE)).toBe(GITHUB_WORKFLOW_URL)
  })
})

describe('deployment freshness state machine', () => {
  it('uses the newest valid local or remote publication timestamp across tabs', () => {
    const localPublication = '2026-07-29T09:00:00.000Z'
    const remotePublication = '2026-07-29T09:02:00.000Z'
    const reference = latestValidTimestamp(localPublication, remotePublication)
    expect(reference).toBe(remotePublication)
    expect(
      deploymentState({
        runs: [run({created_at: '2026-07-29T09:01:00Z'})],
        publishedAt: reference,
        pendingCount: 0,
      }).kind,
    ).toBe('waiting-run')
  })

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

  it('fails closed for a same-second candidate whose ordering is precision-ambiguous', () => {
    const sameSecondCandidate = run({created_at: '2026-07-29T09:00:00Z'})
    const state = deploymentState({
      runs: [sameSecondCandidate],
      publishedAt: '2026-07-29T09:00:00.750Z',
      pendingCount: 0,
    })
    expect(
      selectQualifiedRun([sameSecondCandidate], '2026-07-29T09:00:00.750Z'),
    ).toBeNull()
    expect(state.kind).toBe('unknown')
    expect(state.detail).toContain('précision')
  })

  it('also treats exact whole-second equality as precision-ambiguous', () => {
    const state = deploymentState({
      runs: [run({created_at: '2026-07-29T09:00:00Z'})],
      publishedAt: '2026-07-29T09:00:00.000Z',
      pendingCount: 0,
    })
    expect(state.kind).toBe('unknown')
    expect(state.detail).toContain('précision')
  })

  it('ignores a malformed old run when a coherent post-publication success exists', () => {
    const malformedOldRun = run({
      id: 1,
      created_at: '2026-07-29T08:59:00Z',
      run_started_at: 'invalid',
      updated_at: 'invalid',
    })
    const validNewRun = run({
      id: 2,
      created_at: '2026-07-29T09:01:00Z',
      run_started_at: '2026-07-29T09:01:03Z',
      updated_at: '2026-07-29T09:02:00Z',
    })
    const state = deploymentState({
      runs: [malformedOldRun, validNewRun],
      publishedAt,
      pendingCount: 0,
    })
    expect(state.kind).toBe('current')
    expect(state.run?.id).toBe(2)
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

describe('deployment-aware dashboard subtitle', () => {
  it.each([
    ['waiting-run', 'Mise à jour en attente'],
    ['deploying', 'Mise à jour en cours'],
    ['failed', 'Échec de la mise à jour'],
    ['unknown', 'État temporairement indisponible'],
  ] as const)('does not claim the site is current for %s', (kind, label) => {
    const subtitle = deploymentSubtitle({
      kind,
      label,
      detail: label,
      tone: kind === 'failed' ? 'critical' : 'caution',
      terminal: kind === 'failed' || kind === 'unknown',
      actionUrl: 'https://example.com',
    })
    expect(subtitle).toContain(label)
    expect(subtitle).not.toContain('Site à jour')
  })

  it('mentions Staging à jour only for a proven current staging deployment', () => {
    expect(
      deploymentSubtitle({
        kind: 'current',
        label: 'Staging à jour',
        detail: 'Verified',
        tone: 'positive',
        terminal: true,
        actionUrl: 'https://example.com',
      }),
    ).toBe('Tous les contenus sont publiés · Staging à jour.')
  })
})

describe('deployment state disambiguated by target', () => {
  it('labels a proven-current staging deployment "Staging à jour" and links to the staging preview URL', () => {
    const state = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    expect(state.kind).toBe('current')
    expect(state.label).toBe('Staging à jour')
    expect(state.actionUrl).toBe('https://florianlepont.github.io/ajs-website/')
  })

  it('labels a proven-current production deployment "Production à jour" and links to the real domain', () => {
    const state = deploymentState({
      runs: [run()],
      publishedAt,
      pendingCount: 0,
      target: 'production',
    })
    expect(state.kind).toBe('current')
    expect(state.label).toBe('Production à jour')
    expect(state.actionUrl).toBe(PRODUCTION_SITE_URL)
  })

  it('links non-terminal and failure production states to the production workflow, never staging', () => {
    const waiting = deploymentState({
      runs: [],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:01:00Z'),
      target: 'production',
    })
    expect(waiting.kind).toBe('waiting-run')
    expect(waiting.actionUrl).toBe(workflowActionsUrl(PRODUCTION_WORKFLOW_FILE))
    expect(waiting.actionUrl).not.toBe(GITHUB_WORKFLOW_URL)

    const unknown = deploymentState({
      runs: [run()],
      publishedAt: 'not-a-date',
      pendingCount: 0,
      target: 'production',
    })
    expect(unknown.kind).toBe('unknown')
    expect(unknown.actionUrl).toBe(workflowActionsUrl(PRODUCTION_WORKFLOW_FILE))
  })

  it('keeps every other state kind, tone, terminal flag identical between targets', () => {
    const stagingDeploying = deploymentState({
      runs: [run({status: 'in_progress', conclusion: null})],
      publishedAt,
      pendingCount: 0,
    })
    const productionDeploying = deploymentState({
      runs: [run({status: 'in_progress', conclusion: null})],
      publishedAt,
      pendingCount: 0,
      target: 'production',
    })
    expect(stagingDeploying.kind).toBe(productionDeploying.kind)
    expect(stagingDeploying.tone).toBe(productionDeploying.tone)
    expect(stagingDeploying.terminal).toBe(productionDeploying.terminal)

    const stagingFailed = deploymentState({
      runs: [run({conclusion: 'failure'})],
      publishedAt,
      pendingCount: 0,
    })
    const productionFailed = deploymentState({
      runs: [run({conclusion: 'failure'})],
      publishedAt,
      pendingCount: 0,
      target: 'production',
    })
    expect(stagingFailed.kind).toBe(productionFailed.kind)
    expect(stagingFailed.tone).toBe(productionFailed.tone)
    expect(stagingFailed.terminal).toBe(productionFailed.terminal)
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

describe('release pipeline state', () => {
  const noProductionRelease: DeploymentState = deploymentState({
    runs: [],
    publishedAt: '',
    pendingCount: 0,
    target: 'production',
  })

  it('marks the content segment done with no pending drafts and pending otherwise', () => {
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const done = releasePipelineState({
      pendingCount: 0,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(done.segments.content).toBe('done')

    const pending = releasePipelineState({
      pendingCount: 2,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(pending.segments.content).toBe('pending')
  })

  it.each([
    [
      'current',
      () => deploymentState({runs: [run()], publishedAt, pendingCount: 0}),
      'done',
    ],
    [
      'deploying',
      () =>
        deploymentState({
          runs: [run({status: 'in_progress', conclusion: null})],
          publishedAt,
          pendingCount: 0,
        }),
      'active',
    ],
    [
      'waiting-run',
      () =>
        deploymentState({
          runs: [],
          publishedAt,
          pendingCount: 0,
          now: new Date('2026-07-29T09:01:00Z'),
        }),
      'active',
    ],
    [
      'failed',
      () =>
        deploymentState({runs: [run({conclusion: 'failure'})], publishedAt, pendingCount: 0}),
      'failed',
    ],
    [
      'pending-content',
      () => deploymentState({runs: [], publishedAt, pendingCount: 1}),
      'pending',
    ],
    [
      'unknown',
      () =>
        deploymentState({runs: [], publishedAt, pendingCount: 0, error: new Error('rate limited')}),
      'pending',
    ],
  ] as const)('maps staging kind %s to segment %s', (expectedKind, buildStaging, expectedSegment) => {
    const staging = buildStaging()
    expect(staging.kind).toBe(expectedKind)
    const result = releasePipelineState({
      pendingCount: staging.kind === 'pending-content' ? 1 : 0,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(result.segments.staging).toBe(expectedSegment)
  })

  it('with no production release ever recorded, keeps production pending and the row dimmed/disabled/titled "En attente du staging…"', () => {
    const staging = deploymentState({
      runs: [run({status: 'in_progress', conclusion: null})],
      publishedAt,
      pendingCount: 0,
    })
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(result.segments.production).toBe('pending')
    expect(result.promote.dimmed).toBe(true)
    expect(result.promote.buttonDisabled).toBe(true)
    expect(result.promote.title).toBe('En attente du staging…')
  })

  it('with content done, staging done, and no production release, enables the promote button', () => {
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(result.promote.dimmed).toBe(false)
    expect(result.promote.buttonDisabled).toBe(false)
    expect(result.promote.buttonLabel).toBe('Mettre en production')
    expect(result.promote.title).toBe('Staging vérifié — prêt pour la production ?')
  })

  it('a release in flight marks the production segment active and disables the button while it runs', () => {
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: true,
    })
    expect(result.segments.production).toBe('active')
    expect(result.promote.buttonDisabled).toBe(true)
    expect(result.promote.title).toBe('Mise en production en cours…')
  })

  it('a proven-current production run newer than the newest publication marks production done and locks the button', () => {
    const productionReleaseAt = '2026-07-29T09:05:00Z'
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const production = deploymentState({
      runs: [
        run({
          created_at: '2026-07-29T09:05:01Z',
          run_started_at: '2026-07-29T09:05:03Z',
          updated_at: '2026-07-29T09:06:00Z',
        }),
      ],
      publishedAt: productionReleaseAt,
      pendingCount: 0,
      target: 'production',
    })
    expect(production.kind).toBe('current')
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production,
      publishedAt,
      productionReleaseAt,
      busy: false,
    })
    expect(result.segments.production).toBe('done')
    expect(result.promote.buttonDisabled).toBe(true)
    expect(result.promote.title).toBe('Production à jour')
  })

  it('a production release older than the newest content publication falls back to pending and re-enables the button', () => {
    const productionReleaseAt = '2026-07-29T08:00:00Z'
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const production = deploymentState({
      runs: [
        run({
          created_at: '2026-07-29T08:00:01Z',
          run_started_at: '2026-07-29T08:00:03Z',
          updated_at: '2026-07-29T08:01:00Z',
        }),
      ],
      publishedAt: productionReleaseAt,
      pendingCount: 0,
      target: 'production',
    })
    expect(production.kind).toBe('current')
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production,
      publishedAt, // newer than productionReleaseAt
      productionReleaseAt,
      busy: false,
    })
    expect(result.segments.production).toBe('pending')
    expect(result.promote.buttonDisabled).toBe(false)
    expect(result.promote.title).toBe('Staging vérifié — prêt pour la production ?')
  })

  it('a failed staging run disables the button and names the staging stage as the failure', () => {
    const staging = deploymentState({
      runs: [run({conclusion: 'failure'})],
      publishedAt,
      pendingCount: 0,
    })
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(result.segments.staging).toBe('failed')
    expect(result.promote.buttonDisabled).toBe(true)
    expect(result.promote.dimmed).toBe(true)
    expect(result.promote.title.toLowerCase()).toContain('staging')
  })

  it('a failed production run enables the button for retry and names the production stage as the failure', () => {
    const productionReleaseAt = '2026-07-29T09:05:00Z'
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const production = deploymentState({
      runs: [
        run({
          conclusion: 'failure',
          created_at: '2026-07-29T09:05:01Z',
          run_started_at: '2026-07-29T09:05:03Z',
          updated_at: '2026-07-29T09:06:00Z',
        }),
      ],
      publishedAt: productionReleaseAt,
      pendingCount: 0,
      target: 'production',
    })
    expect(production.kind).toBe('failed')
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production,
      publishedAt,
      productionReleaseAt,
      busy: false,
    })
    expect(result.segments.production).toBe('failed')
    expect(result.promote.buttonDisabled).toBe(false)
    expect(result.promote.title.toLowerCase()).toContain('production')
    expect(result.promote.actionUrl).toBe(production.actionUrl)
  })

  it('a trigger request error wins over every other row state and is surfaced verbatim with an enabled retry button', () => {
    const productionReleaseAt = '2026-07-29T09:05:00Z'
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const production = deploymentState({
      runs: [
        run({
          conclusion: 'failure',
          created_at: '2026-07-29T09:05:01Z',
          run_started_at: '2026-07-29T09:05:03Z',
          updated_at: '2026-07-29T09:06:00Z',
        }),
      ],
      publishedAt: productionReleaseAt,
      pendingCount: 0,
      target: 'production',
    })
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production,
      publishedAt,
      productionReleaseAt,
      busy: false,
      requestError: 'GitHub a refusé la requête (403).',
    })
    expect(result.promote.detail).toBe('GitHub a refusé la requête (403).')
    expect(result.promote.buttonDisabled).toBe(false)
  })
})
