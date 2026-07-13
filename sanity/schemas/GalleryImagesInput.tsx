import {useMemo, useState} from 'react'
import {Button, Card, Flex, Grid, Label, Select, Stack, Switch, Text, TextInput} from '@sanity/ui'
import {PatchEvent, set, type ArrayOfObjectsInputProps} from 'sanity'

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

export function GalleryImagesInput(props: ArrayOfObjectsInputProps) {
  const images = useMemo(() => (props.value ?? []) as GalleryImageValue[], [props.value])
  const [credit, setCredit] = useState('Romane Lepont')
  const [copyrightNotice, setCopyrightNotice] = useState('© Romane Lepont — Tous droits réservés')
  const [usage, setUsage] = useState('allRightsReserved')
  const [displayCredit, setDisplayCredit] = useState(true)

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
    props.onChange(PatchEvent.from(set(nextImages)))
  }

  return (
    <Stack space={4}>
      <Card padding={4} radius={3} tone="primary" border>
        <Stack space={4}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Modifier les crédits de toutes les photos
            </Text>
            <Text muted size={1}>
              Les valeurs ci-dessous remplaceront les crédits et droits des {images.length} photo
              {images.length > 1 ? 's' : ''} de cette collection.
            </Text>
          </Stack>

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
              mode="default"
              tone="primary"
              text={`Appliquer aux ${images.length || 0} photos`}
              onClick={applyToAll}
            />
          </Flex>
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}
