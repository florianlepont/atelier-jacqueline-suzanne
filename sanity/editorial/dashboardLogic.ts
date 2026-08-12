import type {ComponentType, SVGProps} from 'react'
import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PublishIcon} from '@sanity/icons/Publish'
import {TaskIcon} from '@sanity/icons/Task'
import type {TransactionLogEventWithMutations, TransactionLogMutation, User} from '@sanity/types'
import {getDocumentChecks, hasBlockingChecklist, summarizeChecks} from './checks'
import type {CheckItem} from './checks'
import {
  PUBLIC_DOCUMENT_LABELS,
  PUBLIC_SITE_DOCUMENT_TYPES,
  isPublicSiteDocumentType,
} from './workflowLogic'

export interface DashboardDocument extends Record<string, unknown> {
  _id: string
  _type: string
  _rev?: string
  _updatedAt: string
  title?: string
  isVisible?: boolean
  publicationStatus?: string
  images?: unknown[]
}

export interface DashboardRow {
  id: string
  current: DashboardDocument
  hasDraft: boolean
  isPublished: boolean
  lastUpdatedAt: string
  checks: CheckItem[]
  summary: ReturnType<typeof summarizeChecks>
}

export interface DashboardActivity {
  authorName: string
  authorImageUrl?: string
  description: string
  action: ActivityAction
  timestamp: string
}

export type ActivityAction = 'created' | 'modified' | 'published' | 'unpublished'

export type DashboardTone = 'default' | 'primary' | 'positive' | 'caution' | 'critical'

export type Severity = 'Bloquant' | 'Important' | 'Suggestion'

export type PublicationCategory = 'modified' | 'new' | 'withdrawal' | 'new-hidden'

export interface PublicationPair {
  id: string
  draft: DashboardDocument
  published?: DashboardDocument
  category: PublicationCategory
  title: string
}

export interface PublicationBlock {
  id: string
  type: string
  title: string
  reasons: string[]
}

export interface PublishDocumentAction {
  actionType: 'sanity.action.document.publish'
  draftId: string
  publishedId: string
  ifDraftRevisionId: string
  ifPublishedRevisionId?: string
}

// The two internal marker document ids the dashboard writes to. Widening the
// marker action interfaces and `DeploymentMarker` by this union (rather than
// duplicating each interface per marker) is what lets one implementation
// back both `buildDeploymentMarkerActions` (staging content-publish) and
// `buildProductionReleaseMarkerActions` (production release).
export const DEPLOYMENT_MARKER_ID = 'siteDeployment' as const
export const PRODUCTION_RELEASE_MARKER_ID = 'siteProductionRelease' as const
export type MarkerDocumentId = typeof DEPLOYMENT_MARKER_ID | typeof PRODUCTION_RELEASE_MARKER_ID

export interface CreateDeploymentMarkerAction {
  actionType: 'sanity.action.document.create'
  publishedId: MarkerDocumentId
  attributes: {
    _id: MarkerDocumentId
    _type: MarkerDocumentId
    buildSequence: number
    lastTriggeredAt: string
  }
  ifExists: 'fail'
}

export interface EditDeploymentMarkerAction {
  actionType: 'sanity.action.document.edit'
  draftId: `drafts.${MarkerDocumentId}`
  publishedId: MarkerDocumentId
  patch: {
    set: {
      buildSequence: number
      lastTriggeredAt: string
    }
  }
}

export interface PublishDeploymentMarkerAction {
  actionType: 'sanity.action.document.publish'
  draftId: `drafts.${MarkerDocumentId}`
  publishedId: MarkerDocumentId
  ifPublishedRevisionId?: string
}

export type DocumentAction =
  | PublishDocumentAction
  | CreateDeploymentMarkerAction
  | EditDeploymentMarkerAction
  | PublishDeploymentMarkerAction

export interface DeploymentMarker {
  _id: MarkerDocumentId
  _rev: string
  buildSequence: number
  lastTriggeredAt?: string
}

export interface PublicationBatch {
  total: number
  categories: Record<PublicationCategory, number>
  pairs: PublicationPair[]
  blockedRows: PublicationBlock[]
  orderedIds: string[]
  actions: PublishDocumentAction[]
  ready: boolean
}

export type PublicationPhase =
  | 'idle'
  | 'preflighting'
  | 'confirming'
  | 'publishing'
  | 'committed'
  | 'refreshing'
  | 'success'
  | 'tracking-error'
  | 'error'

export interface PublicationControllerState {
  phase: PublicationPhase
  batch?: PublicationBatch
  error?: string
  publishedAt?: string
  publishedIds?: string[]
}

export interface PublicationResult {
  committed: true
  trackingVerified: boolean
  publishedAt?: string
  publishedIds: string[]
}

