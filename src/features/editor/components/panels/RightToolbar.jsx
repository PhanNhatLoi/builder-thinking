import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Inspector } from './Inspector'

export function RightToolbar({ collapsed = false, onToggleCollapsed }) {
  return (
    <>
      <button
        type="button"
        className={`drawer-float-toggle right ${collapsed ? '' : 'is-hidden'}`}
        aria-label="Expand right sidebar"
        onClick={onToggleCollapsed}
      >
        <PanelRightOpen size={20} />
      </button>
      <aside className={`right-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="right-panel-header">
          <button
            type="button"
            className="right-panel-toggle"
            aria-label="Collapse right sidebar"
            onClick={onToggleCollapsed}
          >
            <PanelRightClose size={18} />
          </button>
          <span className="right-panel-title">Inspector</span>
        </div>
        {!collapsed ? <Inspector /> : null}
      </aside>
    </>
  )
}
