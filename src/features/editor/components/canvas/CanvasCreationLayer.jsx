import { Element, useEditor } from '@craftjs/core'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImageBlock, Section, ShapeBlock, TextBlock } from './elements'

const minimumSize = {
  section: { width: 80, height: 48 },
  text: { width: 80, height: 32 },
  image: { width: 80, height: 48 },
  'shape-rectangle': { width: 48, height: 48 },
  'shape-ellipse': { width: 48, height: 48 },
  'shape-polygon': { width: 48, height: 48 },
  'shape-image': { width: 80, height: 48 },
}

const imageToolEventName = 'builder-thinking:open-image-tool'

function getElementScale(element) {
  if (!element?.offsetWidth) return 1
  return element.getBoundingClientRect().width / element.offsetWidth || 1
}

function getPoint(surface, event) {
  const rect = surface.getBoundingClientRect()
  const scale = getElementScale(surface)

  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale,
  }
}

function getClientPoint(event) {
  return {
    x: event.clientX,
    y: event.clientY,
  }
}

function getRectFromPoints(start, end, minSize, lockRatio = false) {
  let width = Math.max(Math.abs(end.x - start.x), minSize.width)
  let height = Math.max(Math.abs(end.y - start.y), minSize.height)
  if (lockRatio) {
    const size = Math.max(width, height)
    width = size
    height = size
  }
  const x = end.x >= start.x ? start.x : start.x - width
  const y = end.y >= start.y ? start.y : start.y - height

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  }
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function snapPoint(start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const angle = Math.atan2(dy, dx)
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  const length = Math.hypot(dx, dy)

  return {
    x: start.x + Math.cos(snappedAngle) * length,
    y: start.y + Math.sin(snappedAngle) * length,
  }
}

function shouldLockRect(tool, event) {
  return event.shiftKey && (tool === 'shape-rectangle' || tool === 'shape-ellipse')
}

