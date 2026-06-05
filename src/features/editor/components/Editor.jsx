import { Editor as CraftEditor } from '@craftjs/core'
import { editorIndicator } from '../constants'
import { editorResolver } from '../resolver'
import { EditorWorkspace } from './EditorWorkspace'

export default function Editor({ presentation = 'full' }) {
  return (
    <CraftEditor resolver={editorResolver} indicator={editorIndicator}>
      <EditorWorkspace presentation={presentation} />
    </CraftEditor>
  )
}
