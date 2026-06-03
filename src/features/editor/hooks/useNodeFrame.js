import { useEditor, useNode } from '@craftjs/core'
import { Move } from 'lucide-react'
import { clamp } from '../utils/editorUtils'

export function useNodeFrame({ layout = 'flow', x = 0, y = 0, width, height }) {
  const {
    connectors: { connect, drag },
    actions,
    parentId,
    selected,
    hovered,
  } = useNode((node) => ({
    parentId: node.data.parent,
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  const { parentLayoutMode } = useEditor((state) => ({
    parentLayoutMode: parentId ? state.nodes[parentId]?.data.props.layoutMode : null,
  }))

  const isFixed = layout === 'fixed' || parentLayoutMode === 'free'
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

    const canvas = event.currentTarget.closest('.page-canvas')
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

    const move = (moveEvent) => {
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
    isFixed,
    selected,
    shellStyle,
    startMove,
    startResize,
    MoveIcon: Move,
  }
}
