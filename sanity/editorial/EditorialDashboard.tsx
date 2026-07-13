import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {deploymentLabel, getLatestDeployment, SITE_PREVIEW_URL} from './deployment'
import type {DeploymentRun} from './deployment'
import {getDocumentChecks, summarizeChecks} from './checks'

interface DashboardDocument extends Record<string, unknown> {
  _id: string
  _type: string
  _updatedAt: string
  title?: string
  isVisible?: boolean
  images?: unknown[]
}

const query = `*[_type in ["gallery", "homePage", "aboutPage", "siteSettings", "exhibition"]] | order(_updatedAt desc) {
  _id, _type, _updatedAt, title, slug, isVisible, statement, images, seo,
  intro, biography, practice, medium, siteTitle, navLabels, footerText, defaultSeo,
  startDate, venue, city, description, image
}`

const typeLabels: Record<string, string> = {
  gallery: 'Collection photo',
  homePage: "Page d'accueil",
  aboutPage: 'Page À propos',
  siteSettings: 'Réglages du site',
  exhibition: 'Exposition',
}

function baseId(id: string) {
  return id.replace(/^drafts\./, '')
}

function documentTitle(document: DashboardDocument) {
  if (document._type === 'gallery' || document._type === 'exhibition') {
    return (
      document.title ||
      (document._type === 'gallery' ? 'Collection sans nom' : 'Événement sans nom')
    )
  }
  return typeLabels[document._type] || document._type
}

export function EditorialDashboard() {
  const client = useClient({apiVersion: '2025-08-15'})
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  const [run, setRun] = useState<DeploymentRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      client.fetch<DashboardDocument[]>(query, {}, {perspective: 'raw'}),
      getLatestDeployment(controller.signal).catch(() => null),
    ])
      .then(([content, deployment]) => {
        setDocuments(content)
        setRun(deployment)
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : 'Erreur inconnue'),
      )
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [client])

  const rows = useMemo(() => {
    const byId = new Map<string, {published?: DashboardDocument; draft?: DashboardDocument}>()
    for (const document of documents) {
      const id = baseId(document._id)
      const entry = byId.get(id) ?? {}
      if (document._id.startsWith('drafts.')) entry.draft = document
      else entry.published = document
      byId.set(id, entry)
    }
    return Array.from(byId.entries()).map(([id, versions]) => {
      const current = versions.draft ?? versions.published!
      const checks = getDocumentChecks(current._type, current)
      return {
        id,
        current,
        hasDraft: Boolean(versions.draft),
        isPublished: Boolean(versions.published),
        summary: summarizeChecks(checks),
      }
    })
  }, [documents])

  const attention = rows.filter(
    ({current, summary}) =>
      !summary.requiredComplete || !summary.recommendedComplete || current.isVisible === false,
  )
  const galleries = rows.filter(({current}) => current._type === 'gallery')
  const deployment = deploymentLabel(run)

  return (
    <main style={{maxWidth: 1120, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif'}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div>
          <h1 style={{fontSize: 32, margin: '0 0 8px'}}>Bonjour 👋</h1>
          <p style={{color: '#666', margin: 0}}>Voici l’état du contenu et du site.</p>
        </div>
        <a href={SITE_PREVIEW_URL} target="_blank" rel="noreferrer" style={{color: '#1A1A1A'}}>
          Ouvrir le site ↗
        </a>
      </div>

      {loading && <p style={{marginTop: 32}}>Chargement du tableau de bord…</p>}
      {error && <p style={{marginTop: 32, color: '#B00020'}}>Impossible de charger : {error}</p>}

      {!loading && !error && (
        <>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 14,
              marginTop: 32,
            }}
          >
            <DashboardCard
              label="Collections publiées"
              value={String(galleries.filter((row) => row.isPublished).length)}
            />
            <DashboardCard
              label="Brouillons en cours"
              value={String(rows.filter((row) => row.hasDraft).length)}
            />
            <DashboardCard label="À vérifier" value={String(attention.length)} />
            <DashboardCard
              label="Déploiement"
              value={deployment.label}
              color={deployment.color}
              href={run?.html_url}
            />
          </section>

          <section style={{marginTop: 38}}>
            <h2 style={{fontSize: 22}}>Contenus à vérifier</h2>
            {attention.length === 0 ? (
              <p style={{padding: 18, background: '#F1F8F2'}}>Tout est prêt.</p>
            ) : (
              <div style={{display: 'grid', gap: 10}}>
                {attention.map(({id, current, hasDraft, isPublished, summary}) => (
                  <IntentLink
                    key={id}
                    intent="edit"
                    params={{id, type: current._type}}
                    style={{
                      display: 'block',
                      border: '1px solid #E3E1DE',
                      color: '#1A1A1A',
                      padding: 16,
                      textDecoration: 'none',
                    }}
                  >
                    <strong>{documentTitle(current)}</strong>
                    <span style={{display: 'block', color: '#666', fontSize: 13, marginTop: 5}}>
                      {typeLabels[current._type]} ·{' '}
                      {hasDraft ? 'Brouillon en cours' : isPublished ? 'Publié' : 'Non publié'}
                      {current.isVisible === false ? ' · Masqué' : ''} · {summary.completeCount}/
                      {summary.totalCount} éléments prêts
                    </span>
                  </IntentLink>
                ))}
              </div>
            )}
          </section>

          <section style={{marginTop: 38}}>
            <h2 style={{fontSize: 22}}>Modifiés récemment</h2>
            <div style={{display: 'grid', gap: 10}}>
              {rows.slice(0, 6).map(({id, current}) => (
                <IntentLink
                  key={id}
                  intent="edit"
                  params={{id, type: current._type}}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    borderBottom: '1px solid #E3E1DE',
                    color: '#1A1A1A',
                    padding: '10px 0',
                    textDecoration: 'none',
                  }}
                >
                  <span>{documentTitle(current)}</span>
                  <small style={{color: '#666'}}>
                    {new Date(current._updatedAt).toLocaleDateString('fr-FR')}
                  </small>
                </IntentLink>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function DashboardCard({
  label,
  value,
  color = '#1A1A1A',
  href,
}: {
  label: string
  value: string
  color?: string
  href?: string
}) {
  const content = (
    <>
      <span style={{display: 'block', color: '#666', fontSize: 13}}>{label}</span>
      <strong style={{display: 'block', color, fontSize: 21, marginTop: 9}}>{value}</strong>
    </>
  )
  const style = {
    display: 'block',
    border: '1px solid #E3E1DE',
    color: '#1A1A1A',
    padding: 18,
    textDecoration: 'none',
  }
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" style={style}>
      {content}
    </a>
  ) : (
    <div style={style}>{content}</div>
  )
}
