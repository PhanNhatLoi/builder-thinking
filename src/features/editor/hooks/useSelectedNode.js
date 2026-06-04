import { useEditor } from '@craftjs/core'
import { selectedIdFromSet } from '../utils/editorUtils'

export function useSelectedNode() {
  return useEditor((state) => {
    const selectedIds = state.events.selected ? Array.from(state.events.selected) : []
    const selectedId = selectedIdFromSet(state.events.selected)

    return {
      selectedId,
      selectedIds,
      selectedNode: selectedId ? { id: selectedId, ...state.nodes[selectedId] } : null,
      selectedNodes: selectedIds.map((id) => ({ id, ...state.nodes[id] })).filter((node) => node.data),
    }
  })
}
