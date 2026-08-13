import {useEffect, useMemo, useRef, useState} from 'react'
import type {ComponentType, SVGProps} from 'react'
import {Badge, Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {IntentButton, useClient, useHistoryStore, useUserStore} from 'sanity'
import {IntentLink} from 'sanity/router'
import {AddIcon} from '@sanity/icons/Add'
import {BookIcon} from '@sanity/icons/Book'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CogIcon} from '@sanity/icons/Cog'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {FolderIcon} from '@sanity/icons/Folder'
import {ImagesIcon} from '@sanity/icons/Images'
import {LaunchIcon} from '@sanity/icons/Launch'
import {PublishIcon} from '@sanity/icons/Publish'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {
  deploymentSubtitle,
  deploymentState,
  getRecentDeployments,
  latestValidTimestamp,
  nextDeploymentPollDelay,
  SITE_PREVIEW_URL,
} from './deployment'
import type {DeploymentRun, DeploymentState} from './deployment'
import {getDocumentChecks, summarizeChecks} from './checks'
import {
  attentionPriority,
  attentionRowSummary,
  attentionRowSummaryDetail,
  baseId,
  buildActivities,
  buildAttentionGroups,
  contentNoun,
  createInventoryGenerationGuard,
  createPublicationController,
  documentTitle,
  editorialStatus,
  formatActivityDate,
  formatRelativeDate,
  pluralize,
  preflightForConfirmation,
  preparePublicationBatch,
  publicationCardState,
  PUBLIC_DOCUMENTS_QUERY,
  PUBLIC_DOCUMENTS_QUERY_PARAMS,
  rowTypeLabels,
} from './dashboardLogic'
import type {
  AttentionGroup,
  DashboardActivity,
  DashboardDocument,
  DashboardRow,
  DashboardTone,
  PublicationCategory,
  PublicationClient,
  PublicationControllerState,
} from './dashboardLogic'
import './EditorialDashboard.css'

const publicationCategoryLabels: Record<PublicationCategory, string> = {
  modified: 'Modifié',
  new: 'Nouveau',
  withdrawal: 'Sera retiré du site',
  'new-hidden': 'Nouveau, gardé hors ligne',
}

