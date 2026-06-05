import { useEffect, useState } from 'react'
import { colorSwatches } from '../../constants'

const hexColorPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function normalizeHexColor(value) {
  const nextValue = value.trim()
  if (nextValue.toLowerCase() === 'transparent') return 'transparent'

  const withHash = nextValue.startsWith('#') ? nextValue : `#${nextValue}`

  if (!hexColorPattern.test(withHash)) return null

  if (withHash.length === 4) {
    return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`.toLowerCase()
  }

  return withHash.toLowerCase()
}

export function ColorControl({ value, onChange }) {
  const normalizedValue = normalizeHexColor(value || '')
  const safeValue = normalizedValue || '#111827'
  const pickerValue = safeValue === 'transparent' ? '#ffffff' : safeValue
  const [draft, setDraft] = useState(safeValue)

  useEffect(() => {
    setDraft(safeValue)
  }, [safeValue])

  const commit = () => {
    const nextColor = normalizeHexColor(draft)
    if (!nextColor) {
      setDraft(safeValue)
      return
    }

    setDraft(nextColor)
    onChange(nextColor)
  }

  return (
    <div className="swatches">
      <button
        type="button"
        className={`transparent-swatch ${value === 'transparent' ? 'active' : ''}`}
        aria-label="Use transparent"
        title="Use transparent"
        onClick={() => onChange('transparent')}
      />
      {colorSwatches.map((color) => (
        <button
          key={color}
          type="button"
          className={value === color ? 'active' : ''}
          style={{ background: color }}
          aria-label={`Use ${color}`}
          title={`Use ${color}`}
          onClick={() => onChange(color)}
        />
      ))}
      <input className="color-picker" type="color" value={pickerValue} aria-label="Pick color" onChange={(event) => onChange(event.target.value)} />
      <input
        className="color-text"
        type="text"
        value={draft}
        aria-label="Hex color"
        title="Nhập mã màu HEX rồi nhấn Enter"
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}
