import { useEditor } from '@craftjs/core'
import { Braces, ChevronDown, Clipboard, Download, FileArchive, FileImage, FileText, MousePointer2, Redo2, Trash2, Undo2, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { useRef, useState } from 'react'
import aiDesignGuide from '../../ai/AI_DESIGN_GUIDE.md?raw'
import { exportDocument, parseProjectFile, parseProjectToken } from '../../export/exportDocument'
import { IconButton } from './IconButton'

export function TopBar({
  activePageId,
  getProjectExportData,
  onProjectImport,
  onPageChange,
  pages = [],
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) {
  const [exportOpen, setExportOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
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
    setExportOpen(false)
    try {
      await exportDocument(format, format === 'project' || format === 'token' ? getProjectExportData?.() : null)
    } finally {
      setWorking(null)
    }
  }

  const handleImportPick = () => {
    setImportOpen(false)
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
    setExportOpen(false)
    await navigator.clipboard?.writeText(aiDesignGuide)
  }

  const handleDownloadAiGuide = async () => {
    await exportDocument('ai-guide', aiDesignGuide)
    setExportOpen(false)
  }

  const openJsonTokenModal = () => {
    setImportOpen(false)
    setJsonTokenOpen(true)
  }

  const exportButtonLabel = working === 'import'
    ? 'Importing'
    : working
      ? `Exporting ${working.toUpperCase()}`
      : 'Export'

  return (
    <header className="top-bar">
      <div className="document-pill">
        <MousePointer2 size={16} />
        <span>Builder Thinking</span>
      </div>
      <div className="top-actions">
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
        <div className="export-dropdown">
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
            className="export-button"
            aria-expanded={importOpen}
            disabled={Boolean(working)}
            onClick={() => {
              setExportOpen(false)
              setImportOpen((current) => !current)
            }}
          >
            <Upload size={16} />
            {working === 'import' ? 'Importing' : 'Import'}
            <ChevronDown size={14} />
          </button>
          {importOpen && (
            <div className="export-menu import-menu">
              <button type="button" onClick={handleImportPick}>
                <FileArchive size={15} />
                <span>Import Project File</span>
              </button>
              <button type="button" onClick={openJsonTokenModal}>
                <Braces size={15} />
                <span>Import JSON Token</span>
              </button>
            </div>
          )}
        </div>
        <div className="export-dropdown">
          <button
            type="button"
            className="export-button"
            aria-expanded={exportOpen}
            disabled={Boolean(working)}
            onClick={() => {
              setImportOpen(false)
              setExportOpen((current) => !current)
            }}
          >
            <Download size={16} />
            {exportButtonLabel}
            <ChevronDown size={14} />
          </button>
          {exportOpen && (
            <div className="export-menu">
              <button type="button" onClick={() => handleExport('png')}>
                <FileImage size={15} />
                <span>Download PNG</span>
              </button>
              <button type="button" onClick={() => handleExport('pdf')}>
                <FileText size={15} />
                <span>Download PDF</span>
              </button>
              <button type="button" onClick={() => handleExport('project')}>
                <FileArchive size={15} />
                <span>Download Project</span>
              </button>
              <button type="button" onClick={() => handleExport('token')}>
                <Braces size={15} />
                <span>Download JSON Token</span>
              </button>
              <button type="button" onClick={handleCopyAiGuide}>
                <Clipboard size={15} />
                <span>Copy AI Guide</span>
              </button>
              <button type="button" onClick={handleDownloadAiGuide}>
                <FileText size={15} />
                <span>Download AI Guide</span>
              </button>
            </div>
          )}
        </div>
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
