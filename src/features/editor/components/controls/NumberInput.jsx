export function NumberInput({ value = 0, min = 0, max = 320, onChange }) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  )
}
