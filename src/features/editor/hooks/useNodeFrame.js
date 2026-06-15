import { useEditor, useNode } from '@craftjs/core'
import { Move } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { clamp } from '../utils/editorUtils'

function overlaps(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB)
}

function horizontalMeasurement(x, y, width, label) {
  if (width <= 0) return null
  return {
    kind: 'h',
    label,
    lineStyle: {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
    },
  }
}

function verticalMeasurement(x, y, height, label) {
  if (height <= 0) return null
  return {
    kind: 'v',
    label,
    lineStyle: {
      left: `${x}px`,
      top: `${y}px`,
      height: `${height}px`,
    },
  }
}

function getElementScale(element) {
  if (!element) return 1
  return element.offsetWidth ? element.getBoundingClientRect().width / element.offsetWidth : 1
}

function buildMeasurements(shell, id) {
  const surface = shell?.closest('.layout-surface')
  if (!shell || !surface) return []

  const shellRect = shell.getBoundingClientRect()
  const surfaceRect = surface.getBoundingClientRect()
  const scale = getElementScale(surface)
  const centerX = shellRect.left + shellRect.width / 2
  const centerY = shellRect.top + shellRect.height / 2
  const items = [
    horizontalMeasurement(surfaceRect.left, centerY, shellRect.left - surfaceRect.left, Math.round((shellRect.left - surfaceRect.left) / scale)),
    horizontalMeasurement(shellRect.right, centerY, surfaceRect.right - shellRect.right, Math.round((surfaceRect.right - shellRect.right) / scale)),
    verticalMeasurement(centerX, surfaceRect.top, shellRect.top - surfaceRect.top, Math.round((shellRect.top - surfaceRect.top) / scale)),
    verticalMeasurement(centerX, shellRect.bottom, surfaceRect.bottom - shellRect.bottom, Math.round((surfaceRect.bottom - shellRect.bottom) / scale)),
  ].filter(Boolean)

  const siblings = Array.from(surface.querySelectorAll('.node-shell')).filter((node) => {
    return node !== shell && node.dataset.nodeId !== id && node.closest('.layout-surface') === surface
  })
  let nearestHorizontal = null
  let nearestVertical = null

  siblings.forEach((node) => {
    const rect = node.getBoundingClientRect()
    if (overlaps(shellRect.top, shellRect.bottom, rect.top, rect.bottom)) {
      if (rect.right <= shellRect.left) {
        const gap = shellRect.left - rect.right
        if (!nearestHorizontal || gap < nearestHorizontal.gap) {
          nearestHorizontal = { gap, x: rect.right, y: centerY, width: gap }
        }
      }
      if (rect.left >= shellRect.right) {
        const gap = rect.left - shellRect.right
        if (!nearestHorizontal || gap < nearestHorizontal.gap) {
          nearestHorizontal = { gap, x: shellRect.right, y: centerY, width: gap }
        }
      }
    }

    if (overlaps(shellRect.left, shellRect.right, rect.left, rect.right)) {
      if (rect.bottom <= shellRect.top) {
        const gap = shellRect.top - rect.bottom
        if (!nearestVertical || gap < nearestVertical.gap) {
          nearestVertical = { gap, x: centerX, y: rect.bottom, height: gap }
        }
      }
      if (rect.top >= shellRect.bottom) {
        const gap = rect.top - shellRect.bottom
        if (!nearestVertical || gap < nearestVertical.gap) {
          nearestVertical = { gap, x: centerX, y: shellRect.bottom, height: gap }
        }
      }
    }
  })

  if (nearestHorizontal) {
    items.push(horizontalMeasurement(nearestHorizontal.x, nearestHorizontal.y - 14, nearestHorizontal.width, Math.round(nearestHorizontal.gap / scale)))
  }
  if (nearestVertical) {
    items.push(verticalMeasurement(nearestVertical.x + 14, nearestVertical.y, nearestVertical.height, Math.round(nearestVertical.gap / scale)))
  }

  return items.filter(Boolean)
}