export interface PublicationClient {
  fetch<T>(
    query: string,
    params?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<T>
  action(actions: DocumentAction[], options: {tag: string}): Promise<unknown>
}

export const PUBLIC_DOCUMENTS_QUERY =
  '*[_type in $types] | order(_updatedAt desc)'

export const PUBLIC_DOCUMENTS_QUERY_PARAMS = {
  types: [...PUBLIC_SITE_DOCUMENT_TYPES],
}

export const PUBLISHED_TIMESTAMPS_QUERY =
  '*[_id in $ids] {_id, _updatedAt}'

function markerQuery(id: MarkerDocumentId, extraFields: string[] = []): string {
  const fields = ['_id', '_rev', 'buildSequence', ...extraFields].join(', ')
  return `*[_id == '${id}' && _type == '${id}'][0] {${fields}}`
}

export const DEPLOYMENT_MARKER_QUERY = markerQuery(DEPLOYMENT_MARKER_ID)

export const PRODUCTION_RELEASE_MARKER_QUERY = markerQuery(PRODUCTION_RELEASE_MARKER_ID, [
  'lastTriggeredAt',
])

const EMPTY_CATEGORY_COUNTS: Record<PublicationCategory, number> = {
  modified: 0,
  new: 0,
  withdrawal: 0,
  'new-hidden': 0,
}

export interface AttentionGroup {
  id: string
  severity: Severity
  title: string
  description: string
  actionVerb: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: DashboardTone
  rows: DashboardRow[]
}

export const typeLabels: Record<string, string> = {
  ...PUBLIC_DOCUMENT_LABELS,
  homePage: "Page d'accueil",
  editionsPage: 'Page Éditions',
  aboutPage: 'Page À propos',
  contactPage: 'Page Contact',
  exhibition: 'Exposition',
}

export const rowTypeLabels: Record<string, string> = {
  gallery: 'Collection photo',
  edition: 'Édition',
  homePage: 'Page',
  editionsPage: 'Page',
  aboutPage: 'Page',
  contactPage: 'Page',
  siteSettings: 'Réglages',
  exhibition: 'Exposition',
}

export const fieldLabels: Record<string, string> = {
  title: 'le titre',
  slug: 'l’adresse',
  statement: 'la présentation',
  images: 'les photos',
  seo: 'le SEO',
  publicationStatus: 'la visibilité',
  isVisible: 'la visibilité',
  intro: 'l’introduction',
  biography: 'la biographie',
  practice: 'la pratique',
  medium: 'les techniques',
  publicEmail: 'l’adresse e-mail',
  professionalLinks: 'les liens',
  siteTitle: 'le nom du site',
  navLabels: 'la navigation',
  footerText: 'le pied de page',
  defaultSeo: 'le SEO global',
  startDate: 'la date',
  venue: 'le lieu',
  city: 'la ville',
  description: 'la description',
  image: 'l’image',
}

export function baseId(id: string) {
  return id.replace(/^drafts\./, '')
}

function isVisibleAfterPublication(document: DashboardDocument): boolean {
  if (document._type !== 'gallery' && document._type !== 'edition') return true
  if (document.publicationStatus) return document.publicationStatus === 'published'
  return document.isVisible !== false
}

function publicationCategory(
  draft: DashboardDocument,
  published?: DashboardDocument,
): PublicationCategory {
  if (isVisibleAfterPublication(draft)) return published ? 'modified' : 'new'
  return published ? 'withdrawal' : 'new-hidden'
}

function groupPublicVersions(documents: DashboardDocument[]) {
  const byId = new Map<
    string,
    {draft?: DashboardDocument; published?: DashboardDocument}
  >()
  for (const document of documents) {
    if (!isPublicSiteDocumentType(document._type)) continue
    const id = baseId(document._id)
    const versions = byId.get(id) ?? {}
    if (document._id.startsWith('drafts.')) versions.draft = document
    else versions.published = document
    byId.set(id, versions)
  }
  return byId
}

export function pairPublicDocuments(documents: DashboardDocument[]): PublicationPair[] {
  return Array.from(groupPublicVersions(documents), ([id, versions]) => {
    if (!versions.draft) return null
    return {
      id,
      draft: versions.draft,
      published: versions.published,
      category: publicationCategory(versions.draft, versions.published),
      title: documentTitle(versions.draft),
    }
  }).filter((pair): pair is PublicationPair => pair !== null)
}

function collectStrongReferenceIds(
  value: unknown,
  parentKey = '',
  found: string[] = [],
): string[] {
  if (!value || typeof value !== 'object') return found
  if (Array.isArray(value)) {
    for (const item of value) collectStrongReferenceIds(item, parentKey, found)
    return found
  }

  const object = value as Record<string, unknown>
  if (
    parentKey !== 'asset' &&
    object._type === 'reference' &&
    object._weak !== true &&
    typeof object._ref === 'string'
  ) {
    found.push(baseId(object._ref))
    return found
  }

  for (const [key, child] of Object.entries(object)) {
    if (key === 'asset' || key.startsWith('_')) continue
    collectStrongReferenceIds(child, key, found)
  }
  return found
}

function topologicalOrder(
  pairs: PublicationPair[],
  dependencies: Map<string, Set<string>>,
): string[] | null {
  const originalOrder = pairs.map(({id}) => id)
  const dependants = new Map<string, Set<string>>()
  const indegree = new Map(originalOrder.map((id) => [id, 0]))

  for (const [dependant, targets] of dependencies) {
    for (const target of targets) {
      if (!indegree.has(target)) continue
      const targetDependants = dependants.get(target) ?? new Set<string>()
      targetDependants.add(dependant)
      dependants.set(target, targetDependants)
      indegree.set(dependant, (indegree.get(dependant) ?? 0) + 1)
    }
  }

  const queue = originalOrder.filter((id) => indegree.get(id) === 0)
  const ordered: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    ordered.push(id)
    for (const dependant of dependants.get(id) ?? []) {
      indegree.set(dependant, (indegree.get(dependant) ?? 1) - 1)
      if (indegree.get(dependant) === 0) queue.push(dependant)
    }
  }
  return ordered.length === pairs.length ? ordered : null
}

