import { useNode } from '@craftjs/core'

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

export function CanvasRoot({
  pageSizePreset = 'a4',
  width = 860,
  height = 1040,
  background = '#ffffff',
  opacity = 100,
  padding = 44,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  gap = 18,
  gapX,
  gapY,
  layoutMode = 'free',
  alignItems = 'stretch',
  justifyContent = 'start',
  wrap = false,
  gridRows = 2,
  gridColumns = 2,
  gridFlow = 'row',
  clipContent = false,
  borderWidth = 1,
  borderColor = '#d8dee8',
  borderStyle = 'solid',
  children,
}) {
  const {
    connectors: { connect },
    selected,
  } = useNode((node) => ({ selected: node.events.selected }))

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
    <main
      ref={(ref) => ref && connect(ref)}
      className={`page-canvas layout-surface layout-${layoutMode} ${selected ? 'is-selected' : ''}`}
      data-node-id="ROOT"
      style={{
        ...layoutStyle,
        width,
        minHeight: height,
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
        borderWidth,
        borderColor,
        borderStyle,
      }}
    >
      {children}
    </main>
  )
}

CanvasRoot.craft = {
  displayName: 'Page',
  props: {
    pageSizePreset: 'a4',
    width: 860,
    height: 1040,
    background: '#ffffff',
    opacity: 100,
    paddingTop: 44,
    paddingRight: 44,
    paddingBottom: 44,
    paddingLeft: 44,
    gapX: 18,
    gapY: 18,
    layoutMode: 'free',
    alignItems: 'stretch',
    justifyContent: 'start',
    wrap: false,
    gridRows: 2,
    gridColumns: 2,
    gridFlow: 'row',
    clipContent: false,
    borderWidth: 1,
    borderColor: '#d8dee8',
    borderStyle: 'solid',
  },
  rules: {
    canDrag: () => false,
  },
}
