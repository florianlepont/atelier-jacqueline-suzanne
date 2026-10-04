import {createElement} from 'react'
import type {ComponentType} from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {openSitePageInspector} from '../OpenSitePage'
import {SeoPreviewInput} from '../SeoPreviewInput'
import {StudioLayout} from '../StudioLayout'
import {resolveActions, resolveBadges} from '../workflow'
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
    render(
      createElement(OpenSitePanel, {documentId: 'homePage', documentType: 'homePage', onClose}),
    )

    const link = screen.getByRole('link', {name: /Ouvrir la page du site/}) as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('https://atelierjacquelinesuzanne.fr/')
    fireEvent.click(link)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('builds a gallery URL from its slug', () => {
    sanityTestState.editState = {
      draft: {_type: 'gallery', slug: {current: 'paysages'}},
      published: null,
    }
    render(
      createElement(OpenSitePanel, {
        documentId: 'gallery-1',
        documentType: 'gallery',
        onClose: () => undefined,
      }),
    )

    const link = screen.getByRole('link', {name: /Ouvrir la page du site/}) as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe(
      'https://atelierjacquelinesuzanne.fr/galleries/paysages/',
    )
  })

  it('falls back to explanatory text when there is no public route yet', () => {
    sanityTestState.editState = {draft: {_type: 'gallery'}, published: null}
    render(
      createElement(OpenSitePanel, {
        documentId: 'gallery-1',
        documentType: 'gallery',
        onClose: () => undefined,
      }),
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
  it('prepends exactly the collection status badge for a gallery', () => {
    const prev: unknown[] = [() => null]
    const badges = resolveBadges(prev as never, {schemaType: 'gallery'} as never)
    expect(badges).toHaveLength(2)
    expect(badges[1]).toBe(prev[0])
  })

  it('leaves the badge list untouched for any other type', () => {
    const prev: unknown[] = [() => null]
    expect(resolveBadges(prev as never, {schemaType: 'homePage'} as never)).toBe(prev)
    expect(resolveBadges(prev as never, {schemaType: 'edition'} as never)).toBe(prev)
  })
})

describe('CollectionStatusBadge (workflow badges[0])', () => {
  function invoke(props: {draft?: unknown; published?: unknown}) {
    const badges = resolveBadges([] as never, {schemaType: 'gallery'} as never)
    const Badge = badges[0] as unknown as (p: typeof props) => unknown
    return Badge(props)
  }

  it('flags a collection that was never published', () => {
    expect(invoke({draft: {_type: 'gallery', title: 'x'}, published: null})).toMatchObject({
      label: 'Jamais publiée',
      color: 'warning',
    })
  })

  it('flags unpublished edits on an already-online collection', () => {
    expect(
      invoke({
        draft: {_type: 'gallery', title: 'x'},
        published: {_type: 'gallery', title: 'x'},
      }),
    ).toMatchObject({label: 'Modifications non publiées', color: 'primary'})
  })

  it('returns null for a non-gallery type', () => {
    expect(invoke({draft: null, published: {_type: 'homePage'}})).toBeNull()
  })
})

describe('resolveActions', () => {
  it('keeps Sanity native actions untouched for a gallery, publish and unpublish included', () => {
    const actions = [{action: 'publish'}, {action: 'unpublish'}, {action: 'delete'}]
    const result = resolveActions(actions as never, {schemaType: 'gallery'} as never)
    expect(result).toBe(actions)
  })

  it('keeps publish but strips unpublish, delete and duplicate for a singleton page', () => {
    const actions = [
      {action: 'publish'},
      {action: 'discardChanges'},
      {action: 'restore'},
      {action: 'unpublish'},
      {action: 'delete'},
      {action: 'duplicate'},
    ]
    const result = resolveActions(actions as never, {schemaType: 'siteSettings'} as never)
    expect(result).toEqual([{action: 'publish'}, {action: 'discardChanges'}, {action: 'restore'}])
  })

  it('leaves actions untouched for a schema type outside the editorial workflow', () => {
    const actions = [{action: 'publish'}, {action: 'customThing'}]
    const result = resolveActions(actions as never, {schemaType: 'someOtherType'} as never)
    expect(result).toBe(actions)
  })
})
