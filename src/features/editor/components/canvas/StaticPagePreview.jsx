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

function parseSerialized(serialized) {
  if (!serialized) return null
  try {
    return typeof serialized === 'string' ? JSON.parse(serialized) : serialized
  } catch {
    return null
  }
}

function nodeType(node) {
  return node?.type?.resolvedName || node?.displayName || ''
}

function escapeImageUrl(value = '') {
  return String(value).replaceAll('"', '%22')
}

function layoutStyle(props = {}) {
  const layoutMode = props.layoutMode || 'free'

  if (layoutMode === 'horizontal') {
    return { display: 'flex', flexDirection: 'row', flexWrap: props.wrap ? 'wrap' : 'nowrap' }
  }

  if (layoutMode === 'vertical') {
    return { display: 'flex', flexDirection: 'column' }
  }

  if (layoutMode === 'grid') {
    return {
      display: 'grid',
      gridAutoColumns: 'minmax(0, 1fr)',
      gridAutoFlow: props.gridFlow || 'row',
      gridAutoRows: 'auto',
      gridTemplateColumns: `repeat(${props.gridColumns || 2}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${props.gridRows || 2}, auto)`,
    }
  }

  return { display: 'block' }
}

function shellStyle(props = {}) {
  const isFixed = props.layout === 'fixed'
  return {
    height: props.height ? `${props.height}px` : undefined,
    left: isFixed ? `${props.x || 0}px` : undefined,
    position: isFixed ? 'absolute' : 'relative',
    top: isFixed ? `${props.y || 0}px` : undefined,
    width: props.width ? `${props.width}px` : undefined,
  }
}

function renderChildren(nodes, node) {
  return (node?.nodes || []).map((childId) => renderNode(nodes, childId)).filter(Boolean)
}

function renderCanvasRoot(nodes, id, node) {
  const props = node.props || {}
  return (
    <main
      key={id}
      className={`page-canvas static-page-canvas layout-${props.layoutMode || 'free'}`}
      style={{
        ...layoutStyle(props),
        alignItems: props.layoutMode === 'free' ? undefined : alignItemsMap[props.alignItems || 'stretch'],
        background: props.background || '#ffffff',
        borderColor: props.borderColor || '#d8dee8',
        borderStyle: props.borderStyle || 'solid',
        borderWidth: props.borderWidth ?? 1,
        columnGap: props.gapX ?? props.gap ?? 18,
        justifyContent: props.layoutMode === 'free' ? undefined : justifyContentMap[props.justifyContent || 'start'],
        minHeight: props.height || 1040,
        opacity: (props.opacity ?? 100) / 100,
        overflow: props.clipContent ? 'hidden' : 'visible',
        paddingBottom: props.paddingBottom ?? props.padding ?? 44,
        paddingLeft: props.paddingLeft ?? props.padding ?? 44,
        paddingRight: props.paddingRight ?? props.padding ?? 44,
        paddingTop: props.paddingTop ?? props.padding ?? 44,
        position: 'relative',
        rowGap: props.gapY ?? props.gap ?? 18,
        width: props.width || 860,
      }}
    >
      {renderChildren(nodes, node)}
    </main>
  )
}

function renderSection(nodes, id, node) {
  const props = node.props || {}
  const hasImageFill = props.backgroundFill === 'image' && props.backgroundImage

  return (
    <div key={id} className="static-node-shell" style={shellStyle(props)}>
      <section
        className={`static-layout-surface layout-${props.layoutMode || 'free'}`}
        style={{
          ...layoutStyle(props),
          alignItems: props.layoutMode === 'free' ? undefined : alignItemsMap[props.alignItems || 'stretch'],
          backgroundColor: props.background || '#f8fafc',
          backgroundImage: hasImageFill ? `url("${escapeImageUrl(props.backgroundImage)}")` : undefined,
          backgroundPosition: props.backgroundPosition || 'center',
          backgroundRepeat: props.backgroundRepeat || 'no-repeat',
          backgroundSize: props.backgroundSize || 'cover',
          borderColor: props.borderColor || '#dbeafe',
          borderRadius: props.radius || 0,
          borderStyle: props.borderStyle || 'solid',
          borderWidth: props.borderWidth || 0,
          columnGap: props.gapX ?? props.gap ?? 16,
          height: '100%',
          justifyContent: props.layoutMode === 'free' ? undefined : justifyContentMap[props.justifyContent || 'start'],
          opacity: (props.opacity ?? 100) / 100,
          overflow: props.clipContent ? 'hidden' : 'visible',
          paddingBottom: props.paddingBottom ?? props.padding ?? 0,
          paddingLeft: props.paddingLeft ?? props.padding ?? 0,
          paddingRight: props.paddingRight ?? props.padding ?? 0,
          paddingTop: props.paddingTop ?? props.padding ?? 0,
          position: 'relative',
          rowGap: props.gapY ?? props.gap ?? 16,
        }}
      >
        {renderChildren(nodes, node)}
      </section>
    </div>
  )
}

