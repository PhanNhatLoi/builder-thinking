export function SelectControl({ value, onChange, options, label }) {
  return (
    <select className="select-control" value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