export function preparePublicationBatch(documents: DashboardDocument[]): PublicationBatch {
  const allVersions = groupPublicVersions(documents)
  const pairs = pairPublicDocuments(documents)
  const blocks = new Map<string, PublicationBlock>()
  const dependencies = new Map<string, Set<string>>()

  const block = (pair: PublicationPair, reason: string) => {
    const current = blocks.get(pair.id) ?? {
      id: pair.id,
      type: pair.draft._type,
      title: pair.title,
      reasons: [],
    }
    if (!current.reasons.includes(reason)) current.reasons.push(reason)
    blocks.set(pair.id, current)
  }

  for (const pair of pairs) {
    if (!pair.draft._rev) {
      block(pair, 'Révision du brouillon indisponible.')
    }
    if (pair.published && !pair.published._rev) {
      block(pair, 'Révision de la version publiée indisponible.')
    }

    if (!hasBlockingChecklist(pair.draft._type)) {
      block(
        pair,
        `Aucune checklist bloquante n'est définie pour ${pair.draft._type}.`,
      )
      continue
    }

    const checks = getDocumentChecks(pair.draft._type, pair.draft)
    const summary = summarizeChecks(checks)
    if (!summary.requiredComplete) {
      for (const check of checks.filter((item) => !item.recommended && !item.complete)) {
        block(pair, check.label)
      }
      if (checks.length === 0) block(pair, 'Checklist obligatoire absente.')
    }

    const targets = new Set(collectStrongReferenceIds(pair.draft))
    dependencies.set(pair.id, targets)
    for (const targetId of targets) {
      const target = allVersions.get(targetId)
      if (!target?.published && !target?.draft) {
        block(pair, `Référence indisponible : ${targetId}.`)
      }
    }
  }

  let orderedIds = topologicalOrder(pairs, dependencies)
  if (!orderedIds) {
    for (const pair of pairs) block(pair, 'Cycle de références fortes dans le lot.')
    orderedIds = []
  }

  const blockedRows = Array.from(blocks.values())
  const ready = pairs.length > 0 && blockedRows.length === 0
  const pairsById = new Map(pairs.map((pair) => [pair.id, pair]))
  const actions = ready
    ? orderedIds.map((id): PublishDocumentAction => {
        const pair = pairsById.get(id)!
        return {
          actionType: 'sanity.action.document.publish',
          draftId: pair.draft._id,
          publishedId: pair.id,
          ifDraftRevisionId: pair.draft._rev!,
          ...(pair.published?._rev
            ? {ifPublishedRevisionId: pair.published._rev}
            : {}),
        }
      })
    : []

  const categories = {...EMPTY_CATEGORY_COUNTS}
  for (const pair of pairs) categories[pair.category] += 1

  return {
    total: pairs.length,
    categories,
    pairs,
    blockedRows,
    orderedIds,
    actions,
    ready,
  }
}

const markerLabels: Record<MarkerDocumentId, string> = {
  [DEPLOYMENT_MARKER_ID]: 'déploiement',
  [PRODUCTION_RELEASE_MARKER_ID]: 'mise en production',
}

// Returns ONLY the create-or-edit-then-publish pair for the given marker.
// Shared by buildDeploymentMarkerActions (bundled with content-publish
// actions) and buildProductionReleaseMarkerActions (standalone).
function markerActions(
  markerId: MarkerDocumentId,
  marker: DeploymentMarker | null | undefined,
  lastTriggeredAt: string,
): DocumentAction[] {
  if (!marker) {
    return [
      {
        actionType: 'sanity.action.document.create',
        publishedId: markerId,
        attributes: {
          _id: markerId,
          _type: markerId,
          buildSequence: 1,
          lastTriggeredAt,
        },
        ifExists: 'fail',
      },
      {
        actionType: 'sanity.action.document.publish',
        draftId: `drafts.${markerId}`,
        publishedId: markerId,
      },
    ]
  }

  if (!Number.isSafeInteger(marker.buildSequence) || marker.buildSequence < 1 || !marker._rev) {
    throw new Error(`Marqueur technique de ${markerLabels[markerId]} invalide. Actualisez et réessayez.`)
  }

  return [
    {
      actionType: 'sanity.action.document.edit',
      draftId: `drafts.${markerId}`,
      publishedId: markerId,
      patch: {
        set: {
          buildSequence: marker.buildSequence + 1,
          lastTriggeredAt,
        },
      },
    },
    {
      actionType: 'sanity.action.document.publish',
      draftId: `drafts.${markerId}`,
      publishedId: markerId,
      ifPublishedRevisionId: marker._rev,
    },
  ]
}

