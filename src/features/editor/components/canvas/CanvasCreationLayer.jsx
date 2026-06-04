import { Element, useEditor } from '@craftjs/core'
import { useEffect, useMemo, useRef, useState } from 'react'
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

const pointTools = new Set(['shape-line', 'shape-polygon', 'shape-image'])

function getPoint(surface, event) {
  const rect = surface.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
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

function getImageSize(naturalWidth, naturalHeight, surface, point) {
  const surfaceRect = surface.getBoundingClientRect()
  const availableWidth = Math.max(surfaceRect.width - point.x, 80)
  const availableHeight = Math.max(surfaceRect.height - point.y, 80)
  const ratio = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight)

  return {
    width: Math.max(24, Math.round(naturalWidth * ratio)),
    height: Math.max(24, Math.round(naturalHeight * ratio)),
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
  const pointDraftRef = useRef(null)
  const parentIdRef = useRef('ROOT')
  const surfaceRef = useRef(null)
  const startClientPointRef = useRef(null)
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

  const previewStyle = useMemo(() => {
    if (!draft) return null

    return {
      left: draft.x,
      top: draft.y,
      width: draft.width,
      height: draft.height,
    }
  }, [draft])

  useEffect(() => {
    if (!isCreateTool) {
      setDraft(null)
      setPointDraft(null)
      pointDraftRef.current = null
      return undefined
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

      if (activeTool === 'shape-image') {
        pendingImageRef.current = {
          point: getPoint(surface, event),
          surface,
          parentId: parentIdRef.current,
        }
        fileInputRef.current?.click()
        return
      }

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

        const isClosing = current.points.length >= 3 && distance(current.points[0], surfacePoint) <= 10
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

      startClientPointRef.current = getClientPoint(event)
      startPointRef.current = getPoint(surface, event)
      const minSize = minimumSize[activeTool]
      setDraft(getRectFromPoints(startClientPointRef.current, startClientPointRef.current, minSize, shouldLockRect(activeTool, event)))

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

      const startClientPoint = startClientPointRef.current
      if (!startClientPoint) return
      setDraft(getRectFromPoints(startClientPoint, getClientPoint(event), minimumSize[activeTool], shouldLockRect(activeTool, event)))
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
      startClientPointRef.current = null
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
        const size = getImageSize(image.naturalWidth || 240, image.naturalHeight || 160, placement.surface, placement.point)
        const rect = {
          x: Math.round(placement.point.x),
          y: Math.round(placement.point.y),
          width: size.width,
          height: size.height,
        }
        const latest = latestRef.current
        const layoutProps = getLayoutProps(latest.nodes, placement.parentId, rect)
        const element = createToolElement('shape-image', {
          ...layoutProps,
          imageSrc: String(reader.result || ''),
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
      {previewStyle && (
        <div className="creation-preview" style={previewStyle}>
          <div className="dimension-badge creation-dimension-badge">
            {draft.width} x {draft.height}
          </div>
        </div>
      )}
      {pointDraft && (
        <svg className="point-creation-preview">
          <polyline points={pointPreview.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#0ea5e9" strokeDasharray="6 5" strokeWidth="2" />
          {pointDraft.clientPoints.map((point, index) => (
            <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={index === 0 ? 5 : 4} fill={index === 0 ? '#0b5cad' : '#0ea5e9'} stroke="#ffffff" strokeWidth="2" />
          ))}
        </svg>
      )}
    </>
  )
}
