import {useEffect, useMemo, useRef, useState} from 'react'
import type {ComponentType, SVGProps} from 'react'
import {Badge, Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {IntentButton, useClient, useHistoryStore, useUserStore} from 'sanity'
import {IntentLink} from 'sanity/router'
import {AddIcon} from '@sanity/icons/Add'
import {BookIcon} from '@sanity/icons/Book'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CloseIcon} from '@sanity/icons/Close'
import {CogIcon} from '@sanity/icons/Cog'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {FolderIcon} from '@sanity/icons/Folder'
import {ImagesIcon} from '@sanity/icons/Images'
import {LaunchIcon} from '@sanity/icons/Launch'
import {LockIcon} from '@sanity/icons/Lock'
import {PlayIcon} from '@sanity/icons/Play'
import {PublishIcon} from '@sanity/icons/Publish'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {
  deploymentSubtitle,
  deploymentState,
  latestValidTimestamp,
  pipelineDisplaySegments,
  PRODUCTION_WORKFLOW_FILE,
  releasePipelineState,
  SITE_PREVIEW_URL,
} from './deployment'
import type {
  PipelineSegmentKind,
  ReleasePipelineDisplaySegments,
  ReleasePipelinePromote,
} from './deployment'
import {useDeploymentPolling} from './useDeploymentPolling'
import {gateClickAction, nextPreviewedFlag, productionPublishDisabled} from './releaseGate'
import type {PipelineGateVariant} from './releaseGate'
import {
  pipelineCircleClassName,
  pipelineGateCaption,
  pipelineNodeDetail,
  releaseActionButtonState,
  releasePanelSubtitle,
} from './pipelineView'
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
  preparePublicationBatch,
  publicationCardState,
  publicationError,
  publishAfterPreflight,
  PRODUCTION_RELEASE_MARKER_QUERY,
  PUBLIC_DOCUMENTS_QUERY,
  PUBLIC_DOCUMENTS_QUERY_PARAMS,
  rowTypeLabels,
  triggerProductionRelease,
} from './dashboardLogic'
import type {
  AttentionGroup,
  DashboardActivity,
  DashboardDocument,
  DashboardRow,
  DashboardTone,
  PublicationClient,
  PublicationControllerState,
} from './dashboardLogic'
import './EditorialDashboard.css'

