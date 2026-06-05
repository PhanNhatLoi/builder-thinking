import { useEffect, useState } from 'react'

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function formatNumber(value, min, max) {
  return String(clampNumber(Math.round(Number(value)), min, max))
}

export function CompactNumber({ label, value = 0, min = 0, max = 999, onChange, suffix = '', disabled = false, title }) {
  const [draft, setDraft] = useState(formatNumber(value, min, max))

  useEffect(() => {
    setDraft(formatNumber(value, min, max))
  }, [value, min, max])

  const commit = (nextValue) => {
    const formatted = formatNumber(nextValue, min, max)
    setDraft(formatted)
    onChange(Number(formatted))
  }

  return (
    <label className={`compact-number ${disabled ? 'disabled' : ''}`} title={title || label}>
      <span>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        disabled={disabled}
        aria-label={title || label}
        onBlur={() => commit(draft)}
        onChange={(event) => {
          const nextValue = event.target.value.replace(/[^\d]/g, '')
          const normalized = nextValue.replace(/^0+(?=\d)/, '')
          setDraft(normalized)
          if (normalized !== '') onChange(clampNumber(Number(normalized), min, max))
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
      {suffix && <em>{suffix}</em>}
    </label>
  )
}
