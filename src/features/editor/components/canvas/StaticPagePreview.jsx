import { findIconAsset } from '../../assets/iconAssets'
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

function resolveImagePosition(position, positionX, positionY) {
  if (Number.isFinite(positionX) && Number.isFinite(positionY)) {
    return `${positionX}% ${positionY}%`
  }
  return position || 'center'
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
      data-page-height={props.height || 1040}
      data-page-width={props.width || 860}
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
          backgroundColor: props.backgroundFill === 'image' ? 'transparent' : props.background || '#f8fafc',
          backgroundImage: hasImageFill ? `url("${escapeImageUrl(props.backgroundImage)}")` : undefined,
          backgroundPosition: resolveImagePosition(props.backgroundPosition, props.backgroundPositionX, props.backgroundPositionY),
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
  const shapeType = props.shapeType || 'rectangle'
  const isLine = shapeType === 'line'
  const usesImageMode = !isLine && (props.fillType === 'image' || shapeType === 'image')
  const hasImageFill = usesImageMode && props.imageSrc
  const shapeFill = usesImageMode ? 'transparent' : props.fill || '#38bdf8'
  const polygonClipPath = `polygon(${(props.points || '50,4 96,96 4,96')
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
        : { borderRadius: props.radius || 0 }

  return (
    <div key={id} className="static-node-shell" style={shellStyle(props)}>
      {hasImageFill && (
        <div
          className="shape-image-fill"
          style={{
            ...imageClipStyle,
            backgroundColor: 'transparent',
            backgroundImage: `url("${escapeImageUrl(props.imageSrc)}")`,
            backgroundPosition: resolveImagePosition(props.imagePosition, props.imagePositionX, props.imagePositionY),
            backgroundRepeat: props.imageRepeat || 'no-repeat',
            backgroundSize: props.imageSize || 'cover',
            opacity: (props.opacity ?? 100) / 100,
          }}
        />
      )}
      <svg className={`shape-svg ${hasImageFill ? 'shape-stroke-layer' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: (props.opacity ?? 100) / 100 }}>
        {shapeType === 'ellipse' && <ellipse cx="50" cy="50" rx="48" ry="48" fill={shapeFill} stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeWidth={props.strokeWidth || 0} vectorEffect="non-scaling-stroke" />}
        {shapeType === 'polygon' && <polygon points={props.points || '50,4 96,96 4,96'} fill={shapeFill} stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeWidth={props.strokeWidth || 0} vectorEffect="non-scaling-stroke" />}
        {shapeType === 'line' && <line x1="0" y1={props.lineDirection === 'down' ? '0' : '100'} x2="100" y2={props.lineDirection === 'down' ? '100' : '0'} fill="none" stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeLinecap="round" strokeWidth={Math.max(props.strokeWidth || 0, 2)} vectorEffect="non-scaling-stroke" />}
        {(shapeType === 'rectangle' || shapeType === 'image') && <rect x="1" y="1" width="98" height="98" rx={props.radius || 0} ry={props.radius || 0} fill={shapeFill} stroke={props.strokeColor || '#0284c7'} strokeDasharray={strokeDasharray} strokeWidth={props.strokeWidth || 0} vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  )
}

function renderIcon(id, node) {
  const props = node.props || {}
  const asset = findIconAsset(props.assetId || 'home')
  const paths = Array.isArray(props.paths) && props.paths.length ? props.paths : asset.paths

  return (
    <div key={id} className="static-node-shell" style={shellStyle(props)}>
      <svg
        className="svg-icon-block"
        viewBox="0 0 24 24"
        fill="none"
        stroke={props.color || '#111827'}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={props.strokeWidth || 2}
        style={{ opacity: (props.opacity ?? 100) / 100 }}
        aria-hidden="true"
      >
        {paths.map((path, index) => (
          <path key={`${props.assetId || 'icon'}-${index}`} d={path} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
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
  if (type === 'SvgIconBlock' || type === 'Icon') return renderIcon(id, node)

  return null
}

export function StaticPagePreview({ serialized }) {
  const nodes = parseSerialized(serialized)
  if (!nodes?.ROOT) return null

  return <>{renderNode(nodes, 'ROOT')}</>
}