export function buildDeploymentMarkerActions(
  publicActions: PublishDocumentAction[],
  marker: DeploymentMarker | null | undefined,
  lastTriggeredAt: string,
): DocumentAction[] {
  return [...publicActions, ...markerActions(DEPLOYMENT_MARKER_ID, marker, lastTriggeredAt)]
}

// Deliberately takes NO `publicActions` parameter. The Sanity Actions API
// commits its array as one transaction, so the only safe guarantee that a
// production release can never be bundled into a content-publish batch is
// that content actions cannot be handed to this builder at all -- the
// absence of the parameter is the guarantee, not a comment.
export function buildProductionReleaseMarkerActions(
  marker: DeploymentMarker | null | undefined,
  lastTriggeredAt: string,
): DocumentAction[] {
  return markerActions(PRODUCTION_RELEASE_MARKER_ID, marker, lastTriggeredAt)
}

export function publicationError(reason: unknown): string {
  if (reason instanceof Error) return reason.message
  return typeof reason === 'string' ? reason : 'Erreur de publication inconnue.'
}

export class ConfirmationChangedError extends Error {
  constructor() {
    super(
      'Le lot a changé pendant la mise à jour. Rien n’a été publié. Vérifiez le récapitulatif actualisé, puis cliquez à nouveau sur « Mettre le site à jour ».',
    )
    this.name = 'ConfirmationChangedError'
  }
}

export function batchFingerprint(batch: PublicationBatch): string {
  return JSON.stringify(
    batch.pairs
      .map((pair) => [pair.id, pair.draft._rev ?? null, pair.published?._rev ?? null])
      .sort(([left], [right]) => String(left).localeCompare(String(right))),
  )
}

// The third options field and the corresponding return field that used to
// mirror whether the confirmation card was open were removed with the card
// itself: the state they mirrored no longer exists. Do not bring either back.
export function publicationCardState(
  inventory: PublicationBatch,
  {
    busy,
    trackingFailed,
  }: {
    busy: boolean
    trackingFailed: boolean
  },
) {
  return {
    total: inventory.total,
    pairs: inventory.pairs,
    blockedRows: inventory.blockedRows,
    buttonDisabled:
      busy || trackingFailed || inventory.total === 0 || inventory.blockedRows.length > 0,
  }
}

export function createInventoryGenerationGuard<T>() {
  let latestGeneration = 0
  let active = true

  return {
    start() {
      latestGeneration += 1
      return latestGeneration
    },
    isCurrent(generation: number) {
      return active && generation === latestGeneration
    },
    accept(generation: number, value: T, apply: (accepted: T) => void) {
      if (!active || generation !== latestGeneration) return false
      apply(value)
      return true
    },
    invalidate() {
      active = false
      latestGeneration += 1
    },
    // Undoes invalidate(). React 18 Strict Mode intentionally mounts every
    // effect, cleans it up once, then mounts it again (to surface effects
    // that aren't safe to re-run) — an effect that calls invalidate() only
    // from its cleanup would permanently kill the ONE guard instance the
    // component ever uses, before its first real fetch could resolve.
    // Pairing invalidate() in cleanup with reactivate() in the same
    // effect's setup makes that mount/cleanup/mount cycle a no-op, while a
    // genuine final unmount (setup never runs again) still leaves the
    // guard invalidated for good.
    reactivate() {
      active = true
    },
  }
}

// Survives the removal of the confirmation card on purpose. The card gated
// public/private visibility -- that premise is gone now that "Mettre le
// site à jour" only publishes into Sanity and rebuilds the site de test.
// This function gates something unrelated: CONTENT QUALITY. It hands the
// batch back only when `batch.ready`, and `ready` is false whenever any row
// is missing an "Indispensable" field. Returning `null` here means nothing
// may be published -- this is the sole precondition guarding the merged
// one-click publish helper immediately below, and `publish()`'s own read of
// `confirmedBatch`, which only `preflight()` sets. Do not inline this away
// or relax it because the name says "Confirmation" and reads like leftover
// dialog machinery -- it is not. The name stays exactly as-is so the
// existing call sites and their tests remain stable.
export async function preflightForConfirmation(controller: {
  preflight(): Promise<PublicationBatch>
}): Promise<PublicationBatch | null> {
  try {
    const batch = await controller.preflight()
    return batch.ready ? batch : null
  } catch {
    return null
  }
}

