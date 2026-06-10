import { ArrowLeft, Box, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AssetsPanel } from '../assets/AssetsPanel'
import { LayersPanel } from '../layers/LayersPanel'

export function LeftSidebar({ collapsed = false, onBack, onProjectNameSave, onToggleCollapsed, projectName = '' }) {
  const [activeTab, setActiveTab] = useState('layers')
  const [draftProjectName, setDraftProjectName] = useState(projectName)
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    setDraftProjectName(projectName)
  }, [projectName])

  const saveProjectName = async () => {
    const nextName = draftProjectName.trim()
    if (!onProjectNameSave || !nextName || nextName === projectName) {
      setDraftProjectName(projectName)
      return
    }

    setIsSavingName(true)
    try {
      await onProjectNameSave(nextName)
    } finally {
      setIsSavingName(false)
    }
  }

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
          {onBack ? (
            <button type="button" className="brand-mark" aria-label="Back" onClick={onBack}>
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="brand-mark">
              <Box size={18} />
            </div>
          )}
          <input
            className="project-title-input"
            value={draftProjectName}
            aria-label="Project name"
            disabled={isSavingName}
            onBlur={saveProjectName}
            onChange={(event) => setDraftProjectName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
          />
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
