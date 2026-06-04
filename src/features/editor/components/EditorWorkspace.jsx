import { Element, Frame } from '@craftjs/core'
import { useState } from 'react'
import { CanvasRoot } from './canvas/CanvasRoot'
import { CanvasCreationLayer } from './canvas/CanvasCreationLayer'
import { SelectionMarqueeLayer } from './canvas/SelectionMarqueeLayer'
import { ImageBlock, Section, TextBlock } from './canvas/elements'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { LeftSidebar } from './panels/LeftSidebar'
import { RightToolbar } from './panels/RightToolbar'
import { BottomComponentToolbar } from './toolbars/BottomComponentToolbar'
import { TopBar } from './toolbars/TopBar'

export function EditorWorkspace() {
  const [activeTool, setActiveTool] = useState('pointer')

  return (
    <div className="workspace">
      <KeyboardShortcuts />
      <LeftSidebar />
      <section className="middle">
        <TopBar />
        <div className="canvas-workspace">
          <div className="canvas-scale">
            <Frame>
              <Element is={CanvasRoot} canvas>
              </Element>
            </Frame>
            <SelectionMarqueeLayer activeTool={activeTool} />
            <CanvasCreationLayer activeTool={activeTool} onComplete={() => setActiveTool('pointer')} />
          </div>
          <BottomComponentToolbar activeTool={activeTool} onToolChange={setActiveTool} />
        </div>
      </section>
      <RightToolbar />
    </div>
  )
}