export function EditorialDashboard() {
  const client = useClient({apiVersion: '2025-08-15'})
  const historyStore = useHistoryStore()
  const userStore = useUserStore()
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  const [activities, setActivities] = useState<Record<string, DashboardActivity>>({})
  const [deploymentRuns, setDeploymentRuns] = useState<DeploymentRun[]>([])
  const [deploymentError, setDeploymentError] = useState<unknown>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showAllAttention, setShowAllAttention] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [publicationState, setPublicationState] = useState<PublicationControllerState>({
    phase: 'idle',
  })
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [publishedAt, setPublishedAt] = useState<string>()
  const hasDataRef = useRef(false)
  // A client replacement is a lifecycle boundary: the old client's pending
  // inventory responses must never update the new client's dashboard.
  const inventoryGenerationGuard = useMemo(
    () => createInventoryGenerationGuard<DashboardDocument[]>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client],
  )
  const publicationController = useMemo(
    () =>
      createPublicationController({
        client: client as unknown as PublicationClient,
        onInventoryRequestStart: () => inventoryGenerationGuard.start(),
        onInventory: (content, generation) => {
          if (generation === undefined) return
          inventoryGenerationGuard.accept(generation, content, (accepted) => {
            setDocuments(accepted)
            setError('')
            hasDataRef.current = true
          })
        },
        onRefresh: () => setRefreshKey((key) => key + 1),
        onStateChange: setPublicationState,
      }),
    [client, inventoryGenerationGuard],
  )

  useEffect(() => {
    let cancelled = false
    const generation = inventoryGenerationGuard.start()
    client
      .fetch<DashboardDocument[]>(
        PUBLIC_DOCUMENTS_QUERY,
        PUBLIC_DOCUMENTS_QUERY_PARAMS,
        {perspective: 'raw'},
      )
      .then((content) => {
        if (cancelled) return
        const accepted = inventoryGenerationGuard.accept(generation, content, (inventory) => {
          setDocuments(inventory)
          setError('')
          hasDataRef.current = true
        })
        // Primary content has arrived (or this fetch is now stale). The
        // dashboard can render immediately — it must not stay stuck on the
        // spinner waiting for the supplementary activity feed below, which
        // has no timeout and can hang (neither resolve nor reject) without
        // ever tripping a catch block.
        if (!cancelled && inventoryGenerationGuard.isCurrent(generation)) setLoading(false)
        if (!accepted) return

        try {
          const documentIds = Array.from(
            new Set(
              content.flatMap((document) => [
                baseId(document._id),
                `drafts.${baseId(document._id)}`,
              ]),
            ),
          )
          historyStore
            .getTransactions(documentIds)
            .then(async (transactions) => {
              const authorIds = Array.from(new Set(transactions.map(({author}) => author)))
              const users = authorIds.length > 0 ? await userStore.getUsers(authorIds) : []
              if (!cancelled && inventoryGenerationGuard.isCurrent(generation)) {
                setActivities(buildActivities(transactions, users, content))
              }
            })
            .catch(() => {
              // History is supplementary and subject to plan retention (or may
              // simply never settle). The dashboard's primary content already
              // rendered above and must stay available regardless.
              if (!cancelled && inventoryGenerationGuard.isCurrent(generation)) {
                setActivities({})
              }
            })
        } catch {
          if (!cancelled && inventoryGenerationGuard.isCurrent(generation)) setActivities({})
        }
      })
      .catch((reason: unknown) => {
        // A failed background refresh keeps showing the last good data; only a
        // failed FIRST load has nothing to fall back on and surfaces the error.
        if (!cancelled && inventoryGenerationGuard.isCurrent(generation)) {
          setLoading(false)
          if (!hasDataRef.current) {
            setError(reason instanceof Error ? reason.message : 'Erreur inconnue')
          }
        }
      })
    return () => {
      cancelled = true
    }
  }, [client, historyStore, userStore, refreshKey, inventoryGenerationGuard])

  useEffect(() => {
    // Undoes the cleanup below on remount, so React Strict Mode's
    // intentional mount -> cleanup -> mount dev cycle is a no-op instead of
    // permanently invalidating the only guard instance the component will
    // ever use (see reactivate()'s doc comment in dashboardLogic.ts).
    inventoryGenerationGuard.reactivate()
    return () => {
      inventoryGenerationGuard.invalidate()
    }
  }, [inventoryGenerationGuard])

  // Re-fetch (silently) whenever any dashboard-relevant document changes, so
  // edits made in another tab — or by another editor — appear without a reload.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = client
      .listen(PUBLIC_DOCUMENTS_QUERY, PUBLIC_DOCUMENTS_QUERY_PARAMS, {
        visibility: 'query',
        includeResult: false,
        events: ['mutation'],
      })
      .subscribe({
        next: () => {
          clearTimeout(timer)
          timer = setTimeout(() => setRefreshKey((key) => key + 1), 1000)
        },
        error: () => {
          // Realtime is a comfort feature; a dropped socket must not break the
          // dashboard. Data still refreshes on the next mount.
        },
      })
    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [client])

  // Minute tick so relative timestamps ("il y a 5 min") age on screen.
  const [, setClock] = useState(0)
  useEffect(() => {
    const intervalId = setInterval(() => setClock((tick) => tick + 1), 60_000)
    return () => clearInterval(intervalId)
  }, [])

  const rows = useMemo(() => {
    const byId = new Map<string, {published?: DashboardDocument; draft?: DashboardDocument}>()
    for (const document of documents) {
      const id = baseId(document._id)
      const entry = byId.get(id) ?? {}
      if (document._id.startsWith('drafts.')) entry.draft = document
      else entry.published = document
      byId.set(id, entry)
    }
    return Array.from(byId.entries())
      .map(([id, versions]): DashboardRow => {
        const current = versions.draft ?? versions.published!
        const checks = getDocumentChecks(current._type, current)
        const lastUpdatedAt = [versions.draft?._updatedAt, versions.published?._updatedAt]
          .filter((value): value is string => Boolean(value))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        return {
          id,
          current,
          hasDraft: Boolean(versions.draft),
          isPublished: Boolean(versions.published),
          lastUpdatedAt: lastUpdatedAt ?? current._updatedAt,
          checks,
          summary: summarizeChecks(checks),
        }
      })
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
  }, [documents])
  const publicationSnapshot = useMemo(() => preparePublicationBatch(documents), [documents])

  const attention = rows
    .filter((row) => {
      const {current, summary} = row
      if (current.publicationStatus === 'archived') return false
      // A deliberate "preparation" draft is not, on its own, a reason to surface
      // in the urgent to-do list — only a real issue (missing fields or an
      // unpublished edit) earns a spot here, even for preparation content.
      return !summary.requiredComplete || !summary.recommendedComplete || row.hasDraft
    })
    .sort((left, right) => attentionPriority(left) - attentionPriority(right))
  const draftCount = rows.filter((row) => row.hasDraft).length
  const lastPublishedDocumentAt = documents
    .filter((document) => !document._id.startsWith('drafts.'))
    .map((document) => document._updatedAt)
    .filter((value): value is string => Boolean(value) && Number.isFinite(new Date(value).getTime()))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
  const publishedReference = latestValidTimestamp(publishedAt, lastPublishedDocumentAt)
  const currentDeploymentState = deploymentState({
    runs: deploymentRuns,
    publishedAt: publishedReference,
    pendingCount: draftCount,
    error: deploymentError,
  })

  // GitHub Actions changes independently from Sanity. Poll immediately, then
  // quickly while a post-publication run is expected and more slowly once the
  // state is terminal. Cleanup aborts both the request and the pending timer.
  useEffect(() => {
    if (!publishedReference) {
      setDeploymentRuns([])
      setDeploymentError(new Error('Aucune publication de référence disponible'))
      return undefined
    }

    const controller = new AbortController()
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        const runs = await getRecentDeployments(controller.signal)
        if (cancelled) return
        setDeploymentRuns(runs)
        setDeploymentError(undefined)
        const nextState = deploymentState({
          runs,
          publishedAt: publishedReference,
          pendingCount: draftCount,
        })
        const elapsedMs = Math.max(0, Date.now() - new Date(publishedReference).getTime())
        timer = setTimeout(
          () => void load(),
          nextDeploymentPollDelay({elapsedMs, terminal: nextState.terminal, firstPoll: false}),
        )
      } catch (reason) {
        if (cancelled || (reason instanceof DOMException && reason.name === 'AbortError')) return
        setDeploymentError(reason)
        timer = setTimeout(() => void load(), 5 * 60_000)
      }
    }

    timer = setTimeout(
      () => void load(),
      nextDeploymentPollDelay({elapsedMs: 0, terminal: false, firstPoll: true}),
    )
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [draftCount, publishedReference])

  const blockingRows = attention.filter((row) => !row.summary.requiredComplete)
  // A single blocked content is fully covered by the banner (named title,
  // missing-info message, direct CTA) — repeating it as a one-row group right
  // below said the same thing twice. It leaves the list and the section
  // counters, so banner and list each count their own story. With several
  // blocked contents the banner only summarizes, so the group stays.
  const hideBlockingGroup = blockingRows.length === 1
  const listedAttention = hideBlockingGroup
    ? attention.filter((row) => row.summary.requiredComplete)
    : attention
  const visibleAttention = showAllAttention ? listedAttention : listedAttention.slice(0, 5)
  const attentionGroups = buildAttentionGroups(visibleAttention)
  const recentRows = showAllActivity ? rows : rows.slice(0, 4)
  const subtitleParts: string[] = []
  if (blockingRows.length > 0) {
    subtitleParts.push(
      `${blockingRows.length} ${pluralize(blockingRows.length, 'contenu bloqué', 'contenus bloqués')}`,
    )
  }
  if (draftCount > 0) {
    subtitleParts.push(`${draftCount} ${pluralize(draftCount, 'brouillon en cours', 'brouillons en cours')}`)
  }
  const subtitle =
    loading || error
      ? 'L’essentiel du contenu et de la mise en ligne.'
      : subtitleParts.length > 0
        ? subtitleParts.join(' · ')
        : deploymentSubtitle(currentDeploymentState)
  const publicationBusy = ['preflighting', 'publishing', 'committed', 'refreshing'].includes(
    publicationState.phase,
  )
  const publicationTrackingFailed = publicationState.phase === 'tracking-error'
  const publicationCard = publicationCardState(publicationSnapshot, {
    busy: publicationBusy,
    trackingFailed: publicationTrackingFailed,
    confirmationOpen,
  })
  const confirmationBatch = publicationState.batch ?? publicationSnapshot
  const publicationPanelHasBody =
    publicationCard.pairs.length > 0 ||
    publicationCard.blockedRows.length > 0 ||
    (publicationState.phase === 'success' && Boolean(publishedAt)) ||
    publicationState.phase === 'tracking-error' ||
    publicationState.phase === 'error'

  const requestPublication = async () => {
    const batch = await preflightForConfirmation(publicationController)
    if (batch) setConfirmationOpen(true)
  }

  const confirmPublication = async () => {
    try {
      const result = await publicationController.publish()
      if (result.publishedAt) {
        setPublishedAt((current) => latestValidTimestamp(current, result.publishedAt))
      }
      setConfirmationOpen(false)
    } catch {
      setConfirmationOpen(
        publicationController.state.phase === 'confirming' &&
          Boolean(publicationController.state.batch?.ready),
      )
    }
  }

  const refreshPublicationTracking = async () => {
    try {
      const result = await publicationController.refreshTracking()
      if (result.publishedAt) {
        setPublishedAt((current) => latestValidTimestamp(current, result.publishedAt))
      }
    } catch {
      // The controller owns the user-facing state. This catch prevents a
      // tracking refresh failure from escaping as an unhandled rejection.
    }
  }

  // Helper function to render the compact publication status panel
  const renderPublicationStatusPanel = () => {
    const hasModifications = publicationCard.total > 0
    const isDeploying = currentDeploymentState.kind === 'deploying' || publicationState.phase === 'publishing'
    const isWaiting = currentDeploymentState.kind === 'waiting-run'
    const publicationErrorPhase = publicationState.phase === 'error'
    const trackingErrorPhase = publicationState.phase === 'tracking-error'
    const hasError =
      currentDeploymentState.kind === 'failed' ||
      publicationErrorPhase ||
      trackingErrorPhase
    const isCurrent = currentDeploymentState.kind === 'current' && !hasModifications
    const isPendingContent = currentDeploymentState.kind === 'pending-content'
    
    // Date formatting for the last update
    const lastUpdateDate = currentDeploymentState.run 
      ? formatActivityDate(currentDeploymentState.run.updated_at) 
      : publishedAt
    
    // Icon selection based on state
    const getStatusIcon = () => {
      if (hasError) return <ErrorOutlineIcon />
      if (isDeploying || isWaiting) return <SpinnerIcon />
      if (hasModifications || isPendingContent) return <PublishIcon />
      return <CheckmarkCircleIcon />
    }
    
    // Tone/color based on state
    const getPanelTone = (): 'positive' | 'caution' | 'critical' | 'primary' => {
      if (hasError) return 'critical'
      if (isDeploying || isWaiting) return 'primary'
      if (hasModifications || isPendingContent) return 'caution'
      return 'positive'
    }
    
    // Main label based on state
    const getStatusLabel = () => {
      // A failed publish or a failed post-publish tracking check carries its
      // own reason (publicationState.error); the generic GitHub deployment
      // label is about a different failure entirely and must not mask it.
      if (publicationErrorPhase) return 'Échec de la publication'
      if (trackingErrorPhase) return 'Publication effectuée, suivi indisponible'
      if (hasError) return currentDeploymentState.label || 'Échec de la mise à jour'
      if (isDeploying) return 'Déploiement en cours...'
      if (isWaiting) return currentDeploymentState.label || 'Mise à jour en attente'
      if (hasModifications) return `${publicationCard.total} ${pluralize(publicationCard.total, 'modification', 'modifications')} à publier`
      if (isPendingContent) return currentDeploymentState.label || 'Modifications en attente'
      return 'Site à jour'
    }

    // Subtitle/details based on state
    const getStatusDetail = () => {
      if (publicationErrorPhase || trackingErrorPhase) return publicationState.error
      if (hasError) return currentDeploymentState.detail
      if (isDeploying) return 'GitHub reconstruit actuellement le site.'
      if (isWaiting) return currentDeploymentState.detail
      if (hasModifications) return 'Publiez pour mettre à jour le site en ligne.'
      if (isPendingContent) return currentDeploymentState.detail
      if (lastUpdateDate) return `Dernière publication : ${lastUpdateDate}`
      return 'Tout est synchronisé.'
    }
    
    // Action buttons based on state
    const renderActions = () => {
      // A failed tracking check still has a real, wired retry path
      // (refreshPublicationTracking) — surface it here instead of falling
      // through to the (disabled, since trackingFailed) "Publier" button
      // below, which would strand the editor with no way forward.
      if (trackingErrorPhase) {
        return (
          <Button
            tone="critical"
            text="Réessayer le suivi"
            loading={publicationBusy}
            onClick={() => void refreshPublicationTracking()}
            style={{minHeight: 44}}
          />
        )
      }

      // Only a genuine GitHub deployment failure links out to the workflow —
      // a publish/tracking error is handled above (or, for a plain publish
      // error, by re-enabling "Publier" below) and must not be replaced by
      // a "pending-content" state's unrelated actionUrl (every
      // DeploymentState variant sets one, including non-failure states).
      if (currentDeploymentState.kind === 'failed' && currentDeploymentState.actionUrl) {
        return (
          <Button
            as="a"
            href={currentDeploymentState.actionUrl}
            target="_blank"
            rel="noreferrer"
            tone="critical"
            text={currentDeploymentState.actionLabel || 'Prévenir le mainteneur'}
            iconRight={LaunchIcon}
            style={{minHeight: 44}}
          />
        )
      }
      
      if (isDeploying && currentDeploymentState.run) {
        return (
          <Button
            as="a"
            href={currentDeploymentState.run.html_url}
            target="_blank"
            rel="noreferrer"
            tone="primary"
            text="Voir le déploiement"
            iconRight={LaunchIcon}
            style={{minHeight: 44}}
          />
        )
      }
      
      if (isWaiting && currentDeploymentState.actionUrl) {
        return (
          <Button
            as="a"
            href={currentDeploymentState.actionUrl}
            target="_blank"
            rel="noreferrer"
            tone="primary"
            text={currentDeploymentState.actionLabel || 'Voir les mises à jour'}
            iconRight={LaunchIcon}
            style={{minHeight: 44}}
          />
        )
      }
      
      if (hasModifications) {
        return (
          <Flex gap={2} wrap="wrap">
            <Button
              as="a"
              href={SITE_PREVIEW_URL}
              target="_blank"
              rel="noreferrer"
              mode="ghost"
              text="Tester sur préprod"
              iconRight={LaunchIcon}
              style={{minHeight: 44}}
            />
            <Button
              tone="primary"
              text="Publier"
              loading={publicationBusy}
              disabled={publicationCard.buttonDisabled}
              onClick={() => void requestPublication()}
              style={{minHeight: 44}}
            />
          </Flex>
        )
      }
      
      // Default: everything is up to date
      return (
        <Button
          as="a"
          href={SITE_PREVIEW_URL}
          target="_blank"
          rel="noreferrer"
          mode="ghost"
          text="Ouvrir le site"
          iconRight={LaunchIcon}
          style={{minHeight: 44}}
        />
      )
    }
    
    const tone = getPanelTone()
    
    return (
      <Card
        radius={3}
        tone="transparent"
        shadow={1}
        padding={4}
        className="editorial-dashboard__publish-panel"
        style={{
          borderLeft: `3px solid var(--dashboard-publish-accent, #556bfc)`,
        }}
      >
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Flex align="center" gap={3} style={{flex: '1 1 300px', minWidth: 0}}>
            <Box
              aria-hidden="true"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tone === 'positive' 
                  ? 'rgba(16, 185, 129, 0.12)' 
                  : tone === 'caution' 
                    ? 'rgba(245, 158, 11, 0.14)'
                    : tone === 'critical'
                      ? 'rgba(239, 68, 68, 0.13)'
                      : 'rgba(85, 107, 252, 0.11)',
                color: tone === 'positive' 
                  ? '#10b981' 
                  : tone === 'caution' 
                    ? '#d97706'
                    : tone === 'critical'
                      ? '#dc2626'
                      : '#556bfc',
              }}
            >
              <Box style={{fontSize: 20, display: 'flex'}}>
                {getStatusIcon()}
              </Box>
            </Box>
            <Stack space={1} style={{minWidth: 0}}>
              <Text size={1} weight="semibold" style={{fontSize: 14}}>
                {getStatusLabel()}
              </Text>
              <Text size={1} muted style={{fontSize: 13}}>
                {getStatusDetail()}
              </Text>
            </Stack>
          </Flex>
          <Box style={{flex: '0 0 auto'}}>
            {renderActions()}
          </Box>
        </Flex>
        
        {/* Keep the confirmation dialog for publication */}
        {publicationCard.dialogOpen && (
          <Card padding={3} radius={2} tone="caution" style={{marginTop: 3, flex: '1 1 320px'}}>
            <Stack space={3}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Publier maintenant sur le site public ?
                </Text>
                <Text size={1}>
                  {confirmationBatch.total}{' '}
                  {pluralize(
                    confirmationBatch.total,
                    'contenu sera visible',
                    'contenus seront visibles',
                  )}{' '}
                  par tout le monde.
                </Text>
              </Stack>
              {publicationState.phase === 'confirming' && publicationState.error && (
                <Card padding={3} radius={2} tone="critical">
                  <Text size={1}>{publicationState.error}</Text>
                </Card>
              )}
              <Flex gap={2} justify="flex-end" wrap="wrap">
                <Button
                  text="Annuler"
                  mode="bleed"
                  disabled={publicationBusy}
                  onClick={() => setConfirmationOpen(false)}
                  style={{minHeight: 44}}
                />
                <Button
                  tone="primary"
                  text={publicationState.phase === 'publishing' ? 'Publication…' : 'Confirmer'}
                  loading={publicationBusy}
                  disabled={publicationBusy}
                  onClick={() => void confirmPublication()}
                  style={{minHeight: 44}}
                />
              </Flex>
            </Stack>
          </Card>
        )}
      </Card>
    )
  }

  return (
    <div className="editorial-dashboard__page">
      <Box padding={[3, 4, 5]} style={{maxWidth: 1080, margin: '0 auto'}}>
        <Stack space={4}>
          <Flex
            align="flex-start"
            justify="space-between"
            gap={3}
            wrap="wrap"
            className="editorial-dashboard__header"
          >
            <Stack space={2} style={{flex: '1 1 280px'}}>
              <Heading as="h1" size={3}>
                Tableau de bord
              </Heading>
              <Text muted size={1}>
                {subtitle}
              </Text>
            </Stack>
            <Flex
              align="center"
              gap={2}
              wrap="wrap"
              className="editorial-dashboard__actions editorial-dashboard__header-side"
            >
              <Button
                className="editorial-dashboard__header-control editorial-dashboard__header-link"
                style={{height: 44}}
                as="a"
                href={SITE_PREVIEW_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvrir le site (nouvel onglet)"
                iconRight={LaunchIcon}
                mode="bleed"
                paddingY={3}
                text="Ouvrir le site"
              />
              <IntentButton
                className="editorial-dashboard__header-control"
                style={{height: 44}}
                icon={AddIcon}
                text="Nouvelle collection"
                intent="create"
                params={{type: 'gallery', template: 'gallery'}}
                tone="primary"
                mode="ghost"
                paddingY={3}
              />
              <IntentButton
                className="editorial-dashboard__header-control"
                style={{height: 44}}
                icon={BookIcon}
                text="Nouvelle édition"
                intent="create"
                params={{type: 'edition'}}
                tone="primary"
                mode="ghost"
                paddingY={3}
              />
            </Flex>
          </Flex>

          {loading && (
            <Card padding={5} radius={3} tone="transparent">
              <Flex align="center" justify="center" gap={3}>
                <Spinner muted />
                <Text muted size={1}>
                  Chargement…
                </Text>
              </Flex>
            </Card>
          )}

          {error && (
            <Card padding={4} radius={3} tone="critical">
              <Stack space={3}>
                <Text size={1}>
                  Le tableau de bord n’a pas pu se charger. Réessayez dans quelques instants, ou
                  contactez le développeur si le problème persiste.
                </Text>
                <details>
                  <summary>Détail technique</summary>
                  <Text muted size={0}>
                    {error}
                  </Text>
                </details>
              </Stack>
            </Card>
          )}

          {!loading && !error && renderPublicationStatusPanel()}

          {!loading && !error && blockingRows.length > 0 && (
            <Card radius={3} tone="critical" shadow={1} padding={3}>
              <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                <Flex align="center" gap={3} style={{flex: '1 1 280px', minWidth: 0}}>
                  <TintChip icon={ErrorOutlineIcon} tint={toneChipStyles.critical} />
                  <Stack space={2} style={{minWidth: 0}}>
                    <Text size={1} weight="semibold">
                      {blockingRows.length === 1
                        ? `« ${documentTitle(blockingRows[0].current)} » ne peut pas être publié`
                        : `${blockingRows.length} contenus ne peuvent pas être publiés`}
                    </Text>
                    <Text size={1} muted style={{fontSize: 12}}>
                      Des informations indispensables sont manquantes.
                    </Text>
                  </Stack>
                </Flex>
                {blockingRows.length === 1 ? (
                  <IntentButton
                    tone="critical"
                    mode="default"
                    text={`Compléter ${contentNoun(blockingRows[0].current)}`}
                    intent="edit"
                    params={{id: blockingRows[0].id, type: blockingRows[0].current._type}}
                    style={{minHeight: 44}}
                  />
                ) : (
                  <Button
                    tone="critical"
                    mode="default"
                    text="Voir les contenus bloqués"
                    style={{minHeight: 44}}
                    onClick={() => {
                      const heading = document.getElementById('editorial-dashboard-attention-heading')
                      heading?.scrollIntoView({behavior: 'smooth', block: 'start'})
                      heading?.focus()
                    }}
                  />
                )}
              </Flex>
            </Card>
          )}

          {!loading && !error && (
            <>
              <div className="editorial-dashboard__columns">
                <Stack space={3}>
                  <Flex align="flex-end" justify="space-between" gap={2}>
                    <Stack space={2}>
                      <Heading as="h2" size={2} id="editorial-dashboard-attention-heading" tabIndex={-1}>
                        À faire maintenant
                      </Heading>
                      <Text muted size={0}>
                        {listedAttention.length === 0
                          ? 'Aucun contenu en attente'
                          : `${visibleAttention.length} ${pluralize(visibleAttention.length, 'contenu prioritaire', 'contenus prioritaires')} sur ${listedAttention.length} à vérifier`}
                      </Text>
                    </Stack>
                    {listedAttention.length > 5 && (
                      <Button
                        className="editorial-dashboard__activity-toggle"
                        style={{minHeight: 44}}
                        mode="bleed"
                        fontSize={0}
                        padding={2}
                        text={
                          showAllAttention
                            ? 'Réduire'
                            : `Voir les ${listedAttention.length} ${pluralize(listedAttention.length, 'contenu', 'contenus')}`
                        }
                        aria-expanded={showAllAttention}
                        aria-controls="editorial-dashboard-attention-list"
                        onClick={() => setShowAllAttention((value) => !value)}
                      />
                    )}
                  </Flex>

                  {listedAttention.length === 0 ? (
                    <Card radius={3} shadow={1} padding={3} className="editorial-dashboard__surface">
                      <Flex align="center" gap={3}>
                        <TintChip icon={CheckmarkCircleIcon} size={38} radius={10} iconSize={21} tint={metricAccentStyles.positive} />
                        <Stack space={2}>
                          <Text size={1} weight="semibold">
                            {blockingRows.length > 0 ? 'Rien d’autre à traiter' : 'Tout est en ordre'}
                          </Text>
                          <Text muted size={1} style={{fontSize: 12}}>
                            {blockingRows.length > 0
                              ? 'Occupez-vous d’abord du contenu bloqué ci-dessus.'
                              : 'Aucun contenu ne nécessite votre attention.'}
                          </Text>
                        </Stack>
                      </Flex>
                    </Card>
                  ) : (
                    <Stack space={3} id="editorial-dashboard-attention-list">
                      {attentionGroups.map((group) => (
                        <AttentionSection
                          key={group.id}
                          group={group}
                          showCount={attentionGroups.length > 1}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>

                <Stack space={3}>
                  <Flex align="flex-end" justify="space-between" gap={2}>
                    <Stack space={2}>
                      <Heading as="h2" size={2}>
                        Activité récente
                      </Heading>
                      <Text muted size={0}>
                        {recentRows.length} {pluralize(recentRows.length, 'dernière modification', 'dernières modifications')}
                      </Text>
                    </Stack>
                    {rows.length > 4 && (
                      <Button
                        className="editorial-dashboard__activity-toggle"
                        style={{minHeight: 44}}
                        mode="bleed"
                        fontSize={0}
                        padding={2}
                        text={
                          showAllActivity
                            ? 'Réduire'
                            : `Voir les ${rows.length} ${pluralize(rows.length, 'modification', 'modifications')}`
                        }
                        aria-expanded={showAllActivity}
                        aria-controls="editorial-dashboard-activity-list"
                        onClick={() => setShowAllActivity((value) => !value)}
                      />
                    )}
                  </Flex>
                  <Card
                    id="editorial-dashboard-activity-list"
                    radius={3}
                    tone="default"
                    shadow={1}
                    padding={1}
                    className="editorial-dashboard__surface"
                  >
                    <Stack space={0}>
                      {recentRows.map((row) => (
                        <RecentRow key={row.id} row={row} activity={activities[row.id]} />
                      ))}
                    </Stack>
                  </Card>

                  <Card radius={3} shadow={1} padding={1} className="editorial-dashboard__surface">
                    <Box paddingX={2} paddingTop={2} paddingBottom={1}>
                      <Text
                        muted
                        size={0}
                        weight="semibold"
                        role="heading"
                        aria-level={2}
                        style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em'}}
                      >
                        Raccourcis
                      </Text>
                    </Box>
                    <Stack space={0}>
                      <ShortcutRow href="/structure" icon={FolderIcon} label="Contenu du site" />
                      <ShortcutRow href="/media" icon={ImagesIcon} label="Médiathèque" />
                      <ShortcutRow
                        icon={CogIcon}
                        label="Réglages du site"
                        intentParams={{id: 'siteSettings', type: 'siteSettings'}}
                      />
                    </Stack>
                  </Card>
                </Stack>
              </div>
            </>
          )}
        </Stack>
      </Box>
    </div>
  )
}

function AttentionSection({group, showCount}: {group: AttentionGroup; showCount: boolean}) {
  const Icon = group.icon
  const chip = toneChipStyles[group.tone]
  return (
    <Card radius={3} tone="default" shadow={1} padding={1} className="editorial-dashboard__surface">
      <Box paddingX={2} paddingY={2} className="editorial-dashboard__group-header-band">
        <Flex align="center" gap={2} wrap="wrap" className="editorial-dashboard__group-header">
          <TintChip icon={Icon} size={30} radius={8} iconSize={17} tint={chip} />
          <Text
            size={1}
            weight="semibold"
            role="heading"
            aria-level={3}
            className="editorial-dashboard__group-title"
          >
            {group.title}
          </Text>
          {showCount && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                lineHeight: '18px',
                padding: '0 7px',
                borderRadius: 999,
                backgroundColor: 'color-mix(in srgb, var(--card-fg-color) 7%, transparent)',
                color: 'var(--card-muted-fg-color)',
                flex: '0 0 auto',
              }}
            >
              {group.rows.length}
            </span>
          )}
          <Badge tone={group.tone} mode="outline" fontSize={0}>
            {group.severity}
          </Badge>
          <Text muted size={1} style={{fontSize: 12}}>
            {group.description}
          </Text>
        </Flex>
      </Box>
      <Stack space={0}>
        {group.rows.map((row) => (
          <ContentRow
            key={row.id}
            row={row}
            accentTone={group.tone}
            taskSummary={attentionRowSummary(row, group)}
            taskSummaryDetail={attentionRowSummaryDetail(row, group)}
            actionVerb={group.actionVerb}
          />
        ))}
      </Stack>
    </Card>
  )
}

type MetricAccent = 'primary' | 'positive' | 'caution' | 'neutral'

const metricAccentStyles: Record<MetricAccent, {background: string; color: string}> = {
  primary: {background: 'rgba(85, 107, 252, 0.11)', color: '#556bfc'},
  positive: {background: 'rgba(16, 185, 129, 0.12)', color: '#059669'},
  caution: {background: 'rgba(245, 158, 11, 0.14)', color: '#d97706'},
  neutral: {
    background: 'color-mix(in srgb, var(--card-fg-color) 7%, transparent)',
    color: 'var(--card-muted-fg-color)',
  },
}

const toneChipStyles: Record<DashboardTone, {background: string; color: string}> = {
  primary: metricAccentStyles.primary,
  positive: metricAccentStyles.positive,
  caution: metricAccentStyles.caution,
  critical: {background: 'rgba(239, 68, 68, 0.13)', color: '#dc2626'},
  default: metricAccentStyles.neutral,
}

function TintChip({
  icon: Icon,
  tint,
  size = 38,
  radius = 10,
  iconSize = 21,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tint: {background: string; color: string}
  size?: number
  radius?: number
  iconSize?: number
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tint.background,
        color: tint.color,
        fontSize: iconSize,
      }}
    >
      <Icon style={{display: 'block'}} />
    </div>
  )
}