function renderText(id, node) {
  const props = node.props || {}
  const fontSize = props.fontSize || 24
  const lineHeight = props.lineHeight || Math.ceil(fontSize * 1.18)

  return (
    <div key={id} className="static-node-shell" style={shellStyle(props)}>
      <div
        className="static-text-block"
        style={{
          color: props.color || '#111827',
          fontFamily: getFontCssValue(props.fontFamily || 'Inter'),
          fontSize,
          fontWeight: props.fontWeight ?? props.weight ?? 500,
          height: '100%',
          letterSpacing: props.letterSpacing || 0,
          lineHeight: `${lineHeight}px`,
          opacity: (props.opacity ?? 100) / 100,
          overflow: 'hidden',
          textAlign: props.align || 'left',
          whiteSpace: 'pre-wrap',
          width: '100%',
          wordBreak: 'break-word',
        }}
      >
        {props.text || ''}
      </div>
    </div>
  )
}

function renderImage(id, node) {
  const props = node.props || {}
  return (
    <div key={id} className="static-node-shell" style={shellStyle(props)}>
      <img className="image-block" src={props.src} alt="" style={{ borderRadius: props.radius || 0 }} />
    </div>
  )
}

function renderShape(id, node) {
  const props = node.props || {}
  const strokeDasharray = props.strokeStyle === 'dashed' ? '8 6' : undefined

  return (
    <div key={id} className="static-node-shell" style={shellStyle(props)}>
      {props.shapeType === 'image' ? (
        <div
          className="shape-image"
          style={{
            backgroundColor: props.fill || '#38bdf8',
            backgroundImage: props.imageSrc ? `url("${escapeImageUrl(props.imageSrc)}")` : undefined,
            backgroundPosition: props.imagePosition || 'center',
            backgroundRepeat: props.imageRepeat || 'no-repeat',
            backgroundSize: props.imageSize || 'cover',
            borderColor: props.strokeColor || '#0284c7',
            borderRadius: props.radius || 0,
            borderStyle: props.strokeStyle || 'solid',
            borderWidth: props.strokeWidth || 0,
            opacity: (props.opacity ?? 100) / 100,
          }}
        />
      ) : (
        <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: (props.opacity ?? 100) / 100 }}>
          {props.shapeType === 'ellipse' && <ellipse cx="50" cy="50" rx="48" ry="48" fill={props.fill || '#38bdf8'} stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeWidth={props.strokeWidth || 0} vectorEffect="non-scaling-stroke" />}
          {props.shapeType === 'polygon' && <polygon points={props.points || '50,4 96,96 4,96'} fill={props.fill || '#38bdf8'} stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeWidth={props.strokeWidth || 0} vectorEffect="non-scaling-stroke" />}
          {props.shapeType === 'line' && <line x1="0" y1={props.lineDirection === 'down' ? '0' : '100'} x2="100" y2={props.lineDirection === 'down' ? '100' : '0'} fill="none" stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeLinecap="round" strokeWidth={Math.max(props.strokeWidth || 0, 2)} vectorEffect="non-scaling-stroke" />}
          {(props.shapeType || 'rectangle') === 'rectangle' && <rect x="1" y="1" width="98" height="98" rx={props.radius || 0} ry={props.radius || 0} fill={props.fill || '#38bdf8'} stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeWidth={props.strokeWidth || 0} vectorEffect="non-scaling-stroke" />}
        </svg>
      )}
    </div>
  )
}

function renderNode(nodes, id) {
  const node = nodes?.[id]
  if (!node) return null

  const type = nodeType(node)
  if (id === 'ROOT' || type === 'CanvasRoot') return renderCanvasRoot(nodes, id, node)
  if (type === 'Section') return renderSection(nodes, id, node)
  if (type === 'TextBlock' || type === 'Text') return renderText(id, node)
  if (type === 'ImageBlock' || type === 'Image') return renderImage(id, node)
  if (type === 'ShapeBlock' || type === 'Shape') return renderShape(id, node)

  return null
}

export function StaticPagePreview({ serialized }) {
  const nodes = parseSerialized(serialized)
  if (!nodes?.ROOT) return null

  return <>{renderNode(nodes, 'ROOT')}</>
}
