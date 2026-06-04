import { useEditor } from '@craftjs/core'
import { Download, MousePointer2, Redo2, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { IconButton } from './IconButton'

export function TopBar({ zoom = 1, onZoomIn, onZoomOut, onZoomReset }) {
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
        <div className="zoom-controls" aria-label="Canvas zoom controls">
          <IconButton label="Zoom out" icon={ZoomOut} disabled={zoom <= 0.25} onClick={onZoomOut} />
          <button className="zoom-value" type="button" onClick={onZoomReset} title="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <IconButton label="Zoom in" icon={ZoomIn} disabled={zoom >= 4} onClick={onZoomIn} />
        </div>
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