function ShortcutRow({
  icon: Icon,
  label,
  href,
  intentParams,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  href?: string
  intentParams?: {id: string; type: string}
}) {
  const chip = metricAccentStyles.neutral
  const content = (
    <Flex
      align="center"
      gap={2}
      paddingX={2}
      className="editorial-dashboard__task-row"
      style={{minHeight: 44, borderRadius: 6, boxSizing: 'border-box'}}
    >
      <TintChip icon={Icon} size={26} radius={8} iconSize={15} tint={chip} />
      <Text size={1} weight="medium" style={{flex: '1 1 auto', minWidth: 0}}>
        {label}
      </Text>
      <Text
        muted
        size={1}
        className="editorial-dashboard__task-chevron"
        style={{lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'none'}}
      >
        <ChevronRightIcon style={{display: 'block'}} />
      </Text>
    </Flex>
  )

  if (intentParams) {
    return (
      <IntentLink
        className="editorial-dashboard__row-link"
        intent="edit"
        params={intentParams}
        style={{color: 'inherit', textDecoration: 'none'}}
      >
        {content}
      </IntentLink>
    )
  }
  return (
    <a
      href={href}
      className="editorial-dashboard__row-link"
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      {content}
    </a>
  )
}

const deploymentDotColors: Record<DashboardTone, string> = {
  default: '#9ca3af',
  primary: '#556bfc',
  positive: '#10b981',
  caution: '#f59e0b',
  critical: '#ef4444',
}

