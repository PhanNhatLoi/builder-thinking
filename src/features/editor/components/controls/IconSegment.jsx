export function IconSegment({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map(([key, Icon, label]) => (
        <button
          key={key}
          type="button"
          className={value === key ? 'active' : ''}
          aria-label={label || key}
          onClick={() => onChange(key)}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}