function getLayoutProps(nodes, parentId, rect) {
  const parentLayoutMode = nodes[parentId]?.data.props.layoutMode || 'vertical'

  return parentLayoutMode === 'free'
    ? { layout: 'fixed', x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    : { layout: 'flow', width: rect.width, height: rect.height }
}

function getLineProps(first, second) {
  const x = Math.min(first.x, second.x)
  const y = Math.min(first.y, second.y)
  const width = Math.max(Math.abs(second.x - first.x), 1)
  const height = Math.max(Math.abs(second.y - first.y), 1)
  const lineDirection = (second.x - first.x) * (second.y - first.y) >= 0 ? 'down' : 'up'

  return {
    rect: {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    },
    lineDirection,
  }
}

function getPolygonProps(points) {
  const minX = Math.min(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxX = Math.max(...points.map((point) => point.x))
  const maxY = Math.max(...points.map((point) => point.y))
  const width = Math.max(maxX - minX, 1)
  const height = Math.max(maxY - minY, 1)
  const normalizedPoints = points
    .map((point) => {
      const x = ((point.x - minX) / width) * 100
      const y = ((point.y - minY) / height) * 100
      return `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`
    })
    .join(' ')

  return {
    rect: {
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(width),
      height: Math.round(height),
    },
    points: normalizedPoints,
  }
}

function getImageSize(naturalWidth, naturalHeight, surface) {
  const surfaceRect = surface.getBoundingClientRect()
  const scale = getElementScale(surface)
  const availableWidth = Math.max(surfaceRect.width / scale * 0.55, 80)
  const availableHeight = Math.max(surfaceRect.height / scale * 0.55, 80)
  const ratio = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight)

  return {
    width: Math.max(24, Math.round(naturalWidth * ratio)),
    height: Math.max(24, Math.round(naturalHeight * ratio)),
  }
}

function clampRectToSurface(rect, surface) {
  const surfaceWidth = surface.offsetWidth || rect.width
  const surfaceHeight = surface.offsetHeight || rect.height

  return {
    ...rect,
    x: Math.round(Math.max(0, Math.min(rect.x, surfaceWidth - rect.width))),
    y: Math.round(Math.max(0, Math.min(rect.y, surfaceHeight - rect.height))),
  }
}

function getImagePlacement() {
  const surface =
    document.querySelector('.page-workbench.active .page-canvas.layout-surface') ||
    document.querySelector('.page-canvas.layout-surface')

  if (!surface) return null

  return {
    point: {
      x: (surface.offsetWidth || 0) / 2,
      y: (surface.offsetHeight || 0) / 2,
    },
    surface,
    parentId: surface.dataset.nodeId || 'ROOT',
  }
}

function createToolElement(tool, props) {
  if (tool === 'section') {
    return <Element is={Section} canvas {...props} />
  }

  if (tool === 'text') {
    return <TextBlock text="New text" fontSize={24} {...props} />
  }

  if (tool === 'image') {
    return <ImageBlock {...props} />
  }

  if (tool.startsWith('shape-')) {
    const shapeType = tool.replace('shape-', '')
    return <ShapeBlock shapeType={shapeType} {...props} />
  }

  return null
}

export function CanvasCreationLayer({ activeTool, onComplete }) {
  const [draft, setDraft] = useState(null)
  const [pointDraft, setPointDraft] = useState(null)
  const fileInputRef = useRef(null)
  const latestRef = useRef(null)
  const pendingImageRef = useRef(null)
  const lastImageOpenAtRef = useRef(0)
  const pointDraftRef = useRef(null)
  const parentIdRef = useRef('ROOT')
  const surfaceRef = useRef(null)
  const startPointRef = useRef(null)
  const { actions, nodes, query } = useEditor((state) => ({
    nodes: state.nodes,
  }))
  const isCreateTool = activeTool !== 'pointer'

  latestRef.current = {
    actions,
    nodes,
    onComplete,
    query,
  }

  const previewRoot = draft ? surfaceRef.current : null
  const previewStyle = draft
    ? {
        left: draft.x,
        top: draft.y,
        width: draft.width,
        height: draft.height,
      }
    : null

  useEffect(() => {
    const openImagePicker = () => {
      const placement = getImagePlacement()
      if (!placement) {
        latestRef.current.onComplete?.()
        return
      }

      pendingImageRef.current = placement
      lastImageOpenAtRef.current = Date.now()
      fileInputRef.current?.click()
      latestRef.current.onComplete?.()
    }

    window.addEventListener(imageToolEventName, openImagePicker)
    return () => window.removeEventListener(imageToolEventName, openImagePicker)
  }, [])

  useEffect(() => {
    if (!isCreateTool) {
      setDraft(null)
      setPointDraft(null)
      pointDraftRef.current = null
      return undefined
    }

    if (activeTool === 'shape-image') {
      const frame = requestAnimationFrame(() => {
        if (Date.now() - lastImageOpenAtRef.current > 500) {
          const event = new Event(imageToolEventName)
          window.dispatchEvent(event)
        }
      })
      return () => cancelAnimationFrame(frame)
    }

    const updatePointDraft = (nextDraft) => {
      pointDraftRef.current = nextDraft
      setPointDraft(nextDraft)
    }

    const addElement = (tool, surface, parentId, rect, extraProps = {}) => {
      const latest = latestRef.current
      const layoutProps = getLayoutProps(latest.nodes, parentId, rect)
      const element = createToolElement(tool, { ...layoutProps, ...extraProps })

      if (!element) return

      const tree = latest.query.parseReactElement(element).toNodeTree()
      latest.actions.addNodeTree(tree, parentId)
      latest.actions.selectNode(tree.rootNodeId)
      latest.onComplete?.()
    }

    const handleMouseDown = (event) => {
      const surface = event.target.closest?.('.layout-surface')
      if (!surface || event.button !== 0) return

      event.preventDefault()
      event.stopPropagation()

      surfaceRef.current = surface
      parentIdRef.current = surface.dataset.nodeId || surface.closest('.node-shell')?.dataset.nodeId || 'ROOT'

      if (activeTool === 'shape-line') {
        const surfacePoint = getPoint(surface, event)
        const clientPoint = getClientPoint(event)
        const current = pointDraftRef.current

        if (!current || current.tool !== activeTool || current.parentId !== parentIdRef.current) {
          updatePointDraft({
            tool: activeTool,
            parentId: parentIdRef.current,
            surface,
            points: [surfacePoint],
            clientPoints: [clientPoint],
            hover: clientPoint,
          })
          return
        }

        const finalPoint = event.shiftKey ? snapPoint(current.points[0], surfacePoint) : surfacePoint
        const { rect, lineDirection } = getLineProps(current.points[0], finalPoint)
        updatePointDraft(null)
        addElement(activeTool, surface, current.parentId, rect, { lineDirection })
        return
      }

      if (activeTool === 'shape-polygon') {
        const surfacePoint = getPoint(surface, event)
        const clientPoint = getClientPoint(event)
        const current = pointDraftRef.current

        if (!current || current.tool !== activeTool || current.parentId !== parentIdRef.current) {
          updatePointDraft({
            tool: activeTool,
            parentId: parentIdRef.current,
            surface,
            points: [surfacePoint],
            clientPoints: [clientPoint],
            hover: clientPoint,
          })
          return
        }

        const isClosing = current.points.length >= 3 && distance(current.points[0], surfacePoint) <= 10 / getElementScale(surface)
        if (isClosing) {
          const { rect, points } = getPolygonProps(current.points)
          updatePointDraft(null)
          addElement(activeTool, surface, current.parentId, rect, { points })
          return
        }

        const nextSurfacePoint = event.shiftKey ? snapPoint(current.points.at(-1), surfacePoint) : surfacePoint
        const nextClientPoint = event.shiftKey ? snapPoint(current.clientPoints.at(-1), clientPoint) : clientPoint

        updatePointDraft({
          ...current,
          points: [...current.points, nextSurfacePoint],
          clientPoints: [...current.clientPoints, nextClientPoint],
          hover: nextClientPoint,
        })
        return
      }

      startPointRef.current = getPoint(surface, event)
      setDraft(getRectFromPoints(startPointRef.current, startPointRef.current, minimumSize[activeTool], shouldLockRect(activeTool, event)))

      window.addEventListener('mousemove', handleMouseMove, true)
      window.addEventListener('pointermove', handleMouseMove, true)
      window.addEventListener('mouseup', handleMouseUp, true)
      window.addEventListener('pointerup', handleMouseUp, true)
    }

    const handleMouseMove = (event) => {
      const current = pointDraftRef.current
      if (current) {
        const clientPoint = getClientPoint(event)
        updatePointDraft({
          ...current,
          hover: event.shiftKey && current.clientPoints.length ? snapPoint(current.clientPoints.at(-1), clientPoint) : clientPoint,
        })
      }

      const surface = surfaceRef.current
      const startPoint = startPointRef.current
      if (!surface || !startPoint) return
      setDraft(getRectFromPoints(startPoint, getPoint(surface, event), minimumSize[activeTool], shouldLockRect(activeTool, event)))
    }

    const handleMouseUp = (event) => {
      const surface = surfaceRef.current
      const startPoint = startPointRef.current
      if (!startPoint || !surface) return

      event.preventDefault()
      event.stopPropagation()

      const rect = getRectFromPoints(startPoint, getPoint(surface, event), minimumSize[activeTool], shouldLockRect(activeTool, event))
      const parentId = parentIdRef.current
      addElement(activeTool, surface, parentId, rect)

      setDraft(null)
      startPointRef.current = null
      surfaceRef.current = null
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('pointermove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
      window.removeEventListener('pointerup', handleMouseUp, true)
    }

    window.addEventListener('mousedown', handleMouseDown, true)
    window.addEventListener('mousemove', handleMouseMove, true)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown, true)
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('pointermove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
      window.removeEventListener('pointerup', handleMouseUp, true)
    }
  }, [activeTool, isCreateTool])

  const handleImageFile = (file) => {
    const placement = pendingImageRef.current
    pendingImageRef.current = null
    if (!file || !file.type.startsWith('image/') || !placement) return

    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const size = getImageSize(image.naturalWidth || 240, image.naturalHeight || 160, placement.surface)
        const rect = {
          x: Math.round(placement.point.x - size.width / 2),
          y: Math.round(placement.point.y - size.height / 2),
          width: size.width,
          height: size.height,
        }
        const latest = latestRef.current
        const layoutProps = getLayoutProps(latest.nodes, placement.parentId, clampRectToSurface(rect, placement.surface))
        const element = createToolElement('shape-image', {
          ...layoutProps,
          fillType: 'image',
          imageSrc: String(reader.result || ''),
          imagePositionX: 50,
          imagePositionY: 50,
          imageSize: 'cover',
          shapeType: 'image',
        })
        const tree = latest.query.parseReactElement(element).toNodeTree()
        latest.actions.addNodeTree(tree, placement.parentId)
        latest.actions.selectNode(tree.rootNodeId)
        latest.onComplete?.()
      }
      image.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  }

  const pointPreview = pointDraft ? [...pointDraft.clientPoints, pointDraft.hover].filter(Boolean) : []

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          handleImageFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {previewRoot && previewStyle &&
        createPortal(
          <div className="creation-preview" style={previewStyle}>
            <div className="dimension-badge creation-dimension-badge">
              {draft.width} x {draft.height}
            </div>
          </div>,
          previewRoot,
        )}
      {pointDraft &&
        createPortal(
          <svg className="point-creation-preview">
            <polyline points={pointPreview.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#0ea5e9" strokeDasharray="6 5" strokeWidth="2" />
            {pointDraft.clientPoints.map((point, index) => (
              <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={index === 0 ? 5 : 4} fill={index === 0 ? '#0b5cad' : '#0ea5e9'} stroke="#ffffff" strokeWidth="2" />
            ))}
          </svg>,
          document.body,
        )}
    </>
  )
}
