import { useEditor } from '@craftjs/core'
import { useEffect, useRef } from 'react'
import { ShapeBlock } from './elements'
import { isEditableTarget } from '../../utils/editorUtils'

const maxPasteSize = 360
const fallbackSize = { width: 240, height: 160 }

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
  const latestRef = useRef(null)
  const { actions, nodes, query, selectedIds } = useEditor((state) => ({
    nodes: state.nodes,
    selectedIds: state.events.selected ? Array.from(state.events.selected) : [],
  }))

  latestRef.current = { actions, nodes, query, selectedIds }

  useEffect(() => {
    const handlePaste = async (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return

      const imageSrc = await clipboardImageSource(event.clipboardData)
      if (!imageSrc) return

      event.preventDefault()
      event.stopPropagation()

      const latest = latestRef.current
      const { parentId, surface } = resolvePasteTarget(latest.nodes, latest.selectedIds)
      if (!surface) return

      const naturalSize = await loadImageSize(imageSrc)
      const size = fitSize(naturalSize, surface)
      const layoutProps = getLayoutProps(latest.nodes, parentId, surface, size)
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
      const tree = latest.query.parseReactElement(element).toNodeTree()
      latest.actions.addNodeTree(tree, parentId)
      latest.actions.selectNode(tree.rootNodeId)
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  return null
}
