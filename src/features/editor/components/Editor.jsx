import { Editor as CraftEditor } from '@craftjs/core'
import { editorIndicator } from '../constants'
import { editorResolver } from '../resolver'
import { EditorWorkspace } from './EditorWorkspace'

export default function Editor() {
  return (
    <CraftEditor resolver={editorResolver} indicator={editorIndicator}>
      <EditorWorkspace />
    </CraftEditor>
  )
}
