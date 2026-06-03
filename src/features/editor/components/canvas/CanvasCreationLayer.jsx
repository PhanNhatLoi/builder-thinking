import { Element, useEditor } from '@craftjs/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageBlock, Section, TextBlock } from './elements'

const minimumSize = {
  section: { width: 80, height: 48 },
  text: { width: 80, height: 32 },
  image: { width: 80, height: 48 },
}

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

function getRectFromPoints(start, end, minSize) {
  const width = Math.max(Math.abs(end.x - start.x), minSize.width)
  const height = Math.max(Math.abs(end.y - start.y), minSize.height)
  const x = end.x >= start.x ? start.x : start.x - width
  const y = end.y >= start.y ? start.y : start.y - height

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
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

  return null
}

export function CanvasCreationLayer({ activeTool, onComplete }) {
  const [draft, setDraft] = useState(null)
  const latestRef = useRef(null)
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
      return undefined
    }

    const handleMouseDown = (event) => {
      const surface = event.target.closest?.('.layout-surface')
      if (!surface || event.button !== 0) return

      event.preventDefault()
      event.stopPropagation()

      surfaceRef.current = surface
      parentIdRef.current = surface.dataset.nodeId || surface.closest('.node-shell')?.dataset.nodeId || 'ROOT'
      startClientPointRef.current = getClientPoint(event)
      startPointRef.current = getPoint(surface, event)
      const minSize = minimumSize[activeTool]
      setDraft(getRectFromPoints(startClientPointRef.current, startClientPointRef.current, minSize))

      window.addEventListener('mousemove', handleMouseMove, true)
      window.addEventListener('pointermove', handleMouseMove, true)
      window.addEventListener('mouseup', handleMouseUp, true)
      window.addEventListener('pointerup', handleMouseUp, true)
    }

    const handleMouseMove = (event) => {
      const startClientPoint = startClientPointRef.current
      if (!startClientPoint) return
      setDraft(getRectFromPoints(startClientPoint, getClientPoint(event), minimumSize[activeTool]))
    }

    const handleMouseUp = (event) => {
      const surface = surfaceRef.current
      const startPoint = startPointRef.current
      if (!startPoint || !surface) return

      event.preventDefault()
      event.stopPropagation()

      const rect = getRectFromPoints(startPoint, getPoint(surface, event), minimumSize[activeTool])
      const latest = latestRef.current
      const parentId = parentIdRef.current
      const parentLayoutMode = latest.nodes[parentId]?.data.props.layoutMode || 'vertical'
      const layoutProps =
        parentLayoutMode === 'free'
          ? { layout: 'fixed', x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          : { layout: 'flow', width: rect.width, height: rect.height }
      const element = createToolElement(activeTool, layoutProps)

      if (element) {
        const tree = latest.query.parseReactElement(element).toNodeTree()
        latest.actions.addNodeTree(tree, parentId)
        latest.actions.selectNode(tree.rootNodeId)
      }

      setDraft(null)
      startClientPointRef.current = null
      startPointRef.current = null
      surfaceRef.current = null
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('pointermove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
      window.removeEventListener('pointerup', handleMouseUp, true)
      latest.onComplete?.()
    }

    window.addEventListener('mousedown', handleMouseDown, true)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown, true)
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('pointermove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
      window.removeEventListener('pointerup', handleMouseUp, true)
    }
  }, [activeTool, isCreateTool])

  if (!previewStyle) return null

  return <div className="creation-preview" style={previewStyle} />
}