// The whole one-click contract: one gesture, gate first, publish only if the
// gate passes. `publish()` cannot be called without a preceding `preflight()`
// -- it reads the private confirmed batch that only `preflight()` sets, and
// throws "Aucune modification à publier." otherwise. No try/catch here on
// purpose: a rejection from `publish()` must propagate, because the
// controller has already recorded the user-facing error state by the time it
// rejects, and the caller only needs to stop. Returning `null` means the
// content-quality gate refused and NOTHING was published.
export async function publishAfterPreflight(controller: {
  preflight(): Promise<PublicationBatch>
  publish(): Promise<PublicationResult>
}): Promise<PublicationResult | null> {
  const batch = await preflightForConfirmation(controller)
  if (!batch) return null
  return controller.publish()
}

export function createPublicationController({
  client,
  onInventoryRequestStart,
  onInventory,
  onRefresh,
  onStateChange,
}: {
  client: PublicationClient
  onInventoryRequestStart?: () => number
  onInventory?: (documents: DashboardDocument[], generation?: number) => void
  onRefresh?: () => void | Promise<void>
  onStateChange?: (state: PublicationControllerState) => void
}) {
  let currentState: PublicationControllerState = {phase: 'idle'}
  let confirmedBatch: PublicationBatch | undefined
  let committedBatch: PublicationBatch | undefined
  let committedPublishedIds: string[] = []
  let publishPromise: Promise<PublicationResult> | null = null
  let trackingPromise: Promise<PublicationResult> | null = null

  const setState = (state: PublicationControllerState) => {
    currentState = state
    onStateChange?.(state)
  }
  const fetchRaw = async () => {
    const generation = onInventoryRequestStart?.()
    const documents = await client.fetch<DashboardDocument[]>(
      PUBLIC_DOCUMENTS_QUERY,
      PUBLIC_DOCUMENTS_QUERY_PARAMS,
      {perspective: 'raw'},
    )
    if (generation === undefined) onInventory?.(documents)
    else onInventory?.(documents, generation)
    return documents
  }

  const fetchPublishedAt = async (publishedIds: string[]) => {
    const timestamps = await client.fetch<Array<{_id: string; _updatedAt: string}>>(
      PUBLISHED_TIMESTAMPS_QUERY,
      {ids: publishedIds},
      {perspective: 'published'},
    )
    const validById = new Map(
      timestamps
        .filter(
          ({_id, _updatedAt}) =>
            publishedIds.includes(_id) && Number.isFinite(new Date(_updatedAt).getTime()),
        )
        .map(({_id, _updatedAt}) => [_id, _updatedAt] as const),
    )
    const missingIds = publishedIds.filter((id) => !validById.has(id))
    if (missingIds.length > 0) {
      throw new Error(`Horodatage Sanity manquant pour : ${missingIds.join(', ')}.`)
    }
    return [...validById.values()].sort(
      (left, right) => new Date(right).getTime() - new Date(left).getTime(),
    )[0]
  }

  const fetchDeploymentMarker = async (): Promise<DeploymentMarker | null> => {
    const marker = await client.fetch<DeploymentMarker | null>(
      DEPLOYMENT_MARKER_QUERY,
      {},
      {perspective: 'published'},
    )
    return marker
  }

  const trackCommittedPublication = () => {
    if (trackingPromise) return trackingPromise
    if (!committedBatch || committedPublishedIds.length === 0) {
      return Promise.reject(new Error('Aucune publication confirmée à suivre.'))
    }

    const batch = committedBatch
    const publishedIds = [...committedPublishedIds]
    setState({phase: 'refreshing', batch, publishedIds})

    let refreshRequest: Promise<void>
    try {
      refreshRequest = Promise.resolve(onRefresh?.())
    } catch (reason) {
      refreshRequest = Promise.reject(reason)
    }

    trackingPromise = (async (): Promise<PublicationResult> => {
      const [refreshResult, timestampResult] = await Promise.allSettled([
        refreshRequest,
        fetchPublishedAt(publishedIds),
      ])
      const publishedAt =
        timestampResult.status === 'fulfilled' ? timestampResult.value : undefined
      const failures = [refreshResult, timestampResult]
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => publicationError(result.reason))

      if (failures.length > 0) {
        setState({
          phase: 'tracking-error',
          batch,
          publishedAt,
          publishedIds,
          error: `Contenus publiés dans Sanity; fraîcheur du site non vérifiable. ${failures.join(' ')}`,
        })
        return {
          committed: true,
          trackingVerified: false,
          publishedAt,
          publishedIds,
        }
      }

      setState({phase: 'success', batch, publishedAt, publishedIds})
      return {
        committed: true,
        trackingVerified: true,
        publishedAt,
        publishedIds,
      }
    })().finally(() => {
      trackingPromise = null
    })

    return trackingPromise
  }

  const preflight = async () => {
    setState({phase: 'preflighting'})
    try {
      const batch = preparePublicationBatch(await fetchRaw())
      confirmedBatch = batch
      setState({phase: batch.ready || batch.total > 0 ? 'confirming' : 'idle', batch})
      return batch
    } catch (reason) {
      setState({phase: 'error', error: publicationError(reason)})
      throw reason
    }
  }

  const publish = () => {
    if (publishPromise) return publishPromise

    publishPromise = (async () => {
      let batch = confirmedBatch
      let committed = false
      try {
        if (!batch?.ready) {
          const reason =
            !batch || batch.total === 0
              ? 'Aucune modification à publier.'
              : 'Le lot de publication contient des informations bloquantes.'
          throw new Error(reason)
        }

        setState({phase: 'publishing', batch})
        const freshBatch = preparePublicationBatch(await fetchRaw())
        if (batchFingerprint(freshBatch) !== batchFingerprint(batch)) {
          confirmedBatch = freshBatch
          const reason = new ConfirmationChangedError()
          setState({phase: 'confirming', batch: freshBatch, error: reason.message})
          if (!freshBatch.ready) {
            try {
              await onRefresh?.()
            } catch {
              // The controller batch remains the visible fail-closed source of
              // truth when the best-effort inventory refresh cannot complete.
            }
          }
          throw reason
        }
        if (!freshBatch.ready) {
          confirmedBatch = freshBatch
          throw new Error('Le lot de publication contient des informations bloquantes.')
        }

        batch = freshBatch
        const marker = await fetchDeploymentMarker()
        const actions = buildDeploymentMarkerActions(batch.actions, marker, new Date().toISOString())
        await client.action(actions, {tag: 'editorial.publish-all'})
        committed = true
        committedBatch = batch
        committedPublishedIds = batch.actions.map(({publishedId}) => publishedId)
        confirmedBatch = undefined
        setState({
          phase: 'committed',
          batch,
          publishedIds: committedPublishedIds,
        })
        return await trackCommittedPublication()
      } catch (reason) {
        if (!committed && !(reason instanceof ConfirmationChangedError)) {
          setState({
            phase: 'error',
            batch,
            error: publicationError(reason),
          })
        }
        throw reason
      } finally {
        publishPromise = null
      }
    })()

    return publishPromise
  }

  return {
    get state() {
      return currentState
    },
    preflight,
    publish,
    refreshTracking: trackCommittedPublication,
  }
}

