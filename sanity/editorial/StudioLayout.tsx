import type {LayoutProps} from 'sanity'
import {createGlobalStyle} from 'styled-components'

const CompactDocumentFormStyles = createGlobalStyle`
  /* Sanity applies its large space-6 rhythm both after the document title
     and between the field-group tabs and their fields. Combined with the
     tabs' own padding, those defaults create three visually unrelated gaps.
     Keep the native form components and normalize only those outer spaces. */
  [data-testid='form-view']
    [data-ui='Stack']:has(> [data-testid='document-panel-document-title']) {
    gap: 8px !important;
    margin-bottom: 24px !important;
  }

  [data-testid='form-view'] [data-ui='Stack']:has(> [data-testid='field-groups']) {
    gap: 24px !important;
  }

  [data-testid='form-view'] [data-testid='field-groups'] {
    padding-bottom: 8px !important;
  }
`

export function StudioLayout(props: LayoutProps) {
  return (
    <>
      <CompactDocumentFormStyles />
      {props.renderDefault(props)}
    </>
  )
}