function DeploymentStatus({state}: {state: DeploymentState}) {
  const dateLabel = state.run ? formatActivityDate(state.run.updated_at) : ''

  const content = (
    <Flex align="center" gap={2} className="editorial-dashboard__deployment-content">
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flex: '0 0 auto',
          backgroundColor: deploymentDotColors[state.tone],
        }}
      />
      <Text
        size={1}
        weight="medium"
        style={{
          whiteSpace: 'nowrap',
          fontSize: 13,
          color: state.tone === 'critical' ? deploymentDotColors.critical : undefined,
        }}
      >
        {state.label}
      </Text>
      {dateLabel && (
        <Text muted size={1} className="editorial-dashboard__deployment-date" style={{fontSize: 13}}>
          {dateLabel}
        </Text>
      )}
    </Flex>
  )

  return state.actionLabel ? (
    <a
      href={state.actionUrl}
      target="_blank"
      rel="noreferrer"
      title={`${state.detail} ${state.actionLabel}`}
      aria-label={`${state.label}. ${state.detail} ${state.actionLabel} (nouvel onglet)`}
      className="editorial-dashboard__deployment-status"
    >
      {content}
    </a>
  ) : (
    <div className="editorial-dashboard__deployment-status" title={state.detail}>
      {content}
    </div>
  )
}

