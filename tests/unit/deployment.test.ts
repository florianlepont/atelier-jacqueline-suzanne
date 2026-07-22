import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  deploymentLabel,
  getLatestDeployment,
  type DeploymentRun,
} from '../../sanity/editorial/deployment'

const run = (overrides: Partial<DeploymentRun> = {}): DeploymentRun => ({
  id: 1,
  status: 'completed',
  conclusion: 'success',
  html_url: 'https://github.com/example/actions/runs/1',
  created_at: '2026-07-22T08:00:00Z',
  updated_at: '2026-07-22T08:01:00Z',
  ...overrides,
})

describe('deployment status', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the latest workflow run', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({workflow_runs: [run()]}))))
    await expect(getLatestDeployment()).resolves.toMatchObject({id: 1})
  })

  it('returns null when GitHub has no workflow run', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
    await expect(getLatestDeployment()).resolves.toBeNull()
  })

  it('throws a useful error for an unsuccessful GitHub response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {status: 503})))
    await expect(getLatestDeployment()).rejects.toThrow('GitHub API: 503')
  })

  it('maps absent, running, successful, and failed runs to editorial labels', () => {
    expect(deploymentLabel(null).tone).toBe('default')
    expect(deploymentLabel(run({status: 'in_progress', conclusion: null})).tone).toBe('caution')
    expect(deploymentLabel(run()).tone).toBe('positive')
    expect(deploymentLabel(run({conclusion: 'failure'})).tone).toBe('critical')
  })
})
