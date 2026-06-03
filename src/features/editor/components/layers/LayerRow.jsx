import { ChevronRight } from 'lucide-react'
import { nodeTitle } from '../../utils/editorUtils'

export function LayerRow({ id, depth = 0, nodes, selectedId, actions }) {
  const node = nodes[id]
  if (!node) return null

  const children = node.data.nodes || []
  const isSelected = selectedId === id

  return (
    <>
      <button
        className={`layer-row ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: 12 + depth * 14 }}
        onClick={() => actions.selectNode(id)}
      >
        {children.length > 0 ? <ChevronRight size={14} /> : <span className="layer-spacer" />}
        <span>{nodeTitle(node)}</span>
      </button>
      {children.map((childId) => (
        <LayerRow key={childId} id={childId} depth={depth + 1} nodes={nodes} selectedId={selectedId} actions={actions} />
      ))}
    </>
  )
}
