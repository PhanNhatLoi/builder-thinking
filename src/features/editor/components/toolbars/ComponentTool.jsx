export function ComponentTool({ active = false, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      className={`component-tool ${active ? 'active' : ''}`}
      aria-label={label}
      data-tip={label}
      onClick={onClick}
    >
      <Icon size={18} />
    </button>
  )
}
