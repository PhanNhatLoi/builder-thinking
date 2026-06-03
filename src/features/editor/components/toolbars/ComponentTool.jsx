import { useEditor } from '@craftjs/core'

export function ComponentTool({ icon: Icon, label, element }) {
  const { connectors } = useEditor()

  return (
    <button
      ref={(ref) => ref && connectors.create(ref, element)}
      className="component-tool"
      aria-label={label}
      data-tip={label}
    >
      <Icon size={18} />
    </button>
  )
}
