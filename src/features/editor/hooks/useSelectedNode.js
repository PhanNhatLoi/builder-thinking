import { useEditor } from '@craftjs/core'
import { selectedIdFromSet } from '../utils/editorUtils'

export function useSelectedNode() {
  return useEditor((state) => {
    const selectedId = selectedIdFromSet(state.events.selected)

    return {
      selectedId,
      selectedNode: selectedId ? { id: selectedId, ...state.nodes[selectedId] } : null,
    }
  })
}
