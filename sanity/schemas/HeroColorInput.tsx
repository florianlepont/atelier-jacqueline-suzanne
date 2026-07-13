import {set, unset, type StringInputProps} from 'sanity'

export const HERO_COLOR_OPTIONS = [
  {title: 'Pink', value: 'pink', hex: '#FF3B94', text: '#1A1A1A'},
  {title: 'Purple', value: 'purple', hex: '#AF3DFF', text: '#FFFFFF'},
  {title: 'Teal', value: 'teal', hex: '#55FFE1', text: '#1A1A1A'},
  {title: 'Lime', value: 'lime', hex: '#A6FD29', text: '#1A1A1A'},
  {title: 'Plum', value: 'plum', hex: '#37013A', text: '#FFFFFF'},
] as const

const baseButtonStyle = {
  appearance: 'none',
  border: '1px solid #C6C6C6',
  borderRadius: 4,
  cursor: 'pointer',
  minHeight: 76,
  padding: 0,
  overflow: 'hidden',
  textAlign: 'left',
  width: '100%',
} as const

export function HeroColorInput(props: StringInputProps) {
  const {onChange, readOnly, value} = props

  const selectColor = (nextValue?: string) => {
    onChange(nextValue ? set(nextValue) : unset())
  }

  return (
    <div style={{display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'}}>
      <button
        type="button"
        disabled={readOnly}
        aria-pressed={!value}
        onClick={() => selectColor()}
        style={{
          ...baseButtonStyle,
          background: '#FFFFFF',
          boxShadow: !value ? '0 0 0 3px #1A1A1A' : 'none',
        }}
      >
        <span style={{display: 'flex', height: 44}} aria-hidden="true">
          {HERO_COLOR_OPTIONS.map((color) => (
            <span key={color.value} style={{background: color.hex, flex: 1}} />
          ))}
        </span>
        <span style={{display: 'block', padding: '7px 8px', color: '#1A1A1A', fontWeight: 600}}>
          Automatic palette
        </span>
      </button>

      {HERO_COLOR_OPTIONS.map((color) => {
        const selected = value === color.value
        return (
          <button
            key={color.value}
            type="button"
            disabled={readOnly}
            aria-pressed={selected}
            aria-label={`${color.title}, ${color.hex}`}
            onClick={() => selectColor(color.value)}
            style={{
              ...baseButtonStyle,
              background: color.hex,
              boxShadow: selected ? '0 0 0 3px #1A1A1A' : 'none',
              color: color.text,
            }}
          >
            <span style={{display: 'block', padding: '26px 10px 8px'}}>
              <strong style={{display: 'block'}}>{color.title}</strong>
              <span style={{fontSize: 12}}>{color.hex}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