export function EditorialDashboard() {
  const client = useClient({apiVersion: '2025-08-15'})
  const historyStore = useHistoryStore()
  const userStore = useUserStore()
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  const [activities, setActivities] = useState<Record<string, DashboardActivity>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showAllAttention, setShowAllAttention] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [publicationState, setPublicationState] = useState<PublicationControllerState>({
    phase: 'idle',
  })
  const [publishedAt, setPublishedAt] = useState<string>()
  const [productionReleaseAt, setProductionReleaseAt] = useState<string>('')
  const [releaseBusy, setReleaseBusy] = useState(false)
  const [releaseError, setReleaseError] = useState<string>()
  const [hasPreviewedStaging, setHasPreviewedStaging] = useState(false)
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
  const {runs: deploymentRuns, error: deploymentError} = useDeploymentPolling({
    referenceTimestamp: publishedReference,
    pendingCount: draftCount,
    missingReferenceError: new Error('Aucune publication de référence disponible'),
  })
  const currentDeploymentState = deploymentState({
    runs: deploymentRuns,
    publishedAt: publishedReference,
    pendingCount: draftCount,
    error: deploymentError,
  })

  // Seeds the production release timestamp from the persisted marker, so the
  // pipeline survives a reload or a second browser tab rather than living
  // only in this component's React state. A missing/failed marker read must
  // not break the dashboard -- it is simply treated as "never released"
  // unless a newer value is already known from this session's own trigger.
  useEffect(() => {
    let cancelled = false
    client
      .fetch<{lastTriggeredAt?: string} | null>(
        PRODUCTION_RELEASE_MARKER_QUERY,
        {},
        {perspective: 'published'},
      )
      .then((marker) => {
        if (cancelled) return
        setProductionReleaseAt((current) => latestValidTimestamp(current, marker?.lastTriggeredAt))
      })
      .catch(() => {
        // Supplementary read; the dashboard keeps whatever it already knows.
      })
    return () => {
      cancelled = true
    }
  }, [client, refreshKey])

  const {runs: productionRuns, error: productionDeploymentError} = useDeploymentPolling({
    referenceTimestamp: productionReleaseAt,
    pendingCount: 0,
    workflowFile: PRODUCTION_WORKFLOW_FILE,
    target: 'production',
  })

  const currentProductionDeploymentState = deploymentState({
    runs: productionRuns,
    publishedAt: productionReleaseAt,
    pendingCount: 0,
    error: productionDeploymentError,
    target: 'production',
  })
  const pipeline = releasePipelineState({
    pendingCount: draftCount,
    staging: currentDeploymentState,
    production: currentProductionDeploymentState,
    publishedAt: publishedReference,
    productionReleaseAt,
    busy: releaseBusy,
    requestError: releaseError,
  })
  const displaySegments = pipelineDisplaySegments(pipeline.segments)
  const gateVariant = pipelineGateVariant(displaySegments, pipeline.promote, Boolean(releaseError))
  const gateAction = gateClickAction(gateVariant)
  const gateLabel = gateAction === 'preview' ? 'Ouvrir le site de test' : pipeline.promote.buttonLabel
  const gateCaption = pipelineGateCaption(gateVariant)

  // A preview approves one batch, and any state the pipeline moves into
  // other than `ready` means the batch changed, so carrying the flag
  // forward would let an old approval unlock content nobody reviewed. This
  // effect is the only place that sees every transition, which is why the
  // reset lives here rather than inside a click handler.
  useEffect(() => {
    setHasPreviewedStaging((current) => nextPreviewedFlag(gateVariant, current))
  }, [gateVariant])
  // The box carries its own padding and background, so it must not render
  // at all when it has nothing inside -- an unconditionally-rendered box
  // paints a visible empty rectangle rather than disappearing. That was
  // always the reason for this guard.
  //
  // Its body is now exactly one thing: the run link for a failed staging or
  // production deploy. It carries no explanatory copy (resolvePromoteRow()
  // returns empty title/detail in every branch) and no button any more.
  //
  // The `actionUrl` term is load-bearing and is the only term left: the
  // failed states have no other body, and losing it hides the run link that
  // is their only actionable part -- the sole route a maintainer has to the
  // GitHub Actions page for a broken deploy.
  //
  // The ready-state term that used to sit here is gone on purpose: the
  // control it kept mounted moved to the top of the panel and is now the
  // panel's single evolving button.
  const promoteActionsBoxHasBody = Boolean(pipeline.promote.actionUrl)

  const triggerProductionReleaseClick = async () => {
    setReleaseBusy(true)
    setReleaseError(undefined)
    try {
      const timestamp = await triggerProductionRelease(client as unknown as PublicationClient)
      setProductionReleaseAt((current) => latestValidTimestamp(current, timestamp))
    } catch (reason) {
      setReleaseError(publicationError(reason))
    } finally {
      setReleaseBusy(false)
    }
  }

  // The round gate control's own click is now preview-only: it opens the
  // site de test and records the approval, and never reaches the release
  // trigger directly. The `failed` variant's retry is the sole exception,
  // routed through the same shared rule rather than re-derived here.
  const handleGateClick = () => {
    if (gateAction === 'preview') {
      window.open(SITE_PREVIEW_URL, '_blank', 'noopener')
      setHasPreviewedStaging(true)
      return
    }
    if (gateAction === 'release') {
      void triggerProductionReleaseClick()
    }
  }

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
  const publicationPreflighting = publicationState.phase === 'preflighting'
  const publicationTrackingFailed = publicationState.phase === 'tracking-error'
  const publicationCard = publicationCardState(publicationSnapshot, {
    busy: publicationBusy,
    trackingFailed: publicationTrackingFailed,
  })
  // Reads the same publication-inventory signal that drives the panel's
  // « X contenu(s) modifié(s) » subtitle, so the node and the sentence above
  // it can never disagree about whether there is something waiting to
  // publish.
  const hasModifiedContent = publicationCard.total > 0
  const pipelineDetail = pipelineNodeDetail(displaySegments, hasModifiedContent)
  // This one line is now the only place the dashboard narrates which stage
  // of the release is currently happening, because the box under the
  // pipeline was emptied at the user's explicit request. The eight-branch
  // decision lives in releasePanelSubtitle() so it has real behavioural
  // tests instead of an eight-way ternary in JSX.
  const panelSubtitle = releasePanelSubtitle({
    segments: pipeline.segments,
    modifiedCount: publicationCard.total,
    notStarted: pipeline.promote.notStarted,
    requestError: releaseError,
  })
  // This panel now has a single action button whose label, tone, disabled
  // state and click target all evolve with the workflow, because the
  // maintainer expected the greyed update button to become the go-live
  // button rather than a second button appearing below the pipeline. The
  // five-branch decision lives in releaseActionButtonState() so it has real
  // behavioural tests instead of a stack of ternaries in JSX. The two
  // underlying actions remain technically distinct -- publishing drafts and
  // triggering a production release are different Sanity Actions API calls
  // with different consequences -- only the UI is merged.
  const releaseAction = releaseActionButtonState({
    gateVariant,
    publicationBusy,
    preflighting: publicationPreflighting,
    releaseBusy,
    modifiedCount: publicationCard.total,
    publishButtonDisabled: publicationCard.buttonDisabled,
    productionPublishBlocked: productionPublishDisabled({
      promoteButtonDisabled: pipeline.promote.buttonDisabled,
      hasPreviewedStaging,
    }),
  })
  const publicationPanelHasBody =
    publicationCard.blockedRows.length > 0 ||
    publicationState.phase === 'tracking-error' ||
    publicationState.phase === 'error' ||
    (publicationState.phase === 'confirming' && Boolean(publicationState.error))

  // The one-click contract: one gesture runs the content-quality gate and,
  // only if it passes, publishes -- there is no confirmation step between
  // the two anymore. This button publishes into Sanity and rebuilds the
  // site de test only; the round gate button between the two pipeline
  // nodes below is the step that actually makes anything public.
  const runPublication = async () => {
    try {
      const result = await publishAfterPreflight(publicationController)
      if (result?.publishedAt) {
        setPublishedAt((current) => latestValidTimestamp(current, result.publishedAt))
      }
    } catch {
      // The controller owns the user-facing error state (see
      // refreshPublicationTracking() immediately below for the same pattern).
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

  // The merged button routes to one of two existing, unchanged handlers
  // depending on which stage it currently represents. The `inert` action is
  // a real outcome rather than a fallthrough -- combined with the button's
  // own `disabled` flag it is the second of two independent guards on the
  // preview-before-publish rule.
  const handleReleaseActionClick = () => {
    if (releaseAction.action === 'publish') {
      void runPublication()
      return
    }
    if (releaseAction.action === 'release') {
      void triggerProductionReleaseClick()
    }
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

          {!loading && !error && (
            <Card
              radius={3}
              tone="transparent"
              shadow={1}
              padding={[4, 4, 5]}
              className="editorial-dashboard__publish-panel"
            >
              <Stack space={4}>
                <Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">
                  <Flex align="center" gap={3} style={{minWidth: 0, flex: '1 1 360px'}}>
                    <TintChip
                      icon={PublishIcon}
                      size={44}
                      radius={12}
                      iconSize={24}
                      tint={metricAccentStyles.primary}
                    />
                    <Stack space={2}>
                      <Heading as="h2" size={2}>
                        Mettre le site à jour
                      </Heading>
                      <Text size={1} muted>
                        {panelSubtitle}
                      </Text>
                    </Stack>
                  </Flex>
                  <Button
                    tone={releaseAction.tone}
                    // This button now spans the whole workflow -- the
                    // draft-publish half AND the production-release half.
                    // Its previous comment described only the first half.
                    text={releaseAction.label}
                    disabled={releaseAction.disabled}
                    loading={releaseAction.loading}
                    onClick={handleReleaseActionClick}
                    style={{minHeight: 44}}
                  />
                </Flex>

                <section aria-label="Progression de la publication">
                  <Stack space={3}>
                    <Flex align="flex-start" className="editorial-dashboard__pipeline">
                      <div className="editorial-dashboard__pipeline-node">
                        <span
                          aria-hidden="true"
                          className={pipelineCircleClassName(displaySegments.testSite, hasModifiedContent)}
                        >
                          {pipelineNodeIcon(displaySegments.testSite, PublishIcon)}
                        </span>
                        {/* Plain spans, not Sanity UI's <Text>: in this
                            project's bundled @sanity/ui version, that
                            size-zero component lays out a box shorter than
                            the glyphs it paints (measured: a 6-7px box
                            around 14px of visible label text), which
                            swallows the detail's margin-top and makes the
                            two lines touch. A span styled by the same class
                            was measured to restore the intended gap. */}
                        <span className="editorial-dashboard__pipeline-node-label">
                          Studio
                        </span>
                        <span className="editorial-dashboard__pipeline-node-detail">
                          {pipelineDetail.node1}
                        </span>
                      </div>
                      <div className="editorial-dashboard__pipeline-connector">
                        <div className="editorial-dashboard__pipeline-connector-track">
                          <span
                            aria-hidden="true"
                            className={
                              displaySegments.testSite === 'done'
                                ? 'editorial-dashboard__pipeline-link editorial-dashboard__pipeline-link--done'
                                : 'editorial-dashboard__pipeline-link'
                            }
                          />
                          <button
                            type="button"
                            className={`editorial-dashboard__pipeline-gate editorial-dashboard__pipeline-gate--${gateVariant}`}
                            disabled={pipeline.promote.buttonDisabled}
                            title={gateLabel}
                            aria-label={gateLabel}
                            onClick={handleGateClick}
                          >
                            {gateVariant === 'locked' && <LockIcon />}
                            {gateVariant === 'ready' && <PlayIcon />}
                            {gateVariant === 'done' && <CheckmarkIcon />}
                            {gateVariant === 'failed' && <CloseIcon />}
                          </button>
                          <span
                            aria-hidden="true"
                            className={
                              displaySegments.liveSite === 'done'
                                ? 'editorial-dashboard__pipeline-link editorial-dashboard__pipeline-link--done'
                                : 'editorial-dashboard__pipeline-link'
                            }
                          />
                        </div>
                        {gateCaption && (
                          <span className="editorial-dashboard__pipeline-gate-caption">
                            {gateCaption}
                          </span>
                        )}
                      </div>
                      <div className="editorial-dashboard__pipeline-node">
                        <span
                          aria-hidden="true"
                          className={pipelineCircleClassName(displaySegments.liveSite)}
                        >
                          {pipelineNodeIcon(displaySegments.liveSite, EarthGlobeIcon)}
                        </span>
                        <span className="editorial-dashboard__pipeline-node-label">
                          Site en ligne
                        </span>
                        <span className="editorial-dashboard__pipeline-node-detail">
                          {pipelineDetail.node2}
                        </span>
                      </div>
                    </Flex>

                    {promoteActionsBoxHasBody && (
                      <Stack
                        space={2}
                        className={
                          pipeline.promote.dimmed
                            ? 'editorial-dashboard__pipeline-detail editorial-dashboard__pipeline-detail--dimmed'
                            : 'editorial-dashboard__pipeline-detail'
                        }
                      >
                        {pipeline.promote.actionUrl && (
                          <Flex justify="center">
                            <a
                              href={pipeline.promote.actionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="editorial-dashboard__deployment-status"
                            >
                              {pipeline.promote.actionLabel}
                            </a>
                          </Flex>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </section>

                {publicationPanelHasBody && (
                  <Box className="editorial-dashboard__publish-divider" />
                )}

                {publicationCard.blockedRows.length > 0 && (
                  <Card padding={3} radius={2} tone="critical">
                    <Stack space={3}>
                      <Text size={1} weight="semibold">
                        Le lot entier est bloqué par des informations indispensables.
                      </Text>
                      {publicationCard.blockedRows.map((blocked) => (
                        <IntentLink
                          key={blocked.id}
                          intent="edit"
                          params={{id: blocked.id, type: blocked.type}}
                          style={{color: 'inherit'}}
                        >
                          <Text size={1}>
                            {blocked.title} — {blocked.reasons.join(' · ')}
                          </Text>
                        </IntentLink>
                      ))}
                    </Stack>
                  </Card>
                )}

                {publicationState.phase === 'tracking-error' && (
                  <Card padding={3} radius={2} tone="caution">
                    <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                      <Stack space={2} style={{minWidth: 0}}>
                        <Text size={1} weight="semibold">
                          Contenus publiés dans Sanity; fraîcheur du site non vérifiable.
                        </Text>
                        <Text size={1}>{publicationState.error}</Text>
                      </Stack>
                      <Button
                        text="Actualiser le suivi"
                        onClick={() => void refreshPublicationTracking()}
                        disabled={publicationBusy}
                      />
                    </Flex>
                  </Card>
                )}

                {publicationState.phase === 'confirming' && publicationState.error && (
                  // Re-homes the message the deleted confirmation card used to be the
                  // only renderer of. It comes from publish()'s fingerprint comparison
                  // in dashboardLogic.ts, which refuses to publish a batch that changed
                  // between the gate and the publish call. The message itself already
                  // tells the editor to click « Mettre le site à jour » again, so this
                  // card needs no button of its own.
                  <Card padding={3} radius={2} tone="caution">
                    <Text size={1}>{publicationState.error}</Text>
                  </Card>
                )}

                {publicationState.phase === 'error' && (
                  <Card padding={3} radius={2} tone="critical">
                    <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                      <Stack space={2} style={{minWidth: 0}}>
                        <Text size={1} weight="semibold">
                          La mise en ligne n’a pas abouti. Aucun succès partiel n’est annoncé.
                        </Text>
                        <Text size={1}>{publicationState.error}</Text>
                      </Stack>
                      <Button
                        text="Actualiser et réessayer"
                        onClick={() => void runPublication()}
                        disabled={publicationBusy}
                      />
                    </Flex>
                  </Card>
                )}
              </Stack>
            </Card>
          )}

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

// Pure visual helpers for the two-node approval-gate pipeline below. Every
// helper here is a function of already-computed pipeline state; none reads
// component state or fetches anything (see the plan's scope boundary).

function pipelineNodeIcon(
  kind: PipelineSegmentKind,
  Fallback: ComponentType<SVGProps<SVGSVGElement>>,
) {
  if (kind === 'active') {
    return <SpinnerIcon className="editorial-dashboard__pipeline-spin" />
  }
  if (kind === 'done') return <CheckmarkIcon />
  if (kind === 'failed') return <CloseIcon />
  return <Fallback />
}

// Order matters and encodes the two behaviours confirmed twice in review:
// the running check sits above the disabled check, so a running production
// release renders this control calm and iconless while the destination
// node alone carries the spinner; the failure check sits above everything,
// so a production failure paints this control red at the same instant the
// destination node does.
function pipelineGateVariant(
  display: ReleasePipelineDisplaySegments,
  promote: ReleasePipelinePromote,
  requestFailed: boolean,
): PipelineGateVariant {
  if (requestFailed || display.liveSite === 'failed' || display.testSite === 'failed') {
    return 'failed'
  }
  if (display.liveSite === 'active') return 'active'
  if (display.liveSite === 'done') return 'done'
  if (promote.buttonDisabled) return 'locked'
  return 'ready'
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
