import { useEditor } from '@craftjs/core'
import { Layers } from 'lucide-react'
import { useState } from 'react'
import { selectedIdFromSet } from '../../utils/editorUtils'
import { LayerRow } from './LayerRow'

function getSiblingMove(nodes, sourceId, targetId, position) {
  if (!sourceId || !targetId || sourceId === targetId || sourceId === 'ROOT') return null

  const sourceParentId = nodes[sourceId]?.data.parent
  const targetParentId = nodes[targetId]?.data.parent
  if (!sourceParentId || sourceParentId !== targetParentId) return null

  const siblings = nodes[sourceParentId]?.data.nodes || []
  const sourceIndex = siblings.indexOf(sourceId)
  const targetIndex = siblings.indexOf(targetId)
  if (sourceIndex === -1 || targetIndex === -1) return null

  let nextIndex = targetIndex + (position === 'after' ? 1 : 0)
  if (sourceIndex < nextIndex) nextIndex -= 1
  if (nextIndex === sourceIndex) return null

  return {
    parentId: sourceParentId,
    index: nextIndex,
  }
}

export function LayersPanel() {
  const [collapsedIds, setCollapsedIds] = useState(() => new Set())
  const [dragState, setDragState] = useState({ sourceId: null, targetId: null, position: null })
  const { nodes, selectedId, actions } = useEditor((state) => ({
    nodes: state.nodes,
    selectedId: selectedIdFromSet(state.events.selected),
  }))

  const handleDragStart = (sourceId) => {
    setDragState({ sourceId, targetId: null, position: null })
  }

  const handleDragOver = (targetId, event) => {
    const sourceId = dragState.sourceId
    if (!sourceId || sourceId === targetId) return false

    const targetRect = event.currentTarget.getBoundingClientRect()
    const position = event.clientY < targetRect.top + targetRect.height / 2 ? 'before' : 'after'
    if (!getSiblingMove(nodes, sourceId, targetId, position)) return false

    setDragState({ sourceId, targetId, position })
    return true
  }

  const handleDrop = (targetId) => {
    const move = getSiblingMove(nodes, dragState.sourceId, targetId, dragState.position)
    setDragState({ sourceId: null, targetId: null, position: null })
    if (!move) return false

    actions.move(dragState.sourceId, move.parentId, move.index)
    actions.selectNode(dragState.sourceId)
    return true
  }

  const handleDragEnd = () => {
    setDragState({ sourceId: null, targetId: null, position: null })
  }

  const handleToggleLayer = (id) => {
    setCollapsedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(id)) {
        nextIds.delete(id)
      } else {
        nextIds.add(id)
      }
      return nextIds
    })
  }

  return (
    <section className="layers-panel">
      <div className="panel-heading compact">
        <span>Layers</span>
        <Layers size={16} />
      </div>
      <div className="layer-list">
        <LayerRow
          id="ROOT"
          nodes={nodes}
          selectedId={selectedId}
          actions={actions}
          collapsedIds={collapsedIds}
          dragState={dragState}
          onLayerDragStart={handleDragStart}
          onLayerDragOver={handleDragOver}
          onLayerDrop={handleDrop}
          onLayerDragEnd={handleDragEnd}
          onToggleLayer={handleToggleLayer}
        />
      </div>
    </section>
  )
}
