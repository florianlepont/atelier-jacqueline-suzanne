/// <reference types="vite/client" />

export const SITE_PREVIEW_URL =
  import.meta.env.SANITY_STUDIO_PREVIEW_URL || 'https://florianlepont.github.io/ajs-website/'

// The two GitHub Actions workflow files this module can track: staging
// (GitHub Pages, rebuilt on every content publish) and production (OVH,
// rebuilt only after a deliberate `Mettre en production` release).
export const STAGING_WORKFLOW_FILE = 'deploy.yml'
export const PRODUCTION_WORKFLOW_FILE = 'deploy-ovh.yml'

export const PRODUCTION_SITE_URL = 'https://atelierjacquelinesuzanne.fr'

export function workflowActionsUrl(workflowFile: string): string {
  return `https://github.com/florianlepont/ajs-website/actions/workflows/${workflowFile}`
}

export function workflowRunsUrl(workflowFile: string): string {
  return `https://api.github.com/repos/florianlepont/ajs-website/actions/workflows/${workflowFile}/runs?per_page=10`
}

export const GITHUB_WORKFLOW_URL = workflowActionsUrl(STAGING_WORKFLOW_FILE)

export const GITHUB_RUNS_URL = workflowRunsUrl(STAGING_WORKFLOW_FILE)

export interface DeploymentRun {
  id: number
  event: string
  status: string
  conclusion: string | null
  html_url: string
  created_at: string
  run_started_at: string | null
  updated_at: string
}

export async function getRecentDeployments(
  signal?: AbortSignal,
  workflowFile: string = STAGING_WORKFLOW_FILE,
): Promise<DeploymentRun[]> {
  const response = await fetch(workflowRunsUrl(workflowFile), {
    headers: {Accept: 'application/vnd.github+json'},
    signal,
  })
  if (!response.ok) throw new Error(`GitHub API: ${response.status}`)
  const payload = (await response.json()) as {workflow_runs?: DeploymentRun[]}
  return payload.workflow_runs ?? []
}

export async function getLatestDeployment(
  signal?: AbortSignal,
  workflowFile: string = STAGING_WORKFLOW_FILE,
): Promise<DeploymentRun | null> {
  return (await getRecentDeployments(signal, workflowFile))[0] ?? null
}

export type DeploymentTone = 'default' | 'caution' | 'positive' | 'critical'

export type DeploymentStateKind =
  | 'pending-content'
  | 'waiting-run'
  | 'deploying'
  | 'current'
  | 'failed'
  | 'unknown'

export interface DeploymentState {
  kind: DeploymentStateKind
  label: string
  detail: string
  tone: DeploymentTone
  terminal: boolean
  run?: DeploymentRun
  actionLabel?: string
  actionUrl: string
}

export type DeploymentTarget = 'staging' | 'production'

interface DeploymentTargetConfig {
  currentLabel: string
  siteUrl: string
  workflowUrl: string
}

const deploymentTargetConfig: Record<DeploymentTarget, DeploymentTargetConfig> = {
  staging: {
    currentLabel: 'Site de test à jour',
    siteUrl: SITE_PREVIEW_URL,
    workflowUrl: GITHUB_WORKFLOW_URL,
  },
  production: {
    currentLabel: 'Site en ligne à jour',
    siteUrl: PRODUCTION_SITE_URL,
    workflowUrl: workflowActionsUrl(PRODUCTION_WORKFLOW_FILE),
  },
}

function timestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

export function latestValidTimestamp(...values: Array<string | null | undefined>): string {
  return values
    .map((value) => ({value, time: timestamp(value)}))
    .filter((entry): entry is {value: string; time: number} => entry.time !== null)
    .sort((left, right) => right.time - left.time)[0]?.value ?? ''
}

function runTimelineIsCoherent(run: DeploymentRun): boolean {
  const createdAt = timestamp(run.created_at)
  const updatedAt = timestamp(run.updated_at)
  const startedAt = run.run_started_at ? timestamp(run.run_started_at) : createdAt
  return (
    createdAt !== null &&
    updatedAt !== null &&
    startedAt !== null &&
    createdAt <= startedAt &&
    startedAt <= updatedAt
  )
}

