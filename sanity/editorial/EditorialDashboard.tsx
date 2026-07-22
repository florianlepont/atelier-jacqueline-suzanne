import {useEffect, useMemo, useRef, useState} from 'react'
import type {ComponentType, SVGProps} from 'react'
import {Badge, Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {IntentButton, useClient, useHistoryStore, useUserStore} from 'sanity'
import {IntentLink} from 'sanity/router'
import {
  AddIcon,
  CheckmarkCircleIcon,
  ChevronRightIcon,
  CogIcon,
  DocumentIcon,
  ErrorOutlineIcon,
  FolderIcon,
  ImagesIcon,
  LaunchIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {deploymentLabel, getLatestDeployment, SITE_PREVIEW_URL} from './deployment'
import type {DeploymentRun} from './deployment'
import {getDocumentChecks, summarizeChecks} from './checks'
import {
  attentionPriority,
  attentionRowSummary,
  attentionRowSummaryDetail,
  baseId,
  buildActivities,
  buildAttentionGroups,
  contentNoun,
  documentTitle,
  editorialStatus,
  formatActivityDate,
  formatRelativeDate,
  isGalleryOnline,
  pluralize,
  rowTypeLabels,
} from './dashboardLogic'
import type {
  AttentionGroup,
  DashboardActivity,
  DashboardDocument,
  DashboardRow,
  DashboardTone,
} from './dashboardLogic'
import './EditorialDashboard.css'

const query = `*[_type in ["gallery", "homePage", "aboutPage", "contactPage", "siteSettings", "exhibition"]] | order(_updatedAt desc) {
  _id, _type, _updatedAt, title, slug, isVisible, publicationStatus, statement, images, seo,
  intro, biography, practice, medium, siteTitle, navLabels, footerText, defaultSeo,
  publicEmail, professionalLinks, startDate, venue, city, description, image
}`

export function EditorialDashboard() {
  const client = useClient({apiVersion: '2025-08-15'})
  const historyStore = useHistoryStore()
  const userStore = useUserStore()
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  const [activities, setActivities] = useState<Record<string, DashboardActivity>>({})
  const [run, setRun] = useState<DeploymentRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showAllAttention, setShowAllAttention] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const hasDataRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    client
      .fetch<DashboardDocument[]>(query, {}, {perspective: 'raw'})
      .then(async (content) => {
        if (cancelled) return
        setDocuments(content)
        setError('')
        hasDataRef.current = true

        try {
          const documentIds = Array.from(
            new Set(
              content.flatMap((document) => [
                baseId(document._id),
                `drafts.${baseId(document._id)}`,
              ]),
            ),
          )
          const transactions = await historyStore.getTransactions(documentIds)
          const authorIds = Array.from(new Set(transactions.map(({author}) => author)))
          const users = authorIds.length > 0 ? await userStore.getUsers(authorIds) : []
          if (!cancelled) setActivities(buildActivities(transactions, users, content))
        } catch {
          // History is supplementary and subject to plan retention. The dashboard's
          // primary content should remain available if it cannot be retrieved.
          if (!cancelled) setActivities({})
        }
      })
      .catch((reason: unknown) => {
        // A failed background refresh keeps showing the last good data; only a
        // failed FIRST load has nothing to fall back on and surfaces the error.
        if (!cancelled && !hasDataRef.current) {
          setError(reason instanceof Error ? reason.message : 'Erreur inconnue')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client, historyStore, userStore, refreshKey])

  // Re-fetch (silently) whenever any dashboard-relevant document changes, so
  // edits made in another tab — or by another editor — appear without a reload.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = client
      .listen(query, {}, {visibility: 'query', includeResult: false, events: ['mutation']})
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

  // The deployment status is polled: it changes server-side (GitHub Actions),
  // not through Sanity mutations, so listen() cannot see it.
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    const load = () =>
      getLatestDeployment(controller.signal)
        .then((deployment) => {
          if (!cancelled) setRun(deployment)
        })
        .catch(() => undefined)
    load()
    const intervalId = setInterval(load, 5 * 60 * 1000)
    return () => {
      cancelled = true
      controller.abort()
      clearInterval(intervalId)
    }
  }, [])

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
  const galleries = rows.filter(({current}) => current._type === 'gallery')
  const onlineGalleryCount = galleries.filter((row) => isGalleryOnline(row.current)).length
  const draftCount = rows.filter((row) => row.hasDraft).length
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
        : 'Tout est publié et à jour.'

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
              <DeploymentStatus run={run} />
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
                mode="default"
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
              <div className="editorial-dashboard__metrics">
                <MetricCard
                  icon={FolderIcon}
                  label={pluralize(onlineGalleryCount, 'collection', 'collections')}
                  value={String(onlineGalleryCount)}
                  detail={pluralize(onlineGalleryCount, 'publiée sur le site', 'publiées sur le site')}
                  accent="primary"
                  href="/structure"
                  activateLabel="Voir les collections dans Contenu du site"
                />
                <MetricCard
                  icon={DocumentIcon}
                  label={pluralize(draftCount, 'brouillon', 'brouillons')}
                  value={String(draftCount)}
                  detail="en cours de rédaction"
                  accent="neutral"
                  href="/structure"
                  activateLabel="Voir le contenu dans Contenu du site"
                />
                <MetricCard
                  icon={WarningOutlineIcon}
                  label={pluralize(listedAttention.length, 'contenu', 'contenus')}
                  value={String(listedAttention.length)}
                  detail="à vérifier avant publication"
                  accent={listedAttention.length > 0 ? 'caution' : 'positive'}
                  activateLabel="Aller à la liste « À faire maintenant »"
                  onActivate={() => {
                    const heading = document.getElementById('editorial-dashboard-attention-heading')
                    heading?.scrollIntoView({behavior: 'smooth', block: 'start'})
                    heading?.focus()
                  }}
                />
              </div>

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

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = 'neutral',
  onActivate,
  activateLabel,
  href,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: string
  detail: string
  accent?: MetricAccent
  onActivate?: () => void
  activateLabel?: string
  href?: string
}) {
  const accentStyle = metricAccentStyles[accent]
  const body = (
    <Card
      radius={3}
      shadow={1}
      padding={3}
      className="editorial-dashboard__surface editorial-dashboard__metric-card"
      style={{height: '100%', boxSizing: 'border-box'}}
    >
      <Flex align="center" gap={3}>
        <TintChip icon={Icon} size={38} radius={10} iconSize={21} tint={accentStyle} />
        <Stack space={2} style={{minWidth: 0}}>
          <Heading size={2}>{value}</Heading>
          <Text size={1} style={{fontSize: 12}}>
            <span style={{fontWeight: 600}}>{label}</span>{' '}
            <span style={{color: 'var(--card-muted-fg-color)'}}>{detail}</span>
          </Text>
        </Stack>
      </Flex>
    </Card>
  )

  if (href) {
    return (
      <a
        href={href}
        className="editorial-dashboard__metric-cell editorial-dashboard__metric-cell--interactive"
        style={{color: 'inherit', textDecoration: 'none'}}
        aria-label={activateLabel}
      >
        {body}
      </a>
    )
  }

  if (onActivate) {
    return (
      <button
        type="button"
        className="editorial-dashboard__metric-cell editorial-dashboard__metric-cell--interactive"
        onClick={onActivate}
        aria-label={activateLabel}
      >
        {body}
      </button>
    )
  }

  return <div className="editorial-dashboard__metric-cell">{body}</div>
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

function DeploymentStatus({run}: {run: DeploymentRun | null}) {
  const status = deploymentLabel(run)
  const tone = status.tone
  const dateLabel = run ? formatActivityDate(run.updated_at) : 'Date inconnue'
  const shortStatusLabel =
    run?.status === 'completed' && run.conclusion === 'success' ? 'À jour' : status.label
  const siteStatusLabel =
    shortStatusLabel === 'À jour' ? 'Site à jour' : `Site : ${shortStatusLabel}`

  const content = (
    <Flex align="center" gap={2} className="editorial-dashboard__deployment-content">
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flex: '0 0 auto',
          backgroundColor: deploymentDotColors[tone],
        }}
      />
      <Text
        size={1}
        weight="medium"
        style={{
          whiteSpace: 'nowrap',
          fontSize: 13,
          color: tone === 'critical' ? deploymentDotColors.critical : undefined,
        }}
      >
        {siteStatusLabel}
      </Text>
      <Text muted size={1} className="editorial-dashboard__deployment-date" style={{fontSize: 13}}>
        {dateLabel}
      </Text>
    </Flex>
  )

  return run?.html_url ? (
    <a
      href={run.html_url}
      target="_blank"
      rel="noreferrer"
      title="Voir le détail de la dernière mise en ligne"
      aria-label={`${shortStatusLabel}. ${dateLabel}. Voir le détail de la mise en ligne (nouvel onglet)`}
      className="editorial-dashboard__deployment-status"
    >
      {content}
    </a>
  ) : (
    <div className="editorial-dashboard__deployment-status">{content}</div>
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
