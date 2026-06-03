import { useEditor, useNode } from '@craftjs/core'
import { Move } from 'lucide-react'
import { clamp } from '../utils/editorUtils'

export function useNodeFrame({ layout = 'flow', x = 0, y = 0, width, height }) {
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

  const { actions: editorActions, nodes, parentLayoutMode } = useEditor((state) => ({
    nodes: state.nodes,
    parentLayoutMode: parentId ? state.nodes[parentId]?.data.props.layoutMode : null,
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
    isFixed ? connect(ref) : connect(drag(ref))
  }

  const startMove = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const canvas = event.currentTarget.closest('.layout-surface')
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    const shell = event.currentTarget.classList.contains('node-shell') ? event.currentTarget : event.currentTarget.closest('.node-shell')
    if (!shell) return

    const startX = event.clientX
    const startY = event.clientY
    const originX = x
    const originY = y
    const nodeWidth = width || shell.offsetWidth
    const nodeHeight = height || shell.offsetHeight
    let lastClientX = event.clientX
    let lastClientY = event.clientY

    const move = (moveEvent) => {
      lastClientX = moveEvent.clientX
      lastClientY = moveEvent.clientY
      const nextX = clamp(originX + moveEvent.clientX - startX, 0, canvasRect.width - nodeWidth)
      const nextY = clamp(originY + moveEvent.clientY - startY, 0, canvasRect.height - nodeHeight)

      actions.setProp((draft) => {
        draft.x = Math.round(nextX)
        draft.y = Math.round(nextY)
      }, 16)
    }

    const stop = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)

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
      const nextX = clamp(lastClientX - nextParentRect.left, 0, nextParentRect.width - nodeWidth)
      const nextY = clamp(lastClientY - nextParentRect.top, 0, nextParentRect.height - nodeHeight)

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
    const startX = event.clientX
    const startY = event.clientY
    const originWidth = shell.offsetWidth
    const originHeight = shell.offsetHeight

    const move = (moveEvent) => {
      actions.setProp((draft) => {
        draft.width = Math.round(clamp(originWidth + moveEvent.clientX - startX, 72, 960))
        draft.height = Math.round(clamp(originHeight + moveEvent.clientY - startY, 32, 720))
      })
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
    shellStyle,
    startMove,
    startResize,
    MoveIcon: Move,
  }
}
