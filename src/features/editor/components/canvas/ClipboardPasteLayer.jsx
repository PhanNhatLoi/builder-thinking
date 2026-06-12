import { useEditor } from '@craftjs/core'
import { useEffect, useRef } from 'react'
import { ShapeBlock } from './elements'
import { isEditableTarget } from '../../utils/editorUtils'

const maxPasteSize = 360
const fallbackSize = { width: 240, height: 160 }
const pasteOffset = 24

function getElementScale(element) {
  if (!element?.offsetWidth) return 1
  return element.getBoundingClientRect().width / element.offsetWidth || 1
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function readClipboardText(item) {
  return new Promise((resolve) => {
    item.getAsString((value) => resolve(value || ''))
  })
}

function svgTextToDataUrl(svgText) {
  const trimmed = svgText.trim()
  const svgStart = trimmed.indexOf('<svg')
  if (svgStart === -1) return ''

  const svg = trimmed.slice(svgStart)
  if (!svg.includes('</svg>')) return ''

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function loadImageSize(src) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth || fallbackSize.width,
        height: image.naturalHeight || fallbackSize.height,
      })
    }
    image.onerror = () => resolve(fallbackSize)
    image.src = src
  })
}

function fitSize(size, surface) {
  const surfaceRect = surface.getBoundingClientRect()
  const scale = getElementScale(surface)
  const availableWidth = Math.max(24, surfaceRect.width / scale)
  const availableHeight = Math.max(24, surfaceRect.height / scale)
  const ratio = Math.min(1, maxPasteSize / size.width, maxPasteSize / size.height, availableWidth / size.width, availableHeight / size.height)

  return {
    width: Math.max(24, Math.round(size.width * ratio)),
    height: Math.max(24, Math.round(size.height * ratio)),
  }
}

function surfaceForNode(nodeId, nodes) {
  if (nodeId === 'ROOT') return nodes.ROOT?.dom

  const node = nodes[nodeId]
  if (!node?.dom) return null
  if ((node.data.displayName || node.data.name) === 'Section') {
    return node.dom.querySelector('.layout-surface')
  }

  return null
}

function resolvePasteTarget(nodes, selectedIds) {
  const selectedId = selectedIds.find((id) => nodes[id])
  const selectedNode = selectedId ? nodes[selectedId] : null

  if (!selectedNode) {
    return {
      parentId: 'ROOT',
      surface: surfaceForNode('ROOT', nodes) || document.querySelector('.page-canvas.layout-surface'),
    }
  }

  const selectedSurface = surfaceForNode(selectedId, nodes)
  if (selectedSurface) {
    return {
      parentId: selectedId,
      surface: selectedSurface,
    }
  }

  const parentId = selectedNode.data.parent || 'ROOT'
  return {
    parentId,
    surface: surfaceForNode(parentId, nodes) || surfaceForNode('ROOT', nodes) || document.querySelector('.page-canvas.layout-surface'),
  }
}

function getLayoutProps(nodes, parentId, surface, size) {
  const parentLayoutMode = nodes[parentId]?.data.props.layoutMode || 'vertical'
  if (parentLayoutMode !== 'free') {
    return {
      layout: 'flow',
      width: size.width,
      height: size.height,
    }
  }

  const surfaceRect = surface.getBoundingClientRect()
  const scale = getElementScale(surface)
  const surfaceWidth = surfaceRect.width / scale
  const surfaceHeight = surfaceRect.height / scale

  return {
    layout: 'fixed',
    x: Math.max(0, Math.round((surfaceWidth - size.width) / 2)),
    y: Math.max(0, Math.round((surfaceHeight - size.height) / 2)),
    width: size.width,
    height: size.height,
  }
}

