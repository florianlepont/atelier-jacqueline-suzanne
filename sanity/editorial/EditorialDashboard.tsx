import {useEffect, useMemo, useState} from 'react'
import type {ComponentType, SVGProps} from 'react'
import {Badge, Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {IntentButton, useClient, useHistoryStore, useUserStore} from 'sanity'
import {IntentLink} from 'sanity/router'
import {
  AddIcon,
  BulbOutlineIcon,
  ChevronRightIcon,
  DocumentIcon,
  EditIcon,
  ErrorOutlineIcon,
  FolderIcon,
  ImagesIcon,
  LaunchIcon,
  PublishIcon,
  TaskIcon,
  UnpublishIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import type {TransactionLogEventWithMutations, TransactionLogMutation, User} from '@sanity/types'
import {deploymentLabel, getLatestDeployment, SITE_PREVIEW_URL} from './deployment'
import type {DeploymentRun} from './deployment'
import {getDocumentChecks, summarizeChecks} from './checks'
import type {CheckItem} from './checks'
import './EditorialDashboard.css'

interface DashboardDocument extends Record<string, unknown> {
  _id: string
  _type: string
  _updatedAt: string
  title?: string
  isVisible?: boolean
  publicationStatus?: string
  images?: unknown[]
}

interface DashboardRow {
  id: string
  current: DashboardDocument
  hasDraft: boolean
  isPublished: boolean
  lastUpdatedAt: string
  checks: CheckItem[]
  summary: ReturnType<typeof summarizeChecks>
}

interface DashboardActivity {
  authorName: string
  description: string
  action: ActivityAction
  timestamp: string
}

type ActivityAction = 'created' | 'modified' | 'published' | 'unpublished'

type DashboardTone = 'default' | 'primary' | 'positive' | 'caution' | 'critical'

type Severity = 'Bloquant' | 'Important' | 'Suggestion'

interface AttentionGroup {
  id: string
  severity: Severity
  title: string
  description: string
  actionVerb: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: DashboardTone
  rows: DashboardRow[]
}

const query = `*[_type in ["gallery", "homePage", "aboutPage", "contactPage", "siteSettings", "exhibition"]] | order(_updatedAt desc) {
  _id, _type, _updatedAt, title, slug, isVisible, publicationStatus, statement, images, seo,
  intro, biography, practice, medium, siteTitle, navLabels, footerText, defaultSeo,
  publicEmail, professionalLinks, startDate, venue, city, description, image
}`

const typeLabels: Record<string, string> = {
  gallery: 'Collection photo',
  homePage: "Page d'accueil",
  aboutPage: 'Page À propos',
  contactPage: 'Page Contact',
  siteSettings: 'Réglages du site',
  exhibition: 'Exposition',
}

const rowTypeLabels: Record<string, string> = {
  gallery: 'Collection photo',
  homePage: 'Page',
  aboutPage: 'Page',
  contactPage: 'Page',
  siteSettings: 'Réglages',
  exhibition: 'Exposition',
}

const activityIcons: Record<ActivityAction, ComponentType<SVGProps<SVGSVGElement>>> = {
  created: AddIcon,
  modified: EditIcon,
  published: PublishIcon,
  unpublished: UnpublishIcon,
}

const fieldLabels: Record<string, string> = {
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

function baseId(id: string) {
  return id.replace(/^drafts\./, '')
}

function pluralize(count: number, singular: string, plural: string = `${singular}s`) {
  return count > 1 ? plural : singular
}

function documentTitle(document: DashboardDocument) {
  if (document._type === 'gallery' || document._type === 'exhibition') {
    return (
      document.title ||
      (document._type === 'gallery' ? 'Collection sans nom' : 'Événement sans nom')
    )
  }
  return typeLabels[document._type] || document._type
}

function isGalleryOnline(document: DashboardDocument) {
  return document.publicationStatus
    ? document.publicationStatus === 'published'
    : document.isVisible !== false
}

function mutationDocumentId(mutation: TransactionLogMutation) {
  if ('patch' in mutation) return 'id' in mutation.patch ? mutation.patch.id : undefined
  if ('delete' in mutation) return 'id' in mutation.delete ? mutation.delete.id : undefined
  if ('create' in mutation) return mutation.create._id
  if ('createOrReplace' in mutation) return mutation.createOrReplace._id
  if ('createIfNotExists' in mutation) return mutation.createIfNotExists._id
  if ('createSquashed' in mutation) return mutation.createSquashed.document._id
  return undefined
}

function mutationFields(mutation: TransactionLogMutation) {
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

function contentNoun(document: DashboardDocument) {
  if (document._type === 'gallery') return 'cette collection'
  if (document._type === 'exhibition') return 'cette exposition'
  if (document._type === 'siteSettings') return 'les réglages du site'
  return 'cette page'
}

function describeTransaction(
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

function buildActivities(
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
        ...activity,
        timestamp: transaction.timestamp,
      }
    }
  }

  return activities
}

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

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    Promise.all([
      client.fetch<DashboardDocument[]>(query, {}, {perspective: 'raw'}),
      getLatestDeployment(controller.signal).catch(() => null),
    ])
      .then(async ([content, deployment]) => {
        if (cancelled) return
        setDocuments(content)
        setRun(deployment)

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
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : 'Erreur inconnue'),
      )
      .finally(() => setLoading(false))
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [client, historyStore, userStore])

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
  const visibleAttention = showAllAttention ? attention : attention.slice(0, 5)
  const attentionGroups = buildAttentionGroups(visibleAttention)
  const blockingRows = attention.filter((row) => !row.summary.requiredComplete)
  const recentRows = showAllActivity ? rows : rows.slice(0, 4)

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
                L’essentiel du contenu et de la mise en ligne.
              </Text>
            </Stack>
            <Flex
              align="center"
              gap={2}
              wrap="wrap"
              className="editorial-dashboard__actions editorial-dashboard__header-side"
            >
              <DeploymentStatus run={run} />
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
              <Button
                className="editorial-dashboard__header-control"
                style={{height: 44}}
                as="a"
                href={SITE_PREVIEW_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvrir le site (nouvel onglet)"
                iconRight={LaunchIcon}
                mode="ghost"
                paddingY={3}
                text="Ouvrir le site"
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
            <Card radius={3} tone="critical" shadow={1} padding={4}>
              <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                <Stack space={2} style={{flex: '1 1 280px'}}>
                  <Text size={1} weight="bold">
                    {blockingRows.length === 1
                      ? `« ${documentTitle(blockingRows[0].current)} » ne peut pas être publié`
                      : `${blockingRows.length} contenus ne peuvent pas être publiés`}
                  </Text>
                  <Text size={0} muted>
                    Des informations indispensables sont manquantes.
                  </Text>
                </Stack>
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
              <Card
                radius={3}
                tone="default"
                shadow={1}
                overflow="hidden"
                className="editorial-dashboard__surface"
              >
                <div className="editorial-dashboard__metrics">
                  <MetricCard
                    icon={FolderIcon}
                    label={pluralize(onlineGalleryCount, 'collection', 'collections')}
                    value={String(onlineGalleryCount)}
                    detail={pluralize(onlineGalleryCount, 'publiée sur le site', 'publiées sur le site')}
                    href="/structure"
                    activateLabel="Voir les collections dans Contenu du site"
                  />
                  <MetricCard
                    icon={DocumentIcon}
                    label={pluralize(draftCount, 'brouillon', 'brouillons')}
                    value={String(draftCount)}
                    detail="en cours de rédaction"
                    href="/structure"
                    activateLabel="Voir le contenu dans Contenu du site"
                  />
                  <MetricCard
                    icon={WarningOutlineIcon}
                    label={pluralize(attention.length, 'contenu', 'contenus')}
                    value={String(attention.length)}
                    detail="à vérifier avant publication"
                    activateLabel="Aller à la liste « À faire maintenant »"
                    onActivate={() => {
                      const heading = document.getElementById('editorial-dashboard-attention-heading')
                      heading?.scrollIntoView({behavior: 'smooth', block: 'start'})
                      heading?.focus()
                    }}
                  />
                </div>
              </Card>

              <div className="editorial-dashboard__columns">
                <Stack space={3}>
                  <Flex align="flex-end" justify="space-between" gap={2}>
                    <Stack space={2}>
                      <Heading as="h2" size={2} id="editorial-dashboard-attention-heading" tabIndex={-1}>
                        À faire maintenant
                      </Heading>
                      <Text muted size={0}>
                        {attention.length === 0
                          ? 'Aucun contenu en attente'
                          : `${visibleAttention.length} ${pluralize(visibleAttention.length, 'contenu prioritaire', 'contenus prioritaires')} sur ${attention.length} à vérifier`}
                      </Text>
                    </Stack>
                    {attention.length > 5 && (
                      <Button
                        className="editorial-dashboard__activity-toggle"
                        style={{minHeight: 44}}
                        mode="bleed"
                        fontSize={0}
                        padding={2}
                        text={
                          showAllAttention
                            ? 'Réduire'
                            : `Voir les ${attention.length} ${pluralize(attention.length, 'contenu', 'contenus')}`
                        }
                        aria-expanded={showAllAttention}
                        aria-controls="editorial-dashboard-attention-list"
                        onClick={() => setShowAllAttention((value) => !value)}
                      />
                    )}
                  </Flex>

                  {attention.length === 0 ? (
                    <Card padding={3} radius={3} tone="positive">
                      <Text size={1}>Aucun contenu ne nécessite votre attention.</Text>
                    </Card>
                  ) : (
                    <Stack space={2} id="editorial-dashboard-attention-list">
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
                    className="editorial-dashboard__surface"
                  >
                    <Stack space={0}>
                      {recentRows.map((row, index) => (
                        <RecentRow
                          key={row.id}
                          row={row}
                          activity={activities[row.id]}
                          withBorder={index < recentRows.length - 1}
                        />
                      ))}
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

function buildAttentionGroups(rows: DashboardRow[]): AttentionGroup[] {
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

function attentionPriority(row: DashboardRow) {
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

function attentionRowIcon(row: DashboardRow, group: AttentionGroup): ComponentType<SVGProps<SVGSVGElement>> {
  if (group.id === 'publish') return PublishIcon
  if (group.id === 'finish') return TaskIcon

  const missingLabels = row.checks
    .filter((check) => !check.complete)
    .map((check) => check.label.toLocaleLowerCase('fr-FR'))
  const concernsOnlyImages =
    missingLabels.length > 0 &&
    missingLabels.every((label) =>
      ['photo', 'image', 'crédit', 'copyright', 'droits'].some((term) => label.includes(term)),
    )

  if (concernsOnlyImages) return ImagesIcon
  if (group.id === 'blocking') return ErrorOutlineIcon
  if (row.current._type !== 'gallery' && row.current._type !== 'exhibition') return DocumentIcon
  return BulbOutlineIcon
}

function compactCheckLabel(label: string) {
  return label
    .replace(/français et anglais|française et anglaise|françaises et anglaises/gi, 'FR et EN')
    .replace('Libellés FR et EN des liens professionnels', 'Libellés des liens FR et EN')
    .replace('Descriptions manquantes :', 'Textes alternatifs :')
    .replace('Descriptions accessibles de toutes les photos', 'Textes alternatifs des photos')
    .replace('Titres SEO FR et EN', 'Titre pour Google (FR et EN)')
    .replace('Descriptions SEO FR et EN', 'Description pour Google (FR et EN)')
    .replace('Image de partage', 'Aperçu sur les réseaux sociaux')
}

function attentionRowSummary(row: DashboardRow, group: AttentionGroup) {
  if (group.id === 'publish') return 'Publier les modifications en attente'
  if (group.id === 'finish') return 'Finaliser le contenu et le mettre en ligne'

  const recommended = group.id === 'recommended'
  const missing = row.checks
    .filter((check) => !check.complete && Boolean(check.recommended) === recommended)
    .map((check) => compactCheckLabel(check.label))

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

function attentionRowSummaryDetail(row: DashboardRow, group: AttentionGroup) {
  if (group.id === 'publish' || group.id === 'finish') return attentionRowSummary(row, group)
  const recommended = group.id === 'recommended'
  const missing = row.checks
    .filter((check) => !check.complete && Boolean(check.recommended) === recommended)
    .map((check) => compactCheckLabel(check.label))
  return missing.join(' · ')
}

function editorialStatus(row: DashboardRow): {label: string; tone: DashboardTone} {
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

function AttentionSection({group, showCount}: {group: AttentionGroup; showCount: boolean}) {
  const Icon = group.icon
  return (
    <Card
      radius={3}
      tone="default"
      shadow={1}
      overflow="hidden"
      className="editorial-dashboard__surface"
    >
      <Card
        tone={group.tone}
        padding={3}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
      >
        <Flex align="center" gap={2} wrap="wrap" className="editorial-dashboard__group-header">
          <Text
            size={1}
            className="editorial-dashboard__group-icon"
            style={{lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
          >
            <Icon style={{display: 'block'}} />
          </Text>
          {showCount && (
            <Card
              tone={group.tone}
              radius={4}
              style={{
                width: 24,
                height: 24,
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
            >
              <Text size={0} weight="semibold">
                {group.rows.length}
              </Text>
            </Card>
          )}
          <Badge tone={group.tone} mode="outline" fontSize={0}>
            {group.severity}
          </Badge>
          <Text size={1} weight="bold" role="heading" aria-level={3}>
            {group.title}
          </Text>
          <Text muted size={0}>
            {group.description}
          </Text>
        </Flex>
      </Card>
      <Stack space={0}>
        {group.rows.map((row, index) => (
          <ContentRow
            key={row.id}
            row={row}
            withBorder={index < group.rows.length - 1}
            accentTone={group.tone}
            issueIcon={attentionRowIcon(row, group)}
            taskSummary={attentionRowSummary(row, group)}
            taskSummaryDetail={attentionRowSummaryDetail(row, group)}
            actionVerb={group.actionVerb}
          />
        ))}
      </Stack>
    </Card>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  onActivate,
  activateLabel,
  href,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: string
  detail: string
  onActivate?: () => void
  activateLabel?: string
  href?: string
}) {
  const body = (
    <Flex align="flex-start" justify="space-between" gap={2}>
      <Stack space={3}>
        <Heading size={2}>{value}</Heading>
        <Flex align="center" gap={1} wrap="wrap">
          <Text size={0} weight="semibold">
            {label}
          </Text>
          <Text muted size={0}>
            {detail}
          </Text>
        </Flex>
      </Stack>
      <Text
        muted
        size={1}
        className="editorial-dashboard__metric-icon"
        style={{lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <Icon style={{display: 'block'}} />
      </Text>
    </Flex>
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
      <Card
        tone={tone}
        radius={4}
        className="editorial-dashboard__deployment-icon"
        style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <Text
          size={1}
          style={{
            lineHeight: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            boxSizing: 'border-box',
            transform: 'none',
          }}
        >
          <PublishIcon style={{display: 'block'}} />
        </Text>
      </Card>
      <Text size={0} weight="semibold" style={{whiteSpace: 'nowrap'}}>
        {siteStatusLabel}
      </Text>
      <Text muted size={0} className="editorial-dashboard__deployment-date">
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
  withBorder,
  accentTone,
  issueIcon: IssueIcon,
  taskSummary,
  taskSummaryDetail,
  actionVerb,
}: {
  row: DashboardRow
  withBorder: boolean
  accentTone: DashboardTone
  issueIcon: ComponentType<SVGProps<SVGSVGElement>>
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
      <Card
        tone="transparent"
        className="editorial-dashboard__task-row"
        style={{borderBottom: withBorder ? '1px solid var(--card-border-color)' : undefined}}
      >
        <Flex>
          <Card tone={accentTone} style={{width: 4}} />
          <Box
            paddingX={3}
            paddingY={3}
            className="editorial-dashboard__task-content"
            style={{minWidth: 0, flex: 1}}
          >
            <div className="editorial-dashboard__task-grid">
              <Text
                muted
                size={1}
                className="editorial-dashboard__task-icon"
                style={{lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
              >
                <IssueIcon style={{display: 'block'}} />
              </Text>
              <Stack space={3} className="editorial-dashboard__task-copy">
                <Flex
                  align="center"
                  justify="space-between"
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
                  <Flex align="center" gap={2} className="editorial-dashboard__task-meta">
                    {typeLabel && (
                      <Text muted size={0}>
                        {typeLabel}
                      </Text>
                    )}
                    {showStatus && (
                      <Badge fontSize={0} mode="light" tone={status.tone}>
                        {status.label}
                      </Badge>
                    )}
                  </Flex>
                </Flex>
                <Text
                  muted
                  size={0}
                  textOverflow="ellipsis"
                  title={taskSummaryDetail || taskSummary}
                  className="editorial-dashboard__task-summary"
                  style={{padding: 0, fontSize: 12, lineHeight: '16px', color: 'rgb(77, 80, 91)'}}
                >
                  {taskSummary}
                </Text>
              </Stack>
              <Flex align="center" gap={1} className="editorial-dashboard__task-action" style={{flex: '0 0 auto'}}>
                {actionVerb && (
                  <Card
                    tone={accentTone}
                    radius={2}
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
                  style={{lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
                >
                  <ChevronRightIcon style={{display: 'block'}} />
                </Text>
              </Flex>
            </div>
          </Box>
        </Flex>
      </Card>
    </IntentLink>
  )
}

function RecentRow({
  row,
  activity,
  withBorder,
}: {
  row: DashboardRow
  activity?: DashboardActivity
  withBorder: boolean
}) {
  const status = editorialStatus(row)
  const showStatus = status.tone !== 'positive'
  const ActivityIcon = activity ? activityIcons[activity.action] : null
  const fallbackDescription = 'Détail de l’activité non disponible'
  return (
    <IntentLink
      className="editorial-dashboard__row-link"
      intent="edit"
      params={{id: row.id, type: row.current._type}}
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      <Box
        paddingX={3}
        paddingY={2}
        className="editorial-dashboard__activity-row"
        style={{
          borderBottom: withBorder ? '1px solid var(--card-border-color)' : undefined,
          minHeight: 46,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div className="editorial-dashboard__activity-grid">
          <Text
            muted
            size={1}
            className="editorial-dashboard__activity-icon"
            style={{lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
          >
            {ActivityIcon ? <ActivityIcon style={{display: 'block'}} /> : <DocumentIcon style={{display: 'block'}} />}
          </Text>
          <Stack space={2} className="editorial-dashboard__activity-copy">
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
                  <Badge fontSize={0} mode="light" tone={status.tone} style={{flex: '0 0 auto', whiteSpace: 'nowrap'}}>
                    {status.label}
                  </Badge>
                )}
              </Flex>
              <Text
                muted
                size={0}
                className="editorial-dashboard__activity-date"
                style={{padding: 0, flex: '0 0 auto'}}
              >
                {formatActivityDate(activity?.timestamp ?? row.lastUpdatedAt)}
              </Text>
            </Flex>
            <Flex align="center" gap={1} wrap="wrap" className="editorial-dashboard__activity-meta">
              <Text size={0} weight="medium" style={{padding: 0, fontSize: 12, lineHeight: '16px'}}>
                {activity?.authorName ?? 'Activité indisponible'}
              </Text>
              <Text muted size={0} style={{padding: 0, fontSize: 12, lineHeight: '16px', color: 'rgb(77, 80, 91)'}}>
                ·
              </Text>
              <Text muted size={0} style={{padding: 0, fontSize: 12, lineHeight: '16px', color: 'rgb(77, 80, 91)'}}>
                {activity?.description ?? fallbackDescription}
              </Text>
            </Flex>
          </Stack>
        </div>
      </Box>
    </IntentLink>
  )
}

function formatActivityDate(value: string) {
  const date = new Date(value)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  const time = date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})

  if (sameDay(date, now)) return `Aujourd’hui à ${time}`
  if (sameDay(date, yesterday)) return `Hier à ${time}`
  return `${date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} à ${time}`
}
