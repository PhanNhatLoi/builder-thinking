import { Box, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { AssetsPanel } from '../assets/AssetsPanel'
import { LayersPanel } from '../layers/LayersPanel'

export function LeftSidebar({ collapsed = false, onToggleCollapsed }) {
  const [activeTab, setActiveTab] = useState('layers')

  return (
    <>
      <button
        type="button"
        className={`drawer-float-toggle left ${collapsed ? '' : 'is-hidden'}`}
        aria-label="Expand left sidebar"
        onClick={onToggleCollapsed}
      >
        <PanelLeftOpen size={20} />
      </button>
      <aside className={`left-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="left-panel-header">
          <div className="brand-mark">
            <Box size={18} />
          </div>
          <button
            type="button"
            className="left-panel-toggle"
            aria-label="Collapse left sidebar"
            onClick={onToggleCollapsed}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
        {!collapsed ? (
          <>
            <div className="left-tabs">
              <button type="button" className={activeTab === 'layers' ? 'active' : ''} onClick={() => setActiveTab('layers')}>
                Layers
              </button>
              <button type="button" className={activeTab === 'assets' ? 'active' : ''} onClick={() => setActiveTab('assets')}>
                Assets
              </button>
            </div>
            {activeTab === 'layers' ? <LayersPanel /> : <AssetsPanel />}
          </>
        ) : null}
      </aside>
    </>
  )
}
