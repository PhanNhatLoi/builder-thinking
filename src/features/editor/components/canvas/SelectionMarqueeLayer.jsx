import { useEditor } from '@craftjs/core'
import { useEffect, useMemo, useRef, useState } from 'react'

function getClientPoint(event) {
  return {
    x: event.clientX,
    y: event.clientY,
  }
}

function getRect(start, end) {
  const left = Math.min(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const right = Math.max(start.x, end.x)
  const bottom = Math.max(start.y, end.y)

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  }
}

function intersects(first, second) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
}

function selectNodes(actions, selectedIds) {
  actions.setState((state) => {
    const selectedSet = new Set(selectedIds)
    state.events.selected = selectedSet
    Object.keys(state.nodes).forEach((nodeId) => {
      state.nodes[nodeId].events.selected = selectedSet.has(nodeId)
    })
  })
}

function getSurfaceNodeId(surface) {
  return surface.dataset.nodeId || surface.closest?.('.node-shell')?.dataset.nodeId
}

export function SelectionMarqueeLayer({ activeTool }) {
  const [draft, setDraft] = useState(null)
  const latestRef = useRef(null)
  const draggingRef = useRef(false)
  const suppressMouseEventsUntilRef = useRef(0)
  const surfaceRef = useRef(null)
  const startRef = useRef(null)
  const { actions } = useEditor()

  latestRef.current = { actions }

  const marqueeStyle = useMemo(() => {
    if (!draft) return null

    return {
      left: draft.left,
      top: draft.top,
      width: draft.width,
      height: draft.height,
    }
  }, [draft])

  useEffect(() => {
    if (activeTool !== 'pointer') {
      setDraft(null)
      return undefined
    }

    const startSelection = (event) => {
      if (draggingRef.current || Date.now() < suppressMouseEventsUntilRef.current) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (event.button !== 0 || event.target.closest?.('.node-shell')) return

      const surface = event.target.closest?.('.layout-surface')
      if (!surface) return

      event.preventDefault()
      event.stopPropagation()

      surfaceRef.current = surface
      startRef.current = getClientPoint(event)
      draggingRef.current = true
      setDraft(getRect(startRef.current, startRef.current))

      window.addEventListener('mousemove', handleMouseMove, true)
      window.addEventListener('pointermove', handleMouseMove, true)
      window.addEventListener('mouseup', handleMouseUp, true)
      window.addEventListener('pointerup', handleMouseUp, true)
    }

    const handleMouseMove = (event) => {
      if (!startRef.current) return
      setDraft(getRect(startRef.current, getClientPoint(event)))
    }

    const handleMouseUp = (event) => {
      const surface = surfaceRef.current
      const start = startRef.current
      if (!surface || !start) return

      event.preventDefault()
      event.stopPropagation()

      const rect = getRect(start, getClientPoint(event))
      const surfaceNodeId = getSurfaceNodeId(surface)
      const selectedIds =
        rect.width < 3 && rect.height < 3
          ? [surfaceNodeId].filter(Boolean)
          : Array.from(surface.querySelectorAll('.node-shell'))
              .filter((node) => node.closest('.layout-surface') === surface)
              .filter((node) => intersects(rect, node.getBoundingClientRect()))
              .map((node) => node.dataset.nodeId)
              .filter(Boolean)

      selectNodes(latestRef.current.actions, selectedIds)
      setDraft(null)
      draggingRef.current = false
      suppressMouseEventsUntilRef.current = Date.now() + 80
      startRef.current = null
      surfaceRef.current = null
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('pointermove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
      window.removeEventListener('pointerup', handleMouseUp, true)
    }

    const stopSuppressedMouseEvent = (event) => {
      if (Date.now() >= suppressMouseEventsUntilRef.current) return
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('mousedown', startSelection, true)
    window.addEventListener('pointerdown', startSelection, true)
    window.addEventListener('mouseup', stopSuppressedMouseEvent, true)
    window.addEventListener('click', stopSuppressedMouseEvent, true)

    return () => {
      window.removeEventListener('mousedown', startSelection, true)
      window.removeEventListener('pointerdown', startSelection, true)
      window.removeEventListener('mouseup', stopSuppressedMouseEvent, true)
      window.removeEventListener('click', stopSuppressedMouseEvent, true)
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('pointermove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
      window.removeEventListener('pointerup', handleMouseUp, true)
      draggingRef.current = false
    }
  }, [activeTool])

  if (!marqueeStyle) return null

  return <div className="selection-marquee" style={marqueeStyle} />
}
