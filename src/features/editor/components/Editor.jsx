import { Editor as CraftEditor } from '@craftjs/core'
import { editorIndicator } from '../constants'
import { editorResolver } from '../resolver'
import { EditorWorkspace } from './EditorWorkspace'

export default function Editor({
  autosaveError = '',
  autosaveStatus = 'idle',
  initialProject = null,
  isTemplate = false,
  onBack,
  onProjectChange,
  onProjectNameSave,
  onProjectSave,
  onTemplateChange,
  presentation = 'full',
  projectName = '',
  templateStatus = 'idle',
}) {
  return (
    <CraftEditor resolver={editorResolver} indicator={editorIndicator}>
      <EditorWorkspace
        autosaveError={autosaveError}
        autosaveStatus={autosaveStatus}
        initialProject={initialProject}
        isTemplate={isTemplate}
        onBack={onBack}
        onProjectChange={onProjectChange}
        onProjectNameSave={onProjectNameSave}
        onProjectSave={onProjectSave}
        onTemplateChange={onTemplateChange}
        presentation={presentation}
        projectName={projectName}
        templateStatus={templateStatus}
      />
    </CraftEditor>
  )
}