function ContentRow({
  row,
  accentTone,
  taskSummary,
  taskSummaryDetail,
  actionVerb,
}: {
  row: DashboardRow
  accentTone: DashboardTone
  taskSummary: string
  taskSummaryDetail?: string
  actionVerb?: string
}) {
  const status = editorialStatus(row)
  const title = documentTitle(row.current)
  const typeLabel = rowTypeLabels[row.current._type]
  const showStatus = status.tone !== 'positive'
  return (
    <IntentLink
      className="editorial-dashboard__row-link"
      intent="edit"
      params={{id: row.id, type: row.current._type}}
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      <Box className="editorial-dashboard__task-row" style={{borderRadius: 6}}>
        <Flex>
          <Box
            paddingX={2}
            paddingY={2}
            className="editorial-dashboard__task-content"
            style={{
              minWidth: 0,
              flex: 1,
              minHeight: 56,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div className="editorial-dashboard__task-grid">
              <Stack space={3} className="editorial-dashboard__task-copy">
                <Flex
                  align="center"
                  gap={2}
                  wrap="wrap"
                  className="editorial-dashboard__task-heading"
                >
                  <Text
                    size={1}
                    weight="semibold"
                    textOverflow="ellipsis"
                    className="editorial-dashboard__task-title"
                    style={{padding: 0}}
                  >
                    {title}
                  </Text>
                  {typeLabel && (
                    <Text muted size={0} style={{flex: '0 0 auto'}}>
                      {typeLabel}
                    </Text>
                  )}
                  {showStatus && (
                    <Badge fontSize={0} tone={status.tone} style={{flex: '0 0 auto'}}>
                      {status.label}
                    </Badge>
                  )}
                </Flex>
                <Text
                  muted
                  size={0}
                  textOverflow="ellipsis"
                  title={taskSummaryDetail || taskSummary}
                  className="editorial-dashboard__task-summary"
                  style={{padding: 0, fontSize: 12, lineHeight: '16px', color: 'color-mix(in srgb, var(--card-muted-fg-color) 70%, var(--card-fg-color) 30%)'}}
                >
                  {taskSummary}
                </Text>
              </Stack>
              <Flex align="center" gap={1} className="editorial-dashboard__task-action" style={{flex: '0 0 auto'}}>
                {actionVerb && (
                  <Card
                    tone={accentTone}
                    radius={2}
                    className={
                      accentTone === 'default' ? 'editorial-dashboard__task-verb--quiet' : undefined
                    }
                    style={{background: 'transparent', display: 'inline-flex'}}
                  >
                    <Text size={1} weight="semibold" style={{whiteSpace: 'nowrap'}}>
                      {actionVerb}
                    </Text>
                  </Card>
                )}
                <Text
                  muted
                  size={1}
                  className="editorial-dashboard__task-chevron"
                  style={{lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'none'}}
                >
                  <ChevronRightIcon style={{display: 'block'}} />
                </Text>
              </Flex>
            </div>
          </Box>
        </Flex>
      </Box>
    </IntentLink>
  )
}

function RecentRow({row, activity}: {row: DashboardRow; activity?: DashboardActivity}) {
  const status = editorialStatus(row)
  const showStatus = status.tone !== 'positive'
  const timestamp = activity?.timestamp ?? row.lastUpdatedAt
  const authorName = activity?.authorName
  const authorFirstName = authorName?.split(/\s+/)[0]
  return (
    <IntentLink
      className="editorial-dashboard__row-link"
      intent="edit"
      params={{id: row.id, type: row.current._type}}
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      <Box
        paddingX={2}
        paddingY={2}
        className="editorial-dashboard__activity-row"
        style={{
          minHeight: 50,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRadius: 6,
        }}
      >
        <div className="editorial-dashboard__activity-grid" style={{alignItems: 'center'}}>
          <ActivityAvatar name={authorName ?? '?'} imageUrl={activity?.authorImageUrl} />
          <Stack space={3} className="editorial-dashboard__activity-copy">
            <Flex
              align="center"
              justify="space-between"
              gap={2}
              wrap="wrap"
              className="editorial-dashboard__activity-heading"
            >
              <Flex align="center" gap={2} style={{minWidth: 0, flex: '1 1 auto'}}>
                <Text
                  size={1}
                  weight="semibold"
                  textOverflow="ellipsis"
                  className="editorial-dashboard__activity-title"
                  style={{padding: 0}}
                >
                  {documentTitle(row.current)}
                </Text>
                {showStatus && (
                  <Badge fontSize={0} tone={status.tone} style={{flex: '0 0 auto', whiteSpace: 'nowrap'}}>
                    {status.label}
                  </Badge>
                )}
              </Flex>
              <Text
                muted
                size={0}
                className="editorial-dashboard__activity-date"
                title={formatActivityDate(timestamp)}
                style={{padding: 0, flex: '0 0 auto'}}
              >
                {formatRelativeDate(timestamp)}
              </Text>
            </Flex>
            <Flex align="center" gap={1} wrap="wrap" className="editorial-dashboard__activity-meta">
              <Text
                muted
                size={0}
                title={authorName}
                style={{padding: 0, fontSize: 12, lineHeight: '16px', color: 'color-mix(in srgb, var(--card-muted-fg-color) 70%, var(--card-fg-color) 30%)'}}
              >
                {authorFirstName ? (
                  <>
                    <span style={{fontWeight: 500, color: 'var(--card-fg-color)'}}>{authorFirstName}</span>
                    {' '}
                    {activity?.description}
                  </>
                ) : (
                  'Détail de l’activité non disponible'
                )}
              </Text>
            </Flex>
          </Stack>
        </div>
      </Box>
    </IntentLink>
  )
}

const avatarPalette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

function ActivityAvatar({name, imageUrl}: {name: string; imageUrl?: string}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          boxSizing: 'border-box',
          border: '1px solid color-mix(in srgb, var(--card-fg-color) 12%, transparent)',
        }}
      />
    )
  }
  const initials =
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (
    <div
      aria-hidden="true"
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        backgroundColor: avatarPalette[hash % avatarPalette.length],
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.03em',
        flex: '0 0 auto',
      }}
    >
      {initials}
    </div>
  )
}
