import {useEffect, useMemo, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {deploymentLabel, getLatestDeployment, SITE_PREVIEW_URL} from './deployment'
import type {DeploymentRun} from './deployment'
import {getDocumentChecks, summarizeChecks} from './checks'

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
  summary: ReturnType<typeof summarizeChecks>
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

function baseId(id: string) {
  return id.replace(/^drafts\./, '')
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

export function EditorialDashboard() {
  const client = useClient({apiVersion: '2025-08-15'})
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  const [run, setRun] = useState<DeploymentRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      client.fetch<DashboardDocument[]>(query, {}, {perspective: 'raw'}),
      getLatestDeployment(controller.signal).catch(() => null),
    ])
      .then(([content, deployment]) => {
        setDocuments(content)
        setRun(deployment)
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : 'Erreur inconnue'),
      )
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [client])

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
        const lastUpdatedAt = [versions.draft?._updatedAt, versions.published?._updatedAt]
          .filter((value): value is string => Boolean(value))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        return {
          id,
          current,
          hasDraft: Boolean(versions.draft),
          isPublished: Boolean(versions.published),
          lastUpdatedAt: lastUpdatedAt ?? current._updatedAt,
          summary: summarizeChecks(getDocumentChecks(current._type, current)),
        }
      })
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
  }, [documents])

  const attention = rows.filter(({current, summary}) => {
    if (current.publicationStatus === 'archived') return false
    return (
      !summary.requiredComplete ||
      !summary.recommendedComplete ||
      current.publicationStatus === 'preparation' ||
      (!current.publicationStatus && current.isVisible === false)
    )
  })
  const galleries = rows.filter(({current}) => current._type === 'gallery')

  return (
    <Box padding={[3, 4, 5]} style={{maxWidth: 1080, margin: '0 auto'}}>
      <Stack space={5}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2}>
            <Heading as="h1" size={3}>
              Tableau de bord
            </Heading>
            <Text muted size={1}>
              L’essentiel du contenu et de la mise en ligne.
            </Text>
          </Stack>
          <Button
            as="a"
            href={SITE_PREVIEW_URL}
            target="_blank"
            rel="noreferrer"
            mode="ghost"
            text="Ouvrir le site ↗"
          />
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
            <Text size={1}>Impossible de charger le tableau de bord : {error}</Text>
          </Card>
        )}

        {!loading && !error && (
          <>
            <Grid columns={[2, 2, 4]} gap={3}>
              <MetricCard
                label="Collections"
                value={String(galleries.filter((row) => isGalleryOnline(row.current)).length)}
                detail="sur le site"
              />
              <MetricCard
                label="Brouillons"
                value={String(rows.filter((row) => row.hasDraft).length)}
                detail="en cours"
              />
              <MetricCard label="À vérifier" value={String(attention.length)} detail="contenus" />
              <DeploymentCard run={run} />
            </Grid>

            <Stack space={3}>
              <Flex align="center" justify="space-between">
                <Heading as="h2" size={2}>
                  À vérifier
                </Heading>
                <Badge mode="outline" tone={attention.length ? 'caution' : 'positive'}>
                  {attention.length || 'Tout est prêt'}
                </Badge>
              </Flex>

              {attention.length === 0 ? (
                <Card padding={4} radius={3} tone="positive">
                  <Text size={1}>Aucun contenu ne nécessite votre attention.</Text>
                </Card>
              ) : (
                <Card radius={3} shadow={1} overflow="hidden">
                  <Stack space={0}>
                    {attention.map((row, index) => (
                      <ContentRow
                        key={row.id}
                        row={row}
                        withBorder={index < attention.length - 1}
                      />
                    ))}
                  </Stack>
                </Card>
              )}
            </Stack>

            <Stack space={3}>
              <Heading as="h2" size={2}>
                Activité récente
              </Heading>
              <Card radius={3} tone="transparent" border>
                <Stack space={0}>
                  {rows.slice(0, 6).map((row, index) => (
                    <RecentRow
                      key={row.id}
                      row={row}
                      withBorder={index < Math.min(rows.length, 6) - 1}
                    />
                  ))}
                </Stack>
              </Card>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  )
}

function MetricCard({label, value, detail}: {label: string; value: string; detail: string}) {
  return (
    <Card padding={3} radius={3} shadow={1}>
      <Stack space={3}>
        <Text muted size={1}>
          {label}
        </Text>
        <Flex align="baseline" gap={2}>
          <Heading size={3}>{value}</Heading>
          <Text muted size={1}>
            {detail}
          </Text>
        </Flex>
      </Stack>
    </Card>
  )
}

