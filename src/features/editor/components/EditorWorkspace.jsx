import { Element, Frame } from '@craftjs/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CanvasRoot } from './canvas/CanvasRoot'
import { CanvasCreationLayer } from './canvas/CanvasCreationLayer'
import { SelectionMarqueeLayer } from './canvas/SelectionMarqueeLayer'
import { ImageBlock, Section, TextBlock } from './canvas/elements'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { LeftSidebar } from './panels/LeftSidebar'
import { RightToolbar } from './panels/RightToolbar'
import { BottomComponentToolbar } from './toolbars/BottomComponentToolbar'
import { TopBar } from './toolbars/TopBar'
import { isEditableTarget } from '../utils/editorUtils'

const zoomSteps = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]

function getNextZoom(currentZoom, direction) {
  const currentIndex = zoomSteps.findIndex((step) => step >= currentZoom)
  if (direction > 0) {
    const baseIndex = currentIndex === -1 ? zoomSteps.length - 1 : currentIndex
    return zoomSteps[Math.min(zoomSteps.length - 1, currentZoom < zoomSteps[baseIndex] ? baseIndex : baseIndex + 1)]
  }

  const baseIndex = currentIndex === -1 ? zoomSteps.length - 1 : currentIndex
  return zoomSteps[Math.max(0, currentZoom <= zoomSteps[baseIndex] ? baseIndex - 1 : baseIndex)]
}

export function EditorWorkspace() {
  const [activeTool, setActiveTool] = useState('pointer')
  const [zoom, setZoom] = useState(1)
  const lastWheelZoomAtRef = useRef(0)
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

  return (
    <div className="workspace">
      <KeyboardShortcuts />
      <LeftSidebar />
      <section className="middle">
        <TopBar zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomReset={resetZoom} />
        <div className="canvas-workspace" onWheel={handleCanvasWheel}>
          <div className="canvas-scale" style={{ '--canvas-zoom': zoom }}>
            <Frame>
              <Element is={CanvasRoot} canvas>
              </Element>
            </Frame>
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
