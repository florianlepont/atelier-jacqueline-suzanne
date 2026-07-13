import {useEffect, useMemo, useState} from 'react'
import type {UserViewComponent} from 'sanity/structure'
import {deploymentLabel, getLatestDeployment, SITE_PREVIEW_URL} from './deployment'
import type {DeploymentRun} from './deployment'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function documentPath(schemaType: string, value: Record<string, unknown>) {
  if (schemaType === 'gallery') {
    const slug = record(value.slug).current
    return typeof slug === 'string' ? `galleries/${slug}/` : ''
  }
  if (schemaType === 'aboutPage') return 'about/'
  return ''
}

export const WebsitePreview: UserViewComponent = ({document, schemaType}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [locale, setLocale] = useState<'fr' | 'en'>('fr')
  const [refresh, setRefresh] = useState(0)
  const [run, setRun] = useState<DeploymentRun | null>(null)
  const value = (document.displayed ?? {}) as Record<string, unknown>
  const path = documentPath(schemaType.name, value)
  const url = useMemo(() => {
    const localizedPath = locale === 'en' ? `en/${path}` : path
    return new URL(localizedPath, SITE_PREVIEW_URL).toString()
  }, [locale, path])

  useEffect(() => {
    const controller = new AbortController()
    getLatestDeployment(controller.signal)
      .then(setRun)
      .catch(() => setRun(null))
    return () => controller.abort()
  }, [refresh])

  const deployment = deploymentLabel(run)

  return (
    <div
      style={{
        height: '100%',
        minHeight: 620,
        background: '#F5F5F5',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
          <Toggle active={device === 'desktop'} onClick={() => setDevice('desktop')}>
            Ordinateur
          </Toggle>
          <Toggle active={device === 'mobile'} onClick={() => setDevice('mobile')}>
            Mobile
          </Toggle>
          <Toggle active={locale === 'fr'} onClick={() => setLocale('fr')}>
            FR
          </Toggle>
          <Toggle active={locale === 'en'} onClick={() => setLocale('en')}>
            EN
          </Toggle>
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            style={buttonStyle}
          >
            Actualiser
          </button>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{color: deployment.color, fontSize: 13, fontWeight: 700}}>
            {deployment.label}
          </span>
          <a href={url} target="_blank" rel="noreferrer" style={{color: '#1A1A1A'}}>
            Ouvrir ↗
          </a>
        </div>
      </div>
      <p style={{color: '#666', fontSize: 13, margin: '0 0 12px'}}>
        Version actuellement publiée. L’onglet « Aperçu du brouillon » montre les changements avant
        publication.
      </p>
      <div
        style={{
          width: device === 'mobile' ? 390 : '100%',
          maxWidth: '100%',
          height: 'calc(100% - 88px)',
          minHeight: 520,
          margin: '0 auto',
          overflow: 'hidden',
          background: '#FFFFFF',
          border: '1px solid #D8D8D8',
        }}
      >
        <iframe
          key={`${url}-${refresh}`}
          title="Aperçu du site publié"
          src={url}
          style={{width: '100%', height: '100%', border: 0}}
        />
      </div>
    </div>
  )
}

const buttonStyle = {
  border: '1px solid #1A1A1A',
  background: '#FFFFFF',
  color: '#1A1A1A',
  cursor: 'pointer',
  padding: '8px 12px',
} as const

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        ...buttonStyle,
        background: active ? '#1A1A1A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#1A1A1A',
      }}
    >
      {children}
    </button>
  )
}
