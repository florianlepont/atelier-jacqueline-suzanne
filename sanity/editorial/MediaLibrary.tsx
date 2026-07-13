import {useCallback, useEffect, useMemo, useState} from 'react'
import {Badge, Box, Button, Card, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'

interface MediaAsset {
  _id: string
  originalFilename?: string
  sha1hash?: string
  url: string
  usageCount: number
  metadata?: {dimensions?: {width?: number; height?: number}}
}

interface GalleryImage {
  _key?: string
  assetId?: string
  alt?: {fr?: string; en?: string}
}

interface GalleryDocument {
  _id: string
  title?: string
  images?: GalleryImage[]
}

interface MediaPayload {
  assets: MediaAsset[]
  galleries: GalleryDocument[]
}

type SectionKey = 'descriptions' | 'unused' | 'reused'

const mediaQuery = `{
  "assets": *[_type == "sanity.imageAsset"] | order(_createdAt desc) {
    _id, originalFilename, sha1hash, url, metadata{dimensions},
    "usageCount": count(*[references(^._id)])
  },
  "galleries": *[_type == "gallery"] {
    _id, title, images[]{_key, alt, "assetId": asset._ref}
  }
}`

function baseId(id: string) {
  return id.replace(/^drafts\./, '')
}

function filename(asset: MediaAsset) {
  return asset.originalFilename || 'Image sans nom'
}

export function MediaLibrary() {
  const client = useClient({apiVersion: '2025-08-15'})
  const [payload, setPayload] = useState<MediaPayload | null>(null)
  const [activeSection, setActiveSection] = useState<SectionKey>('descriptions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError('')
    client
      .fetch<MediaPayload>(mediaQuery, {}, {perspective: 'raw'})
      .then((result) => {
        setPayload(result)
        setUpdatedAt(new Date())
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : 'Erreur inconnue'),
      )
      .finally(() => setLoading(false))
  }, [client])

  useEffect(() => refresh(), [refresh])

  const report = useMemo(() => {
    if (!payload) return null

    const galleriesById = new Map<string, GalleryDocument>()
    for (const gallery of payload.galleries) {
      const id = baseId(gallery._id)
      const current = galleriesById.get(id)
      if (!current || gallery._id.startsWith('drafts.')) galleriesById.set(id, gallery)
    }
    const galleries = Array.from(galleriesById.entries()).map(([id, gallery]) => ({id, gallery}))

    const missingDescriptions = galleries.flatMap(({id, gallery}) =>
      (gallery.images ?? []).flatMap((image, index) => {
        const missing = [
          !image.alt?.fr?.trim() ? 'FR' : '',
          !image.alt?.en?.trim() ? 'EN' : '',
        ].filter(Boolean)
        return missing.length
          ? [{id, title: gallery.title || 'Collection sans nom', photo: index + 1, missing}]
          : []
      }),
    )

    const galleryUsage = new Map<string, Array<{id: string; title: string}>>()
    for (const {id, gallery} of galleries) {
      for (const image of gallery.images ?? []) {
        if (!image.assetId) continue
        const usages = galleryUsage.get(image.assetId) ?? []
        if (!usages.some((usage) => usage.id === id)) {
          usages.push({id, title: gallery.title || 'Collection sans nom'})
        }
        galleryUsage.set(image.assetId, usages)
      }
    }

    const reusedAssets = payload.assets.flatMap((asset) => {
      const usages = galleryUsage.get(asset._id) ?? []
      return usages.length > 1 ? [{asset, usages}] : []
    })

    const assetsByHash = new Map<string, MediaAsset[]>()
    for (const asset of payload.assets) {
      if (!asset.sha1hash) continue
      assetsByHash.set(asset.sha1hash, [...(assetsByHash.get(asset.sha1hash) ?? []), asset])
    }

    return {
      assets: payload.assets,
      unusedAssets: payload.assets.filter((asset) => asset.usageCount === 0),
      duplicateUploads: Array.from(assetsByHash.values()).filter((assets) => assets.length > 1),
      missingDescriptions,
      reusedAssets,
    }
  }, [payload])

  return (
    <Box padding={[3, 4, 5]} style={{maxWidth: 1080, margin: '0 auto'}}>
      <Stack space={5}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2}>
            <Heading as="h1" size={3}>
              Suivi des images
            </Heading>
            <Text muted size={1}>
              Vue d’ensemble des images et des points à corriger.
            </Text>
          </Stack>
          <Stack space={2} style={{alignItems: 'flex-end'}}>
            <Button
              disabled={loading}
              loading={loading}
              mode="ghost"
              text="Actualiser"
              onClick={refresh}
            />
            {updatedAt && (
              <Text muted size={0}>
                Analysé à{' '}
                {updatedAt.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
              </Text>
            )}
          </Stack>
        </Flex>

        {!payload && loading && (
          <Card padding={5} radius={3} tone="transparent">
            <Flex align="center" justify="center" gap={3}>
              <Spinner muted />
              <Text muted size={1}>
                Analyse des images…
              </Text>
            </Flex>
          </Card>
        )}

        {error && (
          <Card padding={4} radius={3} tone="critical">
            <Text size={1}>Impossible de charger la médiathèque : {error}</Text>
          </Card>
        )}

        {report && (
          <>
            <Grid columns={[2, 2, 4]} gap={3}>
              <Metric label="Images" value={report.assets.length} detail="au total" />
              <Metric
                label="À décrire"
                value={report.missingDescriptions.length}
                detail="photos"
                tone={report.missingDescriptions.length ? 'critical' : 'positive'}
              />
              <Metric
                label="Inutilisées"
                value={report.unusedAssets.length}
                detail="fichiers"
                tone={report.unusedAssets.length ? 'caution' : 'positive'}
              />
              <Metric label="Réutilisées" value={report.reusedAssets.length} detail="images" />
            </Grid>

            <Card padding={2} radius={3} tone="transparent" border>
              <Flex gap={2} wrap="wrap">
                <SectionButton
                  active={activeSection === 'descriptions'}
                  label="Descriptions"
                  count={report.missingDescriptions.length}
                  onClick={() => setActiveSection('descriptions')}
                />
                <SectionButton
                  active={activeSection === 'unused'}
                  label="Inutilisées"
                  count={report.unusedAssets.length}
                  onClick={() => setActiveSection('unused')}
                />
                <SectionButton
                  active={activeSection === 'reused'}
                  label="Réutilisées"
                  count={report.reusedAssets.length}
                  onClick={() => setActiveSection('reused')}
                />
              </Flex>
            </Card>

            {activeSection === 'descriptions' && (
              <DescriptionsSection items={report.missingDescriptions} />
            )}

            {activeSection === 'unused' && <UnusedSection assets={report.unusedAssets} />}

            {activeSection === 'reused' && (
              <ReusedSection
                items={report.reusedAssets}
                duplicateCount={report.duplicateUploads.length}
              />
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}

function Metric({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: number
  detail: string
  tone?: 'default' | 'positive' | 'caution' | 'critical'
}) {
  return (
    <Card padding={3} radius={3} shadow={1} tone={tone}>
      <Stack space={3}>
        <Text muted size={1}>
          {label}
        </Text>
        <Flex align="baseline" gap={2}>
          <Heading size={3}>{value}</Heading>
          <Text muted size={0}>
            {detail}
          </Text>
        </Flex>
      </Stack>
    </Card>
  )
}

function SectionButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <Button
      aria-pressed={active}
      mode={active ? 'default' : 'ghost'}
      text={`${label} · ${count}`}
      onClick={onClick}
    />
  )
}

function SectionHeader({
  title,
  description,
  count,
  tone = 'default',
}: {
  title: string
  description: string
  count: number
  tone?: 'default' | 'positive' | 'caution' | 'critical'
}) {
  return (
    <Flex align="flex-start" justify="space-between" gap={3} wrap="wrap">
      <Stack space={2}>
        <Heading as="h2" size={2}>
          {title}
        </Heading>
        <Text muted size={1}>
          {description}
        </Text>
      </Stack>
      <Badge tone={tone} mode="light">
        {count}
      </Badge>
    </Flex>
  )
}

function DescriptionsSection({
  items,
}: {
  items: Array<{id: string; title: string; photo: number; missing: string[]}>
}) {
  return (
    <Stack space={3}>
      <SectionHeader
        title="Descriptions à compléter"
        description="Ouvrir une collection pour renseigner les langues manquantes."
        count={items.length}
        tone={items.length ? 'caution' : 'positive'}
      />
      {items.length === 0 ? (
        <EmptyState text="Toutes les photos des collections sont décrites." />
      ) : (
        <Card radius={3} border overflow="hidden">
          {items.map((item, index) => (
            <IntentLink
              key={`${item.id}-${item.photo}`}
              intent="edit"
              params={{id: item.id, type: 'gallery'}}
              style={{color: 'inherit', textDecoration: 'none'}}
            >
              <Flex
                align="center"
                justify="space-between"
                gap={3}
                padding={3}
                style={{
                  borderBottom:
                    index < items.length - 1 ? '1px solid var(--card-border-color)' : undefined,
                }}
              >
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    {item.title}
                  </Text>
                  <Flex align="center" gap={2} wrap="wrap">
                    <Text muted size={0}>
                      Photo {item.photo}
                    </Text>
                    {item.missing.map((locale) => (
                      <Badge key={locale} fontSize={0} mode="outline" tone="caution">
                        {locale} manquant
                      </Badge>
                    ))}
                  </Flex>
                </Stack>
                <Text muted size={1}>
                  Ouvrir ›
                </Text>
              </Flex>
            </IntentLink>
          ))}
        </Card>
      )}
    </Stack>
  )
}

function UnusedSection({assets}: {assets: MediaAsset[]}) {
  return (
    <Stack space={3}>
      <SectionHeader
        title="Images inutilisées"
        description="Ces fichiers ne sont référencés par aucun contenu et ne sont jamais supprimés automatiquement."
        count={assets.length}
        tone={assets.length ? 'caution' : 'positive'}
      />
      {assets.length === 0 ? (
        <EmptyState text="Aucune image inutilisée." />
      ) : (
        <>
          <Grid columns={[2, 3, 5]} gap={3}>
            {assets.slice(0, 20).map((asset) => (
              <Card key={asset._id} radius={3} border overflow="hidden" shadow={1}>
                <img
                  src={`${asset.url}?w=360&h=270&fit=crop&auto=format`}
                  alt=""
                  loading="lazy"
                  style={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                  }}
                />
                <Stack padding={3} space={2}>
                  <Text size={0} weight="semibold" textOverflow="ellipsis">
                    {filename(asset)}
                  </Text>
                  <Text muted size={0}>
                    {formatDimensions(asset)}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Grid>
          {assets.length > 20 && (
            <Text muted size={0}>
              20 images affichées sur {assets.length}.
            </Text>
          )}
        </>
      )}
    </Stack>
  )
}

function ReusedSection({
  items,
  duplicateCount,
}: {
  items: Array<{asset: MediaAsset; usages: Array<{id: string; title: string}>}>
  duplicateCount: number
}) {
  return (
    <Stack space={3}>
      <SectionHeader
        title="Images réutilisées"
        description="Une même image est présente dans plusieurs collections. Cela peut être volontaire."
        count={items.length}
      />
      {items.length === 0 ? (
        <EmptyState text="Aucune image n’est utilisée dans plusieurs collections." />
      ) : (
        <Card radius={3} border overflow="hidden">
          {items.map(({asset, usages}, index) => (
            <Flex
              key={asset._id}
              align="center"
              gap={3}
              padding={3}
              style={{
                borderBottom:
                  index < items.length - 1 ? '1px solid var(--card-border-color)' : undefined,
              }}
            >
              <AssetThumbnail asset={asset} />
              <Stack space={2} style={{minWidth: 0}}>
                <Text size={1} weight="semibold" textOverflow="ellipsis">
                  {filename(asset)}
                </Text>
                <Flex align="center" gap={2} wrap="wrap">
                  {usages.map((usage) => (
                    <Badge key={usage.id} fontSize={0} mode="light">
                      {usage.title}
                    </Badge>
                  ))}
                </Flex>
              </Stack>
            </Flex>
          ))}
        </Card>
      )}
      {duplicateCount > 0 && (
        <Card padding={3} radius={3} tone="caution">
          <Text size={1}>
            {duplicateCount} fichier{duplicateCount > 1 ? 's identiques ont' : ' identique a'} été
            envoyé plusieurs fois.
          </Text>
        </Card>
      )}
    </Stack>
  )
}

function EmptyState({text}: {text: string}) {
  return (
    <Card padding={4} radius={3} tone="positive">
      <Flex align="center" gap={2}>
        <Text size={1}>✓</Text>
        <Text size={1}>{text}</Text>
      </Flex>
    </Card>
  )
}

function formatDimensions(asset: MediaAsset) {
  const width = asset.metadata?.dimensions?.width
  const height = asset.metadata?.dimensions?.height
  return width && height ? `${width} × ${height} px` : 'Dimensions inconnues'
}

function AssetThumbnail({asset}: {asset: MediaAsset}) {
  return (
    <img
      src={`${asset.url}?w=144&h=108&fit=crop&auto=format`}
      alt=""
      loading="lazy"
      style={{
        display: 'block',
        width: 72,
        height: 54,
        flex: '0 0 auto',
        borderRadius: 4,
        objectFit: 'cover',
      }}
    />
  )
}
