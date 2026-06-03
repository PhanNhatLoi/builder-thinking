export function InspectorSection({ title, icon: Icon, children }) {
  return (
    <section className="inspector-section">
      <div className="inspector-section-title">
        <strong>{title}</strong>
        {Icon && <Icon size={15} />}
      </div>
      {children}
    </section>
  )
}
