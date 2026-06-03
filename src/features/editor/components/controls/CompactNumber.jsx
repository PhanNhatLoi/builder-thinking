export function CompactNumber({ label, value = 0, min = 0, max = 999, onChange, suffix = '', disabled = false }) {
  return (
    <label className={`compact-number ${disabled ? 'disabled' : ''}`}>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {suffix && <em>{suffix}</em>}
    </label>
  )
}
