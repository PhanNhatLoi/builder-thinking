import { Element, Frame, useEditor } from '@craftjs/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CanvasRoot } from './canvas/CanvasRoot'
import { CanvasCreationLayer } from './canvas/CanvasCreationLayer'
import { ClipboardPasteLayer } from './canvas/ClipboardPasteLayer'
import { SelectionMarqueeLayer } from './canvas/SelectionMarqueeLayer'
import { StaticPagePreview } from './canvas/StaticPagePreview'
import { ImageBlock, Section, TextBlock } from './canvas/elements'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { Copy, FilePlus2, GripVertical, Monitor, Trash2, X } from 'lucide-react'
import { LeftSidebar } from './panels/LeftSidebar'
import { RightToolbar } from './panels/RightToolbar'
import { BottomComponentToolbar } from './toolbars/BottomComponentToolbar'
import { TopBar } from './toolbars/TopBar'
import { isEditableTarget } from '../utils/editorUtils'

const zoomSteps = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]
const initialPages = [{ id: 'page-1', name: 'Page 1', serialized: null }]
const desktopNoticeStorageKey = 'builder-thinking-desktop-notice-dismissed'

function createBlankPageSerialized() {
  return JSON.stringify({
    ROOT: {
      type: {
        resolvedName: 'CanvasRoot',
      },
      isCanvas: true,
      props: CanvasRoot.craft.props,
      displayName: CanvasRoot.craft.displayName,
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
  })
}

function getNextZoom(currentZoom, direction) {
  const currentIndex = zoomSteps.findIndex((step) => step >= currentZoom)
  if (direction > 0) {
    const baseIndex = currentIndex === -1 ? zoomSteps.length - 1 : currentIndex
    return zoomSteps[Math.min(zoomSteps.length - 1, currentZoom < zoomSteps[baseIndex] ? baseIndex : baseIndex + 1)]
  }

  const baseIndex = currentIndex === -1 ? zoomSteps.length - 1 : currentIndex
  return zoomSteps[Math.max(0, currentZoom <= zoomSteps[baseIndex] ? baseIndex - 1 : baseIndex)]
}

function pageLabel(page, index) {
  return page.name ?? `Page ${index + 1}`
}

function pageCounterValue(pages) {
  return pages.reduce((maxValue, page, index) => {
    const numericId = Number.parseInt(String(page.id || '').replace('page-', ''), 10)
    return Math.max(maxValue, Number.isFinite(numericId) ? numericId : index + 1)
  }, 1)
}

export function EditorWorkspace({
  autosaveError = '',
  autosaveStatus = 'idle',
  initialProject = null,
  onBack,
  onProjectChange,
  onProjectNameSave,
  onProjectSave,
  presentation = 'full',
  projectName = '',
}) {
  const [activeTool, setActiveTool] = useState('pointer')
  const [activeFrameData, setActiveFrameData] = useState(null)
  const [activePageId, setActivePageId] = useState('page-1')
  const [pages, setPages] = useState(initialPages)
  const [pageLoadToken, setPageLoadToken] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isCompactViewport, setIsCompactViewport] = useState(false)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [projectChangeVersion, setProjectChangeVersion] = useState(0)
  const [desktopNoticeDismissed, setDesktopNoticeDismissed] = useState(() => (
    window.localStorage.getItem(desktopNoticeStorageKey) === 'true'
  ))
  const activePageIdRef = useRef('page-1')
  const blankPageSerializedRef = useRef(createBlankPageSerialized())
  const hydratingPageRef = useRef(false)
  const lastWheelZoomAtRef = useRef(0)
  const initialProjectRef = useRef(null)
  const pageCounterRef = useRef(1)
  const pendingPageLoadRef = useRef(null)
  const pagesRef = useRef(initialPages)
  const saveTimerRef = useRef(null)
  const changeTimerRef = useRef(null)
  const { actions, nodes, query, selectedIds } = useEditor((state) => ({
    nodes: state.nodes,
    selectedIds: state.events.selected ? Array.from(state.events.selected) : [],
  }))
  const dismissDesktopNotice = useCallback(() => {
    window.localStorage.setItem(desktopNoticeStorageKey, 'true')
    setDesktopNoticeDismissed(true)
  }, [])
  const zoomIn = useCallback(() => setZoom((current) => getNextZoom(current, 1)), [])
  const zoomOut = useCallback(() => setZoom((current) => getNextZoom(current, -1)), [])
  const resetZoom = useCallback(() => setZoom(1), [])
  const handleCanvasWheel = useCallback((event) => {
    if (!event.metaKey && !event.ctrlKey) return

    event.preventDefault()
    event.stopPropagation()

    const now = Date.now()
    if (now - lastWheelZoomAtRef.current < 80) return

    lastWheelZoomAtRef.current = now
    if (event.deltaY < 0) {
      zoomIn()
    } else if (event.deltaY > 0) {
      zoomOut()
    }
  }, [zoomIn, zoomOut])

  const updatePages = useCallback((updater) => {
    const nextPages = typeof updater === 'function' ? updater(pagesRef.current) : updater
    pagesRef.current = nextPages
    setPages(nextPages)
    setProjectChangeVersion((version) => version + 1)
    return nextPages
  }, [])

  const serializeCurrentPage = useCallback(() => query.serialize(), [query])

  const persistActivePage = useCallback((serialized = serializeCurrentPage()) => {
    const nextPages = pagesRef.current.map((page) => (
      page.id === activePageIdRef.current ? { ...page, serialized } : page
    ))
    pagesRef.current = nextPages
    setPages(nextPages)
    return serialized
  }, [serializeCurrentPage])

  const loadPage = useCallback((pageId, serialized) => {
    window.clearTimeout(saveTimerRef.current)
    hydratingPageRef.current = true
    pendingPageLoadRef.current = { pageId, serialized }
    setActiveFrameData(serialized)
    activePageIdRef.current = pageId
    setActivePageId(pageId)
    setPageLoadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    activePageIdRef.current = activePageId
  }, [activePageId])

  useEffect(() => {
    const pendingPageLoad = pendingPageLoadRef.current
    if (!pendingPageLoad || pendingPageLoad.pageId !== activePageId) return undefined

    pendingPageLoadRef.current = null
    const selectFrame = window.requestAnimationFrame(() => {
      actions.selectNode('ROOT')

      window.requestAnimationFrame(() => {
        hydratingPageRef.current = false
      })
    })

    return () => window.cancelAnimationFrame(selectFrame)
  }, [actions, activePageId, pageLoadToken])

  useEffect(() => {
    pagesRef.current = pages
  }, [pages])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const serialized = query.serialize()

      updatePages((currentPages) => currentPages.map((page) => (page.id === 'page-1' && !page.serialized ? { ...page, serialized } : page)))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [query, updatePages])

  useEffect(() => {
    if (hydratingPageRef.current) return undefined

    window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      persistActivePage()
    }, 250)

    return () => window.clearTimeout(saveTimerRef.current)
  }, [nodes, persistActivePage])

  const openPage = useCallback((pageId) => {
    if (pageId === activePageIdRef.current) return

    const currentSerialized = persistActivePage()
    const targetPage = pagesRef.current.find((page) => page.id === pageId)
    if (!targetPage) return

    const nextSerialized = targetPage.serialized || blankPageSerializedRef.current || currentSerialized
    loadPage(pageId, nextSerialized)
  }, [loadPage, persistActivePage])

  const addBlankPage = useCallback((afterPageId = null) => {
    persistActivePage()
    const nextIndex = pageCounterRef.current + 1
    pageCounterRef.current = nextIndex
    const nextPage = {
      id: `page-${nextIndex}`,
      name: `Page ${nextIndex}`,
      serialized: createBlankPageSerialized(),
    }

    updatePages((currentPages) => {
      const sourceIndex = currentPages.findIndex((page) => page.id === afterPageId)
      const insertIndex = sourceIndex === -1 ? currentPages.length : sourceIndex + 1
      return [...currentPages.slice(0, insertIndex), nextPage, ...currentPages.slice(insertIndex)]
    })
    loadPage(nextPage.id, nextPage.serialized)
  }, [loadPage, persistActivePage, updatePages])

  const duplicatePage = useCallback((pageId = activePageIdRef.current) => {
    const currentSerialized = pageId === activePageIdRef.current ? persistActivePage() : null
    const sourcePage = pagesRef.current.find((page) => page.id === pageId)
    const sourceSerialized = currentSerialized || sourcePage?.serialized || blankPageSerializedRef.current
    if (!sourceSerialized) return

    const nextIndex = pageCounterRef.current + 1
    pageCounterRef.current = nextIndex
    const nextPage = {
      id: `page-${nextIndex}`,
      name: `${sourcePage?.name || 'Page'} copy`,
      serialized: sourceSerialized,
    }

    updatePages((currentPages) => {
      const sourceIndex = currentPages.findIndex((page) => page.id === pageId)
      const insertIndex = sourceIndex === -1 ? currentPages.length : sourceIndex + 1
      return [...currentPages.slice(0, insertIndex), nextPage, ...currentPages.slice(insertIndex)]
    })
    loadPage(nextPage.id, sourceSerialized)
  }, [loadPage, persistActivePage, updatePages])

  const renamePage = useCallback((pageId, name) => {
    updatePages((currentPages) => currentPages.map((page) => (page.id === pageId ? { ...page, name } : page)))
  }, [updatePages])

  const reorderPage = useCallback((sourcePageId, targetPageId) => {
    if (!sourcePageId || sourcePageId === targetPageId) return
    persistActivePage()
    updatePages((currentPages) => {
      const sourceIndex = currentPages.findIndex((page) => page.id === sourcePageId)
      const targetIndex = currentPages.findIndex((page) => page.id === targetPageId)
      if (sourceIndex === -1 || targetIndex === -1) return currentPages

      const nextPages = [...currentPages]
      const [sourcePage] = nextPages.splice(sourceIndex, 1)
      nextPages.splice(targetIndex, 0, sourcePage)
      return nextPages
    })
  }, [persistActivePage, updatePages])

  const deletePage = useCallback((pageId = activePageIdRef.current) => {
    const currentPages = pagesRef.current
    if (currentPages.length <= 1) return

    const pageIndex = currentPages.findIndex((page) => page.id === pageId)
    if (pageIndex === -1) return

    const nextPages = currentPages.filter((page) => page.id !== pageId)
    const deletingActivePage = pageId === activePageIdRef.current

    if (!deletingActivePage) {
      persistActivePage()
      updatePages(nextPages)
      return
    }

    const nextActivePage = nextPages[Math.min(pageIndex, nextPages.length - 1)]
    updatePages(nextPages)
    loadPage(nextActivePage.id, nextActivePage.serialized || blankPageSerializedRef.current)
  }, [loadPage, persistActivePage, updatePages])

  const getProjectExportData = useCallback(() => ({
    activePageId: activePageIdRef.current,
    pages: pagesRef.current.map((page) => (
      page.id === activePageIdRef.current ? { ...page, serialized: persistActivePage() } : page
    )),
  }), [persistActivePage])

  const saveProject = useCallback(() => {
    return onProjectSave?.(getProjectExportData())
  }, [getProjectExportData, onProjectSave])

  const importProject = useCallback((projectData) => {
    if (!projectData?.pages?.length) return

    const importedPages = projectData.pages.map((page, index) => ({
      id: page.id || `page-${index + 1}`,
      name: page.name || `Page ${index + 1}`,
      serialized: page.serialized || blankPageSerializedRef.current,
    }))
    const nextActivePage = importedPages.find((page) => page.id === projectData.activePageId) || importedPages[0]

    pageCounterRef.current = pageCounterValue(importedPages)
    updatePages(importedPages)
    loadPage(nextActivePage.id, nextActivePage.serialized || blankPageSerializedRef.current)
  }, [loadPage, updatePages])

  useEffect(() => {
    if (!initialProject || initialProjectRef.current === initialProject) return

    initialProjectRef.current = initialProject
    importProject(initialProject)
  }, [importProject, initialProject])

  useEffect(() => {
    if (!onProjectChange || hydratingPageRef.current) return undefined

    window.clearTimeout(changeTimerRef.current)
    changeTimerRef.current = window.setTimeout(() => {
      onProjectChange(getProjectExportData())
    }, 350)

    return () => window.clearTimeout(changeTimerRef.current)
  }, [getProjectExportData, nodes, onProjectChange, projectChangeVersion])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target) || (!event.metaKey && !event.ctrlKey)) return
      const key = event.key.toLowerCase()

      if (key === '=' || key === '+') {
        event.preventDefault()
        zoomIn()
      } else if (key === '-') {
        event.preventDefault()
        zoomOut()
      } else if (key === '0') {
        event.preventDefault()
        resetZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetZoom, zoomIn, zoomOut])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || (!event.metaKey && !event.ctrlKey)) return
      if (event.key.toLowerCase() !== 's') return

      event.preventDefault()
      saveProject()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveProject])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)')
    const syncViewport = () => {
      setIsCompactViewport(media.matches)
      setLeftPanelCollapsed(media.matches)
      setRightPanelCollapsed(media.matches)
    }

    syncViewport()
    media.addEventListener('change', syncViewport)
    return () => media.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      if (!selectedIds.includes('ROOT') || pagesRef.current.length <= 1) return

      event.preventDefault()
      deletePage(activePageIdRef.current)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deletePage, selectedIds])

  return (
    <div className={`workspace ${presentation === 'demo' ? 'is-demo' : ''}`}>
      <KeyboardShortcuts />
      <ClipboardPasteLayer />
      {isCompactViewport && !desktopNoticeDismissed ? (
        <div className="desktop-notice-backdrop" role="presentation">
          <section className="desktop-notice" role="dialog" aria-modal="true" aria-labelledby="desktop-notice-title">
            <button type="button" className="desktop-notice-close" aria-label="Close desktop notice" onClick={dismissDesktopNotice}>
              <X size={18} />
            </button>
            <div className="desktop-notice-icon">
              <Monitor size={22} />
            </div>
            <h2 id="desktop-notice-title">Desktop recommended</h2>
            <p>Builder Thinking works best on desktop. Tablet and mobile can be used for quick edits, but detailed editing is better on a larger screen.</p>
            <button type="button" className="desktop-notice-action" onClick={dismissDesktopNotice}>
              Continue anyway
            </button>
          </section>
        </div>
      ) : null}
      <LeftSidebar
        collapsed={isCompactViewport && leftPanelCollapsed}
        onBack={onBack}
        onProjectNameSave={onProjectNameSave}
        onToggleCollapsed={() => setLeftPanelCollapsed((collapsed) => !collapsed)}
        projectName={projectName}
      />
      <section className="middle">
        <TopBar
          activePageId={activePageId}
          autosaveError={autosaveError}
          autosaveStatus={autosaveStatus}
          getProjectExportData={getProjectExportData}
          onProjectImport={importProject}
          onPageChange={openPage}
          onProjectSave={saveProject}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={resetZoom}
          pages={pages}
          zoom={zoom}
        />
        <div className="canvas-workspace" onWheel={handleCanvasWheel}>
          <div className="canvas-scale" style={{ '--canvas-zoom': zoom }}>
            <div className="pages-stack">
              {pages.map((page, index) => {
                const isActive = page.id === activePageId

                return (
                  <section
                    key={page.id}
                    className={`page-workbench ${isActive ? 'active' : ''}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', page.id)
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      reorderPage(event.dataTransfer.getData('text/plain'), page.id)
                    }}
                  >
                    <div className="page-workbench-header">
                      <GripVertical size={15} className="page-drag-icon" aria-hidden="true" />
                      <input
                        className="page-title-input"
                        value={pageLabel(page, index)}
                        aria-label={`Rename ${pageLabel(page, index)}`}
                        onChange={(event) => renamePage(page.id, event.target.value)}
                        onFocus={() => openPage(page.id)}
                      />
                      <button type="button" className="page-header-action" aria-label={`Duplicate ${pageLabel(page, index)}`} onClick={() => duplicatePage(page.id)}>
                        <Copy size={14} />
                      </button>
                      <button type="button" className="page-header-action" aria-label="Add blank page" onClick={() => addBlankPage(page.id)}>
                        <FilePlus2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="page-header-action"
                        aria-label={`Delete ${pageLabel(page, index)}`}
                        disabled={pages.length <= 1}
                        onClick={() => deletePage(page.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="page-workbench-body" onClick={() => !isActive && openPage(page.id)}>
                      {isActive ? (
                        <Frame key={`${activePageId}-${pageLoadToken}`} data={activeFrameData || undefined}>
                          {!activeFrameData ? (
                            <Element is={CanvasRoot} canvas>
                            </Element>
                          ) : null}
                        </Frame>
                      ) : (
                        <StaticPagePreview serialized={page.serialized} />
                      )}
                    </div>
                  </section>
                )
              })}
              <button type="button" className="add-page-inline" onClick={() => addBlankPage()}>
                + Add blank page
              </button>
            </div>
            <SelectionMarqueeLayer activeTool={activeTool} />
            <CanvasCreationLayer activeTool={activeTool} onComplete={() => setActiveTool('pointer')} zoom={zoom} />
          </div>
          <BottomComponentToolbar activeTool={activeTool} onToolChange={setActiveTool} />
        </div>
      </section>
      <RightToolbar
        collapsed={isCompactViewport && rightPanelCollapsed}
        onToggleCollapsed={() => setRightPanelCollapsed((collapsed) => !collapsed)}
      />
    </div>
  )
}
