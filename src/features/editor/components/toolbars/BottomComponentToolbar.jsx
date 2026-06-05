import { Circle, Image as ImageIcon, LayoutTemplate, MousePointer2, Pentagon, Slash, Square, Type } from 'lucide-react'
import { ComponentTool } from './ComponentTool'

const tools = [
  ['pointer', MousePointer2, 'Pointer'],
  ['section', LayoutTemplate, 'Section'],
  ['text', Type, 'Text'],
  ['shape-rectangle', Square, 'Rectangle'],
  ['shape-ellipse', Circle, 'Ellipse'],
  ['shape-line', Slash, 'Line'],
  ['shape-polygon', Pentagon, 'Polygon'],
  ['shape-image', ImageIcon, 'Image shape'],
]

const imageToolEventName = 'builder-thinking:open-image-tool'

export function BottomComponentToolbar({ activeTool, onToolChange }) {
  return (
    <div className="bottom-tools" aria-label="Components toolbar">
      {tools.map(([tool, Icon, label]) => (
        <ComponentTool
          key={tool}
          active={activeTool === tool}
          icon={Icon}
          label={label}
          onClick={() => {
            onToolChange(tool)
            if (tool === 'shape-image') {
              window.dispatchEvent(new Event(imageToolEventName))
            }
          }}
        />
      ))}
    </div>
  )
}
