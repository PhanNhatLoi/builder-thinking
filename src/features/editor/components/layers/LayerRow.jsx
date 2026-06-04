import { ChevronRight, Circle, FileText, Image as ImageIcon, Pentagon, Slash, Square, Type } from 'lucide-react'
import { nodeTitle } from '../../utils/editorUtils'

function layerIcon(node) {
  const displayName = node.data.displayName || node.data.name
  const shapeType = node.data.props?.shapeType || 'rectangle'

  if (displayName === 'Page') return FileText
  if (displayName === 'Text') return Type
  if (displayName === 'Image') return ImageIcon
  if (displayName === 'Section') return Square
  if (displayName === 'Shape') {
    if (shapeType === 'ellipse') return Circle
    if (shapeType === 'line') return Slash
    if (shapeType === 'polygon') return Pentagon
    if (shapeType === 'image') return ImageIcon
    return Square
  }

  return Square
}

export function LayerRow({
  id,
  depth = 0,
  nodes,
  selectedId,
  actions,
  collapsedIds,
  dragState,
  onLayerDragStart,
  onLayerDragOver,
  onLayerDrop,
  onLayerDragEnd,
  onToggleLayer,
}) {
  const node = nodes[id]
  if (!node) return null

  const children = node.data.nodes || []
  const isSelected = selectedId === id
  const canDrag = id !== 'ROOT'
  const Icon = layerIcon(node)
  const isExpanded = !collapsedIds?.has(id)
  const dropClass = dragState?.targetId === id && dragState.position ? `drop-${dragState.position}` : ''

  return (
    <>
      <div
        className={`layer-row ${canDrag ? 'can-drag' : ''} ${isSelected ? 'active' : ''} ${dragState?.sourceId === id ? 'is-dragging' : ''} ${dropClass}`}
        draggable={canDrag}
        style={{ paddingLeft: 12 + depth * 14 }}
        onDragStart={(event) => {
          if (!canDrag) {
            event.preventDefault()
            return
          }

          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/layer-id', id)
          onLayerDragStart?.(id)
        }}
        onDragOver={(event) => {
          if (!onLayerDragOver?.(id, event)) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(event) => {
          if (!onLayerDrop?.(id)) return
          event.preventDefault()
          event.stopPropagation()
        }}
        onDragEnd={onLayerDragEnd}
      >
        {children.length > 0 ? (
          <button
            type="button"
            className="layer-toggle-button"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${nodeTitle(node)}`}
            aria-expanded={isExpanded}
            onClick={(event) => {
              event.stopPropagation()
              onToggleLayer?.(id)
            }}
          >
            <ChevronRight className={isExpanded ? 'expanded' : ''} size={14} />
          </button>
        ) : (
          <span className="layer-spacer" />
        )}
        <button type="button" className="layer-select-button" onClick={() => actions.selectNode(id)}>
          <Icon className="layer-type-icon" size={14} aria-hidden="true" />
          <span>{nodeTitle(node)}</span>
        </button>
      </div>
      {isExpanded && children.map((childId) => (
        <LayerRow
          key={childId}
          id={childId}
          depth={depth + 1}
          nodes={nodes}
          selectedId={selectedId}
          actions={actions}
          collapsedIds={collapsedIds}
          dragState={dragState}
          onLayerDragStart={onLayerDragStart}
          onLayerDragOver={onLayerDragOver}
          onLayerDrop={onLayerDrop}
          onLayerDragEnd={onLayerDragEnd}
          onToggleLayer={onToggleLayer}
        />
      ))}
    </>
  )
}
