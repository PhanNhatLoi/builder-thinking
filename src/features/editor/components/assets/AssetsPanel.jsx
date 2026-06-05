import { useEditor } from '@craftjs/core'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { findIconAsset, iconAssets } from '../../assets/iconAssets'
import { SvgIconBlock } from '../canvas/elements'

const iconSize = 72

function getElementScale(element) {
  if (!element?.offsetWidth) return 1
  return element.getBoundingClientRect().width / element.offsetWidth || 1
}

function getSurfaceNodeId(surface) {
  return surface.dataset.nodeId || surface.closest?.('.node-shell')?.dataset.nodeId || 'ROOT'
}

function getDropSurface(event) {
  return (
    event.target.closest?.('.layout-surface') ||
    document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.layout-surface')
  )
}

function getDraggedAsset(event, activeAsset) {
  if (activeAsset) return activeAsset
  const assetId = event.dataTransfer?.getData('text/plain')
  return iconAssets.some((asset) => asset.id === assetId) ? findIconAsset(assetId) : null
}

function getIconLayoutProps(nodes, parentId, surface, event) {
  const parentLayoutMode = nodes[parentId]?.data.props.layoutMode || 'vertical'
  if (parentLayoutMode !== 'free') {
    return {
      layout: 'flow',
      width: iconSize,
      height: iconSize,
    }
  }

  const surfaceRect = surface.getBoundingClientRect()
  const scale = getElementScale(surface)
  const surfaceWidth = surfaceRect.width / scale
  const surfaceHeight = surfaceRect.height / scale
  const x = Math.max(0, Math.min((event.clientX - surfaceRect.left) / scale, surfaceWidth - iconSize))
  const y = Math.max(0, Math.min((event.clientY - surfaceRect.top) / scale, surfaceHeight - iconSize))

  return {
    layout: 'fixed',
    x: Math.round(x),
    y: Math.round(y),
    width: iconSize,
    height: iconSize,
  }
}

function AssetPreview({ asset }) {
  return (
    <svg className="asset-preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true">
      {asset.paths.map((path, index) => (
        <path key={`${asset.id}-${index}`} d={path} />
      ))}
    </svg>
  )
}

export function AssetsPanel() {
  const [dragPreview, setDragPreview] = useState(null)
  const activeAssetRef = useRef(null)
  const latestRef = useRef(null)
  const { actions, nodes, query } = useEditor((state) => ({
    nodes: state.nodes,
  }))

  latestRef.current = { actions, nodes, query }

  const addAssetToSurface = (asset, surface, event) => {
    const latest = latestRef.current
    const parentId = getSurfaceNodeId(surface)
    const layoutProps = getIconLayoutProps(latest.nodes, parentId, surface, event)
    const element = (
      <SvgIconBlock
        assetId={asset.id}
        paths={asset.paths}
        color="#111827"
        opacity={100}
        strokeWidth={2}
        {...layoutProps}
      />
    )
    const tree = latest.query.parseReactElement(element).toNodeTree()
    latest.actions.addNodeTree(tree, parentId)
    latest.actions.selectNode(tree.rootNodeId)
  }

  const startAssetDrag = (asset, event) => {
    if (event.button !== 0) return

    event.preventDefault()
    activeAssetRef.current = asset
    setDragPreview({ asset, x: event.clientX, y: event.clientY })
    document.documentElement.dataset.assetDragging = 'true'

    const handleMouseMove = (moveEvent) => {
      setDragPreview({ asset, x: moveEvent.clientX, y: moveEvent.clientY })
    }

    const handleMouseUp = (upEvent) => {
      const surface = getDropSurface(upEvent)
      if (surface) {
        upEvent.preventDefault()
        upEvent.stopPropagation()
        addAssetToSurface(asset, surface, upEvent)
      }

      activeAssetRef.current = null
      setDragPreview(null)
      delete document.documentElement.dataset.assetDragging
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
    }

    window.addEventListener('mousemove', handleMouseMove, true)
    window.addEventListener('mouseup', handleMouseUp, true)
  }

  useEffect(() => {
    const handleDragOver = (event) => {
      const assetId = event.dataTransfer?.getData('text/plain')
      if (!activeAssetRef.current && !assetId && document.documentElement.dataset.assetDragging !== 'true') return
      if (!getDropSurface(event)) return

      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }

    const handleDrop = (event) => {
      const asset = getDraggedAsset(event, activeAssetRef.current)
      const surface = getDropSurface(event)
      if (!asset || !surface) return

      event.preventDefault()
      event.stopPropagation()

      addAssetToSurface(asset, surface, event)
      activeAssetRef.current = null
      delete document.documentElement.dataset.assetDragging
    }

    document.addEventListener('dragover', handleDragOver, true)
    document.addEventListener('drop', handleDrop, true)

    return () => {
      document.removeEventListener('dragover', handleDragOver, true)
      document.removeEventListener('drop', handleDrop, true)
    }
  }, [])

  return (
    <section className="assets-panel">
      <div className="panel-heading compact">
        <span>Assets</span>
      </div>
      <div className="asset-grid">
        {iconAssets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className="asset-tile"
            onMouseDown={(event) => startAssetDrag(asset, event)}
            onDragStart={(event) => {
              activeAssetRef.current = asset
              document.documentElement.dataset.assetDragging = 'true'
              event.dataTransfer.effectAllowed = 'copy'
              event.dataTransfer.setData('text/plain', asset.id)
            }}
            onDragEnd={() => {
              activeAssetRef.current = null
              setDragPreview(null)
              delete document.documentElement.dataset.assetDragging
            }}
          >
            <AssetPreview asset={asset} />
            <span>{asset.label}</span>
          </button>
        ))}
      </div>
      {dragPreview &&
        createPortal(
          <div
            className="asset-drag-preview"
            style={{
              left: dragPreview.x,
              top: dragPreview.y,
            }}
          >
            <AssetPreview asset={dragPreview.asset} />
            <span>{dragPreview.asset.label}</span>
          </div>,
          document.body,
        )}
    </section>
  )
}
