import { useNodeFrame } from '../../hooks/useNodeFrame'

export function EditableShell({ children, className = '', layout = 'flow', x = 0, y = 0, width, height }) {
  const { connectNode, hovered, isFixed, MoveIcon, selected, shellStyle, startMove, startResize } = useNodeFrame({
    layout,
    x,
    y,
    width,
    height,
  })

  return (
    <div
      ref={connectNode}
      className={`${className} node-shell ${isFixed ? 'is-fixed' : ''} ${selected ? 'is-selected' : ''} ${hovered ? 'is-hovered' : ''}`}
      style={shellStyle}
    >
      {selected && isFixed && (
        <button className="node-move-handle" type="button" aria-label="Move fixed item" onMouseDown={startMove}>
          <MoveIcon size={13} />
        </button>
      )}
      {children}
      {selected && <button className="node-resize-handle" type="button" aria-label="Resize item" onMouseDownCapture={startResize} />}
    </div>
  )
}
