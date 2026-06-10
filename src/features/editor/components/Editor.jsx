import { Editor as CraftEditor } from '@craftjs/core'
import { editorIndicator } from '../constants'
import { editorResolver } from '../resolver'
import { EditorWorkspace } from './EditorWorkspace'

export default function Editor({
  autosaveError = '',
  autosaveStatus = 'idle',
  initialProject = null,
  onBack,
  onProjectChange,
  onProjectNameSave,
  onProjectSave,
  presentation = 'full',
  projectName = '',
}) {
  return (
    <CraftEditor resolver={editorResolver} indicator={editorIndicator}>
      <EditorWorkspace
        autosaveError={autosaveError}
        autosaveStatus={autosaveStatus}
        initialProject={initialProject}
        onBack={onBack}
        onProjectChange={onProjectChange}
        onProjectNameSave={onProjectNameSave}
        onProjectSave={onProjectSave}
        presentation={presentation}
        projectName={projectName}
      />
    </CraftEditor>
  )
}