export function selectQualifiedRun(
  runs: DeploymentRun[],
  publishedAt: string,
): DeploymentRun | null {
  const threshold = timestamp(publishedAt)
  if (threshold === null) return null
  return (
    [...runs]
      .filter((run) => {
        const createdAt = timestamp(run.created_at)
        return createdAt !== null && createdAt >= threshold
      })
      .sort(
        (left, right) =>
          (timestamp(right.created_at) ?? 0) - (timestamp(left.created_at) ?? 0),
      )[0] ?? null
  )
}

function isPrecisionAmbiguousCandidate(
  run: DeploymentRun,
  publishedAtTime: number,
): boolean {
  const createdAt = timestamp(run.created_at)
  return (
    createdAt !== null &&
    Math.floor(createdAt / 1000) === Math.floor(publishedAtTime / 1000)
  )
}

function hasPrecisionAmbiguousCandidate(runs: DeploymentRun[], publishedAtTime: number): boolean {
  const publicationSecond = Math.floor(publishedAtTime / 1000)
  return runs.some((run) => {
    const createdAt = timestamp(run.created_at)
    return (
      createdAt !== null &&
      createdAt < publishedAtTime &&
      Math.floor(createdAt / 1000) === publicationSecond
    )
  })
}

function unknownDeployment(detail: string, workflowUrl: string): DeploymentState {
  return {
    kind: 'unknown',
    label: 'État temporairement indisponible',
    detail,
    tone: 'default',
    terminal: true,
    actionLabel: 'Voir les mises à jour',
    actionUrl: workflowUrl,
  }
}

export function deploymentState({
  runs,
  publishedAt,
  pendingCount,
  error,
  now = new Date(),
  target = 'staging',
}: {
  runs: DeploymentRun[]
  publishedAt: string
  pendingCount: number
  error?: unknown
  now?: Date
  target?: DeploymentTarget
}): DeploymentState {
  const {currentLabel, siteUrl, workflowUrl} = deploymentTargetConfig[target]

  if (pendingCount > 0) {
    return {
      kind: 'pending-content',
      label: 'Modifications en attente',
      detail: 'Le site reste inchangé tant que les brouillons ne sont pas publiés.',
      tone: 'caution',
      terminal: true,
      actionUrl: siteUrl,
    }
  }

  const publishedAtTime = timestamp(publishedAt)
  if (error || publishedAtTime === null) {
    return unknownDeployment("La fraîcheur du site n'a pas pu être vérifiée.", workflowUrl)
  }

  const qualifiedRun = selectQualifiedRun(runs, publishedAt)
  if (qualifiedRun && isPrecisionAmbiguousCandidate(qualifiedRun, publishedAtTime)) {
    return unknownDeployment(
      "La précision des horodatages ne permet pas de prouver si ce déploiement suit la publication.",
      workflowUrl,
    )
  }
  if (qualifiedRun && !runTimelineIsCoherent(qualifiedRun)) {
    return unknownDeployment(
      "La chronologie du déploiement sélectionné n'a pas pu être vérifiée.",
      workflowUrl,
    )
  }

  if (!qualifiedRun) {
    if (runs.some((run) => timestamp(run.created_at) === null)) {
      return unknownDeployment(
        "La date d'un déploiement récent n'a pas pu être interprétée.",
        workflowUrl,
      )
    }
    if (hasPrecisionAmbiguousCandidate(runs, publishedAtTime)) {
      return unknownDeployment(
        "La précision des horodatages ne permet pas de prouver si ce déploiement suit la publication.",
        workflowUrl,
      )
    }
    const timedOut = now.getTime() - publishedAtTime >= 3 * 60_000
    return {
      kind: 'waiting-run',
      label: timedOut ? 'Mise à jour non démarrée' : 'Mise à jour en attente',
      detail: timedOut
        ? "Aucun déploiement récent n'est apparu après la publication."
        : target === 'production'
          ? 'GitHub doit encore démarrer l’envoi vers le site en ligne.'
          : 'GitHub doit encore démarrer la reconstruction du site.',
      tone: timedOut ? 'critical' : 'caution',
      terminal: false,
      actionLabel: timedOut ? 'Prévenir le mainteneur' : 'Voir les mises à jour',
      actionUrl: workflowUrl,
    }
  }

  if (qualifiedRun.status !== 'completed') {
    return {
      kind: 'deploying',
      label: 'Mise à jour en cours',
      detail:
        target === 'production'
          ? 'GitHub envoie actuellement le site vers le site en ligne.'
          : 'GitHub reconstruit actuellement le site.',
      tone: 'caution',
      terminal: false,
      run: qualifiedRun,
      actionLabel: 'Voir le déploiement',
      actionUrl: qualifiedRun.html_url,
    }
  }

  if (qualifiedRun.conclusion === 'success') {
    return {
      kind: 'current',
      label: currentLabel,
      detail: 'Le déploiement postérieur à la publication a réussi.',
      tone: 'positive',
      terminal: true,
      run: qualifiedRun,
      actionLabel: 'Ouvrir le site',
      actionUrl: siteUrl,
    }
  }

  return {
    kind: 'failed',
    label: 'Échec de la mise à jour',
    detail:
      target === 'production'
        ? 'Les contenus sont publiés dans Sanity, mais le site en ligne peut encore afficher l’ancienne version.'
        : 'Les contenus sont publiés dans Sanity, mais le site peut encore afficher l’ancienne version.',
    tone: 'critical',
    terminal: true,
    run: qualifiedRun,
    actionLabel: 'Voir le déploiement',
    actionUrl: qualifiedRun.html_url,
  }
}

