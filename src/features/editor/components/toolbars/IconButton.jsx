export function IconButton({ label, icon: Icon, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      <Icon size={16} />
    </button>
  )
}
