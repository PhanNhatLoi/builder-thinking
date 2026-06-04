import { useNode } from '@craftjs/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EditableShell } from './EditableShell'
import { TextLexicalEditor } from './TextLexicalEditor'
import { getFontCssValue } from '../../text/fontRegistry'
import { findIconAsset } from '../../assets/iconAssets'

const alignItemsMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

const justifyContentMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function resolveImagePosition(position, positionX, positionY) {
  if (Number.isFinite(positionX) && Number.isFinite(positionY)) {
    return `${positionX}% ${positionY}%`
  }
  return position || 'center'
}

function supportsImageCrop(size) {
  return size === 'cover' || size === 'auto'
}

function useImageCropDrag({ actions, enabled, positionX = 50, positionY = 50 }) {
  const [previewActive, setPreviewActive] = useState(false)
  const handleCropDrag = useCallback((event) => {
    if (!enabled || !event.shiftKey || event.button !== 0 || event.target.closest('button, input, textarea, select')) return

    event.preventDefault()
    event.stopPropagation()
    setPreviewActive(true)

    const startX = event.clientX
    const startY = event.clientY
    const rect = event.currentTarget.getBoundingClientRect()
    const startPositionX = Number.isFinite(positionX) ? positionX : 50
    const startPositionY = Number.isFinite(positionY) ? positionY : 50

    const handleMove = (moveEvent) => {
      const nextX = startPositionX - ((moveEvent.clientX - startX) / Math.max(rect.width, 1)) * 100
      const nextY = startPositionY - ((moveEvent.clientY - startY) / Math.max(rect.height, 1)) * 100
      actions.setProp((draft) => {
        if ('backgroundPositionX' in draft || 'backgroundImage' in draft) {
          draft.backgroundPositionX = clampPercent(nextX)
          draft.backgroundPositionY = clampPercent(nextY)
          draft.backgroundPosition = `${draft.backgroundPositionX}% ${draft.backgroundPositionY}%`
        } else {
          draft.imagePositionX = clampPercent(nextX)
          draft.imagePositionY = clampPercent(nextY)
          draft.imagePosition = `${draft.imagePositionX}% ${draft.imagePositionY}%`
        }
      })
    }

    const handleUp = () => {
      setPreviewActive(false)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [actions, enabled, positionX, positionY])

  return {
    cropPreviewActive: previewActive,
    handleCropDrag,
  }
}

export function Section({
  background = '#f8fafc',
  backgroundFill = 'color',
  backgroundImage = '',
  backgroundPosition = 'center',
  backgroundPositionX,
  backgroundPositionY,
  backgroundRepeat = 'no-repeat',
  backgroundSize = 'cover',
  opacity = 100,
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  gap = 16,
  gapX,
  gapY,
  radius = 0,
  layoutMode = 'free',
  alignItems = 'stretch',
  justifyContent = 'start',
  wrap = false,
  gridRows = 2,
  gridColumns = 2,
  gridFlow = 'row',
  clipContent = false,
  borderWidth = 0,
  borderColor = '#dbeafe',
  borderStyle = 'solid',
  children,
  ...shellProps
}) {
  const {
    actions,
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))
  const hasImageFill = backgroundFill === 'image' && backgroundImage.trim()
  const cropEnabled = Boolean(selected && hasImageFill && supportsImageCrop(backgroundSize))
  const {
    cropPreviewActive,
    handleCropDrag,
  } = useImageCropDrag({
    actions,
    enabled: cropEnabled,
    positionX: backgroundPositionX,
    positionY: backgroundPositionY,
  })
  const layoutStyle =
    layoutMode === 'horizontal'
      ? { display: 'flex', flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap' }
      : layoutMode === 'vertical'
        ? { display: 'flex', flexDirection: 'column' }
        : layoutMode === 'grid'
          ? {
              display: 'grid',
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridRows}, auto)`,
              gridAutoFlow: gridFlow,
              gridAutoColumns: 'minmax(0, 1fr)',
              gridAutoRows: 'auto',
            }
          : { display: 'block' }

  return (
    <EditableShell className="section-block" {...shellProps}>
      <section
        className={`layout-surface layout-${layoutMode} ${cropEnabled ? 'can-shift-crop-image' : ''} ${cropPreviewActive ? 'is-cropping-image' : ''}`}
        onMouseDown={handleCropDrag}
        style={{
          ...layoutStyle,
          position: 'relative',
          height: '100%',
          backgroundColor: backgroundFill === 'image' ? 'transparent' : background,
          backgroundImage: hasImageFill ? `url("${backgroundImage.replaceAll('"', '%22')}")` : undefined,
          backgroundPosition: resolveImagePosition(backgroundPosition, backgroundPositionX, backgroundPositionY),
          backgroundRepeat,
          backgroundSize,
          opacity: opacity / 100,
          paddingTop: paddingTop ?? padding,
          paddingRight: paddingRight ?? padding,
          paddingBottom: paddingBottom ?? padding,
          paddingLeft: paddingLeft ?? padding,
          columnGap: gapX ?? gap,
          rowGap: gapY ?? gap,
          alignItems: layoutMode === 'free' ? undefined : alignItemsMap[alignItems],
          justifyContent: layoutMode === 'free' ? undefined : justifyContentMap[justifyContent],
          overflow: cropPreviewActive ? 'visible' : clipContent ? 'hidden' : 'visible',
          borderRadius: radius,
          borderWidth,
          borderColor,
          borderStyle,
        }}
      >
        {children}
      </section>
    </EditableShell>
  )
}