// Publishes the siteProductionRelease marker in a single tagged Actions API
// call and returns the timestamp it wrote. No try/catch here: the caller
// owns error presentation, exactly as createPublicationController leaves
// publicationError formatting to its own state machine.
export async function triggerProductionRelease(
  client: PublicationClient,
  now: Date = new Date(),
): Promise<string> {
  const marker = await client.fetch<DeploymentMarker | null>(
    PRODUCTION_RELEASE_MARKER_QUERY,
    {},
    {perspective: 'published'},
  )
  const lastTriggeredAt = now.toISOString()
  const actions = buildProductionReleaseMarkerActions(marker, lastTriggeredAt)
  await client.action(actions, {tag: 'editorial.production-release'})
  return lastTriggeredAt
}

export function pluralize(count: number, singular: string, plural: string = `${singular}s`) {
  return count > 1 ? plural : singular
}

export function documentTitle(document: DashboardDocument) {
  if (
    document._type === 'gallery' ||
    document._type === 'edition' ||
    document._type === 'exhibition'
  ) {
    return (
      document.title ||
      (document._type === 'gallery'
        ? 'Collection sans nom'
        : document._type === 'edition'
          ? 'Édition sans nom'
          : 'Événement sans nom')
    )
  }
  return typeLabels[document._type] || document._type
}

export function isGalleryOnline(document: DashboardDocument) {
  return document.publicationStatus
    ? document.publicationStatus === 'published'
    : document.isVisible !== false
}

export function mutationDocumentId(mutation: TransactionLogMutation) {
  if ('patch' in mutation) return 'id' in mutation.patch ? mutation.patch.id : undefined
  if ('delete' in mutation) return 'id' in mutation.delete ? mutation.delete.id : undefined
  if ('create' in mutation) return mutation.create._id
  if ('createOrReplace' in mutation) return mutation.createOrReplace._id
  if ('createIfNotExists' in mutation) return mutation.createIfNotExists._id
  if ('createSquashed' in mutation) return mutation.createSquashed.document._id
  return undefined
}

