import { useEditor } from '@craftjs/core'
import { Download, MousePointer2, Redo2, Trash2, Undo2 } from 'lucide-react'
import { IconButton } from './IconButton'

export function TopBar() {
  const { actions, canUndo, canRedo, query, selectedIds } = useEditor((state, q) => ({
    canUndo: q.history.canUndo(),
    canRedo: q.history.canRedo(),
    selectedIds: state.events.selected ? Array.from(state.events.selected).filter((id) => id !== 'ROOT') : [],
  }))

  const handleExport = async () => {
    await navigator.clipboard?.writeText(query.serialize())
  }

  return (
    <header className="top-bar">
      <div className="document-pill">
        <MousePointer2 size={16} />
        <span>Builder Thinking</span>
      </div>
      <div className="top-actions">
        <IconButton label="Undo" icon={Undo2} disabled={!canUndo} onClick={() => actions.history.undo()} />
        <IconButton label="Redo" icon={Redo2} disabled={!canRedo} onClick={() => actions.history.redo()} />
        <IconButton
          label="Delete"
          icon={Trash2}
          disabled={!selectedIds.length}
          onClick={() => selectedIds.length && actions.delete(selectedIds)}
        />
        <button className="export-button" onClick={handleExport}>
          <Download size={16} />
          Export JSON
        </button>
      </div>
    </header>
  )
}
