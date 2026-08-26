import {createElement} from 'react'
import type {ComponentType} from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {openSitePageInspector} from '../OpenSitePage'
import {SeoPreviewInput} from '../SeoPreviewInput'
import {StudioLayout} from '../StudioLayout'
import {
  resolveActions,
  resolveBadges,
} from '../workflow'
import {sanityTestState} from '../test/mocks'

// ---------------------------------------------------------------------------
// OpenSitePage
// ---------------------------------------------------------------------------

const OpenSitePanel = openSitePageInspector.component as unknown as ComponentType<{
  documentId: string
  documentType: string
  onClose: () => void
}>

describe('OpenSitePage', () => {
  it('links to the public route for a page type that has one, and closes on click', () => {
    sanityTestState.editState = {draft: null, published: {_type: 'homePage'}}
    const onClose = vi.fn()
    render(createElement(OpenSitePanel, {documentId: 'homePage', documentType: 'homePage', onClose}))

    const link = screen.getByRole('link', {name: /Ouvrir la page du site/}) as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('https://florianlepont.github.io/atelier-jacqueline-suzanne/')
    fireEvent.click(link)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('builds a gallery URL from its slug', () => {
    sanityTestState.editState = {
      draft: {_type: 'gallery', slug: {current: 'paysages'}},
      published: null,
    }
    render(
      createElement(OpenSitePanel, {documentId: 'gallery-1', documentType: 'gallery', onClose: () => undefined}),
    )

    const link = screen.getByRole('link', {name: /Ouvrir la page du site/}) as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe(
      'https://florianlepont.github.io/atelier-jacqueline-suzanne/galleries/paysages/',
    )
  })

  it('falls back to explanatory text when there is no public route yet', () => {
    sanityTestState.editState = {draft: {_type: 'gallery'}, published: null}
    render(
      createElement(OpenSitePanel, {documentId: 'gallery-1', documentType: 'gallery', onClose: () => undefined}),
    )
    expect(screen.getByText(/Générez d’abord l’adresse de la page/)).toBeTruthy()
    expect(screen.queryByRole('link', {name: /Ouvrir la page du site/})).toBeNull()
  })

  it('useMenuItem hides the toolbar action when there is no path, and shows it when there is', () => {
    sanityTestState.editState = {draft: null, published: {_type: 'siteSettings'}}
    const hidden = openSitePageInspector.useMenuItem!({
      documentId: 'siteSettings',
      documentType: 'siteSettings',
    } as never)
    expect(hidden.hidden).toBe(true)

    sanityTestState.editState = {draft: null, published: {_type: 'aboutPage'}}
    const visible = openSitePageInspector.useMenuItem!({
      documentId: 'aboutPage',
      documentType: 'aboutPage',
    } as never)
    expect(visible.hidden).toBe(false)
    expect(visible.title).toBe('Voir sur le site')
  })
})

// ---------------------------------------------------------------------------
// SeoPreviewInput
// ---------------------------------------------------------------------------

describe('SeoPreviewInput', () => {
  function renderInput(value: Record<string, unknown>) {
    const renderDefault = vi.fn(() => createElement('div', null, 'Champ SEO natif'))
    const view = render(
      createElement(SeoPreviewInput, {
        id: 'seo',
        value,
        renderDefault,
      } as never),
    )
    return {view, renderDefault}
  }

  it('renders the native field via renderDefault and a FR preview by default', () => {
    const {renderDefault} = renderInput({
      title: {fr: 'Titre FR', en: 'Title EN'},
      description: {fr: 'Description FR', en: 'Description EN'},
    })
    expect(renderDefault).toHaveBeenCalledOnce()
    expect(screen.getByText('Champ SEO natif')).toBeTruthy()
    expect(screen.getByText('Titre FR')).toBeTruthy()
    expect(screen.getByText('Description FR')).toBeTruthy()
  })

  it('switches the preview to English when the EN toggle is pressed', () => {
    renderInput({
      title: {fr: 'Titre FR', en: 'Title EN'},
      description: {fr: 'Description FR', en: 'Description EN'},
    })

    fireEvent.click(screen.getByRole('button', {name: 'EN'}))

    expect(screen.getByText('Title EN')).toBeTruthy()
    expect(screen.queryByText('Titre FR')).toBeNull()
  })

  it('falls back to placeholder copy when the localized text is empty', () => {
    renderInput({title: {}, description: {}})
    expect(screen.getByText('Titre de la page — Atelier Jacqueline Suzanne')).toBeTruthy()
    expect(screen.getByText('La description de cette page apparaîtra ici.')).toBeTruthy()
    expect(screen.getByText('Titre : 0/60 · Description : 0/160')).toBeTruthy()
  })

  it('shows the noIndex warning only when the document opts out of indexing', () => {
    const {view} = renderInput({title: {}, description: {}, noIndex: true})
    expect(screen.getByText(/ne pas l’indexer/)).toBeTruthy()

    view.rerender(
      createElement(SeoPreviewInput, {
        id: 'seo',
        value: {title: {}, description: {}, noIndex: false},
        renderDefault: () => createElement('div', null, 'Champ SEO natif'),
      } as never),
    )
    expect(screen.queryByText(/ne pas l’indexer/)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// StudioLayout
// ---------------------------------------------------------------------------

describe('StudioLayout', () => {
  it('delegates rendering to renderDefault with the same props', () => {
    const renderDefault = vi.fn((props: Record<string, unknown>) =>
      createElement('div', null, `rendered:${String(props.tone)}`),
    )
    render(createElement(StudioLayout, {renderDefault, tone: 'default'} as never))

    expect(renderDefault).toHaveBeenCalledOnce()
    expect(renderDefault.mock.calls[0][0]).toMatchObject({tone: 'default'})
    expect(screen.getByText('rendered:default')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// workflow.tsx: badges and action resolver
// ---------------------------------------------------------------------------

describe('resolveBadges', () => {
  it('prepends the editorial badges for checklist-enabled types', () => {
    const prev: unknown[] = [() => null]
    const badges = resolveBadges(prev as never, {schemaType: 'gallery'} as never)
    expect(badges).toHaveLength(4)
    expect(badges[3]).toBe(prev[0])
  })

  it('leaves the badge list untouched for a type without a checklist', () => {
    const prev: unknown[] = [() => null]
    const badges = resolveBadges(prev as never, {schemaType: 'siteDeployment'} as never)
    expect(badges).toBe(prev)
  })
})

describe('AutoOpenChecklistBadge (workflow badge[0])', () => {
  function AutoOpenBadge(props: {draft?: unknown; published?: unknown}) {
    const badges = resolveBadges([] as never, {schemaType: 'gallery'} as never)
    const Badge = badges[0] as unknown as ComponentType<{draft?: unknown; published?: unknown}>
    return createElement(Badge, props)
  }

  it('opens the checklist automatically once for an incomplete document, and never twice for the same document', () => {
    sanityTestState.documentPane = {
      documentId: 'gallery-1',
      documentType: 'gallery',
      ready: true,
      inspector: null,
      openInspector: vi.fn(),
    }
    const view = render(createElement(AutoOpenBadge, {draft: null, published: {_type: 'gallery'}}))
    expect(sanityTestState.documentPane.openInspector).toHaveBeenCalledWith('checklist')
    expect(sanityTestState.documentPane.openInspector).toHaveBeenCalledOnce()

    // Re-render with new document content but the SAME documentId: the
    // "decide once per document" guard must not reopen it (e.g. after a
    // manual close).
    view.rerender(createElement(AutoOpenBadge, {draft: {_type: 'gallery', title: 'x'}, published: null}))
    expect(sanityTestState.documentPane.openInspector).toHaveBeenCalledOnce()
  })

  it('does not auto-open when the document is already complete', () => {
    sanityTestState.documentPane = {
      documentId: 'gallery-2',
      documentType: 'gallery',
      ready: true,
      inspector: null,
      openInspector: vi.fn(),
    }
    render(
      createElement(AutoOpenBadge, {
        draft: null,
        published: {
          _type: 'gallery',
          publicationStatus: 'published',
          title: 'Complète',
          slug: {current: 'complete'},
          statement: {fr: 'a', en: 'b'},
          images: [
            {
              asset: {_ref: 'i'},
              alt: {fr: 'a', en: 'b'},
              rights: {credit: 'c', copyrightNotice: 'd', usage: 'e'},
            },
          ],
        },
      }),
    )
    expect(sanityTestState.documentPane.openInspector).not.toHaveBeenCalled()
  })

  it('does not auto-open while another inspector is already open', () => {
    sanityTestState.documentPane = {
      documentId: 'gallery-3',
      documentType: 'gallery',
      ready: true,
      inspector: {name: 'comments'},
      openInspector: vi.fn(),
    }
    render(createElement(AutoOpenBadge, {draft: null, published: {_type: 'gallery'}}))
    expect(sanityTestState.documentPane.openInspector).not.toHaveBeenCalled()
  })

  it('waits until the document pane is ready before deciding', () => {
    sanityTestState.documentPane = {
      documentId: 'gallery-4',
      documentType: 'gallery',
      ready: false,
      inspector: null,
      openInspector: vi.fn(),
    }
    render(createElement(AutoOpenBadge, {draft: null, published: {_type: 'gallery'}}))
    expect(sanityTestState.documentPane.openInspector).not.toHaveBeenCalled()
  })
})

describe('CompletenessBadge and CollectionStatusBadge (workflow badges[1], badges[2])', () => {
  function invoke(index: 1 | 2, props: {draft?: unknown; published?: unknown}) {
    const badges = resolveBadges([] as never, {schemaType: 'gallery'} as never)
    const Badge = badges[index] as unknown as (p: typeof props) => unknown
    return Badge(props)
  }

  it('flags missing required content', () => {
    expect(invoke(1, {draft: null, published: {_type: 'gallery'}})).toMatchObject({
      label: 'À compléter',
      color: 'warning',
    })
  })

  it('flags missing recommended (SEO) content once required content is complete', () => {
    expect(
      invoke(1, {
        draft: null,
        published: {
          _type: 'gallery',
          publicationStatus: 'published',
          title: 'Complète',
          slug: {current: 'complete'},
          statement: {fr: 'a', en: 'b'},
          images: [
            {
              asset: {_ref: 'i'},
              alt: {fr: 'a', en: 'b'},
              rights: {credit: 'c', copyrightNotice: 'd', usage: 'e'},
            },
          ],
        },
      }),
    ).toMatchObject({label: 'SEO à compléter', color: 'primary'})
  })

  it('flags a collection that was never published', () => {
    expect(
      invoke(2, {draft: {_type: 'gallery', title: 'x'}, published: null}),
    ).toMatchObject({label: 'Jamais publiée', color: 'warning'})
  })

  it('flags unpublished edits on an already-online collection', () => {
    expect(
      invoke(2, {
        draft: {_type: 'gallery', title: 'x'},
        published: {_type: 'gallery', title: 'x'},
      }),
    ).toMatchObject({label: 'Modifications non publiées', color: 'primary'})
  })

  it('returns null for a non-gallery type', () => {
    expect(invoke(2, {draft: null, published: {_type: 'homePage'}})).toBeNull()
  })
})

describe('resolveActions', () => {
  it('strips publish/unpublish for a public site document type', () => {
    const actions = [{action: 'publish'}, {action: 'unpublish'}, {action: 'delete'}]
    const result = resolveActions(actions as never, {schemaType: 'gallery'} as never)
    expect(result).toEqual([{action: 'delete'}])
  })

  it('leaves actions untouched for a schema type outside the editorial workflow', () => {
    const actions = [{action: 'publish'}, {action: 'customThing'}]
    const result = resolveActions(actions as never, {schemaType: 'someOtherType'} as never)
    expect(result).toBe(actions)
  })
})
