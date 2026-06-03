import { useEditor } from '@craftjs/core'
import { useCallback, useEffect, useRef } from 'react'
import { clamp } from '../utils/editorUtils'

export function useFreeLayoutDropPosition() {
  const previousRootChildrenRef = useRef([])
  const lastPointerRef = useRef(null)
  const pendingNodeIdRef = useRef(null)

  const { actions, rootChildIds, rootLayoutMode, nodes } = useEditor((state) => {
    const root = state.nodes.ROOT

    return {
      rootChildIds: root?.data.nodes || [],
      rootLayoutMode: root?.data.props.layoutMode || 'vertical',
      nodes: state.nodes,
    }
  })

  const positionAddedNode = useCallback((addedNodeId, pointer) => {
    const canvas = document.querySelector('.page-canvas')

    if (rootLayoutMode !== 'free' || !addedNodeId || !pointer || !canvas) return false
    if (Date.now() - pointer.time > 1000) return false

    const node = nodes[addedNodeId]
    if (!node || node.data.parent !== 'ROOT') return false

    requestAnimationFrame(() => {
      const canvasRect = canvas.getBoundingClientRect()
      const nodeRect = node.dom?.getBoundingClientRect()
      const nodeWidth = nodeRect?.width || node.data.props.width || 120
      const nodeHeight = nodeRect?.height || node.data.props.height || 80
      const x = clamp(pointer.x - canvasRect.left, 0, canvasRect.width - nodeWidth)
      const y = clamp(pointer.y - canvasRect.top, 0, canvasRect.height - nodeHeight)

      actions.history.throttle(400).setProp(addedNodeId, (draft) => {
        draft.x = Math.round(x)
        draft.y = Math.round(y)
      })
    })

    return true
  }, [actions, nodes, rootLayoutMode])

  useEffect(() => {
    const trackDropPoint = (event) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      const canvas = target?.closest?.('.page-canvas')
      if (!canvas) return

      lastPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        time: Date.now(),
      }

      if (pendingNodeIdRef.current && positionAddedNode(pendingNodeIdRef.current, lastPointerRef.current)) {
        pendingNodeIdRef.current = null
      }
    }

    window.addEventListener('drop', trackDropPoint, true)
    window.addEventListener('dragend', trackDropPoint, true)
    window.addEventListener('pointerup', trackDropPoint, true)

    return () => {
      window.removeEventListener('drop', trackDropPoint, true)
      window.removeEventListener('dragend', trackDropPoint, true)
      window.removeEventListener('pointerup', trackDropPoint, true)
    }
  }, [positionAddedNode])

  useEffect(() => {
    const previousRootChildren = previousRootChildrenRef.current
    previousRootChildrenRef.current = rootChildIds

    if (rootLayoutMode !== 'free') return
    if (rootChildIds.length <= previousRootChildren.length) return

    const previousIds = new Set(previousRootChildren)
    const addedNodeId = rootChildIds.find((id) => !previousIds.has(id))
    const pointer = lastPointerRef.current

    if (!positionAddedNode(addedNodeId, pointer)) {
      pendingNodeIdRef.current = addedNodeId
    }
  }, [rootChildIds, rootLayoutMode, positionAddedNode])
}