export function mutationFields(mutation: TransactionLogMutation) {
  if (!('patch' in mutation)) return []

  const patch = mutation.patch as unknown as Record<string, unknown>
  const paths: string[] = []
  for (const operation of ['set', 'setIfMissing', 'merge', 'diffMatchPatch', 'inc', 'dec']) {
    const value = patch[operation]
    if (value && typeof value === 'object') paths.push(...Object.keys(value))
  }
  if (Array.isArray(patch.unset))
    paths.push(...patch.unset.filter((path): path is string => typeof path === 'string'))

  const insert = patch.insert
  if (insert && typeof insert === 'object') {
    const position = insert as Record<string, unknown>
    for (const key of ['before', 'after', 'replace']) {
      if (typeof position[key] === 'string') paths.push(position[key])
    }
  }

  return paths
    .map((path) =>
      path
        .replace(/^\[['"]?/, '')
        .split(/[.[]/, 1)[0]
        .replace(/['"]?\]$/, ''),
    )
    .filter((field) => field && !field.startsWith('_'))
}

export function contentNoun(document: DashboardDocument) {
  if (document._type === 'gallery') return 'cette collection'
  if (document._type === 'exhibition') return 'cette exposition'
  if (document._type === 'siteSettings') return 'les réglages du site'
  return 'cette page'
}

export function describeTransaction(
  document: DashboardDocument,
  mutations: TransactionLogMutation[],
  id: string,
) {
  const relevant = mutations.filter((mutation) => baseId(mutationDocumentId(mutation) || '') === id)
  const publishedWrite = relevant.some(
    (mutation) =>
      mutationDocumentId(mutation) === id &&
      ('create' in mutation || 'createOrReplace' in mutation || 'createIfNotExists' in mutation),
  )
  const draftDeleted = relevant.some(
    (mutation) => 'delete' in mutation && mutationDocumentId(mutation) === `drafts.${id}`,
  )
  const publishedDeleted = relevant.some(
    (mutation) => 'delete' in mutation && mutationDocumentId(mutation) === id,
  )
  const created = relevant.some(
    (mutation) =>
      'create' in mutation || 'createOrReplace' in mutation || 'createIfNotExists' in mutation,
  )

  if (publishedWrite && draftDeleted) {
    return {action: 'published' as const, description: `a publié ${contentNoun(document)}`}
  }
  if (publishedDeleted && !publishedWrite) {
    return {
      action: 'unpublished' as const,
      description: `a retiré ${contentNoun(document)} du site`,
    }
  }
  if (created) return {action: 'created' as const, description: `a créé ${contentNoun(document)}`}

  const labels = Array.from(
    new Set(
      relevant
        .flatMap(mutationFields)
        .map((field) => fieldLabels[field])
        .filter(Boolean),
    ),
  )
  if (labels.length === 1)
    return {action: 'modified' as const, description: `a modifié ${labels[0]}`}
  if (labels.length === 2) {
    return {
      action: 'modified' as const,
      description: `a modifié ${labels[0]} et ${labels[1]}`,
    }
  }
  if (labels.length > 2) {
    return {
      action: 'modified' as const,
      description: `a modifié ${labels[0]}, ${labels[1]} et ${labels.length - 2} autre(s) élément(s)`,
    }
  }
  return {action: 'modified' as const, description: `a modifié ${contentNoun(document)}`}
}

export function buildActivities(
  transactions: TransactionLogEventWithMutations[],
  users: User[],
  documents: DashboardDocument[],
) {
  const usersById = new Map(users.map((user) => [user.id, user]))
  const documentsById = new Map(documents.map((document) => [baseId(document._id), document]))
  const activities: Record<string, DashboardActivity> = {}

  for (const transaction of [...transactions].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  )) {
    for (const transactionDocumentId of transaction.documentIDs) {
      const id = baseId(transactionDocumentId)
      const document = documentsById.get(id)
      if (!document || activities[id]) continue

      const user = usersById.get(transaction.author)
      const activity = describeTransaction(document, transaction.mutations, id)
      activities[id] = {
        authorName: user?.displayName || user?.email || 'Un membre de l’équipe',
        authorImageUrl: user?.imageUrl,
        ...activity,
        timestamp: transaction.timestamp,
      }
    }
  }

  return activities
}

export function buildAttentionGroups(rows: DashboardRow[]): AttentionGroup[] {
  const groups: AttentionGroup[] = [
    {
      id: 'blocking',
      severity: 'Bloquant',
      title: 'Informations manquantes',
      description: 'Empêche la publication de ce contenu',
      actionVerb: 'Compléter',
      icon: ErrorOutlineIcon,
      tone: 'critical',
      rows: [],
    },
    {
      id: 'publish',
      severity: 'Important',
      title: 'Modifications à publier',
      description: 'Le site affiche encore l’ancienne version',
      actionVerb: 'Publier',
      icon: PublishIcon,
      tone: 'caution',
      rows: [],
    },
    {
      id: 'finish',
      severity: 'Important',
      title: 'À finaliser',
      description: 'Encore en préparation ou hors ligne',
      actionVerb: 'Finaliser',
      icon: TaskIcon,
      tone: 'primary',
      rows: [],
    },
    {
      id: 'recommended',
      severity: 'Suggestion',
      title: 'Améliorations recommandées',
      description: 'Optionnel — améliore la visibilité sur Google',
      actionVerb: 'Améliorer',
      icon: BulbOutlineIcon,
      tone: 'default',
      rows: [],
    },
  ]

  for (const row of rows) {
    if (!row.summary.requiredComplete) groups[0].rows.push(row)
    else if (row.hasDraft && row.isPublished) groups[1].rows.push(row)
    else if (
      row.current.publicationStatus === 'preparation' ||
      (!row.current.publicationStatus && row.current.isVisible === false) ||
      !row.isPublished
    ) {
      groups[2].rows.push(row)
    } else {
      groups[3].rows.push(row)
    }
  }

  return groups.filter((group) => group.rows.length > 0)
}

export function attentionPriority(row: DashboardRow) {
  if (!row.summary.requiredComplete) return 0
  if (row.hasDraft && row.isPublished) return 1
  if (
    row.current.publicationStatus === 'preparation' ||
    (!row.current.publicationStatus && row.current.isVisible === false) ||
    !row.isPublished
  ) {
    return 2
  }
  return 3
}

export function compactCheckLabel(label: string) {
  return label
    .replace(/français et anglais|française et anglaise|françaises et anglaises/gi, 'FR et EN')
    .replace('Libellés FR et EN des liens professionnels', 'Libellés des liens FR et EN')
    .replace('Descriptions manquantes :', 'Textes alternatifs :')
    .replace('Descriptions accessibles de toutes les photos', 'Textes alternatifs des photos')
    .replace('Titres SEO FR et EN', 'Titre pour Google (FR et EN)')
    .replace('Descriptions SEO FR et EN', 'Description pour Google (FR et EN)')
    .replace('Image de partage', 'Aperçu sur les réseaux sociaux')
}

// Title and description for Google almost always go missing together; naming
// them as two list items doubled the "(FR et EN)" noise on every row.
export function mergePairedCheckLabels(labels: string[]) {
  const title = 'Titre pour Google (FR et EN)'
  const description = 'Description pour Google (FR et EN)'
  if (!labels.includes(title) || !labels.includes(description)) return labels
  return [
    'Titre et description pour Google (FR et EN)',
    ...labels.filter((label) => label !== title && label !== description),
  ]
}

export function attentionRowSummary(row: DashboardRow, group: AttentionGroup) {
  if (group.id === 'publish') return 'Publier les modifications en attente'
  if (group.id === 'finish') return 'Finaliser le contenu et le mettre en ligne'

  const recommended = group.id === 'recommended'
  const missing = mergePairedCheckLabels(
    row.checks
      .filter((check) => !check.complete && Boolean(check.recommended) === recommended)
      .map((check) => compactCheckLabel(check.label)),
  )

  // Naming the first couple of items outright ("Image de couverture,
  // description anglaise et 3 autres informations") lets the user gauge the
  // effort before opening the content -- a bare count ("5 informations à
  // compléter") reads clearer for one item but leaves the rest abstract.
  if (missing.length === 0) return ''
  if (missing.length === 1) return missing[0]
  if (missing.length === 2) return `${missing[0]} et ${missing[1]}`
  const rest = missing.length - 2
  return `${missing[0]}, ${missing[1]} et ${rest} ${pluralize(rest, 'autre information', 'autres informations')} à compléter`
}

export function attentionRowSummaryDetail(row: DashboardRow, group: AttentionGroup) {
  if (group.id === 'publish' || group.id === 'finish') return attentionRowSummary(row, group)
  const recommended = group.id === 'recommended'
  const missing = row.checks
    .filter((check) => !check.complete && Boolean(check.recommended) === recommended)
    .map((check) => compactCheckLabel(check.label))
  // The tooltip keeps the unmerged list: it exists to show the full detail.
  return missing.join(' · ')
}

export function editorialStatus(row: DashboardRow): {label: string; tone: DashboardTone} {
  if (row.current.publicationStatus === 'archived') return {label: 'Archivé', tone: 'default'}
  if (
    row.current.publicationStatus === 'preparation' ||
    (!row.current.publicationStatus && row.current.isVisible === false)
  ) {
    return {label: 'En préparation', tone: 'caution'}
  }
  if (row.hasDraft && row.isPublished) {
    return {label: 'Modifications non publiées', tone: 'primary'}
  }
  if (row.isPublished && (row.current._type !== 'gallery' || isGalleryOnline(row.current))) {
    return {label: 'En ligne', tone: 'positive'}
  }
  return {label: 'En préparation', tone: 'caution'}
}

function sameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function formatActivityDate(value: string, now: Date = new Date()) {
  const date = new Date(value)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const time = date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})

  if (sameCalendarDay(date, now)) return `Aujourd’hui à ${time}`
  if (sameCalendarDay(date, yesterday)) return `Hier à ${time}`
  return `${date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} à ${time}`
}

export function formatRelativeDate(value: string, now: Date = new Date()) {
  const date = new Date(value)
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameCalendarDay(date, yesterday)) return 'hier'
  const days = Math.round(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? {year: 'numeric'} : {}),
  })
}
