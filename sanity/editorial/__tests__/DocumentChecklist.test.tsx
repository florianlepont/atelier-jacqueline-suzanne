import {createElement} from 'react'
import type {ComponentType} from 'react'
import {fireEvent, render, renderHook, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {checklistInspector} from '../DocumentChecklist'
import {sanityTestState} from '../test/mocks'

const Panel = checklistInspector.component as unknown as ComponentType<{
  documentId: string
  documentType: string
  onClose: () => void
}>

function setEditState(value: Record<string, unknown> | null) {
  sanityTestState.editState = {draft: value, published: null}
}

function renderPanel() {
  return render(
    createElement(Panel, {documentId: 'gallery-1', documentType: 'gallery', onClose: () => undefined}),
  )
}

const completeGallery = {
  _type: 'gallery',
  publicationStatus: 'published',
  title: 'Collection complète',
  slug: {current: 'collection'},
  statement: {fr: 'Texte', en: 'Text'},
  images: [
    {
      asset: {_ref: 'image-1'},
      alt: {fr: 'Alt FR', en: 'Alt EN'},
      rights: {credit: 'Romane', copyrightNotice: '© Romane', usage: 'allRightsReserved'},
    },
  ],
  seo: {
    title: {fr: 'Titre', en: 'Title'},
    description: {fr: 'Description', en: 'Description'},
    image: {asset: {_ref: 'seo-1'}},
  },
}

describe('DocumentChecklist required/recommended states', () => {
  it('shows the count of missing required items when the document is incomplete', () => {
    setEditState({_type: 'gallery'})
    renderPanel()

    expect(screen.getByText(/élément.* obligatoire.* à compléter/)).toBeTruthy()
    expect(screen.getByText('Nom de la collection')).toBeTruthy()
    expect(screen.getByText('0/11')).toBeTruthy()
  })

  it('shows the ready state once every required item is complete', () => {
    setEditState(completeGallery)
    renderPanel()

    expect(screen.getByText('Le contenu obligatoire est prêt.')).toBeTruthy()
    expect(screen.getByText('Tout est prêt pour la publication.')).toBeTruthy()
  })

  it('marks recommended (SEO) items distinctly and keeps them non-blocking', () => {
    setEditState({
      ...completeGallery,
      seo: {title: {}, description: {}, image: {}},
    })
    renderPanel()

    // Required items are all satisfied; only recommended SEO items pend.
    expect(screen.getByText('Le contenu obligatoire est prêt.')).toBeTruthy()
    expect(screen.queryByText('Tout est prêt pour la publication.')).toBeNull()
    expect(screen.getAllByText('Recommandé').length).toBeGreaterThan(0)
  })

  it('toggles the completed section open and closed', () => {
    setEditState(completeGallery)
    renderPanel()

    const toggle = screen.getByRole('button', {name: /élément.* terminé/})
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Nom de la collection')).toBeNull()

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Nom de la collection')).toBeTruthy()

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Nom de la collection')).toBeNull()
  })

  it('reacts to the document being updated: counts and readiness update on rerender', () => {
    setEditState({_type: 'gallery'})
    const view = renderPanel()

    expect(screen.getByText('0/11')).toBeTruthy()

    setEditState(completeGallery)
    view.rerender(
      createElement(Panel, {documentId: 'gallery-1', documentType: 'gallery', onClose: () => undefined}),
    )

    expect(screen.getByText('11/11')).toBeTruthy()
    expect(screen.getByText('Le contenu obligatoire est prêt.')).toBeTruthy()
  })
})

describe('checklistInspector.useMenuItem tone', () => {
  it('is critical when required items are incomplete', () => {
    setEditState({_type: 'gallery'})
    const {result} = renderHook(() =>
      checklistInspector.useMenuItem!({documentId: 'gallery-1', documentType: 'gallery'} as never),
    )
    expect(result.current?.tone).toBe('critical')
  })

  it('is caution when required is complete but recommendations remain', () => {
    setEditState({...completeGallery, seo: {title: {}, description: {}, image: {}}})
    const {result} = renderHook(() =>
      checklistInspector.useMenuItem!({documentId: 'gallery-1', documentType: 'gallery'} as never),
    )
    expect(result.current?.tone).toBe('caution')
  })

  it('is positive when everything, including recommendations, is complete', () => {
    setEditState(completeGallery)
    const {result} = renderHook(() =>
      checklistInspector.useMenuItem!({documentId: 'gallery-1', documentType: 'gallery'} as never),
    )
    expect(result.current?.tone).toBe('positive')
  })
})
