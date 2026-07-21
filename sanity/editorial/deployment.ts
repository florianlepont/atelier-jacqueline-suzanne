export const SITE_PREVIEW_URL =
  import.meta.env.SANITY_STUDIO_PREVIEW_URL || 'https://florianlepont.github.io/ajs-website/'

export const GITHUB_RUNS_URL =
  'https://api.github.com/repos/florianlepont/ajs-website/actions/workflows/deploy.yml/runs?per_page=1'

export interface DeploymentRun {
  id: number
  status: string
  conclusion: string | null
  html_url: string
  created_at: string
  updated_at: string
}

export async function getLatestDeployment(signal?: AbortSignal): Promise<DeploymentRun | null> {
  const response = await fetch(GITHUB_RUNS_URL, {
    headers: {Accept: 'application/vnd.github+json'},
    signal,
  })
  if (!response.ok) throw new Error(`GitHub API: ${response.status}`)
  const payload = (await response.json()) as {workflow_runs?: DeploymentRun[]}
  return payload.workflow_runs?.[0] ?? null
}

export type DeploymentTone = 'default' | 'caution' | 'positive' | 'critical'

export function deploymentLabel(run: DeploymentRun | null): {label: string; tone: DeploymentTone} {
  if (!run) return {label: 'État inconnu', tone: 'default'}
  if (run.status !== 'completed') return {label: 'Mise à jour en cours', tone: 'caution'}
  if (run.conclusion === 'success') return {label: 'Site à jour', tone: 'positive'}
  return {label: 'Échec du déploiement', tone: 'critical'}
}