Section.craft = {
  displayName: 'Section',
  props: {
    background: '#f8fafc',
    backgroundFill: 'color',
    backgroundImage: '',
    backgroundPosition: 'center',
    backgroundPositionX: 50,
    backgroundPositionY: 50,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    opacity: 100,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    gapX: 16,
    gapY: 16,
    radius: 0,
    layoutMode: 'free',
    alignItems: 'stretch',
    justifyContent: 'start',
    wrap: false,
    gridRows: 2,
    gridColumns: 2,
    gridFlow: 'row',
    clipContent: false,
    borderWidth: 0,
    borderColor: '#dbeafe',
    borderStyle: 'solid',
    layout: 'flow',
    x: 80,
    y: 420,
    width: 620,
    height: 180,
  },
}

export function TextBlock({
  richText,
  text = 'Double down on the ideas that matter.',
  fontFamily = 'Inter',
  fontSize = 24,
  fontWeight,
  weight = 500,
  lineHeight = 32,
  letterSpacing = 0,
  color = '#111827',
  align = 'left',
  verticalAlign = 'top',
  opacity = 100,
  textSizing = 'autoHeight',
  layout = 'flow',
  x = 80,
  y = 80,
  width = 240,
  height = 40,
}) {
  const {
    actions,
    id,
    selected,
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))
  const fontFamilyCssValue = getFontCssValue(fontFamily)
  const resolvedFontWeight = fontWeight ?? weight
  const verticalAlignMap = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
  }
  const justifyContentMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }
  const contentRef = useRef(null)
  const latestTextRef = useRef(text)
  const latestRichTextRef = useRef(richText)
  const pendingPropsRef = useRef({})
  const commitTimerRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const safeLineHeight = Math.max(lineHeight, Math.ceil(fontSize * 1.18))

  const queueCraftUpdate = useCallback((nextProps, delay = 250) => {
    pendingPropsRef.current = {
      ...pendingPropsRef.current,
      ...nextProps,
    }

    window.clearTimeout(commitTimerRef.current)
    commitTimerRef.current = window.setTimeout(() => {
      const propsToCommit = pendingPropsRef.current
      pendingPropsRef.current = {}

      actions.setProp((draft) => {
        Object.assign(draft, propsToCommit)
      })
    }, delay)
  }, [actions])

  const flushCraftUpdate = useCallback((nextProps = {}) => {
    window.clearTimeout(commitTimerRef.current)
    const propsToCommit = {
      ...pendingPropsRef.current,
      ...nextProps,
    }
    pendingPropsRef.current = {}

    actions.setProp((draft) => {
      Object.assign(draft, propsToCommit)
    })
  }, [actions])

  useEffect(() => {
    latestTextRef.current = text
    latestRichTextRef.current = richText
  }, [richText, text])

  useEffect(() => {
    return () => window.clearTimeout(commitTimerRef.current)
  }, [])

  useEffect(() => {
    const root = contentRef.current
    const content = root?.querySelector('.text-content')
    if (!root || !content || typeof ResizeObserver === 'undefined') return undefined

    let animationFrame = null
    const readTextBox = () => {
      const contentHeight = Math.ceil(content.scrollHeight)
      if (textSizing === 'autoHeight' && contentHeight > 0 && Math.abs(contentHeight - height) > 1) {
        queueCraftUpdate({ height: contentHeight }, editing ? 120 : 180)
      }
    }

    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(readTextBox)
    })

    observer.observe(root)
    observer.observe(content)
    animationFrame = window.requestAnimationFrame(readTextBox)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
    }
  }, [editing, height, queueCraftUpdate, textSizing])

  return (
    <EditableShell className="text-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <div
        className="text-block"
        style={{
          alignItems: verticalAlignMap[verticalAlign],
          color,
          display: 'flex',
          fontFamily: fontFamilyCssValue,
          fontSize,
          fontWeight: resolvedFontWeight,
          justifyContent: justifyContentMap[align],
          letterSpacing,
          lineHeight: `${safeLineHeight}px`,
          opacity: opacity / 100,
          textAlign: align,
        }}
      >
        <div
          ref={contentRef}
          className="text-lexical-shell"
          onFocus={() => {
            setEditing(true)
          }}
        >
          <TextLexicalEditor
            editable={selected}
            editorState={richText}
            nodeId={id}
            text={text}
            onChange={(nextValue) => {
              latestTextRef.current = nextValue.text
              latestRichTextRef.current = nextValue.editorState
              queueCraftUpdate(nextValue, 450)
            }}
            onFocus={() => {
              setEditing(true)
            }}
            onBlur={() => {
              const content = contentRef.current?.querySelector('.text-content')
              const nextHeight = textSizing === 'autoHeight' && content ? Math.ceil(content.scrollHeight) : height
              flushCraftUpdate({
                text: latestTextRef.current,
                richText: latestRichTextRef.current,
                height: nextHeight,
              })
              setEditing(false)
            }}
          />
        </div>
      </div>
    </EditableShell>
  )
}

