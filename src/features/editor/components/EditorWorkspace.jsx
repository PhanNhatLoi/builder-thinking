import { Element, Frame } from '@craftjs/core'
import { CanvasRoot } from './canvas/CanvasRoot'
import { ButtonBlock, CardBlock, ImageBlock, Section, TextBlock } from './canvas/elements'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { LeftSidebar } from './panels/LeftSidebar'
import { RightToolbar } from './panels/RightToolbar'
import { BottomComponentToolbar } from './toolbars/BottomComponentToolbar'
import { TopBar } from './toolbars/TopBar'

export function EditorWorkspace() {
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
                <TextBlock text="Build a page by dragging blocks" fontSize={42} />
                <TextBlock
                  text="Select any item to edit typography, colors, spacing, and order from the right side panel."
                  fontSize={18}
                  weight={500}
                  color="#475569"
                />
                <ImageBlock height={210} />
                <Element is={Section} canvas background="#eefbf8" padding={24} radius={20} height={230}>
                  <CardBlock />
                </Element>
                <ButtonBlock />
              </Element>
            </Frame>
          </div>
          <BottomComponentToolbar />
        </div>
      </section>
      <RightToolbar />
    </div>
  )
}