export function useNodeFrame({ layout = 'flow', minResizeHeight = 32, minResizeWidth = 72, x = 0, y = 0, width, height }) {
  const shellRef = useRef(null)
  const [altDown, setAltDown] = useState(false)
  const [measurements, setMeasurements] = useState([])
  const {
    connectors: { connect, drag },
    actions,
    id,
    parentId,
    selected,
    hovered,
  } = useNode((node) => ({
    id: node.id,
    parentId: node.data.parent,
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  const { actions: editorActions, nodes, parentLayoutMode, selectedIds } = useEditor((state) => ({
    nodes: state.nodes,
    parentLayoutMode: parentId ? state.nodes[parentId]?.data.props.layoutMode : null,
    selectedIds: state.events.selected ? Array.from(state.events.selected) : [],
  }))

  const isFixed = parentLayoutMode ? parentLayoutMode === 'free' : layout === 'fixed'
  const shellStyle = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    left: isFixed ? `${x}px` : undefined,
    top: isFixed ? `${y}px` : undefined,
  }

  const connectNode = (ref) => {
    if (!ref) return
    shellRef.current = ref
    isFixed ? connect(ref) : connect(drag(ref))
  }

  const updateMeasurements = () => {
    setMeasurements(buildMeasurements(shellRef.current, id))
  }

  useEffect(() => {
    if (!selected) {
      setMeasurements([])
      return undefined
    }

    const keyDown = (event) => {
      if (event.altKey) {
        setAltDown(true)
        requestAnimationFrame(updateMeasurements)
      }
    }
    const keyUp = (event) => {
      if (!event.altKey) {
        setAltDown(false)
        setMeasurements([])
      }
    }

    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)

    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
    }
  }, [id, selected])

  useEffect(() => {
    if (selected && altDown) {
      updateMeasurements()
    }
  }, [altDown, height, selected, width, x, y])

  const startMove = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = event.currentTarget.closest('.layout-surface')
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    const canvasScale = getElementScale(canvas)
    const canvasWidth = canvasRect.width / canvasScale
    const canvasHeight = canvasRect.height / canvasScale
    const shell = event.currentTarget.classList.contains('node-shell') ? event.currentTarget : event.currentTarget.closest('.node-shell')
    if (!shell) return

    const startX = event.clientX
    const startY = event.clientY
    const originX = x
    const originY = y
    const nodeWidth = width || shell.offsetWidth
    const nodeHeight = height || shell.offsetHeight
    const groupIds = selectedIds.length > 1 && selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => {
          const node = nodes[selectedId]
          return selectedId !== 'ROOT' && node?.data.parent === parentId && (parentLayoutMode === 'free' || node.data.props.layout === 'fixed')
        })
      : []
    const groupOrigins = groupIds.map((selectedId) => {
      const node = nodes[selectedId]
      const dom = node.dom
      const props = node.data.props
      return {
        id: selectedId,
        x: props.x ?? dom?.offsetLeft ?? 0,
        y: props.y ?? dom?.offsetTop ?? 0,
        width: props.width ?? dom?.offsetWidth ?? 0,
        height: props.height ?? dom?.offsetHeight ?? 0,
      }
    })
    const groupBox = groupOrigins.length
      ? {
          left: Math.min(...groupOrigins.map((item) => item.x)),
          top: Math.min(...groupOrigins.map((item) => item.y)),
          right: Math.max(...groupOrigins.map((item) => item.x + item.width)),
          bottom: Math.max(...groupOrigins.map((item) => item.y + item.height)),
        }
      : null
    let lastClientX = event.clientX
    let lastClientY = event.clientY

    const move = (moveEvent) => {
      lastClientX = moveEvent.clientX
      lastClientY = moveEvent.clientY
      let deltaX = (moveEvent.clientX - startX) / canvasScale
      let deltaY = (moveEvent.clientY - startY) / canvasScale
      if (moveEvent.shiftKey) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          deltaY = 0
        } else {
          deltaX = 0
        }
      }
      const maxDeltaX = groupBox ? canvasWidth - (groupBox.right - groupBox.left) - groupBox.left : canvasWidth - nodeWidth - originX
      const maxDeltaY = groupBox ? canvasHeight - (groupBox.bottom - groupBox.top) - groupBox.top : canvasHeight - nodeHeight - originY
      const clampedDeltaX = clamp(deltaX, groupBox ? -groupBox.left : -originX, maxDeltaX)
      const clampedDeltaY = clamp(deltaY, groupBox ? -groupBox.top : -originY, maxDeltaY)
      const nextX = clamp(originX + clampedDeltaX, 0, canvasWidth - nodeWidth)
      const nextY = clamp(originY + clampedDeltaY, 0, canvasHeight - nodeHeight)

      if (groupOrigins.length > 1) {
        groupOrigins.forEach((item) => {
          editorActions.setProp(item.id, (draft) => {
            draft.x = Math.round(item.x + clampedDeltaX)
            draft.y = Math.round(item.y + clampedDeltaY)
          })
        })
      } else {
        actions.setProp((draft) => {
          draft.x = Math.round(nextX)
          draft.y = Math.round(nextY)
        }, 16)
      }

      if (moveEvent.altKey) {
        requestAnimationFrame(updateMeasurements)
      } else if (measurements.length) {
        setMeasurements([])
      }
    }

    const stop = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
      if (!altDown) setMeasurements([])

      const previousPointerEvents = shell.style.pointerEvents
      shell.style.pointerEvents = 'none'
      const target = document.elementFromPoint(lastClientX, lastClientY)
      shell.style.pointerEvents = previousPointerEvents
      const targetSurface = target?.closest?.('.layout-surface')
      const nextParentId = targetSurface?.dataset.nodeId || targetSurface?.closest?.('.node-shell')?.dataset.nodeId

      if (!targetSurface || !nextParentId || nextParentId === parentId || nextParentId === id) return

      let cursorParentId = nextParentId
      while (cursorParentId) {
        if (cursorParentId === id) return
        cursorParentId = nodes[cursorParentId]?.data.parent
      }

      const nextParent = nodes[nextParentId]
      const nextParentLayoutMode = nextParent?.data.props.layoutMode || 'vertical'
      const nextParentRect = targetSurface.getBoundingClientRect()
      const nextParentScale = getElementScale(targetSurface)
      const nextParentWidth = nextParentRect.width / nextParentScale
      const nextParentHeight = nextParentRect.height / nextParentScale
      const nextX = clamp((lastClientX - nextParentRect.left) / nextParentScale, 0, nextParentWidth - nodeWidth)
      const nextY = clamp((lastClientY - nextParentRect.top) / nextParentScale, 0, nextParentHeight - nodeHeight)

      actions.setProp((draft) => {
        draft.layout = nextParentLayoutMode === 'free' ? 'fixed' : 'flow'
        if (nextParentLayoutMode === 'free') {
          draft.x = Math.round(nextX)
          draft.y = Math.round(nextY)
        }
      })
      editorActions.move(id, nextParentId, nextParent?.data.nodes.length || 0)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)
  }

  const startResize = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const shell = event.currentTarget.parentElement
    const scale = getElementScale(shell)
    const startX = event.clientX
    const startY = event.clientY
    const originWidth = shell.offsetWidth
    const originHeight = shell.offsetHeight

    const move = (moveEvent) => {
      let nextWidth = originWidth + (moveEvent.clientX - startX) / scale
      let nextHeight = originHeight + (moveEvent.clientY - startY) / scale
      if (moveEvent.shiftKey && originHeight > 0) {
        const aspectRatio = originWidth / originHeight
        if (Math.abs(moveEvent.clientX - startX) >= Math.abs(moveEvent.clientY - startY)) {
          nextHeight = nextWidth / aspectRatio
        } else {
          nextWidth = nextHeight * aspectRatio
        }
      }

      actions.setProp((draft) => {
        draft.width = Math.round(clamp(nextWidth, minResizeWidth, 960))
        draft.height = Math.round(clamp(nextHeight, minResizeHeight, 720))
      })

      if (moveEvent.altKey) requestAnimationFrame(updateMeasurements)
    }

    const stop = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)
  }

  return {
    connectNode,
    hovered,
    id,
    isFixed,
    selected,
    shellElement: shellRef.current,
    shellStyle,
    startMove,
    startResize,
    MoveIcon: Move,
    measurements,
  }
}
