import { useNode } from '@craftjs/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EditableShell } from './EditableShell'
import { TextLexicalEditor } from './TextLexicalEditor'
import { getFontCssValue } from '../../text/fontRegistry'

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

export function Section({
  background = '#f8fafc',
  backgroundFill = 'color',
  backgroundImage = '',
  backgroundPosition = 'center',
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
  const hasImageFill = backgroundFill === 'image' && backgroundImage.trim()
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
        className={`layout-surface layout-${layoutMode}`}
        style={{
          ...layoutStyle,
          position: 'relative',
          height: '100%',
          backgroundColor: background,
          backgroundImage: hasImageFill ? `url("${backgroundImage.replaceAll('"', '%22')}")` : undefined,
          backgroundPosition,
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
          overflow: clipContent ? 'hidden' : 'visible',
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
  const [fittedFontSize, setFittedFontSize] = useState(fontSize)
  const safeLineHeight = Math.max(lineHeight, Math.ceil(fontSize * 1.18))
  const fittedLineHeight = Math.max(1, Math.round(safeLineHeight * (fittedFontSize / fontSize)))

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
    setFittedFontSize(fontSize)
  }, [fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, resolvedFontWeight, text, weight])

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
      const contentWidth = Math.ceil(content.scrollWidth)
      const boxHeight = Math.ceil(root.clientHeight)
      const boxWidth = Math.ceil(root.clientWidth)
      if (!boxHeight || !boxWidth) return

      const overflowsHeight = contentHeight > boxHeight + 1
      const overflowsWidth = contentWidth > boxWidth + 1

      if (editing) {
        setFittedFontSize(fontSize)
        if (contentHeight > height + 1) {
          queueCraftUpdate({ height: contentHeight }, 120)
        }
        return
      }

      if ((overflowsHeight || overflowsWidth) && fittedFontSize > 8) {
        const widthRatio = overflowsWidth ? boxWidth / contentWidth : 1
        const heightRatio = overflowsHeight ? boxHeight / contentHeight : 1
        const fitRatio = Math.max(0.5, Math.min(widthRatio, heightRatio))
        const nextFontSize = Math.floor(fittedFontSize * fitRatio) - 1
        setFittedFontSize((current) => Math.max(8, Math.min(current - 1, nextFontSize)))
        return
      }

      if (!overflowsHeight && !overflowsWidth && fittedFontSize < fontSize) {
        setFittedFontSize((current) => Math.min(fontSize, current + 1))
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
  }, [editing, fittedFontSize, fontSize, height, queueCraftUpdate])

  return (
    <EditableShell className="text-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <div
        className="text-block"
        style={{
          alignItems: verticalAlignMap[verticalAlign],
          color,
          display: 'flex',
          fontFamily: fontFamilyCssValue,
          fontSize: fittedFontSize,
          fontWeight: resolvedFontWeight,
          justifyContent: justifyContentMap[align],
          letterSpacing,
          lineHeight: `${fittedLineHeight}px`,
          opacity: opacity / 100,
          textAlign: align,
        }}
      >
        <div
          ref={contentRef}
          className="text-lexical-shell"
          onFocus={() => {
            setEditing(true)
            setFittedFontSize(fontSize)
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
              setFittedFontSize(fontSize)
            }}
            onBlur={() => {
              const content = contentRef.current?.querySelector('.text-content')
              const nextHeight = content ? Math.max(height, Math.ceil(content.scrollHeight)) : height
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
  fill = '#38bdf8',
  opacity = 100,
  strokeColor = '#0284c7',
  strokeWidth = 0,
  strokeStyle = 'solid',
  lineDirection = 'up',
  points = '50,4 96,96 4,96',
  imageSrc = '',
  imagePosition = 'center',
  imageRepeat = 'no-repeat',
  imageSize = 'cover',
  radius = 0,
  layout = 'flow',
  x = 80,
  y = 80,
  width = 180,
  height = 120,
}) {
  const isImage = shapeType === 'image'
  const isLine = shapeType === 'line'
  const strokeDasharray = strokeStyle === 'dashed' ? '8 6' : undefined

  return (
    <EditableShell
      className="shape-shell"
      layout={layout}
      minResizeHeight={isLine ? 1 : 12}
      minResizeWidth={isLine ? 1 : 12}
      x={x}
      y={y}
      width={width}
      height={height}
    >
      {isImage ? (
        <div
          className="shape-image"
          style={{
            backgroundColor: fill,
            backgroundImage: imageSrc ? `url("${imageSrc.replaceAll('"', '%22')}")` : undefined,
            backgroundPosition: imagePosition,
            backgroundRepeat: imageRepeat,
            backgroundSize: imageSize,
            borderColor: strokeColor,
            borderRadius: radius,
            borderStyle: strokeStyle,
            borderWidth: strokeWidth,
            opacity: opacity / 100,
          }}
        />
      ) : (
        <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: opacity / 100 }}>
          {shapeType === 'ellipse' && (
            <ellipse cx="50" cy="50" rx="48" ry="48" fill={fill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
          )}
          {shapeType === 'triangle' && (
            <polygon points="50,3 97,97 3,97" fill={fill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
          )}
          {shapeType === 'polygon' && (
            <polygon points={points} fill={fill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
          )}
          {isLine && (
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
          )}
          {shapeType === 'rectangle' && (
            <rect x="1" y="1" width="98" height="98" rx={radius} ry={radius} fill={fill} stroke={strokeColor} strokeDasharray={strokeDasharray} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
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
    fill: '#38bdf8',
    opacity: 100,
    strokeColor: '#0284c7',
    strokeWidth: 0,
    strokeStyle: 'solid',
    lineDirection: 'up',
    points: '50,4 96,96 4,96',
    imageSrc: '',
    imagePosition: 'center',
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