function createNodeIdMap(tree) {
  return Object.fromEntries(
    Object.keys(tree.nodes).map((id) => [
      id,
      `${id}-copy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    ]),
  )
}

function remapLinkedNodes(linkedNodes, idMap) {
  return Object.fromEntries(
    Object.entries(linkedNodes || {}).map(([key, value]) => [key, idMap[value] || value]),
  )
}

function cloneNodeTree(tree, nodes, parentId) {
  const idMap = createNodeIdMap(tree)
  const parentLayoutMode = nodes[parentId]?.data.props.layoutMode || 'vertical'
  const clonedNodes = Object.fromEntries(
    Object.entries(tree.nodes).map(([oldId, node]) => {
      const nextId = idMap[oldId]
      const isRoot = oldId === tree.rootNodeId
      const nextProps = { ...(node.data.props || {}) }

      if (isRoot) {
        if (parentLayoutMode === 'free' && nextProps.layout === 'fixed') {
          nextProps.x = Math.max(0, (nextProps.x || 0) + pasteOffset)
          nextProps.y = Math.max(0, (nextProps.y || 0) + pasteOffset)
        } else if (parentLayoutMode !== 'free') {
          nextProps.layout = 'flow'
        }
      }

      return [
        nextId,
        {
          ...node,
          id: nextId,
          dom: null,
          events: {
            selected: false,
            dragged: false,
            hovered: false,
          },
          data: {
            ...node.data,
            parent: isRoot ? null : idMap[node.data.parent] || node.data.parent,
            props: nextProps,
            nodes: (node.data.nodes || []).map((id) => idMap[id] || id),
            linkedNodes: remapLinkedNodes(node.data.linkedNodes, idMap),
          },
        },
      ]
    }),
  )

  return {
    rootNodeId: idMap[tree.rootNodeId],
    nodes: clonedNodes,
  }
}

function topLevelSelectedIds(nodes, selectedIds) {
  const selectedSet = new Set(selectedIds)
  const selectedTopLevelIds = selectedIds.filter((id) => {
    let parentId = nodes[id]?.data.parent

    while (parentId) {
      if (selectedSet.has(parentId)) return false
      parentId = nodes[parentId]?.data.parent
    }

    return true
  })

  return selectedTopLevelIds.sort((firstId, secondId) => {
    const firstParentId = nodes[firstId]?.data.parent
    const secondParentId = nodes[secondId]?.data.parent
    if (firstParentId !== secondParentId) return 0

    const siblings = nodes[firstParentId]?.data.nodes || []
    return siblings.indexOf(firstId) - siblings.indexOf(secondId)
  })
}

async function clipboardImageSource(clipboardData) {
  const items = Array.from(clipboardData?.items || [])
  const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'))
  const imageFile = imageItem?.getAsFile() || Array.from(clipboardData?.files || []).find((file) => file.type.startsWith('image/'))
  if (imageFile) return readFileAsDataUrl(imageFile)

  const textItem = items.find((item) => item.kind === 'string' && (item.type === 'image/svg+xml' || item.type === 'text/plain' || item.type === 'text/html'))
  if (!textItem) return ''

  const text = await readClipboardText(textItem)
  return svgTextToDataUrl(text)
}

export function ClipboardPasteLayer() {
  const { actions, query } = useEditor()
  const copiedTreesRef = useRef([])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      if ((!event.metaKey && !event.ctrlKey) || event.key.toLowerCase() !== 'c') return

      const state = query.getState()
      const selectedIds = state.events.selected ? Array.from(state.events.selected).filter((id) => id !== 'ROOT') : []
      const copiedIds = topLevelSelectedIds(state.nodes, selectedIds).filter((id) => state.nodes[id])
      if (!copiedIds.length) return

      event.preventDefault()
      copiedTreesRef.current = copiedIds.map((id) => query.node(id).toNodeTree())
    }

    const handlePaste = async (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return

      const state = query.getState()
      const nodes = state.nodes
      const selectedIds = state.events.selected ? Array.from(state.events.selected) : []
      const { parentId, surface } = resolvePasteTarget(nodes, selectedIds)
      if (!surface) return

      if (copiedTreesRef.current.length) {
        event.preventDefault()
        event.stopPropagation()

        const pastedRootIds = copiedTreesRef.current.map((copiedTree) => {
          const tree = cloneNodeTree(copiedTree, nodes, parentId)
          actions.addNodeTree(tree, parentId)
          return tree.rootNodeId
        })
        actions.selectNode(pastedRootIds)
        return
      }

      const imageSrc = await clipboardImageSource(event.clipboardData)
      if (!imageSrc) return

      event.preventDefault()
      event.stopPropagation()

      const naturalSize = await loadImageSize(imageSrc)
      const size = fitSize(naturalSize, surface)
      const layoutProps = getLayoutProps(nodes, parentId, surface, size)
      const element = (
        <ShapeBlock
          shapeType="image"
          imageSrc={imageSrc}
          imageSize="contain"
          imagePosition="center"
          imageRepeat="no-repeat"
          fill="transparent"
          strokeWidth={0}
          {...layoutProps}
        />
      )
      const tree = query.parseReactElement(element).toNodeTree()
      actions.addNodeTree(tree, parentId)
      actions.selectNode(tree.rootNodeId)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('paste', handlePaste)
    }
  }, [actions, query])

  return null
}
