import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  deploymentState,
  deploymentSubtitle,
  getRecentDeployments,
  GITHUB_WORKFLOW_URL,
  latestValidTimestamp,
  nextDeploymentPollDelay,
  pipelineDisplaySegments,
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
    // This test is about timestamp SELECTION, so it pins an explicit `now`
    // (30s after the reference timestamp) rather than inheriting the
    // three-minute timeout's verdict from the wall clock -- without now the
    // real clock makes this fixture months stale and timedOut silently true.
    expect(
      deploymentState({
        runs: [run({created_at: '2026-07-29T09:01:00Z'})],
        publishedAt: reference,
        pendingCount: 0,
        now: new Date('2026-07-29T09:02:30Z'),
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

  it('surfaces the not-started timeout after three minutes as a failed kind, so the stage turns red instead of staying blue forever', () => {
    const state = deploymentState({
      runs: [],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:03:01Z'),
    })
    expect(state.kind).toBe('failed')
    expect(state.label).toBe('Mise à jour non démarrée')
    expect(state.actionLabel).toBe('Prévenir le mainteneur')
    // Every other field stays byte-identical to the pre-change behaviour.
    expect(state.detail).toBe("Aucun déploiement récent n'est apparu après la publication.")
    expect(state.tone).toBe('critical')
    // terminal stays false so a late-appearing run can still self-heal the
    // state back to 'deploying'/'current' instead of being stranded red.
    expect(state.terminal).toBe(false)
  })
})

describe('not-started timeout boundary and segment mapping', () => {
  it('stays the waiting kind one second before three minutes, and turns failed exactly at the three-minute boundary, for the staging target', () => {
    const beforeTimeout = deploymentState({
      runs: [],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:02:59Z'),
    })
    const atTimeout = deploymentState({
      runs: [],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:03:00Z'),
    })
    expect(beforeTimeout.kind).toBe('waiting-run')
    expect(atTimeout.kind).toBe('failed')

    // The whole point: blue while it may still be starting, red once it
    // demonstrably never did.
    const beforeResult = releasePipelineState({
      pendingCount: 0,
      staging: beforeTimeout,
      production: deploymentState({runs: [], publishedAt: '', pendingCount: 0, target: 'production'}),
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    const atResult = releasePipelineState({
      pendingCount: 0,
      staging: atTimeout,
      production: deploymentState({runs: [], publishedAt: '', pendingCount: 0, target: 'production'}),
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(beforeResult.segments.staging).toBe('active')
    expect(atResult.segments.staging).toBe('failed')
  })

  it('stays the waiting kind one second before three minutes, and turns failed exactly at the three-minute boundary, for the production target', () => {
    const beforeTimeout = deploymentState({
      runs: [],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:02:59Z'),
      target: 'production',
    })
    const atTimeout = deploymentState({
      runs: [],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:03:00Z'),
      target: 'production',
    })
    expect(beforeTimeout.kind).toBe('waiting-run')
    expect(atTimeout.kind).toBe('failed')

    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    // productionReleaseAt set equal to publishedAt so isProductionReleaseStale()
    // does not override the result with 'pending'.
    const beforeResult = releasePipelineState({
      pendingCount: 0,
      staging,
      production: beforeTimeout,
      publishedAt,
      productionReleaseAt: publishedAt,
      busy: false,
    })
    const atResult = releasePipelineState({
      pendingCount: 0,
      staging,
      production: atTimeout,
      publishedAt,
      productionReleaseAt: publishedAt,
      busy: false,
    })
    expect(beforeResult.segments.production).toBe('active')
    expect(atResult.segments.production).toBe('failed')
  })

  it('a run that WAS found and is genuinely mid-flight still reports the deploying kind and maps to the active segment, even well past three minutes — production releases can legitimately run five-plus minutes, and this proves the two branches were not folded together', () => {
    const state = deploymentState({
      runs: [run({status: 'in_progress', conclusion: null})],
      publishedAt,
      pendingCount: 0,
      now: new Date('2026-07-29T09:10:00Z'),
    })
    expect(state.kind).toBe('deploying')

    const staging = state
    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production: deploymentState({runs: [], publishedAt: '', pendingCount: 0, target: 'production'}),
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(result.segments.staging).toBe('active')
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

  it('mentions Site de test à jour only for a proven current staging deployment', () => {
    expect(
      deploymentSubtitle({
        kind: 'current',
        label: 'Site de test à jour',
        detail: 'Verified',
        tone: 'positive',
        terminal: true,
        actionUrl: 'https://example.com',
      }),
    ).toBe('Tous les contenus sont publiés · Site de test à jour.')
  })
})

describe('deployment state disambiguated by target', () => {
  it('labels a proven-current staging deployment "Site de test à jour" and links to the staging preview URL', () => {
    const state = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    expect(state.kind).toBe('current')
    expect(state.label).toBe('Site de test à jour')
    expect(state.actionUrl).toBe('https://florianlepont.github.io/ajs-website/')
  })

  it('labels a proven-current production deployment "Site en ligne à jour" and links to the real domain', () => {
    const state = deploymentState({
      runs: [run()],
      publishedAt,
      pendingCount: 0,
      target: 'production',
    })
    expect(state.kind).toBe('current')
    expect(state.label).toBe('Site en ligne à jour')
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

describe('pipeline display segments', () => {
  it('merges content+staging into a done testSite only when both are done, and passes production through unchanged as liveSite', () => {
    expect(
      pipelineDisplaySegments({content: 'done', staging: 'done', production: 'done'}),
    ).toEqual({testSite: 'done', liveSite: 'done'})
  })

  it('reflects an active staging deploy on the merged testSite segment', () => {
    expect(
      pipelineDisplaySegments({content: 'done', staging: 'active', production: 'pending'}),
    ).toEqual({testSite: 'active', liveSite: 'pending'})
  })

  it('keeps the merged segment pending when only one of content/staging is done', () => {
    expect(
      pipelineDisplaySegments({content: 'pending', staging: 'done', production: 'pending'}),
    ).toEqual({testSite: 'pending', liveSite: 'pending'})
  })

  it('lets a failed staging deploy win over every other kind on the merged segment', () => {
    expect(
      pipelineDisplaySegments({content: 'done', staging: 'failed', production: 'pending'}),
    ).toEqual({testSite: 'failed', liveSite: 'pending'})
  })

  it('passes production through verbatim as liveSite regardless of the merged testSite kind', () => {
    expect(
      pipelineDisplaySegments({content: 'active', staging: 'active', production: 'active'}).liveSite,
    ).toBe('active')
    expect(
      pipelineDisplaySegments({content: 'failed', staging: 'pending', production: 'failed'}).liveSite,
    ).toBe('failed')
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

  it('with unpublished drafts pending, flags the row as not-started and returns no copy of its own, since the header and pipeline nodes already carry that framing', () => {
    const staging = deploymentState({runs: [], publishedAt, pendingCount: 1})
    const result = releasePipelineState({
      pendingCount: 1,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    })
    expect(result.segments.content).toBe('pending')
    // Empty is the intended contract here, not an oversight: the panel
    // header subtitle and the two pending pipeline nodes already state this
    // situation in full, and the dashboard shows no step numbering for a
    // heading here to refer to. Do not "helpfully" fill this back in.
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
    expect(result.promote.dimmed).toBe(true)
    expect(result.promote.buttonDisabled).toBe(true)
    expect(result.promote.notStarted).toBe(true)
    // This is the locked gate button's accessible name and must survive
    // the copy removal above.
    expect(result.promote.buttonLabel).toBe('Publier sur le site en ligne')
  })

  it('with no production release ever recorded, keeps production pending and the row dimmed and disabled, with no copy of its own', () => {
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
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
    // This is the genuine in-flight wait, so the header must not
    // additionally claim nothing has been started.
    expect(result.promote.notStarted).toBeFalsy()
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
    expect(result.promote.buttonLabel).toBe('Publier sur le site en ligne')
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
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
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
    expect(result.promote.buttonLabel).toBe('Publication en cours…')
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
    // Empty is the intended contract here, not an oversight: this state
    // renders no detail box at all because node 2 and the gate checkmark
    // already carry the status.
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
    // The locked gate's accessible name survives even though the copy was
    // emptied.
    expect(result.promote.buttonLabel).toBe('Site en ligne à jour ✓')
  })

  it('an unpublished draft anywhere stops the live site reading as up to date, even with a proven-current, non-stale production release', () => {
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
      pendingCount: 1,
      staging,
      production,
      publishedAt,
      productionReleaseAt,
      busy: false,
    })
    // The release is newer than publishedAt, so isProductionReleaseStale is
    // not the cause -- the ONLY thing forcing 'pending' is the unpublished
    // draft.
    expect(result.segments.production).toBe('pending')
  })

  it('something genuinely in flight always outranks the pending-draft rule', () => {
    const staging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const result = releasePipelineState({
      pendingCount: 1,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: true,
    })
    // Otherwise a running release would visibly regress to a waiting state
    // the moment anyone saved a draft.
    expect(result.segments.production).toBe('active')
  })

  it('a real failure must stay visible and actionable regardless of unrelated pending drafts', () => {
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
      pendingCount: 1,
      staging,
      production,
      publishedAt,
      productionReleaseAt,
      busy: false,
    })
    // The pending-draft rule governs the done<->pending boundary only, never
    // the failed state -- so the retry affordance survives.
    expect(result.segments.production).toBe('failed')
    expect(result.promote.buttonLabel).toBe('Réessayer')
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
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
  })

  it('a failed staging run disables the button, dims the row, and keeps the staging run link as its only body', () => {
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
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
    // The link is now the ONLY body this state's box has.
    expect(result.promote.actionUrl).toBe(staging.actionUrl)
  })

  it('a failed production run enables the button for retry and keeps the production run link as its only body', () => {
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
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
    expect(result.promote.actionUrl).toBe(production.actionUrl)
    expect(result.promote.buttonLabel).toBe('Réessayer')
  })

  // The "surfaced verbatim" premise this case used to assert is now false:
  // the raw technical request-error string is deliberately not shown to the
  // maintainer any more. The header subtitle says the release could not
  // start, and the retry lives on the round gate button.
  it('a trigger request error wins over every other row state and leaves an enabled retry, with no copy of its own', () => {
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
    expect(result.promote.title).toBe('')
    expect(result.promote.detail).toBe('')
    expect(result.promote.buttonLabel).toBe('Réessayer')
    expect(result.promote.buttonDisabled).toBe(false)
  })

  // Locks the contract of the whole function: no branch may carry
  // explanatory copy, in any of the eight reachable states. The discriminator
  // assertion on each case is what stops this sweep from silently degenerating
  // into eight copies of the same state.
  it('carries no explanatory copy in any branch, across all eight release states', () => {
    const failedStaging = deploymentState({
      runs: [run({conclusion: 'failure'})],
      publishedAt,
      pendingCount: 0,
    })
    const failedProduction = deploymentState({
      runs: [run({conclusion: 'failure'})],
      publishedAt,
      pendingCount: 0,
      target: 'production',
    })
    const currentStaging = deploymentState({runs: [run()], publishedAt, pendingCount: 0})
    const activeStaging = deploymentState({
      runs: [run({status: 'in_progress', conclusion: null})],
      publishedAt,
      pendingCount: 0,
    })
    const provenCurrentProduction = deploymentState({
      runs: [
        run({
          created_at: '2026-07-29T09:05:01Z',
          run_started_at: '2026-07-29T09:05:03Z',
          updated_at: '2026-07-29T09:06:00Z',
        }),
      ],
      publishedAt: '2026-07-29T09:05:00Z',
      pendingCount: 0,
      target: 'production',
    })

    const cases: Array<{
      name: string
      args: Parameters<typeof releasePipelineState>[0]
      discriminator: (result: ReturnType<typeof releasePipelineState>) => void
    }> = [
      {
        name: 'requestError set',
        args: {
          pendingCount: 0,
          staging: currentStaging,
          production: noProductionRelease,
          publishedAt,
          productionReleaseAt: '',
          busy: false,
          requestError: 'GitHub a refusé la requête (403).',
        },
        discriminator: (result) => {
          expect(result.promote.buttonLabel).toBe('Réessayer')
          expect(result.promote.buttonDisabled).toBe(false)
        },
      },
      {
        name: 'production active via busy: true',
        args: {
          pendingCount: 0,
          staging: currentStaging,
          production: noProductionRelease,
          publishedAt,
          productionReleaseAt: '',
          busy: true,
        },
        discriminator: (result) => expect(result.segments.production).toBe('active'),
      },
      {
        name: 'production failed',
        args: {
          pendingCount: 0,
          staging: currentStaging,
          production: failedProduction,
          publishedAt,
          productionReleaseAt: '2026-07-29T09:05:00Z',
          busy: false,
        },
        discriminator: (result) => expect(result.segments.production).toBe('failed'),
      },
      {
        name: 'production done',
        args: {
          pendingCount: 0,
          staging: currentStaging,
          production: provenCurrentProduction,
          publishedAt,
          productionReleaseAt: '2026-07-29T09:05:00Z',
          busy: false,
        },
        discriminator: (result) => expect(result.segments.production).toBe('done'),
      },
      {
        name: 'staging failed',
        args: {
          pendingCount: 0,
          staging: failedStaging,
          production: noProductionRelease,
          publishedAt,
          productionReleaseAt: '',
          busy: false,
        },
        discriminator: (result) => expect(result.segments.staging).toBe('failed'),
      },
      {
        name: 'content pending',
        args: {
          pendingCount: 1,
          staging: currentStaging,
          production: noProductionRelease,
          publishedAt,
          productionReleaseAt: '',
          busy: false,
        },
        discriminator: (result) => expect(result.promote.notStarted).toBe(true),
      },
      {
        name: 'staging active with content done',
        args: {
          pendingCount: 0,
          staging: activeStaging,
          production: noProductionRelease,
          publishedAt,
          productionReleaseAt: '',
          busy: false,
        },
        discriminator: (result) => {
          expect(result.segments.staging).toBe('active')
          expect(result.segments.content).toBe('done')
        },
      },
      {
        name: 'ready',
        args: {
          pendingCount: 0,
          staging: currentStaging,
          production: noProductionRelease,
          publishedAt,
          productionReleaseAt: '',
          busy: false,
        },
        discriminator: (result) => {
          expect(result.promote.buttonDisabled).toBe(false)
          expect(result.promote.dimmed).toBe(false)
        },
      },
    ]

    for (const {name, args, discriminator} of cases) {
      const result = releasePipelineState(args)
      discriminator(result)
      expect(result.promote.title, `${name}: title must be empty`).toBe('')
      expect(result.promote.detail, `${name}: detail must be empty`).toBe('')
    }
  })
})
