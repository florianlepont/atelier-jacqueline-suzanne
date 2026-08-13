import {createElement} from 'react'
import type {ComponentType} from 'react'
import {render, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {CreditsManager} from '../CreditsManager'
import {checklistInspector} from '../DocumentChecklist'
import {EditorialDashboard} from '../EditorialDashboard'
import {MediaLibrary} from '../MediaLibrary'
import {openSitePageInspector} from '../OpenSitePage'
import {SeoPreviewInput} from '../SeoPreviewInput'
import {StudioLayout} from '../StudioLayout'
import {resolveBadges} from '../workflow'

const asComponent = (value: unknown) => value as ComponentType<Record<string, unknown>>

describe('Wave 0 TSX mount baseline', () => {
  it('mounts and unmounts every production TSX through its public entry point', async () => {
    const mounted = [
      render(<EditorialDashboard />),
      render(<MediaLibrary />),
      render(createElement(asComponent(CreditsManager))),
      render(
        createElement(asComponent(checklistInspector.component), {
          documentId: 'gallery-1',
          documentType: 'gallery',
          onClose: () => undefined,
        }),
      ),
      render(
        createElement(asComponent(openSitePageInspector.component), {
          documentId: 'gallery-1',
          documentType: 'gallery',
          onClose: () => undefined,
        }),
      ),
      render(
        createElement(asComponent(SeoPreviewInput), {
          id: 'seo',
          value: {},
          renderDefault: () => <div>SEO input</div>,
        }),
      ),
      render(
        createElement(asComponent(StudioLayout), {
          renderDefault: () => <div>Studio</div>,
        }),
      ),
    ]

    const badges = resolveBadges([], {schemaType: 'gallery'} as never)
    mounted.push(
      render(
        createElement(asComponent(badges[0]), {draft: null, published: {_type: 'gallery'}}),
      ),
    )
    expect(
      badges.slice(1).map((Badge) =>
        (Badge as (props: Record<string, unknown>) => unknown)({
          draft: null,
          published: {_type: 'gallery'},
        }),
      ),
    ).toHaveLength(2)

    await waitFor(() => {
      expect(document.body.textContent).toContain('Tableau de bord')
      expect(document.body.textContent).toContain('Médiathèque')
      expect(document.body.textContent).toContain('Crédits et droits')
    })

    for (const view of mounted) view.unmount()
    expect(document.body.textContent).toBe('')
  })
})
