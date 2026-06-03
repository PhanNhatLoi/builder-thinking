import React from 'react'
import { useEditor } from '@craftjs/core'
import { isEditableTarget, selectedIdFromSet } from '../utils/editorUtils'

export function useKeyboardShortcuts() {
  const { actions, selectedId } = useEditor((state) => ({
    selectedId: selectedIdFromSet(state.events.selected),
  }))

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      if (!selectedId || selectedId === 'ROOT') return

      event.preventDefault()
      actions.delete(selectedId)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions, selectedId])
}
