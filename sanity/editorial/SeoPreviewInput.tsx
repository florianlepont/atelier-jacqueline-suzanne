import {useState} from 'react'
import type {ObjectInputProps} from 'sanity'

type Locale = 'fr' | 'en'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function SeoPreviewInput(props: ObjectInputProps) {
  const [locale, setLocale] = useState<Locale>('fr')
  const value = record(props.value)
  const title = record(value.title)[locale]
  const description = record(value.description)[locale]
  const titleText = typeof title === 'string' ? title : ''
  const descriptionText = typeof description === 'string' ? description : ''

  return (
    <div>
      {props.renderDefault(props)}
      <section style={{border: '1px solid #E3E1DE', marginTop: 18, padding: 18}}>
        <div
          style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12}}
        >
          <strong>Aperçu du résultat Google</strong>
          <div style={{display: 'flex', gap: 6}}>
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
                  padding: '5px 9px',
                }}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {value.noIndex === true && (
          <p style={{background: '#FFF0F6', padding: 10, fontWeight: 700}}>
            Cette page demande aux moteurs de recherche de ne pas l’indexer.
          </p>
        )}
        <div style={{fontFamily: 'Arial, sans-serif', marginTop: 18}}>
          <div style={{color: '#202124', fontSize: 12}}>atelierjacquelinesuzanne.fr › …</div>
          <div style={{color: '#1A0DAB', fontSize: 20, lineHeight: 1.35, marginTop: 4}}>
            {titleText || 'Titre de la page — Atelier Jacqueline Suzanne'}
          </div>
          <div style={{color: '#4D5156', fontSize: 14, lineHeight: 1.5, marginTop: 4}}>
            {descriptionText || 'La description de cette page apparaîtra ici.'}
          </div>
        </div>
        <p style={{color: '#666', fontSize: 12, marginBottom: 0}}>
          Titre : {titleText.length}/60 · Description : {descriptionText.length}/160
        </p>
      </section>
    </div>
  )
}
