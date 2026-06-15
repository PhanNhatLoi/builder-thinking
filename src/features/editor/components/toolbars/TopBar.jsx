import { useEditor } from '@craftjs/core'
import { Braces, CheckCircle2, ChevronDown, ChevronRight, Clipboard, Clock3, Download, FileArchive, FileImage, FileText, FolderOpen, Redo2, Save, Trash2, Undo2, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { useRef, useState } from 'react'
import aiDesignGuide from '../../ai/AI_DESIGN_GUIDE.md?raw'
import { exportDocument, parseProjectFile, parseProjectToken } from '../../export/exportDocument'
import { IconButton } from './IconButton'

export function TopBar({
  activePageId,
  autosaveError = '',
  autosaveStatus = 'idle',
  getProjectExportData,
  isTemplate = false,
  onProjectImport,
  onPageChange,
  onProjectSave,
  onTemplateChange,
  pages = [],
  templateStatus = 'idle',
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) {
  const [fileOpen, setFileOpen] = useState(false)
  const [jsonTokenOpen, setJsonTokenOpen] = useState(false)
  const [jsonToken, setJsonToken] = useState('')
  const [working, setWorking] = useState(null)
  const importInputRef = useRef(null)
  const { actions, canUndo, canRedo, selectedIds } = useEditor((state, q) => ({
    canUndo: q.history.canUndo(),
    canRedo: q.history.canRedo(),
    selectedIds: state.events.selected ? Array.from(state.events.selected).filter((id) => id !== 'ROOT') : [],
  }))

  const handleExport = async (format) => {
    if (working) return

    setWorking(format)
    setFileOpen(false)
    try {
      await exportDocument(format, format === 'project' || format === 'token' ? getProjectExportData?.() : null)
    } finally {
      setWorking(null)
    }
  }

  const handleImportPick = () => {
    setFileOpen(false)
    importInputRef.current?.click()
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || working) return

    setWorking('import')
    try {
      onProjectImport?.(await parseProjectFile(file))
    } catch (error) {
      console.error(error)
      window.alert('Unable to import this project file.')
    } finally {
      setWorking(null)
    }
  }

  const handleJsonTokenImport = async () => {
    if (!jsonToken.trim() || working) return

    setWorking('import')
    try {
      onProjectImport?.(await parseProjectToken(jsonToken))
      setJsonToken('')
      setJsonTokenOpen(false)
    } catch (error) {
      console.error(error)
      window.alert('Unable to import this JSON token.')
    } finally {
      setWorking(null)
    }
  }

  const handleCopyAiGuide = async () => {
    setFileOpen(false)
    await navigator.clipboard?.writeText(aiDesignGuide)
  }

  const handleDownloadAiGuide = async () => {
    await exportDocument('ai-guide', aiDesignGuide)
    setFileOpen(false)
  }

  const openJsonTokenModal = () => {
    setFileOpen(false)
    setJsonTokenOpen(true)
  }

  const fileButtonLabel = working === 'import'
    ? 'Importing'
    : working
      ? `Exporting ${working.toUpperCase()}`
      : 'File'
  const autosaveLabel = {
    idle: 'Save',
    pending: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    error: autosaveError || 'Autosave failed',
  }[autosaveStatus]
  const showSaveControl = typeof onProjectSave === 'function'
  const showTemplateControl = typeof onTemplateChange === 'function'

  return (
    <header className="top-bar">
      <div className="top-actions">
        <div className="file-dropdown">
          <input
            ref={importInputRef}
            type="file"
            accept=".btproj,application/octet-stream"
            aria-label="Import project file"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button
            type="button"
            className="file-button"
            aria-expanded={fileOpen}
            disabled={Boolean(working)}
            onClick={() => setFileOpen((current) => !current)}
          >
            <FolderOpen size={16} />
            {fileButtonLabel}
            <ChevronDown size={14} />
          </button>
          {fileOpen && (
            <div className="file-menu">
              <div className="file-menu-item has-submenu" tabIndex={0}>
                <span className="file-menu-label">
                  <Upload size={15} />
                  Import
                </span>
                <ChevronRight size={14} />
                <div className="file-submenu">
                  <button type="button" onClick={handleImportPick}>
                    <FileArchive size={15} />
                    <span>Project File</span>
                  </button>
                  <button type="button" onClick={openJsonTokenModal}>
                    <Braces size={15} />
                    <span>JSON Token</span>
                  </button>
                </div>
              </div>
              <div className="file-menu-item has-submenu" tabIndex={0}>
                <span className="file-menu-label">
                  <Download size={15} />
                  Export
                </span>
                <ChevronRight size={14} />
                <div className="file-submenu">
                  <button type="button" onClick={() => handleExport('png')}>
                    <FileImage size={15} />
                    <span>PNG</span>
                  </button>
                  <button type="button" onClick={() => handleExport('pdf')}>
                    <FileText size={15} />
                    <span>PDF</span>
                  </button>
                  <button type="button" onClick={() => handleExport('project')}>
                    <FileArchive size={15} />
                    <span>Project</span>
                  </button>
                  <button type="button" onClick={() => handleExport('token')}>
                    <Braces size={15} />
                    <span>JSON Token</span>
                  </button>
                </div>
              </div>
              <div className="file-menu-item has-submenu" tabIndex={0}>
                <span className="file-menu-label">
                  <Clipboard size={15} />
                  AI Guide
                </span>
                <ChevronRight size={14} />
                <div className="file-submenu">
                  <button type="button" onClick={handleCopyAiGuide}>
                    <Clipboard size={15} />
                    <span>Copy Guide</span>
                  </button>
                  <button type="button" onClick={handleDownloadAiGuide}>
                    <FileText size={15} />
                    <span>Download Guide</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="page-controls" aria-label="Page controls">
          <select className="page-select" value={activePageId} aria-label="Active page" onChange={(event) => onPageChange?.(event.target.value)}>
            {pages.map((page, index) => (
              <option key={page.id} value={page.id}>
                {page.name || `Page ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
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
      </div>
      <div className="top-status-actions">
        {showTemplateControl ? (
          <label className={`template-toggle ${isTemplate ? 'active' : ''} ${templateStatus}`}>
            <input
              type="checkbox"
              checked={isTemplate}
              disabled={templateStatus === 'saving'}
              onChange={(event) => onTemplateChange(event.target.checked)}
            />
            <span className="template-toggle-box" aria-hidden="true" />
            <span>{templateStatus === 'saving' ? 'Updating' : 'Template'}</span>
          </label>
        ) : null}
        {showSaveControl ? (
          <button
            type="button"
            className={`autosave-status ${autosaveStatus}`}
            disabled={autosaveStatus === 'saving'}
            title={`${autosaveLabel} (Cmd/Ctrl+S)`}
            onClick={onProjectSave}
          >
            {autosaveStatus === 'saved' ? <CheckCircle2 size={16} /> : autosaveStatus === 'pending' ? <Clock3 size={16} /> : <Save size={16} />}
            <span>{autosaveLabel}</span>
          </button>
        ) : null}
      </div>
      {jsonTokenOpen && (
        <div className="token-modal-backdrop" role="presentation">
          <div className="token-modal" role="dialog" aria-modal="true" aria-label="Import JSON token">
            <div className="token-modal-header">
              <div>
                <h2>Import JSON Token</h2>
                <p>Paste a raw project token or a CraftJS serialized page.</p>
              </div>
              <button type="button" className="token-close" aria-label="Close JSON token import" onClick={() => setJsonTokenOpen(false)}>
                x
              </button>
            </div>
            <textarea
              className="token-textarea"
              value={jsonToken}
              placeholder='Paste JSON token here, for example: {"schema":"builder-thinking.project","version":1,"pages":[...]}'
              spellCheck={false}
              onChange={(event) => setJsonToken(event.target.value)}
            />
            <div className="token-actions">
              <button type="button" className="token-secondary" onClick={() => setJsonTokenOpen(false)}>
                Cancel
              </button>
              <button type="button" className="token-primary" disabled={!jsonToken.trim() || Boolean(working)} onClick={handleJsonTokenImport}>
                Import Token
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
