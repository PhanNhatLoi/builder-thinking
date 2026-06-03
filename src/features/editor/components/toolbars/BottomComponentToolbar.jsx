import { Image as ImageIcon, LayoutTemplate, MousePointer2, Type } from 'lucide-react'
import { ComponentTool } from './ComponentTool'

const tools = [
  ['pointer', MousePointer2, 'Pointer'],
  ['section', LayoutTemplate, 'Section'],
  ['text', Type, 'Text'],
  ['image', ImageIcon, 'Image'],
]

export function BottomComponentToolbar({ activeTool, onToolChange }) {
  return (
    <div className="bottom-tools" aria-label="Components toolbar">
      {tools.map(([tool, Icon, label]) => (
        <ComponentTool key={tool} active={activeTool === tool} icon={Icon} label={label} onClick={() => onToolChange(tool)} />
      ))}
    </div>
  )
}
