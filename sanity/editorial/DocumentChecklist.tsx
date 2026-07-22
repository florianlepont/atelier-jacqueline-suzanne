import {useState} from 'react'
import type {UserViewComponent} from 'sanity/structure'
import {getDocumentChecks, summarizeChecks} from './checks'
import {compactCheckLabel} from './dashboardLogic'

const colors = {
  complete: '#2BD69F',
  required: '#FF4D9D',
  recommended: '#E7A72E',
} as const

export const DocumentChecklist: UserViewComponent = ({document, schemaType}) => {
  const [showCompleted, setShowCompleted] = useState(false)
  const value = (document.displayed ?? {}) as Record<string, unknown>
  const checks = getDocumentChecks(schemaType.name, value)
  const summary = summarizeChecks(checks)
  const pending = checks.filter((item) => !item.complete)
  const completed = checks.filter((item) => item.complete)
  const requiredPendingCount = pending.filter((item) => !item.recommended).length
  const percentage = summary.totalCount
    ? Math.round((summary.completeCount / summary.totalCount) * 100)
    : 100

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 680,
        margin: '0 auto',
        padding: '20px 16px',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
      }}
    >
      <header
        style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16}}
      >
        <div>
          <h1 style={{fontSize: 16, lineHeight: 1.3, margin: 0}}>Préparation du contenu</h1>
          <p style={{fontSize: 12, lineHeight: 1.4, margin: '3px 0 0', opacity: 0.58}}>
            {summary.requiredComplete
              ? 'Le contenu obligatoire est prêt.'
              : `${requiredPendingCount} élément${requiredPendingCount > 1 ? 's' : ''} obligatoire${requiredPendingCount > 1 ? 's' : ''} à compléter.`}
          </p>
        </div>
        <span
          style={{
            flex: '0 0 auto',
            borderRadius: 999,
            background: 'rgba(127, 127, 127, 0.14)',
            padding: '5px 9px',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {summary.completeCount}/{summary.totalCount}
        </span>
      </header>

      <div
        role="progressbar"
        aria-label="Progression de la préparation"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        style={{
          height: 4,
          overflow: 'hidden',
          borderRadius: 999,
          background: 'rgba(127, 127, 127, 0.2)',
          margin: '16px 0 18px',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: 999,
            background: summary.requiredComplete ? colors.complete : colors.required,
            transition: 'width 180ms ease',
          }}
        />
      </div>

      {pending.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: '1px solid rgba(43, 214, 159, 0.35)',
            borderRadius: 12,
            background: 'rgba(43, 214, 159, 0.08)',
            padding: '12px 14px',
          }}
        >
          <StatusIcon complete />
          <span style={{fontSize: 13, fontWeight: 600}}>Tout est prêt pour la publication.</span>
        </div>
      ) : (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                fontSize: 12,
                lineHeight: 1.4,
                margin: 0,
                opacity: 0.65,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              À compléter
            </h2>
            <span style={{fontSize: 11, opacity: 0.5}}>{pending.length}</span>
          </div>
          <div style={panelStyle}>
            {pending.map((item, index) => (
              <ChecklistRow
                key={item.label}
                label={compactCheckLabel(item.label)}
                recommended={item.recommended}
                divider={index < pending.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section style={{marginTop: 12}}>
          <button
            type="button"
            aria-expanded={showCompleted}
            onClick={() => setShowCompleted((current) => !current)}
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              padding: '7px 2px',
              font: 'inherit',
            }}
          >
            <span
              style={{display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, opacity: 0.68}}
            >
              <span aria-hidden="true" style={{color: colors.complete}}>
                ✓
              </span>
              {completed.length} élément{completed.length > 1 ? 's' : ''} terminé
              {completed.length > 1 ? 's' : ''}
            </span>
            <span aria-hidden="true" style={{fontSize: 11, opacity: 0.5}}>
              {showCompleted ? '▲' : '▼'}
            </span>
          </button>

          {showCompleted && (
            <div style={panelStyle}>
              {completed.map((item, index) => (
                <ChecklistRow
                  key={item.label}
                  label={compactCheckLabel(item.label)}
                  complete
                  divider={index < completed.length - 1}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {pending.some((item) => item.recommended) && (
        <p style={{fontSize: 11, lineHeight: 1.45, margin: '14px 2px 0', opacity: 0.48}}>
          Les recommandations améliorent la présentation et le SEO, mais n’empêchent pas la
          publication.
        </p>
      )}
    </div>
  )
}

const panelStyle = {
  overflow: 'hidden',
  border: '1px solid rgba(127, 127, 127, 0.22)',
  borderRadius: 12,
  background: 'rgba(127, 127, 127, 0.055)',
} as const

function ChecklistRow({
  label,
  complete = false,
  recommended = false,
  divider = false,
}: {
  label: string
  complete?: boolean
  recommended?: boolean
  divider?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 42,
        alignItems: 'center',
        gap: 10,
        borderBottom: divider ? '1px solid rgba(127, 127, 127, 0.16)' : undefined,
        padding: '7px 11px',
        boxSizing: 'border-box',
        opacity: complete ? 0.62 : 1,
      }}
    >
      <StatusIcon complete={complete} recommended={recommended} />
      <span style={{minWidth: 0, flex: 1, fontSize: 13, lineHeight: 1.35}}>{label}</span>
      {recommended && (
        <span
          style={{
            flex: '0 0 auto',
            borderRadius: 999,
            background: 'rgba(231, 167, 46, 0.13)',
            color: colors.recommended,
            padding: '3px 7px',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          Recommandé
        </span>
      )}
    </div>
  )
}

function StatusIcon({
  complete = false,
  recommended = false,
}: {
  complete?: boolean
  recommended?: boolean
}) {
  const color = complete ? colors.complete : recommended ? colors.recommended : colors.required
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        width: 18,
        height: 18,
        flex: '0 0 18px',
        placeItems: 'center',
        border: complete ? 0 : `1.5px solid ${color}`,
        borderRadius: '50%',
        background: complete ? color : 'transparent',
        color: complete ? '#0F1714' : color,
        fontSize: 11,
        fontWeight: 800,
        boxSizing: 'border-box',
      }}
    >
      {complete ? '✓' : ''}
    </span>
  )
}
