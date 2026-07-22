import {Box, Button, Stack, Text} from '@sanity/ui'
import {useEditState} from 'sanity'
import type {DocumentInspector, DocumentInspectorComponent} from 'sanity'
import {LaunchIcon} from '@sanity/icons'
import {SITE_PREVIEW_URL} from './deployment'

type UnknownRecord = Record<string, unknown>

// The one real route each schema type actually has on the live site (see
// src/pages/). siteSettings has no page of its own; exhibition isn't built
// into the public site yet (v1.x) -- both return undefined, which hides the
// toolbar icon entirely via useMenuItem's `hidden`.
function publicPagePath(documentType: string, value: UnknownRecord): string | undefined {
  if (documentType === 'homePage') return '/'
  if (documentType === 'aboutPage') return '/about/'
  if (documentType === 'contactPage') return '/contact/'
  if (documentType === 'gallery') {
    const slug = (value.slug as {current?: string} | undefined)?.current
    return slug ? `/galleries/${slug}/` : undefined
  }
  return undefined
}

function siteUrl(path: string) {
  const base = SITE_PREVIEW_URL.endsWith('/') ? SITE_PREVIEW_URL.slice(0, -1) : SITE_PREVIEW_URL
  return `${base}${path}`
}

const OpenSitePagePanel: DocumentInspectorComponent = ({documentId, documentType, onClose}) => {
  const {draft, published} = useEditState(documentId, documentType)
  const value = (draft ?? published ?? {}) as UnknownRecord
  const path = publicPagePath(documentType, value)

  return (
    <Box padding={4} style={{maxWidth: 320}}>
      <Stack space={3}>
        {path ? (
          <Button
            as="a"
            href={siteUrl(path)}
            target="_blank"
            rel="noreferrer"
            tone="primary"
            text="Ouvrir la page du site ↗"
            onClick={onClose}
          />
        ) : (
          <Text muted size={1}>
            Générez d’abord l’adresse de la page pour obtenir son lien.
          </Text>
        )}
      </Stack>
    </Box>
  )
}

export const openSitePageInspector: DocumentInspector = {
  name: 'open-site-page',
  component: OpenSitePagePanel,
  useMenuItem({documentId, documentType}) {
    const {draft, published} = useEditState(documentId, documentType)
    const value = (draft ?? published ?? {}) as UnknownRecord
    const path = publicPagePath(documentType, value)
    return {
      title: 'Voir sur le site',
      icon: LaunchIcon,
      showAsAction: true,
      hidden: !path,
    }
  },
}