export function deploymentSubtitle(state: DeploymentState): string {
  return `Tous les contenus sont publiés · ${state.label}.`
}

export function nextDeploymentPollDelay({
  elapsedMs,
  terminal,
  firstPoll,
}: {
  elapsedMs: number
  terminal: boolean
  firstPoll: boolean
}): number {
  if (firstPoll) return 0
  if (terminal) return 5 * 60_000
  return elapsedMs < 2 * 60_000 ? 5_000 : 15_000
}

// --- Release pipeline state machine (sketch 016 Variant C) ---
//
// This is the ONLY place that decides what the 3-segment bar and the single
// promote row show. The dashboard component renders straight from this
// function's result -- no state derivation may live in the component.

export type PipelineSegmentKind = 'pending' | 'active' | 'done' | 'failed'

export interface ReleasePipelineSegments {
  content: PipelineSegmentKind
  staging: PipelineSegmentKind
  production: PipelineSegmentKind
}

export interface ReleasePipelinePromote {
  title: string
  detail: string
  buttonLabel: string
  buttonDisabled: boolean
  dimmed: boolean
  actionLabel?: string
  actionUrl?: string
}

export interface ReleasePipelineState {
  segments: ReleasePipelineSegments
  promote: ReleasePipelinePromote
}

function deploymentSegmentKind(kind: DeploymentStateKind): PipelineSegmentKind {
  if (kind === 'current') return 'done'
  if (kind === 'deploying' || kind === 'waiting-run') return 'active'
  if (kind === 'failed') return 'failed'
  return 'pending'
}

// Stale when there is no production release timestamp at all, or when the
// newest content publication parses to a strictly later instant than the
// production release timestamp. An unparseable value on either side is
// treated the same as "no proven release" -- fails toward re-enabling the
// button rather than getting permanently stuck on a stale "Production à
// jour", mirroring the module's general fail-closed-to-uncertain posture.
function isProductionReleaseStale(publishedAt: string, productionReleaseAt: string): boolean {
  if (!productionReleaseAt) return true
  const publishedTime = timestamp(publishedAt)
  const releaseTime = timestamp(productionReleaseAt)
  if (publishedTime === null || releaseTime === null) return true
  return publishedTime > releaseTime
}

