import { useNode } from '@craftjs/core'

export function CanvasRoot({ background = '#ffffff', padding = 44, gap = 18, children }) {
  const {
    connectors: { connect },
    selected,
  } = useNode((node) => ({ selected: node.events.selected }))

  return (
    <main
      ref={(ref) => ref && connect(ref)}
      className={`page-canvas ${selected ? 'is-selected' : ''}`}
      style={{ background, padding, gap }}
    >
      {children}
    </main>
  )
}

CanvasRoot.craft = {
  displayName: 'Page',
  props: {
    background: '#ffffff',
    padding: 44,
    gap: 18,
  },
  rules: {
    canDrag: () => false,
  },
}
