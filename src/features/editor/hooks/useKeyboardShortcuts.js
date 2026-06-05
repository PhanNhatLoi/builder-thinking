import React from 'react'
import { useEditor } from '@craftjs/core'
import { isEditableTarget } from '../utils/editorUtils'

export function useKeyboardShortcuts() {
  const { actions, canRedo, canUndo, selectedIds } = useEditor((state, query) => ({
    canRedo: query.history.canRedo(),
    canUndo: query.history.canUndo(),
    selectedIds: state.events.selected ? Array.from(state.events.selected).filter((id) => id !== 'ROOT') : [],
  }))

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      const key = event.key.toLowerCase()
      const hasModifier = event.metaKey || event.ctrlKey

      if (hasModifier && key === 'z' && !event.shiftKey) {
        if (!canUndo) return
        event.preventDefault()
        actions.history.undo()
        return
      }

      if (hasModifier && ((key === 'z' && event.shiftKey) || key === 'y')) {
        if (!canRedo) return
        event.preventDefault()
        actions.history.redo()
        return
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      if (!selectedIds.length) return

      event.preventDefault()
      actions.delete(selectedIds)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions, canRedo, canUndo, selectedIds])
}
