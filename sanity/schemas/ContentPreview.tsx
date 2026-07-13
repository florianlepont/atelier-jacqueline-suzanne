import {useState} from 'react'
import {useDataset, useProjectId} from 'sanity'
import type {UserViewComponent} from 'sanity/structure'
import {HERO_COLOR_OPTIONS} from './HeroColorInput'

type Locale = 'fr' | 'en'
type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function localized(value: unknown, locale: Locale): string {
  const text = record(value)[locale]
  return typeof text === 'string' ? text : ''
}

function imageUrl(value: unknown, projectId: string, dataset: string): string | undefined {
  const ref = record(record(value).asset)._ref
  if (typeof ref !== 'string' || !ref.startsWith('image-')) return undefined
  const parts = ref.split('-')
  if (parts.length < 4) return undefined
  const extension = parts.pop()
  const dimensions = parts.pop()
  const id = parts.slice(1).join('-')
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${extension}?w=1200&auto=format`
}

const shellStyle = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 24,
  fontFamily: 'Arial, sans-serif',
} as const

export const ContentPreview: UserViewComponent = ({document, schemaType}) => {
  const [locale, setLocale] = useState<Locale>('fr')
  const projectId = useProjectId()
  const dataset = useDataset()
  const value = document.displayed as UnknownRecord

  const localePicker = (
    <div style={{display: 'flex', gap: 8, marginBottom: 20}}>
      {(['fr', 'en'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          aria-pressed={locale === item}
          style={{
            border: '1px solid #1A1A1A',
            background: locale === item ? '#1A1A1A' : '#FFFFFF',
            color: locale === item ? '#FFFFFF' : '#1A1A1A',
            cursor: 'pointer',
            padding: '8px 14px',
          }}
        >
          {item.toUpperCase()}
        </button>
      ))}
      <span style={{alignSelf: 'center', color: '#666', fontSize: 13}}>
        Aperçu du brouillon en cours
      </span>
    </div>
  )

  if (schemaType.name === 'gallery') {
    const images = Array.isArray(value.images) ? value.images : []
    const cover = imageUrl(images[0], projectId, dataset)
    const colorKey = typeof value.heroColor === 'string' ? value.heroColor : ''
    const color = HERO_COLOR_OPTIONS.find((option) => option.value === colorKey)
    const title = typeof value.title === 'string' ? value.title : 'Collection sans nom'
    const statement = localized(value.statement, locale)

    return (
      <div style={shellStyle}>
        {localePicker}
        {value.isVisible === false && (
          <p style={{background: '#FFF1C7', padding: 12}}>
            Cette collection est actuellement masquée du site.
          </p>
        )}
        <div style={{background: '#1A1A1A', color: '#FFFFFF', overflow: 'hidden'}}>
          {cover ? (
            <img
              src={cover}
              alt=""
              style={{display: 'block', width: '100%', height: 420, objectFit: 'cover'}}
            />
          ) : (
            <div style={{display: 'grid', height: 260, placeItems: 'center', color: '#CCCCCC'}}>
              Ajouter une photo de couverture
            </div>
          )}
          <div style={{padding: 24}}>
            <h1 style={{fontSize: 38, margin: 0}}>{title}</h1>
            <p style={{lineHeight: 1.6, marginBottom: 0}}>
              {statement || 'Ajouter le texte de présentation dans cette langue.'}
            </p>
          </div>
        </div>
        <div
          style={{
            background: color?.hex ?? '#FF3B94',
            color: color?.text ?? '#1A1A1A',
            marginTop: 16,
            padding: 20,
          }}
        >
          Couleur du panneau d’accueil : <strong>{color?.title ?? 'Palette automatique'}</strong>
        </div>
        <p style={{color: '#666', fontSize: 13}}>
          {images.length} photo{images.length > 1 ? 's' : ''}
        </p>
      </div>
    )
  }

  if (schemaType.name === 'aboutPage') {
    return (
      <div style={shellStyle}>
        {localePicker}
        <article style={{border: '1px solid #E3E1DE', padding: 32}}>
          <h1 style={{fontSize: 38, marginTop: 0}}>{locale === 'fr' ? 'À propos' : 'About'}</h1>
          <p style={{lineHeight: 1.6}}>
            {localized(value.biography, locale) || 'Ajouter la biographie.'}
          </p>
          <h2>{locale === 'fr' ? 'Atelier & pratique' : 'Studio & practice'}</h2>
          <p style={{lineHeight: 1.6}}>
            {localized(value.practice, locale) || 'Ajouter le texte sur la pratique.'}
          </p>
          <p style={{lineHeight: 1.6}}>
            {localized(value.medium, locale) || 'Ajouter le texte sur le médium et la technique.'}
          </p>
        </article>
      </div>
    )
  }

  const intro = localized(value.intro, locale)
  return (
    <div style={shellStyle}>
      {localePicker}
      <div style={{background: '#FF3B94', color: '#1A1A1A', padding: 32}}>
        <h1 style={{fontSize: 34, marginTop: 0}}>Atelier Jacqueline Suzanne</h1>
        <p style={{fontSize: 18, lineHeight: 1.6}}>
          {intro || "Ajouter l'introduction de la page d'accueil."}
        </p>
      </div>
    </div>
  )
}
