import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  deploymentState,
  deploymentSubtitle,
  getRecentDeployments,
  latestValidTimestamp,
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

  it('mentions Site à jour only for a proven current deployment', () => {
    expect(
      deploymentSubtitle({
        kind: 'current',
        label: 'Site à jour',
        detail: 'Verified',
        tone: 'positive',
        terminal: true,
        actionUrl: 'https://example.com',
      }),
    ).toBe('Tous les contenus sont publiés · Site à jour.')
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

// quick-260811-kog-06: DIAGNOSTIC-06 (Sanity not reproducible) and
// DIAGNOSTIC-05 (root lint absent from CI). These are static config/CI
// checks, not deployment-run parsing logic — grouped in this file per the
// plan's own file list rather than a new one, but kept in their own
// describe block. Deliberately no YAML-parsing library import (the plan's
// own threat model forbids adding a new package here): GitHub Actions step
// names always appear as a `- name: ...` line in this repo's workflow, so a
// single, consistently-applied regex extracts the ordered step list
// precisely enough to assert relative ordering, without the ambiguity of an
// unstructured substring search anywhere in the file.
describe('Sanity version pin and CI gate ordering (DIAGNOSTIC-05/06)', () => {
  const sanityPackageJson = JSON.parse(readFileSync('sanity/package.json', 'utf8'))
  const sanityLockfile = JSON.parse(readFileSync('sanity/package-lock.json', 'utf8'))
  const sanityCliSource = readFileSync('sanity/sanity.cli.ts', 'utf8')
  const workflowSource = readFileSync('.github/workflows/deploy.yml', 'utf8')

  it('sanity/package.json declares the sanity dependency as exactly 6.6.0 (no range)', () => {
    expect(sanityPackageJson.dependencies.sanity).toBe('6.6.0')
  })

  it('sanity/package-lock.json resolves the sanity package to exactly 6.6.0', () => {
    expect(sanityLockfile.packages['node_modules/sanity'].version).toBe('6.6.0')
  })

  it('sanity/sanity.cli.ts disables Studio auto-updates', () => {
    // Deliberately not eval'd/dynamically imported (this is TypeScript
    // config source, not something to execute in a test process) — the
    // `deployment: {...}` block is small and its own single source of
    // truth, so slicing exactly that block and checking it contains the
    // false literal (and not the true one) is precise, not an ambiguous
    // whole-file substring search.
    const deploymentBlockMatch = sanityCliSource.match(/deployment:\s*\{([\s\S]*?)\n\s*\},?\n/)
    expect(deploymentBlockMatch).not.toBeNull()
    const deploymentBlock = deploymentBlockMatch![1]
    expect(deploymentBlock).toMatch(/autoUpdates:\s*false/)
    expect(deploymentBlock).not.toMatch(/autoUpdates:\s*true/)
  })

  function stepNamesInOrder(yaml: string): string[] {
    return [...yaml.matchAll(/^\s*-\s+name:\s*(.+)$/gm)].map(([, name]) => name.trim())
  }

  it('deploy.yml runs root lint before root typecheck and root build', () => {
    const steps = stepNamesInOrder(workflowSource)
    const lintIndex = steps.findIndex((name) => name === 'Lint (root)')
    const typecheckIndex = steps.findIndex((name) => name.startsWith('Type-check'))
    const buildIndex = steps.findIndex((name) => name.startsWith('Build (test artifact'))

    expect(lintIndex).toBeGreaterThanOrEqual(0)
    expect(typecheckIndex).toBeGreaterThan(lintIndex)
    expect(buildIndex).toBeGreaterThan(lintIndex)
  })

  it('deploy.yml runs the Studio coverage suite before Studio build and before deploy', () => {
    expect(workflowSource).toContain('npm --prefix sanity run test:coverage')

    const studioStepIndex = [...workflowSource.matchAll(/^\s*-\s+name:\s*(.+)$/gm)]
      .map(([, name], index) => ({name: name.trim(), index}))
      .find((step) => step.name.startsWith('Lint, test, and build Sanity Studio'))
    expect(studioStepIndex).toBeDefined()

    const studioStepBody = workflowSource.slice(
      workflowSource.indexOf('Lint, test, and build Sanity Studio'),
    )
    const lintPos = studioStepBody.indexOf('npm --prefix sanity run lint')
    const coveragePos = studioStepBody.indexOf('npm --prefix sanity run test:coverage')
    const buildPos = studioStepBody.indexOf('npm --prefix sanity run build')

    expect(lintPos).toBeGreaterThanOrEqual(0)
    expect(coveragePos).toBeGreaterThan(lintPos)
    expect(buildPos).toBeGreaterThan(coveragePos)

    const deployPos = workflowSource.indexOf('actions/deploy-pages@v4')
    expect(deployPos).toBeGreaterThan(workflowSource.indexOf('npm --prefix sanity run test:coverage'))
  })

  it('deploy.yml still installs both lockfiles with npm ci before invoking either project\'s scripts', () => {
    const rootCiPos = workflowSource.indexOf('run: npm ci')
    const sanityCiPos = workflowSource.indexOf('run: npm ci --prefix sanity')
    const firstScriptPos = workflowSource.indexOf('npm --prefix sanity run lint')

    expect(rootCiPos).toBeGreaterThanOrEqual(0)
    expect(sanityCiPos).toBeGreaterThan(rootCiPos)
    expect(firstScriptPos).toBeGreaterThan(sanityCiPos)
  })
})
