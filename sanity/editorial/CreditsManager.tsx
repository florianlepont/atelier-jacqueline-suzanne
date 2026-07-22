import {useEffect, useMemo, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Grid,
  Heading,
  Label,
  Select,
  Spinner,
  Stack,
  Switch,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {useClient} from 'sanity'
import type {UserComponent} from 'sanity/structure'
import {baseId} from './dashboardLogic'

interface ImageRights {
  credit?: string
  copyrightNotice?: string
  usage?: string
  displayCredit?: boolean
  [key: string]: unknown
}

interface GalleryImage extends Record<string, unknown> {
  _key?: string
  rights?: ImageRights
}

interface GalleryDoc extends Record<string, unknown> {
  _id: string
  _type: string
  title?: string
  images?: GalleryImage[]
}

interface GalleryRow {
  id: string
  hasDraft: boolean
  hasPublished: boolean
  current: GalleryDoc
  images: GalleryImage[]
  incompleteCount: number
}

// No projection: row.current is spread whole into createIfNotExists() below
// to seed a draft for collections that don't have one yet, so it must carry
// every real field (slug, statement, heroColor, publicationStatus, SEO...),
// not just the handful this view happens to display.
const query = `*[_type == "gallery"]`

function isIncomplete(image: GalleryImage) {
  return (
    !image.rights?.credit?.trim() ||
    !image.rights?.copyrightNotice?.trim() ||
    !image.rights?.usage?.trim()
  )
}

export const CreditsManager: UserComponent = () => {
  const client = useClient({apiVersion: '2025-08-15'})
  const toast = useToast()
  const [rows, setRows] = useState<GalleryRow[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)

  const [credit, setCredit] = useState('Romane Lepont')
  const [copyrightNotice, setCopyrightNotice] = useState('© Romane Lepont — Tous droits réservés')
  const [usage, setUsage] = useState('allRightsReserved')
  const [displayCredit, setDisplayCredit] = useState(true)

  useEffect(() => {
    let cancelled = false
    client.fetch<GalleryDoc[]>(query, {}, {perspective: 'raw'}).then((docs) => {
      if (cancelled) return
      const byId = new Map<string, {draft?: GalleryDoc; published?: GalleryDoc}>()
      for (const doc of docs) {
        const id = baseId(doc._id)
        const entry = byId.get(id) ?? {}
        if (doc._id.startsWith('drafts.')) entry.draft = doc
        else entry.published = doc
        byId.set(id, entry)
      }
      const nextRows = Array.from(byId.entries())
        .map(([id, versions]): GalleryRow => {
          const current = versions.draft ?? versions.published!
          const images = Array.isArray(current.images) ? current.images : []
          return {
            id,
            hasDraft: Boolean(versions.draft),
            hasPublished: Boolean(versions.published),
            current,
            images,
            incompleteCount: images.filter(isIncomplete).length,
          }
        })
        .sort((a, b) => (a.current.title || '').localeCompare(b.current.title || ''))
      setRows(nextRows)
      // Default selection: collections with at least one incomplete photo --
      // the ones this tool exists to fix -- without silently touching
      // collections that may already carry deliberately different credits.
      setSelected(new Set(nextRows.filter((row) => row.incompleteCount > 0).map((row) => row.id)))
    })
    return () => {
      cancelled = true
    }
  }, [client])

  const selectedRows = useMemo(
    () => (rows ?? []).filter((row) => selected.has(row.id)),
    [rows, selected],
  )
  const totalPhotos = selectedRows.reduce((sum, row) => sum + row.images.length, 0)

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set((rows ?? []).map((row) => row.id)))
  const selectNone = () => setSelected(new Set())

  const applyToSelected = async () => {
    if (!rows || selectedRows.length === 0) return
    setApplying(true)
    try {
      const tx = client.transaction()
      for (const row of selectedRows) {
        const draftId = `drafts.${row.id}`
        const nextImages = row.images.map((image) => ({
          ...image,
          rights: {...image.rights, credit: credit.trim(), copyrightNotice: copyrightNotice.trim(), usage, displayCredit},
        }))
        // The draft may not exist yet (a published-only collection with no
        // pending edits) -- createIfNotExists seeds it from the current
        // content first so the patch always has something to land on.
        tx.createIfNotExists({...row.current, _id: draftId})
        tx.patch(draftId, {set: {images: nextImages}})
      }
      await tx.commit()
      toast.push({
        status: 'success',
        title: `Crédits mis à jour sur ${selectedRows.length} ${selectedRows.length > 1 ? 'collections' : 'collection'} (${totalPhotos} photos)`,
      })
      setRows((current) =>
        (current ?? []).map((row) =>
          selected.has(row.id)
            ? {
                ...row,
                hasDraft: true,
                images: row.images.map((image) => ({
                  ...image,
                  rights: {...image.rights, credit: credit.trim(), copyrightNotice: copyrightNotice.trim(), usage, displayCredit},
                })),
                incompleteCount: 0,
              }
            : row,
        ),
      )
    } catch (error) {
      toast.push({
        status: 'error',
        title: 'Échec de la mise à jour',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      })
    } finally {
      setApplying(false)
    }
  }

  if (!rows) {
    return (
      <Flex align="center" justify="center" padding={5}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box padding={[3, 4, 5]} style={{maxWidth: 820, margin: '0 auto'}}>
      <Stack space={5}>
        <Stack space={2}>
          <Heading as="h1" size={2}>
            Crédits et droits
          </Heading>
          <Text muted size={1}>
            Appliquer les mêmes informations légales aux photos de plusieurs collections en une
            seule fois.
          </Text>
        </Stack>

        <Card padding={4} radius={3} tone="primary" border>
          <Stack space={4}>
            <Grid columns={[1, 1, 2]} gap={3}>
              <Stack space={2}>
                <Label size={1}>Crédit photographique</Label>
                <TextInput value={credit} onChange={(event) => setCredit(event.currentTarget.value)} />
              </Stack>
              <Stack space={2}>
                <Label size={1}>Mention de copyright</Label>
                <TextInput
                  value={copyrightNotice}
                  onChange={(event) => setCopyrightNotice(event.currentTarget.value)}
                />
              </Stack>
              <Stack space={2}>
                <Label size={1}>Droits d’utilisation</Label>
                <Select value={usage} onChange={(event) => setUsage(event.currentTarget.value)}>
                  <option value="allRightsReserved">Tous droits réservés</option>
                  <option value="editorialOnly">Utilisation éditoriale uniquement</option>
                  <option value="licensed">Licence spécifique</option>
                  <option value="publicDomain">Domaine public</option>
                </Select>
              </Stack>
              <Flex align="center" gap={3} paddingTop={3}>
                <Switch
                  id="bulk-display-credit"
                  checked={displayCredit}
                  onChange={(event) => setDisplayCredit(event.currentTarget.checked)}
                />
                <Label as="label" htmlFor="bulk-display-credit" size={1}>
                  Afficher le crédit sur le site
                </Label>
              </Flex>
            </Grid>
          </Stack>
        </Card>

        <Stack space={3}>
          <Flex align="center" justify="space-between" gap={3}>
            <Heading as="h2" size={1}>
              Collections ({rows.length})
            </Heading>
            <Flex gap={2}>
              <Button mode="bleed" fontSize={1} text="Tout sélectionner" onClick={selectAll} />
              <Button mode="bleed" fontSize={1} text="Tout désélectionner" onClick={selectNone} />
            </Flex>
          </Flex>

          {rows.length === 0 ? (
            <Card padding={4} radius={3} tone="caution">
              <Text size={1}>Aucune collection pour le moment.</Text>
            </Card>
          ) : (
            <Card radius={3} border overflow="hidden">
              {rows.map((row, index) => (
                <Flex
                  key={row.id}
                  as="label"
                  align="center"
                  gap={3}
                  padding={3}
                  style={{
                    cursor: 'pointer',
                    borderBottom: index < rows.length - 1 ? '1px solid var(--card-border-color)' : undefined,
                  }}
                >
                  <Checkbox checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
                  <Stack space={2} style={{flex: 1, minWidth: 0}}>
                    <Text size={1} weight="semibold">
                      {row.current.title || 'Collection sans nom'}
                    </Text>
                    <Text muted size={0}>
                      {row.images.length} photo{row.images.length > 1 ? 's' : ''}
                    </Text>
                  </Stack>
                  <Badge tone={row.images.length === 0 ? 'default' : row.incompleteCount ? 'caution' : 'positive'}>
                    {row.images.length === 0
                      ? 'Aucune photo'
                      : row.incompleteCount
                        ? `${row.incompleteCount} à compléter`
                        : 'Complet'}
                  </Badge>
                </Flex>
              ))}
            </Card>
          )}
        </Stack>

        <Flex justify="flex-end">
          <Button
            disabled={selectedRows.length === 0 || !credit.trim() || !copyrightNotice.trim() || applying}
            tone="primary"
            text={
              applying
                ? 'Application en cours…'
                : `Appliquer à ${selectedRows.length} ${selectedRows.length > 1 ? 'collections' : 'collection'} (${totalPhotos} photos)`
            }
            onClick={applyToSelected}
          />
        </Flex>
      </Stack>
    </Box>
  )
}
