import type {UserViewComponent} from 'sanity/structure'
import {getDocumentChecks, summarizeChecks} from './checks'

export const DocumentChecklist: UserViewComponent = ({document, schemaType}) => {
  const value = (document.displayed ?? {}) as Record<string, unknown>
  const checks = getDocumentChecks(schemaType.name, value)
  const summary = summarizeChecks(checks)

  return (
    <div style={{maxWidth: 760, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif'}}>
      <h1 style={{fontSize: 28, marginBottom: 8}}>Checklist avant publication</h1>
      <p style={{color: '#666', lineHeight: 1.5, marginTop: 0}}>
        {summary.completeCount} élément{summary.completeCount > 1 ? 's' : ''} sur{' '}
        {summary.totalCount} prêt{summary.completeCount > 1 ? 's' : ''}. Les recommandations SEO
        n’empêchent pas la publication.
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={summary.totalCount}
        aria-valuenow={summary.completeCount}
        style={{height: 10, overflow: 'hidden', background: '#E3E1DE', margin: '24px 0'}}
      >
        <div
          style={{
            width: `${summary.totalCount ? (summary.completeCount / summary.totalCount) * 100 : 100}%`,
            height: '100%',
            background: summary.requiredComplete ? '#2E7D32' : '#FF3B94',
          }}
        />
      </div>
      <div style={{display: 'grid', gap: 10}}>
        {checks.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid #E3E1DE',
              padding: 14,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'grid',
                width: 24,
                height: 24,
                flex: '0 0 24px',
                placeItems: 'center',
                borderRadius: '50%',
                background: item.complete ? '#2E7D32' : item.recommended ? '#F3E5F5' : '#FFF0F6',
                color: item.complete ? '#FFFFFF' : '#1A1A1A',
                fontWeight: 700,
              }}
            >
              {item.complete ? '✓' : '•'}
            </span>
            <span style={{lineHeight: 1.4}}>
              {item.label}
              {item.recommended && (
                <small style={{display: 'block', color: '#666'}}>Recommandé</small>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
