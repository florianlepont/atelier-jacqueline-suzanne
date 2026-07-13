import {useEffect, useMemo, useState} from 'react'
import {Badge, Box, Card, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
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
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .fetch<MediaPayload>(mediaQuery, {}, {perspective: 'raw'})
      .then(setPayload)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : 'Erreur inconnue'),
      )
  }, [client])

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
        <Stack space={2}>
          <Heading as="h1" size={3}>
            Médiathèque
          </Heading>
          <Text muted size={1}>
            Contrôler les images du site et repérer rapidement ce qui demande votre attention.
          </Text>
        </Stack>

        {!payload && !error && (
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
              <Metric label="Images" value={report.assets.length} />
              <Metric label="Inutilisées" value={report.unusedAssets.length} tone="caution" />
              <Metric
                label="Descriptions manquantes"
                value={report.missingDescriptions.length}
                tone="critical"
              />
              <Metric label="Réutilisées" value={report.reusedAssets.length} />
            </Grid>

            <Stack space={3}>
              <Flex align="center" justify="space-between">
                <Heading as="h2" size={2}>
                  Descriptions à compléter
                </Heading>
                <Badge tone={report.missingDescriptions.length ? 'caution' : 'positive'}>
                  {report.missingDescriptions.length || 'Tout est prêt'}
                </Badge>
              </Flex>
              {report.missingDescriptions.length === 0 ? (
                <Card padding={4} radius={3} tone="positive">
                  <Text size={1}>Toutes les photos des collections sont décrites.</Text>
                </Card>
              ) : (
                <Card radius={3} border overflow="hidden">
                  {report.missingDescriptions.map((item, index) => (
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
                            index < report.missingDescriptions.length - 1
                              ? '1px solid var(--card-border-color)'
                              : undefined,
                        }}
                      >
                        <Stack space={2}>
                          <Text size={1} weight="semibold">
                            {item.title} · Photo {item.photo}
                          </Text>
                          <Text muted size={0}>
                            Langue manquante : {item.missing.join(' + ')}
                          </Text>
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

            <AssetSection
              title="Images inutilisées"
              description="Ces fichiers ne sont référencés par aucun contenu. Ils ne sont pas supprimés automatiquement."
              assets={report.unusedAssets}
              emptyMessage="Aucune image inutilisée."
            />

            <Stack space={3}>
              <Heading as="h2" size={2}>
                Images présentes dans plusieurs collections
              </Heading>
              {report.reusedAssets.length === 0 ? (
                <Card padding={4} radius={3} tone="transparent" border>
                  <Text muted size={1}>
                    Aucune image n’est utilisée dans plusieurs collections.
                  </Text>
                </Card>
              ) : (
                <Card radius={3} border overflow="hidden">
                  {report.reusedAssets.map(({asset, usages}, index) => (
                    <Flex
                      key={asset._id}
                      align="center"
                      gap={3}
                      padding={3}
                      style={{
                        borderBottom:
                          index < report.reusedAssets.length - 1
                            ? '1px solid var(--card-border-color)'
                            : undefined,
                      }}
                    >
                      <AssetThumbnail asset={asset} />
                      <Stack space={2}>
                        <Text size={1} weight="semibold">
                          {filename(asset)}
                        </Text>
                        <Text muted size={0}>
                          {usages.map((usage) => usage.title).join(' · ')}
                        </Text>
                      </Stack>
                    </Flex>
                  ))}
                </Card>
              )}
            </Stack>

            {report.duplicateUploads.length > 0 && (
              <Card padding={4} radius={3} tone="caution">
                <Text size={1}>
                  {report.duplicateUploads.length} fichier
                  {report.duplicateUploads.length > 1 ? 's identiques ont' : ' identique a'} été
                  envoyé plusieurs fois.
                </Text>
              </Card>
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
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'caution' | 'critical'
}) {
  return (
    <Card padding={3} radius={3} shadow={1} tone={tone}>
      <Stack space={3}>
        <Text muted size={1}>
          {label}
        </Text>
        <Heading size={3}>{value}</Heading>
      </Stack>
    </Card>
  )
}

function AssetSection({
  title,
  description,
  assets,
  emptyMessage,
}: {
  title: string
  description: string
  assets: MediaAsset[]
  emptyMessage: string
}) {
  return (
    <Stack space={3}>
      <Stack space={2}>
        <Heading as="h2" size={2}>
          {title}
        </Heading>
        <Text muted size={1}>
          {description}
        </Text>
      </Stack>
      {assets.length === 0 ? (
        <Card padding={4} radius={3} tone="positive">
          <Text size={1}>{emptyMessage}</Text>
        </Card>
      ) : (
        <Grid columns={[2, 3, 4]} gap={3}>
          {assets.slice(0, 16).map((asset) => (
            <Card key={asset._id} radius={3} border overflow="hidden">
              <img
                src={`${asset.url}?w=360&h=240&fit=crop&auto=format`}
                alt=""
                loading="lazy"
                style={{display: 'block', width: '100%', aspectRatio: '3 / 2', objectFit: 'cover'}}
              />
              <Box padding={3}>
                <Text size={0} textOverflow="ellipsis">
                  {filename(asset)}
                </Text>
              </Box>
            </Card>
          ))}
        </Grid>
      )}
      {assets.length > 16 && (
        <Text muted size={0}>
          16 images affichées sur {assets.length}.
        </Text>
      )}
    </Stack>
  )
}

function AssetThumbnail({asset}: {asset: MediaAsset}) {
  return (
    <img
      src={`${asset.url}?w=96&h=72&fit=crop&auto=format`}
      alt=""
      loading="lazy"
      style={{display: 'block', width: 64, height: 48, flex: '0 0 auto', objectFit: 'cover'}}
    />
  )
}