TextBlock.craft = {
  displayName: 'Text',
  props: {
    text: 'New text',
    richText: null,
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 32,
    letterSpacing: 0,
    color: '#111827',
    align: 'left',
    verticalAlign: 'top',
    opacity: 100,
    textSizing: 'autoHeight',
    layout: 'flow',
    x: 80,
    y: 80,
    width: 240,
    height: 40,
  },
}

export function ImageBlock({
  src = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop',
  width = 690,
  height = 220,
  radius = 18,
  layout = 'flow',
  x = 80,
  y = 220,
}) {
  return (
    <EditableShell className="image-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <img className="image-block" src={src} alt="" style={{ borderRadius: radius }} />
    </EditableShell>
  )
}

ImageBlock.craft = {
  displayName: 'Image',
  props: {
    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop',
    width: 690,
    height: 220,
    radius: 18,
    layout: 'flow',
    x: 80,
    y: 220,
  },
}

export function ShapeBlock({
  shapeType = 'rectangle',
  fillType = 'color',
  fill = '#38bdf8',
  opacity = 100,
  strokeColor = '#0284c7',
  strokeWidth = 0,
  strokeStyle = 'solid',
  lineDirection = 'up',
  points = '50,4 96,96 4,96',
  imageSrc = '',
  imagePosition = 'center',
  imagePositionX,
  imagePositionY,
  imageRepeat = 'no-repeat',
  imageSize = 'cover',
  radius = 0,
  layout = 'flow',
  x = 80,
  y = 80,
  width = 180,
  height = 120,
}) {
  const {
    actions,
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))
  const isImage = shapeType === 'image'
  const isLine = shapeType === 'line'
  const usesImageMode = !isLine && (fillType === 'image' || isImage)
  const hasImageFill = !isLine && Boolean(imageSrc) && (fillType === 'image' || isImage)
  const shapeFill = usesImageMode ? 'transparent' : fill
  const strokeDasharray = strokeStyle === 'dashed' ? '8 6' : undefined
  const cropEnabled = Boolean(selected && hasImageFill && supportsImageCrop(imageSize))
  const {
    cropPreviewActive,
    handleCropDrag,
  } = useImageCropDrag({
    actions,
    enabled: cropEnabled,
    positionX: imagePositionX,
    positionY: imagePositionY,
  })
  const polygonClipPath = `polygon(${points
    .split(' ')
    .map((point) => {
      const [pointX, pointY] = point.split(',')
      return `${pointX}% ${pointY}%`
    })
    .join(', ')})`
  const imageClipStyle =
    shapeType === 'ellipse'
      ? { borderRadius: '999px' }
      : shapeType === 'polygon'
        ? { clipPath: polygonClipPath }
        : { borderRadius: radius }

  return (
    <EditableShell
      className={`shape-shell ${cropEnabled ? 'can-shift-crop-image' : ''} ${cropPreviewActive ? 'is-cropping-image' : ''}`}
      layout={layout}
      minResizeHeight={isLine ? 1 : 12}
      minResizeWidth={isLine ? 1 : 12}
      x={x}
      y={y}
      width={width}
      height={height}
    >
      {hasImageFill && (
        <div
          className="shape-image-fill"
          onMouseDown={handleCropDrag}
          style={{
            ...imageClipStyle,
            backgroundColor: 'transparent',
            backgroundImage: `url("${imageSrc.replaceAll('"', '%22')}")`,
            backgroundPosition: resolveImagePosition(imagePosition, imagePositionX, imagePositionY),
            backgroundRepeat: imageRepeat,
            backgroundSize: imageSize,
            opacity: opacity / 100,
          }}
        />
      )}
      {isLine ? (
        <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: opacity / 100 }}>
          <line
            x1="0"
            y1={lineDirection === 'down' ? '0' : '100'}
            x2="100"
            y2={lineDirection === 'down' ? '100' : '0'}
            fill="none"
            stroke={strokeColor}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            strokeWidth={Math.max(strokeWidth, 2)}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <svg className="shape-svg shape-stroke-layer" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: opacity / 100 }}>
          {shapeType === 'ellipse' && (
            <ellipse cx="50" cy="50" rx="48" ry="48" fill={shapeFill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
          )}
          {shapeType === 'triangle' && (
            <polygon points="50,3 97,97 3,97" fill={shapeFill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
          )}
          {shapeType === 'polygon' && (
            <polygon points={points} fill={shapeFill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
          )}
          {(shapeType === 'rectangle' || isImage) && (
            <rect x="1" y="1" width="98" height="98" rx={radius} ry={radius} fill={shapeFill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      )}
    </EditableShell>
  )
}

ShapeBlock.craft = {
  displayName: 'Shape',
  props: {
    shapeType: 'rectangle',
    fillType: 'color',
    fill: '#38bdf8',
    opacity: 100,
    strokeColor: '#0284c7',
    strokeWidth: 0,
    strokeStyle: 'solid',
    lineDirection: 'up',
    points: '50,4 96,96 4,96',
    imageSrc: '',
    imagePosition: 'center',
    imagePositionX: 50,
    imagePositionY: 50,
    imageRepeat: 'no-repeat',
    imageSize: 'cover',
    radius: 0,
    layout: 'flow',
    x: 80,
    y: 80,
    width: 180,
    height: 120,
  },
}

export function SvgIconBlock({
  assetId = 'home',
  paths,
  color = '#111827',
  opacity = 100,
  strokeWidth = 2,
  layout = 'flow',
  x = 80,
  y = 80,
  width = 72,
  height = 72,
}) {
  const asset = findIconAsset(assetId)
  const iconPaths = Array.isArray(paths) && paths.length ? paths : asset.paths

  return (
    <EditableShell className="svg-icon-shell" layout={layout} minResizeHeight={16} minResizeWidth={16} x={x} y={y} width={width} height={height}>
      <svg
        className="svg-icon-block"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        style={{ opacity: opacity / 100 }}
        aria-hidden="true"
      >
        {iconPaths.map((path, index) => (
          <path key={`${assetId}-${index}`} d={path} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </EditableShell>
  )
}

SvgIconBlock.craft = {
  displayName: 'Icon',
  props: {
    assetId: 'home',
    paths: findIconAsset('home').paths,
    color: '#111827',
    opacity: 100,
    strokeWidth: 2,
    layout: 'flow',
    x: 80,
    y: 80,
    width: 72,
    height: 72,
  },
}
