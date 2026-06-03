import { Element } from '@craftjs/core'
import { Image as ImageIcon, LayoutTemplate, Rows3, Square, Type } from 'lucide-react'
import { ButtonBlock, CardBlock, ImageBlock, Section, TextBlock } from '../canvas/elements'
import { ComponentTool } from './ComponentTool'

export function BottomComponentToolbar() {
  return (
    <div className="bottom-tools" aria-label="Components toolbar">
      <ComponentTool icon={Rows3} label="Section" element={<Element is={Section} canvas />} />
      <ComponentTool icon={Type} label="Text" element={<TextBlock />} />
      <ComponentTool icon={Square} label="Button" element={<ButtonBlock />} />
      <ComponentTool icon={ImageIcon} label="Image" element={<ImageBlock />} />
      <ComponentTool icon={LayoutTemplate} label="Card" element={<CardBlock />} />
    </div>
  )
}
