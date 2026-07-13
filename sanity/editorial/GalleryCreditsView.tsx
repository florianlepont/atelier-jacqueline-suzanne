import {useMemo, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Label,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {PatchEvent, set} from 'sanity'
import {useDocumentPane, type UserViewComponent} from 'sanity/structure'

interface ImageRights {
  credit?: string
  copyrightNotice?: string
  usage?: string
  displayCredit?: boolean
  [key: string]: unknown
}

interface GalleryImageValue extends Record<string, unknown> {
  rights?: ImageRights
}

export const GalleryCreditsView: UserViewComponent = ({document}) => {
  const {onChange} = useDocumentPane()
  const toast = useToast()
  const images = useMemo(
    () =>
      (Array.isArray(document.displayed.images)
        ? document.displayed.images
        : []) as GalleryImageValue[],
    [document.displayed.images],
  )
  const firstRights = images[0]?.rights
  const [credit, setCredit] = useState(firstRights?.credit ?? 'Romane Lepont')
  const [copyrightNotice, setCopyrightNotice] = useState(
    firstRights?.copyrightNotice ?? '© Romane Lepont — Tous droits réservés',
  )
  const [usage, setUsage] = useState(firstRights?.usage ?? 'allRightsReserved')
  const [displayCredit, setDisplayCredit] = useState(firstRights?.displayCredit !== false)

  const incompleteCount = images.filter(
    (image) =>
      !image.rights?.credit?.trim() ||
      !image.rights?.copyrightNotice?.trim() ||
      !image.rights?.usage?.trim(),
  ).length

  const applyToAll = () => {
    const nextImages = images.map((image) => ({
      ...image,
      rights: {
        ...image.rights,
        credit: credit.trim(),
        copyrightNotice: copyrightNotice.trim(),
        usage,
        displayCredit,
      },
    }))
    onChange(PatchEvent.from(set(nextImages, ['images'])))
    toast.push({status: 'success', title: `Crédits mis à jour sur ${images.length} photos`})
  }

  return (
    <Box padding={[3, 4, 5]} style={{maxWidth: 820, margin: '0 auto'}}>
      <Stack space={5}>
        <Stack space={2}>
          <Flex align="center" justify="space-between" gap={3}>
            <Heading as="h1" size={2}>
              Crédits et droits
            </Heading>
            <Badge tone={incompleteCount ? 'caution' : 'positive'} mode="light">
              {incompleteCount ? `${incompleteCount} à compléter` : 'Tout est renseigné'}
            </Badge>
          </Flex>
          <Text muted size={1}>
            Modifier les informations légales de toutes les photos en une seule fois.
          </Text>
        </Stack>

        <Card padding={4} radius={3} tone="primary" border>
          <Stack space={4}>
            <Grid columns={[1, 1, 2]} gap={3}>
              <Stack space={2}>
                <Label size={1}>Crédit photographique</Label>
                <TextInput
                  value={credit}
                  onChange={(event) => setCredit(event.currentTarget.value)}
                />
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
                <Label htmlFor="bulk-display-credit" size={1}>
                  Afficher le crédit sur le site
                </Label>
              </Flex>
            </Grid>

            <Flex justify="flex-end">
              <Button
                disabled={images.length === 0 || !credit.trim() || !copyrightNotice.trim()}
                tone="primary"
                text={`Appliquer aux ${images.length} photos`}
                onClick={applyToAll}
              />
            </Flex>
          </Stack>
        </Card>

        <Stack space={3}>
          <Heading as="h2" size={1}>
            État des photos
          </Heading>
          {images.length === 0 ? (
            <Card padding={4} radius={3} tone="caution">
              <Text size={1}>Ajoutez d’abord des photos dans l’onglet Édition.</Text>
            </Card>
          ) : (
            <Card radius={3} border overflow="hidden">
              {images.map((image, index) => {
                const complete = Boolean(
                  image.rights?.credit?.trim() &&
                  image.rights?.copyrightNotice?.trim() &&
                  image.rights?.usage?.trim(),
                )
                return (
                  <Flex
                    key={String(image._key ?? index)}
                    align="center"
                    justify="space-between"
                    gap={3}
                    padding={3}
                    style={{
                      borderBottom:
                        index < images.length - 1
                          ? '1px solid var(--card-border-color)'
                          : undefined,
                    }}
                  >
                    <Stack space={2}>
                      <Text size={1} weight="semibold">
                        Photo {index + 1}
                      </Text>
                      <Text muted size={0}>
                        {image.rights?.credit || 'Crédit non renseigné'}
                      </Text>
                    </Stack>
                    <Badge tone={complete ? 'positive' : 'caution'} mode="light">
                      {complete ? 'Complet' : 'À compléter'}
                    </Badge>
                  </Flex>
                )
              })}
            </Card>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