function resolvePromoteRow({
  segments,
  staging,
  production,
  requestError,
}: {
  segments: ReleasePipelineSegments
  staging: DeploymentState
  production: DeploymentState
  requestError?: string
}): ReleasePipelinePromote {
  if (requestError) {
    return {
      title: 'La publication sur le site en ligne n’a pas pu démarrer.',
      detail: requestError,
      buttonLabel: 'Réessayer',
      buttonDisabled: false,
      dimmed: false,
    }
  }

  if (segments.production === 'active') {
    return {
      title: 'Publication sur le site en ligne en cours…',
      detail: 'GitHub construit et envoie le site vers son hébergement définitif.',
      buttonLabel: 'Publication en cours…',
      buttonDisabled: true,
      dimmed: false,
    }
  }

  if (segments.production === 'failed') {
    return {
      title: 'Échec de la publication sur le site en ligne.',
      detail:
        'Le site de test est à jour, mais l’envoi vers le site en ligne a échoué. Réessayez, ou prévenez le mainteneur.',
      buttonLabel: 'Réessayer',
      buttonDisabled: false,
      dimmed: false,
      actionLabel: production.actionLabel,
      actionUrl: production.actionUrl,
    }
  }

  if (segments.production === 'done') {
    return {
      title: 'Site en ligne à jour',
      detail: 'Le site en ligne reflète la dernière mise à jour.',
      buttonLabel: 'Site en ligne à jour ✓',
      buttonDisabled: true,
      dimmed: false,
    }
  }

  if (segments.staging === 'failed') {
    return {
      title: 'Échec de la mise à jour du site de test.',
      detail: 'La publication sur le site en ligne reste bloquée tant que le site de test n’est pas à jour.',
      buttonLabel: 'Publier sur le site en ligne',
      buttonDisabled: true,
      dimmed: true,
      actionLabel: staging.actionLabel,
      actionUrl: staging.actionUrl,
    }
  }

  // Two very different situations used to share one branch here. The first
  // is a not-started state -- there are unpublished drafts and nothing is
  // running, so the copy must not describe a wait; its only remedy is the
  // panel's own "Mettre le site à jour" button above. The second is a real
  // in-flight wait on a GitHub run once content is already published. Once
  // the first branch returns, reaching the second implies
  // segments.content === 'done', so that is not restated in its condition.
  if (segments.content !== 'done') {
    return {
      title: 'Rien n’a encore été lancé.',
      detail:
        'Commencez par « Mettre le site à jour » ci-dessus : vos modifications seront publiées et le site de test reconstruit.',
      buttonLabel: 'Publier sur le site en ligne',
      buttonDisabled: true,
      dimmed: true,
    }
  }

  if (segments.staging !== 'done') {
    return {
      title: 'En attente du site de test…',
      detail: 'L’étape 2 sera disponible une fois le site de test à jour.',
      buttonLabel: 'Publier sur le site en ligne',
      buttonDisabled: true,
      dimmed: true,
    }
  }

  return {
    title: 'Site de test à jour — prêt à publier ?',
    detail: 'Ouvrez le site de test pour vérifier avant de publier.',
    buttonLabel: 'Publier sur le site en ligne',
    buttonDisabled: false,
    dimmed: false,
  }
}

export function releasePipelineState({
  pendingCount,
  staging,
  production,
  publishedAt,
  productionReleaseAt,
  busy,
  requestError,
}: {
  pendingCount: number
  staging: DeploymentState
  production: DeploymentState
  publishedAt: string
  productionReleaseAt: string
  busy: boolean
  requestError?: string
}): ReleasePipelineState {
  const content: PipelineSegmentKind = pendingCount === 0 ? 'done' : 'pending'
  const stagingSegment = deploymentSegmentKind(staging.kind)
  const stale = isProductionReleaseStale(publishedAt, productionReleaseAt)
  const productionSegment: PipelineSegmentKind = busy
    ? 'active'
    : stale
      ? 'pending'
      : deploymentSegmentKind(production.kind)

  const segments: ReleasePipelineSegments = {
    content,
    staging: stagingSegment,
    production: productionSegment,
  }

  return {
    segments,
    promote: resolvePromoteRow({segments, staging, production, requestError}),
  }
}

// This is the ONLY place the three underlying pipeline stages
// (content/staging/production) collapse into the two the maintainer sees
// (site de test / site en ligne). The merged segment can only reach
// 'failed' via the site-de-test deploy, because releasePipelineState never
// assigns 'failed' to segments.content -- which is why the action row below
// the bar can still name which stage broke even though the bar no longer
// separates them.
export interface ReleasePipelineDisplaySegments {
  testSite: PipelineSegmentKind
  liveSite: PipelineSegmentKind
}

export function pipelineDisplaySegments(
  segments: ReleasePipelineSegments,
): ReleasePipelineDisplaySegments {
  const {content, staging, production} = segments
  const testSite: PipelineSegmentKind =
    content === 'failed' || staging === 'failed'
      ? 'failed'
      : content === 'active' || staging === 'active'
        ? 'active'
        : content === 'done' && staging === 'done'
          ? 'done'
          : 'pending'

  return {
    testSite,
    liveSite: production,
  }
}
