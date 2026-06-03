import { useNode } from '@craftjs/core'
import { useEffect, useRef, useState } from 'react'
import { EditableShell } from './EditableShell'
import { TextLexicalEditor } from './TextLexicalEditor'

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
          background,
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
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))
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
  const [editing, setEditing] = useState(false)
  const [fittedFontSize, setFittedFontSize] = useState(fontSize)
  const fittedLineHeight = Math.max(1, Math.round(lineHeight * (fittedFontSize / fontSize)))

  const measureTextHeight = (nextText = text, nextFontSize = fontSize) => {
    const content = contentRef.current
    const shell = content?.closest('.node-shell')
    if (!content || !shell) return height

    const ratio = nextFontSize / fontSize
    const clone = document.createElement('div')
    clone.textContent = nextText || ' '
    clone.style.position = 'fixed'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    clone.style.width = `${shell.offsetWidth}px`
    clone.style.visibility = 'hidden'
    clone.style.whiteSpace = 'pre-wrap'
    clone.style.overflowWrap = 'anywhere'
    clone.style.fontFamily = fontFamily
    clone.style.fontSize = `${nextFontSize}px`
    clone.style.fontWeight = String(resolvedFontWeight)
    clone.style.letterSpacing = `${letterSpacing}px`
    clone.style.lineHeight = `${Math.max(1, Math.round(lineHeight * ratio))}px`
    document.body.appendChild(clone)
    const measuredHeight = Math.ceil(clone.scrollHeight)
    clone.remove()

    return measuredHeight
  }

  useEffect(() => {
    if (editing) return

    const contentHeight = measureTextHeight(text, fontSize)
    if (contentHeight <= height) {
      setFittedFontSize(fontSize)
      return
    }

    let nextFontSize = fontSize
    while (nextFontSize > 8 && measureTextHeight(text, nextFontSize) > height) {
      nextFontSize -= 1
    }
    setFittedFontSize(nextFontSize)
  }, [align, color, editing, fontFamily, fontSize, fontWeight, height, letterSpacing, lineHeight, resolvedFontWeight, text, weight, width])

  return (
    <EditableShell className="text-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <div
        className="text-block"
        style={{
          alignItems: verticalAlignMap[verticalAlign],
          color,
          display: 'flex',
          fontFamily,
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
            text={text}
            onChange={(nextValue) => {
              latestTextRef.current = nextValue.text
              latestRichTextRef.current = nextValue.editorState
              const nextHeight = Math.max(height, measureTextHeight(nextValue.text, fontSize))
              const shell = contentRef.current?.closest('.node-shell')
              if (shell) shell.style.height = `${nextHeight}px`
            }}
            onBlur={() => {
              const nextText = latestTextRef.current
              const nextHeight = Math.max(height, measureTextHeight(nextText, fontSize))
              actions.setProp((draft) => {
                draft.text = nextText
                draft.richText = latestRichTextRef.current
                draft.height = Math.round(nextHeight)
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
