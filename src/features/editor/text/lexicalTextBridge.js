import { $getSelection, $isRangeSelection, $setSelection } from 'lexical'
import { $patchStyleText } from '@lexical/selection'

let activeTextEditor = null

export function setActiveTextEditor(nodeId, editor) {
  activeTextEditor = {
    nodeId,
    editor,
    selection: activeTextEditor?.nodeId === nodeId ? activeTextEditor.selection : null,
  }
}

export function cacheActiveTextSelection(nodeId, editor) {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return

  activeTextEditor = {
    nodeId,
    editor,
    selection: selection.clone(),
  }
}

export function getActiveTextEditor(nodeId) {
  if (!activeTextEditor) return null
  if (nodeId && activeTextEditor.nodeId !== nodeId) return null
  return activeTextEditor.editor
}

export function formatSelectedText(nodeId, format) {
  const active = activeTextEditor
  const editor = getActiveTextEditor(nodeId)
  if (!editor || !active) return false

  let didFormat = false
  editor.update(() => {
    const selection = resolveSelection(active)
    if (!selection) return

    selection.formatText(format)
    didFormat = true
  })

  return didFormat
}

export function patchSelectedTextStyle(nodeId, style) {
  const active = activeTextEditor
  const editor = getActiveTextEditor(nodeId)
  if (!editor || !active) return false

  let didPatch = false
  editor.update(() => {
    const selection = resolveSelection(active)
    if (!selection) return

    $patchStyleText(selection, style)
    didPatch = true
  })

  return didPatch
}

function resolveSelection(active) {
  const currentSelection = $getSelection()
  if ($isRangeSelection(currentSelection) && !currentSelection.isCollapsed()) {
    active.selection = currentSelection.clone()
    return currentSelection
  }

  if (!active.selection) return null

  const restoredSelection = active.selection.clone()
  $setSelection(restoredSelection)
  return restoredSelection
}
