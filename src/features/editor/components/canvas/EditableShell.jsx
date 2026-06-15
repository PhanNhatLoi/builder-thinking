import { createPortal } from 'react-dom'
import { useNodeFrame } from '../../hooks/useNodeFrame'

export function EditableShell({ children, className = '', layout = 'flow', minResizeHeight, minResizeWidth, x = 0, y = 0, width, height }) {
  const { connectNode, hovered, id, isFixed, measurements, MoveIcon, selected, shellElement, shellStyle, startMove, startResize } = useNodeFrame({
    layout,
    minResizeHeight,
    minResizeWidth,
    x,
    y,
    width,
    height,
  })
  const hasDimensions = Number.isFinite(width) && Number.isFinite(height)
  const focusSurface = selected ? shellElement?.parentElement?.closest('.layout-surface') : null
  const focusFrameStyle =
    selected && shellElement
      ? {
          left: `${shellElement.offsetLeft - 3}px`,
          top: `${shellElement.offsetTop - 3}px`,
          width: `${shellElement.offsetWidth + 6}px`,
          height: `${shellElement.offsetHeight + 6}px`,
        }
      : null

  return (
    <div
      ref={connectNode}
      className={`${className} node-shell ${isFixed ? 'is-fixed' : ''} ${selected ? 'is-selected' : ''} ${hovered ? 'is-hovered' : ''}`}
      data-node-id={id}
      style={shellStyle}
      onMouseDown={(event) => {
        if (!selected || !isFixed || event.target.closest('button, input, textarea, select') || event.target.isContentEditable) return
        startMove(event)
      }}
    >
      {selected && isFixed && (
        <button className="node-move-handle" type="button" aria-label="Move fixed item" onMouseDown={startMove}>
          <MoveIcon size={13} />
        </button>
      )}
      {children}
      {selected && <button className="node-resize-handle" type="button" aria-label="Resize item" onMouseDownCapture={startResize} />}
      {selected && hasDimensions && (
        <div className="dimension-badge node-dimension-badge">
          {Math.round(width)} x {Math.round(height)}
        </div>
      )}
      {selected &&
        measurements.map((measurement, index) => (
          createPortal(
            <div className={`measurement-line ${measurement.kind}`} style={measurement.lineStyle}>
              <span>{measurement.label}</span>
            </div>,
            document.body,
            `${measurement.kind}-${index}`,
          )
        ))}
      {focusSurface && focusFrameStyle &&
        createPortal(<div className="node-focus-frame" style={focusFrameStyle} />, focusSurface)}
    </div>
  )
}
