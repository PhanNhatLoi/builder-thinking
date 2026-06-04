import { Element, Frame, useEditor } from '@craftjs/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CanvasRoot } from './canvas/CanvasRoot'
import { CanvasCreationLayer } from './canvas/CanvasCreationLayer'
import { SelectionMarqueeLayer } from './canvas/SelectionMarqueeLayer'
import { StaticPagePreview } from './canvas/StaticPagePreview'
import { ImageBlock, Section, TextBlock } from './canvas/elements'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { Copy, FilePlus2, GripVertical, Trash2 } from 'lucide-react'
import { LeftSidebar } from './panels/LeftSidebar'
import { RightToolbar } from './panels/RightToolbar'
import { BottomComponentToolbar } from './toolbars/BottomComponentToolbar'
import { TopBar } from './toolbars/TopBar'
import { isEditableTarget } from '../utils/editorUtils'

const zoomSteps = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]
const initialPages = [{ id: 'page-1', name: 'Page 1', serialized: null }]

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

export function EditorWorkspace() {
  const [activeTool, setActiveTool] = useState('pointer')
  const [activePageId, setActivePageId] = useState('page-1')
  const [pages, setPages] = useState(initialPages)
  const [zoom, setZoom] = useState(1)
  const activePageIdRef = useRef('page-1')
  const blankPageSerializedRef = useRef(null)
  const lastWheelZoomAtRef = useRef(0)
  const pageCounterRef = useRef(1)
  const pagesRef = useRef(initialPages)
  const saveTimerRef = useRef(null)
  const { actions, nodes, query, selectedIds } = useEditor((state) => ({
    nodes: state.nodes,
    selectedIds: state.events.selected ? Array.from(state.events.selected) : [],
  }))
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
    setPages((currentPages) => {
      const nextPages = typeof updater === 'function' ? updater(currentPages) : updater
      pagesRef.current = nextPages
      return nextPages
    })
  }, [])

  const serializeCurrentPage = useCallback(() => query.serialize(), [query])

  const persistActivePage = useCallback((serialized = serializeCurrentPage()) => {
    updatePages((currentPages) =>
      currentPages.map((page) => (page.id === activePageIdRef.current ? { ...page, serialized } : page)),
    )
    return serialized
  }, [serializeCurrentPage, updatePages])

  useEffect(() => {
    activePageIdRef.current = activePageId
  }, [activePageId])

  useEffect(() => {
    pagesRef.current = pages
  }, [pages])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const serialized = query.serialize()
      if (!blankPageSerializedRef.current) {
        blankPageSerializedRef.current = serialized
      }

      updatePages((currentPages) => currentPages.map((page) => (page.id === 'page-1' && !page.serialized ? { ...page, serialized } : page)))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [query, updatePages])

  useEffect(() => {
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
    activePageIdRef.current = pageId
    setActivePageId(pageId)
    actions.deserialize(nextSerialized)
    actions.selectNode('ROOT')
  }, [actions, persistActivePage])

  const addBlankPage = useCallback((afterPageId = null) => {
    const currentSerialized = persistActivePage()
    const nextIndex = pageCounterRef.current + 1
    pageCounterRef.current = nextIndex
    const nextPage = {
      id: `page-${nextIndex}`,
      name: `Page ${nextIndex}`,
      serialized: blankPageSerializedRef.current || currentSerialized,
    }

    updatePages((currentPages) => {
      const sourceIndex = currentPages.findIndex((page) => page.id === afterPageId)
      const insertIndex = sourceIndex === -1 ? currentPages.length : sourceIndex + 1
      return [...currentPages.slice(0, insertIndex), nextPage, ...currentPages.slice(insertIndex)]
    })
    activePageIdRef.current = nextPage.id
    setActivePageId(nextPage.id)
    actions.deserialize(nextPage.serialized)
    actions.selectNode('ROOT')
  }, [actions, persistActivePage, updatePages])

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
    activePageIdRef.current = nextPage.id
    setActivePageId(nextPage.id)
    actions.deserialize(sourceSerialized)
    actions.selectNode('ROOT')
  }, [actions, persistActivePage, updatePages])

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
    activePageIdRef.current = nextActivePage.id
    setActivePageId(nextActivePage.id)
    updatePages(nextPages)
    actions.deserialize(nextActivePage.serialized || blankPageSerializedRef.current)
    actions.selectNode('ROOT')
  }, [actions, persistActivePage, updatePages])

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
    <div className="workspace">
      <KeyboardShortcuts />
      <LeftSidebar />
      <section className="middle">
        <TopBar
          activePageId={activePageId}
          onPageChange={openPage}
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
                        <Frame>
                          <Element is={CanvasRoot} canvas>
                          </Element>
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
      <RightToolbar />
    </div>
  )
}
