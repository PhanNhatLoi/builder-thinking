import { colorSwatches } from '../../constants'

export function ColorControl({ value, onChange }) {
  return (
    <div className="swatches">
      {colorSwatches.map((color) => (
        <button
          key={color}
          type="button"
          className={value === color ? 'active' : ''}
          style={{ background: color }}
          aria-label={`Use ${color}`}
          onClick={() => onChange(color)}
        />
      ))}
      <input type="color" value={value || '#111827'} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
