import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useFormValue, type StringInputProps} from 'sanity'
import {SITE_PREVIEW_URL} from '../editorial/deployment'

function pageUrl(locale: 'fr' | 'en', slug: string) {
  const base = SITE_PREVIEW_URL.endsWith('/') ? SITE_PREVIEW_URL : `${SITE_PREVIEW_URL}/`
  return `${base}${locale === 'en' ? 'en/' : ''}galleries/${slug}/`
}

export function PublishedPageLinks(_props: StringInputProps) {
  const slug = useFormValue(['slug', 'current'])
  const status = useFormValue(['publicationStatus'])
  const legacyVisible = useFormValue(['isVisible'])
  const isOnline = status ? status === 'published' : legacyVisible !== false

  if (typeof slug !== 'string' || !slug) {
    return (
      <Card padding={3} radius={2} tone="caution">
        <Text size={1}>Générez d’abord l’adresse de la page pour obtenir ses liens.</Text>
      </Card>
    )
  }

  return (
    <Card padding={3} radius={2} tone={isOnline ? 'transparent' : 'caution'} border>
      <Stack space={3}>
        <Text muted size={1}>
          {isOnline
            ? 'Ouvrir directement la page publiée.'
            : 'Ces liens seront disponibles publiquement lorsque le statut sera « Publiée ».'}
        </Text>
        <Flex gap={2} wrap="wrap">
          <Button
            as="a"
            href={pageUrl('fr', slug)}
            target="_blank"
            rel="noreferrer"
            mode="ghost"
            text="Ouvrir en français ↗"
          />
          <Button
            as="a"
            href={pageUrl('en', slug)}
            target="_blank"
            rel="noreferrer"
            mode="ghost"
            text="Ouvrir en anglais ↗"
          />
        </Flex>
      </Stack>
    </Card>
  )
}