function DeploymentCard({run}: {run: DeploymentRun | null}) {
  const status = deploymentLabel(run)
  const tone = !run
    ? 'default'
    : run.status !== 'completed'
      ? 'caution'
      : run.conclusion === 'success'
        ? 'positive'
        : 'critical'

  const content = (
    <Stack space={3}>
      <Text muted size={1}>
        Mise en ligne
      </Text>
      <Badge tone={tone} mode="light">
        {status.label}
      </Badge>
    </Stack>
  )

  return run?.html_url ? (
    <Card
      as="a"
      href={run.html_url}
      target="_blank"
      rel="noreferrer"
      padding={3}
      radius={3}
      shadow={1}
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      {content}
    </Card>
  ) : (
    <Card padding={3} radius={3} shadow={1}>
      {content}
    </Card>
  )
}

function ContentRow({row, withBorder}: {row: DashboardRow; withBorder: boolean}) {
  const missing = row.summary.totalCount - row.summary.completeCount
  return (
    <IntentLink
      intent="edit"
      params={{id: row.id, type: row.current._type}}
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      <Card
        padding={3}
        tone="transparent"
        style={{borderBottom: withBorder ? '1px solid var(--card-border-color)' : undefined}}
      >
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2} style={{minWidth: 0}}>
            <Text size={1} weight="semibold" textOverflow="ellipsis">
              {documentTitle(row.current)}
            </Text>
            <Flex align="center" gap={2} wrap="wrap">
              <Text muted size={0}>
                {typeLabels[row.current._type]}
              </Text>
              {row.hasDraft ? (
                <Badge fontSize={0} mode="light" tone="caution">
                  Brouillon
                </Badge>
              ) : row.isPublished ? (
                <Badge fontSize={0} mode="light" tone="positive">
                  Publié
                </Badge>
              ) : (
                <Badge fontSize={0} mode="light">
                  Non publié
                </Badge>
              )}
              {(row.current.publicationStatus === 'preparation' ||
                (!row.current.publicationStatus && row.current.isVisible === false)) && (
                <Badge fontSize={0} mode="light" tone="critical">
                  En préparation
                </Badge>
              )}
              {row.current.publicationStatus === 'archived' && (
                <Badge fontSize={0} mode="light">
                  Archivé
                </Badge>
              )}
              {!row.summary.requiredComplete && (
                <Badge fontSize={0} mode="outline" tone="critical">
                  Contenu incomplet
                </Badge>
              )}
              {row.summary.requiredComplete && !row.summary.recommendedComplete && (
                <Badge fontSize={0} mode="outline" tone="primary">
                  SEO à compléter
                </Badge>
              )}
            </Flex>
          </Stack>
          <Flex align="center" gap={2}>
            <Text muted size={1}>
              {missing} à compléter
            </Text>
            <Text muted size={1}>
              ›
            </Text>
          </Flex>
        </Flex>
      </Card>
    </IntentLink>
  )
}

function RecentRow({row, withBorder}: {row: DashboardRow; withBorder: boolean}) {
  const missing = row.summary.totalCount - row.summary.completeCount
  const photoCount = Array.isArray(row.current.images) ? row.current.images.length : 0
  return (
    <IntentLink
      intent="edit"
      params={{id: row.id, type: row.current._type}}
      style={{color: 'inherit', textDecoration: 'none'}}
    >
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        padding={3}
        wrap="wrap"
        style={{borderBottom: withBorder ? '1px solid var(--card-border-color)' : undefined}}
      >
        <Stack space={2} style={{minWidth: 0, flex: '1 1 420px'}}>
          <Text size={1} weight="semibold" textOverflow="ellipsis">
            {documentTitle(row.current)}
          </Text>
          <Flex align="center" gap={2} wrap="wrap">
            <Text muted size={0}>
              {typeLabels[row.current._type]}
              {row.current._type === 'gallery'
                ? ` · ${photoCount} photo${photoCount > 1 ? 's' : ''}`
                : ''}
              {missing > 0 ? ` · ${missing} à compléter` : ' · Contenu prêt'}
            </Text>
            {row.hasDraft ? (
              <Badge fontSize={0} mode="light" tone="caution">
                Brouillon en cours
              </Badge>
            ) : row.isPublished ? (
              <Badge fontSize={0} mode="light" tone="positive">
                Publié
              </Badge>
            ) : (
              <Badge fontSize={0} mode="light">
                Non publié
              </Badge>
            )}
            {row.current._type === 'gallery' && (
              <Badge
                fontSize={0}
                mode="outline"
                tone={isGalleryOnline(row.current) ? 'positive' : 'default'}
              >
                {isGalleryOnline(row.current) ? 'Sur le site' : 'Hors du site'}
              </Badge>
            )}
          </Flex>
        </Stack>
        <Stack space={2} style={{flex: '0 0 auto', textAlign: 'right'}}>
          <Text muted size={0}>
            Dernière modification
          </Text>
          <Text size={1}>{formatActivityDate(row.lastUpdatedAt)}</Text>
        </Stack>
      </Flex>
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
