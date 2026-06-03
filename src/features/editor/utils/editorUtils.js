export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function selectedIdFromSet(selected) {
  return selected && selected.size ? Array.from(selected)[0] : null
}

export function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false

  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}

export function nodeTitle(node) {
  if (!node) return 'No selection'
  return node.data.displayName || node.data.name || 'Layer'
}
